# CLAUDE.md

Contexte de travail pour Claude Code sur ce dépôt.

## Ce qu'est ce dépôt

Le **pipeline de contenu** d'Anagnosis (Lot 0) : génération des fiches concepts,
contrôle qualité, outil de validation Admin, export vers le backend.

Ce n'est **pas** l'app iOS, qui vivra dans un dépôt séparé. Ne pas ajouter ici de
code client, d'UI produit ou d'appel réseau vers un backend.

Seule exception : le dossier `site/` et `src/build-site.js`, qui produisent la
**vitrine publique** — anagnosis.fr, une page statique qui présente le produit et
renvoie vers les stores. Pas de client à y faire vivre : elle décrit l'app, elle ne
la remplace pas.

**L'esquisse jouable a existé et a été retirée (2026-08-04).** Une PWA assemblée à
partir des fiches validées servait à éprouver le parcours sans Xcode ni App Store,
le temps que les clients natifs existent. Devenue inutile une fois iOS et Android
testables en direct sur simulateur/appareil réel — la garder aurait été du code mort.

## À lire avant toute tâche de fond

- `docs/brief-produit.md` — le produit, le positionnement, le modèle économique
- `docs/ligne-editoriale.md` — **la référence pour toute génération de contenu**
- `docs/decisions.md` — ce qui a été tranché depuis le brief, et pourquoi
- `docs/passation-ios.md` — **le brief du client iOS**, à lire depuis le dépôt de l'app
- `docs/direction-artistique.md` — l'intention visuelle (direction risographie)
- `docs/charte-visuelle.md` — **les valeurs** : couleur, surimpression, grain, typo
- `docs/systeme-illustration.md` — grille, six opérations, champ `illustration`
- `docs/ecrans.md` — carte partageable, lecture, notification, quiz, profil, verrou

## Commandes

```bash
npm run admin      # outil de validation → http://localhost:4321
npm run validate   # contrôle qualité de la forme (sortie 1 si erreur)
npm run cible      # quelle discipline alimenter maintenant, et combien
npm run acontroler # quelles fiches restent à relire au fond
npm run areparer   # quelles fiches en retouche attendent d'être réparées
npm run arelire    # quels brouillons sont prêts à être tranchés
npm run asonoriser # quelles fiches publiables n'ont pas d'audio à jour
npm run adroit     # quelles fiches juridiques redemandent une revue de juridiction
npm run queue      # file d'attente par discipline
npm run stats      # état de la base
npm run export     # export des fiches publiables
npm run site       # assemble la vitrine + le contenu signé → export/site/
npm test           # tests
```

## Contraintes techniques

- **Zéro dépendance runtime.** Node 20+, modules natifs uniquement. Le pipeline
  doit tourner sur le NAS (4 Go de RAM, déjà deux services) et rester lançable
  dans plusieurs années sans réinstaller un écosystème. Ne pas ajouter de
  framework, de bundler ni d'ORM sans raison forte.
- **Zéro API externe**, y compris pour la génération (brief §9). Le contenu est
  écrit par Claude Code directement dans le dépôt.
- **ESM**, `type: module`. Pas d'étape de build.
- Le code et les commentaires sont en français, comme le contenu.

## Écrire une fiche

Une fiche = un fichier `content/concepts/<discipline>/<slug>.json`, créé au statut
`brouillon`. Ne jamais créer une fiche directement en `valide` : le statut est la
trace d'une décision humaine, pas un champ à remplir.

Avant de proposer un lot à la relecture :

1. **Vérifier les sources en ligne.** Une source non vérifiée ne va pas dans une
   fiche. C'est le cœur du positionnement produit (brief §3).
2. **Ne jamais fabriquer une citation.** En l'absence de citation authentique et
   sourçable, utiliser le champ `repere` (ligne éditoriale §4).
3. **Écrire la carte partageable en même temps que la fiche.** C'est du contenu,
   pas de la mise en page : le partage en story est le moteur de croissance
   (`docs/decisions.md`), et `carte.source_courte` n'est jamais vide.
