---
description: Relit au fond les brouillons déjà contrôlés, et les met en circulation ou les écarte
---

Tu tranches le sort de brouillons. Ils sont écrits, ils ont déjà passé un contrôle
indépendant, et il ne manque qu'une décision : les mettre en circulation, ou non.

**Cette décision n'aura pas de relecteur derrière elle.** Elle appartenait à un humain ;
elle t'a été déléguée. Ça t'oblige à un niveau d'exigence supérieur, pas inférieur — une
fiche que tu valides sera servie telle quelle à des lecteurs qui font confiance à ce
produit précisément parce qu'il est vérifié.

Tu n'écris pas de contenu neuf ici. Tu vérifies, tu corriges ce qui doit l'être, tu
décides.

## 1. Prendre le lot

```bash
npm run arelire
```

Si la sortie dit RIEN À FAIRE, arrête-toi là et rends compte en une ligne.

Sinon, traite les brouillons listés, et seulement ceux-là. Chacun est affiché avec **la
date et le verdict de son contrôle**, et les notes de ce contrôle s'il en a laissé.

Ces notes disent ce qu'un premier passage a vérifié ou corrigé. **Elles ne te dispensent
de rien.** Tu es le second passage : ton travail n'a de valeur que parce qu'il repart du
texte, pas du rapport de l'autre. Un brouillon dont le contrôle dit « tout est bon » se
vérifie exactement comme les autres.

## 2. Lire avant de toucher

- `docs/ligne-editoriale.md` — ce que la fiche doit être
- `CLAUDE.md` — les pièges déjà rencontrés

## 3. Vérifier, point par point

Pour chaque brouillon :

**a. Rouvrir chaque source.** `WebFetch` sur chaque `url`, vraiment — celles des
`sources[]`, de la `citation` ou du `repere`, et de chaque `pour_aller_plus_loin`. Vérifier
que la page existe, qu'elle est bien l'œuvre annoncée, et qu'elle soutient ce que la fiche
lui fait dire.

Deux pièges déjà rencontrés sur ce corpus : une recherche par titre renvoie souvent une
**recension** dont le titre reprend celui du livre — regarde le nom de la revue ; et une
œuvre en plusieurs volumes a une adresse par volume — vérifie que c'est le bon.

**b. Répondre de chaque affirmation.** Chaque date, chaque chiffre, chaque attribution du
corps de la fiche. Une seule question à chaque fois : *la source dit-elle cela, oui ou
non ?*

**c. Vérifier la citation ou le repère.** Une citation doit se retrouver **mot pour mot**
dans la source. Si elle ne s'y retrouve pas, elle n'est pas authentique, quelle que soit sa
notoriété — le champ `repere` existe exactement pour ce cas.

**d. Vérifier la carte.** `punch`, `idee` et `source_courte` doivent tenir sans le reste de
la fiche : c'est le seul texte que verront ceux qui croisent la story. Une carte qui
affirme plus que la fiche est une fiche fausse en circulation libre.

**e. Vérifier le quiz.** La bonne réponse doit l'être **au vu des sources**, et les
distracteurs doivent être **faux** — pas seulement moins bons. Vérifie aussi que la bonne
réponse ne se repère pas sans comprendre la question : ni la plus longue, ni la seule
détaillée.

## 4. Corriger

La règle est unique : **le texte doit dire exactement ce que les sources soutiennent, ni
plus ni moins.**

- une affirmation trop forte se ramène à ce que la source établit — on ne l'assouplit pas
  d'un « environ » ou d'un « selon certains », on la rend exacte ;
- un chiffre non soutenu est remplacé par le chiffre de la source, ou disparaît ;
- une source qui ne dit pas ce qu'on lui fait dire est remplacée par une source qui le dit
  — vérifiée, ouverte — ou l'affirmation tombe ;
- un lien mort est remplacé par la même œuvre à une adresse valide.

**N'invente jamais une url ni une citation.** Une adresse plausible qui ne s'ouvre pas est
pire que rien : elle a l'air d'une preuve. Ouvre-la, ou n'écris pas.

Si corriger un point vide la fiche de son intérêt — la thèse elle-même ne tenait pas — ne
la sauve pas à tout prix. Un brouillon écarté coûte huit cents mots ; une fiche fausse
coûte le positionnement du produit.

## 5. Décider

```bash
node src/cli.js relecture <id> <valide|en_retouche|rejete> "ce qui a été vérifié"
```

- **`valide`** — tu as rouvert toutes les sources, vérifié toutes les affirmations, la
  carte et le quiz, et le texte dit exactement ce qu'elles soutiennent. La fiche entre en
  circulation.
- **`en_retouche`** — il reste un doute que tu ne peux pas lever seul. Dis lequel,
  précisément, et ce qu'il faudrait pour le lever. La fiche part alors chez `/reparer`.
  C'est un résultat honnête, pas un échec : dans le doute, **ne valide pas**.
- **`rejete`** — la fiche repose sur une affirmation qu'aucune source vérifiable ne
  soutient.

La note est la **seule** justification d'une mise en circulation sans relecteur. Elle dit
**quelles sources ont été rouvertes** et **ce qui a été vérifié ou changé**. « Vérifié,
tout est bon » ne vaut rien — c'est ce qu'on relira le jour où une fiche se révélera
fausse.

La fiche est enregistrée avec `decide_par: routine-relecture`, jamais une adresse
personnelle : on doit pouvoir distinguer à tout moment ce qui a été relu par un humain de
ce qui ne l'a pas été.

Si tu as **touché au texte**, l'empreinte change et la fiche repasse d'elle-même dans
`npm run acontroler` : un troisième passage indépendant revérifiera ce que tu as écrit
avant qu'elle ne soit servie longtemps. Tu n'as rien à faire pour ça.

## 6. Contrôler

```bash
npm run validate   # zéro erreur, zéro alerte
npm test
```

Corrige jusqu'à ce que les deux passent. Ne rends pas compte d'un passage dont les
contrôles échouent.

## 7. Rendre compte

Par fiche, en une ligne : quelles sources ont été rouvertes, ce qui a été changé, et la
décision. Termine par le nombre de brouillons restants et par le nombre en attente de
contrôle.

Ne commite rien.
