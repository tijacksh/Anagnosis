# Ligne éditoriale — Anagnosis

Ce document est la référence de génération. Toute fiche produite par le pipeline
doit pouvoir être relue à l'aune de ce texte. Il complète `docs/brief-produit.md`
(§3 pour le positionnement, §5 pour le format).

## 1. Le pari éditorial

Le brief (§3) identifie un seul angle réellement libre sur le marché :
**la profondeur et la rigueur des sources, plutôt que le trivia**.

Concrètement, cela veut dire qu'une fiche Anagnosis doit être *jugeable*. Un
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

Le troisième temps est celui qui distingue Anagnosis d'une fiche Wikipédia
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

### 3.1 Le droit, et le seul angle mort de la chaîne

Toutes les autres disciplines énoncent des choses qui restent vraies là où le lecteur se
trouve et le resteront l'an prochain. **Le droit est la première où une fiche peut
devenir fausse sans que personne n'y touche**, de deux façons :

- **La juridiction.** L'app est en français, donc lue en France, en Belgique, en Suisse,
  au Québec et en Afrique francophone. « Le délai de prescription est de X » est exact
  dans un pays et faux dans les quatre autres, sans qu'un mot de la fiche ait bougé.
- **La mutabilité.** Un texte est modifié et la fiche ment à partir de ce jour-là.

Le second cas est le plus grave parce que **`/controler` ne le voit pas**. Le contrôle
vérifie que la fiche dit ce que dit la source ; or l'article de 2015 dit toujours en 2030
ce qu'il disait en 2015. La source reste exacte, la fiche est devenue fausse, et la
routine passe sans rien signaler. C'est le même genre de défaut silencieux et durable que
l'audio produit à partir d'un texte périmé, et il se traite de la même façon : par une
règle en amont, pas par une vigilance en aval.

**La règle : écrire le droit comme histoire et comme idée, jamais comme état actuel d'une
règle en vigueur.** Le Statute of Anne de 1710 ne peut pas se périmer ; « la durée du
droit d'auteur en France » se périme. Ce qui fait le troisième temps d'une fiche de droit,
c'est d'où vient la règle, quel problème elle réglait, ou ce que son invention a révélé,
jamais ce qu'elle dispose aujourd'hui.

Trois conséquences pratiques :

1. **Une fiche dont le cœur est le contenu actuel d'une norme ne s'écrit pas.** Ce n'est
   pas une question de difficulté, c'est qu'elle a une date de péremption qu'aucune
   routine ne saura lire.
2. **Toute règle citée est datée et située dans la fiche même** — « la loi française du
   9 avril 1898 », pas « la loi ». Le lecteur belge doit pouvoir voir tout de suite que
   la fiche ne parle pas de chez lui.
3. **Le droit comparé est un atout, pas une complication.** Deux pays qui tranchent
   différemment la même question donnent un troisième temps que rien d'autre ne donne, et
   la divergence, elle, est stable.

En retour, le sourçage juridique est **plus facile** qu'ailleurs : Légifrance, EUR-Lex,
HUDOC, Gallica, Wikisource et Cornell LII ont tous des adresses stables, ce qui rend la
règle 4 de `CLAUDE.md` moins coûteuse à tenir en droit que dans la plupart des
disciplines.

La vérification périodique de ces deux points a sa propre routine,
`.claude/commands/controler-droit.md`, distincte du contrôle ordinaire.

## 4. Citation ou repère

Le brief (§8) prévoit un champ `citation` + `citation_auteur`. En pratique, exiger
une citation d'auteur sur chaque fiche pousse mécaniquement à la fabrication : sur
beaucoup de concepts, il n'existe pas de phrase célèbre et authentifiable.

**Décidé (voir `docs/decisions.md`) : les deux, selon ce qui existe réellement.**
Une vraie citation quand il y en a une ; un repère sinon. Jamais de citation
reconstituée pour remplir l'emplacement.

Le schéma retient donc **deux** champs, dont un au moins doit être rempli :

- `citation` — une citation véritable, avec `texte`, `auteur`, `source`
  (œuvre + année) et si possible `url`. Le validateur refuse une citation sans
  `source`.
