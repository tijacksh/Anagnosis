# Logotype Anagnosis

Le mot « Anagnosis » en Newsreader (la police des titres de l'app), composé à la main :
graisse 540 et corps optique 72 pour le grand, graisse 640 et corps optique 6 pour le petit,
approche A-n rouverte. Les contours sont dessinés en chemins : aucune police à embarquer.

| Fichier | Usage |
|---|---|
| `anagnosis-logotype.svg` | Version riso : encre noire `#1B1A17`, décalée sur le jaune commun `#FFE800` (hors-repérage de 3 % du corps). Ouverture de l'app, pages, site. |
| `anagnosis-logotype-sombre.svg` | Mode sombre : papier sombre `#EDE3D0` sur noir chaud `#241F1A`, même jaune. |
| `anagnosis-logotype-noir.svg` | Un seul ton, sans décalage. Impressions et fonds où le jaune n'existe pas. |
| `anagnosis-logotype-petit.svg` | **Bas de la carte partagée (~10 px à l'échelle 1080)** et toute taille sous 14 px : corps optique bas, graisse plus forte, interlettre ouverte, un seul ton. |

Le décalage jaune n'est jamais utilisé sous 24 px de haut : il empâte les empattements.
Régénérer : `python3 fabriquer-logotype.py` (fontTools, dossier `pylib`). `planche-essais.png`
montre les tailles et le mode sombre.

Pas encore posé dans les apps : l'icône garde sa marque (barres et cercles).
