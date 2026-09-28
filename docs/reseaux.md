# Réseaux sociaux — la chaîne de publication automatique

> **Statut : décidé le 2026-09-28, pas encore construit.** Aucun service tiers. Tout passe
> par nos propres apps développeur (TikTok, Meta) et notre propre infrastructure (Mac mini,
> R2). **La publication finale sur TikTok est faite à la main**, depuis le brouillon préparé.

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
  lecteur, et l'archive est réservée au Premium. Le Reel le dit, simplement : « En bref ici ·
  en entier dans l'app » (demandé le 2026-09-28), jamais « la suite de
  cette fiche dans l'app ».
- **La source reste au-dessus de y = 1400 px.** Sur TikTok et les Reels, la légende recouvre
  le quart bas de l'image. La carte de l'app place son crédit à 78–88 % de la hauteur : dans
  un Reel, la carte est réduite et remontée dans un cadre papier.

## 2. Pourquoi TikTok reste en brouillon

Vérifié le 2026-09-28 dans la documentation officielle (developers.tiktok.com/doc/content-sharing-guidelines).

- **Publier seul sur TikTok avec notre propre app développeur est impossible.**
  - Un client non audité ne publie qu'en `SELF_ONLY`, donc en privé.
  - L'audit refuse notre cas : *« A utility tool to help upload contents to the account(s) you or your team manages »*.
  - Même audité, la publication directe exige qu'un humain choisisse la confidentialité à chaque post.
- **Essayé le 2026-09-28 : même en « moi uniquement », la publication directe est refusée.**
  TikTok répond `unaudited_client_can_only_post_to_private_accounts` : une app non auditée ne
  publie que sur un compte **entièrement privé**, ce qui n'a aucun sens pour la marque. La voie
  directe est donc fermée, le brouillon est la seule.
- **Le mode brouillon (`video.upload`, « upload to inbox ») fait exactement ce qu'on veut.**
  - La vidéo arrive dans la boîte de réception TikTok du compte.
  - On l'ouvre, on ajoute si on le souhaite un son tendance (l'API ne sait pas le faire), on publie. C'est un geste d'environ 20 secondes.
  - Limites : 5 brouillons en attente par 24 h, 6 requêtes par minute. Notre cadence (4 par semaine) en est loin.
  - La documentation ne dit pas si ce mode exige l'audit ; d'autres sources disent que non. **C'est à vérifier au premier essai.**
  - Jetons : 24 h pour l'accès, 365 jours pour le rafraîchissement. Le job les rafraîchit lui-même.

## 3. Instagram : publié automatiquement, par notre propre app Meta

- On passe par l'API Instagram avec connexion Instagram.
  - Pas besoin de Page Facebook.
  - Pas d'App Review : nos comptes ont un rôle sur notre propre app, l'accès standard suffit.
  - Permissions nécessaires : `instagram_business_basic` et `instagram_business_content_publish`.
