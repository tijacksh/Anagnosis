# Réseaux sociaux — la chaîne de publication automatique

> **Statut : en service depuis le 2026-09-29.** Aucun service tiers : tout passe par nos propres
> apps développeur (TikTok, Meta) et notre infrastructure (Mac mini, R2). **Instagram est publié
> tout seul** ; **TikTok arrive en brouillon** et sa publication finale se fait à la main. Le
> carrousel du mardi et le post « concept » du jeudi sont fabriqués et programmés (Instagram), pas encore
publiés sur TikTok (notre app n'a pas la portée photo). Comment c'est
> construit : `docs/passation-reseaux.md`.

## 1. Ce qu'on publie

Des Reels 1080 × 1920 de 12 à 15 s, avec légende : **publiés sur Instagram, déposés en brouillon
sur TikTok** le même matin, à 7 h 30. Cadence actuelle : 4 Reels par semaine (lundi, mercredi, vendredi,
dimanche), plus **deux posts image** : le **mardi un carrousel** de cinq images 4:5 (la carte de l'app, ce que la
fiche développe, son quiz, la réponse, la fin de marque) et le **jeudi un post « concept »** (une image qui présente
le produit, avec les textes du site repris mot pour mot). Le samedi est libre. Voir `docs/decisions.md`, 2026-09-29.

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
- **L'API n'a ni brouillon ni publication différée.** Le Mac mini (launchd) appelle donc `media_publish` à 7 h 30, juste après le dépôt du brouillon TikTok. Il est allumé en permanence, puisqu'il sert déjà le backend de Caarnet. Si l'heure est manquée (coupure), le post part au réveil, le jour même seulement.
- **Les médias doivent être accessibles par URL**, et c'est notre R2 qui les héberge : aucun service tiers.
  - Le pipeline écrit déjà dans R2 avec les clés S3 de `~/.anagnosis/cles.env` (`src/r2.js`).
  - Chaque fichier est déposé sous `reseaux/`, et Instagram le lit via une URL présignée valable 1 h. Le bucket reste privé.
  - Les vidéos peuvent aussi passer par l'envoi direct (`rupload`).
- Jeton long de 60 jours, rafraîchi chaque semaine par le job.
- **En service depuis le 2026-09-29** : app Meta « Anagnosis-IG », compte @anagnosis_app en professionnel, `instagram_business_content_publish` ajoutée, jeton de 60 jours généré dans le tableau de bord (Générer des tokens d'accès) et prolongé seul par `reseaux/instagram.js`. `deposer.py` publie le Reel du jour chaque matin, indépendamment de TikTok. Premier Reel : le Maslow.
- Si le jeton expire (60 jours sans prolongation), en générer un nouveau dans le tableau de bord Meta et le donner à `node reseaux/instagram.js jeton <jeton>`.

## 4. La chaîne

Elle tourne sur le Mac mini, par trois tâches launchd.

```
DIMANCHE 20 h — reseaux/preparer.py
1. choisir      4 fiches validées, avec carte, sans source anonyme, jamais publiées (registre),
                de familles de disciplines différentes
2. tourner      xcodebuild test (TournageTests) : l'app rend elle-même la carte de chaque fiche
                (StoryVideo.swift, format Reel) : la vraie carte, pas une imitation
3. composer     reseaux/composer.py : Pillow (polices de l'app) + ffmpeg, son fabriqué ici :
                carte → plan d'app filmé au simulateur → fin de marque
4. contrôler    ffprobe : H.264, AAC 48 kHz, 1080 × 1920, 30 i/s, 8 à 15 s ; échec = on prend
                la fiche de rechange
5. archiver     légendes + post.json dans reseaux/publie/, vidéo dans la release GitHub
                de la semaine ; programme inscrit dans reseaux/registre.json ; le tout sur main

CHAQUE JOUR 7 h 30 — reseaux/deposer.py
6. TikTok       brouillon dans la boîte de réception ; légende dans le raccourci iPhone
7. Instagram    Reel publié en public, tout seul (reseaux/instagram.js)
8. consigner    liens des posts dans registre.json et post.json, commité sur main

CHAQUE JOUR 9 h, et DIMANCHE 21 h 30 — reseaux/verifier.py
9. vérifier     tâches, jetons, registre poussé, posts passés, cinq prochains jours ;
                relance deposer.py si le post du jour manque ; issue GitHub en cas de problème
```

**Pas de dépendance npm.** Node natif (fetch), Python avec Pillow, ffmpeg et Xcode. C'est la
même philosophie que le reste du dépôt.

**Chaque échec ouvre une issue GitHub** qui mentionne @tijacksh et @Orkidea : jeton expiré,
Instagram qui refuse un média, brouillon TikTok rejeté. Personne n'a à surveiller quoi que ce
soit : on est prévenus seulement en cas de problème.

### 4 bis. Le paquet de secours

Chaque post existe aussi sous forme de paquet dans `~/Anagnosis-medias/semaine-AAAA-SS/` :
`reel.mp4`, `legende-tiktok.txt` et `legende-instagram.txt`. `deposer.py` le recopie le jour
venu dans iCloud Drive (`Anagnosis/Réseaux/`) pour l'avoir sur le téléphone. Si une API tombe,
on publie à la main depuis là.

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
  figée à 8:00), tournés le 2026-09-28 : onboarding et tuiles qui se remplissent, lecture
  qui défile, verrou et son compte à rebours, quiz corrigé, profil. Ils sont gardés hors
  git, dans `~/Anagnosis-medias/rushes/`. `reseaux/plans.py` en découpe quatre plans de
  3,5 s (choix, lecture, verrou, quiz, relevé, ouverture), l'écran posé sur le papier avec
  une phrase en mono,
  et `preparer.py` les fait tourner d'un Reel à l'autre. On les refilme quand une build
  change l'interface, et on revoit alors les coupes de `plans.py`. Le relevé et l'ouverture
  sont filmés sur un compte simulé de six semaines (`reseaux/compte-demo.py`, qui écrit
  l'état du lecteur dans le simulateur de tournage, jamais dans l'app).
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

**Fait le 2026-09-28 et 29** : les comptes TikTok et Instagram (Instagram en compte professionnel) ;
l'app TikTok for Developers « Anagnosis » (Sandbox, Login Kit + Content Posting API, portées
`user.info.basic`, `video.upload`, `video.publish`) ; l'app Meta « Anagnosis-IG » (API Instagram avec
connexion Instagram, compte en testeur, portée `instagram_business_content_publish`) ; l'autorisation
de chaque compte ; les clés et jetons dans `~/.anagnosis/`, hors dépôt.

