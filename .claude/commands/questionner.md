---
description: Écrit les questions supplémentaires des fiches qui n'en ont qu'une
---

# Questionner

Le corpus a été écrit avec **une** question par fiche. C'était suffisant tant qu'elle ne
servait qu'une fois, le jour de la lecture. Le rappel, la révision et l'épreuve tirent tous
dans le même sac : avec une seule question, ils rejouent celle du jour mot pour mot, et le
lecteur qui la retrouve intacte croit avoir retenu ce qu'il a seulement reconnu.

Cette routine remplit le sac. **C'est un rattrapage, pas un entretien** : elle s'arrête
d'elle-même quand chaque fiche servie porte assez de questions, et elle ne doit jamais
redevenir nécessaire — les fiches neuves naissent avec les leurs (`produire.md`).

## Le lot

```bash
npm run aquestionner
```

Dix fiches, une par discipline en tournant, la discipline la moins avancée d'abord. L'ordre
n'est pas de l'esthétique : le lecteur ne coche que trois disciplines, et un rattrapage
alphabétique remplirait Anthropologie en entier avant de toucher à la Physique. En tournant,
le sac se remplit à la même vitesse pour tout le monde.

## Ce qu'on écrit

**Deux questions de plus au minimum, quatre au maximum.** Elles s'ajoutent dans
`quiz_supplementaire`, jamais dans `quiz` — la question du jour ne bouge pas, un lecteur
peut y avoir déjà répondu.

```json
"quiz_supplementaire": [
  {
    "question": "…",
    "choix": ["…", "…", "…"],
    "bonne_reponse": 0,
    "explication": "…"
  }
]
```

Pour chaque fiche du lot :

1. **Relire la fiche entière.** Les questions portent sur ce qu'elle dit, jamais sur ce
   qu'on sait par ailleurs. Une question à laquelle le texte ne répond pas est une question
   sur laquelle le lecteur ne peut que deviner.
2. **Interroger autre chose que la question du jour.** Elle est déjà posée ; en écrire une
   variante revient à ne rien ajouter. Viser un autre fait, un autre mécanisme, une autre
   conséquence de la même fiche.
3. **Vérifier que chaque réponse fausse est fausse.** C'est là que le travail se joue. Un
   distracteur vaguement vrai transforme la question en piège, et un produit dont l'argument
   est l'exactitude ne peut pas se permettre d'avoir tort dans ses propres corrections.
4. **Écrire l'explication**, quarante caractères au minimum, qui dit *pourquoi* c'est la
   bonne réponse. Elle se lit après coup, y compris par qui a juste.

## Les pièges déjà rencontrés

- **La position de la bonne réponse.** Écrites à la suite, les questions se retrouvent
  toutes avec la bonne réponse en première position. Un test le vérifie sur tout le corpus,
  et il vaut aussi pour les questions supplémentaires : varier `bonne_reponse` d'une
  question à l'autre.
- **La longueur de la bonne réponse.** Une bonne réponse plus détaillée que ses distracteurs
  se repère sans comprendre la question. Le seuil est 1,4 fois le plus long distracteur.
- **Pas de tirets cadratins** dans les questions, les propositions ni les explications :
  virgule à la place.

## Avant de rendre la main

```bash
npm run validate   # zéro erreur, zéro alerte
npm test           # les tests contrôlent aussi le contenu réel du dépôt
```

La validation refuse une question qui répète une question déjà posée sur la même fiche,
accents et ponctuation compris : le rappel et la révision tirent dans le même sac, et un
doublon y reviendrait deux fois plus souvent.

## Ce qu'on ne fait pas ici

**On ne touche pas au texte de la fiche.** Écrire une question qui révèle qu'un passage est
faux ou ambigu n'autorise pas à le corriger au passage : c'est le partage des rôles du
dépôt, le sens se signale au lieu de se réparer en silence. Poser la trace avec
`node src/cli.js controle <id> a_revoir "note"` et passer à la fiche suivante.

**On ne revalide rien.** Ces fiches sont déjà validées ; ajouter des questions ne change pas
leur statut. En revanche cela change leur **empreinte**, donc elles repasseront d'elles-mêmes
au contrôle — et c'est voulu : un passage indépendant relira ce qui vient d'être écrit.
