# Passation — client iOS

Document destiné à la session Claude Code qui tournera **en local sur le Mac**, dans
le dépôt de l'app. Il dit ce qu'il y a à construire, ce qui est déjà tranché, et ce
qu'il ne faut pas refaire.

À lire avec, dans ce dépôt-ci :

- `docs/charte-visuelle.md` — les valeurs : couleur, surimpression, grain, typographie
- `docs/ecrans.md` — le comportement de chaque écran
- `docs/systeme-illustration.md` — la grille et les six opérations
- `docs/brief-produit.md` — le produit et le modèle économique
- `docs/decisions.md` — tout ce qui a été tranché depuis le brief

---

## 1. Deux dépôts, deux rôles

| Dépôt | Rôle | Où il tourne |
|---|---|---|
| **Anagnosis** (celui-ci) | pipeline de contenu, validation, export | à distance, très bien |
| **dépôt de l'app** (à créer) | client iOS SwiftUI | **en local sur le Mac** |

Le client iOS ne génère pas de contenu et n'appelle aucune API. Il lit un fichier
embarqué à la compilation.

## 2. Le contrat de contenu

`npm run export` produit `export/concepts.json` dans ce dépôt. C'est le seul point
de contact entre les deux projets : on copie ce fichier dans le bundle de l'app.

État actuel : **32 concepts validés**, 212 Ko, 5 disciplines. À 300 fiches on sera
autour de 2 Mo — négligeable pour un bundle iOS, donc pas de base de données à
embarquer.

Structure d'un concept :

```
id, slug, titre, accroche
discipline            clé courte : philosophie, psychologie, physique, biologie, medecine
niveau                introductif | intermediaire
duree_lecture_min
contenu_vulgarise     markdown volontairement minimal : "## titre", **gras**, *italique*
citation              { texte, auteur, source, url } — ou null
repere                { texte, source } — ou null
                      l'un des deux est toujours présent, jamais les deux à null
carte                 { punch, idee, source_courte } — la carte partageable
sources               [ { type, auteur, titre, publication, annee, url, note } ]
pour_aller_plus_loin  [ { titre, url, note } ]
illustration          { prompt, alt, url, statut }
quiz                  { question, choix[], bonne_reponse, explication }
```

Le sous-ensemble markdown est **délibérément petit** : `## ` en début de bloc, `**gras**`,
`*italique*`, paragraphes séparés par une ligne vide. Ne pas embarquer de moteur
markdown, un parseur de trente lignes suffit.

`annee` peut être **négative** pour les sources antiques : `-375` = 375 av. J.-C.

## 3. Ce qui est déjà tranché

Ne pas rouvrir ces questions, elles ont coûté des allers-retours.

- **Aucun appel réseau, jamais** (brief §9). Ni pour le contenu, ni pour les polices,
  ni pour la moindre statistique. Les polices sont embarquées dans le bundle.
- **Un seul concept par jour**, verrou strict. C'est le différenciateur produit, pas
  une limite technique — l'écran de verrou le met en scène (`ecrans.md` §8).
- **La carte partageable est composée sur l'appareil**, ce qui permet d'y porter la
  série ou le pseudo. `ImageRenderer` sur une vue SwiftUI, puis `ShareLink`.
- **`carte.source_courte` n'est jamais absente, jamais tronquée, jamais reléguée.**
  Si un arbitrage de mise en page l'oppose à autre chose, le crédit gagne.
- **Cinq onglets** : Aujourd'hui, Calendrier, Archive, Profil, Réglages.
- **Barre de menu à deux matériaux**, au choix de l'utilisateur : aplat riso opaque,
  ou Liquid Glass (`.ultraThinMaterial`). Le verre ne remonte sur aucune autre surface.
- **Rayon 0 partout**, base d'espacement 4, cibles tactiles jamais sous 44 pt.
- **Le paywall ne vend jamais du volume quotidien** — seulement le droit de relire.

## 4. Deux points techniques qui simplifient beaucoup

**Les notifications n'ont pas besoin de serveur.** Le brief parle de « push », mais le
concept du jour tombe à une heure choisie par l'utilisateur, sur un contenu déjà
embarqué : une **notification locale** planifiée avec `UNUserNotificationCenter`
suffit. Zéro backend, zéro certificat APNs, fonctionne hors ligne. Le texte de la
notification est l'`accroche` de la fiche, telle quelle (`ecrans.md` §4).

**La synchronisation iCloud n'a pas besoin de CloudKit.** L'état à synchroniser est
minuscule — disciplines actives, heure, date de début, journal des jours lus, quiz
répondus. `NSUbiquitousKeyValueStore` fait exactement ça : clé-valeur, synchronisé par
iCloud, 1 Mo de quota, aucun schéma à déclarer, aucune migration. Passer à CloudKit
seulement si l'état dépasse ce cadre.

C'est aussi **toute la réponse à la conservation de l'historique** : suppression de
l'app et changement d'iPhone sont couverts par l'Apple ID, sans compte, sans backend,
sans inscription (`decisions.md`, 2026-07-31). Une année de lecture quotidienne pèse
29 Ko — mesuré sur les identifiants réels du pipeline — contre 1 Mo de quota. Il n'y
a pas de dimensionnement à prévoir.

