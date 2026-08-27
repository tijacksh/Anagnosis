# Charte visuelle — Anagnosis

Direction retenue : **C · Risographie**. Ce document fixe les valeurs. Il est la
traduction opérationnelle de `docs/direction-artistique.md` ; en cas de
divergence, c'est la direction artistique qui tranche sur l'intention, ce
document sur les valeurs.

Maquettes de référence : `design/claude-design/livraison-anagnosis/maquettes/Anagnosis - UX·UI.dc.html` (repères 1a à 1j).

---

## 1. Principe fondateur

**La crédibilité est portée par la source affichée, pas par une palette austère.**

Conséquence contraignante : `carte.source_courte` n'est jamais absente, jamais
tronquée, jamais reléguée. Si un arbitrage de mise en page oppose le crédit à
autre chose, le crédit gagne.

---

## 2. Couleur

### 2.1 Constantes

| Rôle | Hex | Usage |
|---|---|---|
| Papier | `#F4EFE1` | Fond de toutes les surfaces en mode clair. Ne change jamais. |
| Encre noire | `#1B1A17` | Texte courant, structure, filets. |
| Jaune commun | `#FFE800` | Troisième encre, carte partageable uniquement. |
| Noir chaud | `#241F1A` | Papier du mode sombre. Jamais `#000`. |
| Papier sombre (texte) | `#EDE3D0` | Texte courant en mode sombre. |

### 2.2 Une encre par discipline

La taxonomie compte **trente-neuf disciplines**, groupées en six familles, et **toutes
ont désormais leur encre**. Une discipline sans encre ne serait pas offerte par le
client ; il n'en reste plus.

Ce tableau a décrit dix disciplines comme « à attribuer » pendant que les deux clients
leur donnaient déjà une valeur. Le désaccord n'a rien cassé, parce que ce sont les
clients qui affichent, mais il a fait croire à la production que dix disciplines étaient
fermées. Il ne s'est vu qu'en ouvrant le droit.

| Discipline | Encre Riso | Hex | Contraste sur papier |
|---|---|---|---|
| **Sciences exactes** | | | |
| Mathématiques | Teal | `#00838A` | 4,0:1 ⚠ |
| Physique | Blue | `#0078BF` | 4,3:1 ⚠ |
| Chimie | Kelly Green | `#67B346` | 2,3:1 ⚠ |
| Astronomie | Violet | `#9D7AD2` | 3,0:1 ⚠ |
| Informatique | Aqua | `#5EC8E5` | 1,7:1 ⚠ |
| Statistiques | Metallic Gold | `#AC936E` | 2,6:1 ⚠ |
| **Vivant et santé** | | | |
| Biologie | Green | `#00A95C` | 2,6:1 ⚠ |
| Médecine / Santé | Red | `#FF665E` | 2,6:1 ⚠ |
| Neurosciences | Coral | `#FF8E91` | 1,9:1 ⚠ |
| Génétique | Fluorescent Orange | `#FF7477` | 2,3:1 ⚠ |
| Écologie | Grass | `#397E58` | 4,3:1 ⚠ |
| Nutrition | Light Lime | `#E3ED55` | 1,1:1 ⚠ |
| **Terre et environnement** | | | |
| Sciences de la Terre | Mahogany | `#8E595A` | 4,9:1 |
| Climat et météorologie | Mint | `#82D8D5` | 1,4:1 ⚠ |
| Océanographie | Cornflower | `#62A8E5` | 2,2:1 ⚠ |
| Paléontologie | Flat Gold | `#BB8B41` | 2,7:1 ⚠ |
| **Sciences humaines** | | | |
| Philosophie | Federal Blue | `#3D5588` | 6,4:1 |
| Psychologie | Purple | `#765BA7` | 4,6:1 |
| Sociologie | Burgundy | `#914E72` | 5,2:1 |
| Anthropologie | Orange | `#FF6C2F` | 2,4:1 ⚠ |
| Linguistique | Bright Red | `#F15060` | 3,0:1 ⚠ |
| Archéologie | Sunflower | `#FFB511` | 1,5:1 ⚠ |
| Géographie | Pine | `#237E74` | 4,2:1 ⚠ |
| Histoire | Brick | `#A75154` | 4,6:1 |
| Économie | Bright Olive Green | `#B49F29` | 2,3:1 ⚠ |
| Sciences politiques | Steel | `#375E77` | 6,0:1 |
| Religions et mythologies | Plum | `#845991` | 4,8:1 |
| **Droit et justice** | | | |
| Institutions judiciaires | Midnight | `#435060` | 7,2:1 |
| Preuve et erreur judiciaire | Slate | `#5E695E` | 5,0:1 |
| Droit international | Sea Blue | `#0074A2` | 4,6:1 |
| Propriété intellectuelle et IA | Raisin | `#775D7A` | 5,0:1 |
| Droit constitutionnel | Medium Blue | `#3255A4` | 6,2:1 |
| Droit social | Lagoon | `#2F6165` | 6,1:1 |
| Conformité | Hunter Green | `#407060` | 4,9:1 |
| **Arts et lettres** | | | |
| Littérature | Fluorescent Pink | `#FF48B0` | 2,9:1 ⚠ |
| Histoire de l'art | Orchid | `#AA60BF` | 3,6:1 ⚠ |
| Musique | Turquoise | `#00AA93` | 2,5:1 ⚠ |
| Cinéma | Copper | `#BD6439` | 3,6:1 ⚠ |
| Architecture | Granite | `#A5AAA8` | 2,1:1 ⚠ |

