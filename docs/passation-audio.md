# Passation — produire l'audio des fiches

Tout ce qu'il faut pour reprendre la sonorisation du corpus dans une conversation neuve.
Les décisions de fond sont dans `docs/decisions.md` : **2026-10-20** (moteur local,
réglages de lecture), **2026-10-21** (les huit voix, puis l'abandon d'ElevenLabs et le
branchement). L'entrée du 2026-08-02 (ElevenLabs) est historique.

## Ce qui est tranché, et n'est pas à rediscuter

| | |
|---|---|
| Où | **Sur le Mac mini**, en local. Aucun service distant, aucun crédit. |
| Moteur | **OmniVoice** (`k2-fsa/OmniVoice`), servi par **VoiceStudio** (API sur `localhost:3900`) |
| Voix | **Huit voix clonées**, 4 femmes, 4 hommes (`audio/voix.json`), **une par fiche, en rotation** |
| Lecture | **Phrase par phrase**, pauses posées par le pipeline, années à l'oral court |
| Allure | **Propre à chaque voix** (`atempo`, de 1,15 à 1,27), fixe : une voix ne change jamais de débit |
| Volume | Normalisé, EBU R128 à −16 LUFS : la rotation ne s'entend pas au volume |
| Master archivé | MP3 44,1 kHz mono **128 kbit/s** (podcast) |
| Dérivé servi | AAC mono **32 kbit/s** (~0,6 Mo la fiche) |
| Hébergement | **Cloudflare R2**, derrière le Worker `anagnosis-audio` (inchangé) |
| Prononciation | Réécritures (`audio/prononciations.json`), **seulement après écoute** |
| Droit | **Jamais sonorisé** (`SANS_ECOUTE`) |

**Pourquoi pas ElevenLabs** (v3 ni v4 Turbo) : voir `decisions.md`, 2026-10-21. En bref,
v4 Turbo sonne mieux que nos clones, mais produire et entretenir le catalogue par son API
demande un abonnement tenu à vie et un million de crédits de rattrapage, et rend la
production dépendante d'un tiers.

## La machine

- **VoiceStudio** 0.5.6, dans `/Applications`. Ses données (`~/Library/Application
  Support/VoiceStudio` et `…/OmniVoice`) et le **cache des modèles** (`~/.cache/huggingface`)
  sont des liens vers le **SSD 1To**. SSD 1To débranché = plus de moteur : le rebrancher,
  ne rien recréer.
