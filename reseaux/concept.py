#!/opt/homebrew/bin/python3
"""Fabrique un post « concept » : une image 1080 × 1350 qui présente le produit.

    concept.py <slug du concept> <dossier de sortie>

Les textes viennent de `marque.json`, repris mot pour mot du site : rien n'est inventé. Le
visuel est un vrai écran de l'app (image extraite des rushes filmés au simulateur), la carte
partageable, ou la palette des quarante encres. Écrit `image.jpg`, `legende-instagram.txt` et
`legende-x.txt` (280 caractères, adresse comptée pour 23).
"""
import json
import subprocess
import sys
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw

import carrousel as C
import composer
from composer import ENCRE, PAPIER, police

ICI = Path(__file__).resolve().parent
MEDIAS = Path.home() / 'Anagnosis-medias'
LARGEUR, HAUTEUR = C.LARGEUR, C.HAUTEUR
MARGE = C.MARGE
ECRANS = {'verrou': ('verrou.mp4', 2.5), 'lecture': ('lecture.mp4', 6.0)}


def concepts():
    return {c['slug']: c for c in json.loads((ICI / 'marque.json').read_text())['concepts']}


def extraire_image(video, t, sortie):
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', str(t), '-i', str(video), '-frames:v', '1', str(sortie)], check=True)
    return Image.open(sortie).convert('RGB')


def telephone(img, hauteur):
    """L'écran de l'app dans un filet noir : rayon 0, comme les plans des Reels."""
    largeur = round(hauteur * img.width / img.height)
    img = img.resize((largeur, hauteur), Image.LANCZOS)
    cadre = Image.new('RGB', (largeur + 12, hauteur + 12), ENCRE)
    cadre.paste(img, (6, 6))
    return cadre


def palette(hauteur, largeur):
    """Les quarante encres, en grille, chacune une fois : la même que la fin de la vidéo de lancement."""
    hexes = json.loads(subprocess.run(['node', '-e', "import('./src/schema.js').then(m=>console.log(JSON.stringify(Object.values(m.ENCRES))))"],
                                      cwd=ICI.parent, capture_output=True, text=True, check=True).stdout)
    colonnes = 8
    lignes_n = -(-len(hexes) // colonnes)
    cote = min((largeur - 8 * (colonnes - 1)) // colonnes, (hauteur - 8 * (lignes_n - 1)) // lignes_n)
    img = Image.new('RGB', (colonnes * cote + 8 * (colonnes - 1), lignes_n * cote + 8 * (lignes_n - 1)), PAPIER)
    d = ImageDraw.Draw(img)
    for i, h in enumerate(hexes):
        x, y = (i % colonnes) * (cote + 8), (i // colonnes) * (cote + 8)
        h = h.lstrip('#')
        d.rectangle([x, y, x + cote - 1, y + cote - 1], fill=tuple(int(h[k:k + 2], 16) for k in (0, 2, 4)))
    return img


def main(slug, sortie):
    c = concepts()[slug]
    dossier = Path(sortie)
    dossier.mkdir(parents=True, exist_ok=True)
    img = Image.new('RGB', (LARGEUR, HAUTEUR), PAPIER)
    d = ImageDraw.Draw(img)
    # étiquette de marque, comme celle des diapositives du carrousel
    f = police('MartianMono.ttf', 26, Weight=600)
    d.rectangle([0, 130, MARGE + d.textlength('ANAGNOSIS', font=f) + 20, 184], fill=ENCRE)
    d.text((MARGE, 142), 'ANAGNOSIS', font=f, fill=PAPIER)
    y = 250
    fonte, bloc, pas = C.ajuster(d, c['titre'], lambda t: police('Newsreader.ttf', t, Weight=700, **{'Optical Size': 72}),
                                 LARGEUR - 2 * MARGE, 330, (100, 92, 84, 76, 68), interligne=1.02)
    for j, ligne in enumerate(bloc):
        d.text((MARGE, y + j * pas), ligne, font=fonte, fill=ENCRE)
    y += len(bloc) * pas + 36
    f2, b2, p2 = C.ajuster(d, c['corps'], lambda t: police('Newsreader.ttf', t, Weight=400), LARGEUR - 2 * MARGE, 250, (42, 38, 34, 31), interligne=1.35)
    for j, ligne in enumerate(b2):
        d.text((MARGE, y + j * p2), ligne, font=f2, fill=ENCRE)
    y += len(b2) * p2 + 40
    y = int(y)
    place = int(HAUTEUR - 150 - y)
    v = c['visuel']
    if v in ECRANS:
        video, t = ECRANS[v]
        ecran = extraire_image(MEDIAS / 'rushes' / video, t, dossier / 'ecran.png')
        (dossier / 'ecran.png').unlink()
        tel = telephone(ecran, min(place, 700))
        img.paste(tel, ((LARGEUR - tel.width) // 2, y + (place - tel.height) // 2))
    elif v == 'carte':
        carte = MEDIAS / 'cartes' / 'psy-pyramide-de-maslow.mp4'
        tmp = dossier / 'carte.png'
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-sseof', '-0.3', '-i', str(carte), '-frames:v', '1', '-update', '1', str(tmp)], check=True)
        cartei = Image.open(tmp).convert('RGB').crop((0, 200, 1080, 1420))
        tmp.unlink()
        tel = telephone(cartei, min(place, 700))
        img.paste(tel, ((LARGEUR - tel.width) // 2, y + (place - tel.height) // 2))
    elif v == 'encres':
        pal = palette(min(place, 640), LARGEUR - 2 * MARGE)
        img.paste(pal, (MARGE, y + (place - pal.height) // 2))
    else:
        # 'texte' : le motif de barres du site (site/index.html), en encre de Philosophie
        bleu = (0x3D, 0x55, 0x88)
        n, h, pas_b = 5, 44, 74
        haut = y + max(0, (place - (n - 1) * pas_b - h) // 2)
        for i, largeur in enumerate((936, 936, 936, 668, 936)):
            d.rectangle([MARGE + 3, haut + i * pas_b + 4, MARGE + 3 + largeur, haut + i * pas_b + 4 + h], fill=bleu)   # hors-repérage constant
        d.rectangle([MARGE, HAUTEUR - 118, LARGEUR - MARGE, HAUTEUR - 115], fill=ENCRE)
    d.text((MARGE, HAUTEUR - 96), 'ANAGNOSIS.FR', font=police('MartianMono.ttf', 30, Weight=700), fill=ENCRE)
    d.text((MARGE, HAUTEUR - 54), 'UN CONCEPT PAR JOUR, ET SA SOURCE.', font=police('MartianMono.ttf', 20, Weight=500), fill=ENCRE)
    C.grain(img).save(dossier / 'image.jpg', quality=93, subsampling=0)

    corps = f"{c['titre']}\n\n{c['corps']}"
    ig = f"{corps}\n\nUn concept par jour, et sa source. {composer.CTA.capitalize().replace('app store', 'App Store').replace('google play', 'Google Play')} → anagnosis.fr\n\n#apprendre #culturegenerale #anagnosis\n"
    x = f"{corps}\n\nanagnosis.fr\n"
    assert len(x) - len('anagnosis.fr') + 23 <= 280, f"légende X trop longue : {len(x)}"
    (dossier / 'legende-instagram.txt').write_text(ig)
    (dossier / 'legende-x.txt').write_text(x)
    print(dossier / 'image.jpg')


if __name__ == '__main__':
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    main(*sys.argv[1:])
