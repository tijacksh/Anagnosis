# Anagnosis — pipeline de contenu (Lot 0)

Génération et validation éditoriale des fiches concepts de l'app Anagnosis.

Ce dépôt **n'est pas l'app**. Il contient la chaîne de production du contenu :
génération assistée par Claude Code, contrôle qualité automatique, outil de
validation humaine, export vers le backend. L'app iOS fera l'objet d'un dépôt
séparé (voir `docs/brief-produit.md` §15).

## Démarrer

Aucune dépendance à installer — Node 20+ suffit.

```bash
npm run admin      # outil de validation → http://localhost:4321
npm run validate   # contrôle qualité de toutes les fiches
npm run queue      # file d'attente de relecture, par discipline
npm run stats      # état de la base et avance de publication
npm run export     # export des fiches publiables → export/concepts.json
npm run apercu     # aperçu cliquable autonome → export/apercu.html
npm test           # tests du validateur + contrôle du contenu du dépôt
```

## Le flux

```
   génération            contrôle             validation           export
  (Claude Code)          (auto)               (humaine)           (backend)

   fiche JSON  ──────>  npm run validate ──>  npm run admin  ──>  npm run export
                          erreurs               valider /            concepts.json
                          alertes               retoucher /
                                                rejeter
```

1. **Génération** — Claude Code écrit une fiche JSON dans
   `content/concepts/<discipline>/<slug>.json`, sources vérifiées en ligne.
   La fiche naît au statut `brouillon`.
2. **Contrôle qualité** — `npm run validate` applique la ligne éditoriale :
   longueur, sources traçables, citation sourcée, cohérence du quiz. Deux
   niveaux : `erreur` (bloquant) et `alerte` (signalé au relecteur).
3. **Validation humaine** — `npm run admin` ouvre la file d'attente. Chaque
   fiche s'affiche telle qu'elle sera lue, avec ses sources, son quiz et son
   diagnostic. Actions : valider, renvoyer en retouche, rejeter.
   **Une fiche en erreur ne peut pas être validée** — le bouton est désactivé
   côté interface et la transition refusée côté serveur.
4. **Export** — `npm run export` produit le fichier que consommera le backend
   de l'app, en excluant les disciplines non activées en V1.

## Organisation

```
content/concepts/<discipline>/<slug>.json   la base de connaissance
docs/brief-produit.md                       le brief produit complet
docs/ligne-editoriale.md                    la référence de génération
src/schema.js                               taxonomie, statuts, transitions, règles
src/validate.js                             le contrôle qualité
src/store.js                                lecture/écriture des fiches
src/cli.js                                  validate / queue / stats / export
src/admin/                                  l'outil de validation
test/                                       tests du validateur et du contenu
```

## Pourquoi des fichiers JSON plutôt qu'une base

La source de vérité est le dépôt Git lui-même. Chaque décision de relecture est
écrite dans la fiche (`validation.historique`) et donc versionnée : l'historique
Git *est* le journal d'audit, sans table à maintenir. Le pipeline se déploie en
copiant un dossier, ce qui compte pour un service destiné à cohabiter sur le NAS
avec Clara et le radar (brief §11).

Ce choix vaut pour l'ordre de grandeur visé — quelques centaines de fiches.
Au-delà de quelques milliers, une vraie base deviendrait justifiée.

## Montrer le contenu à quelqu'un

`npm run apercu` produit un **fichier HTML unique et autonome** dans `export/`, avec
les fiches validées : onboarding, concept du jour, lecture, quiz, carte partageable,
archive et profil. Aucune dépendance, aucun appel réseau, il fonctionne hors ligne.

C'est fait pour être envoyé par mail ou messagerie à quelqu'un qui n'a accès ni au
dépôt ni à quoi que ce soit d'autre : il ouvre le fichier dans son navigateur, et
c'est tout. La maquette est régénérée à chaque fois — elle suit donc le contenu
validé sans travail supplémentaire.

Ce n'est pas l'app, et ce ne doit pas en devenir la base : c'est un outil pour faire
réagir des gens sur le contenu et la direction visuelle avant d'écrire du code client.

## Cycle de vie d'une fiche

```
brouillon ──valider──> valide ──publier──> publie
    │  ▲                  │
    │  └──retoucher───────┘
    └──rejeter──> rejete
```

`en_retouche` se distingue de `brouillon` : c'est une fiche déjà passée devant un
relecteur, porteuse de demandes de correction explicites. Un rejet ou une retouche
exige une note — sans motif, la regénération n'a rien pour travailler.

## Statut

| | |
|---|---|
| Fiches en base | 32 |
| Validées | 32 — soit un mois de contenu |
| Cible Lot 0 (brief §13) | 20-30 — **atteinte** |
| Cible avant lancement public (brief §9) | 200-300, soit 60-90 jours d'avance |

Répartition : 12 philosophie, 12 psychologie, 6 physique, 1 biologie, 1 médecine.

Les décisions prises depuis le brief — dont le passage du partage en story de V1.5 à
fonction centrale de V1 — sont consignées dans `docs/decisions.md`. La direction
visuelle retenue et son cahier des charges sont dans `docs/direction-artistique.md`.
