# Epignosis — pipeline de contenu (Lot 0)

Génération et validation éditoriale des fiches concepts de l'app Epignosis.

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

Lot 0 en cours. Premier lot thématique produit : **8 fiches sur l'effet Doppler**
(6 physique, 2 biologie), en attente de validation.

Objectif avant lancement public : 200 à 300 fiches validées, soit 60 à 90 jours
d'avance (brief §9).
