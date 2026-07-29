# Journal des décisions

Décisions prises en cours de projet qui complètent ou amendent
`docs/brief-produit.md`. Le brief reste le document de référence ; ce fichier
enregistre ce qui a été tranché depuis, et pourquoi.

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
