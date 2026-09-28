# Réseaux sociaux — la chaîne de publication automatique

> **Statut : proposition du 2026-09-28, rien ne publie encore.** Deux choses attendent une
> décision humaine : le service de publication (§3) et la création des comptes (§7). Une fois
> tranché, l'entrée correspondante ira dans `docs/decisions.md`.

## 1. Ce qu'on publie

Des Reels 1080 × 1920 de 12 à 15 s, publiés **en même temps sur TikTok et Instagram**, et un
carrousel Instagram 4:5 de 5 images par semaine. Cadence de croisière : 4 vidéos par semaine,
publiées entre 7 h 30 et 8 h 30, plus 1 carrousel le jeudi. Au lancement : 1 par jour pendant 14 jours.

Cinq formats : la carte animée (40 %), l'idée reçue confrontée à sa source (25 %), le verrou,
c'est-à-dire le manifeste anti-scroll (15 %), le quiz (10 %), et les coulisses et le rituel (10 %).

Règles qui ne se discutent pas, parce qu'elles viennent de la ligne éditoriale :

- **Tout texte à l'écran est lu dans une fiche validée, mot pour mot.** Il n'y a pas de LLM
  dans la chaîne de publication : les gabarits reçoivent `carte.punch`, `carte.idee`,
  `carte.source_courte`, `accroche` et le quiz tels qu'ils sont dans le JSON.
- **On donne l'idée, on garde la profondeur.** Une vidéo peut montrer la carte, la question
  du quiz, les intertitres d'une fiche, le verrou, le relevé. Elle ne montre jamais le texte
  de la fiche, l'explication du quiz, l'archive ni plus de 5 s d'écoute.
- **Ne jamais promettre *cette* fiche.** Le concept du jour dépend des disciplines de chaque
  lecteur, et l'archive est réservée au Premium. L'appel à l'action est « Une fiche comme
  celle-ci, chaque matin », jamais « la suite dans l'app ».
- **La source reste au-dessus de y = 1400 px.** Sur TikTok et les Reels, la légende recouvre
  le quart bas de l'image. La carte de l'app place son crédit à 78–88 % de la hauteur : dans
  un Reel, la carte est réduite et remontée dans un cadre papier.

## 2. Pourquoi un service tiers pour publier

Vérifié le 2026-09-28 dans la documentation officielle :

- **Publier sur TikTok avec notre propre app développeur est impossible sans humain.**
  - Tant qu'un client n'est pas audité, il ne publie qu'en `SELF_ONLY`, donc en privé.
  - L'audit refuse explicitement notre cas : *« A utility tool to help upload contents to the account(s) you or your team manages »*.
  - Les règles d'interface imposent qu'un humain choisisse la confidentialité à chaque post, sans valeur par défaut.
  - Le mode brouillon (`video.upload`) exige qu'on termine la publication à la main dans l'app TikTok.
  - Source : developers.tiktok.com/doc/content-sharing-guidelines.
- **Instagram serait faisable en direct**, via l'API Instagram avec connexion Instagram, sans Page Facebook et sans App Review pour nos propres comptes. Mais cette API n'a pas de publication différée : il faudrait que notre machine soit allumée à l'heure de chaque post.

Un service agrégateur, qui a lui-même une app TikTok auditée, lève les deux obstacles. Il publie
en public sur TikTok et programme côté serveur. **Une fois la semaine programmée, le Mac mini
peut être éteint.**

## 3. Le service retenu (proposition)

| | Upload-Post (recommandé) | Zernio (ex-Late), l'alternative |
|---|---|---|
| TikTok public en direct | oui | oui, avec des erreurs « capacity » sur leur app partagée |
| Reels et carrousels Instagram | oui | oui |
| Programmation côté serveur | `scheduled_date`, jusqu'à 365 jours à l'avance | `scheduledFor` |
| Envoi d'un fichier local | oui (multipart) | oui (upload présigné) |
| Prix pour nos deux comptes | ~16 $/mois à l'année, 24 $ au mois | 2 comptes gratuits |
| Société | Málaga, Espagne (UE) | Gérone, Espagne |

Upload-Post est le seul confirmé sur les trois points à la fois : fichier local, programmation
serveur et les trois formats. **Premier geste : un post de test sur chaque réseau, pour vérifier
qu'il sort bien en public.**

Plafonds à respecter :

| | Plafond de la plateforme | Notre cadence |
|---|---|---|
| TikTok | ~15 posts par jour via l'API | 1 à 2 posts par jour au maximum |
| Instagram | 100 posts par jour | 1 à 2 posts par jour au maximum |

La case « contenu commercial » de TikTok est cochée sur chaque post : c'est notre marque. Le
label IA ne s'applique pas aux animations graphiques abstraites.

## 4. La chaîne

