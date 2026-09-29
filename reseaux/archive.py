#!/opt/homebrew/bin/python3
"""Archive un post pour les autres plateformes (docs/passation-reseaux.md §5).

Appelé par `preparer.py` dès qu'un post est programmé, et par `deposer.py` après sa
publication (pour y inscrire les liens). Rejouable : les médias sont remplacés (`--clobber`),
et l'empreinte de `post.json` suit. Valable pour tous les types de post (`posts.py`).
"""
import hashlib
import json
import shutil
import subprocess
import tempfile
from pathlib import Path

import posts

ICI = Path(__file__).resolve().parent
DEPOT = ICI.parent
PUBLIE = ICI / 'publie'
DEPOT_GITHUB = 'tijacksh/Anagnosis'


def nom_asset(p, media):
    """Le nom du média dans la release. Un Reel garde son nom historique `<jour>-<fiche>.mp4`."""
    if posts.type_de(p) == 'reel':
        return f"{p['jour']}-{p['slug']}.mp4"
    return f"{p['jour']}-{p['slug']}-{media.name}"


def archiver(p, dossier):
    """Garde ce qui est prévu ou parti, pour que les autres plateformes publient exactement pareil.

    Dans git (léger) : les légendes, la fiche du post, l'empreinte de chaque média, dans
    `reseaux/publie/<jour>-<fiche>/`. Les médias eux-mêmes n'entrent **pas** dans l'historique
    (200 Reels par an feraient près d'un gigaoctet à cloner par chaque machine et chaque build
    Netlify) : ils sont joints à la release GitHub de la semaine (`reels-AAAA-SS`) :
    `gh release download reels-2026-41 -p '<jour>-<fiche>*'`.
    """
    semaine = p['dossier'].split('/')[0].removeprefix('semaine-')
    tag = f'reels-{semaine}'
    if subprocess.run(['gh', 'release', 'view', tag, '-R', DEPOT_GITHUB], capture_output=True).returncode:
        subprocess.run(['gh', 'release', 'create', tag, '-R', DEPOT_GITHUB, '--target', 'main',
                        '--title', f'Reels {semaine}',
                        '--notes', 'Médias publiés cette semaine (vidéos, carrousels, images). Voir docs/passation-reseaux.md.'],
                       check=True, capture_output=True)
    sortie = []
    with tempfile.TemporaryDirectory() as tmp:
        for media in posts.medias(p, dossier):
            nom = nom_asset(p, media)
            copie = Path(tmp) / nom
            shutil.copy2(media, copie)
            subprocess.run(['gh', 'release', 'upload', tag, str(copie), '--clobber', '-R', DEPOT_GITHUB],
                           check=True, capture_output=True)
            sortie.append({'release': tag, 'fichier': nom, 'octets': media.stat().st_size,
                           'sha256': hashlib.sha256(media.read_bytes()).hexdigest()})
    cible = PUBLIE / f"{p['jour']}-{p['slug']}"
    cible.mkdir(parents=True, exist_ok=True)
    for f in posts.legendes(p, dossier):
        shutil.copy2(f, cible / f.name)
    donnees = {'jour': p['jour'], 'slug': p['slug'], 'type': posts.type_de(p), 'discipline': p.get('discipline'),
               'medias': sortie, 'instagram': (p.get('instagram') or {}).get('lien')}
    if p.get('fichier'):
        fiche = json.loads((DEPOT / p['fichier']).read_text())
        donnees.update({'titre': fiche.get('titre'), 'carte': fiche.get('carte'), 'fiche': p['fichier']})
    else:
        donnees['titre'] = p.get('titre')
    if posts.type_de(p) == 'reel':
        donnees['video'] = sortie[0]          # compatibilité avec la première version de post.json
    (cible / 'post.json').write_text(json.dumps(donnees, ensure_ascii=False, indent=2) + '\n')
    return {'release': tag, 'fichier': sortie[0]['fichier'], 'medias': [m['fichier'] for m in sortie]}


def lier(p):
    """Inscrit dans `post.json` les liens des posts partis (TikTok : brouillon ; Instagram : lien ; X)."""
    fichier = PUBLIE / f"{p['jour']}-{p['slug']}" / 'post.json'
    donnees = json.loads(fichier.read_text())
    donnees['instagram'] = (p.get('instagram') or {}).get('lien')
    donnees['tiktok'] = (p.get('tiktok') or {}).get('id')
    if p.get('x'):
        donnees['x'] = p['x'].get('lien') or p['x'].get('programme_pour')
    fichier.write_text(json.dumps(donnees, ensure_ascii=False, indent=2) + '\n')
