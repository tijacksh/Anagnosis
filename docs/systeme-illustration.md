# Système d'illustration — Anagnosis

Référence visuelle : `design/claude-design/livraison-anagnosis/maquettes/Anagnosis - UX·UI.dc.html`, repère 1i.

## 1. La grille

Toute illustration se construit sur une grille de **8 × 8 modules**. Les formes
s'y alignent au module près. C'est ce qui empêche les compositions molles et ce
qui rend deux illustrations d'une même discipline reconnaissables entre elles
sans être identiques.

## 2. Règles de production

1. Deux encres au plus : celle de la discipline, et le noir. Le jaune
   uniquement sur la carte partageable.
2. Une seule asymétrie forte par composition. Jamais de centrage symétrique.
3. Au moins une forme sort du cadre. La composition est un fragment, pas un logo.
4. Aplats pleins ou trames régulières. Aucun dégradé, aucun flou, aucune ombre.
5. Aucun texte, aucun chiffre, aucun visage. La forme dit le concept ou elle ne
   sert à rien.
6. Hors-repérage constant sur l'encre de discipline uniquement. Grain une seule
   fois, à la fin, sur la composition entière.

## 3. Les six opérations

Le vocabulaire complet. Le pipeline ne reçoit pas un prompt libre mais une
**opération + une encre + un concept** : c'est ce qui rend trois cents pièces
cohérentes sans LoRA dédié. La variété vient du concept, pas du style.

| Opération | Ce qu'elle dit | Exemple |
|---|---|---|
| **Répétition & écart** | Conformité, norme, exception | Philosophie — la banalité du mal |
| **Densité graduée** | Accumulation, seuil, inégalité | Sociologie — l'effet Matthieu |
| **Concentricité décalée** | Propagation, émission, décalage | Physique — l'effet Doppler |
| **Partition** | Énumération, coupure, diagonale | Mathématiques — Cantor, 1891 |
| **Recouvrement** | Deux états dans un même objet | Littérature — le discours indirect libre |
| **Rapport** | Proportion, révision d'un chiffre | Biologie — 1,3 bactérie pour 1 cellule |

## 4. Champ `illustration` du modèle de données

Les `illustration.prompt` existants ont été rédigés avant l'arbitrage de
direction — à reprendre en bloc. Structure recommandée à la place d'un prompt
libre :

```
illustration
- operation: repetition_ecart | densite_graduee | concentricite_decalee
             | partition | recouvrement | rapport
- encre: <hex de la discipline>
- intention: <une phrase — ce que la forme doit dire du concept>
- prompt: <dérivé des trois champs ci-dessus, jamais écrit à la main seul>
```
