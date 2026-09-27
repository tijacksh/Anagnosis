# Direction artistique — dossier pour Claude Design

> **Statut : livrée et arrêtée (30 juillet 2026).** Ce document reste la pièce
> d'intention — il dit *pourquoi* la direction est ce qu'elle est. Les **valeurs**
> font désormais foi dans les trois documents livrés par Claude Design :
>
> - `docs/charte-visuelle.md` — couleur, surimpression, grain, typographie, espacement
> - `docs/systeme-illustration.md` — grille, six opérations, structure du champ illustration
> - `docs/ecrans.md` — carte partageable, lecture, notification, onboarding, quiz, profil, verrou
>
> **En cas de divergence : ce document tranche sur l'intention, la charte sur les
> valeurs.** Les maquettes de référence sont dans
> `design/claude-design/livraison-anagnosis/maquettes/` (repères 1a à 1j).
>
> À lire avec `docs/brief-produit.md` (§10 illustrations, §11 exigence de rendu) et
> `docs/ligne-editoriale.md` (§8 carte partageable, §9 direction visuelle).

---

## 1. Le mandat

Concevoir l'identité visuelle d'Anagnosis : un concept par jour, expliqué en 2-3
minutes, sourcé, et **partageable en story**. Le partage est le moteur de croissance
(`docs/decisions.md`) — la carte partageable est donc le premier livrable, pas un
sous-produit de l'écran de lecture.

Trois surfaces à traiter, par ordre de priorité :

1. **La carte partageable** (1080 × 1920) — le premier contact avec le produit, et
   souvent le seul. C'est elle qui doit arrêter le pouce.
2. **L'écran de lecture** — deux à trois minutes par jour, tous les jours. Ce qui
   claque en vignette peut épuiser à la lecture.
3. **Le système d'illustration** — plusieurs centaines de pièces à produire, qui
   doivent se ressembler sans se confondre.

## 2. Le principe fondateur

**La crédibilité est portée par la source affichée, pas par une palette austère.**

C'est la décision structurante, et elle libère tout le reste. Le gris et le serif ne
prouvent rien ; « Arendt, 1963 » en bas d'un visuel, si. Une fois le crédit source
rendu systématique et visible, le visuel est libre d'être franchement coloré, chaud
et ludique sans rien concéder sur le sérieux.

Corollaire opérationnel : **`carte.source_courte` n'est jamais absente, jamais
tronquée, jamais reléguée.** Si un arbitrage de mise en page oppose le crédit à autre
chose, le crédit gagne.

## 3. Pourquoi la risographie

Le brief pose une exigence non négociable (§11) : le rendu ne doit **jamais** être
identifiable comme généré par IA. Or le registre coloré est précisément celui où
cette exigence est la plus difficile à tenir — dégradés violet-bleu, formes molles,
compositions centrées sont la signature par défaut des générateurs.

La risographie résout le problème par construction plutôt que par vigilance :

- la **surimpression** de deux encres opaques produit des mélanges que le dégradé ne
  reproduit pas ;
