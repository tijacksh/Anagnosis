#!/opt/homebrew/bin/python3
"""Dépose le Reel du jour (docs/reseaux.md §4). Lancé chaque matin à 7 h 30.

    deposer.py [--jour AAAA-MM-JJ]

- TikTok : brouillon dans la boîte de réception de @anagnosis_app (reseaux/tiktok.js) ;
- la légende TikTok dans iCloud Drive/Shortcuts/anagnosis-legende.txt, que lit le
  raccourci « Légende TikTok » ;
- le paquet complet dans iCloud Drive/Anagnosis/Réseaux/<jour>-<fiche>/, en secours ;
- Instagram : publication directe dès que l'app Meta sera branchée (instagram.js) ;
- X : le Reel est publié avec sa légende (reseaux/x.js), dès qu'un jeton X est installé
  (`node reseaux/x.js autoriser`) ; sans jeton, cette étape est ignorée.

Tout échec ouvre une issue GitHub qui mentionne @tijacksh et @Orkidea. Le registre est
committé sur main après un `git pull --rebase` : les routines de contenu poussent souvent.
"""
import argparse
import datetime as dt
import hashlib
import json
import tempfile
import shutil
import subprocess
import os
import time
from pathlib import Path

from legendes import legende_x

ICI = Path(__file__).resolve().parent
DEPOT = ICI.parent
REGISTRE = ICI / 'registre.json'
PUBLIE = ICI / 'publie'
DEPOT_GITHUB = 'tijacksh/Anagnosis'
ICLOUD = Path.home() / 'Library/Mobile Documents'
RACCOURCI = ICLOUD / 'iCloud~is~workflow~my~workflows/Documents/anagnosis-legende.txt'
PAQUETS = ICLOUD / 'com~apple~CloudDocs/Anagnosis/Réseaux'
MEDIAS = Path(os.environ.get('ANAGNOSIS_MEDIAS', Path.home() / 'Anagnosis-medias'))


def signaler(titre, detail):
    subprocess.run(['gh', 'issue', 'create', '-R', 'tijacksh/Anagnosis', '--title', f'Réseaux : {titre}',
                    '--body', f'@tijacksh @Orkidea\n\n{detail}\n\nVoir docs/reseaux.md.'],
                   cwd=DEPOT, capture_output=True)


def tiktok(*args):
    r = subprocess.run(['node', str(ICI / 'tiktok.js'), *args], capture_output=True, text=True)
    if r.returncode:
        raise RuntimeError(r.stderr.strip() or r.stdout.strip())
    return r.stdout


def x_actif():
    """X n'est tenté que si l'outil a été autorisé sur le compte (jeton installé)."""
    jetons = Path.home() / '.anagnosis/reseaux-jetons.json'
    return jetons.exists() and 'x' in json.loads(jetons.read_text())


def publier_x(reel, legende):
    r = subprocess.run(['node', str(ICI / 'x.js'), 'publier', str(reel), str(legende)],
                       capture_output=True, text=True)
    if r.returncode:
        raise RuntimeError(r.stderr.strip() or r.stdout.strip())
    return r.stdout.split('Publié : ', 1)[1].split()[0]


def brouillon(reel):
    """Envoie, puis attend le traitement jusqu'à 10 minutes.

    Un envoi encore `PROCESSING_UPLOAD` passé ce délai n'est **pas** un échec : TikTok met
    parfois bien plus longtemps (vu le 2026-09-28), et renvoyer créerait un doublon dans la
    boîte de réception. Seul `FAILED` est un échec."""
    sortie = tiktok('brouillon', str(reel))
    publish_id = sortie.split('Envoyé : ', 1)[1].split()[0]
    statut = 'PROCESSING_UPLOAD'
    for _ in range(40):
        time.sleep(15)
        reponse = json.loads(tiktok('statut', publish_id))
        statut = reponse['status']
        if statut == 'SEND_TO_USER_INBOX':
            break
        if statut == 'FAILED':
            raise RuntimeError(f"brouillon {publish_id} refusé : {reponse.get('fail_reason')}")
    return {'id': publish_id, 'statut': statut}