- `repere` — un fait sourcé, frappant et chiffré, qui occupe le même emplacement
  visuel qu'une citation dans la fiche (encadré, typographie détachée). Zéro
  risque de fabrication, même fonction de respiration dans la page.

Reste à traiter au Lot 5 : les deux occupent le même emplacement et doivent
recevoir un traitement graphique cohérent.

## 5. Ton

- Vouvoiement, présent de l'indicatif, phrases courtes.
- Pas d'enthousiasme performatif (« incroyable ! », « fascinant ! »). Le sujet est
  intéressant ou il ne l'est pas ; l'adjectif ne le rend pas tel.
- Pas d'adresse au lecteur en mode coach (« vous allez adorer », « prêt ? »).
- Pas de conclusion qui résume ce qui vient d'être dit. La dernière phrase ouvre,
  elle ne referme pas.
- **Aucun tiret cadratin (—) ni emoji** dans le texte lu, et aucune formule de pitch
  (« révolutionnaire », « plongeons dans »…). Voir `docs/criteres-vibecode.md` : ces signes
  trahissent un texte écrit en série ; le validateur les refuse.
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

## 8. La carte partageable

Le partage en story est le moteur de croissance retenu (`docs/decisions.md`). La
carte n'est donc pas un sous-produit de la fiche : c'est souvent le **premier**
contact avec le produit, et parfois le seul. Elle s'écrit avec la fiche.

Trois champs, tous obligatoires dès que `carte` est renseignée :

| Champ | Rôle | Limite |
|---|---|---|
| `punch` | l'accroche qui arrête le pouce | 100 caractères |
| `idee` | l'idée, complète et autonome | 90-300 caractères |
| `source_courte` | le crédit affiché sur le visuel | 60 caractères |

Règles d'écriture :

- **La carte doit tenir debout sans l'app.** Quelqu'un qui la voit en story et ne
  télécharge rien doit malgré tout avoir appris quelque chose. Une carte qui n'est
  qu'une bande-annonce (« vous ne devinerez jamais pourquoi… ») trahit la
  proposition de valeur : c'est exactement le teasing creux qu'on prétend remplacer.
- **`source_courte` n'est jamais vide.** C'est le seul élément qui distingue notre
  carte d'une infographie anonyme. « Arendt, 1963 » ou « Nature, 1995 » en bas
  d'un visuel, c'est la différence entre une affirmation et une affirmation
  vérifiable — et c'est tout le positionnement, rendu visible en un coup d'œil.
- **Pas de superlatif, pas de chiffre rond inventé.** Le `punch` accroche par le
  contenu, jamais par l'emballage.

## 9. Illustrations et direction visuelle

**Direction retenue : graphique, coloré, assumé.** Le référent n'est pas le manuel
scolaire, c'est le compte Instagram ou TikTok qui explique un concept en une slide
— sauf que le nôtre est sourcé.

C'est le point important, et il lève une contradiction apparente : **la crédibilité
est portée par la source affichée, pas par une palette austère.** Une fiche sourcée
peut donc être visuellement franche, saturée, ludique, sans rien perdre de son
sérieux. Le gris et le serif ne sont pas des preuves ; la référence en est une.

Contraintes de style, à figer avec Claude Design au Lot 5 :

- formes géométriques nettes, aplats saturés, contrastes francs — lisible en
  vignette comme en plein écran vertical ;
- illustration **conceptuelle**, jamais décorative : la forme dit quelque chose du
  concept, elle ne remplit pas un cadre ;
- pas de texte ni de chiffre dans l'image (illisible en petit, et piège classique
  des générateurs) ;
- pas de visage humain identifiable ;
- palette large mais **systématique** — une famille de couleurs par discipline
  serait un candidat sérieux, pour que la discipline se reconnaisse avant d'être lue.

**Exigence non négociable (brief §11) : le rendu final ne doit jamais être
identifiable comme « généré par IA ».** C'est le vrai risque du registre coloré :
le dégradé violet-bleu, les formes molles et les compositions centrées sont
précisément la signature des générateurs. « Coloré » doit vouloir dire *graphique
et composé*, pas *effet automatique*. Les prompts actuels sont des points de départ,
pas une direction artistique validée.
