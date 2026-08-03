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
| Master archivé | MP3 44,1 kHz mono **128 kbit/s** (~3,3 Mo la fiche) |
| Dérivé servi | AAC mono **32 kbit/s** (~900 Ko la fiche) |
| Hébergement | **Cloudflare R2** — pas Netlify (voir plus bas) |

**Pourquoi pas OpenAI, malgré un tarif inférieur** : aucun moyen de figer une
prononciation (ni SSML, ni dictionnaire phonétique). Le corpus fait dire 832 noms propres
distincts — Doppler, Whorf, Boas, Eichmann, Ockham. Une voix qui dit « Doppleur »
décrédibilise une fiche dont tout le propos est l'exactitude.

**Pourquoi `v3` bien qu'il ne sache pas recoudre la prosodie entre deux requêtes** : sa
limite est de 5 000 caractères, la plus longue fiche du corpus en fait 3 874. Une fiche
tient donc toujours en **une seule requête**, et il n'y a jamais rien à recoudre. Un test
le verrouille (`test/audio.test.js`).

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
