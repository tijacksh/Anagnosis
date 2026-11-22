# Interface bilingue : la table de textes des apps

Source UNIQUE des textes d'interface d'Anagnosis iOS et Android (français et anglais) : `i18n/ui/fragments/*.json`, un fragment par groupe d'écrans. Les tables `Chaines.swift` (iOS) et `Chaines.kt` (Android, module `core`) sont GÉNÉRÉES, jamais éditées à la main :

```
python3 i18n/ui/generer.py --ios <racine du dépôt Anagnosis-app> --android <racine du dépôt Anagnosis-android>
```
- Format, jetons `{n}`, pluriels `un`/`autre`, ids : voir `ui/SPEC-TRANCHE.md` et l'en-tête de `ui/generer.py`.
- Glossaire anglais : `ui/glossaire.md`. Règles de code (ne jamais stocker un texte résolu, etc.) : `ui/REGLES-BULK.md`.
- `ui/verifier_fr.py <fragment>` vérifie que chaque texte français d'un fragment existait à l'identique dans le code d'origine (balise git `i18n-base` des deux apps).
- Les fiches anglaises (contenu) sont ailleurs : `content/concepts-en/`, voir `docs/traduction-en.md`. Le plan et l'historique du chantier : `docs/plan-app-bilingue.md`.
- Après une modification d'un fragment : régénérer les deux tables, lancer les tests des deux apps, committer les fragments ICI et les tables dans chaque app, dans la même journée.