4. **Toute source est cliquable.** `url` est obligatoire sur chaque `sources[]`, sur
   `citation`, sur `repere` et sur chaque `pour_aller_plus_loin` — la validation le
   refuse sinon. Une source qu'on ne peut pas aller ouvrir ne prouve rien, et c'est
   la preuve qui est le produit. Il n'existe pas de source légitime sans adresse
   stable : un article a un DOI, un texte ancien une numérisation (Wikisource,
   Gallica, archive.org), un livre récent une notice Open Library ou une page
   d'éditeur. Si rien n'existe, c'est la source qu'il faut changer.
5. Lancer `npm run validate` — zéro erreur, zéro alerte.
6. Lancer `npm test` — les tests contrôlent aussi le contenu réel du dépôt
   (équilibre des quiz, unicité des sources).

## Publier le contenu vers les clients iOS et Android

`npm run site` écrit `export/site/contenu/concepts.json` et sa signature Ed25519.
C'est le fichier que les deux apps téléchargent pour recevoir de nouvelles fiches
**sans passer par l'App Store ni le Play Store** : le corpus embarqué reste le
plancher, le fichier reçu ne fait qu'ajouter. L'audio suit le même principe, servi
par le Worker Cloudflare (`worker/audio.js`, `docs/passation-audio.md`).

La projection des fiches vient de `src/publier.js`, et c'est la **même** que celle de
`npm run export`. Ne pas en écrire une seconde : une fiche n'aurait plus la même forme
selon qu'elle est embarquée ou reçue, et le décodeur du client casserait sur l'une des
deux — chez les seuls lecteurs qui ont déjà téléchargé.

**La clé privée n'entre jamais dans le dépôt.** Elle vit dans
`~/.anagnosis/signature-privee.pem` et, pour la construction Netlify, dans la variable
`ANAGNOSIS_CLE_PRIVEE`. Sans clé, `npm run site` ne publie **pas** le dossier `contenu/`
et le dit : mieux vaut un endpoint absent qu'un endpoint que l'app rejettera.

La clé publique correspondante est dans
`Anagnosis/Contenu/ContenuDistant.swift`. Un test de l'app vérifie que les deux
s'accordent — si elles divergent, tout se compile et se déploie, et la mise à jour ne
fonctionne jamais, sans message nulle part.

## Contrôler les fiches

`npm run validate` vérifie la **forme**. Il ne sait pas si une source existe ni si elle
dit ce que la fiche lui fait dire — c'est le travail de `/controler`
(`.claude/commands/controler.md`), qui rouvre les sources en ligne.

`npm run acontroler` dit quelles fiches restent à relire : celles sans trace de
contrôle, et celles retouchées depuis. La trace se pose avec
`node src/cli.js controle <id> <ok|corrige|a_revoir> "note"`, qui calcule l'empreinte
du contenu — une fiche modifiée après contrôle repasse toute seule dans la file.

La frontière compte plus que le reste : une coquille, un lien mort ou une référence
incomplète se corrigent seuls ; **tout ce qui touche au sens se signale** (`a_revoir` +
statut `en_retouche`). Une réécriture de fond faite en silence par le contrôle viderait
la relecture de son objet — le contrôle détecte, il ne répare pas.

## Réparer les fiches sorties

`/reparer` (`.claude/commands/reparer.md`) traite ce que le contrôle a signalé :
`npm run areparer` donne les fiches `en_retouche` **avec les notes qui les ont sorties**,
et la routine rouvre les sources pour rendre le texte exact — ou constater qu'il ne peut
pas l'être.

Cette routine **revalide ce qu'elle a vérifié**. C'est un écart assumé au principe selon
lequel `valide` est la trace d'une décision humaine, et il est rendu visible plutôt que
dissimulé : la fiche porte `decide_par: routine-reparation`, jamais une adresse
personnelle. On sait donc toujours ce qui a été relu par un humain.

Deux bornes le compensent : une réparation qui **touche au texte** change l'empreinte,
donc la fiche repasse au contrôle et un passage indépendant revérifie ; et une fiche qui
revient une troisième fois est rejetée plutôt que réparée encore.

