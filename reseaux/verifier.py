#!/opt/homebrew/bin/python3
"""Vérifie que la chaîne est saine, et reprend un dépôt du matin manqué.

    verifier.py [--sans-reprise] [--essai]

Lancé chaque jour à 9 h et 20 h 30 (`fr.anagnosis.reseaux.verifier`) et le dimanche à 21 h 30, une fois la
semaine suivante préparée. Il ne publie rien de nouveau : sa seule action est de relancer
`deposer.py` pour le post du jour si une plateforme n'a pas reçu son contenu (le Mac dormait,
une API était en panne à 7 h 30) ; `deposer.py` est rejouable plateforme par plateforme, il ne
double jamais un envoi déjà fait.

Contrôles, dans l'ordre :
  0. le dépôt quotidien fait ce qu'il doit (`essai_deposer.py`, de faux appels, rien n'est publié) ;
  1. les tâches launchd sont chargées, et `reseaux/PAUSE` est absent ;
  2. le registre est valide et poussé sur main (rien de commité en retard) ;
  3. les jetons ne vont pas expirer (Instagram : 7 jours ; TikTok : 30 jours) ;
  4. chaque post passé est parti partout ;
  5. chaque post des cinq prochains jours a sa vidéo, qui passe les contrôles bloquants,
     ses légendes, et son archive (release GitHub + `publie/`) ;
  6. au moins trois jours de programme d'avance (six posts).

`--essai` : ne relance rien et n'ouvre aucune issue, il affiche seulement.

Tout problème ouvre, ou complète, une issue GitHub « Réseaux : vérification » qui mentionne les
deux propriétaires. Sans problème, il n'écrit rien nulle part.
"""
import datetime as dt
import json
import os
import subprocess
import sys
from pathlib import Path

ICI = Path(__file__).resolve().parent
sys.path.insert(0, str(ICI))
DEPOT = ICI.parent
REGISTRE = ICI / 'registre.json'
MEDIAS = Path(os.environ.get('ANAGNOSIS_MEDIAS', Path.home() / 'Anagnosis-medias'))
JETONS = Path.home() / '.anagnosis/reseaux-jetons.json'
DEPOT_GITHUB = 'tijacksh/Anagnosis'
TACHES = ('preparer', 'deposer', 'verifier')

from posts import a_tiktok, complet, heure, legendes as legendes_de, medias as medias_de, type_de  # noqa: E402
from preparer import controler  # noqa: E402


def lancer(*cmd, **kw):
    return subprocess.run(cmd, capture_output=True, text=True, cwd=DEPOT, **kw)


