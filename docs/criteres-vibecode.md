# Les 17 signes d'un produit fait en série, et comment Anagnosis les évite

Décision du 2026-10-18 (Arnaud). Ces 17 signes trahissent un site, une app ou un texte produit sans œil. Ce sont des **critères d'exclusion** : un livrable qui en porte un n'est pas publié. Ils s'appliquent aux fiches, au site, à l'app, aux cartes et aux vidéos des réseaux.

État relevé le 2026-10-18 : 12 absents, 2 à la limite, 3 présents. Le n° 14 (tirets cadratins), le n° 12 (couple grotesque + serif) et le n° 7 (surtitre en capitales) sont corrigés le jour même ; le n° 14 est contrôlé par le validateur. Reste le n° 15, que le câblage des boutons des stores traitera.

| n° | Signe | Dans Anagnosis | Contrôle |
|---|---|---|---|
| 1 | Icônes Lucide | aucune librairie d'icônes ; un seul SVG dessiné ; zéro SF Symbol dans l'app | revue |
| 2 | Titres en dégradé | aucun dégradé de texte | revue |
| 3 | Emojis dans les titres | aucun, ni dans les fiches ni dans les cartes | **validateur** (erreur, tous les champs lus) |
| 4 | Glassmorphism | pas de flou d'arrière-plan sur le site ; seule la barre d'onglets iOS utilise le matériau système | revue |
| 5 | Bordures colorées | bordures neutres (encre, filet) ; le rouge n'apparaît que pour une erreur de saisie | revue |
| 6 | Animations trop lentes | 0,12 à 0,28 s, jamais au-delà de 0,3 s | revue |
| 7 | Badge sur le titre | corrigé sur le site le 2026-10-18 : surtitre en minuscules, mono 13 px, sans capitales ni fond. Reste les étiquettes à fond plein des cartes réseaux (« Quiz · facultatif ») : à surveiller | revue |
| 8 | Buzzwords partout | prose sobre, pas de vocabulaire de pitch | **validateur** (alerte, liste dans `src/texte-lu.js`) |
| 9 | Espacements inégaux | échelle régulière | revue |
| 10 | Fondu à l'apparition au défilement | aucun | revue |
| 11 | Graphiques shadcn bruts | aucun graphique | revue |
| 12 | Space Grotesk + serif | corrigé le 2026-10-18 : Newsreader (titres en graisse forte, corps) + Martian Mono ; plus de grotesque, partout (site, apps, cartes). Ne pas réintroduire Space Grotesk, Inter ni Bricolage | revue |
| 13 | Grain sur dégradé | grain global voulu par la charte, **jamais sur un dégradé** | revue |
| 14 | Tirets cadratins | zéro dans le texte lu | **validateur** (erreur) |
| 15 | Boutons fantômes qui se remplissent au survol | le style existe dans le CSS (`.store-bouton:hover`) mais les boutons des stores sont inertes ; à remplacer par un état plein dès l'ouverture des stores | revue |
| 16 | Boutons qui s'élèvent au survol | ni translation ni ombre | revue |
| 17 | Pages ultra lentes | accueil 31 Ko, 0,09 s ; polices non bloquantes | revue |

## Pour les fiches (routines de production, de contrôle, de réparation, de relecture, de questions, de cartes)

- **Aucun tiret cadratin (—)** dans le titre, l'accroche, le contenu, le repère, la carte et le quiz. À la place : une virgule (suite de phrase), des deux-points (explication, énumération, chiffre), des parenthèses (incise longue ou qui porte déjà de la ponctuation), ou un point.
- Les **citations** restent telles qu'elles sont, tirets compris : on ne corrige pas un verbatim. Un titre de source reste celui de la source.
- **Aucun emoji** dans le texte lu.
- Pas de formule de pitch : « révolutionnaire », « game changer », « plongeons dans », « à l'ère de », « incontournable »… Le sujet est intéressant ou il ne l'est pas (`docs/ligne-editoriale.md` §5).
- `npm run validate` refuse la fiche qui porte un tiret cadratin ou un emoji ; il alerte sur les mots creux. Sortie à zéro erreur avant tout commit.
- Corriger sans rien relancer : `node src/sans-tiret.js` (essai à blanc) puis `--write`. L'outil recalcule l'empreinte de contrôle et celle de l'audio des fiches qui étaient à jour : une ponctuation ne remet ni contrôle ni voix en file.

## Pour le site, l'app, les cartes et les vidéos

Avant toute modification de l'interface, d'une carte ou d'une vidéo, vérifier les 17 lignes du tableau. En cas de doute, c'est non. Les valeurs (couleur, grain, typographie) restent celles de `docs/charte-visuelle.md`.
