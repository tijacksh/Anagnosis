# Journal des décisions

Décisions prises en cours de projet qui complètent ou amendent
`docs/brief-produit.md`. Le brief reste le document de référence ; ce fichier
enregistre ce qui a été tranché depuis, et pourquoi.

---

## 2026-08-02 — L'écoute : voix de synthèse choisie, fichiers pré-produits

**Décidé :** l'audio est **produit à l'avance et téléchargé**, jamais synthétisé sur
l'appareil. Moteur **ElevenLabs, modèle `eleven_v3`**, deux voix françaises de la
bibliothèque partagée — *Helene* (documentaire) et *Jerome* (narration réflexive) —
que le lecteur choisit dans les réglages. Deux fichiers par fiche.

**Pourquoi le pré-produit plutôt que la synthèse embarquée.** `AVSpeechSynthesizer`
donne un résultat robotique que le lecteur entend immédiatement comme de la machine.
C'est le même critère non négociable que pour les illustrations : *le rendu ne doit
jamais être identifiable comme généré par IA*. Une voix qui sonne synthétique
décrédibilise une fiche dont tout le propos est l'exactitude.

**Pourquoi ce moteur.** Le critère qui élimine n'est pas le naturel mais la
**prononciation dirigeable** : le corpus fait prononcer 832 noms propres distincts,
1 484 occurrences, une douzaine par fiche — Doppler, Whorf, Boas, Eichmann, Ockham.
OpenAI n'offre aucun moyen de figer une prononciation (pas de SSML, pas de
dictionnaire phonétique) : écarté malgré un tarif inférieur. ElevenLabs accepte des
règles IPA, mais **seulement sur `eleven_v3` et `eleven_flash_v2`** — pas sur
`multilingual_v2`.

**Pourquoi `v3` malgré l'absence de recouture de prosodie.** `eleven_v3` ne supporte
pas le *request stitching*, qui recoud la prosodie entre deux requêtes. Sur du long
format ce serait rédhibitoire ; ici ça ne mord jamais : sa limite est de 5 000
caractères et la fiche la plus longue du corpus en fait 3 874. **Une fiche tient
toujours en une requête**, donc il n'y a rien à recoudre. Vérifié à l'écoute sur deux
registres opposés (Doppler, technique ; *Banalité du mal*, grave) : noms propres
justes, et la pause devant les titres de section s'entend comme une section.

**Les classements publics n'ont pas servi à trancher.** L'arène Artificial Analysis
fait voter **en anglais**, sur des extraits d'agent conversationnel, et place
plusieurs modèles devant ElevenLabs. Nous lisons de l'exposition en français avec des
noms allemands : rien ne garantissait que l'ordre tienne. Il a fallu écouter.

**Un compte neuf n'a que des voix anglophones.** Les 21 voix par défaut sont
américaines, britanniques ou australiennes. Les faire lire du français donne du
français à l'accent américain — et on aurait conclu que le moteur lit mal notre
langue alors qu'on lui aurait imposé l'accent. Les deux voix retenues viennent de la
bibliothèque partagée et sont explicitement francophones.

**Conséquence — deux formats, une seule génération.** Régénérer coûte des crédits *et*
prend le risque que le modèle ait bougé entre-temps : la voix du catalogue changerait
en silence. Donc une génération, deux produits :

- le **master** à 128 kbit/s mono est archivé et jamais servi — c'est lui qui
  alimentera le podcast le jour venu ;
- l'app reçoit un dérivé **AAC 32 kbit/s mono** (~1 Mo la fiche), ré-encodé
  localement — gratuit, déterministe, refaisable depuis le master.

Le ré-encodage a lieu à la génération, sur le poste de production. Ni le NAS ni la
chaîne de construction n'y touchent : la contrainte « zéro dépendance runtime » reste
intacte, `ffmpeg` n'est qu'un outil d'atelier.

**Conséquence — l'audio n'est pas hébergé avec le site.** Netlify facture
précisément ce qu'on ferait le plus : le palier gratuit 2026 plafonne à ~15 Go
mensuels, soit 15 000 écoutes, après quoi le site cesse de servir. L'audio va sur
**Cloudflare R2** : zéro frais de sortie, 10 Go de stockage gratuits (le corpus
complet en deux voix en occupe moins de 3), 10 M de téléchargements mensuels inclus.

