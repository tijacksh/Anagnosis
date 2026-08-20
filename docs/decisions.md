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

---

## 2026-08-17 — Les huit fonctions Premium, et ce qui les tient ensemble

L'abonnement ne vendait au départ que l'écoute et la relecture du passé. C'était mince, et
surtout ça ne vendait rien qui soit propre au produit : l'audio se trouve partout, et la
rétroactivité est une levée de restriction, pas une addition.

Les huit retenues, dans l'ordre où elles ont été construites :

| | Où vit la règle | Ce qu'elle refuse de faire |
|---|---|---|
| Écoute | `Ecoute` | Aucune synthèse de secours : une voix produite, ou rien |
| Rétroactivité | `Regles` | La fenêtre gratuite glisse, elle ne s'accumule pas |
| Recherche | `Recherche` | Tous les mots doivent correspondre, pas un seul |
| Rappel espacé | `Rappel` | Un seul champ d'état, pas un journal de résultats |
| Planches | `Planche` | Ni pourcentage ni achèvement de discipline |
| Récap mensuel | `Recap` | Ni taux, ni comparaison au mois précédent |
| Export PDF | `DocumentFiche` | Ni image, ni filigrane anti-copie |
| Ce jour-là | `CeJourLa` | Jamais une fiche non lue, jamais le mois en cours |

**Ce qu'elles ont en commun est plus instructif que ce qui les distingue.** Chacune vit
dans le corpus partagé, en double exemplaire iOS et Android, avec ses tests en miroir.
Aucune ne connaît l'interface, et c'est ce qui a permis de les vérifier avant de savoir à
quoi elles ressembleraient.

**Et toutes refusent le tableau de bord.** Pas de pourcentage, pas de barre de progression,
pas de badge, pas de série à ne pas rompre au-delà de celle qui existait déjà. La raison
n'est pas de ton : un pourcentage suppose un dénominateur, donc un objectif, donc un échec
possible. Le produit sert **un** concept par jour et ne demande rien de plus — afficher
« 12 sur 31 » transformerait une lecture régulière en dette de dix-neuf jours.

**Deux défauts ne se sont vus qu'à l'écran, jamais à la lecture du code.** Le récap
nommait les quinze disciplines d'un mois varié sur six lignes illisibles — la légende
devenait du bruit exactement quand le mois était le plus intéressant. Et le PDF laissait
une URL se replier en fin de ligne, si bien que la copie rendait « benedict- ruth-1887-1948 » :
une adresse qu'on ne peut pas coller ne prouve rien, alors que c'est tout ce que l'export
existe pour garantir.

**Le widget iOS a demandé deux passages par le portail, et rien d'autre.** Une extension
WidgetKit tourne dans son propre conteneur et ne lit l'état du lecteur qu'à travers un
groupe d'app. L'App Store Connect API n'expose aucun endpoint pour en créer un —
`/v1/appGroups` répond 404 — ni pour **associer** un groupe existant à un App ID : la
capacité s'active bien par l'API, mais le profil sort alors avec
`application-groups = []`, ce qui se voit en le décodant et pas autrement.

Le trousseau offrait un contournement, le profil portant déjà
`keychain-access-groups = TVF6U47685.*`. Il a été écarté : détourner un magasin à secrets
en canal de transport pour trente kilo-octets de journal aurait laissé une bizarrerie
durable pour économiser deux minutes.

Trois choses à retenir de la mise en place, qui coûteront moins cher la prochaine fois :

- **Ajouter une capacité invalide les profils existants.** Celui de l'app est passé
  `INVALID` dès l'activation, et il faut le régénérer avant tout archivage.
- **La signature automatique ne convient plus** dès qu'une cible porte un entitlement
  particulier : elle choisit un profil d'équipe générique, qui n'a aucune raison de porter
  la capacité. Les deux cibles passent en manuel sur Release.
- **`Info.plist` d'une extension ne va pas dans le dossier synchronisé.** Il y serait copié
  une seconde fois comme ressource, et l'ajouter à `GENERATE_INFOPLIST_FILE` produit la
  même collision. Il vit dans `Support/Widget/`, comme celui de l'app.

