# Idées de fiches

Une réserve de thèmes candidats, pas une file de production. `src/cible.js` décide
seul, à chaque instant, quelle discipline alimenter et dans quel ordre — ce fichier
ne le remplace pas et ne le contraint pas : il évite seulement de repartir de zéro
quand on cherche un sujet, et sert de point de départ à `/produire` ou à une
proposition à la main.

Chaque ligne est un thème resserré sur un fait ou un épisode précis, pas un sujet
d'ensemble — cohérent avec `docs/ligne-editoriale.md` : « la scientificité de la
psychologie » ne devient une fiche que ramenée à un épisode concret (voir les
fiches d'épistémologie déjà versées pour la méthode). Aucune de ces idées n'a
encore de source vérifiée : c'est la première chose à faire avant d'écrire quoi
que ce soit, jamais l'inverse.

**Quand un thème devient une fiche, retirer la ligne correspondante.** Un thème
qui reste ici après avoir été traité fait chercher une source vérifiée pour rien.

## Priorité : les disciplines les plus minces

D'après `npm run cible`, au 28/08/2026.

### Droit social (6 fiches publiables — la plus mince du corpus)

- La loi Le Chapelier (1791) : la France interdit corporations et coalitions
  ouvrières au nom de la liberté individuelle, pour près d'un siècle.
- La grève de Pullman (1894, États-Unis) : brisée par l'armée fédérale, elle est
  suivie six jours plus tard par la création, au Congrès, d'une fête du Travail
  nationale — comme concession posthume aux grévistes.
- Le Wagner Act (1935, National Labor Relations Act) : la première reconnaissance
  fédérale, aux États-Unis, du droit de se syndiquer.
- Les accords de Grenelle (mai 1968) : une hausse de 25 % du SMIC négociée en un
  seul week-end de discussions.
- La convention n° 87 de l'Organisation internationale du travail (1948) sur la
  liberté syndicale.

### Cinéma (8 fiches publiables)

- L'arrêt *United States v. Paramount Pictures* (1948) : la Cour suprême force les
  studios hollywoodiens à vendre leurs salles, mettant fin à l'intégration
  verticale du système des studios.
- Le Dogme 95 (1995, Lars von Trier et Thomas Vinterberg) et son « vœu de
  chasteté » contre les effets spéciaux et la lumière artificielle.
- La première projection payante des frères Lumière, le 28 décembre 1895 au Grand
  Café de Paris.
- La liste noire hollywoodienne des années 1950 et les « Dix de Hollywood »,
  condamnés pour outrage au Congrès plutôt que pour un délit lié à leur métier.

### Musique (8 fiches publiables)

- Alan Freed, qui popularise le terme « rock and roll » à la radio au début des
  années 1950, et le scandale de la Payola qui met fin à sa carrière en 1959-1960.
- La création du disque 33 tours par Columbia (1948) et la « guerre des vitesses »
  qui l'oppose au 45 tours de RCA Victor.
- Le procès *Gaye v. Thicke* (« Blurred Lines », 2015) : la succession de Marvin
  Gaye obtient gain de cause sur un plagiat de sensation musicale plutôt que de
  mélodie ou de paroles, une décision qui inquiète une partie de l'industrie.

### Architecture (9 fiches publiables)

- La Charte d'Athènes (1933, CIAM, sous l'influence de Le Corbusier) et le zonage
  fonctionnaliste qui en découle dans l'urbanisme du XXe siècle.
- L'effondrement partiel de la tour Ronan Point à Londres (1968), qui met fin en
  quelques mois aux grands programmes britanniques de tours préfabriquées.
- Le concours du Centre Pompidou (1971), remporté par deux architectes encore
  inconnus, Renzo Piano et Richard Rogers, avec un bâtiment qui expose sa
  structure et ses circulations à l'extérieur plutôt que de les dissimuler.
- La démolition du grand ensemble de Pruitt-Igoe à Saint-Louis (1972), souvent
  citée comme symbole de l'échec de l'urbanisme moderniste de l'après-guerre.
- Le Crystal Palace de Joseph Paxton (1851), premier grand bâtiment préfabriqué en
  fer et en verre, monté en quelques mois pour l'Exposition universelle de Londres.

### Preuve et erreur judiciaire (9 fiches publiables)

- L'expertise graphologique contestée de l'affaire Dreyfus, et le rôle d'Alphonse
  Bertillon, pourtant pionnier de l'identification judiciaire scientifique.
- Le détecteur de mensonge de William Marston (par ailleurs créateur de Wonder
  Woman) et son rejet comme preuve scientifique par la justice américaine dans
  l'arrêt *Frye v. United States* (1923).
- L'identification oculaire erronée de l'affaire Ronald Cotton et Jennifer
  Thompson, étudiée ensuite par la psychologue Elizabeth Loftus comme cas
  d'école de la fragilité du témoignage visuel.
- Le premier cas américain d'innocentement par test ADN rétroactif, celui de Gary
  Dotson (1989), à l'origine du mouvement des Innocence Projects.

*(L'affaire Sally Clark, autre cas connu d'erreur judiciaire statistique, a déjà
sa fiche — `sta-affaire-sally-clark-erreur-procureur`, en Statistiques.)*

## Autres pistes, en réserve

Pas de priorité particulière — à reprendre si une discipline déjà couverte
mérite un thème de plus.

- **Génétique** — l'expérience du pois de Mendel (1866), ignorée pendant
  trente-quatre ans avant d'être redécouverte simultanément par trois botanistes.
- **Sciences politiques** — le paradoxe de Condorcet (1785) : une majorité peut
  préférer A à B, B à C, et C à A, sans qu'aucune incohérence individuelle
  n'explique le résultat collectif.
- **Linguistique** — l'hypothèse Sapir-Whorf et le cas souvent déformé du
  vocabulaire inuit de la neige.
- **Histoire de l'art** — le scandale du Salon des Refusés (1863) et le
  *Déjeuner sur l'herbe* de Manet.
- **Informatique** — l'histoire du bug informatique le plus littéral, la mite
  retrouvée dans le relais du Harvard Mark II en 1947.

## Comment s'en servir

1. Choisir un thème dans ce fichier, ou en proposer un nouveau qui n'y figure pas.
2. Vérifier qu'une source fiable et cliquable existe avant d'écrire quoi que ce
   soit (`CLAUDE.md`, « Écrire une fiche »).
3. Écrire la fiche, la faire passer `npm run validate` et `npm test`.
4. Retirer la ligne correspondante de ce fichier.