def controles(aujourdhui, reprise):
    problemes = []

    # 0. le code du dépôt quotidien fait bien ce qu'il doit (essai avec de faux appels, rien n'est publié)
    essai = lancer(sys.executable, str(ICI / 'essai_deposer.py'))
    if essai.returncode:
        problemes.append('`essai_deposer.py` échoue : le dépôt quotidien ne fait plus ce qu\'il doit :\n```\n'
                         + (essai.stdout + essai.stderr).strip()[-600:] + '\n```')

    # 1. tâches et interrupteur
    actives = lancer('launchctl', 'list').stdout
    for t in TACHES:
        if f'fr.anagnosis.reseaux.{t}' not in actives:
            problemes.append(f'la tâche launchd `{t}` n\'est pas chargée')
    if (ICI / 'PAUSE').exists():
        problemes.append('`reseaux/PAUSE` existe : la chaîne est suspendue')

    # 2. registre et git
    try:
        reg = json.loads(REGISTRE.read_text())
    except Exception as e:
        return problemes + [f'`registre.json` illisible : {e}']
    lancer('git', 'fetch', '-q', 'origin')
    en_avance = lancer('git', 'rev-list', '--count', 'origin/main..HEAD').stdout.strip()
    if en_avance not in ('', '0'):
        problemes.append(f'{en_avance} commit(s) du registre ne sont pas poussés sur main')
    modifie = lancer('git', 'status', '--porcelain', '--', 'reseaux/registre.json', 'reseaux/publie').stdout.strip()
    if modifie:
        problemes.append('registre ou archive modifiés mais non commités :\n```\n' + modifie + '\n```')

    # 3. jetons
    try:
        jetons = json.loads(JETONS.read_text())
        ig = jetons.get('instagram', {}).get('expire', 0) / 1000 - dt.datetime.now().timestamp()
        tt = jetons.get('tiktok', {}).get('refresh_expire', 0) / 1000 - dt.datetime.now().timestamp()
        if ig < 7 * 86400:
            problemes.append(f'jeton Instagram : expire dans {ig / 86400:.0f} jour(s) : le régénérer dans le tableau de bord Meta')
        if tt < 30 * 86400:
            problemes.append(f'jeton TikTok : expire dans {tt / 86400:.0f} jour(s) : relancer `node reseaux/tiktok.js autoriser`')
    except Exception as e:
        problemes.append(f'jetons illisibles : {e}')

    posts = reg['posts']
    aujourdhui_iso = aujourdhui.isoformat()

    # 4. la reprise, puis les posts passés
    maintenant = dt.datetime.now().strftime('%H:%M')
    du_jour = [p for p in posts if p['jour'] == aujourdhui_iso and not complet(p) and heure(p) <= maintenant]
    # Reprise seulement dans la journée : un Mac rallumé à 23 h ne publie pas un Reel du matin.
    if du_jour and reprise and 7 <= dt.datetime.now().hour < 21:
        r = lancer(sys.executable, str(ICI / 'deposer.py'), '--jour', aujourdhui_iso)
        problemes.append(f"reprise du dépôt du jour (`deposer.py --jour {aujourdhui_iso}`) : "
                         f"{(r.stdout + r.stderr).strip() or 'lancée'}")
        reg = json.loads(REGISTRE.read_text())
        posts = reg['posts']
    for p in posts:
        # Le jour même, un post a deux heures et demie pour partir (dépôt, puis reprise de 9 h / 21 h).
        echeance = (dt.datetime.strptime(heure(p), '%H:%M') + dt.timedelta(hours=2, minutes=30)).strftime('%H:%M')
        if p['jour'] < aujourdhui_iso or (p['jour'] == aujourdhui_iso and maintenant >= echeance):
            manque = [n for n in ('tiktok', 'instagram') if not p[n] and (n == 'instagram' or a_tiktok(p))]
            if manque:
                problemes.append(f"{p['jour']} `{p['slug']}` n'est pas parti sur : {', '.join(manque)}")

    # 4 bis. les publications TikTok par BrightBean non confirmées au dépôt
    for p in posts:
        bb = (p.get('tiktok') or {}).get('brightbean')
        if bb and (p['tiktok'].get('statut') != 'published') and p['jour'] <= aujourdhui_iso:
            try:
                from brightbean import appel
                etat = appel(f'/posts/{bb}')
                pf = (etat.get('platform_posts') or [{}])[0]
                if etat.get('status') == 'failed' or pf.get('publish_error'):
                    problemes.append(f"{p['jour']} `{p['slug']}` : BrightBean a échoué : {pf.get('publish_error') or etat.get('status')}")
                elif etat.get('status') != 'published' and p['jour'] < aujourdhui_iso:
                    problemes.append(f"{p['jour']} `{p['slug']}` : toujours pas publié sur TikTok (BrightBean : {etat.get('status')})")
            except Exception as e:
                problemes.append(f"{p['jour']} `{p['slug']}` : statut BrightBean illisible : {e}")

    # 5. les cinq prochains jours
    limite = (aujourdhui + dt.timedelta(days=5)).isoformat()
    for p in [p for p in posts if aujourdhui_iso <= p['jour'] <= limite]:
        dossier = MEDIAS / p['dossier']
        etiquette = f"{p['jour']} `{p['slug']}`"
        absents = [m.name for m in [*medias_de(p, dossier), *legendes_de(p, dossier)] if not m.exists()]
        if absents:
            problemes.append(f"{etiquette} ({type_de(p)}) : fichier(s) absent(s) : {', '.join(absents)}")
            continue
        if type_de(p) == 'reel':
            erreurs = controler(dossier / 'reel.mp4')
            if erreurs:
                problemes.append(f"{etiquette} : contrôle de la vidéo : {', '.join(erreurs)}")
        if not (DEPOT / 'reseaux/publie' / f"{p['jour']}-{p['slug']}" / 'post.json').exists():
            problemes.append(f'{etiquette} : pas archivé dans `reseaux/publie/`')
        elif p.get('archive'):
            vue = lancer('gh', 'release', 'view', p['archive']['release'], '-R', DEPOT_GITHUB,
                         '--json', 'assets', '-q', '.assets[].name')
            attendus = p['archive'].get('medias') or [p['archive']['fichier']]
            manquants = [m for m in attendus if m not in vue.stdout.split('\n')]
            if manquants:
                problemes.append(f"{etiquette} : absent de la release `{p['archive']['release']}` : {', '.join(manquants)}")
        else:
            problemes.append(f'{etiquette} : `archive` manquante au registre')

    # 6. de l'avance
    d_avance = [p for p in posts if p['jour'] > aujourdhui_iso]
    if len(d_avance) < 6:    # trois jours, à deux posts par jour
        problemes.append(f"seulement {len(d_avance)} post(s) programmé(s) d'avance : `preparer.py` a-t-il tourné dimanche ?")
    return problemes


def signaler(jour, problemes):
    corps = f"@tijacksh @Orkidea\n\nVérification du {jour} :\n\n" + '\n'.join(f'- {p}' for p in problemes)
    ouvertes = lancer('gh', 'issue', 'list', '-R', DEPOT_GITHUB, '--state', 'open',
                      '--search', 'Réseaux : vérification in:title', '--json', 'number', '-q', '.[0].number')
    numero = ouvertes.stdout.strip()
    if numero:
        lancer('gh', 'issue', 'comment', numero, '-R', DEPOT_GITHUB, '--body', corps)
    else:
        lancer('gh', 'issue', 'create', '-R', DEPOT_GITHUB, '--title', 'Réseaux : vérification',
               '--body', corps + '\n\nVoir `docs/passation-reseaux.md`.')


def main():
    essai = '--essai' in sys.argv
    reprise = '--sans-reprise' not in sys.argv and not essai
    aujourdhui = dt.date.today()
    problemes = controles(aujourdhui, reprise)
    if problemes:
        print('\n'.join(f'- {p}' for p in problemes))
        if not essai:
            signaler(aujourdhui.isoformat(), problemes)
    else:
        print(f'{aujourdhui} : tout est conforme')


if __name__ == '__main__':
    main()
