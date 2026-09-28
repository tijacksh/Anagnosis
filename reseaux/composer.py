#!/opt/homebrew/bin/python3
"""Monte un Reel 1080 × 1920 à partir de la carte rendue par l'app (docs/reseaux.md §4).

    composer.py <fiche.json> <carte.mp4> <dossier de sortie>

Produit `reel.mp4` (≈ 13 s, H.264 + AAC, moov en tête), `legende-tiktok.txt` et
`legende-instagram.txt`. Aucun texte n'est écrit ici : tout ce qui est à l'écran vient de
la carte rendue par l'app ou de la marque, et les légendes reprennent la fiche mot pour mot.

Déroulé : la carte s'imprime (5 s, rendu de l'app), reste posée le temps de lire l'idée,
puis la fin de marque. La carte est réduite et calée en haut à gauche pour que sa source
reste au-dessus de y = 1400, hors de la légende de TikTok et d'Instagram.

Dépendances : Pillow et ffmpeg. Polices : celles de l'app, sous licence OFL.
"""
import json
import os
import subprocess
import sys
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageFont

L, H = 1080, 1920
PAPIER = (0xF4, 0xEF, 0xE1)
ENCRE = (0x1B, 0x1A, 0x17)
JAUNE = (0xFF, 0xE8, 0x00)
BLEU = (0x3D, 0x55, 0x88)

# La carte est réduite à 78 % et posée à (72, 60) : sa bande de crédit (78–88 % de la
# hauteur) tombe alors vers y = 1230–1380, au-dessus de la légende des plateformes.
ECHELLE_CARTE = 0.78
X_CARTE, Y_CARTE = 72, 60
DUREE_CARTE = 5.0      # la story de l'app
TENUE = 4.0            # la carte reste posée : le temps de lire l'idée
DUREE_FIN = 4.0
FONDU = 0.3

POLICES = Path(os.environ.get(
    'ANAGNOSIS_POLICES', Path.home() / 'Anagnosis-app-tournage/Anagnosis/Ressources/Polices'))

CTA = os.environ.get('RESEAUX_CTA', "BIENTÔT SUR L'APP STORE ET GOOGLE PLAY")
ACCROCHE_FIN = 'UNE FICHE COMME CELLE-CI, CHAQUE MATIN'


def police(fichier, taille, **axes):
    f = ImageFont.truetype(str(POLICES / fichier), taille)
    noms = {a['name'].decode(): a for a in f.get_variation_axes()}
    f.set_variation_by_axes([axes.get(n, a['default']) for n, a in noms.items()])
    return f


def grain(image, force=0.045):
    """Un seul grain, sur la composition entière, en multiplication (charte §3)."""
    bruit = Image.effect_noise((L, H), 64).convert('RGB')
    blanc = Image.new('RGB', (L, H), (255, 255, 255))
    voile = Image.blend(blanc, ImageChops.invert(bruit), force)
    return ImageChops.multiply(image, voile)


def lignes(dessin, texte, fonte, largeur):
    mots, courante, sortie = texte.split(), '', []
    for m in mots:
        essai = f'{courante} {m}'.strip()
        if dessin.textlength(essai, font=fonte) <= largeur:
            courante = essai
        else:
            sortie.append(courante)
            courante = m
    sortie.append(courante)
    return sortie


def fin_de_marque(chemin):
    """La fin : la marque du site, la promesse, l'adresse. Rayon 0, pas de centrage."""
    img = Image.new('RGB', (L, H), PAPIER)
    d = ImageDraw.Draw(img)
    # Le logotype d'anagnosis.fr (site/icone.svg), à l'échelle 1,4, en haut à gauche.
    k, ox, oy = 1.4, 40, 250
    encre = Image.new('RGB', (L, H), (255, 255, 255))
    de = ImageDraw.Draw(encre)
    # Hors-repérage constant sur l'encre de couleur seulement : +2 px en x, +3 px en y.
    de.ellipse([ox + 2 + (330 - 150) * k, oy + 3 + (182 - 150) * k,
                ox + 2 + (330 + 150) * k, oy + 3 + (182 + 150) * k], fill=BLEU)
    img = ImageChops.multiply(img, encre)
    # Le jaune sur un aplat d'encre ne se multiplie pas — il virerait au vert sombre : il
    # s'imprime en encre opaque à 95 % (charte §2.4, exception).
    masque = Image.new('L', (L, H), 0)
    ImageDraw.Draw(masque).ellipse([ox + (356 - 112) * k, oy + (206 - 112) * k,
                                    ox + (356 + 112) * k, oy + (206 + 112) * k], fill=242)
    img.paste(Image.new('RGB', (L, H), JAUNE), (0, 0), masque)
    d = ImageDraw.Draw(img)
    d.rectangle([ox + 86 * k, oy + 330 * k, ox + 236 * k, oy + 364 * k], fill=ENCRE)
    d.rectangle([ox + 86 * k, oy + 392 * k, ox + 334 * k, oy + 426 * k], fill=ENCRE)
    d.rectangle([ox + 86 * k, oy + 118 * k, ox + 120 * k, oy + 268 * k], fill=ENCRE)

    x, y = 72, 930
    mono = police('MartianMono.ttf', 26, Weight=600)
    d.text((x, y), ACCROCHE_FIN, font=mono, fill=ENCRE, spacing=0)
    y += 70
    display = police('BricolageGrotesque.ttf', 92, Weight=800, **{'Optical size': 96})
    for ligne in lignes(d, 'Un concept par jour, et sa source.', display, 860):
        d.text((x, y), ligne, font=display, fill=ENCRE)
        y += 90
    y += 50
    d.rectangle([x, y, x + 520, y + 3], fill=ENCRE)
    y += 30
    d.text((x, y), 'ANAGNOSIS.FR', font=police('MartianMono.ttf', 44, Weight=700), fill=ENCRE)
    y += 76
    d.text((x, y), CTA, font=police('MartianMono.ttf', 22, Weight=500), fill=ENCRE)
    assert y + 40 < 1400, 'la fin de marque déborde de la zone sûre'
    grain(img).save(chemin)


