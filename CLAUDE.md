# CLAUDE.md

Contexte de travail pour Claude Code sur ce dépôt.

## Ce qu'est ce dépôt

Le **pipeline de contenu** d'Epignosis (Lot 0) : génération des fiches concepts,
contrôle qualité, outil de validation Admin, export vers le backend.

Ce n'est **pas** l'app iOS, qui vivra dans un dépôt séparé. Ne pas ajouter ici de
code client, d'UI produit ou d'appel réseau vers un backend.

## À lire avant toute tâche de fond

- `docs/brief-produit.md` — le produit, le positionnement, le modèle économique
- `docs/ligne-editoriale.md` — **la référence pour toute génération de contenu**

## Commandes

```bash
npm run admin      # outil de validation → http://localhost:4321
npm run validate   # contrôle qualité (sortie 1 si erreur)
npm run queue      # file d'attente par discipline
npm run stats      # état de la base
npm run export     # export des fiches publiables
npm test           # tests
```

## Contraintes techniques

- **Zéro dépendance runtime.** Node 20+, modules natifs uniquement. Le pipeline
  doit tourner sur le NAS (4 Go de RAM, déjà deux services) et rester lançable
  dans plusieurs années sans réinstaller un écosystème. Ne pas ajouter de
  framework, de bundler ni d'ORM sans raison forte.
- **Zéro API externe**, y compris pour la génération (brief §9). Le contenu est
  écrit par Claude Code directement dans le dépôt.
- **ESM**, `type: module`. Pas d'étape de build.
- Le code et les commentaires sont en français, comme le contenu.

## Écrire une fiche

Une fiche = un fichier `content/concepts/<discipline>/<slug>.json`, créé au statut
`brouillon`. Ne jamais créer une fiche directement en `valide` : le statut est la
trace d'une décision humaine, pas un champ à remplir.

Avant de proposer un lot à la relecture :

1. **Vérifier les sources en ligne.** Une source non vérifiée ne va pas dans une
   fiche. C'est le cœur du positionnement produit (brief §3).
2. **Ne jamais fabriquer une citation.** En l'absence de citation authentique et
   sourçable, utiliser le champ `repere` (ligne éditoriale §4).
3. Lancer `npm run validate` — zéro erreur, zéro alerte.
4. Lancer `npm test` — les tests contrôlent aussi le contenu réel du dépôt
   (équilibre des quiz, unicité des sources).

## Pièges déjà rencontrés

- **Position de la bonne réponse.** Écrites à la suite, les fiches se retrouvent
  toutes avec la bonne réponse en première position. Un test le vérifie.
- **Longueur de la bonne réponse.** Une bonne réponse plus détaillée que ses
  distracteurs se repère sans comprendre la question. Seuil : 1,4× le plus long
  distracteur, vérifié par un test.
- **Décompte de mots.** `motsDe()` retire les marqueurs d'emphase sans insérer
  d'espace, sinon « l'*italique* » compte pour deux mots.

## Ce qui reste ouvert

- Nom de l'app (le dépôt s'appelle Epignosis, le brief parle d'un nom provisoire)
- Direction artistique des illustrations — les `illustration.prompt` actuels sont
  des points de départ, à reprendre au Lot 5 avec Claude Design. Exigence non
  négociable : le rendu ne doit jamais être identifiable comme généré par IA
- Une discipline « Médecine / Santé » manque à la taxonomie : les fiches
  d'imagerie médicale sont pour l'instant classées en Biologie