## Trancher les brouillons

`/relire` (`.claude/commands/relire.md`) met les brouillons en circulation, ou les écarte.
`npm run arelire` donne ceux qui sont prêts, et la routine rouvre **toutes** leurs sources
avant de décider.

**C'est la seule routine qui valide du contenu neuf sans relecteur**, et l'écart au principe
d'origine est assumé plutôt que dissimulé : la fiche porte `decide_par: routine-relecture`,
jamais une adresse personnelle.

Le garde-fou tient en une règle : **elle ne prend que des brouillons déjà contrôlés**, avec
une empreinte à jour et un verdict sans réserve. Autrement dit, deux passages indépendants
séparés dans le temps, partant chacun du texte brut. Un passage unique qui vérifie et valide
dans la foulée ne se contredit jamais lui-même — il refait la même lecture avec les mêmes
angles morts. Le délai reste court : le contrôle passe trois heures après la production et
traite les brouillons en premier.

Et si la relecture **touche au texte**, l'empreinte change : la fiche repasse au contrôle, et
un troisième passage la revérifie avant qu'elle ne soit servie longtemps.

**Le cycle : contrôler → réparer → relire → produire.** Chaque routine passe deux fois par
jour, à douze heures d'intervalle, et trois heures après la précédente :

| | |
|---|---|
| contrôler | 06:08 et 18:08 |
| réparer | 09:08 et 21:08 |
| relire | 00:08 et 12:08 |
| produire | 03:08 et 15:08 |

**`contrôler-droit` est en dehors de ce tour** (chaque mercredi, à 08:08). Elle ne suit
rien et n'alimente rien : les quatre autres se passent le relais parce que chacune
travaille sur ce que la précédente vient de produire, alors que celle-ci attend qu'un
texte de loi change au dehors.

Deux réglages la gouvernent, et **ce n'est pas celui qu'on croit qui compte** :

- `MOIS_VALIDITE` (trois mois) décide combien de temps une fiche devenue fausse continue
  d'être servie. Une loi qui change au lendemain d'une revue ment jusqu'à la suivante.
- La cadence hebdomadaire ne joue que sur la queue, le délai entre le moment où une fiche
  devient exigible et celui où elle est reprise. Elle ne raccourcit pas l'exposition, elle
  empêche seulement qu'elle s'allonge.

C'est la cadence qui rend la validité courte tenable : cinquante-deux passages par an à
huit fiches donnent 416 revues, quand quatorze fiches revues quatre fois par an en
demandent cinquante-six. La marge sert à raccourcir encore `MOIS_VALIDITE` sans toucher à
rien d'autre.

Lu dans le sens d'une fiche neuve, c'est une chaîne : **produite** à 15:08, elle est
**contrôlée** à 18:08, **réparée** à 21:08 si le contrôle l'a sortie, et **relue** à 00:08 si
son verdict est propre. Neuf heures de bout en bout, chaque maillon trois heures après celui
qui l'alimente — assez pour que les deux passages du contrôle et de la relecture soient
réellement séparés dans le temps, et partent chacun du texte brut.

Le tour de rôle est cyclique : l'ordre ci-dessus se lit aussi bien à partir de n'importe
laquelle des quatre.

## Revoir les fiches juridiques

`/controler-droit` (`.claude/commands/controler-droit.md`) traite le seul angle mort de la
chaîne. Toutes les autres disciplines énoncent des choses qui restent vraies là où le
lecteur se trouve et le resteront l'an prochain ; **le droit est la première où une fiche
peut devenir fausse sans que personne n'y touche** — la règle décrite est modifiée, ou
elle ne valait depuis toujours que dans un pays sans le dire.

`/controler` ne peut pas le voir, et il a raison de ne pas le voir : il vérifie que la
fiche dit ce que dit la source, or l'article de 2015 dit toujours en 2030 ce qu'il disait
en 2015. La source reste exacte, la fiche est devenue fausse.