- Fonctionnement : les Reels (`media_type=REELS`) et les carrousels (jusqu'à 10 JPEG, en 4:5) passent par `POST /{ig-user-id}/media`, puis `/media_publish`. Plafond : 100 posts par 24 h.
- **L'API n'a ni brouillon ni publication différée.** Le Mac mini (launchd) appelle donc `media_publish` à l'heure prévue, vers 7 h 45. Il est allumé en permanence, puisqu'il sert déjà le backend de Caarnet. Si l'heure est manquée (coupure), le post part au réveil, le jour même seulement.
- **Les médias doivent être accessibles par URL**, et c'est notre R2 qui les héberge : aucun service tiers.
  - Le pipeline écrit déjà dans R2 avec les clés S3 de `~/.anagnosis/cles.env` (`src/r2.js`).
  - Chaque fichier est déposé sous `reseaux/`, et Instagram le lit via une URL présignée valable 1 h. Le bucket reste privé.
  - Les vidéos peuvent aussi passer par l'envoi direct (`rupload`).
- Jeton long de 60 jours, rafraîchi chaque semaine par le job.
- Si l'on préfère aussi publier Instagram à la main, un réglage (`INSTAGRAM_AUTO=0`) remplace la publication par le dépôt du paquet prêt à poster (§4 bis).

## 4. La chaîne

Elle tourne sur le Mac mini (launchd), le dimanche à 20 h, et prépare la semaine suivante.

```
1. choisir      reseaux/choisir.js    4 fiches + 1 carrousel : validées, avec carte,
                                      jamais publiées (registre), disciplines en rotation
2. tourner      xcodebuild test       l'app rend elle-même la story vidéo de chaque carte
                (TournageTests)       (StoryVideo.swift) : la vraie carte, pas une imitation
3. composer     reseaux/composer.py   Pillow (polices de l'app) + ffmpeg, son fabriqué ici :
                                      accroche → carte de l'app → rush d'écran réel → fin
4. contrôler    reseaux/controler.js  échec = on écarte la fiche et on prend la suivante
5. déposer      reseaux/publier.js    TikTok : brouillon dans l'inbox, le jour J à 7 h 30
                                      Instagram : publication auto à 7 h 45 (Reel ou carrousel)
6. consigner    reseaux/registre.json committé sur main : fiche, format, date, liens des posts
```

**Pas de dépendance npm.** Node natif (fetch), Python avec Pillow, ffmpeg et Xcode. C'est la
même philosophie que le reste du dépôt.

**Chaque échec ouvre une issue GitHub** qui mentionne @tijacksh et @Orkidea : jeton expiré,
Instagram qui refuse un média, brouillon TikTok rejeté. Personne n'a à surveiller quoi que ce
soit : on est prévenus seulement en cas de problème.

### 4 bis. Le paquet de secours

Chaque post existe aussi sous forme de paquet dans `~/Anagnosis-medias/semaine-AAAA-SS/` :
la vidéo, les images du carrousel, et un fichier `legende.txt` avec la légende et les hashtags.
Ce dossier est recopié dans iCloud Drive (`Anagnosis/Réseaux/`) pour être accessible depuis le
téléphone. Si une API tombe, on publie à la main depuis là.

### 4 ter. Exploitation

| Quand | Quoi | Fichier |
|---|---|---|
| Dimanche 20 h | choisit, tourne, monte et contrôle les 4 Reels de la semaine suivante, puis les inscrit au registre | `reseaux/preparer.py` |
| Chaque jour 7 h 30 | dépose le Reel du jour en brouillon TikTok, met sa légende à disposition du raccourci, copie le paquet dans iCloud | `reseaux/deposer.py` |
| À la demande | monte un Reel à partir d'une fiche et de sa carte | `reseaux/composer.py` |
| Une fois | installe les deux tâches launchd | `reseaux/installer.sh` |

- **Le raccourci iPhone « Légende TikTok »** lit `iCloud Drive/Shortcuts/anagnosis-legende.txt`, que `deposer.py` réécrit à chaque dépôt. Il copie la légende et ouvre TikTok : on ouvre le brouillon, on colle, on publie.
- **Pour tout suspendre**, créer le fichier `reseaux/PAUSE` : `deposer.py` ne fait alors plus rien.
- **Les journaux** sont dans `~/Anagnosis-medias/logs/`.
- **Les chemins du registre** sont relatifs à `~/Anagnosis-medias` : jamais de chemin propre à une machine dans le dépôt.
- **Le tournage** passe par un worktree de l'app, `~/Anagnosis-app-tournage` (branche `tournage`), avec un simulateur dédié dont l'identifiant est dans `~/.anagnosis/tournage.env`.
  - Tant que la story vidéo (`StoryVideo.swift`) n'est pas sur le `main` de l'app, cette branche part de `evolutions-2026-09`, et la chaîne ne tourne que sur ce Mac.

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

## 7. Ce qui reste humain

**Une fois.** Ces gestes ne peuvent pas être faits par Claude : création de compte, OAuth,
saisie de secret.

1. Créer les comptes TikTok et Instagram (même nom), puis passer Instagram en compte professionnel (Créateur).
2. **TikTok for Developers**
   - Créer une app « Anagnosis » et y ajouter *Login Kit* et *Content Posting API* (scope `video.upload`).
   - Déclarer anagnosis.fr, avec les pages confidentialité et conditions déjà en ligne.
   - Tant que l'app est en sandbox, y ajouter le compte TikTok comme utilisateur de test.
3. **Meta for Developers**
   - Créer une app de type « Business » et y ajouter le produit *Instagram* (API avec connexion Instagram).
   - Donner au compte Instagram le rôle de testeur de l'app, et l'accepter depuis Instagram.
4. **Autoriser une fois** chaque app sur son compte, via une page locale que le job ouvrira sur `localhost`. Les jetons vont ensuite dans `~/.anagnosis/reseaux-jetons.json`, jamais dans le dépôt.
5. Ajouter les identifiants des deux apps (client key et secret TikTok, app ID et secret Meta) dans `~/.anagnosis/cles.env`.

**Chaque semaine :** ouvrir les 4 brouillons TikTok et publier. Instagram part seul.

**Rarement :** une reconnexion si une plateforme la redemande. L'issue le signale.

## 8. Pour les routines et pour Vincent

- `reseaux/` ne tourne **que sur le Mac mini**, sous le compte tijacksh. Les routines de contenu
  n'y touchent pas et ne modifient pas `reseaux/registre.json`.
- Le job travaille dans son propre worktree de `main` et fait `git pull --rebase` avant chaque
  push, puisque les routines poussent environ 7 fois par jour. Il ne touche jamais aux copies
  de travail personnelles.
- Une fiche publiée sur les réseaux reste une fiche comme les autres. La corriger ensuite ne
  corrige pas le post déjà en ligne : **une erreur de fond trouvée par `controler` sur une fiche
  présente dans le registre doit être signalée** dans une issue, pour qu'on retire le post.
