"""Les types de post de la chaîne (docs/passation-reseaux.md).

Un post du registre a un `type` (absent = `reel`). Chaque type a ses médias, ses légendes, et
ses plateformes : TikTok n'a que les Reels, parce que notre app TikTok n'a pas la portée photo.
"""
FICHIERS = {
    'reel': ('reel.mp4',),
    'carrousel': ('01.jpg', '02.jpg', '03.jpg', '04.jpg', '05.jpg'),
    'concept': ('image.jpg',),
}
LEGENDES = {
    'reel': ('legende-tiktok.txt', 'legende-instagram.txt', 'legende-x.txt'),
    'carrousel': ('legende-instagram.txt', 'legende-x.txt'),
    'concept': ('legende-instagram.txt', 'legende-x.txt'),
}
AVEC_TIKTOK = {'reel'}
# Deux posts par jour depuis le 2026-10-27 : le matin et le soir. Un post sans `heure` est du matin
# (tous ceux d'avant).
MATIN, SOIR = '07:30', '18:30'


def heure(p):
    return p.get('heure', MATIN)


def type_de(p):
    return p.get('type', 'reel')


def medias(p, dossier):
    return [dossier / f for f in FICHIERS[type_de(p)]]


def legendes(p, dossier):
    return [dossier / f for f in LEGENDES[type_de(p)]]


def a_tiktok(p):
    return type_de(p) in AVEC_TIKTOK


def complet(p):
    """Le post est parti partout où il devait partir."""
    return bool(p.get('instagram')) and (bool(p.get('tiktok')) or not a_tiktok(p))