**« Société » a cédé la place à « Droit et justice ».** Le droit avait d'abord été posé
comme une discipline unique, au niveau d'Histoire ou d'Économie. C'était le mauvais grain :
un lecteur veut cocher la preuve judiciaire sans prendre la propriété intellectuelle,
comme il coche Génétique sans prendre toute la Biologie. Histoire, Économie, Sciences
politiques et Religions ont rejoint les sciences humaines, où elles sont chez elles.

**Et c'est là que le nuancier a atteint sa limite.** Sept encres de plus à pleine distance
n'existent pas : au seuil de 15 appliqué partout ailleurs, seules **quatre** places
restaient libres. Les sept retenues tiennent **13,5 d'écart Lab entre elles** et **10,1
avec les trente-deux autres**.

C'est un écart assumé, et il faut dire ce qu'il coûte : 10, c'est le niveau auquel Midnight
avait été écarté quelques heures plus tôt pour le droit pris en bloc. Deux tensions
subsistent, Institutions judiciaires à 10,1 de Sciences politiques et Conformité à 10,9 de
Géographie — deux disciplines d'une autre famille, ce qui limite la co-sélection sans
l'exclure. Ce qui rend l'écart supportable est la règle de §2.2 : **la couleur ne porte
jamais seule l'information**, la discipline est toujours écrite à côté de l'aplat.

Le chemin jusque-là mérite d'être consigné, parce qu'il s'est trompé deux fois. Le droit
portait Indigo `#484D7A`, à **6,6 de Federal Blue** (Philosophie) : la paire la plus
proche de toute la charte. Slate `#5E695E` tenait les distances mais ne disait rien de la
discipline. Medium Blue a tranché les deux, et il est resté — sur Droit constitutionnel,
là où le bleu institutionnel dit le plus.

Deux critères ont tranché, dans cet ordre. D'abord **l'écart aux disciplines qu'un lecteur
cochera en même temps**, seule lecture de « se distinguer » qui corresponde à ce qu'on voit
à l'écran. Ensuite, **parmi les encres qui passent ce test, celle dont le registre
correspond à la discipline**. L'ordre compte : une encre juste de registre mais indistincte
ne sert à rien, alors qu'une encre distincte mais muette reste utilisable. Le symbole ne
peut être qu'un départage.

Les couleurs de la justice sont d'ailleurs exactement les régions saturées du nuancier :
le rouge de la robe est pris quatre fois par le vivant, l'or de la balance deux fois, le
bleu grave deux fois. C'est ce qui a rendu la recherche coûteuse.

**Les hex Riso ne sont normalisés nulle part.** Le même Bright Red vaut `#F15060`
chez un studio et `#CC231F` chez un autre — ce ne sont pas des arrondis, ce sont
deux jeux de valeurs distincts. Toutes celles ci-dessus viennent d'une seule
famille, celle du nuancier stencil.wiki / Outlet PDX. Ne jamais y panacher une
valeur venue d'ailleurs : les encres jureraient entre elles.

