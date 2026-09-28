#!/opt/homebrew/bin/python3
"""Prépare les Reels de la semaine suivante (docs/reseaux.md §4). Lancé le dimanche soir.

    preparer.py [--nombre 4] [--semaine AAAA-SS]

1. choisit les fiches : validées, avec carte, jamais publiées, sources complètes,
   disciplines toutes différentes ;
2. fait rendre leurs cartes par l'app (TournageTests, simulateur dédié) ;
3. monte les Reels (composer.py) et les contrôle ;
4. inscrit le programme dans reseaux/registre.json : un Reel par jour de publication.

Le dépôt, lui, se fait le jour même (deposer.py) : TikTok ne garde que 5 brouillons en
attente, et la légende du raccourci doit être celle du brouillon qu'on ouvre.
"""
import argparse
import datetime as dt
import json
import os
import random
import subprocess
import sys
from pathlib import Path

ICI = Path(__file__).resolve().parent
DEPOT = ICI.parent
REGISTRE = ICI / 'registre.json'
APP = Path(os.environ.get('ANAGNOSIS_APP_TOURNAGE', Path.home() / 'Anagnosis-app-tournage'))
MEDIAS = Path(os.environ.get('ANAGNOSIS_MEDIAS', Path.home() / 'Anagnosis-medias'))
JOURS = (0, 2, 4, 6)          # lundi, mercredi, vendredi, dimanche
RESERVE = 3                   # fiches de rechange si l'app en refuse une au tournage


def registre():
    return json.loads(REGISTRE.read_text()) if REGISTRE.exists() else {'posts': []}


def eligibles(deja):
    fiches = []
    for f in sorted((DEPOT / 'content/concepts').glob('*/*.json')):
        d = json.loads(f.read_text())
        carte = d.get('carte')
        if d.get('statut') != 'valide' or not carte or d['slug'] in deja:
            continue
        # Une source sans auteur fait écarter la fiche entière par l'app iOS : elle ne
        # peut pas être tournée (tâche ouverte le 2026-09-28).
        if any(s.get('auteur') is None for s in d.get('sources', [])):
            continue
        fiches.append((f, d))
    return fiches


def famille(discipline):
    """Les sept disciplines de droit comptent pour une : deux fiches de droit la même
    semaine, c'est deux fois le même sujet vu du fil."""
    return 'droit' if discipline.startswith('droit') else discipline


def choisir(nombre, graine):
    reg = registre()
    deja = {p['slug'] for p in reg['posts']}
    recentes = [famille(p['discipline']) for p in reg['posts'][-8:]]
    rng = random.Random(graine)
    candidates = eligibles(deja)
    rng.shuffle(candidates)
    choix, vues = [], set(recentes)
    for f, d in candidates:
        if famille(d['discipline']) in vues:
            continue
        choix.append((f, d))
        vues.add(famille(d['discipline']))
        if len(choix) == nombre + RESERVE:
            break
    return choix


def identifiants_app(slugs):
    corpus = json.loads((APP / 'Anagnosis/Ressources/concepts.json').read_text())['concepts']
    return {c['slug']: c['id'] for c in corpus if c['slug'] in slugs}


def tourner(ids):
    env_sim = dict(l.split('=', 1) for l in
                   (Path.home() / '.anagnosis/tournage.env').read_text().split() if '=' in l)
    sim = env_sim['TOURNAGE_SIM']
    env = {**os.environ, 'TEST_RUNNER_TOURNAGE_IDS': ','.join(ids)}
    with open(APP / 'build/tournage.log', 'w') as log:
        subprocess.run(['xcodebuild', '-project', 'Anagnosis.xcodeproj', '-scheme', 'Anagnosis',
                        '-destination', f'id={sim}', '-derivedDataPath', 'build', 'test',
                        '-only-testing:AnagnosisTests/TournageTests'],
                       cwd=APP, env=env, stdout=log, stderr=subprocess.STDOUT, check=True)
    subprocess.run(['xcrun', 'simctl', 'boot', sim], capture_output=True)
    conteneur = subprocess.run(['xcrun', 'simctl', 'get_app_container', sim, 'com.tijack.anagnosis', 'data'],
                               capture_output=True, text=True, check=True).stdout.strip()
    return Path(conteneur) / 'Documents/tournage'