**Chaque jour de publication** : ouvrir le brouillon TikTok, coller la légende avec le raccourci
« Légende TikTok », publier (une trentaine de secondes). Instagram part seul.

**Rarement** : une reconnexion si une plateforme la redemande, ou un nouveau jeton Instagram s'il
expire (60 jours sans prolongation). `verifier.py` le signale bien avant, par une issue.

**Ouvert** : publier TikTok tout seul. La voie à l'étude est l'API TikTok for Business (« Accounts /
Organic », publication publique sur un compte qu'on possède) ; sa demande d'accès attend
l'immatriculation d'une société. Voir `docs/decisions.md`, 2026-09-29.

## 8. Pour les routines et pour Vincent

- `reseaux/` ne tourne **que sur le Mac mini**, sous le compte tijacksh. Les routines de contenu
  n'y touchent pas et ne modifient pas `reseaux/registre.json`.
- Le job travaille dans son propre worktree de `main` et fait `git pull --rebase` avant chaque
  push, puisque les routines poussent environ 7 fois par jour. Il ne touche jamais aux copies
  de travail personnelles.
- Une fiche publiée sur les réseaux reste une fiche comme les autres. La corriger ensuite ne
  corrige pas le post déjà en ligne : **une erreur de fond trouvée par `controler` sur une fiche
  présente dans le registre doit être signalée** dans une issue, pour qu'on retire le post.
