---
description: Produit un lot de fiches dans la discipline au stock le plus mince
---

Tu produis du contenu pour Anagnosis. Cette session tourne **sans relecteur derrière
toi** : tout ce que tu écris atterrit dans une file d'attente humaine. Ta responsabilité
n'est pas le volume, c'est que rien de faux n'entre dans le dépôt.

## 1. Décider s'il faut produire

```bash
npm run cible
```

**Si la sortie dit STOP, arrête-toi là** et rends compte en une ligne. La file de
relecture est pleine : produire davantage ne fabrique pas du stock, ça fabrique un
arriéré que personne ne lira. Ce n'est pas un échec du passage, c'est son rôle.

Sinon, note la discipline visée et le nombre de fiches demandé.

## 2. Lire avant d'écrire

- `docs/ligne-editoriale.md` — **la référence**, à relire à chaque passage
- `docs/brief-produit.md` §3 — le positionnement, qui est tout entier la rigueur
- `CLAUDE.md` — les pièges déjà rencontrés, notamment sur les quiz

## 3. Choisir les sujets

Dans la discipline visée. Vérifie d'abord ce qui existe déjà :

```bash
ls content/concepts/<discipline>/
```

Ne double aucun sujet, même sous un autre titre. Varie les registres et les niveaux à
l'intérieur du lot : huit fiches bâties sur le même schéma se lisent comme une seule.

L'angle le plus rentable reste la **correction d'un contresens répandu** — le lecteur
repart avec quelque chose qu'il croyait déjà savoir. Mais n'en fais pas huit sur huit :
un lot entièrement composé de démolitions donnerait le sentiment que rien ne tient dans
la discipline, ce qui serait faux et, à terme, aussi trompeur que les mythes qu'on
corrige.

### Si la discipline visée est du droit

Les sept disciplines de la famille **Droit et justice** — Institutions judiciaires, Preuve
et erreur judiciaire, Droit international, Propriété intellectuelle et IA, Droit
constitutionnel, Droit social, Conformité — ont une contrainte que les autres n'ont pas,
posée en `docs/ligne-editoriale.md` §3.1. Relis-la avant d'écrire.

**Écris le droit comme histoire et comme idée, jamais comme état actuel d'une règle en
vigueur.** C'est la seule discipline où une fiche peut devenir fausse sans que personne
n'y touche : le texte décrit est modifié, ou il ne valait depuis toujours que dans un pays
sans le dire. Le contrôle ordinaire ne le verrait pas, puisque la source, elle, n'a pas
changé.

Trois règles pratiques :

1. **Le cœur d'une fiche n'est jamais le contenu actuel d'une norme.** Ce n'est pas une
   question de difficulté, c'est qu'elle porterait une date de péremption qu'aucune
   routine ne sait lire. Le Statute of Anne de 1710 ne se périme pas ; « la durée du droit
   d'auteur en France » se périme.
2. **Toute règle nationale est datée et située dans la fiche même** — « la loi française
   du 9 avril 1898 », pas « la loi ». Le pays dans la source ne suffit pas, le lecteur ne
   l'ouvre pas. Un arrêt porte sa cour.
3. **Le droit comparé est un atout.** Deux pays qui tranchent différemment la même
   question donnent un déplacement que rien d'autre ne donne, et la divergence est stable.

En retour, le sourçage y est **plus facile** qu'ailleurs : Légifrance, EUR-Lex, HUDOC,
Gallica, Wikisource, le Recueil des traités des Nations unies et Cornell LII ont tous des
adresses stables. Vise la source primaire — le texte de loi, l'arrêt, le traité — et non
son commentaire.

Deux pièges déjà rencontrés sur ces fiches, qui coûtent une correction chacun :

- **Un fac-similé de presse n'a pas de couche de texte.** Il faut le regarder à l'image
  pour vérifier ce qu'il porte. C'est comme ça qu'un « publié en une » s'est révélé être
  une page 9.
- **Les chiffres d'une affaire viennent de la décision, pas de sa synthèse.** Une
  encyclopédie donnait « environ quatre mille entrées recopiées » là où l'arrêt dit 1 309
  sur 46 878.

Ces fiches ne sont **pas sonorisées** : n'attends pas d'audio, et ne l'annonce nulle part.

## 4. Vérifier les sources — c'est le cœur du travail

**Chaque source est vérifiée en ligne avant d'entrer dans une fiche.** Pas « je crois me
souvenir », pas « c'est de notoriété publique » : tu ouvres la source, tu confirmes
qu'elle existe, et qu'elle dit ce que la fiche lui fait dire.

Deux sources minimum par fiche, dont au moins une primaire ou institutionnelle.

**Ne fabrique jamais de citation.** En l'absence d'une citation authentique et sourçable,
utilise le champ `repere` — un fait sourcé et chiffré (ligne éditoriale §4). Une citation
apocryphe est indétectable par le lecteur et ruine le positionnement le jour où elle est
repérée. C'est le seul risque du projet qui ne se rattrape pas.

Si tu ne parviens pas à vérifier une source, **change de sujet**. Produire sept fiches
solides vaut infiniment mieux que huit dont une est douteuse.

## 5. Écrire

Une fiche = `content/concepts/<discipline>/<slug>.json`, au statut `brouillon`.

**Jamais `valide`.** Le statut est la trace d'une décision humaine, pas un champ à
remplir. Toute fiche que tu crées en `valide` sera considérée comme une faute.

Écris la **carte partageable en même temps que la fiche** : `punch`, `idee`,
`source_courte`. C'est du contenu, pas de la mise en page — la carte doit tenir debout
sans l'app, et quelqu'un qui la voit en story sans rien télécharger doit avoir appris
quelque chose. `source_courte` n'est jamais vide.

Sur les quiz, deux pièges déjà rencontrés et vérifiés par des tests : **varie la position
de la bonne réponse** (écrites à la suite, elles finissent toutes en première position),
et **ne fais pas la bonne réponse plus longue que ses distracteurs** — au-delà de 1,4× le
plus long distracteur, elle se repère sans comprendre la question.

## 6. Contrôler

```bash
npm run validate   # zéro erreur, zéro alerte
npm test           # les tests contrôlent aussi le contenu réel du dépôt
```

Corrige jusqu'à ce que les deux passent. Ne rends pas compte d'un passage dont les
contrôles échouent.

## 7. Rendre compte

En quelques lignes : la discipline, les sujets traités, ceux que tu as **abandonnés faute
de source vérifiable** — c'est l'information la plus utile du rapport — et l'état de la
file de relecture.

Ne commite rien. La relecture se fait dans `npm run admin`.
