# Ligne éditoriale — Epignosis

Ce document est la référence de génération. Toute fiche produite par le pipeline
doit pouvoir être relue à l'aune de ce texte. Il complète `docs/brief-produit.md`
(§3 pour le positionnement, §5 pour le format).

## 1. Le pari éditorial

Le brief (§3) identifie un seul angle réellement libre sur le marché :
**la profondeur et la rigueur des sources, plutôt que le trivia**.

Concrètement, cela veut dire qu'une fiche Epignosis doit être *jugeable*. Un
lecteur qui connaît déjà le sujet ne doit pas hausser les épaules ; un lecteur
qui ne le connaît pas doit repartir avec quelque chose de solide, pas avec une
anecdote de dîner. C'est la contrainte la plus coûteuse du projet, et c'est la
seule qui justifie l'existence de l'app.

## 2. Format d'une fiche

| Élément | Contrainte |
|---|---|
| Titre | 3-80 caractères, nominal, sans point final |
| Accroche | 20-160 caractères — c'est le texte de la notification push |
| Corps | 380-700 mots (2-3 min de lecture attentive) |
| Citation **ou** repère | au moins l'un des deux, toujours sourcé |
| Sources | 2 minimum, réelles et vérifiables |
| Pour aller plus loin | 1-3 entrées, facultatif mais recommandé |
| Quiz | 1 question, 3-4 choix, 1 bonne réponse, 1 explication |

Le corps suit une structure en trois temps :

1. **L'accroche concrète** — une scène, une observation, une question que le
   lecteur peut se poser dans le métro. Jamais une définition en ouverture.
2. **Le mécanisme** — l'explication proprement dite, en langage courant, sans
   jargon non défini. Une notion technique introduite est une notion expliquée.
3. **Le déplacement** — ce qui change une fois qu'on a compris : une conséquence
   inattendue, une idée reçue qui tombe, un prolongement vers un autre champ.

Le troisième temps est celui qui distingue Epignosis d'une fiche Wikipédia
abrégée. S'il n'y a pas de déplacement, la fiche n'a pas lieu d'être.

## 3. Règles de rigueur

- **Aucune source inventée.** Les sources sont vérifiées en ligne au moment de la
  génération. Une source qu'on ne peut pas pointer précisément (auteur + titre +
  année, idéalement URL) ne va pas dans la fiche.
- **Aucune citation fabriquée.** C'est le champ le plus exposé au risque
  d'invention : une citation plausible mais apocryphe est indétectable par le
  lecteur et ruine la crédibilité si elle est repérée. D'où le champ `repere`
  (voir §4).
- **Les approximations pédagogiques sont explicites.** Si on simplifie, on le dit.
  Une fiche a le droit d'écrire « en première approximation », pas de laisser
  croire qu'une approximation est le fin mot de l'histoire.
- **Les idées reçues sont traitées, pas contournées.** Quand le sens commun se
  trompe sur un point (par exemple : le décalage vers le rouge cosmologique n'est
  pas un effet Doppler), c'est souvent le meilleur matériau du troisième temps.
- **Les attributions historiques sont datées et situées.** « Doppler a découvert »
  est faible ; « Doppler a lu son mémoire le 25 mai 1842 à Prague, devant cinq
  membres de la Société royale des sciences de Bohême » est vérifiable.

## 4. Citation ou repère

Le brief (§8) prévoit un champ `citation` + `citation_auteur`. En pratique, exiger
une citation d'auteur sur chaque fiche pousse mécaniquement à la fabrication : sur
beaucoup de concepts, il n'existe pas de phrase célèbre et authentifiable.

Le schéma retient donc **deux** champs, dont un au moins doit être rempli :

- `citation` — une citation véritable, avec `texte`, `auteur`, `source`
  (œuvre + année) et si possible `url`. Le validateur refuse une citation sans
  `source`.
- `repere` — un fait sourcé, frappant et chiffré, qui occupe le même emplacement
  visuel qu'une citation dans la fiche (encadré, typographie détachée). Zéro
  risque de fabrication, même fonction de respiration dans la page.

C'est un arbitrage à confirmer côté design (Lot 5) : les deux doivent avoir un
traitement graphique cohérent.

## 5. Ton

- Vouvoiement, présent de l'indicatif, phrases courtes.
- Pas d'enthousiasme performatif (« incroyable ! », « fascinant ! »). Le sujet est
  intéressant ou il ne l'est pas ; l'adjectif ne le rend pas tel.
- Pas d'adresse au lecteur en mode coach (« vous allez adorer », « prêt ? »).
- Pas de conclusion qui résume ce qui vient d'être dit. La dernière phrase ouvre,
  elle ne referme pas.
- Les nombres qui parlent (dates, ordres de grandeur, records) plutôt que les
  qualificatifs (« énorme », « très rapide »).

## 6. Quiz

Le quiz est facultatif côté lecteur (brief §6) et ne doit jamais transformer la
lecture en évaluation.

- La question porte sur **le mécanisme**, pas sur un détail mémorisable. « En
  quelle année… » est un mauvais quiz ; « Pourquoi la note bascule-t-elle au moment
  du croisement ? » est un bon quiz.
- Les mauvaises réponses sont **plausibles** : ce sont les idées reçues courantes,
  pas des remplissages absurdes. Un distracteur qu'on élimine sans réfléchir
  n'apprend rien.
- L'explication (40 caractères minimum) explique *pourquoi* les autres réponses
  sont fausses, pas seulement laquelle est vraie.

## 7. Cohérence d'un lot thématique

Quand plusieurs fiches partagent un `theme` (ici `effet-doppler`), elles forment
un pack potentiel (brief §12) et doivent :

- rester **autonomes** — chaque fiche peut tomber un jour quelconque, sans que le
  lecteur ait vu les autres ;
- ne pas se **répéter** — le mécanisme de base n'est réexpliqué nulle part ailleurs
  que dans la fiche fondatrice ; les autres y renvoient d'une phrase ;
- varier les **disciplines** et les **registres** (histoire des sciences, biologie,
  instrumentation, théorie), pour que le pack ne soit pas huit fois la même fiche.

## 8. Illustrations

Chaque fiche porte un `illustration.prompt` rédigé pour une génération locale
(brief §10). Contraintes de style, à figer avec Claude Design au Lot 5 :

- illustration conceptuelle et abstraite, pas de rendu photoréaliste ;
- pas de texte ni de chiffre dans l'image (illisible en petit, et piège classique
  des générateurs) ;
- pas de visage humain identifiable ;
- palette contrainte et constante sur toute la base, pour que 300 fiches se
  ressemblent sans se confondre.

**Exigence non négociable (brief §11) : le rendu final ne doit jamais être
identifiable comme « généré par IA ».** Les prompts actuels sont des points de
départ, pas une direction artistique validée.