def archiver(p, dossier):
    """Garde ce qui est parti, pour que les autres plateformes publient exactement pareil.

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
        if (dossier / f).exists():
            shutil.copy2(dossier / f, cible / f)
    fiche = json.loads((DEPOT / p['fichier']).read_text())
    (cible / 'post.json').write_text(json.dumps({
        'jour': p['jour'], 'slug': p['slug'], 'discipline': p['discipline'],
        'titre': fiche.get('titre'), 'carte': fiche.get('carte'), 'fiche': p['fichier'],
        'video': {'release': tag, 'fichier': nom, 'octets': reel.stat().st_size,
                  'sha256': hashlib.sha256(reel.read_bytes()).hexdigest()},
        'instagram': (p.get('instagram') or {}).get('lien'),
        'x': (p.get('x') or {}).get('lien'),
    }, ensure_ascii=False, indent=2) + '\n')
    return {'release': tag, 'fichier': nom}


def committer(message):
    for commande in (['git', 'add', str(REGISTRE), *([str(PUBLIE)] if PUBLIE.exists() else [])],
                     ['git', 'commit', '-q', '-m', message + '\n\nCo-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>'],
                     ['git', 'pull', '-q', '--rebase', 'origin', 'main'],
                     ['git', 'push', '-q', 'origin', 'HEAD:main']):
        subprocess.run(commande, cwd=DEPOT, check=True, capture_output=True)


def main():
    a = argparse.ArgumentParser()
    a.add_argument('--jour', default=dt.date.today().isoformat())
    jour = a.parse_args().jour
    if (ICI / 'PAUSE').exists():
        print('PAUSE présent : rien à faire')
        return
    subprocess.run(['git', 'pull', '-q', '--rebase', 'origin', 'main'], cwd=DEPOT, capture_output=True)
    reg = json.loads(REGISTRE.read_text())
    avec_x = x_actif()
    # Chaque plateforme est indépendante : un post est repris tant qu'il manque TikTok, ou X (si branché).
    posts = [p for p in reg['posts'] if p['jour'] == jour
             and (not p['tiktok'] or (avec_x and not p.get('x')))]
    for p in posts:
        dossier = MEDIAS / p['dossier']
        fait = []
        if not p['tiktok']:
            paquet = PAQUETS / dossier.name
            paquet.mkdir(parents=True, exist_ok=True)
            for f in ('reel.mp4', 'legende-tiktok.txt', 'legende-instagram.txt'):
                shutil.copy2(dossier / f, paquet / f)
            shutil.copy2(dossier / 'legende-tiktok.txt', RACCOURCI)
            try:
                p['tiktok'] = {**brouillon(dossier / 'reel.mp4'), 'depose': dt.datetime.now().isoformat(timespec='seconds')}
                fait.append('brouillon TikTok')
            except Exception as e:
                signaler(f'brouillon TikTok refusé ({jour})',
                         f"Fiche `{p['slug']}`, fichier `{dossier / 'reel.mp4'}`.\n\n```\n{e}\n```\n\n"
                         f"Le paquet est dans iCloud Drive (Anagnosis/Réseaux/{dossier.name}) pour publier à la main.")
        if avec_x and not p.get('x'):
            try:
                legende = dossier / 'legende-x.txt'
                if not legende.exists():  # Reel préparé avant l'arrivée de X : on écrit la légende maintenant
                    legende.write_text(legende_x(json.loads((DEPOT / p['fichier']).read_text())))
                lien = publier_x(dossier / 'reel.mp4', legende)
                p['x'] = {'lien': lien, 'publie': dt.datetime.now().isoformat(timespec='seconds')}
                fait.append('publication X')
            except Exception as e:
                signaler(f'publication X refusée ({jour})',
                         f"Fiche `{p['slug']}`, fichier `{dossier / 'reel.mp4'}`.\n\n```\n{e}\n```")
        if not fait:
            continue
        if (p['tiktok'] or p['instagram'] or p.get('x')) and not p.get('archive'):
            try:
                p['archive'] = archiver(p, dossier)
            except Exception as e:
                signaler(f'archivage du post refusé ({jour})', f"Fiche `{p['slug']}`.\n\n```\n{e}\n```")
        REGISTRE.write_text(json.dumps(reg, ensure_ascii=False, indent=2) + '\n')
        committer(f"Réseaux : {' et '.join(fait)} du {jour} ({p['slug']})")
        print(f"{jour} {p['slug']} : {' et '.join(fait)}")


if __name__ == '__main__':
    main()
