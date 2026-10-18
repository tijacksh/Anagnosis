#!/opt/homebrew/bin/python3
"""Fabrique le carrousel d'une fiche : cinq images 1080 × 1350 (4:5), en JPEG.

    carrousel.py <fiche.json> <carte.mp4> <dossier de sortie>

1. la carte de la fiche, rendue par l'app (dernière image de sa vidéo, format Reel), recadrée ;
2. ce que la fiche développe : ses intertitres, jamais son texte ;
3. le quiz de la fiche : la question et ses quatre réponses ;
4. la réponse, comme dans l'app : cadre vert, autres réponses barrées, sans l'explication ;
5. la fin de marque.

Aucun texte n'est inventé : tout vient de la fiche validée, ou est une étiquette fixe de la
marque. Écrit aussi `legende-instagram.txt` et `legende-x.txt` (X prend les quatre premières
images). Mêmes polices, encres, grain et règles que composer.py (charte : rayon 0, une encre
de discipline, grain une seule fois, jamais de dégradé).
"""
import json
import re
import subprocess
import sys
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw

import composer
from composer import ENCRE, JAUNE, L, PAPIER, police

LARGEUR, HAUTEUR = 1080, 1350
VERT = (0x1F, 0x7A, 0x4C)      # correct, comme l'app (Signal.correctClair)
MARGE = 72
ZONE_HAUT, ZONE_BAS = 130, HAUTEUR - 130


def encre_discipline(discipline):
    depot = Path(__file__).resolve().parent.parent
    sortie = subprocess.run(
        ['node', '-e', "import('./src/schema.js').then(m=>console.log(JSON.stringify(m.ENCRES)))"],
        cwd=depot, capture_output=True, text=True, check=True).stdout
    h = json.loads(sortie)[discipline].lstrip('#')
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def grain(image, force=0.045):
    bruit = Image.effect_noise(image.size, 64).convert('RGB')
    blanc = Image.new('RGB', image.size, (255, 255, 255))
    return ImageChops.multiply(image, Image.blend(blanc, ImageChops.invert(bruit), force))


def lignes(d, texte, fonte, largeur):
    return composer.lignes(d, texte, fonte, largeur)


def ajuster(d, texte, fabrique, largeur, hauteur_max, tailles, interligne=1.25):
    """La plus grande taille de la liste pour laquelle le texte tient dans la boîte."""
    for t in tailles:
        fonte = fabrique(t)
        bloc = lignes(d, texte, fonte, largeur)
        if len(bloc) * t * interligne <= hauteur_max:
            return fonte, bloc, t * interligne
    raise ValueError(f'texte trop long pour la boîte : {texte[:60]}…')


def etiquette(d, y, texte, encre, papier=PAPIER):
    """Une étiquette mono sur aplat d'encre, comme la bande du crédit de la carte."""
    f = police('MartianMono.ttf', 26, Weight=600)
    l = d.textlength(texte.upper(), font=f) + 40
    d.rectangle([0, y, MARGE + l - 20, y + 54], fill=encre)
    d.text((MARGE, y + 12), texte.upper(), font=f, fill=papier)
    return y + 54


def nouveau():
    return Image.new('RGB', (LARGEUR, HAUTEUR), PAPIER)


def pied(d, encre_ligne=ENCRE):
    d.rectangle([MARGE, HAUTEUR - 118, LARGEUR - MARGE, HAUTEUR - 115], fill=ENCRE)
    d.text((MARGE, HAUTEUR - 96), 'ANAGNOSIS', font=police('Newsreader.ttf', 30, Weight=700, **{'Optical Size': 72}), fill=ENCRE)
    d.text((MARGE, HAUTEUR - 56), 'UN CONCEPT PAR JOUR · ANAGNOSIS.FR · @ANAGNOSIS_APP',
           font=police('MartianMono.ttf', 20, Weight=500), fill=ENCRE)


def diapo_carte(carte_mp4, sortie):
    tmp = Path(sortie).with_suffix('.png')
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-sseof', '-0.3', '-i', str(carte_mp4),
                    '-frames:v', '1', '-update', '1', str(tmp)], check=True)
    img = Image.open(tmp).convert('RGB')
    assert img.size == (1080, 1920), img.size
    # Le texte de la carte au format Reel tient entre y = 230 et y = 1400 : on garde 95–1445.
    img.crop((0, 95, LARGEUR, 95 + HAUTEUR)).save(sortie, quality=93, subsampling=0)
    tmp.unlink()


