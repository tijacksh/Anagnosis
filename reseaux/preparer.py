#!/opt/homebrew/bin/python3
"""Prépare les posts de la semaine suivante (docs/reseaux.md §4). Lancé le dimanche soir.

    preparer.py [--semaine AAAA-SS] [--depuis AAAA-MM-JJ]

1. choisit les fiches : validées, avec carte, jamais publiées, sources complètes,
   disciplines toutes différentes ;
2. fait rendre leurs cartes par l'app (TournageTests, simulateur dédié) ;
3. monte les Reels (composer.py) et les contrôle ;
4. inscrit le programme dans reseaux/registre.json : deux posts par jour, matin et soir (`PROGRAMME`).

Le dépôt, lui, se fait le jour même (deposer.py) : TikTok ne garde que 5 brouillons en
attente, et la légende du raccourci doit être celle du brouillon qu'on ouvre.
"""
import argparse
import datetime as dt
import json
import os
import random
import shutil
import subprocess
import sys
from pathlib import Path

ICI = Path(__file__).resolve().parent
sys.path.insert(0, str(ICI))
DEPOT = ICI.parent
REGISTRE = ICI / 'registre.json'
from archive import archiver  # noqa: E402
from posts import MATIN, SOIR, heure  # noqa: E402

APP = Path(os.environ.get('ANAGNOSIS_APP_TOURNAGE', Path.home() / 'Anagnosis-app-tournage'))
MEDIAS = Path(os.environ.get('ANAGNOSIS_MEDIAS', Path.home() / 'Anagnosis-medias'))
# Deux posts par jour (décidé le 2026-10-27) : un Reel chaque matin, et le soir un carrousel
# (lundi, mercredi, vendredi, dimanche), un post « concept » (jeudi) ou un second Reel (mardi,
# samedi). Neuf Reels par semaine, donc neuf vidéos TikTok, qui n'a que les Reels.
PROGRAMME = {j: [(MATIN, 'reel'), (SOIR, s)] for j, s in
             enumerate(('carrousel', 'reel', 'carrousel', 'concept', 'carrousel', 'reel', 'carrousel'))}
RESERVE = 3                   # fiches de rechange si l'app en refuse une au tournage
PLANS = ('choix', 'lecture', 'verrou', 'quiz', 'releve', 'ouverture')   # plans d'app (plans.py), en rotation


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
    recentes = [famille(p['discipline']) for p in reg['posts'][-8:] if p.get('discipline')]
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


def choisir_carrousels(nombre, exclus, graine):
    """Fiches pour les carrousels : comme les Reels, mais avec un quiz, et jamais une fiche déjà prise."""
    reg = registre()
    deja = {p['slug'] for p in reg['posts']} | set(exclus)
    rng = random.Random(f'carrousel-{graine}')
    candidates = [(f, d) for f, d in eligibles(deja) if d.get('quiz', {}).get('choix')]
    rng.shuffle(candidates)
    return candidates[:nombre + 1]


def identifiants_app(slugs):
    corpus = json.loads((APP / 'Anagnosis/Ressources/concepts.json').read_text())['concepts']
    return {c['slug']: c['id'] for c in corpus if c['slug'] in slugs}


NOM_SIMULATEUR = 'Anagnosis Tournage'


def simulateur():
    """Le simulateur du tournage : celui de `~/.anagnosis/tournage.env` s'il existe encore, sinon
    « Anagnosis Tournage », créé au besoin. Une réinstallation des runtimes iOS efface les
    simulateurs (vu le 2026-10-27 : la préparation échouait, « Unable to find a device »)."""
    env_sim = dict(l.split('=', 1) for l in
                   (Path.home() / '.anagnosis/tournage.env').read_text().split() if '=' in l)
    appareils = [a for l in json.loads(subprocess.run(['xcrun', 'simctl', 'list', 'devices', 'available', '-j'],
                                                      capture_output=True, text=True, check=True).stdout)['devices'].values()
                 for a in l]
    if any(a['udid'] == env_sim.get('TOURNAGE_SIM') for a in appareils):
        return env_sim['TOURNAGE_SIM']
    nomme = next((a['udid'] for a in appareils if a['name'] == NOM_SIMULATEUR), None)
    if nomme:
        return nomme
    runtimes = json.loads(subprocess.run(['xcrun', 'simctl', 'list', 'runtimes', 'available', '-j'],
                                         capture_output=True, text=True, check=True).stdout)['runtimes']
    # Le runtime iOS le plus récent qui propose un iPhone Pro (un runtime peut n'en porter qu'un modèle).
    for r in reversed([r for r in runtimes if r['identifier'].startswith('com.apple.CoreSimulator.SimRuntime.iOS')]):
        pro = [t['identifier'] for t in r['supportedDeviceTypes'] if t['name'].startswith('iPhone') and 'Pro' in t['name']]
        if pro:
            return subprocess.run(['xcrun', 'simctl', 'create', NOM_SIMULATEUR, pro[0], r['identifier']],
                                  capture_output=True, text=True, check=True).stdout.strip()
    raise SystemExit('aucun runtime iOS ne propose d\'iPhone Pro pour le tournage')


