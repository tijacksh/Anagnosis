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

## 5. Brancher X (Twitter) : le plan

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
1. `reseaux/composer.py`, `legendes()` : écrire `legende-x.txt` (280 caractères, lien compris).
   Même règle qu'ailleurs : accroche, source et anagnosis.fr repris de la fiche, rien d'inventé.
2. `reseaux/deposer.py` : une fonction `x(reel, legende)` sur le modèle de `instagram()`, et son
   bloc `try/except` dans la boucle (chaque plateforme est indépendante : l'échec de l'une ne
   retient pas les autres, et ouvre une issue).
3. `reseaux/registre.json` : ajouter la clé `"x": null` aux posts créés par `preparer.py`
   (`reg['posts'].append({... 'tiktok': None, 'instagram': None})`), et l'ajouter au test
   `not (p['tiktok'] and p['instagram'])` de `deposer.py`.

**Ce qu'il faut vérifier auprès de X avant d'écrire une ligne** (je n'ai rien vérifié pour X,
les règles et les tarifs de leur API ont changé plusieurs fois) :
- l'accès à l'API et son coût pour publier un tweet avec vidéo, la limite d'envois par jour ;
- l'authentification OAuth 2.0 avec PKCE et les portées d'écriture de tweets et de médias ;
- l'envoi de médias en plusieurs morceaux (une vidéo de 15 s à 1080 × 1920 tient dans les limites) ;
- l'obligation éventuelle de **déclarer le compte comme automatisé**, et la règle contre le
  spam ou le contenu répétitif.

Comme pour TikTok, **le compte doit être celui de la marque**, avec un rôle sur l'app
développeur, et la publication ne se fait que sur ce compte.

## 6. Exploitation

- **Suspendre** : créer `reseaux/PAUSE`, ou `launchctl bootout gui/$(id -u)/fr.anagnosis.reseaux.deposer`.
- **Journaux** : `~/Anagnosis-medias/logs/`. Tout échec ouvre une issue GitHub qui mentionne les
  deux propriétaires.
- **Refaire une semaine** : `python3 reseaux/preparer.py --semaine 2026-41` (ou `--depuis AAAA-MM-JJ`
  pour une semaine déjà entamée). **Déposer un jour à la main** : `python3 reseaux/deposer.py --jour AAAA-MM-JJ`.
- **Jeton Instagram** : valable 60 jours, prolongé seul quand il en reste moins de 10. S'il
  expire, le régénérer dans le tableau de bord Meta puis `node reseaux/instagram.js jeton <jeton>`.
- **Les routines de contenu ne touchent ni à `reseaux/` ni à `registre.json`.** Une erreur de fond
  trouvée dans une fiche déjà publiée doit ouvrir une issue : le post en ligne ne se corrige pas seul.
