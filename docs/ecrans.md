# Écrans — Anagnosis

Référence visuelle : `design/claude-design/livraison-anagnosis/maquettes/Anagnosis - UX·UI.dc.html`. Cadre iPhone 402 × 874,
zone sûre haute 62 px, indicateur d'accueil 34 px.

## 1. Carte partageable — 1080 × 1920

Zonage, de haut en bas. Marges latérales 72 px.

| Zone | Position | Contenu |
|---|---|---|
| Encre | 0 – 35 % | Composition graphique surimprimée, peut déborder derrière le texte et hors cadre |
| Punch | 35 – 55 % | `carte.punch`, display lourd, 100 caractères max |
| Idée | 55 – 78 % | `carte.idee`, serif, 90 à 300 caractères |
| Crédit | 78 – 88 % | `carte.source_courte`, monospace sur aplat d'encre |
| Marque | 89 – 93 % | Nom de l'app + série ou pseudo, filet noir 3 px au-dessus |

**Réserves :** au moins 14 % de marge haute et 12 % de marge basse sans
information critique — les interfaces de story y superposent leurs éléments.
C'est le crédit qui fixe le plancher, jamais le texte.

**Tenue aux deux extrêmes** (maquettée, repère 1e) : à punch court (42 car.) le
corps monte à 118 px et le vide est assumé ; à punch long (97 car.) il descend à
76 px et la zone d'encre se réduit à une bande. Les zones ne bougent pas.

Variante carrée 1080 × 1080 : même hiérarchie, encre repoussée en angle
haut-droit pour libérer la colonne de texte.

**Fabrication :** l'image est composée **sur l'appareil** (décision DA §13), ce
qui permet d'y porter la série ou le pseudo du lecteur. Deux réglages
seulement — format 9:16 / 1:1, et série / pseudo. Le crédit source est affiché
comme non négociable, pas comme une option.

## 2. Navigation

**Barre de menu fixe**, présente sur les écrans de lecture (clair et sombre),
le profil et le verrou. Cinq onglets : **Aujourd'hui · Calendrier · Archive ·
Profil · Réglages**. Pas d'entrée « Menu principal » : « Aujourd'hui » *est*
l'accueil.

- Hauteur 74 px + 30 px de réserve pour l'indicateur d'accueil.
- Onglet actif : tiret plein de 3 px en bord haut de la cellule, glyphe et
  libellé en encre noire, libellé en 600. Inactif : glyphe et libellé à 40 %.
- Glyphes géométriques uniquement (carré plein, grille 3 × 3, trois filets,
  cercle, losange). Aucun pictogramme dessiné, aucun emoji.
- Cible tactile : 80 × 52 px.

Deux matériaux, réglables :

| Matériau | Fond | Bord | Notes |
|---|---|---|---|
| **Aplat riso** (défaut) | `#F4EFE1` / `#241F1A` opaque | filet d'encre 2 px | Conforme à la DA §11 |
| **Liquid Glass** | `rgba(244,239,225,.60)` / `rgba(36,31,26,.52)` | 1 px à 16 % | `backdrop-filter: blur(20px) saturate(185%)`, liseré interne `inset 0 1px 0 rgba(255,255,255,.35)` |

**Liquid Glass est une exception explicite à l'interdit « effets de verre »
(DA §11), validée et cantonnée à la barre de menu.** Le verre ne remonte ni sur
les cartes, ni sur les encadrés, ni sur la barre de titre.

**La barre de menu est visible partout, sans exception** — y compris sur le quiz, la
lecture d'une archive et l'écran d'abonnement.

La règle d'origine la retirait des « séquences » : onboarding, quiz, feuille de partage.
Elle ne tient qu'à l'onboarding, dont on ne peut effectivement pas sortir, et à la
feuille de partage, qui est une présentation du système. Partout ailleurs, à l'usage, la
navigation clignotait le temps d'une question ou d'une fiche rouverte — et une barre qui
va et vient se remarque plus que la séquence qu'elle sert. Les surimpressions sont donc
empilées **à l'intérieur** de la zone que la barre délimite, jamais en présentation
plein écran (iOS : `fullScreenCover` recouvre la fenêtre entière, barre comprise).

## 3. Écran de lecture

**Barre de titre fixe** (commune aux deux partis et au mode sombre) : elle réserve les
62 px de la barre d'état — aucun contenu ne passe sous l'heure ou la batterie —
et garde sous les yeux, pendant toute la lecture, la pastille d'encre, la
discipline, le jour, le titre de la fiche et l'avancement. Le filet de
progression forme son bord bas.