def tourner(ids):
    sim = simulateur()
    env = {**os.environ, 'TEST_RUNNER_TOURNAGE_IDS': ','.join(ids)}
    (APP / 'build').mkdir(parents=True, exist_ok=True)   # absent après un nettoyage de disque
    try:
        with open(APP / 'build/tournage.log', 'w') as log:
            subprocess.run(['xcodebuild', '-project', 'Anagnosis.xcodeproj', '-scheme', 'Anagnosis',
                            '-destination', f'id={sim}', '-derivedDataPath', 'build', 'test',
                            '-only-testing:AnagnosisTests/TournageTests'],
                           cwd=APP, env=env, stdout=log, stderr=subprocess.STDOUT, check=True)
        subprocess.run(['xcrun', 'simctl', 'boot', sim], capture_output=True)
        conteneur = subprocess.run(['xcrun', 'simctl', 'get_app_container', sim, 'com.tijack.anagnosis', 'data'],
                                   capture_output=True, text=True, check=True).stdout.strip()
        # Recopiées aussitôt : le conteneur du simulateur disparaît à la moindre réinstallation.
        cartes = MEDIAS / 'cartes'
        cartes.mkdir(parents=True, exist_ok=True)
        for f in (Path(conteneur) / 'Documents/tournage').glob('*.mp4'):
            shutil.copy2(f, cartes / f.name)
        return cartes
    finally:
        # Éteint après chaque tournage, réussi ou non : allumé, il garde mémoire et processeur.
        subprocess.run(['xcrun', 'simctl', 'shutdown', sim], capture_output=True)


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
    a.add_argument('--semaine', help='AAAA-SS ISO ; par défaut la semaine prochaine')
    a.add_argument('--depuis', help="AAAA-MM-JJ : ne programmer que les jours à partir de celui-ci "
                                    "(une semaine déjà entamée)")
    args = a.parse_args()
    lundi = (dt.date.today() + dt.timedelta(days=7 - dt.date.today().weekday())) if not args.semaine \
        else dt.date.fromisocalendar(*map(int, args.semaine.split('-')), 1)
    semaine = f'{lundi.isocalendar().year}-{lundi.isocalendar().week:02d}'

    reg = registre()
    deja_prevus = {(p['jour'], heure(p)) for p in reg['posts']}
    depuis = dt.date.fromisoformat(args.depuis) if args.depuis else lundi
    creneaux = [(jour, h, genre) for jour in (lundi + dt.timedelta(days=d) for d in range(7))
                for h, genre in PROGRAMME[jour.weekday()]
                if jour >= depuis and (jour.isoformat(), h) not in deja_prevus]
    # `jours` : les créneaux des Reels ; `jours_images` : ceux des carrousels et posts « concept ».
    jours = [(j, h) for j, h, g in creneaux if g == 'reel']
    jours_images = {(j, h): g for j, h, g in creneaux if g != 'reel'}
    if not creneaux:
        print('rien à programmer : la semaine est déjà pleine')
        return

    # Le corpus de l'app suit le contenu validé du jour : l'export du dépôt, recopié.
    subprocess.run(['npm', 'run', '-s', 'export'], cwd=DEPOT, check=True, capture_output=True)
    subprocess.run([str(APP / 'outils/importer-contenu.sh'), str(DEPOT)], check=True, capture_output=True)

    choix = choisir(len(jours), graine=semaine) if jours else []
    nb_carrousels = list(jours_images.values()).count('carrousel')
    choix_car = choisir_carrousels(nb_carrousels, [d['slug'] for _, d in choix], semaine) if nb_carrousels else []
    ids = identifiants_app({d['slug'] for _, d in choix + choix_car})
    choix = [(f, d) for f, d in choix if d['slug'] in ids]
    choix_car = [(f, d) for f, d in choix_car if d['slug'] in ids]
    dossier_cartes = tourner([ids[d['slug']] for _, d in choix + choix_car]) if (choix or choix_car) else MEDIAS / 'cartes'

    def inscrire(post, sortie, libelle):
        # Archivé dès la programmation, pour que les autres plateformes (X…) voient la semaine
        # à l'avance : légendes dans git, médias dans la release de la semaine.
        try:
            post['archive'] = archiver(post, sortie)
        except Exception as e:
            print(f"archivage refusé : {post['slug']} : {e}", file=sys.stderr)
        reg['posts'].append(post)
        print(f"{post['jour']}  {libelle}")

    for f, d in choix:
        if not jours:
            break
        carte = dossier_cartes / f"{ids[d['slug']]}.mp4"
        if not carte.exists():
            print(f"écartée au tournage : {d['slug']}", file=sys.stderr)
            continue
        jour, h = jours[0]
        sortie = MEDIAS / f'semaine-{semaine}' / f"{jour.isoformat()}-{d['slug']}"
        plan = MEDIAS / 'plans' / f"{PLANS[len(reg['posts']) % len(PLANS)]}.mp4"
        subprocess.run([sys.executable, str(ICI / 'composer.py'), str(f), str(carte), str(sortie),
                        *([str(plan)] if plan.exists() else [])],
                       check=True, capture_output=True)
        erreurs = controler(sortie / 'reel.mp4')
        if erreurs:
            print(f"écartée au contrôle : {d['slug']} : {', '.join(erreurs)}", file=sys.stderr)
            continue
        jours.pop(0)
        inscrire({'jour': jour.isoformat(), 'heure': h, 'slug': d['slug'], 'discipline': d['discipline'],
                  'fichier': str(f.relative_to(DEPOT)), 'dossier': str(sortie.relative_to(MEDIAS)),
                  'tiktok': None, 'instagram': None}, sortie, f"{d['discipline']:<22} {d['carte']['punch']}")

    # Les créneaux sans vidéo : carrousels et post « concept » (`PROGRAMME`).
    marque = json.loads((ICI / 'marque.json').read_text())['concepts']
    deja_concepts = sum(1 for p in reg['posts'] if p.get('type') == 'concept')
    for (jour, h), genre in sorted(jours_images.items()):
        try:
            if genre == 'carrousel':
                f, d = choix_car.pop(0)
                sortie = MEDIAS / f'semaine-{semaine}' / f"{jour.isoformat()}-{d['slug']}"
                subprocess.run([sys.executable, str(ICI / 'carrousel.py'), str(f), str(dossier_cartes / f"{ids[d['slug']]}.mp4"),
                                str(sortie)], check=True, capture_output=True)
                inscrire({'jour': jour.isoformat(), 'heure': h, 'type': 'carrousel', 'slug': d['slug'], 'discipline': d['discipline'],
                          'fichier': str(f.relative_to(DEPOT)), 'dossier': str(sortie.relative_to(MEDIAS)),
                          'tiktok': None, 'instagram': None}, sortie, f"carrousel : {d['carte']['punch']}")
            else:
                c = marque[deja_concepts % len(marque)]
                deja_concepts += 1
                sortie = MEDIAS / f'semaine-{semaine}' / f"{jour.isoformat()}-concept-{c['slug']}"
                subprocess.run([sys.executable, str(ICI / 'concept.py'), c['slug'], str(sortie)], check=True, capture_output=True)
                inscrire({'jour': jour.isoformat(), 'heure': h, 'type': 'concept', 'slug': f"concept-{c['slug']}", 'discipline': None,
                          'fichier': None, 'titre': c['titre'], 'dossier': str(sortie.relative_to(MEDIAS)),
                          'tiktok': None, 'instagram': None}, sortie, f"concept : {c['titre']}")
        except (subprocess.CalledProcessError, IndexError) as e:
            print(f"{jour} {h} ({genre}) non programmé : {getattr(e, 'stderr', e)}", file=sys.stderr)

    reg['posts'].sort(key=lambda p: (p['jour'], heure(p)))
    REGISTRE.write_text(json.dumps(reg, ensure_ascii=False, indent=2) + '\n')
    # Chemins relatifs à ~/Anagnosis-medias : jamais de chemin propre à une machine dans le dépôt.
    for commande in (['git', 'add', str(REGISTRE), *([str(ICI / 'publie')] if (ICI / 'publie').exists() else [])],
                     ['git', 'commit', '-q', '-m', f'Réseaux : programme de la semaine {semaine}\n\n'
                      'Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>'],
                     ['git', 'pull', '-q', '--rebase', 'origin', 'main'],
                     ['git', 'push', '-q', 'origin', 'HEAD:main']):
        subprocess.run(commande, cwd=DEPOT, check=True, capture_output=True)
    if jours:
        sys.exit(f"{len(jours)} créneau(x) sans Reel cette semaine")


if __name__ == '__main__':
    main()