def son(chemin, duree):
    """Un son fabriqué ici : une frappe de presse toutes les demi-secondes, une nappe grave."""
    subprocess.run([
        'ffmpeg', '-v', 'error', '-y',
        '-f', 'lavfi', '-i', f"aevalsrc='0.9*sin(2*PI*(55+60*exp(-40*mod(t,0.5)))*mod(t,0.5))*exp(-9*mod(t,0.5))':s=48000:d={duree}",
        '-f', 'lavfi', '-i', f'anoisesrc=d={duree}:c=pink:r=48000:a=0.5',
        '-f', 'lavfi', '-i', f"aevalsrc='0.12*sin(2*PI*110*t)+0.08*sin(2*PI*164.8*t)+0.06*sin(2*PI*220*t)':s=48000:d={duree}",
        '-filter_complex',
        "[1]highpass=f=3000,volume='0.25*exp(-30*mod(t-0.25,0.5))':eval=frame[h];"
        "[2]tremolo=f=0.25:d=0.4,volume=0.8[p];"
        f"[0][h][p]amix=inputs=3:normalize=0,afade=t=in:d=0.3,afade=t=out:st={duree - 1.2}:d=1.2,"
        "alimiter=limit=0.8,loudnorm=I=-14:TP=-1.5[a]",
        '-map', '[a]', '-ac', '2', '-c:a', 'aac', '-b:a', '192k', str(chemin)], check=True)


def reel(carte, fin, audio, sortie):
    largeur = int(L * ECHELLE_CARTE) // 2 * 2
    duree_carte = DUREE_CARTE + TENUE
    total = duree_carte + DUREE_FIN - FONDU
    filtre = (
        f"color=c=0xF4EFE1:s={L}x{H}:r=30:d={duree_carte}[fond];"
        f"[0:v]scale={largeur}:-2,tpad=stop_mode=clone:stop_duration={TENUE}[c];"
        f"[fond][c]overlay={X_CARTE}:{Y_CARTE}:shortest=1,format=yuv420p[a];"
        f"[1:v]loop=loop=-1:size=1,trim=duration={DUREE_FIN},fps=30,format=yuv420p,setpts=PTS-STARTPTS[b];"
        f"[a][b]xfade=transition=wipeup:duration={FONDU}:offset={duree_carte - FONDU}[v]"
    )
    subprocess.run([
        'ffmpeg', '-v', 'error', '-y', '-i', str(carte), '-i', str(fin), '-i', str(audio),
        '-filter_complex', filtre, '-map', '[v]', '-map', '2:a', '-t', f'{total}',
        '-c:v', 'libx264', '-profile:v', 'high', '-pix_fmt', 'yuv420p', '-r', '30', '-crf', '18',
        '-c:a', 'copy', '-movflags', '+faststart', str(sortie)], check=True)
    return total


HASHTAGS = {'droit': '#droit', 'medecine': '#sante', 'histoire_art': '#histoiredelart',
            'climat': '#climat', 'geologie': '#geologie'}


def legendes(fiche, dossier):
    discipline = fiche['discipline']
    tag = HASHTAGS.get(discipline.split('_')[0] if discipline.startswith('droit') else discipline,
                       '#' + discipline.replace('_', ''))
    carte = fiche['carte']
    corps = (f"{fiche['accroche']}\n\n"
             f"Source : {carte['source_courte']}\n\n"
             f"Une fiche comme celle-ci, chaque matin, en trois minutes. "
             f"{CTA.capitalize().replace('app store', 'App Store').replace('google play', 'Google Play')} → anagnosis.fr")
    communs = f'#apprendre #culturegenerale {tag}'
    # TikTok ajoute lui-même #Anagnosis à un brouillon venu de notre app : pas de doublon.
    (dossier / 'legende-tiktok.txt').write_text(f'{corps}\n\n{communs}\n')
    (dossier / 'legende-instagram.txt').write_text(f'{corps}\n\n{communs} #anagnosis\n')
    for f in ('legende-tiktok.txt', 'legende-instagram.txt'):
        assert len((dossier / f).read_text()) <= 2200


def main(fiche_json, carte_mp4, sortie):
    dossier = Path(sortie)
    dossier.mkdir(parents=True, exist_ok=True)
    fiche = json.loads(Path(fiche_json).read_text())
    fin = dossier / 'fin.png'
    fin_de_marque(fin)
    audio = dossier / 'son.m4a'
    total = DUREE_CARTE + TENUE + DUREE_FIN - FONDU
    son(audio, total)
    reel(carte_mp4, fin, audio, dossier / 'reel.mp4')
    legendes(fiche, dossier)
    fin.unlink()
    audio.unlink()
    print(dossier / 'reel.mp4')


if __name__ == '__main__':
    if len(sys.argv) != 4:
        sys.exit(__doc__)
    main(*sys.argv[1:])