Elle tourne sur le Mac mini (launchd), le dimanche à 20 h, et prépare la semaine suivante.

```
1. choisir      reseaux/choisir.js    4 fiches + 1 carrousel : validées, avec carte,
                                      jamais publiées (registre), disciplines en rotation
2. tourner      xcodebuild test       l'app rend elle-même la story vidéo de chaque carte
                (TournageTests)       (StoryVideo.swift) : la vraie carte, pas une imitation
3. composer     reseaux/composer.js   gabarits HTML (Chrome headless piloté en CDP) + ffmpeg :
                                      accroche → carte de l'app → rush d'écran réel → fin
4. contrôler    reseaux/controler.js  échec = on écarte la fiche et on prend la suivante
5. programmer   reseaux/publier.js    Reels → TikTok + Instagram ; carrousel → Instagram
6. consigner    reseaux/registre.json committé sur main : fiche, format, date, liens des posts
```

**Pas de dépendance npm.** Node natif (WebSocket et fetch), Chrome, ffmpeg et Xcode. C'est la
même philosophie que le reste du dépôt.

**Le lundi, une vérification** interroge le service sur l'état des posts. Si un post a échoué ou
si un compte est déconnecté, une issue GitHub est ouverte et mentionne @tijacksh et @Orkidea.
Personne n'a à surveiller quoi que ce soit : on est prévenus seulement en cas de problème.

## 5. Les vrais écrans de l'app

- **La carte** est rendue par l'app pour la fiche exacte du post, via un test lancé sur un
  simulateur dédié. Mêmes polices, même grain, même frappe de la source que dans l'app.
- **Les rushes** sont des enregistrements du simulateur (`simctl io recordVideo`, barre d'état
  figée à 8:00) : onboarding avec les tuiles qui se remplissent, lecture qui défile, quiz,
  verrou et compte à rebours, relevé, feuille de partage. On les tourne une fois, puis on les
  refait quand une build TestFlight change l'interface. Ils sont gardés hors git, dans
  `~/Anagnosis-medias/rushes/`.
- **Le code de tournage vit dans le dépôt de l'app** (`AnagnosisTests/TournageTests.swift`).
  Il est désactivé sauf si `TOURNAGE_IDS` est fourni, et n'ajoute rien au binaire livré. Les
  raccourcis de lancement retirés le 2026-08-27 ne reviennent pas.

## 6. Contrôles automatiques (bloquants)

Chacun de ces contrôles, s'il échoue, bloque la publication :

- Texte identique au JSON de la fiche. C'est garanti par construction, et revérifié dans le DOM rendu.
- Aucun texte hors zone sûre (x 72–940, y 250–1400) ni en débordement, contrôlé à chaque image clé.
- Vidéo : H.264, AAC, 1080 × 1920, 30 fps, 12–15 s, moov en tête, moins de 300 Mo, aucune image vide.
- Carrousel : JPEG sRGB, 4:5, moins de 8 Mo par image.
- Légendes de moins de 2 200 caractères, 3 à 5 hashtags.
- Aucune fiche déjà présente dans le registre.
- Un interrupteur d'arrêt : le fichier `reseaux/PAUSE`, s'il existe, suspend toute programmation.

## 7. Ce qui reste humain, une seule fois

Ces gestes ne peuvent pas être faits par Claude : création de compte, paiement, autorisation
OAuth, saisie de clé.

1. Créer le compte TikTok et le compte Instagram (même nom), puis passer Instagram en compte professionnel (Créateur).
2. S'abonner au service retenu, puis y connecter TikTok et Instagram (OAuth).
3. Générer la clé d'API du service et l'ajouter dans `~/.anagnosis/cles.env` (`RESEAUX_API_KEY=…`). Jamais dans le dépôt.

Ensuite, plus aucune action n'est nécessaire. Les seuls cas qui nous rappelleraient : une
reconnexion OAuth si une plateforme la redemande (le jeton de rafraîchissement TikTok vit 365
jours), ou un contrôle de sécurité d'Instagram. Dans les deux cas, l'issue du lundi le signale.

## 8. Pour les routines et pour Vincent

- `reseaux/` ne tourne **que sur le Mac mini**, sous le compte tijacksh. Les routines de contenu
  n'y touchent pas et ne modifient pas `reseaux/registre.json`.
- Le job travaille dans son propre worktree de `main` et fait `git pull --rebase` avant chaque
  push, puisque les routines poussent environ 7 fois par jour. Il ne touche jamais aux copies
  de travail personnelles.
- Une fiche publiée sur les réseaux reste une fiche comme les autres. La corriger ensuite ne
  corrige pas le post déjà en ligne : **une erreur de fond trouvée par `controler` sur une fiche
  présente dans le registre doit être signalée** dans une issue, pour qu'on retire le post.
