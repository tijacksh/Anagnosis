# Passation — la chaîne de publication sur les réseaux (TikTok, Instagram)

> Écrit le 2026-09-29 pour Vincent et son Claude, qui veulent y **brancher X (Twitter)**.
> `docs/reseaux.md` dit *ce qu'on a décidé et pourquoi* ; ce document dit *comment c'est
> construit, ce qui a piégé, et où brancher une nouvelle plateforme*. Lire les deux.

## 1. Ce que fait la chaîne

Chaque dimanche à 20 h, elle prépare les vidéos de la semaine ; chaque jour à 7 h 30, elle
publie celle du jour.

```
preparer.py (dimanche)                            deposer.py (chaque matin)
──────────────────────                            ─────────────────────────
1. choisit 4 fiches validées       ┌────────────►  TikTok    : brouillon dans l'inbox
2. l'app iOS rend la carte         │                          (un humain publie ensuite)
   (TournageTests, simulateur)     │              Instagram : publié en public, tout seul
3. composer.py monte le Reel ──────┤              (X        : à brancher)
   carte + plan d'app + fin        │
4. contrôle bloquant (ffprobe)     └─ registre.json : ce qui est prévu, ce qui est parti
5. inscrit le programme au registre       + lien du post, commité sur main
```

Tout tourne sur le Mac mini, sous le compte de `tijacksh`, par trois tâches launchd
(`reseaux/installer.sh`). **Aucun service tiers**, aucune dépendance npm, pas de LLM :
tout texte à l'écran ou en légende est lu tel quel dans une fiche validée.

## 2. Les fichiers

| Fichier | Rôle |
|---|---|
| `reseaux/preparer.py` | choisit les fiches, fait tourner les cartes, monte, contrôle, écrit le registre |
| `reseaux/composer.py` | monte un Reel (Pillow + ffmpeg) et écrit les légendes par plateforme |
| `reseaux/carrousel.py` | fabrique le carrousel d'une fiche : cinq images 4:5 (carte de l'app, intertitres, quiz, réponse, fin) |
| `reseaux/concept.py`, `reseaux/marque.json` | fabrique un post « concept » : une image ; les textes viennent du site, mot pour mot |
| `reseaux/posts.py` | les types de post (`reel`, `carrousel`, `concept`) : leurs médias, leurs légendes, leurs plateformes |
| `reseaux/essai_deposer.py` | essai du dépôt quotidien avec de faux appels ; lancé chaque jour par `verifier.py` |
| `reseaux/inscriptions.js` | compte les inscriptions à la liste d'attente par réseau (`?s=ig`, `tt`, `x`), via l'API de Netlify |
| `reseaux/plans.py` | découpe les plans d'app filmés au simulateur (rushes, hors git) |
| `reseaux/compte-demo.py` | écrit dans le simulateur de tournage un lecteur de six semaines |
| `reseaux/deposer.py` | dépose le Reel du jour sur chaque plateforme, ouvre une issue en cas d'échec |
| `reseaux/archive.py` | archive un post (légendes + `post.json` dans git, vidéo dans la release de la semaine) |
| `reseaux/verifier.py` | vérifie la chaîne, relance `deposer.py` si le post du jour manque, ouvre une issue |
| `reseaux/tiktok.js` | OAuth (PKCE), jetons, dépôt en brouillon, publication directe |
| `reseaux/instagram.js` | jeton de 60 jours, Reels, carrousels, par URL présignée R2 |
| `reseaux/registre.json` | le programme et l'état de chaque post (`tiktok`, `instagram`, liens) |
| `reseaux/installer.sh` + `*.plist` | les trois tâches launchd |
| `reseaux/PAUSE` (absent) | s'il existe, `deposer.py` ne fait plus rien |

**Côté app** (dépôt `Anagnosis-app`) : `AnagnosisTests/TournageTests.swift` fait rendre la carte
de chaque fiche demandée (`TEST_RUNNER_TOURNAGE_IDS=id1,id2`), au format `FormatCarte.reel`,
jamais proposé au lecteur.

**Hors git, sur le Mac mini** : `~/Anagnosis-medias/` (rushes filmés, plans, cartes rendues,
Reels produits), `~/.anagnosis/cles.env` (clés), `~/.anagnosis/reseaux-jetons.json` (jetons),
`~/.anagnosis/tournage.env` (simulateur dédié).

## 3. Les secrets : leurs noms, pas leurs valeurs

