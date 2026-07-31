---
description: Répare les fiches en retouche, les vérifie point par point et les revalide
---

Tu répares des fiches qu'un contrôle a **sorties de la circulation**. Elles ne sont plus
servies à personne : elles portent le statut `en_retouche`, et le fichier publié les liste
comme retirées. Ton travail est de les rendre exactes, ou de constater qu'elles ne peuvent
pas l'être.

Tu as le droit de **revalider** ce que tu as vérifié. C'est un écart au principe habituel
— `valide` est ailleurs la trace d'une décision humaine — et il t'oblige à un niveau
d'exigence supérieur, pas inférieur : personne ne repassera derrière toi avant que la
fiche ne soit servie.

## 1. Prendre le lot

```bash
npm run areparer
```

Si la sortie dit RIEN À FAIRE, arrête-toi là et rends compte en une ligne.

Sinon, traite les fiches listées, et seulement celles-là. Chacune est affichée avec les
**notes du contrôle qui l'a sortie** : c'est ton cahier des charges, pas une suggestion.

Une fiche marquée `À REJETER, ne pas réparer une fois de plus` a déjà subi deux
réparations et est revenue. Ne tente pas la troisième : rejette-la, en disant pourquoi.

## 2. Lire avant de toucher

- `docs/ligne-editoriale.md` — ce que la fiche doit être
- `CLAUDE.md` — les pièges déjà rencontrés

## 3. Vérifier, point par point

Pour chaque fiche :

**a. Rouvrir chaque source.** `WebFetch` sur chaque `url`, vraiment. Vérifier que la page
existe, qu'elle est bien l'œuvre annoncée, et qu'elle soutient ce que la fiche lui fait
dire. Une recherche par titre renvoie souvent une **recension** dont le titre reprend
celui du livre : regarde le nom de la revue.

**b. Traiter chaque point signalé.** Reprends les notes du contrôle une par une. Pour
chacune, une seule question : *la source dit-elle cela, oui ou non ?*

**c. Ne pas s'arrêter aux points signalés.** Tu vas revalider la fiche entière, donc tu la
vérifies entière : chaque affirmation datée, chiffrée ou attribuée du corps, la citation
ou le repère, la carte, et le quiz. Le contrôle qui a produit les notes cherchait un
problème ; toi, tu réponds de tout le texte.

**d. Vérifier que la bonne réponse du quiz l'est vraiment** au vu des sources, et que les
distracteurs sont **faux** — pas seulement moins bons.

## 4. Corriger

La règle est unique : **le texte doit dire exactement ce que les sources soutiennent, ni
plus ni moins.**

- une affirmation trop forte se ramène à ce que la source établit — on ne l'assouplit pas
  d'un « environ » ou d'un « selon certains », on la rend exacte ;
- un chiffre non soutenu est remplacé par le chiffre de la source, ou disparaît ;
- une source qui ne dit pas ce qu'on lui fait dire est remplacée par une source qui le
  dit — vérifiée, ouverte — ou l'affirmation tombe ;
- un lien mort est remplacé par la même œuvre à une adresse valide.

**N'invente jamais une url ni une citation.** Une adresse plausible qui ne s'ouvre pas est
pire que rien : elle a l'air d'une preuve. Ouvre-la, ou n'écris pas.

Si corriger un point vide la fiche de son intérêt — la thèse elle-même ne tenait pas —
ne la sauve pas à tout prix. Une fiche rejetée coûte huit cents mots ; une fiche fausse
coûte le positionnement du produit.

## 5. Décider

```bash
node src/cli.js reparation <id> <valide|en_retouche|rejete> "ce qui a été fait et vérifié"
```

- **`valide`** — tu as rouvert toutes les sources, vérifié toutes les affirmations, et le
  texte dit exactement ce qu'elles soutiennent. La fiche repart en circulation.
- **`en_retouche`** — il reste un doute que tu ne peux pas lever. Dis lequel, précisément,
  et ce qu'il faudrait pour le lever. C'est un résultat honnête, pas un échec.
- **`rejete`** — la fiche repose sur une affirmation qu'aucune source vérifiable ne
  soutient, ou elle revient pour la troisième fois.

La note n'est pas décorative : elle est la seule justification d'une validation sans
relecteur. Elle dit **quelles sources ont été rouvertes** et **ce qui a été changé**.
« Vérifié, tout est bon » ne vaut rien.

La fiche est enregistrée avec `decide_par: routine-reparation`, jamais une adresse
personnelle : on doit pouvoir distinguer à tout moment ce qui a été relu par un humain de
ce qui ne l'a pas été.

Tu n'as pas à reposer de trace de contrôle : le texte ayant changé, la fiche repasse
d'elle-même dans `npm run acontroler`, et un passage indépendant revérifiera ton travail.

## 6. Contrôler

```bash
npm run validate   # zéro erreur, zéro alerte
npm test
```

Corrige jusqu'à ce que les deux passent. Ne rends pas compte d'un passage dont les
contrôles échouent.

## 7. Rendre compte

Par fiche, en une ligne : ce qui était reproché, ce que tu as vérifié, ce que tu as
changé, et la décision. Termine par le nombre de fiches restant en retouche.

Ne commite rien.
