---
description: Relit au fond les fiches non contrôlées — rouvre les sources, corrige ou signale
---

Tu contrôles des fiches Anagnosis déjà écrites. `npm run validate` vérifie la **forme** :
longueurs, champs présents, équilibre du quiz. Il ne sait pas si une source existe, ni si
elle dit ce que la fiche lui fait dire. C'est le seul trou qui reste, et c'est le seul
risque du projet qui ne se rattrape pas une fois publié (brief §3).

Ton travail n'est pas de relire du style. C'est de **rouvrir les sources**.

## 1. Prendre le lot

```bash
npm run acontroler
```

Si la sortie dit RIEN À FAIRE, arrête-toi là et rends compte en une ligne.

Sinon, traite les fiches listées, et **seulement celles-là**. La commande a déjà décidé :
les jamais contrôlées d'abord, brouillons en tête, puis celles retouchées depuis leur
dernier contrôle.

## 2. Lire avant de juger

- `docs/ligne-editoriale.md` — ce que la fiche est censée être
- `CLAUDE.md` — les pièges déjà rencontrés

## 3. Contrôler une fiche

Pour chaque fiche, dans cet ordre :

**a. Ouvrir chaque source.** Vraiment : `WebFetch` sur l'`url`. Vérifier que la page existe,
qu'elle est bien l'œuvre annoncée, et qu'elle soutient ce que la fiche affirme.

Le piège principal : une recherche par titre renvoie souvent une **recension** dont le
titre reprend celui du livre. Trois liens sur vingt-neuf étaient dans ce cas au premier
passage. Regarde le nom de la revue : si le titre du livre paraît dans *French Studies*,
*Choice* ou *Cerveau & Psycho*, c'est un compte rendu de trois pages, pas l'ouvrage.

**b. Confronter le contenu aux sources.** Chaque affirmation datée, chiffrée ou attribuée
doit se retrouver dans une source de la fiche. Une date approximative, un effet dont la
taille a été révisée depuis, une paternité contestée : c'est exactement ce qu'on cherche.

**c. Vérifier la citation ou le repère.** Une citation doit être authentique, attribuée au
bon auteur, et **ouvrable**. Si tu ne parviens pas à la retrouver dans une édition, c'est
un signalement, pas une correction.

**d. Vérifier la carte.** `punch`, `idee` et `source_courte` doivent tenir debout sans
l'app : quelqu'un qui voit la carte en story sans rien télécharger doit avoir appris
quelque chose d'exact.

**e. Vérifier le quiz.** La bonne réponse est-elle réellement la bonne au vu des sources ?
Les distracteurs sont-ils faux — et non « moins bons » ?

## 4. Corriger, ou signaler : la frontière

Tu peux **corriger toi-même**, sans demander :

- une coquille, une faute d'accord, une ponctuation
- une `url` morte remplacée par la même œuvre à une adresse valide
- une `url` manquante ajoutée après avoir ouvert la page
- une référence bibliographique incomplète (année, revue, pagination)
- la position de la bonne réponse du quiz, si elle est en première position partout

Tu ne corriges **jamais** seul — tu signales, et tu passes la fiche en `en_retouche` :

- une affirmation que les sources ne soutiennent pas
- une citation introuvable ou douteuse
- un chiffre qui ne correspond pas à la source
- une source à remplacer par une autre
- quoi que ce soit qui change le **sens** de la fiche

La raison est simple : réécrire le fond, c'est réécrire la fiche, et `statut: valide` est
la trace d'une décision humaine. Une correction de fond faite en silence par une routine
de nuit vide cette trace de son contenu. Sept fiches signalées valent mieux qu'une
réécrite de travers.

**Ne fabrique jamais une url.** Une adresse plausible qui ne s'ouvre pas est pire que le
champ vide : elle a l'air d'une preuve. Ouvre-la, ou n'écris rien.

Ordre de préférence pour un lien : texte intégral libre (Wikisource, Gutenberg,
archive.org, ADS, NTRS, DOI en accès ouvert) → notice de bibliothèque (Open Library) →
page de l'éditeur pour un ouvrage sous droits.

## 5. Poser la trace

Une fois la fiche contrôlée :

```bash
node src/cli.js controle <id> <ok|corrige|a_revoir> "note" "note"
```

- `ok` — sources rouvertes, rien à redire
- `corrige` — tu as corrigé, dis quoi dans les notes
- `a_revoir` — tu signales ; les notes disent **quoi** vérifier et **pourquoi**, et tu
  passes aussi le `statut` à `en_retouche` pour que la fiche remonte dans `npm run admin`

La commande calcule l'empreinte du contenu. Ne l'écris pas à la main : si la fiche est
retouchée plus tard, l'empreinte change et la fiche repasse au contrôle toute seule.

Pose la trace **après** tes corrections, jamais avant — sinon l'empreinte enregistre un
état que tu viens de modifier, et la fiche ressortira à contrôler au passage suivant.

## 6. Contrôler l'ensemble

```bash
npm run validate   # zéro erreur, zéro alerte
npm test
```

## 7. Rendre compte

En quelques lignes : combien de fiches contrôlées, combien intactes, ce que tu as corrigé,
et surtout **ce que tu as signalé** — c'est l'information utile du rapport. Termine par le
nombre de fiches restant à contrôler.

Ne commite rien.
