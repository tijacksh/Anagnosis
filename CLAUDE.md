# CLAUDE.md

Contexte de travail pour Claude Code sur ce dépôt.

## Ce qu'est ce dépôt

Le **pipeline de contenu** d'Anagnosis (Lot 0) : génération des fiches concepts,
contrôle qualité, outil de validation Admin, export vers le backend.

Ce n'est **pas** l'app iOS, qui vivra dans un dépôt séparé. Ne pas ajouter ici de
code client, d'UI produit ou d'appel réseau vers un backend.

Seule exception : le dossier `app/` et `src/build-app.js`, qui produisent
l'**esquisse jouable** — une PWA assemblée à partir des fiches validées. Elle sert à
éprouver le parcours et la direction visuelle sur un vrai téléphone, sans Xcode ni
App Store.

Ce n'est pas le client iOS et ça ne doit pas en devenir la base. Le natif vivra dans
son propre dépôt, avec la synchronisation iCloud (CloudKit) que le web ne peut pas
avoir.

## À lire avant toute tâche de fond

- `docs/brief-produit.md` — le produit, le positionnement, le modèle économique
- `docs/ligne-editoriale.md` — **la référence pour toute génération de contenu**
- `docs/decisions.md` — ce qui a été tranché depuis le brief, et pourquoi
- `docs/direction-artistique.md` — l'intention visuelle (direction risographie)
- `docs/charte-visuelle.md` — **les valeurs** : couleur, surimpression, grain, typo
- `docs/systeme-illustration.md` — grille, six opérations, champ `illustration`
- `docs/ecrans.md` — carte partageable, lecture, notification, quiz, profil, verrou

## Commandes

```bash
npm run admin      # outil de validation → http://localhost:4321
npm run validate   # contrôle qualité (sortie 1 si erreur)
npm run queue      # file d'attente par discipline
npm run stats      # état de la base
npm run export     # export des fiches publiables
npm run app        # assemble l'esquisse jouable → export/app/
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
3. **Écrire la carte partageable en même temps que la fiche.** C'est du contenu,
   pas de la mise en page : le partage en story est le moteur de croissance
   (`docs/decisions.md`), et `carte.source_courte` n'est jamais vide.
4. Lancer `npm run validate` — zéro erreur, zéro alerte.
5. Lancer `npm test` — les tests contrôlent aussi le contenu réel du dépôt
   (équilibre des quiz, unicité des sources).

## Pièges déjà rencontrés

- **Position de la bonne réponse.** Écrites à la suite, les fiches se retrouvent
  toutes avec la bonne réponse en première position. Un test le vérifie.
- **Longueur de la bonne réponse.** Une bonne réponse plus détaillée que ses
  distracteurs se repère sans comprendre la question. Seuil : 1,4× le plus long
  distracteur, vérifié par un test.
- **Décompte de mots.** `motsDe()` retire les marqueurs d'emphase sans insérer
  d'espace, sinon « l'*italique* » compte pour deux mots.

## Produire un pack de discipline

La production continue se fait **par lots d'une discipline entière**
(`docs/decisions.md`). Deux points à ne pas perdre de vue :

- L'app sert un concept par jour parmi les disciplines choisies par
  l'utilisateur. Un stock déséquilibré rend le service inutilisable pour qui n'a
  pas coché la discipline remplie — viser un socle sur toutes les disciplines
  actives avant publication, même en produisant pack par pack.
- À l'intérieur d'un pack, varier les registres et les niveaux. Huit fiches
  construites sur le même schéma se lisent comme une seule.

## Ce qui reste ouvert

- Direction artistique des illustrations — les `illustration.prompt` actuels sont
  des points de départ, à reprendre au Lot 5 avec Claude Design. Exigence non
  négociable : le rendu ne doit jamais être identifiable comme généré par IA
- Prix des paliers premium (brief §14)
- Lancer les 9 disciplines d'emblée, ou un sous-ensemble (brief §14, amendé par
  l'ajout de Médecine / Santé)
