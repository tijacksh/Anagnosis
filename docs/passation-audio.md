# Passation — produire l'audio des fiches

Tout ce qu'il faut pour reprendre la sonorisation du corpus dans une conversation neuve.
La décision de fond est dans `docs/decisions.md`, entrée **2026-08-02 — L'écoute**.

## Ce qui est tranché, et n'est pas à rediscuter

| | |
|---|---|
| Fournisseur | **ElevenLabs** |
| Modèle | **`eleven_v3`** — le seul à honorer un dictionnaire IPA |
| Voix femme | **Helene** — *A Warm French Documentary* · `a2NqrzzRklNWkb04aqW1` |
| Voix homme | **Jerome** — *French Narrator & Reflective Podcast* · `TES2Z4FdTbwd5F5uHmLW` |
| Allure | **1,25×** de la lecture naturelle, cuite dans le fichier |
| Master archivé | MP3 44,1 kHz mono **128 kbit/s** (~2,5 Mo la fiche) |
| Dérivé servi | AAC mono **32 kbit/s** (~750 Ko la fiche) |
| Horodatage | `/with-timestamps`, systématiquement |
| Hébergement | **Cloudflare R2** — pas Netlify (voir plus bas) |

**Pourquoi pas OpenAI, malgré un tarif inférieur** : aucun moyen de figer une
prononciation (ni SSML, ni dictionnaire phonétique). Le corpus fait dire 832 noms propres
distincts — Doppler, Whorf, Boas, Eichmann, Ockham. Une voix qui dit « Doppleur »
décrédibilise une fiche dont tout le propos est l'exactitude.

**Pourquoi `v3` bien qu'il ne sache pas recoudre la prosodie entre deux requêtes** : sa
limite est de 5 000 caractères, la plus longue fiche du corpus en fait 3 874. Une fiche
tient donc toujours en **une seule requête**, et il n'y a jamais rien à recoudre. Un test
le verrouille (`test/audio.test.js`).

## L'allure : 1,25×, et pourquoi elle est cuite dans le fichier

Les deux voix lisent naturellement à **120 et 131 mots par minute** — la bande du discours
structuré à pauses marquées, nettement sous la norme du livre audio (150-160). C'est juste
pour de l'exposition, et trop lent pour qui écoute des podcasts. À 1,25× on rejoint
exactement cette norme.

**`voice_settings.speed` ne sert à rien ici.** Le paramètre existe dans l'API (0,25 à 4,0)
mais `eleven_v3` ne l'honore pas : mesuré, deux appels au même texte à 1,0 et à 1,25 rendent
des fichiers de durée **identique à la milliseconde**. Ne pas perdre de temps à réessayer.

C'est donc `ffmpeg -filter:a atempo=1.25` qui s'en charge, au moment d'écrire le master —
il étire le temps sans toucher à la hauteur de voix. L'accélération est appliquée **au
master comme au dérivé** : le master alimentera le podcast, et un podcast qui n'aurait pas
la même allure que l'app serait un autre produit.

L'index enregistre `allure`, et **une allure changée refait tout le catalogue** : une fiche
à l'ancienne cadence au milieu des autres s'entend immédiatement. Le réglage 1× / 1,25× /
1,5× du lecteur part désormais de cette référence-là, pas du naturel.

## Les horodatages : à prendre dès le premier appel

`/with-timestamps` coûte **le même nombre de crédits** que l'endpoint ordinaire et rend en
plus l'instant où chaque caractère est prononcé. On le prend systématiquement, et l'index
range les frontières de passage sous `voix.<nom>.chapitres`.

La raison est économique autant que technique : deviner les frontières au prorata des
caractères supposerait un débit constant que la voix n'a pas, et s'apercevoir plus tard
qu'on veut les vraies coûterait **une seconde génération du corpus entier** — un demi-million
de crédits. Les instants sont divisés par `ALLURE`, puisque l'alignement porte sur l'audio
avant étirement.

L'app ne s'en sert pas encore : le chapitrage viendra quand le manifeste portera ces données.

## Les commandes