def diapo_developpe(fiche, encre, sortie):
    img = nouveau()
    d = ImageDraw.Draw(img)
    y = etiquette(d, ZONE_HAUT, 'La fiche développe', encre)
    titres = re.findall(r'^## (.*)$', fiche['contenu_vulgarise'], re.M)
    assert titres, 'fiche sans intertitre'
    y += 70
    mono = police('MartianMono.ttf', 26, Weight=600)
    for i, titre in enumerate(titres[:5], 1):
        d.text((MARGE, y + 8), f'{i:02d}', font=mono, fill=encre)
        fonte, bloc, pas = ajuster(d, titre, lambda t: police('Newsreader.ttf', t, Weight=700, **{'Optical Size': 72}),
                                   LARGEUR - 2 * MARGE - 120, 140, (72, 64, 56, 50, 44), interligne=1.05)
        for j, ligne in enumerate(bloc):
            d.text((MARGE + 110, y + j * pas), ligne, font=fonte, fill=ENCRE)
        y += max(len(bloc) * pas, 60) + 46
        d.rectangle([MARGE + 110, y - 24, LARGEUR - MARGE, y - 22], fill=ENCRE)
    assert y < ZONE_BAS - 200, 'trop d\'intertitres'
    duree = fiche.get('duree_lecture_min')
    n = len(fiche.get('sources', []))
    d.text((MARGE, ZONE_BAS - 150), f"{duree} MIN DE LECTURE · {n} SOURCES" if duree else f'{n} SOURCES',
           font=police('MartianMono.ttf', 26, Weight=600), fill=ENCRE)
    d.text((MARGE, ZONE_BAS - 106), "La fiche, en entier, dans l'app.", font=police('Newsreader.ttf', 40, Weight=400), fill=ENCRE)
    pied(d)
    grain(img).save(sortie, quality=93, subsampling=0)


def diapo_quiz(fiche, encre, sortie, reponse=False):
    q = fiche['quiz']
    img = nouveau()
    d = ImageDraw.Draw(img)
    y = etiquette(d, ZONE_HAUT, 'Quiz · la réponse' if reponse else 'Quiz · facultatif', encre)
    y += 40
    fonte, bloc, pas = ajuster(d, q['question'], lambda t: police('Newsreader.ttf', t, Weight=700, **{'Optical Size': 72}),
                               LARGEUR - 2 * MARGE, 270, (64, 58, 52, 46, 42), interligne=1.08)
    for j, ligne in enumerate(bloc):
        d.text((MARGE, y + j * pas), ligne, font=fonte, fill=ENCRE)
    y += len(bloc) * pas + 40
    # Cadres de la hauteur de leur texte : une seule taille de réponse pour les quatre, la plus
    # grande qui tienne, et chaque cadre ajusté à ses lignes (texte centré dans le cadre). Le
    # bloc entier est centré dans la place restante : plus de vide sous une réponse courte.
    reste = ZONE_BAS - 70 - y
    largeur_texte = LARGEUR - 2 * MARGE - 130
    marge_cadre, ecart = 30, 24
    for taille in (46, 42, 38, 34, 31, 28, 25):
        f2 = police('Newsreader.ttf', taille, Weight=400)
        pas = taille * 1.22
        blocs = [lignes(d, choix, f2, largeur_texte) for choix in q['choix']]
        hauteurs = [len(b2) * pas + 2 * marge_cadre for b2 in blocs]
        if sum(hauteurs) + 3 * ecart <= reste:
            break
    y += max(0, reste - (sum(hauteurs) + 3 * ecart)) // 2
    lettre = police('MartianMono.ttf', 26, Weight=600)
    for i, (choix, b2) in enumerate(zip(q['choix'], blocs)):
        bon = i == q['bonne_reponse']
        couleur, epais = (VERT, 6) if (reponse and bon) else (ENCRE, 3)
        haut, h = y, hauteurs[i]
        d.rectangle([MARGE, haut, LARGEUR - MARGE, haut + h], outline=couleur, width=epais)
        d.text((MARGE + 24, haut + h / 2), 'ABCD'[i], font=lettre, fill=couleur, anchor='lm')
        for j, ligne in enumerate(b2):
            yy = haut + marge_cadre + j * pas
            d.text((MARGE + 90, yy), ligne, font=f2, fill=(couleur if reponse and bon else ENCRE))
            if reponse and not bon:                      # barrée, sans couleur : comme dans l'app
                w = d.textlength(ligne, font=f2)
                d.line([(MARGE + 90, yy + pas * 0.55), (MARGE + 90 + w, yy + pas * 0.55)], fill=(0x8A, 0x83, 0x75), width=3)
        y += h + ecart
    if reponse:
        d.text((MARGE, ZONE_BAS - 50), "Dans l'app, chaque réponse est expliquée, les fausses aussi.",
               font=police('Newsreader.ttf', 30, Weight=400), fill=ENCRE)
    pied(d)
    grain(img).save(sortie, quality=93, subsampling=0)


