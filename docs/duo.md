# Anagnosis sur l'iPhone Duo

État au 2026-10-19. App iOS, branche `duo` du dépôt de l'app, puis `main`.

## L'appareil

Deux écrans de même rapport d'aspect (environ 1,42), d'après les pages développeur d'Apple relayées par la presse spécialisée ; les dimensions en points ne sont pas publiées par Apple, ce sont celles que l'app mesure en vrai dans le simulateur :

| Écran | Dimensions mesurées | Classes de taille |
|---|---|---|
| Extérieur (replié), portrait | environ 382 × 644 pt (zone sûre) | compacte × régulière |
| Extérieur, paysage | environ 644 × 382 pt | compacte × compacte |
| Intérieur (déplié), portrait | 669 × 951 pt (835 de zone sûre) | régulière × régulière |
| Intérieur, paysage | 951 × 669 pt (867 de zone sûre) | régulière × régulière |

L'écran intérieur ignore les orientations déclarées : **on décide la mise en page par la taille de la fenêtre**, jamais par l'idiome ni l'orientation (`MiseEnPage.disposition`).

Les postures du simulateur (Device Hub, Xcode 27.1) : **Closed** (replié), **Book** (mi-plié), **Open** (déplié à plat), chacune en portrait ou en paysage. Le portrait inversé n'est pas pris en charge (décision d'Arnaud).

**Orientations (décision d'Arnaud, 2026-10-19).** Portrait **figé** sur les petits écrans : tous les iPhone et l'écran extérieur du Duo replié (couché, il n'offre que 382 pt de hauteur et le paysage coupait des écrans entiers). Portrait et les deux paysages sur l'écran intérieur seulement (petit côté d'au moins 560 pt). C'est `DelegueApp` (`AnagnosisApp.swift`) qui tranche selon l'écran de la fenêtre, et `MiseEnPage` redemande les orientations au système à chaque pliage ou dépliage.

## Les modes d'utilisation couverts

| Mode | Ce que fait l'app |
|---|---|
| Replié, portrait | iPhone classique : une colonne, barre d'onglets en bas |
| Replié, paysage | **supprimé** : portrait figé sur l'écran extérieur |
| Déplié, portrait | une colonne de lecture centrée (640 pt), barre en bas |
| Déplié, paysage | barre en colonne, lecture en **deux volets** (texte à gauche, repère, note, sources et actions à droite) |
| Mi-plié, « livre » (pliure verticale, paysage) | les deux volets s'alignent sur les deux pages : la coupe tombe au milieu de la charnière, rien ne passe dessous |
| Mi-plié, « ordinateur » (pliure horizontale, portrait) | texte en haut, accompagnement en bas ; la barre d'onglets se range dans la moitié basse |
| Calendrier, archive | liste à gauche, **fiche à droite** (au lieu de la recouvrir) ; profil de même quand une fiche est ouverte |
| Quiz, réglages, abonnement, rappel, récap, relevé, planche, onboarding | colonne centrée à largeur lisible |

## Comment c'est fait

- `App/MiseEnPage.swift` : la fenêtre est mesurée une fois, en haut de l'app (`onGeometryChange`), et publiée dans l'environnement (`\.miseEnPage`) : taille et plis. Les plis viennent de `GeometryProxy.reservedRegions(kind: .division)` (iOS 27.1 ; l'app cible iOS 18, d'où `#available`). **Les cadres des régions sont donnés dans le repère de la zone sûre du proxy** : on les ramène en coordonnées globales avant de les comparer.
- `Disposition` : `.compacte` (téléphone portrait), `.basse` (hauteur sous 520 pt : paysage), `.vaste` (écran intérieur : 560 pt au moins sur le petit côté).
- `BarreOnglets(axe: .vertical)` : la colonne de gauche, sans onglet sous un pli horizontal.
- `DeuxVolets` et `DansUnVolet` : deux volets qui évitent le pli ; chaque volet se re-mesure pour ce qu'il contient, sinon une fiche posée dans une moitié d'écran se croirait encore sur l'écran entier.
- `colonneLisible()` : colonne centrée de 640 pt maximum, appliquée au contenu défilant de chaque écran.
- `Info.plist` : portrait et paysage (pas de portrait inversé).

## À savoir

- Le Duo se vérifie dans **Device Hub** (Xcode 27.1) : un simulateur « iPhone Duo » reste noir en capture `simctl` tant qu'il n'est pas affiché dans Device Hub. Postures et rotations se pilotent depuis sa barre du bas (Closed, Book, Open, Rotate).
- Les anciens simulateurs de l'app ont disparu avec la réinstallation des runtimes ; on travaille sur « Jarv Duo 2 » (Duo) et « Riposte iPhone 18 Pro » (iPhone).
- Touch ID plutôt que Face ID sur le Duo : l'app n'utilise pas la biométrie, rien à changer.

## Livraison

Build 52 envoyée à TestFlight le 2026-10-19 (branche `duo` fusionnée dans `main` de l'app, 248 tests verts sur « Jarv Duo 2 »). Barre d'onglets nettoyée dans la foulée : fond plein sous le verre, onglets écartés des coins arrondis, indicateur actif rentré dans la barre, fond jusqu'aux deux bords de l'écran.

## Reste à faire

- Calendrier et archive : un volet de détail vide affiche « Choisissez une fiche » ; une fiche par défaut serait plus généreuse.
- Quiz en deux colonnes sur l'écran intérieur, carte partageable à vérifier dans tous les postures.
- Les vidéos et cartes des réseaux n'ont pas de variante Duo.
