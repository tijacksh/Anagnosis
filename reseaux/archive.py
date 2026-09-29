#!/opt/homebrew/bin/python3
"""Archive un post pour les autres plateformes (docs/passation-reseaux.md §5).

Appelé par `preparer.py` dès qu'un post est programmé, et par `deposer.py` après sa
publication (pour y inscrire les liens). Rejouable : la vidéo est remplacée (`--clobber`), et
l'empreinte de `post.json` suit.
"""
import hashlib
import json
import shutil
import subprocess
import tempfile
from pathlib import Path

ICI = Path(__file__).resolve().parent
DEPOT = ICI.parent
PUBLIE = ICI / 'publie'
DEPOT_GITHUB = 'tijacksh/Anagnosis'


def archiver(p, dossier):
    """Garde ce qui est prévu ou parti, pour que les autres plateformes publient exactement pareil.

    Dans git (léger) : la légende de chaque plateforme, la fiche du post, l'empreinte de la
    vidéo, dans `reseaux/publie/<jour>-<fiche>/`. La vidéo elle-même (environ 5 Mo) n'entre
    **pas** dans l'historique : 200 Reels par an feraient près d'un gigaoctet à cloner par
    chaque machine et chaque build Netlify. Elle est jointe à la release GitHub de la semaine
    (`reels-AAAA-SS`) : `gh release download reels-2026-41 -p '<jour>-<fiche>.mp4'`.
    """
    semaine = p['dossier'].split('/')[0].removeprefix('semaine-')
    tag = f'reels-{semaine}'
    nom = f"{p['jour']}-{p['slug']}.mp4"
    reel = dossier / 'reel.mp4'
    if subprocess.run(['gh', 'release', 'view', tag, '-R', DEPOT_GITHUB], capture_output=True).returncode:
        subprocess.run(['gh', 'release', 'create', tag, '-R', DEPOT_GITHUB, '--target', 'main',
                        '--title', f'Reels {semaine}',
                        '--notes', 'Vidéos publiées cette semaine, une par jour. Voir docs/passation-reseaux.md.'],
                       check=True, capture_output=True)
    with tempfile.TemporaryDirectory() as tmp:
        copie = Path(tmp) / nom
        shutil.copy2(reel, copie)
        subprocess.run(['gh', 'release', 'upload', tag, str(copie), '--clobber', '-R', DEPOT_GITHUB],
                       check=True, capture_output=True)
    cible = PUBLIE / f"{p['jour']}-{p['slug']}"
    cible.mkdir(parents=True, exist_ok=True)
    for f in ('legende-tiktok.txt', 'legende-instagram.txt', 'legende-x.txt'):
        shutil.copy2(dossier / f, cible / f)
    fiche = json.loads((DEPOT / p['fichier']).read_text())
    (cible / 'post.json').write_text(json.dumps({
        'jour': p['jour'], 'slug': p['slug'], 'discipline': p['discipline'],
        'titre': fiche.get('titre'), 'carte': fiche.get('carte'), 'fiche': p['fichier'],
        'video': {'release': tag, 'fichier': nom, 'octets': reel.stat().st_size,
                  'sha256': hashlib.sha256(reel.read_bytes()).hexdigest()},
        'instagram': (p.get('instagram') or {}).get('lien'),
    }, ensure_ascii=False, indent=2) + '\n')
    return {'release': tag, 'fichier': nom}


def lier(p):
    """Inscrit dans `post.json` les liens des posts partis (TikTok : brouillon ; Instagram : lien)."""
    fichier = PUBLIE / f"{p['jour']}-{p['slug']}" / 'post.json'
    donnees = json.loads(fichier.read_text())
    donnees['instagram'] = (p.get('instagram') or {}).get('lien')
    donnees['tiktok'] = (p.get('tiktok') or {}).get('id')
    fichier.write_text(json.dumps(donnees, ensure_ascii=False, indent=2) + '\n')
