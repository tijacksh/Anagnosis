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

La taxonomie compte **trente-trois disciplines**, groupées en six familles. Vingt-trois
ont une encre attribuée ; une discipline sans encre n'est pas offerte par le client.

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
| Géographie | — | — | encre à attribuer |
| **Société** | | | |
| Histoire · Économie · Droit · Sciences politiques · Religions et mythologies | — | — | encres à attribuer |
| **Arts et lettres** | | | |
| Littérature | Fluorescent Pink | `#FF48B0` | 2,9:1 ⚠ |
| Histoire de l'art · Musique · Cinéma · Architecture | — | — | encres à attribuer |

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

Dix disciplines attendent leur encre. Elles ne sont pas offertes tant que c'est le
cas — le client exige du stock **et** une encre pour proposer une discipline.

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