**Conséquence — l'adresse vient du manifeste, jamais de l'app.** L'URL de chaque
fichier et son **SHA-256** sont écrits dans `concepts.json`, qui est déjà signé en
Ed25519. Deux effets, tous deux acquis sans mécanisme supplémentaire : changer
d'hébergeur devient un changement de pipeline invisible pour les versions déjà
installées ; et l'app vérifie l'intégrité de chaque fichier téléchargé en lisant une
empreinte que la signature couvre. C'est la règle de `src/publier.js` appliquée à
l'audio — une seule projection, pas deux.

**À surveiller — le coût du rattrapage.** Mesuré : ~0,55 crédit par caractère. Le
corpus publiable (140 fiches, ~412 000 caractères) en **deux voix** demande ~453 000
crédits, soit un mois de Pro (600 000 crédits, 99 $). Le régime de croisière — une
fiche par jour, deux voix — tient à ~96 000 crédits/mois, dans le Creator à 22 $.
Rattraper d'abord, redescendre ensuite.

**À surveiller — l'audio ne doit pas bloquer l'éditorial.** Une fiche sans audio
reste **validée mais non publiée**, jamais dévalidée : si le fournisseur tombe ou si
la clé expire, on ne perd aucun travail de relecture.

---

## 2026-08-02 — Ce que Premium vend : plus de chaque jour, jamais plus de jours

**Décidé :** un **seul palier** d'abonnement, et neuf fonctions. La règle qui les
organise toutes tient en une phrase : *le concept du jour ne change pas — il reste
gratuit, un par jour, pour tout le monde ; Premium ne donne pas plus de jours, il
donne plus de chaque jour.*

**Ce qui ajoute de la connaissance**

1. **L'écoute** — la fiche lue à voix haute, par la synthèse de l'appareil, hors
   ligne. Ouvre un usage que l'app n'a pas : le trajet, la cuisine.

**Ce qui fait revenir**

3. **Le rappel** — trois questions par jour sur ce qui a été lu dix, quarante-cinq
   ou cent quatre-vingts jours plus tôt.
4. **Le relevé** — « ce qui tient, ce qui s'efface ». L'encre y mesure ce qui
   revient juste, pas ce qui a été lu.
5. **Les fils** — choisir un parcours thématique et le suivre, au même rythme.

**Ce qui rend le passé utile**

6. **Tout le passé, cherchable et filtrable** — pas seulement déverrouillé. C'est le
   trou du Premium existant : un abonné qui ouvre deux cents jours n'a aujourd'hui
   qu'une liste par date.
7. **Le carnet** — surligner, annoter, retrouver dans ses propres lectures.

**Ce qui se voit sans ouvrir l'app**

8. **Le widget** — le concept du jour sur l'écran d'accueil.
9. **Le partage familial** — six personnes, une case à cocher côté App Store.

**L'épreuve offerte** accompagne l'offre sans en faire partie : une fois par compte,
après trente jours d'usage et vingt fiches lues, cinq questions sur ce qu'on a lu il
y a plus d'un mois, puis un chiffre. Elle ne retire rien au gratuit — elle laisse le
lecteur mesurer lui-même l'écart entre ce qu'il croit avoir gardé et ce qu'il a
gardé. C'est le seul argumentaire que ce produit puisse tenir sans se renier.

**Pourquoi cette thèse et pas une autre.** Quatre modèles ont été conçus
séparément puis notés sur trois grilles — fidélité au produit, force de conversion,
faisabilité. Les deux qui vendaient l'appareil éditorial (« Le fil ») ou le corpus
personnel (« Le carnet ») ont été jugés les plus fidèles mais les plus faibles en
conversion : *on ne paie pas 29 € pour réordonner ce qu'on aura de toute façon.* Ce
qui les rend défendables, c'est de les adosser à ce qui se comprend sans
explication — la version longue et l'écoute — plutôt que d'en faire l'argument
principal.

**Ce qui a été écarté, et pourquoi**