**Et le widget ne calcule rien.** L'app dépose le résultat dans le groupe partagé, le
widget le peint. Décoder un corpus de 2,4 Mo à chaque rafraîchissement, dans un processus
à mémoire bornée, ferait tuer l'extension — et un widget tué n'affiche rien du tout. Le
dépôt est recopié de part et d'autre plutôt que partagé, et un test décode un dépôt réel
avec la définition de l'extension : le prix de la copie se paie au test, pas chez le
lecteur devant un widget vide.

---

## 2026-08-17 — Le titre défile, et le widget a trois modes

**Décidé :** dans la barre de lecture, un titre trop long **défile** au lieu d'être
tronqué, avec un dégradé aux deux bords et un retour au début en fondu. Et le widget
d'écran d'accueil offre trois contenus au choix : *ce jour-là*, *la fiche du jour*, ou
rien de nommé.

### Le défilement

À une ligne fixe, la barre coupait **84 % des titres du corpus** — la médiane est à 46
caractères, le maximum à 77 — et un rappel qui s'arrête au milieu d'une phrase ne rappelle
rien. Réduire la taille du titre a été essayé et gardé pour les titres longs
(`Typo.tailleTitre`), mais seul il ne suffisait pas : à 62 % de la taille, un titre de 70
caractères reste coupé, et la barre devient illisible avant d'être complète.

Trois réglages sont venus de l'usage sur appareil, et aucun n'aurait été trouvé autrement :

- **Le fondu des bords.** Sans lui, une lettre est là, puis coupée en deux, puis absente :
  c'est ce qui fait qu'un défilement a l'air d'un bandeau publicitaire plutôt que d'un
  texte qu'on lit. Le masque n'est posé **que quand le texte défile**, sinon il mangerait
  les premières lettres d'un titre court pour rien.
- **La pause de départ à 3,5 secondes.** Une seconde et demie suffit à ce que l'œil arrive
  sur le titre, pas à ce qu'il en lise le début. Un mouvement qui démarre pendant la
  lecture fait tout reprendre.
- **Le pourcentage à largeur fixe.** Il s'élargissait de « 0 % » à « 100 % » en cours de
  lecture, reprenait cette place au titre, et le titre se remesurait — le lecteur voyait le
  texte se faire rogner **pendant** qu'il faisait défiler la page. Le défaut ne se voyait
  qu'en scrollant, jamais à l'arrêt.

**Rien ne bouge si le système demande moins de mouvement.** `accessibilityReduceMotion` sur
iOS, l'échelle de durée des animations à zéro sur Android : le texte est alors simplement
tronqué. Ce n'est pas une case à cocher, un lecteur qui l'a activée le paie physiquement.

Un piège de mise en page, propre à SwiftUI et coûteux à trouver : `fixedSize` donne au
texte sa largeur naturelle, la seule comparable à celle du cadre, mais cette largeur idéale
**remonte jusqu'aux parents**. La barre entière s'élargissait, le titre passait par-dessus
le pourcentage et le bouton d'écoute, et le `clipped` ne coupait rien puisque le cadre avait
grandi avec le texte. Il faut un `GeometryReader` **en conteneur** : il accepte la taille
qu'on lui propose sans rien remonter. Le `BoxWithConstraints` de Compose n'a pas ce défaut.

### Les trois modes du widget

Le widget ne montrait que ce qui avait **déjà** été lu, et la raison tenait : nommer le
concept du jour sur l'écran d'accueil le dévoile hors de l'app, or c'est en l'ouvrant qu'on
le découvre. C'était le bon défaut, ce n'était pas la bonne unique option — un lecteur
régulier veut voir de quoi parle sa journée avant de décider quand la lire, et le titre est
l'invitation, pas la révélation. `ceJourLa` reste donc ce qu'on obtient sans rien régler.

L'ancien booléen `widgetCeJourLa` disparaît sans migration : les deux décodeurs ignorent les
clés inconnues, un état d'avant reprend le défaut. C'est une préférence d'affichage, pas une
trace de lecture — la reperdre une fois ne coûte rien, alors qu'un champ mort gardé « au cas
où » se traîne des années.