La défense principale est **en amont**, dans la ligne éditoriale (§3.1) : une fiche de
droit s'écrit comme histoire et comme idée, jamais comme état actuel d'une règle en
vigueur. Le Statute of Anne de 1710 ne se périme pas. `npm run adroit` est le filet, pour
celles qui passent entre les mailles — et sa file se déclenche **sur le temps** (six mois)
et non sur l'empreinte, sans quoi une fiche que personne ne touche ne repasserait jamais.

## Sonoriser les fiches

**Le droit ne se sonorise pas** (`SANS_ECOUTE` dans `src/schema.js`). Ses fiches vivent de
dates, de numéros d'article et de noms d'arrêts, que la voix rend en bouillie et sur
lesquels l'oreille ne peut pas revenir en arrière. La règle vaut de bout en bout : la file
les écarte, `sonoriser <id>` les refuse même nommées à la main, et les clients retirent le
bouton et le lecteur au lieu d'annoncer un « audio prochainement disponible » qui ne
viendrait jamais — c'est `Ecoute.sansEcoute`, des deux côtés. **« Jamais » n'est pas « pas
encore »**, et l'interface doit dire lequel des deux.

`npm run asonoriser` dit quelles fiches publiables n'ont pas d'audio à jour, et
`node src/cli.js sonoriser <id>` le produit — deux voix françaises, modèle `eleven_v3`,
un master archivé et un dérivé AAC servi à l'app (`docs/decisions.md`, 2026-08-02).

**« À jour » ne veut pas dire « présent ».** L'empreinte de contrôle ne couvre que le fond
éditorial : elle ne sait rien de l'audio. Si l'on se contentait de vérifier l'existence du
fichier, une fiche corrigée par `/reparer` continuerait de servir le son de l'ancien texte,
sans que rien ne le signale — c'est le seul défaut de cette chaîne qui soit à la fois
silencieux et durable. `audio/index.json` enregistre donc l'empreinte du texte **à partir
duquel** chaque fichier a été produit, et une fiche dont l'empreinte a bougé repasse d'elle
-même en production. Un test le verrouille (`test/audio.test.js`).

**On ne régénère jamais sans raison.** Un second appel coûte des crédits *et* prend le
risque que le modèle ait bougé entre-temps : la voix du catalogue changerait d'une fiche à
l'autre, en silence. La commande est donc idempotente sur le texte, pas sur le fichier.

`ffmpeg` est requis pour dériver le format de l'app. C'est un outil d'atelier, pas une
dépendance du pipeline : le ré-encodage a lieu au moment de la production, jamais sur le
NAS ni dans la chaîne de construction.

## Pièges déjà rencontrés

- **Position de la bonne réponse.** Écrites à la suite, les fiches se retrouvent
  toutes avec la bonne réponse en première position. Un test le vérifie.
- **Longueur de la bonne réponse.** Une bonne réponse plus détaillée que ses
  distracteurs se repère sans comprendre la question. Seuil : 1,4× le plus long
  distracteur, vérifié par un test.
- **Décompte de mots.** `motsDe()` retire les marqueurs d'emphase sans insérer
  d'espace, sinon « l'*italique* » compte pour deux mots.

## Produire un pack de discipline

La production continue se fait **par lots d'une discipline entière**
(`docs/decisions.md`). Deux points à ne pas perdre de vue :

- L'app sert un concept par jour parmi les disciplines choisies par
  l'utilisateur. Un stock déséquilibré rend le service inutilisable pour qui n'a
  pas coché la discipline remplie — viser un socle sur toutes les disciplines
  actives avant publication, même en produisant pack par pack.
- À l'intérieur d'un pack, varier les registres et les niveaux. Huit fiches
  construites sur le même schéma se lisent comme une seule.

## Ce qui reste ouvert

- Direction artistique des illustrations — les `illustration.prompt` actuels sont
  des points de départ, à reprendre au Lot 5 avec Claude Design. Exigence non
  négociable : le rendu ne doit jamais être identifiable comme généré par IA
- Prix des paliers premium (brief §14)
- Lancer les 9 disciplines d'emblée, ou un sous-ensemble (brief §14, amendé par
  l'ajout de Médecine / Santé)