- **La version longue** — le même concept en 1 200 mots au lieu de 433. C'était le
  plus gros ajout de valeur perçue et la réponse la plus directe à « plus de
  connaissance à acquérir ». Écartée pour son coût : elle **double le travail
  éditorial par fiche**, donc double la surface où une affirmation fausse peut
  entrer — le seul risque que ce produit ne peut pas prendre. Reste à reprendre le
  jour où le corpus est stabilisé et les routines de contrôle éprouvées.
  Conséquence assumée : l'axe « plus de connaissance » repose désormais sur la
  rétention (le rappel) et sur la profondeur de parcours (les fils), pas sur du
  texte en plus.
- **Le dossier de vérification** — montrer comment chaque fiche a été contrôlée.
  C'est le seul argument qu'aucun concurrent ne peut copier, et il a été écarté pour
  son coût : il suppose de publier le champ `controle`, aujourd'hui retiré à
  l'export (`src/publier.js`), donc de reprendre les notes internes pour un lecteur.
  À reprendre si l'offre a besoin d'un différenciateur plus tard.
- **Offrir un abonnement à quelqu'un.** Séduisant, et impossible : aucune API
  StoreKit ne permet d'acheter un achat intégré au bénéfice d'un tiers, et les
  *Offer Codes* ne couvrent que les abonnements auto-renouvelables et se génèrent
  hors de l'app. Le partage familial couvre le besoin réel.
- **Deux paliers.** Écartés pour la simplicité : rien à arbitrer au moment où le
  lecteur décide.

**Deux réserves techniques consignées**

- **Le corpus n'a qu'une question par fiche** — vérifié, 0 sur 133 en a plusieurs.
  Le rappel rejouerait la même question mot pour mot. Les questions supplémentaires
  seront un **champ additif**, pas un changement de `quiz` en tableau : aucune
  migration des fiches existantes, aucun décodeur cassé sur les binaires déjà
  installés, et une fiche sans supplément se contente de rebattre l'ordre de ses
  propositions — dégradé, pas cassé.
- **`premium` se fusionne en OU** (`EtatLecteur.swift`, `EtatLecteur.kt`). Inoffensif
  tant que c'est une bascule de démonstration ; le jour où un vrai abonnement arrive,
  un abonnement expiré ne redescendrait jamais. Le droit devra venir de l'App Store
  et du Play Store, pas de l'état fusionné.

**Non tranché :** le prix. 3,49 €/mois et 29 €/an restent des espaces réservés.

---

## 2026-07-31 — L'historique se conserve par la plateforme, pas par un compte

**Décidé :** la persistance de l'historique passe par la synchronisation native de
l'appareil — `NSUbiquitousKeyValueStore` sur iOS, Auto Backup for Apps sur Android
le jour venu. **Pas de compte, pas de backend, pas d'inscription.** La règle de
fusion et la liste des clés sont dans `docs/passation-ios.md` §4.

**Pourquoi :** les deux cas qui inquiètent — suppression de l'app, changement
d'appareil — sont déjà couverts, gratuitement, par l'Apple ID ou le compte Google
que tout utilisateur possède nécessairement. L'état à conserver pèse 29 Ko pour une
année de lecture quotidienne, mesuré sur les identifiants réels ; le quota iCloud
clé-valeur est de 1 Mo, soit trente ans. Construire un compte pour ce service
reviendrait à payer le prix positionnel — « aucun compte, aucun serveur, aucun
suivi » est écrit dans le README et en pied du banc d'essai — pour quelque chose
que la plateforme rend déjà.

**Ce que ça ne couvre pas :** le passage d'iOS à Android. Aucune sauvegarde
iCloud ne se restaure sur Android, et réciproquement. C'est le seul trou, et il
n'existe pas tant qu'il n'y a qu'un seul client.

**Reporté — le coffre chiffré.** Pour ce trou, la réponse conçue est un coffre à
connaissance nulle : un secret aléatoire tiré sur l'appareil, dont on dérive une
clé de chiffrement et un identifiant de dépôt par deux HKDF distincts, l'état
chiffré en AES-GCM, et deux routes `PUT`/`GET` qui ne voient que des octets
opaques. Trois conséquences à assumer le jour où on l'ouvrira : secret perdu =
données perdues sans recours ; c'est un porteur, pas une connexion ; les droits
premium ne peuvent pas s'y adosser et restent côté App Store et Play Store.