def controler(reel):
    """Contrôles bloquants (docs/reseaux.md §6) sur le fichier livré aux plateformes."""
    sortie = subprocess.run(['ffprobe', '-v', 'error', '-show_entries',
                             'stream=codec_type,codec_name,width,height,r_frame_rate:format=duration,size',
                             '-of', 'json', str(reel)], capture_output=True, text=True, check=True)
    info = json.loads(sortie.stdout)
    video = next(s for s in info['streams'] if s['codec_type'] == 'video')
    audio = [s for s in info['streams'] if s['codec_type'] == 'audio']
    duree = float(info['format']['duration'])
    erreurs = []
    if (video['codec_name'], video['width'], video['height'], video['r_frame_rate']) != ('h264', 1080, 1920, '30/1'):
        erreurs.append(f"vidéo {video['codec_name']} {video['width']}×{video['height']} {video['r_frame_rate']}")
    if not audio or audio[0]['codec_name'] != 'aac':
        erreurs.append('son AAC absent')
    if not 8 <= duree <= 15:
        erreurs.append(f'durée {duree:.1f} s')
    if int(info['format']['size']) > 60 * 1024 * 1024:
        erreurs.append('plus de 60 Mo')
    return erreurs


def main():
    a = argparse.ArgumentParser()
    a.add_argument('--nombre', type=int, default=len(JOURS))
    a.add_argument('--semaine', help='AAAA-SS ISO ; par défaut la semaine prochaine')
    args = a.parse_args()
    lundi = (dt.date.today() + dt.timedelta(days=7 - dt.date.today().weekday())) if not args.semaine \
        else dt.date.fromisocalendar(*map(int, args.semaine.split('-')), 1)
    semaine = f'{lundi.isocalendar().year}-{lundi.isocalendar().week:02d}'

    # Le corpus de l'app suit le contenu validé du jour : l'export du dépôt, recopié.
    subprocess.run(['npm', 'run', '-s', 'export'], cwd=DEPOT, check=True, capture_output=True)
    subprocess.run([str(APP / 'outils/importer-contenu.sh'), str(DEPOT)], check=True, capture_output=True)

    choix = choisir(args.nombre, graine=semaine)
    ids = identifiants_app({d['slug'] for _, d in choix})
    choix = [(f, d) for f, d in choix if d['slug'] in ids]
    dossier_cartes = tourner([ids[d['slug']] for _, d in choix])

    reg = registre()
    jours = [lundi + dt.timedelta(days=j) for j in JOURS][:args.nombre]
    for f, d in choix:
        if not jours:
            break
        carte = dossier_cartes / f"{ids[d['slug']]}.mp4"
        if not carte.exists():
            print(f"écartée au tournage : {d['slug']}", file=sys.stderr)
            continue
        jour = jours[0]
        sortie = MEDIAS / f'semaine-{semaine}' / f"{jour.isoformat()}-{d['slug']}"
        subprocess.run([sys.executable, str(ICI / 'composer.py'), str(f), str(carte), str(sortie)],
                       check=True, capture_output=True)
        erreurs = controler(sortie / 'reel.mp4')
        if erreurs:
            print(f"écartée au contrôle : {d['slug']} : {', '.join(erreurs)}", file=sys.stderr)
            continue
        jours.pop(0)
        reg['posts'].append({'jour': jour.isoformat(), 'slug': d['slug'], 'discipline': d['discipline'],
                             'fichier': str(f.relative_to(DEPOT)), 'dossier': str(sortie.relative_to(MEDIAS)),
                             'tiktok': None, 'instagram': None})
        print(f"{jour.isoformat()}  {d['discipline']:<22} {d['carte']['punch']}")
    reg['posts'].sort(key=lambda p: p['jour'])
    REGISTRE.write_text(json.dumps(reg, ensure_ascii=False, indent=2) + '\n')
    # Chemins relatifs à ~/Anagnosis-medias : jamais de chemin propre à une machine dans le dépôt.
    for commande in (['git', 'add', str(REGISTRE)],
                     ['git', 'commit', '-q', '-m', f'Réseaux : programme de la semaine {semaine}\n\n'
                      'Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>'],
                     ['git', 'pull', '-q', '--rebase', 'origin', 'main'],
                     ['git', 'push', '-q', 'origin', 'HEAD:main']):
        subprocess.run(commande, cwd=DEPOT, check=True, capture_output=True)
    if jours:
        sys.exit(f"{len(jours)} jour(s) sans Reel cette semaine")


if __name__ == '__main__':
    main()