Dans `~/.anagnosis/cles.env` (chmod 600, jamais dans un dépôt) :
`TIKTOK_CLIENT_KEY`, `TIKTOK_CLIENT_SECRET`, `TIKTOK_SANDBOX_CLIENT_KEY`,
`TIKTOK_SANDBOX_CLIENT_SECRET`, `INSTAGRAM_APP_ID`, `INSTAGRAM_APP_SECRET`, et les
`R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`. Les jetons de
session (24 h, 60 jours…) vont dans `reseaux-jetons.json`, écrits par les outils.

**Règle : une clé ne se colle jamais dans un fichier du dépôt ni dans un message de commit.**
Un `git grep` de l'historique avant chaque poussée ne coûte rien.

## 4. Ce qui a piégé (à lire avant de recommencer)

- **TikTok : l'API de publication est fermée à un outil d'équipe.** Une app non auditée ne publie
  qu'en privé (`unaudited_client_can_only_post_to_private_accounts`, même en `SELF_ONLY`), et
  l'audit exclut noir sur blanc « un outil pour les comptes que vous ou votre équipe gérez ».
  Il reste le **brouillon** (`video.upload`, jamais de légende via l'API) ou l'API Business
  « Accounts / Organic », en cours d'étude.
- **TikTok ajoute tout seul `#Anagnosis`** à un brouillon venu de notre app : ne pas le remettre.
- **Un brouillon TikTok peut rester `PROCESSING_UPLOAD` plus de 15 minutes.** Renvoyer crée un
  doublon. Seul `FAILED` est un échec (`deposer.py`).
- **Instagram : pas de brouillon, pas de publication différée.** Le Mac appelle `media_publish` à
  l'heure. Les médias se lisent **par URL** : R2 privé + URL présignée d'une heure.
- **Le tableau de bord Meta délivre déjà un jeton de 60 jours**, pas un jeton court : l'échange
  (`ig_exchange_token`) échoue alors. `instagram.js jeton` essaie d'abord le jeton tel quel.
- **Audio : 48 kHz maximum** (Instagram), et `loudnorm` sort du 96 kHz si on ne force pas `-ar`.
- **Le simulateur n'enregistre une image que quand l'écran change** : un défilement par petits
  glissements ou un plan accéléré saccade. Défilements lancés d'un seul geste, vitesse réelle.
- **La légende des plateformes recouvre le quart bas** de l'image, les onglets le haut : tout le
  texte tient entre y = 230 et y = 1400 (format `reel` de la carte).
- **Ne pas commiter `__pycache__`** (`reseaux/.gitignore`), et **un fichier de préférences du
  simulateur se réécrit par-dessus** si on ne l'arrête pas d'abord (`compte-demo.py`).

## 4 bis. Les types de post

Un post du registre a un `type` (absent = `reel`). **`reel`** : vidéo, TikTok en brouillon et Instagram.
**`carrousel`** (mardi) et **`concept`** (jeudi) : images, Instagram seulement (TikTok n'a pas la portée
photo). Les médias vont dans la release de la semaine avec le nom `<jour>-<slug>-<fichier>` ; pour X, un
carrousel tient en quatre images (les quatre premières). `deposer.py` choisit la commande d'`instagram.js`
selon le type (`reel`, `carrousel`, `image`).

**Suivi des inscriptions :** les liens de profil portent `?s=ig`, `?s=tt` ou `?s=x` ; le site joint ce nom à
l'inscription (champ `source`, sans cookie ni stockage) et `node reseaux/inscriptions.js` les compte
(jeton `NETLIFY_TOKEN` dans `~/.anagnosis/cles.env`).

## 5. Les contenus publiés, pour republier exactement pareil

Chaque post est **archivé dès sa programmation** (`preparer.py`, le dimanche soir) puis relié à
ses liens à sa publication (`deposer.py`), pour que les autres plateformes (X, d'autres plus tard)
voient la semaine à l'avance et publient le même contenu :

- **dans git**, `reseaux/publie/<jour>-<fiche>/` : `post.json` (titre, carte, lien du post
  Instagram, empreinte SHA-256 de la vidéo), `legende-tiktok.txt`, `legende-instagram.txt` ;
- **la vidéo** (environ 5 Mo) n'est pas dans l'historique : 200 Reels par an feraient près d'un
  gigaoctet à cloner pour chaque machine et chaque build Netlify. Elle est jointe à la **release
  GitHub de la semaine** `reels-AAAA-SS` :

```bash
gh release download reels-2026-40 -R tijacksh/Anagnosis -p '2026-09-28-pyramide-de-maslow.mp4'
```

`post.json` donne le nom de la release et du fichier, et l'empreinte pour vérifier le téléchargement.
Le registre (`registre.json`) garde aussi `archive: {release, fichier}` pour chaque post.
**Une légende pour X s'écrit à partir de `post.json` (`carte.punch`, `carte.source_courte`) et de
la fiche, jamais d'un texte libre** : c'est ce qui garantit « la même chose partout ».

## 6. Brancher X (Twitter) : le plan

**Où ça tourne.** Le Reel est produit sur le Mac mini (Xcode, simulateur, R2). La voie la plus
simple est donc que **le Claude de Vincent écrive le module**, que **la tâche du Mac mini
l'exécute**, et que les clés de X soient ajoutées à `~/.anagnosis/cles.env` par le propriétaire
du compte. Vincent peut tout développer et tester avec ses propres clés, sur son poste, en
donnant à son module un fichier `.mp4` de test : aucune dépendance au simulateur.

**Le contrat d'un module de plateforme** (comme `tiktok.js` et `instagram.js`) :

```
node reseaux/x.js jeton <...>                 # installe le jeton (si OAuth)
node reseaux/x.js compte                      # affiche le compte connecté
node reseaux/x.js publier <mp4> <legende.txt> # publie ; sur stdout : « Publié : <url> »
```

Sorties : code 0 et une ligne `Publié : <url>`, ou code ≠ 0 et la raison sur stderr.

**Les trois endroits à toucher :**
1. `reseaux/composer.py`, `legendes()` : écrire `legende-x.txt` (280 caractères, lien compris),
   et l'ajouter à la liste de fichiers copiés par `archiver()` de `deposer.py`. Même règle
   qu'ailleurs : accroche, source et anagnosis.fr repris de la fiche, rien d'inventé.
2. `reseaux/deposer.py` : une fonction `x(reel, legende)` sur le modèle de `instagram()`, et son
   bloc `try/except` dans la boucle (chaque plateforme est indépendante : l'échec de l'une ne
   retient pas les autres, et ouvre une issue).
3. `reseaux/registre.json` : ajouter la clé `"x": null` aux posts créés par `preparer.py`
   (`reg['posts'].append({... 'tiktok': None, 'instagram': None})`), et l'ajouter au test
   `not (p['tiktok'] and p['instagram'])` de `deposer.py`.

**Ce qu'on sait de l'API de X (recherche du 2026-09-29, sources dans `docs.x.com`)**

- **Tarif : paiement à l'usage, pas de palier gratuit.** Des crédits achetés d'avance dans la console
  (`console.x.com`), avec plafond de dépense et recharge automatique. Un post coûte **0,015 $**, mais
  **0,20 $ s'il contient une URL**. Pour 30 à 60 posts par mois : environ 1 $ sans lien, 6 à 12 $ avec
  un lien. Le coût de l'envoi de la vidéo n'est pas listé. (page `x-api/getting-started/pricing`)
- **Publier :** envoi de la vidéo en trois temps, `POST /2/media/upload/initialize`, puis
  `.../{id}/append` par morceaux de 5 Mo au plus, puis `.../{id}/finalize` ; on relit le statut
  jusqu'à `succeeded` ; puis `POST /2/tweets` avec `media.media_ids`. Une vidéo, quatre photos
  ou un GIF par post. Une vidéo de 15 s à 1080 × 1920 est très en dessous des limites (20 min, 8 Go).
- **Authentification :** un jeton utilisateur, soit OAuth 2.0 avec PKCE (portées `tweet.write`,
  `media.write`, `offline.access`, `users.read`), soit OAuth 1.0a. En OAuth 2.0 le jeton d'accès
  dure **2 heures** et le jeton de rafraîchissement **environ 6 mois, à usage unique** : il faut
  **enregistrer le nouveau après chaque rafraîchissement**, sinon le script s'arrête. Plusieurs
  développeurs le voient expirer trop tôt ; prévoir une alerte le jour d'un échec. OAuth 1.0a
  n'expire pas, ce qui est plus robuste pour un script sans surveillance (non vérifié dans la doc 2026).
- **Limites :** 100 publications par utilisateur et par jour : sans rapport avec une par jour. X
  **déduplique les posts identiques sur 24 h** (fuseau UTC).
- **Règles d'automatisation :** publier par l'API est permis ; piloter le site par script peut
  mener à une suspension définitive ; le contenu répétitif est interdit ; les comptes-robots doivent
  être signalés comme automatisés.

**Pas de brouillon ni de programmation par l'API de X (recherche du 2026-09-29).** Le corps de
`POST /2/tweets` n'a ni champ de date de publication ni champ de brouillon (`docs.x.com/x-api/posts/create-or-edit-post`) :
un post est publié tout de suite. Seule exception trouvée : l'API **Ads** (`POST /12/accounts/:id/scheduled_tweets`,
avec `scheduled_at`), qui exige un compte publicitaire et l'approbation de X pour l'API Ads, et dont l'usage pour
un tweet organique semble peu fiable : à ne pas viser. Le planificateur et les brouillons du compositeur web
de X existent, mais ne se remplissent qu'à la main. **La voie retenue est la nôtre, comme pour Instagram** : le
post est prêt et archivé d'avance (`reseaux/publie/`, release GitHub), puis `deposer.py` l'envoie à
la minute voulue ; un « brouillon » y est simplement un post archivé pas encore parti (`x: null` au registre).

**Non confirmé, à vérifier au premier essai :**
- si l'inscription à la console demande une validation, ou un abonnement Premium ;
- si l'envoi de médias est facturé ou limité à part ;
- le codec et le format d'image exigés (H.264 + AAC, MP4, est la valeur sûre) ;
- si un compte de marque qui publie son propre contenu doit porter la mention « automatisé » ;
- si mettre le lien dans une **réponse** au post plutôt que dans le post lui-même évite le
  surcoût de 0,20 $ (c'est une déduction, pas un fait).

**Étapes humaines, une fois :** créer l'app dans la console avec le compte de la marque ; acheter
des crédits et fixer un plafond ; régler l'app en lecture et écriture, avec une URL de retour
`http://localhost:...` ; autoriser le compte une fois ; et mettre la clé et le secret dans
`~/.anagnosis/cles.env`, jamais dans le dépôt.

Comme pour TikTok, **le compte doit être celui de la marque**, avec un rôle sur l'app
développeur, et la publication ne se fait que sur ce compte.

### 6 bis. Essai du 2026-09-29 : programmer sur X par le navigateur (Claude in Chrome)

Sans API payante, on peut remplir le **planificateur web de X** avec l'extension Claude in Chrome
(ce qui reste gratuit). **Essai supervisé, un seul post : programmé avec succès** pour le
2026-10-05 à 7 h 30, visible dans `x.com/compose/post/unsent/scheduled`. Ce qu'on a appris :

- le fichier à téléverser doit être dans un dossier lisible par la session (le dossier de travail de
  la session), pas dans `~/Anagnosis-medias` : le copier d'abord ;
- le compositeur (`x.com/compose/post`) : champ de texte, champ de fichier, icône d'agenda, puis
  Mois / Jour / Année / Heure / Minute (des listes déroulantes, le fuseau est celui du navigateur),
  **Confirm**, puis **Schedule** ; vérifier ensuite dans « Scheduled » ;
- le compositeur a aussi des **brouillons** (« Unsent posts ») qu'on peut remplir de la même façon ;
- **X a affiché « Unlock more on X »** : le compte est soumis à une vérification progressive (« être sûr
  qu'il y a un humain derrière ce compte »), avec visibilité et messages réduits tant qu'il n'a pas
  montré une activité normale. Ce type de contrôle est **hostile à l'automatisation** ; les règles de X
  déconseillent aussi le pilotage du site par script. À garder en tête avant de programmer plus, et
  de passer à une tâche automatique.
- aucune garantie que la tâche passe sans surveillance : la session peut expirer, X peut demander une
  vérification, l'interface peut changer.

## 7. Exploitation

**Trois tâches launchd** (`reseaux/installer.sh`) : `preparer` le dimanche à 20 h, `deposer` chaque
jour à 7 h 30, `verifier` chaque jour à 9 h et le dimanche à 21 h 30. `verifier.py` contrôle les
tâches, le registre poussé, les jetons, les posts passés, les cinq prochains jours (vidéo, légendes,
archive) et l'avance de programme ; il **relance `deposer.py`** si le post du jour manque, et ouvre
une issue « Réseaux : vérification » en cas de problème. `verifier.py --essai` affiche sans rien faire.

- **Suspendre** : créer `reseaux/PAUSE`, ou `launchctl bootout gui/$(id -u)/fr.anagnosis.reseaux.deposer`.
- **Journaux** : `~/Anagnosis-medias/logs/`. Tout échec ouvre une issue GitHub qui mentionne les
  deux propriétaires.
- **Refaire une semaine** : `python3 reseaux/preparer.py --semaine 2026-41` (ou `--depuis AAAA-MM-JJ`
  pour une semaine déjà entamée). **Déposer un jour à la main** : `python3 reseaux/deposer.py --jour AAAA-MM-JJ`.
- **Jeton Instagram** : valable 60 jours, prolongé seul quand il en reste moins de 10. S'il
  expire, le régénérer dans le tableau de bord Meta puis `node reseaux/instagram.js jeton <jeton>`.
- **Les routines de contenu ne touchent ni à `reseaux/` ni à `registre.json`.** Une erreur de fond
  trouvée dans une fiche déjà publiée doit ouvrir une issue : le post en ligne ne se corrige pas seul.
