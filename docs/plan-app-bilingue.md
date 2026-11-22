# Traduction de l'app Anagnosis (iOS et Android) : plan du 2026-11-16

Décisions d'Arnaud : interface en anglais et français, sur iOS ET Android ; choix de langue à l'onboarding et dans les réglages ; les fiches suivent la langue de l'app ; la langue de l'app suit la langue d'affichage du système par défaut.

## Constats (spike du 16/11)
- Aucun texte n'est externalisé : les textes sont dans le code (108 fichiers Swift, ~12 900 lignes Kotlin ; 1 seule chaîne dans strings.xml). Premier recensement par regex : 429 phrases (iOS) et 416 (Android), sous-estimé.
- iOS : cible iOS 18, Swift 6, aucun String Catalog, `developmentRegion = fr`. Extension widget `AnagnosisWidget`. Notifications dans `Notifications/Notifications.swift`. `fr_FR` en dur dans `Corpus/Recherche.swift` et `Ecoute/BoutonVitesse.swift`.
- Android : minSdk 26, aucune dépendance AppCompat (donc pas de `setApplicationLocales` de AppCompat ; `LocaleManager` n'existe qu'à partir de l'API 33). `Locale.FRENCH` en dur dans `ecoute/BoutonVitesse.kt`. `supportsRtl=false`.

## Mécanisme proposé (aucune dépendance ajoutée)
- Langue = `fr` ou `en`, un champ dans l'état du lecteur (à décoder avec les anciens fichiers : défaut = langue du système, et `fr` si l'état est ancien et que l'onboarding est déjà fait). Changement immédiat, sans redémarrage.
- iOS : String Catalog (`Localizable.xcstrings`, fr source + en), aide `L(...)` qui lit le bundle de la langue choisie ; `.environment(\.locale)` pour les `Text` ; notifications replanifiées à chaque changement ; langue partagée avec le widget.
- Android : `values/` (fr) et `values-en/`, `locales_config.xml` pour le réglage par application d'Android 13+, et sous Android 8 à 12 un `attachBaseContext` qui force la langue choisie.
- Par défaut : la langue du système. Autre langue que fr ou en : à décider (proposition : anglais).
- Un glossaire commun `traductions-ui.json` (clé = phrase française) traduit une fois pour les deux plateformes ; les deux apps portent les mêmes textes.

## Contenu (fiches)
- Les fiches suivent la langue de l'app, avec repli sur le français fiche par fiche (le corpus anglais est incomplet : 429 sur 779 aujourd'hui, 141 citations retraduites à remplacer).
- La langue n'influence JAMAIS le choix de la fiche du jour (`MelangeDeterministe` et son test doré) : même identifiant, texte dans la langue.
- Côté pipeline (`Anagnosis-repo`) : un second fichier signé `concepts-en.json` produit à côté de `concepts.json`, lu par les apps selon la langue. À valider avec Arnaud : la règle « aucun appel réseau nouveau » (même point d'accès, un second fichier).
- Hors de cette modification : les fiches de droit, les voix anglaises, les fiches de la boutique des stores.

## Ordre de travail
1. Externaliser le français sans changement visible, tests verts (inventaire par script, pièges : concaténations, pluriels, alertes, permissions, canaux de notification, achats).
2. Ajouter l'anglais et le sélecteur (onboarding, réglages) ; replanifier les notifications.
3. Brancher le contenu anglais (pipeline puis clients), repli par fiche.
4. Vérifier chaque écran dans les deux langues, petit écran et Duo, sur les deux plateformes.
Avant : lire `docs/decisions.md` et `docs/ecrans.md`, lancer les tests de base des deux dépôts, relire le plan par `@code-reviewer`. Les deux dépôts sont sur `main` avec des fichiers non liés modifiés : ajouter par chemin.
Publication : selon la mémoire « publier après modif majeure », mais pas avant d'avoir décidé quoi montrer en anglais pour les fiches non relues.

## Corrections après relecture indépendante (16/11, verdict : plan à corriger)
Bloquant, intégré au plan :
1. Le français seul fait foi pour les identifiants, les retraits (`retirees`) et la date (`genere_le`) ; l'anglais ne remplace que des textes. Test obligatoire : la suite des fiches du jour est identique quelle que soit la langue (Corpus.swift:115,136,213-219 ; Corpus.kt:322-346).
2. Pas d'audio en anglais pour l'instant (la voix française et ses repères sont liés à l'identifiant et au texte projeté, publier.js:56-69) : décider ce qu'affichent le bouton Écouter et l'offre Premium en anglais.
3. Quiz enregistré par numéro de réponse (EtatLecteur.swift:31-33) : test exigeant les mêmes `bonne_reponse` et le même nombre de questions en anglais et en français. Mon contrôle de traduction le garantit déjà pour les fiches traduites (clés et indices intacts).
4. La langue reste HORS de l'état synchronisé (la fusion iCloud et l'export Android l'écraseraient) : réglage local partagé avec le widget, valeur absente = « système » (précédent : `premium_connu`, Notifications.kt:96).
5. Android : un `attachBaseContext` d'activité n'atteint ni les alarmes (Notifications.kt:219,273) ni le widget (WidgetCeJourLa.kt:54) ; sous Android 13+, le réglage du système fait une seconde source de vérité : à unifier.
6. Les textes de `core` (Kotlin) et de `Corpus/` (Swift) : RappelDeSerie, Disciplines, Paliers, Recap, Offre, DocumentFiche... Il faut un mécanisme de chaînes dans `core`, en miroir d'iOS.
Important :
7. Contenu anglais embarqué ou non : sans lui, jamais d'anglais hors ligne (ContenuDistant.swift:105-110 ; Android lit l'embarqué à 3 endroits).
8. Un seul fichier signé portant les deux langues (une signature, un ETag, des retraits cohérents) ne rouvre pas la règle « un seul point réseau » ; coût : fichier environ deux fois plus gros. À arbitrer.
9. Textes résolus par le système (permission photos, nom et description du widget, nom « Ce jour-là », raccourcis Siri, régions connues) : suivent la langue du système, pas l'app.
10. À rafraîchir au changement de langue : notifications (signature sans langue, Racine.swift:458-460), index Spotlight, dépôt et timelines du widget, canaux de notification Android.
11. Pluriels et concaténations (Notifications.swift:103,148 ; Notifications.kt:323 ; RappelDeSerie.kt:49 ; widgets) : le glossaire « clé = phrase française » ne suffit pas, il faut des identifiants et des pluriels.
12. Dates en dur et documentées (DatesFrancaises.swift:5-14) : à rouvrir explicitement ; mois en dur dans JourCivil.kt:89, Recap ; `fr` forcé dans les deux recherches et dans EcranReglages.kt:272 ; tri des disciplines sans collation.
13. Pipeline : la fiche anglaise passe par la même projection `publier.js` et porte l'empreinte de la fiche française d'origine ; repli automatique en français si elle ne correspond plus.
Non vérifié : Story, ExportPDF, RenduCarte, alertes et achats Android, libellés d'accessibilité (21), noms et prix des produits (stores).
Tests à ajouter : parité des clés de traduction iOS/Android ; la langue ne change pas la suite.

## Méthode retenue (16/11, après l'Advisor) : validée par Arnaud « pour tout »
Décisions validées : (1) langue système autre que fr/en -> anglais ; (2) un seul fichier signé portant les deux langues ; (3) pas d'audio en anglais : bouton Écouter masqué, offre Premium adaptée ; (4) dates localisées en anglais (rouvre DatesFrancaises) ; (5) interface en anglais dès que prête, fiches anglaises quand le corpus sera assez complet et relu.
Règle qui en découle : audio, recherche et tri suivent la langue de la FICHE affichée, pas celle de l'interface (sinon un lecteur Premium à téléphone anglais, qui reçoit des fiches françaises de repli, perdrait l'écoute).
Ordre : 1) tranche verticale sur les deux plateformes (réglages + sélecteur, une chaîne du noyau avec pluriel, une notification, le widget ; changement à chaud) relue par @code-reviewer ; 2) une table de chaînes unique (id, français, anglais, pluriels, note de contexte) qui GÉNÈRE le catalogue iOS, `values*/` Android et les tables du noyau ; 3) externalisation en vrac par module (sous-agents en worktree, fragments par module) ; 4) vérification par pseudo-langue de débogage (marque chaque chaîne résolue, balayage de l'arbre d'accessibilité / uiautomator) ; tests existants figés en français ; 5) pipeline : fichier combiné testé avec les décodeurs déjà publiés (builds 81 et 0.63) AVANT tout push sur Anagnosis-repo main (publication automatique et cron de 4 h).
Branches : une branche de fonctionnalité par dépôt (`feat/langue-anglais`), ajout par chemin, rien sur main avant vérification des deux langues. Écrire les cinq décisions dans docs/decisions.md.
Budget : limite hebdomadaire à 67 % le 16/11 ; pause à 90 % ; point d'arrêt (arbre qui compile) après chaque étape.

