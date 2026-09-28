#!/opt/homebrew/bin/python3
"""Dépose le Reel du jour (docs/reseaux.md §4). Lancé chaque matin à 7 h 30.

    deposer.py [--jour AAAA-MM-JJ]

- TikTok : brouillon dans la boîte de réception de @anagnosis_app (reseaux/tiktok.js) ;
- la légende TikTok dans iCloud Drive/Shortcuts/anagnosis-legende.txt, que lit le
  raccourci « Légende TikTok » ;
- le paquet complet dans iCloud Drive/Anagnosis/Réseaux/<jour>-<fiche>/, en secours ;
- Instagram : publication directe dès que l'app Meta sera branchée (instagram.js).

Tout échec ouvre une issue GitHub qui mentionne @tijacksh et @Orkidea. Le registre est
committé sur main après un `git pull --rebase` : les routines de contenu poussent souvent.
"""
import argparse
import datetime as dt
import json
import shutil
import subprocess
import os
import time
from pathlib import Path

ICI = Path(__file__).resolve().parent
DEPOT = ICI.parent
REGISTRE = ICI / 'registre.json'
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


def committer(message):
    for commande in (['git', 'add', str(REGISTRE)],
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
    posts = [p for p in reg['posts'] if p['jour'] == jour and not p['tiktok']]
    for p in posts:
        dossier = MEDIAS / p['dossier']
        paquet = PAQUETS / dossier.name
        paquet.mkdir(parents=True, exist_ok=True)
        for f in ('reel.mp4', 'legende-tiktok.txt', 'legende-instagram.txt'):
            shutil.copy2(dossier / f, paquet / f)
        shutil.copy2(dossier / 'legende-tiktok.txt', RACCOURCI)
        try:
            p['tiktok'] = {**brouillon(dossier / 'reel.mp4'), 'depose': dt.datetime.now().isoformat(timespec='seconds')}
        except Exception as e:
            signaler(f'brouillon TikTok refusé ({jour})',
                     f"Fiche `{p['slug']}`, fichier `{dossier / 'reel.mp4'}`.\n\n```\n{e}\n```\n\n"
                     f"Le paquet est dans iCloud Drive (Anagnosis/Réseaux/{dossier.name}) pour publier à la main.")
            continue
        REGISTRE.write_text(json.dumps(reg, ensure_ascii=False, indent=2) + '\n')
        committer(f"Réseaux : brouillon TikTok du {jour} ({p['slug']})")
        print(f"{jour} {p['slug']} : brouillon déposé")


if __name__ == '__main__':
    main()
