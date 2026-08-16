---
description: Revoit les fiches juridiques — la juridiction est-elle dite, la règle est-elle toujours vraie
---

Tu revois des fiches de **Droit et justice** déjà écrites et déjà contrôlées. Ce n'est pas
un second contrôle ordinaire : `/controler` a déjà rouvert leurs sources et vérifié que la
fiche dit ce que la source dit. Tu n'as pas à le refaire.

Tu es là pour les **deux choses que `/controler` ne peut pas voir**.

## Pourquoi cette routine existe

Le contrôle ordinaire se déclenche quand l'empreinte du texte bouge, et il compare la
fiche à ses sources. Ces deux mécanismes sont aveugles au risque propre du droit :

- **La juridiction.** Une fiche qui décrit le droit français sans le dire est fausse pour
  le lecteur belge, suisse, québécois ou sénégalais depuis le premier jour. L'empreinte
  n'a jamais bougé, les sources disent exactement ce que la fiche leur fait dire, et le
  contrôle passe sans rien voir. Il a raison de passer : rien n'est faux **par rapport à
  la source**.
- **La mutabilité.** Un texte est modifié, abrogé, ou renversé par une décision
  postérieure. La fiche ment à partir de ce jour-là. Mais l'article de 2015 dit toujours
  en 2030 ce qu'il disait en 2015 : la source reste exacte, et le contrôle la trouve
  conforme.

C'est le seul angle mort de la chaîne, et il est à la fois silencieux et durable — comme
l'audio produit à partir d'un texte périmé, qu'`audio/index.json` a fallu inventer pour
rattraper.

**Cette routine est le filet, pas la défense principale.** La défense est en amont, dans
`docs/ligne-editoriale.md` §3.1 : une fiche de droit s'écrit comme histoire et comme idée,
jamais comme état actuel d'une règle en vigueur. Une fiche conforme à cette règle est
insensible aux deux risques — le Statute of Anne de 1710 ne se périme pas. Tu es là pour
celles qui sont passées entre les mailles.

## 1. Prendre le lot

```bash
npm run adroit
```

Si la sortie dit RIEN À FAIRE, arrête-toi là et rends compte en une ligne.

La file ne regarde ni le statut ni l'empreinte : elle regarde **l'âge de la dernière
revue**, trois mois de validité. Une fiche que personne n'a touchée depuis deux ans y
remonte, et c'est tout l'intérêt.

## 2. Lire avant de juger

- `docs/ligne-editoriale.md` §3.1 — la règle que ces fiches sont censées respecter
- `CLAUDE.md` — la frontière entre corriger et signaler

## 3. Revoir une fiche

Deux questions, dans cet ordre, et **seulement celles-là**.

### a. La fiche dit-elle de quel pays elle parle ?

Relis le corps, la carte et le quiz en te demandant : un lecteur belge peut-il croire que
ça vaut chez lui ?

- Une règle nationale doit être **nommée comme telle** dans la fiche même — « la loi
  française du 9 avril 1898 », pas « la loi ». Le pays dans la source ne suffit pas : le
  lecteur ne l'ouvre pas.
- Un arrêt doit porter sa cour. « Marbury v. Madison » se comprend, « la Cour a jugé » ne
  se comprend pas.
- Une notion réellement transnationale — le copyright, le génocide, la conformité — n'a
  pas besoin d'être située, mais **ses illustrations chiffrées, si**.

C'est le point le plus souvent en défaut, parce qu'il ne se voit pas à la relecture : la
phrase est vraie pour qui l'a écrite.

### b. Ce que la fiche décrit est-il toujours vrai aujourd'hui ?

Rouvre la source, et **cherche ce qui lui est arrivé depuis** — ce que le contrôle
ordinaire ne fait jamais.

- Sur Légifrance, regarde la **version en vigueur** de l'article, pas la version citée.
  Un article abrogé y est marqué comme tel.
- Pour une décision de justice, cherche si elle a été **infirmée en appel, renversée, ou
  écartée** par une décision postérieure. Une jurisprudence citée comme actuelle qui a été
  renversée est l'erreur la plus grave que ces fiches puissent porter.
- Pour un texte européen, vérifie sur EUR-Lex qu'il n'a pas été remplacé.
- Pour une fiche historique — la grande majorité — la question se règle en une ligne : un
  fait de 1710 n'a pas changé. Note-le et passe.

**Ne fabrique jamais une url**, ici comme ailleurs. Une adresse plausible qui ne s'ouvre
pas a l'air d'une preuve.

## 4. Corriger, ou signaler : la frontière

Tu peux **corriger toi-même**, sans demander :

- ajouter le pays ou la cour manquante quand la fiche est par ailleurs exacte — « la loi »
  qui devient « la loi française du 9 avril 1898 »
- une `url` morte remplacée par la même source à une adresse valide
- une référence incomplète (numéro d'article, date de la version)

Tu ne corriges **jamais** seul — tu signales, et tu passes la fiche en `en_retouche` :

- une règle décrite qui n'est plus en vigueur
- une décision citée qui a été renversée ou infirmée
- une fiche dont le cœur est l'état actuel d'une norme, ce que la ligne éditoriale
  interdit : elle est à réécrire vers son histoire, pas à rafistoler
- une affirmation vraie dans un pays et présentée comme générale, quand la corriger
  demanderait de réécrire le raisonnement

La raison est la même que pour `/controler` : réécrire le fond, c'est réécrire la fiche, et
`statut: valide` est la trace d'une décision. Une fiche signalée vaut mieux qu'une fiche
réécrite de travers par une routine de nuit.

## 5. Poser la trace

```bash
node src/cli.js controle-droit <id> <ok|a_revoir> "note" "note"
```

- `ok` — juridiction dite, règle toujours vraie ; dis dans la note **ce que tu as
  rouvert** et ce que tu as constaté, sinon la trace ne prouve rien
- `a_revoir` — les notes disent **quoi** et **pourquoi**, et tu passes aussi le `statut` à
  `en_retouche` pour que `/reparer` s'en saisisse

Il n'y a **pas** de verdict `corrige`, à la différence du contrôle ordinaire : tout ce qui
touche au sens se signale.

La trace n'enregistre **pas d'empreinte**, contrairement à `controle`. C'est voulu : ce
n'est pas le texte qu'on horodate, c'est la vérification. Une fiche que personne ne touche
doit repasser dans trois mois quand même — c'est exactement le cas que cette routine existe
pour attraper.

## 6. Contrôler l'ensemble

```bash
npm run validate   # zéro erreur, zéro alerte
npm test
```

## 7. Rendre compte

En quelques lignes : combien de fiches revues, combien portaient une juridiction implicite,
combien décrivaient une règle qui a bougé, et **ce que tu as signalé**. Si tout était en
ordre, dis-le en une ligne — c'est le résultat attendu, et une routine qui rend un rapport
long quand tout va bien finit par ne plus être lue.

Ne commite rien.