**Pourquoi pas maintenant, et pourquoi pas chez OVH.** Le coffre ne sert à rien
tant qu'il n'y a qu'un écosystème. Et l'hébergement inclus avec le domaine
(100 Mo) ne convient pas : il ne permet pas à un client d'écrire, il plafonne
silencieusement à ~3 500 coffres d'un an, et il serait la copie unique d'une
donnée que le chiffrement rend irrécupérable — personne, nous compris, ne pourrait
la reconstruire. Si un serveur devient nécessaire, une fonction sur l'hébergement
du site suffit : deux routes, pas de nouveau fournisseur.

**Le pseudo n'est pas une identité.** Il existe déjà (`app/app.js`, `ecrans.md`
§1) pour signer la carte partageable. Il reste cosmétique, vit à l'intérieur de
l'état, et ne sert jamais de clé de récupération : un nom se devine, se squatte et
permet d'énumérer les utilisateurs.

---

## 2026-07-30 — Direction artistique arrêtée, livraison Claude Design intégrée

**Décidé :** la direction artistique est **finale**. La livraison de Claude Design
fait référence : `docs/charte-visuelle.md`, `docs/systeme-illustration.md` et
`docs/ecrans.md` pour les valeurs, `docs/direction-artistique.md` pour l'intention,
et les maquettes dans `design/claude-design/livraison-anagnosis/maquettes/`.

En cas de divergence : l'intention tranche sur le pourquoi, la charte sur les valeurs.

**La branche de travail a été fusionnée dans `main`.** Jusqu'ici `main` ne contenait
que le commit initial — c'est précisément pourquoi Claude Design a travaillé sans voir
le contenu et a dû inventer cinq fiches pour maquetter.

### Ce que la livraison a tranché

- **La carte est composée sur l'appareil**, pas en amont par le pipeline. C'est ce qui
  permet d'y porter la série ou le pseudo du lecteur. Le rendu appartient donc au
  client iOS et devra rester stable d'une version d'iOS à l'autre.
- **Le mode sombre garde grain et surimpression** : noir chaud `#241F1A`, encre
  remontée en clarté, mélange en `screen`, grain à 7 %.
- **Rayon 0 partout**, base d'espacement 4, cibles tactiles jamais sous 44 px.

### Ce qui a été amendé après revue

- **Liquid Glass devient une préférence utilisateur**, pas une exception subie. Le
  lecteur choisit entre le verre et l'aplat riso sur la barre d'onglets. Le verre ne
  remonte sur aucune autre surface.
- **L'onglet Calendrier est conservé**, et sa justification est commerciale : rendre
  le passé visible mais verrouillé est le principal levier vers Premium, qui ouvre la
  consultation rétroactive illimitée. L'objection initiale — que naviguer dans le passé
  affaiblirait le verrou du un-par-jour — tombe : c'est la frustration réglée qui vend.
- **Les prix sont reportés.** 3,49 €/mois et 29 €/an figurent dans les maquettes comme
  espace réservé. Priorité au build — rattachement des cartes et des domaines d'abord.

### Deux réserves consignées

- **Les cinq fiches des maquettes sont fictives** et n'ont pas passé le validateur.
  Sources réelles, texte de démonstration. Elles ne doivent pas alimenter le pipeline.
- **Le fichier de maquettes ne s'ouvre pas hors ligne** : il charge React depuis
  unpkg.com et les polices depuis Google Fonts. À rapatrier en local si l'on veut que
  la référence visuelle survive à ses CDN.

---

## 2026-07-30 — L'app s'appelle Anagnosis

**Décidé :** le nom est **Anagnosis**. Le brief laissait la question ouverte
(§14, avec des pistes en §16) ; elle est close. Le dépôt est désormais
`github.com/tijacksh/anagnosis`, et toutes les références dans le code, les
documents et la maquette ont été renommées.

**Ce que ça ferme :** la ligne « Nom de l'app » disparaît des points ouverts.
Reste à dessiner le **logotype** — voir `docs/direction-artistique.md` §13.

