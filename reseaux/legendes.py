"""Légendes des plateformes qui en ont une courte. Partagé par composer.py et deposer.py."""
import re

LIMITE_X = 280
LONGUEUR_LIEN = 23  # X compte tout lien pour 23 caractères, quelle que soit sa longueur
LIEN = 'anagnosis.fr'


def longueur_x(texte):
    """Longueur telle que X la compte (les liens valent 23)."""
    return len(re.sub(re.escape(LIEN), '', texte)) + LONGUEUR_LIEN * texte.count(LIEN)


def legende_x(fiche):
    """L'accroche, la source et le lien, repris de la fiche : rien d'inventé, pas de hashtag.

    Le texte d'appel de l'app (« Bientôt sur l'App Store… ») est trop long pour 280 caractères.
    """
    texte = f"{fiche['accroche']}\n\nSource : {fiche['carte']['source_courte']}\n\n{LIEN}\n"
    assert longueur_x(texte) <= LIMITE_X, f"légende X trop longue ({longueur_x(texte)} > {LIMITE_X})"
    return texte