- le **hors-repérage** (léger décalage entre passages d'encre) est un accident
  mécanique d'imprimerie, pas un effet ;
- le **grain** du papier absorbant casse les aplats parfaits.

Là où une direction concurrente doit *éviter* de ressembler à une image générée,
celle-ci ne peut pas y ressembler. C'est la raison du choix, et elle doit rester
lisible dans l'exécution : si le rendu final perd la surimpression et le grain, on
perd l'argument.

## 4. Système de couleur

### 4.1 Constantes

| Rôle | Valeur | Usage |
|---|---|---|
| Papier | `#F4EFE1` | Fond de toutes les surfaces. Ne change jamais. |
| Encre noire | `#1B1A17` | Texte courant, structure, filets. |
| Jaune commun | `#FFE800` | Troisième encre, **carte partageable uniquement**. |

Le jaune n'apparaît que sur les cartes partagées : c'est la signature de marque que
l'on doit reconnaître dans un fil, quelle que soit la discipline.

### 4.2 Une encre par discipline

Chaque discipline reçoit **une** encre. Le papier et l'encre noire ne bougent pas.
C'est ce qui permet au système de tenir sur neuf disciplines et trois cents fiches
sans se déliter — et de reconnaître la discipline avant de l'avoir lue.

Valeurs de départ, alignées sur des encres Riso réelles (à ajuster après épreuves) :

| Discipline | Encre | Hex |
|---|---|---|
| Philosophie | Federal Blue | `#3D5588` |
| Sociologie | Burgundy | `#914E72` |
| Anthropologie | Orange | `#FF6C2F` |
| Psychologie | Purple | `#765BA7` |
| Biologie | Green | `#00A95C` |
| Médecine / Santé | Bright Red | `#FF665E` |
| Mathématiques | Teal | `#00838A` |
| Physique | Blue | `#0078BF` |
| Littérature | Fluorescent Pink | `#FF48B0` |

Extensions prévues au modèle mais non lancées (Histoire, Économie, Histoire de l'art,
Astronomie) : encres à attribuer, en gardant un écart de teinte suffisant avec les
neuf ci-dessus.

### 4.3 Nombre d'encres par surface

- **Écran de lecture** : papier + noire + encre de discipline. Deux encres.
- **Carte partageable** : papier + noire + encre de discipline + jaune. Trois encres.

Ne pas dépasser trois encres. La contrainte n'est pas décorative : c'est elle qui
produit la cohérence sur l'ensemble de la base.

## 5. Surimpression, repérage, grain

Ce sont les trois paramètres qui font la différence entre une direction risographie
et un filtre. Ils doivent être spécifiés et **constants**, jamais aléatoires.

- **Surimpression** — mode `multiply`, opacité d'encre 85-92 %. Deux encres qui se
  croisent produisent une troisième couleur, qui doit être documentée dans la charte
  plutôt que subie.
- **Hors-repérage** — décalage de 2 à 4 px pour une largeur de 1080 px, soit 0,2 à
  0,4 %. **Direction constante à l'intérieur d'une composition** (par exemple toujours
  +2 px en x, +3 px en y pour l'encre de discipline). Un décalage aléatoire par
  élément trahit l'effet appliqué après coup.
- **Grain** — bruit fin, 3 à 5 % d'opacité, appliqué **sur la composition entière**,
  jamais couche par couche. Un grain par calque produit un rendu sale, pas imprimé.

Piège à éviter : le hors-repérage n'est pas une ombre portée. Il décale l'encre, il
ne l'assombrit pas.

## 6. Typographie

Trois rôles. Les polices doivent être auto-hébergeables (l'app ne fait aucun appel
réseau — brief §9) et disponibles en licence permettant l'intégration.

**Display** — titres de fiches et accroche des cartes.
Critères : grotesque à forte présence, graisses lourdes disponibles, formes un peu
datées plutôt que neutres, bon comportement en très grand corps et en capitales.
Pistes : Bricolage Grotesque, Archivo (largeurs étendues), Redaction — cette dernière
étant conçue avec des niveaux de dégradation, ce qui dialogue directement avec le
registre imprimé.
À éviter : les grotesques neutres de la tech (Inter, Space Grotesk et apparentées),
qui annuleraient tout le caractère de la direction.

**Corps** — texte de la fiche, 400 à 700 mots lus chaque jour.
Critères : serif de lecture, hauteur d'x généreuse, excellente tenue à 15-17 px sur
écran, italique de qualité (le corps des fiches en contient).
Pistes : Newsreader, Literata, Source Serif 4.

**Crédits et données** — `source_courte`, numérotation, libellés.
Critères : monospace, lisible à 9-11 px, chiffres tabulaires.
Pistes : Martian Mono, JetBrains Mono, Space Mono.

Le contraste serif / grotesque n'est pas décoratif : c'est le contraste de l'imprimé,
où titraille et labeur ne sont pas de la même famille.

## 7. La carte partageable — anatomie

Format 1080 × 1920. Une variante carrée 1080 × 1080 pour le feed sera nécessaire,
avec la même hiérarchie.

Zonage indicatif, de haut en bas :

1. **Zone d'encre** (0-35 %) — la composition graphique surimprimée. Elle peut
   déborder derrière le texte.
2. **Punch** (35-55 %) — `carte.punch`, display lourd, 100 caractères maximum.
   C'est l'élément qui doit être lisible à la taille d'une vignette de fil.
3. **Idée** (55-78 %) — `carte.idee`, serif, 90 à 300 caractères. Doit tenir debout
   seule : quelqu'un qui ne télécharge rien doit avoir appris quelque chose.
4. **Crédit** (78-90 %) — `carte.source_courte`, monospace sur aplat d'encre.
   Toujours présent, toujours lisible.
5. **Marque** (90-100 %) — nom de l'app, discret.

Réserves à respecter : les interfaces de story superposent leurs propres éléments en
haut et en bas. Prévoir **au moins 14 % de marge haute et 12 % de marge basse** sans
information critique.

**Contrainte de production** : la carte est générée à partir de textes de longueurs
variables (punch de 45 à 100 caractères, idée de 90 à 300). La maquette doit tenir
aux deux extrêmes, pas seulement sur un exemple choisi. Fournir les deux cas limites
dans les livrables.

## 8. L'écran de lecture

Deux à trois minutes par jour, en transport, souvent d'une main. Priorités :

- longueur de ligne 38 à 45 caractères en mobile ;
- interlignage généreux (1,6 minimum sur le corps) ;
- les intertitres de la fiche (`## `) structurent la lecture — ils doivent être
  nettement distincts du corps sans hurler ;
- l'encadré `citation` **et** l'encadré `repere` occupent le même emplacement et
  doivent recevoir un traitement cohérent : ce sont deux réponses au même besoin
  éditorial (`docs/ligne-editoriale.md` §4) ;
- le bouton de partage n'est pas une icône discrète en coin. C'est une action de
  premier plan, présente en fin de lecture, au moment où le lecteur vient
  d'apprendre quelque chose et a le plus envie de le transmettre.

Le mode sombre est à traiter — mais le papier `#F4EFE1` est l'identité. Une inversion
naïve la détruirait. Piste : conserver l'encre de discipline et le grain, remplacer
le papier par un noir chaud plutôt que neutre.

## 9. Illustrations

Chaque fiche porte un `illustration.prompt` dans le dépôt. Les prompts existants sont
des points de départ rédigés avant l'arbitrage de direction — à reprendre en bloc.
Deux lots coexistent aujourd'hui : les 8 fiches Doppler ont des prompts écrits dans
une direction sobre abandonnée, les 12 fiches de philosophie dans le registre coloré.

Règles de production, quelle que soit la technique retenue :

- **conceptuelle, jamais décorative** — la forme dit quelque chose du concept ;
- **aucun texte ni chiffre dans l'image** — illisible en vignette, et piège classique
  des générateurs ;
- **aucun visage humain identifiable** ;
- formes géométriques nettes, aplats pleins, pas de rendu photoréaliste ;
- l'illustration utilise l'encre de la discipline, pas une palette libre.

## 10. Accessibilité

- Contraste texte courant : viser 7:1. `#1B1A17` sur `#F4EFE1` dépasse largement.
- **L'encre de discipline ne sert jamais au texte courant.** Elle habille des
  surfaces et des libellés courts. Toute utilisation en texte exige un contraste
  vérifié ≥ 4,5:1 — plusieurs encres du tableau §4.2 échouent sur papier clair.
- Corps minimum sur la carte partageable : le crédit ne descend pas sous 11 px à
  l'échelle 1080.
- La couleur ne porte jamais seule une information : la discipline est aussi écrite.
- Prévoir le respect de `prefers-reduced-motion` sur toute animation.

## 11. Interdits

Liste de contrôle avant toute livraison. Chacun de ces éléments est un marqueur de
rendu généré, et leur présence annule la raison d'être de la direction retenue.

- Dégradés — en particulier violet vers bleu. **Aucun**, nulle part.
- Formes organiques molles, taches, « blobs » flous.
- Lueurs, ombres portées douces, effets de verre.
- Compositions systématiquement centrées et symétriques.
- Emoji utilisés comme marqueurs de section.
- Coins arrondis appliqués uniformément à tout.
- Hors-repérage aléatoire ou exagéré — il doit rester discret et régulier.
- Grain appliqué calque par calque.

## 12. Livrables attendus

1. Charte : palette complète (constantes + neuf encres + couleurs de surimpression
   documentées), échelle typographique, échelle d'espacement, spécifications de
   grain et de repérage.
2. Carte partageable : maquette 1080 × 1920 pour **trois disciplines différentes**,
   plus les **deux cas limites** de longueur de texte. Variante carrée.
3. Écran de lecture : maquette mobile en clair et en sombre, avec un texte réel de
   la base (les 20 fiches validées sont dans `content/concepts/`).
4. Système d'illustration : principe, grille, et cinq pièces d'exemple sur cinq
   disciplines.
5. Un exemple de fiche complète de bout en bout : notification, écran de lecture,
   quiz, carte partagée.

Le contenu de test doit venir du dépôt, pas de faux texte. Les fiches validées sont
exportables via `npm run export`.

## 13. Ce qui a été tranché à la livraison

- **Qui fabrique l'image de la carte ?** → **L'app, sur l'appareil.** C'est ce qui
  permet d'y porter la série ou le pseudo du lecteur. Conséquence à assumer : le
  rendu appartient au client et doit rester identique d'une version d'iOS à l'autre.
  Deux réglages seulement — format 9:16 ou 1:1, et série ou pseudo.
- **Le mode sombre** conserve grain et surimpression : papier remplacé par le noir
  chaud `#241F1A`, encre remontée en clarté, mélange passé en `screen`, grain à 7 %.
- **Liquid Glass sur la barre d'onglets** → **préférence utilisateur**, à côté de
  l'aplat riso. Ce n'est pas une exception subie mais un choix offert au lecteur.
  Le verre ne remonte sur aucune autre surface.

## 14. Ce qui reste ouvert

- **Le logotype.** Le nom est arrêté — *Anagnosis* — mais son traitement
  typographique reste à dessiner. Il doit tenir en très petit sur la carte
  partagée (bas de visuel, ~10 px à l'échelle 1080) comme en grand à l'ouverture
  de l'app. Le mot est long : c'est la contrainte principale.
- **Les encres des quatre disciplines d'extension**, à attribuer quand elles seront
  activées.
- **Les six encres sous 4,5:1 de contraste** (charte §2.2). Cantonnées aux aplats et
  aux libellés de 15 px en graisse forte. À assombrir si l'on veut un jour pouvoir
  les employer en libellé fin.
- **Les prix.** 3,49 €/mois et 29 €/an figuraient dans les maquettes du paywall à titre
  d'espace réservé. Tranchés le 2026-09-27 : 3,49 €/mois et **24,99 €/an**
  (`docs/decisions.md`).
