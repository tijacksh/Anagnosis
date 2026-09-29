#!/opt/homebrew/bin/python3
"""Essai du dépôt quotidien, avec de faux appels aux plateformes : ne publie rien.

    essai_deposer.py            code de sortie 0 si le comportement attendu est intact

Vérifie, sur trois posts de synthèse (un Reel, un carrousel, une image), que `deposer.py` :
dépose le Reel sur TikTok **et** Instagram, publie le carrousel et l'image sur Instagram
seulement, marque chaque post comme complet, et ne ressort pas les posts déjà partis.
Lancé chaque jour par `verifier.py` : c'est ce qui aurait signalé, le 2026-09-29, l'oubli de
l'envoi Instagram dans `deposer.py` (le test de « tout est conforme » ne lit pas le code).
"""
import json
import pathlib
import subprocess
import sys
import tempfile

sys.argv = ['deposer.py', '--jour', '2099-01-01']
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import deposer as D  # noqa: E402

tmp = pathlib.Path(tempfile.mkdtemp())
medias = tmp / 'medias'
posts = []
for slug, type_, fichiers in (('a-reel', 'reel', ['reel.mp4', 'legende-tiktok.txt', 'legende-instagram.txt', 'legende-x.txt']),
                              ('b-carrousel', 'carrousel', [f'0{i}.jpg' for i in range(1, 6)] + ['legende-instagram.txt', 'legende-x.txt']),
                              ('c-image', 'concept', ['image.jpg', 'legende-instagram.txt', 'legende-x.txt'])):
    d = medias / slug
    d.mkdir(parents=True)
    for f in fichiers:
        (d / f).write_text('x')
    post = {'jour': '2099-01-01', 'slug': slug, 'discipline': None, 'fichier': None, 'dossier': slug,
            'tiktok': None, 'instagram': None}
    if type_ != 'reel':
        post['type'] = type_
    posts.append(post)
(tmp / 'registre.json').write_text(json.dumps({'posts': posts}))

D.REGISTRE, D.PAQUETS, D.RACCOURCI, D.MEDIAS = tmp / 'registre.json', tmp / 'paquets', tmp / 'legende.txt', medias
appels = []
D.brouillon = lambda reel: appels.append(('tiktok', pathlib.Path(reel).parent.name)) or {'id': 'faux', 'statut': 'SEND_TO_USER_INBOX'}
# BrightBean : faux appel, sinon l'essai publierait pour de vrai sur TikTok
D.publier_tiktok = lambda reel, legende: appels.append(('tiktok', pathlib.Path(reel).parent.name)) or {'brightbean': 'faux', 'statut': 'published'}
D.archiver = lambda p, d: {'release': 'faux', 'fichier': 'faux', 'medias': []}
D.lier = lambda p: None
D.committer = lambda m: None
D.signaler = lambda t, d: appels.append(('ISSUE', t))
vrai = subprocess.run


def faux_run(cmd, *a, **k):
    if cmd[0] == 'git':
        return type('R', (), {'returncode': 0, 'stdout': '', 'stderr': ''})()
    if cmd[0] == 'node':                       # instagram.js : on note la commande, sans rien publier
        appels.append(('instagram', cmd[2]))
        return type('R', (), {'returncode': 0, 'stdout': 'Publié : https://exemple/faux\n', 'stderr': ''})()
    return vrai(cmd, *a, **k)


D.subprocess.run = faux_run
D.main()
D.main()          # une seconde fois : rien ne doit repartir

erreurs = []
attendu = [('tiktok', 'a-reel'), ('instagram', 'reel'), ('instagram', 'carrousel'), ('instagram', 'image')]
if appels != attendu:
    erreurs.append(f'appels {appels}, attendus {attendu}')
reg = json.loads(D.REGISTRE.read_text())['posts']
if not all(bool(p['instagram']) for p in reg):
    erreurs.append('un post n\'est pas marqué comme publié sur Instagram')
if not reg[0]['tiktok'] or reg[1]['tiktok'] or reg[2]['tiktok']:
    erreurs.append('TikTok doit avoir reçu le Reel, et lui seul')
if erreurs:
    print('ÉCHEC :\n- ' + '\n- '.join(erreurs))
    sys.exit(1)
print('essai du dépôt quotidien : conforme')
