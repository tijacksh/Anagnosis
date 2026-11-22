# Tranche verticale « langue » (iOS et Android) : cahier des charges commun

But : prouver le mécanisme de langue sur UNE tranche étroite, sur les deux plateformes, avant l'externalisation en vrac. Pas de bulk : seulement les textes de la tranche.

## Décisions d'Arnaud (à respecter)
- Langues : français (`fr`) et anglais (`en`). Choix : « Langue du système » (défaut) / « Français » / « English ».
- Langue du système autre que fr ou en -> anglais.
- Interface en anglais dès que prête ; les fiches anglaises viennent plus tard (hors tranche).
- Dates localisées en anglais (hors tranche, mais le mécanisme ne doit pas les empêcher).
- Aucune dépendance ajoutée. Aucune modification de `MelangeDeterministe` ni de la suite des fiches. Rien dans l'état synchronisé (iCloud / export Android) : la langue est un réglage LOCAL, valeur absente = « système ».

## Table de chaînes unique (déjà écrite)
Source : `/Volumes/SSD 1To/Anagnosis/traduction-en/ui/fragments/*.json` (un fragment par module ; ajoute `ui/fragments/tranche.json`). Format : `{"id": {"fr": "...", "en": "...", "note": "contexte"}}` ; pluriel : `"fr": {"un": "...", "autre": "..."}` (même chose pour `en`) ; jetons `{n}`, `{nom}` remplacés à l'exécution. Ids : minuscules, chiffres, `_`, au moins un point, uniques (ex. `ecran_reglages.langue_titre`).
Générateur : `python3 "/Volumes/SSD 1To/Anagnosis/traduction-en/ui/generer.py" --ios <racine du dépôt iOS> --android <racine du dépôt Android>` écrit `Anagnosis/Langue/Chaines.swift` (enum `Chaines`, `simples` et `pluriels`) et `core/src/main/kotlin/fr/anagnosis/langue/Chaines.kt` (object `Chaines`). Ne jamais éditer ces fichiers à la main. Règles de pluriel : fr -> `un` pour 0 et 1 ; en -> `un` pour 1.

## API à écrire (mêmes noms des deux côtés)
- `Langue` : valeurs `systeme`, `fr`, `en` ; `Langue.choix` (lu/écrit, stocké en local, défaut `systeme`) ; `Langue.courante` (`fr` ou `en`, résolue : `fr` si la langue du système commence par « fr », sinon `en`) ; un mode pseudo-langue DÉBOGAGE seulement (argument de lancement iOS `-LanguePseudo`, propriété système/Intent extra côté Android) qui entoure chaque texte résolu de `⟦ ⟧` pour traquer les chaînes oubliées.
- `L("id")`, `L("id", ["n": "3"])` et `L("id", n: 3)` (pluriel) côté Swift ; `t("id")`, `t("id", mapOf("nom" to "x"))`, `t("id", n = 3)` côté Kotlin. Un id inconnu : renvoie l'id lui-même (et, en débogage, enregistre l'erreur) ; jamais de plantage.
- iOS : `Anagnosis/Langue/Langue.swift` ; sans dépendance au SwiftUI (utilisable depuis `Corpus/`, les notifications, `RenduCarte`, `ExportPDF`, `StoryVideo`, l'extension widget), compatible Swift 6 (concurrence stricte). Une valeur observable pour que SwiftUI se redessine au changement.
- Android : la logique pure (`Langue`, résolution, pluriels, `t`) dans le module `core` (package `fr.anagnosis.langue`, sans Android) ; l'application Android ajoute le stockage (SharedPreferences, comme `premium_connu`, voir `Notifications.kt`), l'état observable pour Compose, et l'application de la langue aux récepteurs d'alarme et au widget (ils ne passent pas par l'activité).
- Changement à chaud : à `Langue.choix = ...`, l'interface se redessine sans relancer, les notifications sont replanifiées dans la nouvelle langue (la signature de planification doit contenir la langue), le widget est rafraîchi (iOS : réécrire le dépôt du widget et relancer ses timelines ; Android : mettre à jour le widget).
- Les textes résolus par le système (nom de l'app, permission photos, nom du widget dans la galerie, raccourcis Siri) sont HORS tranche : note-les seulement.

## La tranche (et rien d'autre)
1. L'écran Réglages : une ligne « Langue » avec un sélecteur à trois valeurs (« Langue du système », « Français », « English »), dont les libellés restent dans leur propre langue ; plus les chaînes de cet écran que tu rencontres autour du sélecteur (titre de section, aide), au strict nécessaire. Le sélecteur de l'onboarding n'est PAS dans la tranche.
2. Une chaîne du noyau avec pluriel : le rappel de série (`RappelDeSerie`, côté iOS dans `Corpus/` ou équivalent) : « N jours d'affilée » / « N-day streak » ou ce que dit le texte réel.
3. Une notification : celle du rappel quotidien, titre et corps dans la langue choisie, replanifiée au changement.
4. Le widget : son texte visible principal (surtitre) dans la langue choisie, rafraîchi au changement.

## Tests (obligatoires)
- Résolution : `systeme` avec les locales `fr-FR`, `fr-CA`, `en-GB`, `en-US`, `de-DE`, `ja-JP` -> `fr`, `fr`, `en`, `en`, `en`, `en`.
- Pluriels : 0, 1, 2 en fr et en.
- Chaîne inconnue : renvoie l'id ; chaîne à jeton : remplacement.
- Persistance du choix et défaut `systeme` ; un ancien fichier d'état (sans langue) se décode comme avant (test avec un fichier d'état existant du dépôt de tests).
- Les tests existants restent verts. Là où ils comparent du texte français, FIGE explicitement la langue à `fr` (le défaut est maintenant la langue du système).
- Mêmes cas de test des deux côtés (miroir).

## Règles de travail
- Lis d'abord le `CLAUDE.md` du dépôt et `/Volumes/SSD 1To/Anagnosis/Anagnosis-repo/docs/ecrans.md` (Réglages). Respecte les contraintes « ne pas rouvrir ».
- Travaille dans un worktree à toi : `git -C <dépôt> worktree add -b feat/langue-tranche "/Volumes/SSD 1To/.builds/wt/<ios|android>-tranche" feat/langue-anglais`. Les fichiers ignorés par git ne s'y trouvent pas : copie `local.properties` (Android) depuis le dépôt principal.
- Commite sur ta branche (local seulement, aucun push), message en français, fin du message : `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>`. N'ajoute que les fichiers de la tranche, par chemin.
- Ne touche pas aux fichiers hors tranche, ne refais pas de mise en page, ne traduis pas le reste de l'app.
- Pas de capture d'écran ni d'émulateur : build et tests seulement (la vérification visuelle sera faite ensuite).
- Rapport (au plus 25 lignes) : branche et hash du commit, fichiers ajoutés et modifiés, résultats des tests (nombres), ce que tu n'as PAS pu vérifier, pièges et questions, et pour la suite : le modèle des étapes mécaniques pour externaliser un écran (ce que fait la bulk).
