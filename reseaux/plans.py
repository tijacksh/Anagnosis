#!/opt/homebrew/bin/python3
"""Fabrique les plans d'app intercalés dans les Reels (docs/reseaux.md §5).

    plans.py

Chaque plan découpe 3,5 s d'un rush filmé au simulateur (`~/Anagnosis-medias/rushes/`),
pose l'écran sur le papier dans un filet noir, rayon 0, avec une phrase en mono au-dessus,
et sort en 1080 × 1920 à 30 images/s dans `~/Anagnosis-medias/plans/`. Les rushes sont
refilmés quand une build change l'interface ; les coupes ci-dessous sont à revoir alors.

Les deux lignes restent dans la zone sûre ; le bas de l'écran du téléphone passe sous la
légende des plateformes, ce qui ne cache que la barre d'onglets de l'app.
"""
import os
import subprocess
from pathlib import Path

from PIL import Image, ImageDraw

import composer

MEDIAS = Path(os.environ.get('ANAGNOSIS_MEDIAS', Path.home() / 'Anagnosis-medias'))
RUSHES, PLANS = MEDIAS / 'rushes', MEDIAS / 'plans'
DUREE = 3.5
HAUTEUR_ECRAN = 1380
Y_ECRAN = 330

# nom : (rush, début, durée prise dans le rush, lignes affichées)
#
# **Toujours à vitesse réelle.** Le simulateur n'enregistre une image que quand l'écran
# change : accélérer un rush fait sauter des images et saccade le mouvement. Les
# défilements se filment d'un geste lancé (iOS anime la décélération à 60 images/s), jamais
# par petits glissements successifs.
COUPES = {
# Chaque ligne dit ce que montre l'écran, en une phrase qui se comprend seule.
    'choix':   ('onboarding.mp4', 39.2, 3.5, ('VOUS CHOISISSEZ', 'VOS DISCIPLINES')),
    'lecture': ('lecture.mp4', 5.5, 3.5, ('CHAQUE JOUR, UNE FICHE', 'À LIRE EN TROIS MINUTES')),
    'verrou':  ('verrou.mp4', 1.0, 3.5, ('UN CONCEPT PAR JOUR,', 'LE SUIVANT ARRIVE DEMAIN')),
    'quiz':    ('quiz.mp4', 13.8, 3.5, ('UN QUIZ POUR VÉRIFIER', "CE QU'ON A RETENU")),
    # Filmés sur un compte simulé de six semaines (rushes/compte-demo.py) : un compte neuf
    # n'a qu'un jour lu, et son relevé est vide.
    'releve':  ('profil.mp4', 8.4, 3.5, ('CHAQUE FICHE LUE', "S'IMPRIME DANS VOTRE RELEVÉ")),
    'ouverture': ('ouverture.mp4', 1.0, 3.5, ('CHAQUE JOUR, UNE NOUVELLE', 'FICHE VOUS ATTEND')),
}


def fond(lignes, largeur_ecran, chemin):
    """Le papier, le filet autour de l'écran et deux lignes ; l'écran se pose dans le trou."""
    img = Image.new('RGB', (composer.L, composer.H), composer.PAPIER)
    d = ImageDraw.Draw(img)
    x = (composer.L - largeur_ecran) // 2
    d.rectangle([x - 6, Y_ECRAN - 6, x + largeur_ecran + 5, Y_ECRAN + HAUTEUR_ECRAN + 5],
                fill=composer.ENCRE)
    mono = composer.police('MartianMono.ttf', 26, Weight=600)
    for i, ligne in enumerate(lignes):
        composer.centre(d, Y_ECRAN - 112 + 44 * i, ligne, mono, espacement=3)
    composer.grain(img).save(chemin)
    return x


def main():
    PLANS.mkdir(parents=True, exist_ok=True)
    largeur = round(HAUTEUR_ECRAN * 1206 / 2622) // 2 * 2
    for nom, (rush, debut, prise, lignes) in COUPES.items():
        image = PLANS / f'{nom}-fond.png'
        x = fond(lignes, largeur, image)
        vitesse = prise / DUREE
        subprocess.run([
            'ffmpeg', '-v', 'error', '-y', '-ss', str(debut), '-t', str(prise), '-i', str(RUSHES / rush),
            '-loop', '1', '-i', str(image),
            '-filter_complex',
            f'[0:v]setpts=(PTS-STARTPTS)/{vitesse},fps=30,scale={largeur}:{HAUTEUR_ECRAN}[e];'
            f'[1:v][e]overlay={x}:{Y_ECRAN}:shortest=1,format=yuv420p,trim=duration={DUREE}[v]',
            '-map', '[v]', '-an', '-c:v', 'libx264', '-crf', '18', '-r', '30', str(PLANS / f'{nom}.mp4')],
            check=True)
        image.unlink()
        print(PLANS / f'{nom}.mp4')


if __name__ == '__main__':
    main()