- **Les références des voix** (`reference.wav` + `reference.txt`, 15 à 20 s chacune, lues
  par Eleven v4 Turbo) : `~/.anagnosis/voix/production/<voix>/`, hors du dépôt. Le chemin
  se change par `ANAGNOSIS_VOIX`. Changer un clip refait toutes les fiches de cette voix
  (son empreinte est dans l'index).
- **Mémoire.** OmniVoice occupe environ 6 Go pendant la génération. Si d'autres moteurs
  (VoxCPM2 de Jarvis), des simulateurs ou Gradle tournent en même temps, la machine passe
  en swap et une fiche passe de 3-4 à 7 minutes, voire le moteur est tué en route. La
  commande décharge VoiceStudio à la fin ; la tâche de nuit tourne quand rien d'autre ne
  tourne.
- **GGUF** : un binaire `omnivoice-tts` a été compilé à la main (VoiceStudio 0.5.6 ne le
  livre pas) dans `…/VoiceStudio/runtime/project/bin/`. **Il n'est pas utilisé** : il
  recharge le modèle à chaque phrase (≈ 13 s par appel). À recompiler après une mise à
  jour de VoiceStudio seulement si l'on veut y revenir
  (`~/VoiceStudio/scripts/build-omnivoice-tts.sh --platform darwin-arm64 --commit-sha
  886fc079838ca7400cb2b42b36e2a65aa1daabe8`).

## Les commandes

```bash
npm run asonoriser                               # la file, les motifs, le temps estimé
node src/cli.js sonoriser <id>                   # une fiche (VoiceStudio ouvert)
node src/cli.js sonoriser --lot                  # le passage (8 fiches)
node src/cli.js sonoriser --file --jusqua 04:30  # toute la file, avec une heure de fin
node src/cli.js sonoriser <id> --force           # refaire malgré un audio à jour
npm run heberger                                 # téléverse vers R2 ce qui manque au bucket
```

Ouvrir VoiceStudio avant : `open -g /Applications/VoiceStudio.app`. Les clés R2 viennent de
l'environnement : `set -a; . ~/.anagnosis/cles.env; set +a`.

## La tâche de nuit

`outils/nuit-audio.sh`, lancée par launchd (`~/Library/LaunchAgents/fr.anagnosis.audio.nuit.plist`)
**à 1 h 15**, dans **son propre clone** (`~/Anagnosis/Anagnosis-audio-nuit`), jamais dans le
dépôt où d'autres sessions travaillent. Elle :

1. ne fait rien si elle part après **4 h 30** (un Mac réveillé à 5 h rattrape le rendez-vous
   manqué : elle ne doit pas déborder sur Jarvis ni sur la journée) ;
2. pousse d'abord un commit qu'une nuit précédente n'a pas pu pousser, et reprend un index
   resté non commité (mis de côté le temps du `git pull --ff-only` sur `main`) ;
3. ouvre VoiceStudio s'il est fermé ;
4. sonorise la file jusqu'à 4 h 30 (Jarvis prend VoiceStudio vers 5 h ; les routines
   tournent à :08 et :38 sans toucher à l'audio). Une phrase qui ne revient pas en dix
   minutes fait échouer sa fiche, pas la nuit ;
5. téléverse vers R2 (`heberger`) — **un échec : rien n'est publié** ;
6. lance `npm test`, et ne publie rien s'il échoue (la cause va au journal) ;
7. commite `audio/index.json` et pousse. Un push refusé (une routine a poussé entre-temps)
   se rattrape par `pull --rebase` et un nouvel essai, cinq fois au plus, **jamais forcé** ;
8. décharge OmniVoice — lui seul, pas le VoxCPM2 de Jarvis — même en cas d'erreur ou
   d'arrêt. Le verrou porte le PID : une nuit tuée ne bloque pas les suivantes.

Journal : **`~/.anagnosis/journal-audio.log`** (le script l'écrit lui-même ; launchd, qui ne
sait pas écrire sur un volume externe, n'a que `~/Library/Logs/anagnosis-audio/`). Une nuit
de test, sans push : `NUIT_SANS_PUSH=1 outils/nuit-audio.sh`.

**Rien n'est publié à moitié** : une fiche n'entre dans l'index qu'une fois son master et
son dérivé complets ; le manifeste ne publie une voix qu'une fois téléversée, et d'ici là
continue de publier l'ancien son de la fiche (`precedente`).

**Les fichiers sont nommés par leur empreinte** (`<id>--<sha16>.m4a`, master `<id>.mp3`) :
le nom du dérivé fait l'URL publiée et la clé R2. Il ne dit donc jamais qui lit, et une
fiche refaite ne réécrase jamais une clé que le manifeste déjà déployé désigne — le Worker
sert chaque chemin avec un cache long, en supposant qu'il ne change jamais de contenu.

## Ce que l'index enregistre, et pourquoi

`audio/index.json` est **committé** ; `audio/masters/` et `audio/app/` sont ignorés. Par fiche :

| Champ | Pourquoi |
|---|---|
| `empreinte` | le texte lu **et** les règles de prononciation qui le touchent |
| `empreinte_texte` | le texte seul : distingue « texte modifié » de « prononciation modifiée » |
| `moteur`, `modele`, `poids` | la révision des poids d'OmniVoice (`refs/main` du cache Hugging Face) |
| `moteur_version` | la version de VoiceStudio, pour l'enquête |
| `reglages` | la version des réglages de lecture (`REGLAGES` dans `src/audio.js`) |
| `voix_attribuee`, `reference`, `allure` | qui lit, avec quel clip, à quelle allure |
| `voix.<nom>` | fichier, sha256, octets, `secondes` (entier), `chapitres`, `r2` une fois téléversé |
| `precedente` | ce qui était en ligne avant la dernière production, publié tant que le nouveau son n'est pas téléversé ; effacé par `heberger` |

Un seul de ces éléments qui bouge, et la fiche repasse d'elle-même en production — sauf
`moteur_version`, gardé pour l'enquête : une mise à jour de VoiceStudio qui ne touche pas
aux poids ne refait pas 649 fiches. **On incrémente `REGLAGES`** à chaque changement qui
modifie le son (pauses, découpage, volume). `poids` lit `refs/main` du cache, c'est-à-dire
la révision téléchargée : VoiceStudio ne dit pas laquelle il a chargée.

## Côté apps (iOS et Android)

- Elles lisent `audio.lecture` (une voix, son genre) et, pour un manifeste plus ancien,
  `helene` puis `jerome`. **Plus de choix de voix** dans les réglages ; le lecteur affiche
  « FEMME » ou « HOMME », jamais le nom de la voix.
- **Le cache est indexé par sha256** (`<id>--<empreinte>.m4a`) : une fiche refaite change
  de nom de fichier, donc elle est retéléchargée. Avant (`<id>--<voix>.m4a`), le cache
  resservait l'ancien son indéfiniment.
- **Limite connue** : les versions déjà installées gardent l'ancien cache. Pour les 34
  fiches sonorisées par ElevenLabs, un lecteur qui les avait déjà écoutées entend l'ancien
  son jusqu'à la mise à jour de l'app ou la purge du cache (500 Mo) — **avec les repères
  du nouveau** : le surlignage y est décalé, et le libellé « FEMME »/« HOMME » de son
  réglage ne correspond plus forcément à la voix entendue. Même chose pour
  `phi-banalite-du-mal`, embarquée dans ces versions. Le pipeline n'y peut rien ; les
  nouvelles versions corrigent.

## Ajouter une voix, changer une référence, corriger une prononciation

- **Une voix** : un clip de 15 à 20 s (jamais plus de 20 : OmniVoice le refuse) et sa
  transcription exacte dans `~/.anagnosis/voix/production/<voix>/`, une entrée dans
  `audio/voix.json` (genre, allure réglée à l'écoute). Écouter avant tout : le clonage
  reprend le timbre, pas le phrasé, et certaines voix ne passent pas.
- **Une référence** : remplacer le clip refait toutes les fiches de la voix.
- **Une prononciation** : écouter le nom avant et après (`outils/sources-prononciation.mjs`
  propose), et n'ajouter la règle que si l'écoute dit qu'elle aide.

## Où on en est

Voir `npm run asonoriser` : il donne la file et le temps estimé. Au 2026-10-21 : 649
fiches publiables, toutes à (re)faire, soit **environ 44 h** de génération, une douzaine de
nuits de 1 h 15 à 4 h 30.

## Pourquoi pas Netlify pour l'audio

Le palier gratuit 2026 plafonne à ~15 Go mensuels, soit **15 000 écoutes**, après quoi le
site cesse de servir. R2 : zéro frais de sortie, 10 Go de stockage gratuits (le corpus en
une voix en occupe moins de 0,5), 10 M de téléchargements mensuels inclus.

## Deux règles d'architecture à ne pas perdre

**L'adresse vient du manifeste, jamais de l'app.** L'URL de chaque fichier est lue dans
`concepts.json`, jamais fabriquée côté client. C'est ce qui rend un changement
d'hébergeur — ou de nom de fichier — invisible aux versions déjà installées.

**L'audio ne doit pas bloquer l'éditorial.** Une fiche sans audio reste **validée**, jamais
dévalidée : si le moteur tombe, aucun travail de relecture n'est perdu. Une fiche sans voix
produite l'annonce dans l'app (« AUDIO PROCHAINEMENT DISPONIBLE ») ; il n'y a pas de
troisième niveau, pas de synthèse de secours sur l'appareil.