Correction : l'encre de Médecine était donnée pour « Bright Red ». `#FF665E` est
en réalité l'encre **Red** ; Bright Red est `#F15060`, aujourd'hui attribuée à
Linguistique. La couleur n'a pas changé, le nom était faux.

**L'écart de teinte n'est plus un critère.** Il figurait ici, mais les neuf encres
d'origine étaient déjà à 1,9° d'écart minimum entre elles — il n'a jamais été tenu.
Ce qui compte est qu'elles se distinguent **à l'intérieur de la sélection d'un
lecteur** : il en coche trois à six, jamais trente-trois. Et la discipline est
toujours aussi écrite.

Plus aucune discipline n'attend son encre. Ce qui décide désormais de l'ouverture d'une
discipline est donc **le stock seul** — le client exige toujours les deux, mais l'une des
deux conditions est acquise partout.

⚠ = sous 4,5:1. Ces encres n'apparaissent qu'en aplat, filet ou libellé de
15 px et plus en graisse forte. **Jamais en texte courant, jamais en corps de
fiche.** La couleur ne porte jamais seule l'information : la discipline est
toujours aussi écrite.

Variante claire pour le mode sombre : l'encre est remontée en clarté
(ex. Philosophie `#3D5588` → `#5C7CBF`) et le mélange passe de `multiply` à
`screen` — sur fond sombre la surimpression s'inverse mécaniquement.

### 2.3 Nombre d'encres par surface

- Écran de lecture : papier + noire + encre de discipline. **Deux encres.**
- Carte partageable : papier + noire + encre de discipline + jaune. **Trois encres.**

Jamais plus de trois. C'est cette contrainte qui produit la cohérence sur
l'ensemble de la base.

**Exception, tranchée le 2026-08-27 (`decisions.md`) : le quiz.** La bonne
réponse et la réponse fausse choisie y ajoutent un vert et un rouge
universels, hors nuancier de discipline — papier + noire + encre de
discipline + vert/rouge de correction. La règle « une seule encre en plus du
noir dit le sens » ne tenait plus : l'aplat de correction empruntait jusque-là
l'encre de la discipline, vert pour une fiche de Biologie mais tout aussi bien
rouge pour Médecine ou orange pour Anthropologie — un signal qui se lisait
alors à l'envers. Le vert/rouge du quiz est fixe (`Signal` dans
`Charte/Couleurs.swift`), pas dérivé du nuancier des trente-neuf disciplines,
et ne s'applique qu'à cet écran.

### 2.4 Surimpressions documentées

Mode `multiply`, encre à 88 %.

| Croisement | Résultat |
|---|---|
| Federal Blue × Jaune | `#3D4D00` |
| Orange × Jaune | `#FF6200` |
| Blue × Fluorescent Pink | `#002284` |
| Green × Jaune | `#009A00` |
| Burgundy × Jaune | `#914700` |
| Encre sur papier à 88 % (Federal Blue) | `#3A5078` |

**Exception :** le jaune de marque ne passe pas en `multiply` par-dessus un aplat
d'encre — il composite alors en vert sombre et disparaît. Sur un aplat, il
s'imprime en encre opaque (`mix-blend-mode: normal`, opacité 95 %).

---

## 3. Surimpression, repérage, grain

Trois paramètres constants, jamais aléatoires.

| Paramètre | Valeur | Règle |
|---|---|---|
| Opacité d'encre | 88 % (plage 85–92) | Mode `multiply` en clair, `screen` en sombre. |
| Hors-repérage | +2 px en x, +3 px en y pour 1080 px de large (0,2–0,4 %) | Direction **constante** dans une composition. Porté par l'encre de discipline uniquement, jamais par le noir. |
| Grain | 3–5 % d'opacité, retenu à 4,5 % (7 % en sombre) | Bruit fin `fractalNoise`, `baseFrequency 0.85`, appliqué **une seule fois sur la composition entière**, en `multiply` (`screen` en sombre). |

Le hors-repérage n'est pas une ombre portée : il décale l'encre, il ne
l'assombrit pas. Un grain par calque produit un rendu sale, pas imprimé.

---

## 4. Typographie

