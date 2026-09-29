# Passation — la chaîne de publication sur les réseaux (TikTok, Instagram, X)

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
3. composer.py monte le Reel ──────┤              X         : publié en public avec sa vidéo, dès qu'un jeton est installé
   carte + plan d'app + fin        │
4. contrôle bloquant (ffprobe)     └─ registre.json : ce qui est prévu, ce qui est parti
5. inscrit le programme au registre       + lien du post, commité sur main
```

Tout tourne sur le Mac mini, sous le compte de `tijacksh`, par deux tâches launchd
(`reseaux/installer.sh`). **Aucun service tiers**, aucune dépendance npm, pas de LLM :
tout texte à l'écran ou en légende est lu tel quel dans une fiche validée.

## 2. Les fichiers

| Fichier | Rôle |
|---|---|
| `reseaux/preparer.py` | choisit les fiches, fait tourner les cartes, monte, contrôle, écrit le registre |
| `reseaux/composer.py` | monte un Reel (Pillow + ffmpeg) et écrit les légendes par plateforme |
| `reseaux/plans.py` | découpe les plans d'app filmés au simulateur (rushes, hors git) |
| `reseaux/compte-demo.py` | écrit dans le simulateur de tournage un lecteur de six semaines |
| `reseaux/deposer.py` | dépose le Reel du jour sur chaque plateforme, ouvre une issue en cas d'échec |
| `reseaux/tiktok.js` | OAuth (PKCE), jetons, dépôt en brouillon, publication directe |
| `reseaux/instagram.js` | jeton de 60 jours, Reels, carrousels, par URL présignée R2 |
| `reseaux/x.js` | OAuth 2.0 PKCE, jetons, envoi de la vidéo par morceaux, publication (`autoriser`, `compte`, `publier`) |
| `reseaux/legendes.py` | légende X (280 caractères, lien compté 23), partagée par `composer.py` et `deposer.py` |
| `reseaux/registre.json` | le programme et l'état de chaque post (`tiktok`, `instagram`, liens) |
| `reseaux/installer.sh` + `*.plist` | les deux tâches launchd |
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

## 5. Les contenus publiés, pour republier exactement pareil

Ce qui est parti sur une plateforme est **archivé automatiquement** par `deposer.py`, pour que les
autres (X, d'autres plus tard) publient le même contenu :

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

## 6. X (Twitter) : branché, à activer

**Ce qui est écrit** (testé contre un faux serveur X, `test/x.test.js`, jamais contre le vrai) :
`reseaux/x.js` respecte le contrat des autres plateformes (`Publié : <url>` sur stdout, sinon code ≠ 0
et la raison sur stderr) ; `composer.py` écrit `legende-x.txt` (accroche, source, `anagnosis.fr`, tirés
de la fiche, 252 caractères au pire sur les 503 fiches valides) ; `deposer.py` publie sur X **de façon
indépendante** de TikTok (l'échec de l'un n'arrête pas l'autre et ouvre une issue) ; `preparer.py`
crée le post avec `"x": null`. Un Reel préparé avant cette évolution n'a pas de `legende-x.txt` :
`deposer.py` l'écrit alors à la volée.

**Sans jeton X, rien ne change** : `deposer.py` n'essaie X que si `~/.anagnosis/reseaux-jetons.json`
contient une entrée `x`.

**Pour l'activer (le propriétaire du compte @anagnosis_app, sur le Mac mini)** :
1. Sur console.x.com, créer une app dans un projet, avec le compte développeur de la marque. Permissions
   « lecture et écriture ». URL de rappel exacte : `http://127.0.0.1:8766/callback`. Acheter des crédits
   et fixer une limite de dépense.
2. Ajouter `X_CLIENT_ID` (et `X_CLIENT_SECRET` si l'app est un client confidentiel) à
   `~/.anagnosis/cles.env`.
3. `node reseaux/x.js autoriser` (connecté à @anagnosis_app dans le navigateur), puis `node reseaux/x.js compte`.
4. Premier essai sur le vrai compte : `node reseaux/x.js publier <un reel.mp4> <legende-x.txt>`, puis
   vérifier le post. C'est le seul point que les tests ne couvrent pas.

**À savoir** :
- **Coût** : paiement à l'usage, sans niveau gratuit (docs.x.com, à confirmer dans la console) :
  environ 0,015 $ par post, mais 0,20 $ pour un post qui contient un lien. `anagnosis.fr` dans la
  légende fait donc environ 70 $ par an à un post par jour. Le retirer de `legende_x()` ramène cela à
  quelques dollars ; c'est un choix éditorial à faire.
- **Jetons** : le jeton d'accès vit 2 heures et le jeton de rafraîchissement change à chaque usage.
  Ne pas copier `reseaux-jetons.json` d'une machine à l'autre.
- **Règles de X** : le contenu dupliqué est interdit, la légende est donc propre à chaque fiche ; la
  documentation consultée ne demande pas d'étiquette « automatisé », à recontrôler en s'inscrivant.
- **Reprendre un jour** : `python3 reseaux/deposer.py --jour AAAA-MM-JJ` publie sur X un post déjà
  déposé sur TikTok (les publications passées ne sont pas reprises toutes seules).

## 7. Exploitation

- **Suspendre** : créer `reseaux/PAUSE`, ou `launchctl bootout gui/$(id -u)/fr.anagnosis.reseaux.deposer`.
- **Journaux** : `~/Anagnosis-medias/logs/`. Tout échec ouvre une issue GitHub qui mentionne les
  deux propriétaires.
- **Refaire une semaine** : `python3 reseaux/preparer.py --semaine 2026-41` (ou `--depuis AAAA-MM-JJ`
  pour une semaine déjà entamée). **Déposer un jour à la main** : `python3 reseaux/deposer.py --jour AAAA-MM-JJ`.
- **Jeton Instagram** : valable 60 jours, prolongé seul quand il en reste moins de 10. S'il
  expire, le régénérer dans le tableau de bord Meta puis `node reseaux/instagram.js jeton <jeton>`.
- **Les routines de contenu ne touchent ni à `reseaux/` ni à `registre.json`.** Une erreur de fond
  trouvée dans une fiche déjà publiée doit ouvrir une issue : le post en ligne ne se corrige pas seul.