Les clés à synchroniser sont celles de l'esquisse (`app/app.js`, objet `DEFAUT`) :
`onboarde`, `disciplines`, `heure`, `debut`, `pseudo`, `premium`, `journal`,
`record`. `theme` et `materiau` sont des préférences d'affichage : les
synchroniser ou non est sans conséquence.

**La fusion tient en trois règles**, et il faut les tenir : deux appareils écrivent,
iCloud ne tranche pas à votre place.

- `journal` fusionne par **union sur la date**. Les entrées sont idempotentes
  (`'AAAA-MM-JJ' -> { id, quiz }`) ; en cas de collision sur un même jour, garder
  celle qui porte une réponse de quiz.
- `record` fusionne par **maximum**. `debut` par **minimum**.
- **Rien de dérivé ne se synchronise.** La série se recalcule à partir du journal
  fusionné, jamais ne se réconcilie — deux séries additionnées ou choisies au hasard
  donnent un chiffre faux que rien ne rattrape ensuite.

Écrire un numéro de version de schéma à côté de l'état. Il ne coûte rien aujourd'hui
et rend possible une migration qui, sans lui, obligerait à jeter les historiques.

**Le compte et le coffre chiffré sont hors périmètre V1.** Ils ne servent qu'au
passage iOS → Android, qui n'existe pas tant qu'il n'y a qu'un client. La conception
est consignée dans `decisions.md` (2026-07-31) : ne pas l'anticiper dans le code, mais
ne pas non plus stocker l'état d'une façon qui la rendrait impossible — d'où les
règles de fusion ci-dessus, qui sont exactement ce dont un coffre aurait besoin.

## 5. L'esquisse existe déjà

`app/` dans ce dépôt contient une **PWA fonctionnelle** avec le parcours complet :
onboarding, verrou quotidien, lecture, quiz, carte en canvas, calendrier, archive,
profil, réglages. `npm run app` l'assemble.

Elle n'est pas la base du client iOS et ne doit pas être portée telle quelle. Mais
elle est **la référence de comportement** : en cas de doute sur ce que fait un écran,
la regarder coûte moins cher que de deviner. Le fichier `app/app.js` contient
notamment la logique déjà éprouvée de :

- l'attribution déterministe d'un concept à un jour (mélange à graine fixe, pour que
  la même sélection de disciplines redonne toujours la même suite) ;
- **la répartition des disciplines dans le temps**, appliquée après le battage : une
  même discipline ne tombe jamais deux jours d'affilée, et chacune est étalée sur toute
  la longueur de la suite proportionnellement à son stock (`repartir()` / `desserrer()` /
  `recoudre()`). Elle ne tire aucun nombre, donc la suite reste reproductible. Le client
  Android doit la porter, faute de quoi les deux plateformes serviront des programmes
  différents à sélection et graine identiques (`docs/decisions.md`, 2026-08-03) ;
- le calcul de la série ;
- la règle d'accès rétroactif : aujourd'hui toujours ouvert, les trois derniers jours
  ouverts en gratuit, tout le reste réservé à Premium.

## 6. La boucle de travail en local

C'est ce qui change tout par rapport à une session distante. Sur le Mac, la session
peut compiler, lancer le simulateur et se relire :

```bash
xcodebuild -scheme Anagnosis -destination 'platform=iOS Simulator,name=iPhone 16' build
xcrun simctl boot 'iPhone 16'
xcrun simctl install booted <chemin>/Anagnosis.app
xcrun simctl launch booted com.louvigny.anagnosis
xcrun simctl io booted screenshot /tmp/ecran.png
```

La capture d'écran est le point important : elle permet de **voir** le résultat et de
corriger, au lieu de livrer du code non vérifié.

## 7. Vérification avant la première session

```bash
xcodebuild -version          # Xcode installé
xcrun simctl list devices available | head
swift --version
```

Si `xcodebuild` répond « command line tools », lancer Xcode une fois et accepter la
licence, puis `sudo xcode-select -s /Applications/Xcode.app/Contents/Developer`.

## 8. Ce qu'il ne faut pas faire

- Ne pas ajouter de dépendance sans raison forte. Le projet tient sans, jusqu'ici.
- Ne pas introduire de compte, d'inscription ni de backend pour conserver
  l'historique. `NSUbiquitousKeyValueStore` couvre le besoin (§4), et l'app affiche
  « aucun compte, aucun serveur, aucun suivi » — ce qui doit rester vrai.
- Ne pas inventer de contenu. Les fiches viennent du pipeline et de nulle part
  ailleurs. Les cinq fiches présentes dans les maquettes de Claude Design sont
  fictives et n'ont pas passé le validateur.
- Ne pas fabriquer de citation. Voir `docs/ligne-editoriale.md` §4.
- Ne pas utiliser l'encre de discipline en texte courant : six des neuf encres sont
  sous 4,5:1 de contraste sur le papier (`charte-visuelle.md` §2.2).
- Ne pas ajouter de dégradé, de forme molle, d'ombre douce ni de coin arrondi
  uniforme. La liste complète est dans `charte-visuelle.md` §6, et chacun de ces
  éléments annule la raison d'être de la direction.