Polices auto-hébergeables, licence permettant l'intégration (l'app ne fait
aucun appel réseau).

| Rôle | Police | Graisses | Usage |
|---|---|---|---|
| Nav | **Martian Mono** 400/600, 9 px | — | Libellés d'onglets de la barre de menu |
| Display | **Bricolage Grotesque** | 700–800 | Accroches de carte 76–118 px @1080 · titres de fiche 29–52 px · libellés de bouton 15–17 px |
| Corps | **Newsreader** | 400, 400 italique | Texte de fiche 16,5 px · citations 18–20 px italique |
| Crédits & données | **Martian Mono** | 400–600 | `source_courte`, dates, séries, libellés 9–11 px écran / 21–30 px @1080 |

Alternative display évaluée puis écartée : **Archivo** en largeur étendue
(`font-stretch: 112–118%`) — plus large et plus froid, moins de caractère
imprimé. Conservée comme option dans les maquettes (repère 1d).

À éviter : les grotesques neutres de la tech (Inter, Space Grotesk et
apparentées), qui annuleraient le caractère de la direction.

### Échelle appliquée

| Élément | Corps | Interlignage | Interlettrage |
|---|---|---|---|
| Punch de carte (long) | 76 px @1080 | 0,96 | −0,025 em |
| Punch de carte (médian) | 88–94 px @1080 | 0,94–0,95 | −0,025 em |
| Punch de carte (court) | 118 px @1080 | 0,92 | −0,03 em |
| Idée de carte | 37–48 px @1080 | 1,40–1,45 | — |
| Crédit de carte | 25–27 px @1080 | — | 0,04 em |
| Titre de fiche | 37–44 px | 0,94–0,96 | −0,025 em |
| Intertitre de fiche | 19 px, 700 | 1,15 | −0,01 em |
| Corps de fiche | 16,5 px | 1,62 | — |
| Libellé mono | 9–11 px | 1,7–1,9 | 0,10–0,14 em |

Longueur de ligne du corps : 38 à 45 caractères. Interlignage minimum 1,6.
Corps minimum du crédit sur la carte : 11 px à l'échelle 1080.

---

## 5. Espacement et formes

Base **4**. Valeurs utilisées : 4, 8, 12, 16, 24, 32, 48, 64, 96.

- Marge d'écran : 20–22
- Gouttière de liste : 12
- Bloc à bloc : 24–32
- Section à section : 48

**Rayon : 0 partout.** Seule exception admise : 2 px sur une cible tactile
pleine. Pas d'arrondi uniforme.

Cibles tactiles : jamais sous 44 px de haut.

---

## 6. Interdits

Liste de contrôle avant toute livraison. Chacun est un marqueur de rendu
généré, et sa présence annule la raison d'être de la direction.

- Dégradés — en particulier violet vers bleu. Aucun, nulle part.
- Formes organiques molles, taches, blobs flous.
- Lueurs, ombres portées douces, effets de verre.
- Compositions systématiquement centrées et symétriques.
- Emoji comme marqueurs de section.
- Coins arrondis appliqués uniformément.
- Hors-repérage aléatoire ou exagéré.
- Grain appliqué calque par calque.
- Scrim ou ombre ajoutés pour rattraper un défaut de contraste — c'est la
  composition qu'on corrige, pas le symptôme.

### Exception validée

**Liquid Glass sur la barre de menu du bas, et là seulement.** Fond translucide,
`backdrop-filter: blur(20px) saturate(185%)`, liseré interne clair. Proposé en
option à côté de l'aplat riso opaque (voir `docs/ecrans.md` §2). L'exception ne
s'étend à aucune autre surface : ni carte, ni encadré, ni barre de titre.

---

## 7. Accessibilité

- Texte courant : viser 7:1. `#1B1A17` sur `#F4EFE1` dépasse largement.
- L'encre de discipline ne sert jamais au texte courant.
- Texte en papier sur aplat d'encre : autorisé à partir de 24 px en graisse
  forte (grand texte, seuil 3:1). Vérifier au cas par cas ; `#F4EFE1` sur
  `#0078BF` donne 4,3:1, sur `#FFE800` donne 1,1:1 — **jamais**.
- La couleur ne porte jamais seule une information.
- `prefers-reduced-motion` respecté sur toute animation.
