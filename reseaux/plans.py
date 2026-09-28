#!/opt/homebrew/bin/python3
"""Fabrique les plans d'app intercalés dans les Reels (docs/reseaux.md §5).

    plans.py

Chaque plan découpe 3,5 s d'un rush filmé au simulateur (`~/Anagnosis-medias/rushes/`),
pose l'écran sur le papier dans un filet noir, rayon 0, avec une ligne en mono au-dessus,
et sort en 1080 × 1920 à 30 images/s dans `~/Anagnosis-medias/plans/`. Les rushes sont
refilmés quand une build change l'interface ; les coupes ci-dessous sont à revoir alors.

L'écran tient dans la zone sûre (y 250–1400) : l'interface de TikTok et d'Instagram ne le
recouvre pas.
"""
import os
import subprocess
from pathlib import Path

from PIL import Image, ImageDraw

import composer

MEDIAS = Path(os.environ.get('ANAGNOSIS_MEDIAS', Path.home() / 'Anagnosis-medias'))
RUSHES, PLANS = MEDIAS / 'rushes', MEDIAS / 'plans'
DUREE = 3.5
HAUTEUR_ECRAN = 1060
Y_ECRAN = 320

# nom : (rush, début, durée prise dans le rush, ligne affichée)
COUPES = {
    'choix':   ('onboarding.mp4', 38.8, 4.2, 'VOUS CHOISISSEZ VOS DISCIPLINES'),
    'lecture': ('lecture.mp4', 7.5, 5.0, 'CHAQUE JOUR, UNE FICHE EN ENTIER'),
    'verrou':  ('verrou.mp4', 1.0, 3.5, "UNE PAR JOUR. PUIS C'EST FERMÉ."),
    'quiz':    ('quiz.mp4', 13.8, 3.5, 'UN QUIZ, SI VOUS VOULEZ'),
}


def fond(ligne, largeur_ecran, chemin):
    """Le papier, le filet autour de l'écran et la ligne ; l'écran se pose dans le trou."""
    img = Image.new('RGB', (composer.L, composer.H), composer.PAPIER)
    d = ImageDraw.Draw(img)
    x = (composer.L - largeur_ecran) // 2
    d.rectangle([x - 6, Y_ECRAN - 6, x + largeur_ecran + 5, Y_ECRAN + HAUTEUR_ECRAN + 5],
                fill=composer.ENCRE)
    mono = composer.police('MartianMono.ttf', 24, Weight=600)
    composer.centre(d, Y_ECRAN - 110, "DANS L'APP", mono, espacement=4)
    composer.centre(d, Y_ECRAN - 70, ligne, composer.police('MartianMono.ttf', 24, Weight=500), espacement=2)
    composer.grain(img).save(chemin)
    return x


def main():
    PLANS.mkdir(parents=True, exist_ok=True)
    largeur = round(HAUTEUR_ECRAN * 1206 / 2622) // 2 * 2
    for nom, (rush, debut, prise, ligne) in COUPES.items():
        image = PLANS / f'{nom}-fond.png'
        x = fond(ligne, largeur, image)
        vitesse = prise / DUREE
        subprocess.run([
            'ffmpeg', '-v', 'error', '-y', '-ss', str(debut), '-t', str(prise), '-i', str(RUSHES / rush),
            '-loop', '1', '-i', str(image),
            '-filter_complex',
            f'[0:v]setpts=PTS/{vitesse},fps=30,scale={largeur}:{HAUTEUR_ECRAN}[e];'
            f'[1:v][e]overlay={x}:{Y_ECRAN}:shortest=1,format=yuv420p,trim=duration={DUREE}[v]',
            '-map', '[v]', '-an', '-c:v', 'libx264', '-crf', '18', '-r', '30', str(PLANS / f'{nom}.mp4')],
            check=True)
        image.unlink()
        print(PLANS / f'{nom}.mp4')


if __name__ == '__main__':
    main()