```bash
npm run asonoriser                        # ce qui n'a pas d'audio à jour
node src/cli.js sonoriser <id>            # produire une fiche
node src/cli.js sonoriser --lot           # produire tout le passage (8 fiches)
node src/cli.js sonoriser <id> --force    # refaire malgré un audio à jour
```

La clé vient de l'environnement et **n'entre jamais dans le dépôt** :

```bash
set -a; . ~/.anagnosis/cles.env; set +a
```

`ffmpeg` et `ffprobe` sont requis pour dériver le format de l'app. Ce sont des outils
d'atelier, pas des dépendances du pipeline : le ré-encodage a lieu au moment de la
production, jamais sur le NAS ni dans la chaîne de construction.

## Ce que l'index enregistre, et pourquoi

`audio/index.json` est **committé** ; `audio/masters/` et `audio/app/` sont ignorés.

Chaque entrée porte **l'empreinte du texte à partir duquel le fichier a été produit**.
C'est le point qui a dicté toute la structure : l'empreinte de contrôle ne couvre que le
fond éditorial, donc elle ne sait rien de l'audio. Se contenter de vérifier que le fichier
existe laisserait une fiche corrigée par `/reparer` servir le son de l'ancien texte — le
lecteur entendrait une version que la fiche ne dit plus, et **rien ne le signalerait**.
C'est le seul défaut de cette chaîne qui soit à la fois silencieux et durable.

Une fiche dont l'empreinte a bougé repasse donc d'elle-même en production. Le test
correspondant a été vérifié par mutation : il échoue bien quand on retire la comparaison.

**On ne régénère jamais sans raison.** Un second appel coûte des crédits *et* prend le
risque que le modèle ait bougé entre-temps — la voix du catalogue changerait d'une fiche à
l'autre, en silence. La commande est idempotente sur le texte, pas sur le fichier
(vérifié : un second appel ne dépense aucun crédit).

## Où on en est

- **162 fiches publiables**, 1 sonorisée (*La banalité du mal*, les deux voix)
- **15 786 / 131 000 crédits** consommés, plan Creator (22 $/mois), renouvellement le
  2 septembre 2026
- Mesuré : **~0,55 crédit par caractère**, soit ~3 200 crédits la fiche en deux voix

**Le rattrapage complet demande ~500 000 crédits.** Deux voies, à trancher :

- **un mois de Pro à 99 $** (600 000 crédits) fait tout le catalogue d'un coup, puis
  retour à Creator ;
- ou ~40 fiches par mois sur Creator, et le rattrapage prend quatre mois.

Le régime de croisière — une fiche par jour, deux voix — tient dans Creator (~96 000
crédits/mois) dans les deux cas.

## Ce qui reste à construire

1. **Le dictionnaire de prononciation IPA** — versionné dans le dépôt, alimenté depuis les
   832 noms propres détectés, avec une commande listant ceux sans règle. Ne marche que sur
   `eleven_v3` et `eleven_flash_v2` ; `multilingual_v2` ignore les phonèmes en silence.
   La consistance annoncée est de 80-90 %, pas 100 %.
2. **Le téléversement vers R2** — signature AWS SigV4 écrite à la main avec `node:crypto`,
   pas de SDK, pour que le pipeline tourne encore dans plusieurs années. **Bloqué** : le
   compte Cloudflare et le bucket n'existent pas encore.
3. **L'adresse et l'empreinte dans le manifeste** — `src/publier.js` ajoute par fiche et
   par voix : URL, SHA-256, durée. Comme `concepts.json` est signé en Ed25519, l'empreinte
   est couverte sans mécanisme supplémentaire.

## Deux règles d'architecture à ne pas perdre

**L'adresse vient du manifeste, jamais de l'app.** L'URL de chaque fichier doit être lue
dans `concepts.json`, jamais fabriquée côté client en collant des morceaux. C'est ce qui
rend un changement d'hébergeur invisible aux versions déjà installées — même leçon que
`src/publier.js` : une seule projection, pas deux.