def diapo_fin(encre, sortie):
    img = nouveau()
    k, oy = 0.9, 170
    ox = (LARGEUR - (480 - 86) * k) / 2 - 86 * k
    couche = Image.new('RGB', img.size, (255, 255, 255))
    ImageDraw.Draw(couche).ellipse([ox + 2 + (330 - 150) * k, oy + 3 + (182 - 150) * k,
                                    ox + 2 + (330 + 150) * k, oy + 3 + (182 + 150) * k], fill=(0x3D, 0x55, 0x88))
    img = ImageChops.multiply(img, couche)
    masque = Image.new('L', img.size, 0)
    ImageDraw.Draw(masque).ellipse([ox + (356 - 112) * k, oy + (206 - 112) * k, ox + (356 + 112) * k, oy + (206 + 112) * k], fill=242)
    img.paste(Image.new('RGB', img.size, JAUNE), (0, 0), masque)
    d = ImageDraw.Draw(img)
    for x, yy, l, h in ((86, 118, 34, 150), (86, 330, 150, 34), (86, 386, 248, 34)):
        d.rectangle([ox + x * k, oy + yy * k, ox + (x + l) * k, oy + (yy + h) * k], fill=ENCRE)
    y = oy + 426 * k + 60
    composer.centre(d, y, 'ANAGNOSIS', police('MartianMono.ttf', 36, Weight=600), espacement=12)
    y += 92
    for ligne in ('Un concept par jour,', 'et sa source.'):
        d.text(((LARGEUR - d.textlength(ligne, font=police('Newsreader.ttf', 84, Weight=700, **{'Optical Size': 72}))) / 2, y),
               ligne, font=police('Newsreader.ttf', 84, Weight=700, **{'Optical Size': 72}), fill=ENCRE)
        y += 88
    y += 44
    composer.centre(d, y, 'ANAGNOSIS.FR', police('MartianMono.ttf', 34, Weight=700), espacement=4)
    y += 56
    composer.centre(d, y, composer.CTA, police('MartianMono.ttf', 20, Weight=500), espacement=2)
    grain(img).save(sortie, quality=93, subsampling=0)


def main(fiche_json, carte_mp4, sortie):
    dossier = Path(sortie)
    dossier.mkdir(parents=True, exist_ok=True)
    fiche = json.loads(Path(fiche_json).read_text())
    encre = encre_discipline(fiche['discipline'])
    diapo_carte(carte_mp4, dossier / '01.jpg')
    diapo_developpe(fiche, encre, dossier / '02.jpg')
    diapo_quiz(fiche, encre, dossier / '03.jpg')
    diapo_quiz(fiche, encre, dossier / '04.jpg', reponse=True)
    diapo_fin(encre, dossier / '05.jpg')
    composer.legendes(fiche, dossier)
    ig = dossier / 'legende-instagram.txt'
    ig.write_text(ig.read_text().replace('\n\nEn bref ici.', "\n\nLe quiz de la fiche : dans les images suivantes.\n\nEn bref ici.", 1))
    for f in (dossier / 'legende-tiktok.txt',):
        f.unlink(missing_ok=True)
    for i in range(1, 6):
        assert (dossier / f'{i:02d}.jpg').stat().st_size < 8_000_000
    print(dossier)


if __name__ == '__main__':
    if len(sys.argv) != 4:
        sys.exit(__doc__)
    main(*sys.argv[1:])
