# Journal des décisions

Décisions prises en cours de projet qui complètent ou amendent
`docs/brief-produit.md`. Le brief reste le document de référence ; ce fichier
enregistre ce qui a été tranché depuis, et pourquoi.

---

## 2026-07-30 — Pack Philosophie validé : cible du Lot 0 atteinte

Les 12 fiches de philosophie sont validées sans réserve. La base compte
**20 fiches validées**, ce qui atteint la cible du Lot 0 (20-30 fiches produites et
validées via le pipeline complet, brief §13).

Le pipeline a donc fait son tour complet deux fois, sur deux registres très
différents — sciences expérimentales et histoire des idées — sans que le schéma ni
la ligne éditoriale aient eu besoin d'être refondus. Les seuls ajustements ont été
l'ajout de la discipline Médecine / Santé, le champ `carte`, et l'autorisation des
années négatives pour les sources antiques.

Reste à faire avant lancement public : passer de 20 à 200-300 fiches, en gardant un
socle sur toutes les disciplines actives.

---

## 2026-07-29 — Le partage en story devient le moteur de croissance

**Décidé :** le partage d'une carte-image du concept du jour passe de V1.5
(brief §6) à **fonction centrale de V1**. C'est la boucle d'acquisition retenue.

**Le raisonnement :** il existe déjà une audience installée pour ce format — les
comptes TikTok et les carrousels Instagram qui expliquent un concept de physique,
de philo ou de psycho en une slide, et que les gens repartagent. Cette audience
consomme exactement notre contenu, mais sans source ni suite. L'objectif est de la
capter : la story partagée fait connaître l'app, l'app apporte le rituel quotidien
et la rigueur que ces comptes n'ont pas.

**Conséquence sur le modèle de données :** ajout du champ `carte`
(`punch`, `idee`, `source_courte`). La carte est du **contenu**, pas de la mise en
page : elle s'écrit avec la fiche, sinon il faudrait rouvrir chaque fiche plus tard.
Les trois champs sont obligatoires dès que `carte` est renseignée, et le validateur
refuse une carte sans `source_courte`.

**Règle éditoriale associée :** la carte doit tenir debout sans l'app. Quelqu'un qui
la voit en story sans rien télécharger doit avoir appris quelque chose. Une carte
réduite à une bande-annonce (« vous ne devinerez jamais… ») reproduit le teasing
creux qu'on prétend remplacer.

**Reste à trancher :** qui fabrique l'image ? Deux options — le pipeline la génère
en amont, comme les illustrations (brief §10), ou l'app la compose à la volée pour
pouvoir y afficher le pseudo ou la série de l'utilisateur. La seconde est plus
virale, la première plus contrôlable. À décider avant le Lot 2.

---

## 2026-07-29 — Direction visuelle : graphique et coloré, pas austère

**Décidé :** identité visuelle franche, colorée, ludique — le référent est le compte
Instagram ou TikTok qui explique un concept en une slide, pas le manuel scolaire.

**Ce qui lève la contradiction apparente** avec l'exigence de sérieux : **la
crédibilité est portée par la source affichée, pas par une palette austère.** Le
gris et le serif ne prouvent rien ; « Arendt, 1963 » en bas d'un visuel, si. Une
fois le crédit source rendu visible et systématique, le visuel est libre d'être
saturé et joyeux sans rien concéder sur le fond.

**Le vrai risque du registre coloré**, à rappeler à Claude Design au Lot 5 : le
dégradé violet-bleu, les formes molles et les compositions centrées sont la
signature même des générateurs d'images. « Coloré » doit vouloir dire *graphique et
composé*, jamais *effet automatique*. L'exigence du brief §11 — un rendu jamais
identifiable comme généré par IA — devient plus difficile à tenir dans ce registre,
pas moins.

**Piste à évaluer :** une famille de couleurs par discipline, pour que la discipline
se reconnaisse avant d'être lue.