Elle est **hors du flux de défilement** : la zone scrollable commence à 116 px,
donc l'ascenseur latéral aussi — il ne remonte pas derrière le titre. Le titre
de fiche est tronqué par ellipse si nécessaire, jamais replié sur deux lignes.

Empilement : la barre de titre est en `z-index: 5`, sous la barre d'état du
système (niveau effectif 10) et au-dessus du contenu. La barre de menu est en 8.

Deux partis maquettés :

- **Encre habillée** (1f) — illustration pleine largeur en tête, encadré
  `citation` en aplat d'encre, intertitres marqués d'un filet de discipline.
- **Dépouillé** (1g) — pas d'illustration en tête : le titre entre le premier,
  la figure s'intercale dans le flux ; intertitres en monospace tiretés,
  encadré `repere` en filet plein avec étiquette d'encre.

`citation` et `repere` occupent le même emplacement et reçoivent le même poids
visuel — deux réponses au même besoin éditorial.

Le bouton de partage est un bloc plein en fin de lecture, pas une icône en coin.

**Mode sombre** (1h) : papier remplacé par le noir chaud `#241F1A`, encre de
discipline remontée en clarté, mélange en `screen`, grain conservé à 7 %.

## 4. Notification

L'accroche éditoriale sert de texte de push, telle quelle. Discipline nommée en
premier, filet d'encre de 5 px sur le bord gauche de la bannière : elle est
reconnaissable avant d'être lue. La série en cours est rappelée sous la
bannière.

## 5. Onboarding

Trois étapes. Étape 2 : sélection des disciplines + heure de notification.
La tuile sélectionnée se remplit de l'encre de la discipline — on voit la
palette de sa série se composer. Trois disciplines minimum recommandées.

Le bouton dit « Commencer demain matin », pas « Commencer » : la cadence est
posée avant la première fiche.

## 6. Quiz

Facultatif, et annoncé comme tel. Après réponse : la bonne réponse et, si elle
est fausse, la réponse choisie prennent chacune un cadre net et un texte
coloré — **vert pour la bonne, rouge pour la fausse choisie** (décision du
2026-08-27, `decisions.md`). Les distracteurs restants sont simplement barrés,
sans couleur. Ce vert/rouge est volontairement **hors** de l'encre de
discipline et du plafond de trois couleurs par surface (charte §2.3) : un
signal universel, lisible quelle que soit la discipline, prime ici sur les
deux règles qui valaient jusque-là pour cet écran. L'explication traite
**toutes** les mauvaises réponses, pas seulement la bonne. Le quiz ne compte
pas dans la série, que le lecteur ait déjà répondu ou non.

## 7. Profil

- Série en cours en display 76 px, record et total en monospace.
- Bande des jours en grille de 7 colonnes (deux semaines), faite des encres
  réellement lues : le profil est un relevé d'impression, pas une collection de
  badges. La cellule du jour est en contour, non remplie.
- Répartition par discipline en barres, nom écrit + pourcentage.
- Archive : les fiches récentes accessibles, le reste derrière Premium.

Le paywall ne vend **jamais** du volume quotidien — seulement le droit de
relire.

## 8. Verrou quotidien

Mis en scène : le compte à rebours occupe la place qu'un fil infini aurait
prise. La discipline du lendemain est annoncée — de l'attente, pas du teasing.

Deux états : sur un compte gratuit la bande basse propose l'abonnement, sur un
compte Premium elle ouvre l'archive. **Le compte à rebours ne change jamais.**

## 9. Points encore ouverts

- Nom de l'app : maquettes faites sous « Anagnosis ». Le logotype reste à dessiner.
- Prix : 3,49 € / mois et 29 € / an affichés dans le paywall, cohérents avec les
  repères marché du brief mais non tranchés.
- Encres des quatre disciplines d'extension.
- Contrastes : six des neuf encres échouent sous 4,5:1 sur papier. Elles sont
  cantonnées aux aplats et libellés forts. Les assombrir si l'on veut pouvoir
  les utiliser en libellé fin.
- Contenu : le dépôt ne contenait qu'un README au moment des maquettes. Les cinq
  fiches utilisées sont écrites à la ligne éditoriale avec des sources réelles,
  mais n'ont pas passé le validateur — à remplacer par du contenu du pipeline.
