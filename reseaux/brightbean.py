#!/opt/homebrew/bin/python3
"""Programme les Reels TikTok dans BrightBean Studio (docs/passation-reseaux.md).

    brightbean.py programmer [--depuis AAAA-MM-JJ]   envoie vidéo + légende, programme à 7 h 30 (Paris)
    brightbean.py statut ID

L'API ne règle pas les options TikTok (visibilité, commentaires, « Contenu promotionnel ») :
elles se fixent ensuite dans l'interface, post par post. Clé : BRIGHTBEAN_API_KEY dans
~/.anagnosis/cles.env. Le registre reçoit `tiktok = {brightbean: id, ...}`, ce qui évite le
brouillon de `deposer.py`.
"""
import datetime as dt
import json
import os
import subprocess
import sys
from pathlib import Path
from zoneinfo import ZoneInfo

ICI = Path(__file__).resolve().parent
REGISTRE = ICI / 'registre.json'
MEDIAS = Path(os.environ.get('ANAGNOSIS_MEDIAS', Path.home() / 'Anagnosis-medias'))
API = 'https://studio.brightbean.xyz/api/v1'
COMPTE = 'bf0b271d-9f22-4411-b42d-64fbbf7aff30'


def cle():
    for l in (Path.home() / '.anagnosis/cles.env').read_text().splitlines():
        if l.startswith('BRIGHTBEAN_API_KEY='):
            return l.split('=', 1)[1].strip()
    raise SystemExit('BRIGHTBEAN_API_KEY absente')


def appel(chemin, *args):
    r = subprocess.run(['curl', '-s', '-H', f'Authorization: Bearer {cle()}', *args, API + chemin],
                       capture_output=True, text=True)
    return json.loads(r.stdout)


def programmer(depuis):
    reg = json.loads(REGISTRE.read_text())
    for p in reg['posts']:
        if p['jour'] < depuis or p.get('type') not in (None, 'reel') or p['tiktok']:
            continue
        d = MEDIAS / p['dossier']
        media = appel('/media/', '-F', f'file=@{d / "reel.mp4"}')
        quand = dt.datetime.fromisoformat(p['jour'] + 'T07:30:00').replace(tzinfo=ZoneInfo('Europe/Paris'))
        corps = {'social_account_id': COMPTE, 'caption': (d / 'legende-tiktok.txt').read_text().strip(),
                 'media_asset_ids': [media['id']], 'action': 'schedule',
                 'scheduled_at': quand.astimezone(dt.timezone.utc).isoformat()}
        post = appel('/posts/', '-H', 'Content-Type: application/json', '-d', json.dumps(corps))
        print(p['jour'], p['slug'], post.get('id'), post.get('status'), post.get('detail', ''))
        if post.get('id'):
            p['tiktok'] = {'brightbean': post['id'], 'programme': quand.isoformat(), 'statut': post['status']}
            REGISTRE.write_text(json.dumps(reg, ensure_ascii=False, indent=2) + '\n')


if __name__ == '__main__':
    if sys.argv[1] == 'programmer':
        programmer(sys.argv[3] if len(sys.argv) > 3 else dt.date.today().isoformat())
    else:
        print(json.dumps(appel(f'/posts/{sys.argv[2]}'), indent=1))
