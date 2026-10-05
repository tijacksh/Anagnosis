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

from archive import archiver, lier
from brightbean import publier as publier_tiktok
from posts import a_tiktok, complet, legendes as legendes_de, medias as medias_de, type_de

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


def copier(source, cible):
    """Copie dans iCloud Drive, qui refuse parfois l'écriture (« Resource deadlock avoided »,
    vu le 2026-10-05). Ces copies ne servent qu'au secours manuel : un échec ne doit jamais
    empêcher la publication."""
    try:
        shutil.copy2(source, cible)
        return True
    except OSError as e:
        print(f'copie vers {cible} impossible : {e}')
        return False


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


def instagram(p, dossier):
    """Publie le post sur Instagram, tout de suite et en public : pas de brouillon côté API.
    Selon le type : Reel, carrousel ou image seule."""
    t = type_de(p)
    legende = dossier / 'legende-instagram.txt'
    if t == 'reel':
        cmd = ['reel', str(dossier / 'reel.mp4'), str(legende)]
    elif t == 'carrousel':
        cmd = ['carrousel', str(legende), *[str(m) for m in medias_de(p, dossier)]]
    else:
        cmd = ['image', str(dossier / 'image.jpg'), str(legende)]
    r = subprocess.run(['node', str(ICI / 'instagram.js'), *cmd], capture_output=True, text=True)
    if r.returncode:
        raise RuntimeError(r.stderr.strip() or r.stdout.strip())
    lien = next(l.split('Publié : ', 1)[1] for l in r.stdout.splitlines() if l.startswith('Publié : '))
    return {'lien': lien, 'publie': dt.datetime.now().isoformat(timespec='seconds')}


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
    for p in [p for p in reg['posts'] if p['jour'] == jour and not complet(p)]:
        dossier = MEDIAS / p['dossier']
        paquet = PAQUETS / dossier.name
        try:
            paquet.mkdir(parents=True, exist_ok=True)
        except OSError as e:
            print(f'dossier {paquet} impossible : {e}')
        for f in [*medias_de(p, dossier), *legendes_de(p, dossier)]:
            copier(f, paquet / f.name)
        # TikTok : les Reels seulement, en brouillon. Les deux plateformes sont indépendantes :
        # l'échec de l'une n'empêche pas l'autre, et ouvre une issue.
        if a_tiktok(p) and not p['tiktok']:
            copier(dossier / 'legende-tiktok.txt', RACCOURCI)
            try:
                # Publication publique par BrightBean ; à défaut, brouillon dans la boîte TikTok.
                try:
                    p['tiktok'] = {**publier_tiktok(dossier / 'reel.mp4', (dossier / 'legende-tiktok.txt').read_text().strip()),
                                   'publie': dt.datetime.now().isoformat(timespec='seconds')}
                except Exception as e:
                    signaler(f'publication TikTok par BrightBean refusée ({jour})',
                             f"Post `{p['slug']}` : repli sur le brouillon TikTok.\n\n```\n{e}\n```")
                    p['tiktok'] = {**brouillon(dossier / 'reel.mp4'), 'depose': dt.datetime.now().isoformat(timespec='seconds')}
            except Exception as e:
                signaler(f'brouillon TikTok refusé ({jour})',
                         f"Post `{p['slug']}`.\n\n```\n{e}\n```\n\n"
                         f"Le paquet est dans iCloud Drive (Anagnosis/Réseaux/{dossier.name}) pour publier à la main.")
        if not p['instagram']:
            try:
                p['instagram'] = instagram(p, dossier)
            except Exception as e:
                signaler(f'publication Instagram refusée ({jour})',
                         f"Post `{p['slug']}` (type `{type_de(p)}`).\n\n```\n{e}\n```\n\n"
                         f"Le paquet est dans iCloud Drive (Anagnosis/Réseaux/{dossier.name}) pour publier à la main.")
        try:
            # Normalement déjà archivé à la préparation ; on le refait au besoin, puis on
            # y inscrit les liens des posts.
            if not p.get('archive'):
                p['archive'] = archiver(p, dossier)
            lier(p)
        except Exception as e:
            signaler(f'archivage du post refusé ({jour})', f"Post `{p['slug']}`.\n\n```\n{e}\n```")
        REGISTRE.write_text(json.dumps(reg, ensure_ascii=False, indent=2) + '\n')
        parti = [n for n in ('TikTok', 'Instagram') if p[n.lower()]]
        committer(f"Réseaux : {jour} ({p['slug']}) : " + (', '.join(parti) or 'rien de parti'))
        print(f"{jour} {p['slug']} : TikTok {'ok' if p['tiktok'] else ('sans objet' if not a_tiktok(p) else 'échec')}, "
              f"Instagram {'ok' if p['instagram'] else 'échec'}")


if __name__ == '__main__':
    main()