**L'audio ne doit pas bloquer l'éditorial.** Une fiche sans audio reste **validée mais non
publiée**, jamais dévalidée : si le fournisseur tombe ou si la clé expire, aucun travail de
relecture n'est perdu.

**Une voix produite, ou rien — il n'y a pas de troisième niveau.** L'app a lu les fiches
avec la synthèse de l'appareil pendant un temps ; le moteur a été retiré. Le lecteur entend
une machine dès la première phrase, ce qu'aucun réglage ne rattrape, et il en conclut que
l'écoute est mauvaise plutôt qu'elle n'est pas encore prête. Une fiche sans voix produite
l'annonce désormais (« AUDIO PROCHAINEMENT DISPONIBLE ») et le bouton ne fait rien d'autre.

Conséquence directe pour la production : **chaque fiche sans audio est une fiche muette**
dans l'app. Ce n'est plus une dégradation discrète, c'est un manque visible — ce qui est
voulu, et ce qui donne le rythme au rattrapage.

## Un piège écarté, et sa vraie portée

`aLire` ne retirait que les doubles astérisques du gras, pas les simples de l'italique : 88
fiches sur 162 partaient à la génération avec leurs étoiles autour des titres d'ouvrage.
C'est corrigé, et deux tests le verrouillent dont un qui balaie tout le dépôt.

**À l'écoute, ElevenLabs les ignorait** — vérifié sur *Gedankenlosigkeit*, prononcé sans
étoile. Ce n'était donc pas un défaut audible, seulement du texte parasite envoyé au modèle.
La correction reste juste — on n'envoie pas de balisage à une synthèse, et rien ne garantit
qu'un autre modèle l'ignorera aussi bien — mais elle ne justifiait pas de tout refaire.

## Pourquoi pas Netlify pour l'audio

Le palier gratuit 2026 plafonne à ~15 Go mensuels, soit **15 000 écoutes**, après quoi le
site cesse de servir. Mettre le plafond là, sur un produit dont l'audio est un argument
d'abonnement, serait le pire endroit possible.

R2 : zéro frais de sortie, 10 Go de stockage gratuits (le corpus complet en deux voix en
occupe moins de 3), 10 M de téléchargements mensuels inclus. Le corpus entier coûterait
deux centimes par mois au-delà du gratuit.

## Comment l'audio atteint l'app aujourd'hui

En attendant R2, deux fichiers sont **embarqués** dans le bundle iOS :

```
Anagnosis/Ressources/Audio/phi-banalite-du-mal--helene.m4a
Anagnosis/Ressources/Audio/phi-banalite-du-mal--jerome.m4a
```

La convention de nommage est `<id-de-fiche>--<helene|jerome>.m4a`. `Ecoute.fichierProduit`
les cherche dans le bundle ; si le fichier existe, il est joué, sinon la synthèse de
l'appareil prend le relais. Le calendrier liste les fiches sonorisées sous la grille pour
les rendre atteignables — elles n'ont pas de jour dans le programme si leur discipline
n'est pas cochée.

Pour en ajouter une :

```bash
node src/cli.js sonoriser <id>
ffmpeg -i audio/masters/<id>--helene.mp3 -ac 1 -c:a aac -b:a 32k \
  ~/Anagnosis-app/Anagnosis/Ressources/Audio/<id>--helene.m4a
```

(Le dérivé existe déjà dans `audio/app/` — la copie suffit. La ligne `ffmpeg` n'est utile
que si l'on repart d'un master.)

Ce dispositif est **temporaire** et disparaîtra quand le manifeste portera les adresses.

## Outils annexes

`outils/comparer-voix.mjs` fait entendre une même fiche chez plusieurs fournisseurs et sur
les deux modèles ElevenLabs. Il a servi à trancher ; il resservira si l'on veut réévaluer
une voix.

Les échantillons de recette sont dans `docs/echantillons-voix/` — les deux voix retenues
sur *La banalité du mal*, avec le texte exactement tel qu'il est prononcé. C'est une pièce
justificative, pas une bibliothèque : ne pas en ajouter d'autres.