**Côté iOS, le dépôt transporte désormais le surtitre déjà rédigé** (« IL Y A DEUX MOIS »,
« AUJOURD'HUI ») au lieu du nombre de mois. Trois modes à nommer, chacun avec ses cas
particuliers, feraient de l'extension un second endroit où la règle vit, et le second
endroit est toujours celui qu'on oublie de corriger. Côté Android le widget lit les mêmes
fichiers que l'app et n'a pas ce problème : il tient les trois branches lui-même.

---

## 2026-08-18 — Le widget montre la figure de la fiche, et suit la nuit

**Décidé :** le widget affiche, en plus du titre, **la figure de la fiche** et la **série en
cours**, et il suit l'apparence du téléphone.

**La figure est rendue par l'app, jamais redessinée par le widget.** Des deux côtés, pour
deux raisons différentes : sur iOS, faire compiler `ChampEncre` dans l'extension obligerait à
partager quatre fichiers entre deux cibles ou à les recopier ; sur Android, `RemoteViews` ne
sait pas dessiner du tout, il ne sait que montrer une image. Le pont faisait déjà l'inverse
depuis le début — l'app dépose le résultat, le widget le peint — et une figure rendue *est*
un résultat. Elle a surtout une qualité que la copie n'aurait jamais : c'est le rendu de la
fiche elle-même, pas quelque chose qui lui ressemble. Le jour où le vocabulaire graphique
changera, le widget suivra sans qu'on y touche.

**La série est un compte, jamais une jauge.** Pas de dénominateur, donc pas d'objectif, donc
pas d'échec possible : le produit ne demande rien de plus qu'un concept par jour.

### Trois défauts que seul le fait de regarder a montrés

- **Le widget Android n'avait jamais pu s'afficher.** `RemoteViews` n'inflate qu'une liste
  fermée de classes, et `android.view.View` — utilisé pour la pastille d'encre depuis
  l'origine — n'en fait pas partie. L'écran d'accueil affichait « Can't load widget », et
  rien n'apparaissait côté app : ni erreur de compilation, ni test rouge, ni journal. Il
  fallait poser le widget pour le voir. C'est un `ImageView` désormais.
- **Le dépôt n'était réécrit qu'à l'enregistrement de l'état.** Un lecteur qui met l'app à
  jour et se contente de la lire gardait celui de la version d'avant ; quand la forme du
  dépôt a changé, l'extension ne savait plus le décoder et affichait « Ouvrez l'app une fois
  pour commencer » devant quelqu'un qui venait justement de l'ouvrir. Le dépôt est
  réapprovisionné à **chaque lancement**.
- **Une image posée par le fournisseur ne suit pas la nuit.** Les couleurs du widget Android
  se résolvent à l'inflation et basculent seules ; un bitmap est figé au moment où le
  fournisseur tourne, et `ACTION_CONFIGURATION_CHANGED` n'est pas délivré aux récepteurs du
  manifeste. Le widget passait en sombre avec un rectangle crème au milieu. On dépose donc
  **les deux** figures, et `values-night/` choisit laquelle est visible — `android:visibility`
  accepte une référence d'entier. La pastille d'encre suit le même chemin. iOS n'a pas ce
  problème : l'extension lit le fichier au moment où elle se peint, et connaît son mode.

### Et le titre de la barre, quand le système refuse le mouvement

Le défilement ne partait pas sur l'appareil et partait sur le simulateur : la différence
était **Réduire les animations**. Le réglage a raison — un texte en mouvement permanent est
exactement ce contre quoi il protège — mais ne pas bouger ne veut pas dire être coupé, et
rendre un titre tronqué au lecteur qui a le moins de moyens d'y remédier serait absurde.
Immobile, le texte se replie sur deux lignes et se réduit jusqu'à tenir : le plus long titre
du corpus, 77 caractères, passe entier.

---

## 2026-08-18 — Les notifications s'arrêtaient en silence, et le verre ne floutait rien

Trois défauts signalés depuis un appareil de test, et un quatrième trouvé en cherchant.

### La notification ne partait pas tous les jours

Deux causes, l'une et l'autre silencieuses.

**Le système efface les alarmes en attente plus souvent qu'on ne le croit.** Le redémarrage
était traité ; la **mise à jour de l'app** ne l'était pas. C'est le cas qui touche le plus
les testeurs, qui reçoivent une version par jour : installer la mise à jour et ne pas ouvrir
l'app avant l'heure du concept suffisait à ne rien recevoir, ce jour-là et tous les suivants.
`MY_PACKAGE_REPLACED` réarme désormais la fenêtre, comme `BOOT_COMPLETED`. Le changement de
fuseau et l'heure système ont été ajoutés au passage : les alarmes sont posées en
millisecondes absolues, et un lecteur qui voyage voyait son concept arriver au milieu de la
nuit.

**Et le repli sur `set` était différé par Doze**, c'est-à-dire jusqu'à ce que le lecteur
reprenne son téléphone. Un téléphone posé sur une table de nuit à 8 h 10 est précisément en
Doze. La notification arrivait donc au moment où l'on avait déjà eu l'idée d'ouvrir l'app :
elle avait l'air capricieuse, jamais absente. `setAndAllowWhileIdle` la laisse sonner à
quelques minutes près, ce qui suffit largement. Ce repli est le cas **courant** et non
l'exception : depuis Android 14, `SCHEDULE_EXACT_ALARM` n'est plus accordée d'office, et
`USE_EXACT_ALARM` est réservée par Play aux réveils et aux agendas.

**Une note de méthode, parce qu'elle a coûté trois essais.** Ce défaut ne se vérifie qu'en
laissant une vraie alarme sonner. Trois manières de fausser le test : réinstaller l'app après
l'heure visée, ce qui recalcule la fenêtre au lendemain ; `am force-stop`, qui annule toutes
les alarmes en attente ; et `am broadcast` depuis le shell, qui n'atteint pas un récepteur
`exported="false"`.

### Le verre dépoli ne floute rien

Reproduit à l'identique sur l'émulateur : ce n'est pas l'appareil. La barre laissait lire, au
travers et **net**, le texte de la page — deux textes superposés, dont aucun n'était lisible.
Trois formulations de la capture ont été essayées (couche de fond rejouée, contenu dessiné
deux fois, couche floue en pleine taille) ; aucune n'a produit de flou, et la sonde montre
que la géométrie du découpage est pourtant exacte.

En attendant que ce soit compris, la teinte de la barre passe de 55 % à 86 % : on devine
encore l'encre qui passe dessous, et plus rien ne concurrence les libellés. **La valeur
redescendra le jour où le flou marchera, pas avant** — mieux vaut un verre discret qu'un
verre illisible.

### Et deux choses en passant

La ligne de diagnostic rouge sous l'heure du concept a été retirée : elle traquait un
glissement cassé sur un appareil précis, et le sujet est clos.

**La liste de sélection de l'heure arrive sur iOS.** Elle était née côté Android comme voie
de secours, le glissement y étant signalé cassé ; elle y est restée parce qu'elle est
meilleure — passer de 08:10 à 21:30 au doigt est un long geste, contre deux tapotements. Les
deux écrans qui la montrent partagent désormais un seul composant, `ReglageHeure` : ils
avaient deux copies, et une liste ajoutée d'un seul côté aurait fait deux réglages différents
pour le même choix.

---

## 2026-08-18 — Le relevé, et pourquoi ce n'est pas un score

**Décidé :** la demande était « un score de bonnes réponses par discipline, pour comprendre
où l'on est fort et où ça pêche ». Ce qui est construit est **le relevé** — décision n° 4 du
2 août, jamais bâtie — et non un pourcentage.

**Un pourcentage aurait été faux**, et pas seulement hors charte. « Soixante-deux pour cent
en physique » mesure les questions qu'on a posées, pas ce que le lecteur sait : trois
questions tirées dans douze fiches lues, et le chiffre bouge de vingt points selon le tirage.
Le lecteur prendrait un artefact d'échantillonnage pour un verdict sur lui-même. S'y ajoute
la règle qui tient depuis le début : un pourcentage suppose un dénominateur, donc un
objectif, donc un échec possible.

**Ce qui le remplace répond à la même question, et mieux.** Deux listes par discipline, ce
qui est revenu juste et ce qui est revenu faux, la discipline la plus effacée en tête. On
voit où ça pêche à la longueur de la seconde colonne, sans qu'aucun chiffre ne soit prononcé,
et chaque ligne est une fiche qu'on peut rouvrir. **Une note se subit, une liste se traite.**

Deux détails de conception qui portent tout le reste :

- **Une bonne réponse ne compte comme « ça tient » qu'au-delà de dix jours d'écart** avec la
  lecture. En dessous, retrouver la réponse ne prouve rien de plus que de savoir lire.
- **Une discipline sans réponse n'apparaît pas.** Écrire « rien à signaler » sur douze
  disciplines noierait les deux qui ont quelque chose à dire.

**Le format d'état est celui que la décision du 31 juillet avait annoncé sans l'écrire** :
une entrée par concept, remplacée à chaque passage. La taille est donc bornée par le corpus
et non par l'ancienneté du lecteur — une vingtaine de kilo-octets au pire, et ce pire suppose
un lecteur interrogé sur tout ce qui existe. Un journal complet des réponses aurait permis de
tracer des courbes, c'est-à-dire précisément ce qu'on ne veut pas.

**Où il se place, et pourquoi là.** Troisième carte du profil, après les planches et le
récap. Les planches disent ce que le lecteur a vu, le récap ce qu'il a lu, le relevé ce qu'il
en a gardé — et ce dernier n'a de sens qu'une fois qu'on a de quoi oublier.

## 2026-08-18 — L'offre annonçait trois fonctions sur sept

**Constaté :** l'écran d'abonnement listait l'écoute, les soixante jours et « rien ne se
referme ». La recherche, le rappel, le récap, les planches et le PDF n'apparaissaient nulle
part au moment où le lecteur décide de payer.

Personne ne l'avait vu parce qu'**une liste de vente n'a pas de test tant qu'elle est de la
mise en page**. Elle vivait en double dans les deux écrans, et elle a cessé d'être vraie des
deux côtés en même temps, à mesure que les fonctions arrivaient sans que la liste suive.

Elle vit désormais dans le corpus partagé (`Offre`), avec ses tests en miroir, comme les
autres règles du produit. Un test vérifie qu'aucun motif ne **retire** un argument, et que
les durées annoncées viennent des règles plutôt que d'une chaîne recopiée.

**Et l'ordre suit le motif** : celui qui vient de buter sur l'écoute lit l'écoute en premier,
c'est la seule ligne dont il sait déjà qu'elle lui manque. Les motifs passent de quatre à dix,
un par porte — le PDF ouvrait l'offre sur l'écoute, les planches et le récap sur l'archive.

## 2026-08-18 — Une routine pour remplir le sac de questions

**Décidé :** `/questionner`, dix fiches par passage, **quatre fois par jour** (01:38, 07:38,
13:38, 19:38).

Le corpus a été écrit avec une question par fiche, et c'était suffisant tant qu'elle ne
servait qu'une fois. Le rappel, la révision et l'épreuve tirent tous dans le même sac : avec
une seule question, ils rejouent celle du jour mot pour mot, et le lecteur qui la retrouve
intacte croit avoir retenu ce qu'il a seulement reconnu.

Le champ `quiz_supplementaire` est **additif**, jamais `quiz` transformé en tableau : le
tableau aurait cassé les trois cents fiches déjà écrites *et* le décodeur des binaires déjà
installés, qui reçoivent le fichier signé sans être mis à jour.

Deux choses distinguent cette routine des quatre autres :

- **C'est un rattrapage, pas un entretien.** Elle s'arrête d'elle-même quand chaque fiche
  servie porte assez de questions. Une routine de rattrapage qu'on garde branchée en
  permanence est le signe qu'on continue de commettre l'oubli qu'elle répare.
- **Elle est hors du tour de rôle**, à une heure et demie de tout le monde : les quatre
  autres se passent le relais parce que chacune travaille sur ce que la précédente vient de
  produire, celle-ci ne dépend de personne.

L'ordre est **une fiche par discipline en tournant**, la moins avancée d'abord. Le lecteur ne
coche que trois disciplines, et un rattrapage alphabétique remplirait Anthropologie en entier
avant de toucher à la Physique.

---

## 2026-08-18 — La révision, et l'épreuve où le chiffre est juste

**Décidé :** les deux dernières fonctions de la liste du 2 août sont construites. L'offre
annonce désormais neuf fonctions, toutes livrées.

### La révision

Le rappel interroge sur **trois dates précises** — dix jours, six semaines, six mois — et
c'est ce qui en fait une répétition espacée. La révision fait l'inverse : elle pioche
n'importe où dans le passé du lecteur, sans calendrier, parce qu'un examen qu'on peut
anticiper n'éprouve que l'anticipation.

Deux bornes qui décident du reste : **une question par fiche au maximum**, sans quoi trois
questions d'affilée sur la même fiche donneraient l'impression d'un interrogatoire sur un
détail, alors qu'on cherche à mesurer l'étendue ; et **dix par séance**, plafonnées par ce
qui existe.

Elle réutilise l'écran du rappel au lieu d'en copier un second. Le rappel, la révision et
l'épreuve posent les mêmes questions de la même façon ; seuls le titre du bilan et la phrase
qui suit changent. Trois écrans jumeaux auraient divergé d'un point d'opacité avant la fin du
mois.

**C'est le seul endroit du produit où l'on veut vraiment du hasard.** Partout ailleurs — la
suite, l'ordre des propositions, la figure d'une fiche — un tirage stable est ce qui empêche
l'écran de danser sous le doigt. Ici, deux séances identiques enseigneraient l'ordre des
propositions, pas le contenu.

### L'épreuve offerte

**Le seul endroit où un chiffre est juste.** Ailleurs, un pourcentage suppose un dénominateur,
donc un objectif, donc un échec possible. Ici le chiffre *est* le propos : l'épreuve ne mesure
pas le lecteur pour le classer, elle lui montre l'écart entre ce qu'il croit avoir gardé et ce
qu'il a gardé. C'est une démonstration, pas une note, et elle ne se répète pas — une
démonstration qu'on peut rejouer devient un jeu, et un jeu ne démontre rien.

**Elle est hors du verrou**, et c'est le point : une épreuve réservée aux abonnés démontrerait
l'oubli à ceux qui ont déjà payé pour le combattre, c'est-à-dire à personne.

Trois seuils, chacun pour une raison : trente jours d'usage et vingt fiches lues, parce
qu'avant il n'y a rien à oublier ; et **plus d'un mois d'ancienneté** sur les lectures
interrogées, parce que c'est là que l'oubli a fait son travail. Interroger sur la semaine
passée montrerait seulement que le lecteur sait lire.

Le verdict ne juge jamais, ni reproche ni triomphe. Il dit que l'oubli est le cas ordinaire,
qu'il se mesure, et qu'il existe quelque chose contre.

### Une dette réglée au passage

Les clients ne décodaient pas `quiz_supplementaire` : le champ existait dans le schéma et
dans les fiches, et les trois fonctions qui en dépendent tiraient dans un sac vide.

---

## 2026-08-19 — Le rappel sort du verrou, une fois par semaine (essai)

**Décidé, à titre d'essai :** le rappel devient accessible sans abonnement, **une fois tous
les sept jours**. Un abonné le retrouve chaque jour, comme avant.

**Le défaut que ça corrige.** Ce qui différencie vraiment ce produit est la boucle qui
transforme une lecture en connaissance — rappel, révision, relevé — et elle était entièrement
derrière le verrou. Un lecteur gratuit ne pouvait donc jamais l'éprouver. L'épreuve offerte
démontrait le **manque** une fois après trente jours, jamais le **remède** : on montrait la
maladie sans laisser goûter le médicament.

**Le même rappel, moins souvent, et pas un rappel diminué.** Donner une seule question au
lieu de trois aurait été plus prudent et plus faux : le lecteur aurait goûté autre chose que
ce qui est en vente. Sept jours, c'est assez pour sentir que ça marche et pas assez pour s'en
passer.

**Le compteur part du dernier rappel mené à son terme**, jamais de la dernière ouverture :
refermer sans répondre ne consomme pas la semaine.

**Comment on le défait.** Une seule constante, `joursEntreRappelsGratuits` / 
`JOURS_ENTRE_RAPPELS_GRATUITS` : `0` rend le rappel entièrement gratuit, `Int.max` le remet
entièrement derrière le verrou, c'est-à-dire l'état d'avant. Rien d'autre n'est à toucher, et
aucune donnée de lecteur n'est modifiée par l'aller-retour — c'est ce qui rend l'essai
réversible sans dette.

### Ce que cet essai ne règle pas

**La thèse et le verrou se contredisent toujours.** La règle écrite est « Premium ne donne pas
plus de jours, il donne plus de chaque jour », or le verrou le plus fort du code reste un
verrou de jours : tout ce qui a plus de deux jours se ferme, et l'argument de tête du paywall
est « jusqu'à soixante jours en arrière ». Le produit dit au lecteur qu'un concept par jour
suffit, puis lui vend des jours en plus.

La sortie cohérente serait de **libérer le passé et de vendre la mémoire** : gratuit, le
concept du jour et toute l'archive ; payant, tout ce qui fait retenir. Elle est écartée pour
l'instant faute de données — on retirerait le verrou qui produit aujourd'hui la frustration
payante, sans savoir ce que la boucle de mémoire convertit seule. L'essai du rappel
hebdomadaire est le premier pas qui permettra de le savoir.

---

## 2026-08-19 — Le Premium compartimenté

**Décidé :** la frontière entre gratuit et payant est arrêtée, écran par écran.

| | Gratuit | Premium |
|---|---|---|
| Concept du jour | oui | oui |
| Recul | 3 jours, **même déjà lue** | tout, rien ne se referme |
| Disciplines | 3, **un changement offert** | toutes, un changement par mois |
| Rappel | une fois par semaine | trois questions par jour |
| Récap, relevé | **ouverts**, fiches cliquables | ouverts |
| Écoute, recherche, révision, planches, PDF | fermés | ouverts |
| Épreuve offerte | une fois | une fois |
| Historique | conservé intégralement | conservé |

**L'historique reste entier quoi qu'il arrive.** Un lecteur gratuit ne peut plus rouvrir une
fiche de la semaine dernière, mais son journal, ses réponses et son relevé la connaissent
toujours. Fermer l'accès n'est pas effacer la trace : les statistiques de lecture continuent
de dire vrai, et un abonnement rouvre un passé complet plutôt qu'un passé reconstitué.

### Ce que le récap et le relevé ouverts changent

C'était le seul arbitrage vraiment disputé. Avec les règles ci-dessus, le profil d'un lecteur
gratuit affichait **quatre cadenas à la suite**, ce qui se lit comme une démo et non comme un
produit.

La sortie retenue est meilleure que celle que j'avais proposée : les deux écrans restent
ouverts, **et chaque ligne y devient une porte**. Le lecteur voit ses fiches par leur nom, en
touche une, et tombe sur l'offre. Une carte fermée dit « il y a quelque chose derrière » ; un
écran ouvert dont les portes butent dit **exactement ce qui manque**, avec un titre à l'appui.

Conséquence sur la liste de vente : le récap et le relevé en sortent. Un argument qu'on peut
avoir sans payer affaiblit tous les autres. Leurs motifs d'abonnement mènent désormais à
l'argument du **passé**, parce que c'est le passé qui manque à ce moment-là, pas l'écran.

### Les disciplines

Trois sans abonnement, et le plafond vaut **exactement** le plancher : cocher une quatrième
n'affiche pas un refus, ça ouvre l'offre. Le lecteur découvre la limite en la touchant, jamais
en lisant une note en bas d'écran.

**Un seul changement offert, et il ne se recharge jamais.** Figer le choix à vie était la
règle demandée ; elle a été adoucie d'un cran parce que « j'ai coché Archéologie par curiosité
et je suis coincé » est le seul cas où le lecteur a raison d'être furieux, et c'est un
désinstallé, pas un abonné. Un changement rend l'erreur rattrapable sans ouvrir le zapping.

Côté Premium, toutes les disciplines mais **un changement par mois** : chaque changement
rebat les jours à venir, et le rendre libre inviterait à piocher dans le corpus en changeant
de sélection tous les matins. C'est une protection contre soi-même plus qu'un verrou
commercial.

**Un chiffre à garder en tête :** à trois disciplines, la suite d'un lecteur fait une
trentaine de jours avant de boucler et de resservir des fiches. Le contenu se répète donc au
bout d'un mois pour qui ne s'abonne pas. C'est le levier voulu, à condition que tout le reste
tienne d'ici là.

**Le refus est décidé dans le dépôt, pas seulement dans l'écran.** Un chemin qui
contournerait le bouton grisé, aujourd'hui ou dans six mois, ne doit pas rendre le changement
gratuit. Et la fusion entre appareils prend toujours le côté le plus restrictif : on ne
récupère jamais un changement en changeant de téléphone.

---

## 2026-08-20 — Séparer l'atelier de la boutique, et ce que vaut la sécurité

**Décidé :** les outils de test disparaissent de l'application distribuée au public, et
restent visibles pour les testeurs. Le partage se fait par un seul verrou, `Atelier.actif`.

### Pourquoi ce n'est pas `#if DEBUG`

**Une build TestFlight est une build Release.** Un `#if DEBUG` aurait caché les outils à ceux
qui en ont le plus besoin, et à personne d'autre — puisque le seul binaire qui sort d'ici part
sur TestFlight.

Sur iOS, ce qui distingue vraiment les deux est le **reçu** : TestFlight en pose un « bac à
sable », l'App Store un reçu de production. C'est la seule différence observable entre deux
binaires par ailleurs identiques, et elle est décidée par Apple à la distribution, pas par
nous à l'archivage. **C'est ce qui rend l'oubli impossible** : avec deux configurations, il
suffit d'archiver la mauvaise un soir de fatigue pour livrer la bascule d'abonnement au monde.
Ici il n'y a rien à choisir.

Android n'a pas d'équivalent : un AAB de piste interne est une build release comme celle de
production. Il faut donc **deux artefacts**, d'où un type de build `beta` qui pose
`BuildConfig.ATELIER` à vrai. Même signature et même identifiant que `release` : un
`applicationIdSuffix` obligerait le testeur à désinstaller pour passer en production, donc à
perdre son historique. `outils/publier-play.py` envoie `beta` sur la piste interne et
`release` en production, et le refuse dans l'autre sens.

### Ce qui disparaît en boutique

Les dix-neuf forçages de ligne de commande, la bascule Gratuit/Premium des réglages, la
section Développement (remise à zéro, graine, décompte du corpus) et l'écran de contrôle du
socle. Vérifié en construisant en Release et en lançant avec `-amorcer 1 -onglet reglages` :
l'app démarre sur l'onboarding, comme un vrai premier lancement.

Un trou trouvé en regardant cet écran, et qu'aucun test n'aurait vu : **l'onboarding ne
plafonnait pas les disciplines**. Un lecteur gratuit pouvait en cocher dix à l'inscription et
n'en perdre aucune ensuite, la limite ne mordant qu'au premier changement, c'est-à-dire jamais
pour celui qui ne change pas.

### La revue de sécurité, et ce qu'elle ne dit pas

**Ce qui tient :**

- Le contenu distant est signé en Ed25519 et **vérifié avant d'être décodé**, des deux côtés.
  Une prise de contrôle de l'hébergement ne peut pas réécrire les sources des fiches.
- Chaque fichier audio est vérifié par son empreinte SHA-256 après téléchargement, avant
  d'être joué.
- Un seul point réseau par client, en clair dans les réglages, et rien n'est envoyé : pas de
  compte, pas d'identifiant, aucune mesure d'usage. Aucune exception ATS sur iOS, aucun trafic
  en clair autorisé sur Android, aucun schéma d'URL déclaré.
- Aucune clé privée dans les dépôts. La clé de signature du contenu vit dans `~/.anagnosis/`,
  celle d'App Store Connect dans `~/.appstoreconnect/`, le compte de service Play dans
  `~/.playconsole/`, le trousseau Android dans `~/.anagnosis/`. Les trois dépôts sont privés.

**Ce qui ne tient pas, et qu'il faut savoir :**

- **`Atelier.actif` n'est pas une frontière de sécurité, c'est une frontière d'affichage.** Un
  binaire se modifie, un conteneur se réécrit sur un appareil débridé.
- **`premium` est un booléen rangé dans l'état du lecteur**, sauvegardé par la plateforme et
  fusionné entre appareils. Aujourd'hui c'est une bascule de démonstration, et rien n'est en
  jeu. **Le jour où l'abonnement se vend, le droit devra venir de StoreKit et de Play
  Billing, vérifiés, jamais de ce champ.** La réserve était déjà consignée le 2026-08-02 ;
  elle devient bloquante à partir du moment où il y a de l'argent.
- **Le mot de passe du trousseau Android est en clair dans `build.gradle.kts`.** Le trousseau
  lui-même n'est pas versionné et les dépôts sont privés, donc ce n'est pas exploitable en
  l'état — mais les deux se retrouveraient ensemble le jour où l'un des deux fuit.
- **R8 est désactivé** (`isMinifyEnabled = false`). Sans conséquence directe ici, le seul
  secret embarqué étant une clé **publique** ; à reprendre quand les règles de conservation
  pour BouncyCastle et kotlinx-serialization auront été écrites et éprouvées.
- **La sauvegarde Android reste activée**, et c'est voulu : c'est elle qui permet à un lecteur
  de changer de téléphone sans rien perdre. Elle transporte donc aussi l'état, `premium`
  compris — ce qui est sans effet tant que le droit ne vient pas de la boutique, et une raison
  de plus pour qu'il en vienne.
