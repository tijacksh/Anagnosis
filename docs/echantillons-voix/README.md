# Échantillons de voix

Les deux voix retenues pour l'écoute, sur une fiche réelle.

| Fichier | Voix | Genre |
|---|---|---|
| `helene--banalite-du-mal.mp3` | Helene — *A Warm French Documentary* | femme |
| `jerome--banalite-du-mal.mp3` | Jerome — *French Narrator & Reflective Podcast* | homme |
| `banalite-du-mal.txt` | le texte exactement tel qu'il est prononcé | — |

Modèle `eleven_v3`, MP3 44,1 kHz mono 128 kbit/s — le format **master**, pas celui
servi à l'app. L'app reçoit un dérivé AAC 32 kbit/s d'environ 900 Ko ; ces fichiers-ci
font 3,3 Mo parce qu'ils sont la source d'archive, celle qui alimentera le podcast.

## Pourquoi cette fiche

*La banalité du mal* a été choisie pour l'écoute de recette parce qu'elle concentre les
trois difficultés du corpus : un registre grave où une voix mal calibrée sonne faux, des
noms propres allemands (*Eichmann*, *Arendt*), et des titres de section — c'est sur
« Ce qu'Arendt soutenait » qu'on a vérifié que la pause s'entend comme une section et non
comme une hésitation.

## Pourquoi ces fichiers sont dans le dépôt

`audio/masters/` et `audio/app/` sont ignorés par git, et pour une bonne raison : le
corpus complet en deux voix pèse près de trois gigaoctets, qui n'ont rien à faire dans un
historique. Ces deux-là sont une exception délibérée et bornée à deux fichiers.

Ils ne sont pas du contenu, ils sont une **pièce justificative** : la trace de ce qui a
été écouté le jour où la voix a été choisie. Le jour où quelqu'un — dans deux ans, ou
après un changement de modèle — se demandera à quoi le catalogue était censé ressembler,
la réponse doit être audible, pas seulement décrite dans `docs/decisions.md`.

Ne pas y ajouter d'autres fiches : cette exception vaut pour un point de référence, pas
pour une bibliothèque.

## Le texte

`banalite-du-mal.txt` est la sortie exacte de `aLire()` (`src/audio.js`) — titre, corps
sans les marqueurs `##` et `**`, puis la citation ou le repère. Les blocs y sont séparés
par une ligne vide : c'est cette séparation qui produit la pause à l'écoute.