**Dette assumée :** les `illustration.prompt` des 8 fiches Doppler ont été rédigés
dans la direction sobre précédente (encre fine, papier crème). Ils sont conservés
tels quels plutôt que réécrits deux fois : la direction artistique n'étant pas
arrêtée, une passe unique au Lot 5 coûtera moins qu'une réécriture maintenant. Les
12 fiches de philosophie sont, elles, écrites dans la nouvelle direction.

---

## 2026-07-29 — Pack Philosophie produit

12 fiches, de Platon à Searle, en attente de validation. Registres et niveaux
volontairement variés : histoire des idées, épistémologie, morale, existentialisme,
philosophie de l'esprit.

Sept des douze corrigent un contresens répandu — la fin de l'allégorie de la
caverne, la formule d'Ockham qui n'est pas d'Ockham, la banalité du mal, l'absurde
de Camus, le pari de Pascal, l'impératif catégorique confondu avec la règle d'or,
l'éternel retour lu comme une cosmologie. C'est l'angle le plus rentable pour le
positionnement : le lecteur repart avec quelque chose qu'il croyait déjà savoir.

---

## 2026-07-29 — Lot Doppler validé

Les 8 fiches du premier lot thématique (effet Doppler) sont validées sans
réserve. C'est le premier passage complet du pipeline : génération → contrôle
qualité automatique → relecture humaine → statut `valide`.

Le Lot 0 vise 20-30 fiches (brief §13). 8 sont faites.

---

## 2026-07-29 — Citation *et* repère, selon disponibilité

**Décidé :** les deux champs coexistent. Une vraie citation quand il en existe
une, authentique et sourçable ; un `repere` — fait sourcé et chiffré — sinon.

**Pourquoi :** exiger une citation d'auteur sur chaque fiche pousse
mécaniquement à en fabriquer, puisque beaucoup de concepts n'ont pas de phrase
célèbre attachée. Une citation apocryphe est indétectable par le lecteur et
ruine le positionnement « rigueur » (brief §3) le jour où elle est repérée.

**Conséquence technique :** le validateur exige au moins l'un des deux champs, et
refuse toute citation dépourvue de `source`. Les deux doivent recevoir un
traitement graphique cohérent au Lot 5 — ils occupent le même emplacement dans
la fiche.

Répartition sur le lot Doppler : 3 citations, 5 repères.

---

## 2026-07-29 — Ajout de la discipline « Médecine / Santé »

**Décidé :** neuvième discipline, active en V1. La fiche sur l'échographie
Doppler y est reclassée (`bio-echographie-doppler` → `med-echographie-doppler`).

**Pourquoi :** la taxonomie du brief (§7) n'a pas de discipline Médecine, et
l'imagerie médicale se classe mal en Biologie. C'est par ailleurs un gisement de
concepts important et très lisible pour un public généraliste.

**Conséquence :** la taxonomie V1 passe de 8 à 9 disciplines. Le brief §14
laissait ouverte la question « les 8 disciplines dès le lancement, ou un
sous-ensemble ? » — elle reste ouverte, mais porte désormais sur 9.

---

## 2026-07-29 — Production par packs de disciplines

**Décidé :** la production continue se fait par lots d'une discipline entière,
plutôt qu'en vrac ou par thème transversal. Objectif : constituer vite le stock
avant publication.

**Pourquoi :** le brief (§9) demande 200-300 fiches validées avant lancement, soit
60 à 90 jours d'avance. Travailler discipline par discipline permet de mutualiser
la recherche de sources et de garder une cohérence de ton à l'intérieur d'un lot.

**À surveiller :** l'app sert un concept par jour en piochant dans les disciplines
choisies par l'utilisateur (brief §5). Un stock déséquilibré — une discipline
complète, les autres vides — rendrait le service impraticable pour qui n'a pas
coché la bonne. Il faut donc atteindre un socle minimal sur toutes les disciplines
actives avant de publier, même si la production se fait pack par pack.

**Note :** le lot Doppler, lui, est thématique et transversal (physique, biologie,
médecine). Il reste exploitable comme pack thématique en achat unique (brief §12) :
`theme: "effet-doppler"` et `theme_ordre` sont déjà renseignés. Chaque fiche reste
autonome et peut tomber un jour quelconque.