## État au 2026-11-16, 15 h : tranche faite, fusionnée dans feat/langue-anglais (les deux dépôts)
- Commits : iOS 7406394 + 48357b3 ; Android 082a86b + 93bf5f2 (branches `feat/langue-anglais`, locales, rien poussé). Worktrees : iOS `Anagnosis-app/.claude/worktrees/agent-ae41b6ac4e98cf49b`, Android `/Volumes/SSD 1To/.builds/wt/android-tranche` (à supprimer à la fin).
- Mécanisme : `Langue` + `L("id")` / `t("id")` + tables générées `Chaines` (generer.py, fragments `ui/fragments/*.json`, 17 ids dans tranche.json). Langue stockée en local (iOS : UserDefaults du groupe d'app, clé `langue.choix` ; Android : fichier `anagnosis_langue`), jamais dans l'état synchronisé. Pseudo-langue : `-LanguePseudo` (iOS), `--ez langue_pseudo true` (Android debug).
- Tests : iOS 292 (290 verts, 2 échecs d'environnement `TranscriptionTests`) ; Android core 246 + app 6, verts avec lien vers Anagnosis-repo. Relecture indépendante : parité corrigée (code « fr » exact, pluriel d'après `n` seul, jetons en un passage, test de cohérence de la table).
- Pas encore fait : vérification visuelle (le panneau du simulateur a demandé une autorisation que personne n'a accordée ; build iOS fusionné OK dans /Volumes/SSD 1To/.builds/anagnosis-i18n) ; émulateur Android non lancé.
- À traiter dans la bulk : noms de disciplines (titre de la notification du concept), « N JOURS · QUIZ » et textes de repli du widget (l'extension iOS ne compile pas Langue.swift : déposer des textes déjà rédigés), `ACTION_LOCALE_CHANGED` Android, nom de l'app / permission photos / noms du widget / Siri (InfoPlist et strings.xml), « ON THIS DAY », largeur de « Langue du système » sur petit écran, `fr_FR` en dur (recherche, bouton de vitesse), dates, accessibilité, achats, alertes, onboarding (sélecteur de langue), fiches (fichier combiné), audio masqué en anglais.
- Ne pas publier (TestFlight, Play) avant la bulk : un téléphone en anglais verrait un mélange.
- Bulk prévue : un agent par groupe d'écrans traitant iOS ET Android ensemble (mêmes ids, même fragment par groupe).

## Pause du 16/11, 16 h 40 : limite des 5 heures à 91 %, hebdomadaire à 75 %
- Groupes terminés : G2 (iOS a93cd6d, Android 50e64a8), G3 (iOS 76d6db4, Android b2aec73 ; fusionnés avec G4), G4 (déjà fusionné dans feat/langue-anglais : iOS 534c4ca, Android 693eefa). Fragments : ui/fragments/{noyau,lecture_quiz,navigation_abonnement}.json.
- G1 (réglages/onboarding) et G5 (hors écran) ARRÊTÉS en cours de route par moi (quota). Leur travail partiel est dans les worktrees /Volumes/SSD 1To/Anagnosis/wt-{ios,and}-g{1,5} (fichiers modifiés, peut-être non commités) et dans ui/fragments/{reglages_onboarding,hors_ecran}.json (s'ils existent). Reprise : relancer un agent par groupe avec la même consigne (ui/REGLES-BULK.md) en lui disant de continuer depuis l'état du worktree (`git status`, `git log`), de récupérer `git merge feat/langue-anglais`, puis de finir.
- Restent après G1 et G5 : fusionner g2, g3, g1, g5 dans feat/langue-anglais (iOS et Android), régénérer Chaines (generer.py), lancer les deux suites de tests, corriger PontWidgetTests (« ON THIS DAY »), valider les choix d'anglais (rappel/recall, planches/plates, bilan du quiz au singulier, « 1 JOUR OFFERTS »), vérification à l'exécution (iOS et Android), puis pipeline du contenu anglais.
- Le garde-quota bloque les commandes lourdes à 90 % de la fenêtre de 5 heures ; la fenêtre se remet à zéro à 17 h 30 UTC.

## Décision d'Arnaud (16/11, 16 h) : reprise à la remise à zéro des 5 heures (17 h 30 UTC), pour FINIR ce qui est en cours (G1, G5, fusions, régénération des tables, tests, vérification minimale) ; RIEN de nouveau (pas de contenu anglais côté pipeline, pas de vérification complète, pas d'autre chantier) avant samedi 21/11 (remise à zéro hebdomadaire à 20 h UTC).

## État au 2026-11-16, 17 h (UTC 16 h) : bulk terminée et fusionnée
- Branches `feat/langue-anglais` des deux dépôts : iOS c279682, Android 3b01beb ; locales, RIEN poussé, rien sur main. Table finale : 516 chaînes sur les deux plateformes (generer.py).
- Tests : iOS 332 verts (55 suites) ; Android 329 verts, 0 échec (core + app) ; builds OK.
- Fait : tranche + G1 (réglages, onboarding avec choix de langue au premier écran) + G2 (lecture, quiz) + G3 (navigation, abonnement) + G4 (noyau, dates, disciplines) + G5 (hors écran : cartes, écoute masquée en anglais, widgets, notifications, textes système fr/en, localeConfig, ACTION_LOCALE_CHANGED, débogage sous #if DEBUG).
- Worktrees des groupes retirés ; la branche `worktree-agent-ae41b6ac4e98cf49b` et l'ancien worktree iOS de la tranche subsistent (verrouillé). Tag `i18n-base` = état d'avant (iOS 6ea61f8, Android d4f0d11). ~9 Go de constructions dans /Volumes/SSD 1To/.builds à effacer quand tout sera vérifié.
- Reste (APRÈS samedi 21/11) : vérification à l'exécution complète sur les deux plateformes, petits écrans, Duo ; choix d'anglais à valider (rappel/recall, planches/plates, bilan du quiz au singulier, « 1 JOUR OFFERTS », « Today ») ; le pipeline du contenu anglais (fichier combiné, décodeurs publiés testés avant tout push) ; amendement decisions.md (dates suivent la langue de l'interface) ; documentation CLAUDE.md des deux dépôts (AVD anagnosis35 périmé, mécanisme de langue) ; relecture finale par @code-reviewer du diff complet ; puis publication (TestFlight interne, piste interne Play) selon la mémoire « publier après modif majeure ».

## État au samedi 21/11/2026, 21 h 30 CET (limite hebdomadaire remise à zéro à 20 h UTC)
- Routines : celles d'Arnaud (7, blocs ajoutés dans ~/.claude/scheduled-tasks, sauvegardes dans `_sauvegardes/2026-11-18-fiches-en-anglais/`) et celles de Vincent écrivent l'anglais ; le dépôt `tijacksh/Anagnosis` (main) a `content/concepts-en/` (517 fichiers au 21/11 : 429 de notre rattrapage + 88 des routines), `docs/traduction-en.md` (référence), `outils/atraduire.mjs`, `outils/empreinte-fr.mjs`, `_attribution.json` (droit = Vincent). Contrôle mécanique : 0 orpheline, 0 erreur de structure ; 1 périmée ; 6 écarts de chiffres et 2 dates britanniques dans le droit à relire.
- Apps : `feat/langue-anglais` poussée sur origin (iOS c279682, Android 3b01beb), main des apps inchangé (iOS 6ea61f8, Android d4f0d11).
- EN VOL : deux agents de vérification à l'exécution (Android a9b50780fdf82fbcf, iOS a24b02108342e6249) ; sorties dans `ui/verif2/{android,ios}/` ; l'agent iOS COMMITE des arguments de débogage dans le dépôt iOS (ne pas toucher au dépôt iOS avant son rapport).
- DÉFAUT à corriger avant publication (Advisor) : `Langue.ecouteDisponible = courante != .en` masque l'écoute selon la langue de l'INTERFACE ; la règle (PLAN) est la langue de la FICHE affichée. Tant que les fiches anglaises ne sont pas branchées, l'écoute reste visible partout. Un « Écouter absent en anglais » dans les rapports de vérification confirme le défaut.
- À faire : (1) corriger l'écoute (Android puis iOS) et ses tests ; (2) appliquer les choix d'anglais (rappel -> Recall, planches -> Plates, bilan du quiz « {n} of {total} correct », « Today ») dans les fragments ; « 1 JOUR OFFERTS » est un changement de français, à part ; (3) fichier combiné des deux langues dans un worktree de Anagnosis-repo, ÉTEINT par défaut, avec garde (empreinte à jour, mêmes quiz), testé avec les décodeurs de `i18n-base` ; (4) compilation Release des deux apps ; (5) amendement docs/decisions.md ; (6) relecture complète du diff depuis `i18n-base` par @code-reviewer, puis fusion dans main et publication (lire les mémoires « publier après modif majeure » et « test public » avant de numéroter les builds).

## 22/11 00 h 10 CET : vérifications à l'exécution FAITES, suite à finir (5 h à 96 % jusqu'à 01 h 00 UTC ; hebdo 13 %)
- Android (a9b50780…) : tout marche (onboarding, pseudo-langue sur ~20 écrans, petit écran, bascule à chaud, système, Android 13). Corrigé et poussé : écoute suit la langue des FICHES (ecd5eab), partage petit écran (4d2ee7c). Branche `feat/langue-anglais` Android = 4d2ee7c sur origin. Sorties : ui/verif2/android/.
- iOS (a24b0210…, ARRÊTÉ par moi, quota) : 61 écrans atteints, tous passent par la table, bascule à chaud OK, système OK, notifications OK. Commit local 698f0f4 (arguments de débogage « ouverture directe de chaque écran », build Debug et Release OK, aucun code de débogage dans le binaire Release) NON POUSSÉ ; UNE modification non commitée : `Anagnosis/App/ArgumentsDebug.swift:174` (seed de démo : 4 traces de rappel au lieu de 10). Worktree temporaire à supprimer : `/Volumes/SSD 1To/.builds/wt/i18n-base-cmp`. Sorties : ui/verif2/ios/ (matrice/, systeme-bascule-notifs/, accessibility-extra-large/, listes.txt).
- À CORRIGER côté iOS : (1) `Langue.ecouteDisponible = courante != .en` -> doit suivre la langue des FICHES (comme Android, `langueDesFiches`, test forcé) : l'agent iOS a « constaté » l'écoute masquée en anglais = le défaut ; fichiers : Langue.swift, Offre.swift, EcranLecture.swift, ContenuSuccesPremium, HorsEcranTests ; (2) iOS : libellé de groupe « HUMANITIES AND SOCIAL SCIENCES » sur deux lignes dans les Réglages/onboarding (décale la pastille) : raccourcir (« Humanities & social sciences » ou lineLimit + réduction) ; (3) écran de partage : vérifier le crédit sur petit écran (comme Android).
- À régénérer des deux côtés : les choix d'anglais appliqués dans ui/fragments (Recall, « {n} of {total} correct ») : `generer.py --ios ... --android ...` puis tests, commit par chemin, push `feat/langue-anglais`.
- Décisions proposées à Arnaud : sélecteur d'heure des Réglages reste en 24 h (texte du récap en 12 h en anglais) ; « IT WAS THE OTHER ONE » -> « IT WAS ANOTHER ONE » ; « 1 JOUR OFFERTS » (français) à part.
- Non vérifié (vrai appareil) : texte des alarmes, contenu des widgets, changement de langue système en direct (ACTION_LOCALE_CHANGED), prix/essai StoreKit, petit iPhone SE.
- Après ça : fichier combiné éteint (worktree Anagnosis-repo, garde empreinte, décodeurs i18n-base), Release Android, amendement decisions.md, relecture complète @code-reviewer du diff depuis i18n-base, fusion dans main, publication (mémoires « publier après modif majeure » et « test public »).

## 22/11/2026 : lecture du champ `en` livrée (interrupteur éteint)
Les deux apps savent servir une fiche en anglais (garde pure par fiche, résolution `Concept.dans(langue)`, écoute par fiche, recherche et Spotlight selon la langue servie). Spécification, amendements et conditions d'activation : `docs/lecture-en-apps.md`. Builds internes : iOS 85, Android 0.65 (68). Rien en externe.