**Point à surveiller côté design :** le mot est long. Il doit rester lisible en
très petit en bas de la carte partagée (~10 px à l'échelle 1080) et fonctionner
en grand à l'ouverture de l'app. C'est la contrainte principale du logotype, et
elle a été ajoutée au cahier des charges.

**Le brief n'a pas été réécrit.** `docs/brief-produit.md` reste le document
d'origine, avec son « [Nom provisoire] » en titre : c'est la pièce de référence
datée, et la réécrire effacerait la trace de ce qui a été décidé depuis. Ce
journal fait foi pour tout ce qui a changé après le brief.

---

## 2026-07-30 — Direction artistique : risographie

**Décidé :** direction **C · Risographie**, retenue parmi quatre propositions (deux
épurées, deux colorées). Encres à plat surimprimées, hors-repérage assumé, grain de
papier. Le cahier des charges complet est dans `docs/direction-artistique.md`.

**Pourquoi celle-là.** C'est la seule des quatre à satisfaire les deux exigences sans
en sacrifier une : franchement colorée et chaleureuse, et **structurellement** hostile
au soupçon d'IA. La surimpression d'encres et le décalage de repérage sont des
accidents mécaniques d'imprimerie que les générateurs ne reproduisent pas de façon
convaincante. Là où une direction concurrente doit *éviter* de ressembler à une image
générée, celle-ci ne peut pas y ressembler.

Elle offre en prime le meilleur système de déclinaison : une encre par discipline, le
papier et l'encre noire ne bougeant jamais. Neuf disciplines et trois cents fiches y
tiennent sans que l'ensemble se délite.

**Le risque, à surveiller en production :** un rendu riso mal exécuté tourne au filtre.
Le hors-repérage doit rester léger, discret et **constant** — un décalage aléatoire par
élément trahit l'effet appliqué après coup.

**Dette :** les `illustration.prompt` des 8 fiches Doppler restent rédigés dans la
direction sobre initiale. Une passe unique au Lot 5 les reprendra, plutôt que deux
réécritures successives.

---

## 2026-07-30 — Pack Psychologie produit

12 fiches en attente de validation. C'est la discipline où l'angle rigueur paie le
plus cher : une bonne partie de ce qui circule en psychologie populaire a été révisée
ou démentie depuis, et presque personne ne le répercute.

Six fiches reposent sur une révision documentée — l'expérience de Stanford défaite par
les archives, la pyramide que Maslow n'a jamais dessinée, le test du marshmallow réduit
par sa réplication, les trente-huit témoins qui n'ont pas existé, les styles
d'apprentissage sans preuve, la courbe de Dunning-Kruger fabriquée en ligne.

Les six autres sont des expositions classiques, choisies parce qu'elles **tiennent** :
dissonance cognitive, biais de confirmation, faux souvenirs, obéissance, cécité
d'inattention, attachement. L'équilibre est délibéré. Un pack entièrement composé de
démolitions donnerait le sentiment que rien ne tient dans la discipline, ce qui serait
faux et, à terme, aussi trompeur que les mythes qu'on corrige.

---

## 2026-07-30 — Pack Philosophie validé : cible du Lot 0 atteinte

Les 12 fiches de philosophie sont validées sans réserve. La base compte
**20 fiches validées**, ce qui atteint la cible du Lot 0 (20-30 fiches produites et
validées via le pipeline complet, brief §13).

Le pipeline a donc fait son tour complet deux fois, sur deux registres très
différents — sciences expérimentales et histoire des idées — sans que le schéma ni
la ligne éditoriale aient eu besoin d'être refondus. Les seuls ajustements ont été
l'ajout de la discipline Médecine / Santé, le champ `carte`, et l'autorisation des
années négatives pour les sources antiques.

Reste à faire avant lancement public : passer de 20 à 200-300 fiches, en gardant un
socle sur toutes les disciplines actives.

---

## 2026-07-29 — Le partage en story devient le moteur de croissance

**Décidé :** le partage d'une carte-image du concept du jour passe de V1.5
(brief §6) à **fonction centrale de V1**. C'est la boucle d'acquisition retenue.

**Le raisonnement :** il existe déjà une audience installée pour ce format — les
comptes TikTok et les carrousels Instagram qui expliquent un concept de physique,
de philo ou de psycho en une slide, et que les gens repartagent. Cette audience
consomme exactement notre contenu, mais sans source ni suite. L'objectif est de la
capter : la story partagée fait connaître l'app, l'app apporte le rituel quotidien
et la rigueur que ces comptes n'ont pas.

**Conséquence sur le modèle de données :** ajout du champ `carte`
(`punch`, `idee`, `source_courte`). La carte est du **contenu**, pas de la mise en
page : elle s'écrit avec la fiche, sinon il faudrait rouvrir chaque fiche plus tard.
Les trois champs sont obligatoires dès que `carte` est renseignée, et le validateur
refuse une carte sans `source_courte`.

**Règle éditoriale associée :** la carte doit tenir debout sans l'app. Quelqu'un qui
la voit en story sans rien télécharger doit avoir appris quelque chose. Une carte
réduite à une bande-annonce (« vous ne devinerez jamais… ») reproduit le teasing
creux qu'on prétend remplacer.

**Reste à trancher :** qui fabrique l'image ? Deux options — le pipeline la génère
en amont, comme les illustrations (brief §10), ou l'app la compose à la volée pour
pouvoir y afficher le pseudo ou la série de l'utilisateur. La seconde est plus
virale, la première plus contrôlable. À décider avant le Lot 2.

---

## 2026-07-29 — Direction visuelle : graphique et coloré, pas austère

**Décidé :** identité visuelle franche, colorée, ludique — le référent est le compte
Instagram ou TikTok qui explique un concept en une slide, pas le manuel scolaire.

**Ce qui lève la contradiction apparente** avec l'exigence de sérieux : **la
crédibilité est portée par la source affichée, pas par une palette austère.** Le
gris et le serif ne prouvent rien ; « Arendt, 1963 » en bas d'un visuel, si. Une
fois le crédit source rendu visible et systématique, le visuel est libre d'être
saturé et joyeux sans rien concéder sur le fond.

**Le vrai risque du registre coloré**, à rappeler à Claude Design au Lot 5 : le
dégradé violet-bleu, les formes molles et les compositions centrées sont la
signature même des générateurs d'images. « Coloré » doit vouloir dire *graphique et
composé*, jamais *effet automatique*. L'exigence du brief §11 — un rendu jamais
identifiable comme généré par IA — devient plus difficile à tenir dans ce registre,
pas moins.

**Piste à évaluer :** une famille de couleurs par discipline, pour que la discipline
se reconnaisse avant d'être lue.

**Dette assumée :** les `illustration.prompt` des 8 fiches Doppler ont été rédigés
dans la direction sobre précédente (encre fine, papier crème). Ils sont conservés
tels quels plutôt que réécrits deux fois : la direction artistique n'étant pas
arrêtée, une passe unique au Lot 5 coûtera moins qu'une réécriture maintenant. Les
12 fiches de philosophie sont, elles, écrites dans la nouvelle direction.

---

## 2026-07-29 — Pack Philosophie produit

12 fiches, de Platon à Searle, en attente de validation. Registres et niveaux
volontairement variés : histoire des idées, épistémologie, morale, existentialisme,
philosophie de l'esprit.

Sept des douze corrigent un contresens répandu — la fin de l'allégorie de la
caverne, la formule d'Ockham qui n'est pas d'Ockham, la banalité du mal, l'absurde
de Camus, le pari de Pascal, l'impératif catégorique confondu avec la règle d'or,
l'éternel retour lu comme une cosmologie. C'est l'angle le plus rentable pour le
positionnement : le lecteur repart avec quelque chose qu'il croyait déjà savoir.

---

## 2026-07-29 — Lot Doppler validé

Les 8 fiches du premier lot thématique (effet Doppler) sont validées sans
réserve. C'est le premier passage complet du pipeline : génération → contrôle
qualité automatique → relecture humaine → statut `valide`.

Le Lot 0 vise 20-30 fiches (brief §13). 8 sont faites.

---

## 2026-07-29 — Citation *et* repère, selon disponibilité

**Décidé :** les deux champs coexistent. Une vraie citation quand il en existe
une, authentique et sourçable ; un `repere` — fait sourcé et chiffré — sinon.

**Pourquoi :** exiger une citation d'auteur sur chaque fiche pousse
mécaniquement à en fabriquer, puisque beaucoup de concepts n'ont pas de phrase
célèbre attachée. Une citation apocryphe est indétectable par le lecteur et
ruine le positionnement « rigueur » (brief §3) le jour où elle est repérée.

**Conséquence technique :** le validateur exige au moins l'un des deux champs, et
refuse toute citation dépourvue de `source`. Les deux doivent recevoir un
traitement graphique cohérent au Lot 5 — ils occupent le même emplacement dans
la fiche.

Répartition sur le lot Doppler : 3 citations, 5 repères.

---

## 2026-07-29 — Ajout de la discipline « Médecine / Santé »

**Décidé :** neuvième discipline, active en V1. La fiche sur l'échographie
Doppler y est reclassée (`bio-echographie-doppler` → `med-echographie-doppler`).

**Pourquoi :** la taxonomie du brief (§7) n'a pas de discipline Médecine, et
l'imagerie médicale se classe mal en Biologie. C'est par ailleurs un gisement de
concepts important et très lisible pour un public généraliste.

**Conséquence :** la taxonomie V1 passe de 8 à 9 disciplines. Le brief §14
laissait ouverte la question « les 8 disciplines dès le lancement, ou un
sous-ensemble ? » — elle reste ouverte, mais porte désormais sur 9.

---

## 2026-07-29 — Production par packs de disciplines

**Décidé :** la production continue se fait par lots d'une discipline entière,
plutôt qu'en vrac ou par thème transversal. Objectif : constituer vite le stock
avant publication.

**Pourquoi :** le brief (§9) demande 200-300 fiches validées avant lancement, soit
60 à 90 jours d'avance. Travailler discipline par discipline permet de mutualiser
la recherche de sources et de garder une cohérence de ton à l'intérieur d'un lot.

**À surveiller :** l'app sert un concept par jour en piochant dans les disciplines
choisies par l'utilisateur (brief §5). Un stock déséquilibré — une discipline
complète, les autres vides — rendrait le service impraticable pour qui n'a pas
coché la bonne. Il faut donc atteindre un socle minimal sur toutes les disciplines
actives avant de publier, même si la production se fait pack par pack.

**Note :** le lot Doppler, lui, est thématique et transversal (physique, biologie,
médecine). Il reste exploitable comme pack thématique en achat unique (brief §12) :
`theme: "effet-doppler"` et `theme_ordre` sont déjà renseignés. Chaque fiche reste
autonome et peut tomber un jour quelconque.

---

## 2026-08-03 — Les disciplines sont étalées, pas seulement battues

**Décidé :** après le battage déterministe, la suite d'un lecteur passe par une passe de
répartition. Une même discipline ne tombe jamais deux jours d'affilée, et chaque
discipline est étalée sur toute la longueur de la suite à son propre pas : la k-ième
fiche d'une discipline qui en compte *t* est placée à `(k + ½) / t` de la course.

**Pourquoi :** un battage honnête fait des paquets. Sur trois disciplines cochées, il
donnait onze collages sur trente jours, dont des séries de trois fiches de philosophie de
suite. Le calendrier et l'archive portent l'encre de la discipline : ces paquets se
lisent immédiatement, et un lecteur qui a coché trois disciplines pour alterner a
l'impression de n'en recevoir qu'une.

**Ce qui n'a pas changé :** `MelangeDeterministe` — c'est un contrat partagé entre le
pipeline, l'esquisse et le client iOS, figé par un test doré des deux côtés. La
répartition réordonne son résultat sans tirer un seul nombre, donc la suite reste
reproductible : même sélection, même graine de lecteur, même programme. Et l'ordre *à
l'intérieur* d'une discipline reste celui du battage — c'est là que vit le hasard, et
c'est le seul endroit où il compte pour le lecteur.

**Le piège évité :** une première version servait à chaque pas « la discipline la plus
fournie ». Elle donnait bien l'alternance, mais reléguait les disciplines pauvres en fin
de suite — un lecteur qui coche Philosophie et Médecine n'aurait pas vu une seule fiche
de médecine avant des mois, et ça ne se voyait pas : la grille du premier mois était
parfaitement panachée. Un test l'a rattrapé, en exigeant qu'à mi-parcours **chaque**
discipline ait servi la moitié de son stock à une fiche près.

**La couture compte aussi.** La suite se répète une fois épuisée, donc la dernière fiche
est voisine de la première. Sans traitement, la boucle recollait deux fois la même
discipline une fois par tour de corpus.
