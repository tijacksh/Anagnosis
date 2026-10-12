# Revue du palier « 20 fiches par jour » — semaine du 2026-10-06 au 2026-10-12

Revue automatique faite le 2026-10-12 vers 09:30, sur `main` à jour (b4658fe). Période : du 6 octobre (point de départ : 554 fiches) au 12 octobre au matin.

## Verdict

**En volume, oui : le palier tient (≈ 19,6 fiches par jour). En vérification, non : la boucle contrôle → retouche → réparation → recontrôle est déjà saturée à 20/jour.**

- Rythme réel : **+117 fiches en 5,96 jours (du 06/10 10:26 au 12/10 09:25), soit 19,6 par jour** contre 20 visées. Il varie de 12 à 24 selon les jours (16,2 par jour sur les 5 jours pleins 07-11).
- La production n'est pas le goulot. La vérification l'est : file « à contrôler » en hausse, stock en retouche passé de 0 à 20, 32 % seulement de fiches validées au premier passage.
- **Recommandation : rester à 20 par jour et corriger d'abord la boucle de vérification. Ne pas passer à 50-60.**

Conditions pour réexaminer le passage à 50-60 (à mesurer sur une semaine) :

- la file « à contrôler » ne grossit plus ;
- le stock en retouche reste sous 10 ;
- plus de la moitié des fiches sont validées dès le premier passage (32 % aujourd'hui).

## 1. Volumes

| Mesure | Valeur |
|---|---|
| Fiches au 2026-10-12 (`npm run stats`) | **671** (638 validées, 7 brouillons, 20 à retoucher, 6 rejetées) |
| Départ le 2026-10-06 | 554 (539 validées, 14 brouillons, 1 rejetée) |
| Gain net | **+117 fiches** (+99 validées, +5 rejetées, +20 à retoucher, −7 brouillons) |
| Fiches ajoutées au dépôt depuis le 06/10 00:00 (commits « Production : ») | 125 ; 117 après le 06/10 10:26, heure du point de départ à 554 (journal), ce qui explique l'écart avec le gain net |
| Par jour (après le 06/10 10:26) | 06/10 : 24 ; 07 : 17 ; 08 : 17 ; 09 : 13 ; 10 : 12 ; 11 : 22 ; 12 (matin) : 12 |
| Rythme | **19,6 par jour** sur 5,96 jours ; 16,2 par jour sur les 5 jours pleins (07-11) |

Le dépôt fait foi pour les volumes. Le journal les sous-estime : par exemple, il ne contient aucune ligne `produire` pour Musique, Architecture et Psychologie, dont les fiches existent pourtant (4 chacune). Les taux de passages ci-dessous sont donc des planchers.
| Commits git depuis le 06/10 | 206 ; messages « Production : » 32, « Contrôle des sources » 31, « Relecture » 27, « Réparation » 23 |

Passages consignés au journal sur les 5 jours pleins (07-11), contre la cadence prévue (planchers, voir ci-dessus) :

| Routine | Prévu | Fait | Taux |
|---|---|---|---|
| Produire | 25 | 20 | 80 % |
| Contrôler | 25 | 18 | 72 % |
| Réparer | 15 | 11 | 73 % |
| Relire | 20 | 16 | 80 % |
| Questionner | 20 | 16 | 80 % |
| Total | 105 | 81 | 77 % |

Le journal compte 130 passages entre le 06 et le 12 octobre au matin. Le 10 octobre est presque vide : aucun passage d'Arnaud entre le 09/10 19:30 et le 10/10 22:14, soit environ 26 h (machine ou application arrêtée). Les passages manqués ne sont pas rattrapés un par un : le 10/10 à 22:14-22:20 et le 11/10 à 11:18-11:23, toutes les routines repartent d'un coup, une fois chacune.

Rendement de `produire` d'après le journal : 22 passages du 07 au 12, 77 fiches annoncées, soit 3,5 par passage contre 4 visées ; 8 passages sur 22 ont produit moins de 4 fiches.

Production par discipline (créées depuis le 06/10) : Sciences politiques 28, Cinéma 8, 4 chacune pour Chimie, Musique, Histoire de l'art, Droit constitutionnel, Biologie, Architecture, Sociologie, Psychologie, Philosophie, Paléontologie, Neurosciences, Littérature, Génétique, Institutions judiciaires, Preuve et erreur judiciaire, Climat, Astronomie ; 3 pour Nutrition, Linguistique, Informatique, Géologie, Conformité ; 2 pour Archéologie, Océanographie, Écologie.

Avancement par discipline (40 disciplines affichées par `stats`, pour 39 annoncées) :

- Plus avancées : Religions et mythologies 28, Sciences politiques 28, Cinéma 21, Histoire 20.
- Plus minces : 14 fiches chacune pour Droit international, Propriété intellectuelle et IA, Droit social, Écologie, Océanographie, Physique.
- Écart à l'objectif de 300 par discipline : il reste ≈ 11 030 fiches. À 20 par jour, cela fait ≈ 550 jours (18 mois). À 55 par jour, ≈ 200 jours, si la vérification suivait.

`npm run cible` : file de relecture **27/60** (7 brouillons + 20 en retouche), 638 fiches publiables, pas de STOP. À 09:25, la consigne était de produire 4 fiches en Droit international (« socle incomplet »). D'après les mentions « File de relecture N/60 » du journal, la file a atteint 30/60 au plus pendant la semaine : le plafond ne freine pas la production.

## 2. Journal

- **Rien à faire** : ≈ 17 passages sur 130 (130 lignes dont une ligne `produire` du 06/10 03:52 en double), dont 15 de `questionner` (rattrapage terminé), 1 de `reparer` (06/10) et 1 de `relire` (11/10, aucun brouillon décidable). Ce sont des passages vides, sans conséquence.
- **Sujets abandonnés** : environ 15 passages de `produire` sur 22 (07-12) ont écarté au moins un sujet, ≈ 25 sujets au total.
  - Source primaire introuvable ou en 403 : Willingham, Lindeman et Gause, Ford Pinto, Hutton, Quicksort de Hoare, Berko, Hamblin, Friendly Floatees, Nansen/Ekman, Alice Guy, Mohenjo-daro, Sutton Hoo, Redi.
  - Doublons : Sally Clark, brioche de Marie-Antoinette, hiver de la faim néerlandais, Gettier (doublon de slug détecté par `validate`), Kitty Genovese, Rapa Nui, les 4 idées « proposées » d'Orkidea (Paramount 1948, Dogme 95, Lumière 1895, Dix de Hollywood), Midgley.
  - La cause la plus fréquente est l'impossibilité de rouvrir la source (403, paywall) : 13 sources contre 8 doublons. Les idées ne manquent pas.
- **Erreurs** : pas de plantage consigné, hors la collision ci-dessous. Les sites d'éditeurs (Science, PNAS, Nature, JSTOR, Gallica, Royal Society) renvoient régulièrement 403 ; les fiches passent par PMC, Europe PMC ou des résumés.
- **Conflits de push** : aucun échec de `git push` consigné ; une seule collision de travail consignée, le 06/10 09:53 (`reparer` : 4 fiches déjà revalidées par une autre exécution, corrections abandonnées sans commit). Le 12/10 06:08 : « aucune collision avec origin/main ».
- **Chevauchement Vincent / Orkidea** : 2 passages de source `vincent` sur 130 (1,5 %) : `questionner` le 06/10 01:38 et `produire` le 10/10 15:08 (4 fiches de Philosophie, pendant l'arrêt des routines d'Arnaud). Orkidea n'apparaît que par ses 4 idées déjà couvertes. Aucun doublon réel créé entre les deux sources. Les commits n'ont que deux auteurs (« Arnaud Louvigny » 169, « Claude » 37) et ne permettent pas de distinguer Vincent d'Orkidea. Le chevauchement est négligeable à ce volume.

## 3. Qualité

### Tirage de 6 fiches validées

Tirage aléatoire (graine fixée à la date du jour, 20261012) de 6 disciplines parmi celles qui ont des fiches validées créées depuis le 06/10, puis d'une fiche par discipline. Au moins une source rouverte en ligne par fiche.

| Fiche | Source rouverte | Résultat |
|---|---|---|
| inf-patriot-dhahran-1991-derive-horloge | Arnold (U. Minnesota), page reprenant le rapport GAO | Conforme : ≈100 h, 0,34 s, 1 676 m/s, 28 soldats, registre de 24 bits. La source parle d'« erreur de temps », la fiche de « retard de l'horloge » : nuance sans effet. |
| arc-malediction-toutankhamon-cohorte-bmj | Europe PMC (résumé de Nelson, BMJ 2002) | Conforme : 44 Occidentaux, 25 exposés, 70 ans contre 75, pas d'association significative. |
| arc-centre-pompidou-concours-1971-inconnus | Notice d'archives du Centre Pompidou + Wikipedia EN | Conforme : jury présidé par Prouvé, 15 juillet 1971, 681 projets, Piano/Rogers/Franchini (notice). Wikipedia EN confirme les 681 projets, les deux architectes d'une trentaine d'années qui se croyaient sans chance, et la première participation d'étrangers ; elle ne dit pas qui présidait. |
| pol-hirschman-1970-exit-voice-loyalty | Préface du livre, citée par une recherche web | Conforme : paragraphe sur les chemins de fer nigérians, critique, année au Center for Advanced Study. Le PDF cité par la fiche est illisible par l'outil de lecture ; je n'ai pas pu relire la page elle-même. |
| psy-petit-albert | Résumé du papier de Powell et al. 2014 (MacEwan) + Wikipedia EN | Conforme sur l'essentiel : Merritte mort à 6 ans d'hydrocéphalie, Barger mort en 2007 à 87 ans, nièce rapportant une aversion pour les chiens (« pas particulièrement forte »). L'article de 2014 est payant : le détail est vérifié par Wikipedia, pas dans l'article. |
| nut-minnesota-coronary-experiment-cholesterol-mortalite | Europe PMC (résumé de Ramsden et al., BMJ 2016) | Conforme : phrase de conclusion identique au repère, cholestérol −13,8 % sans bénéfice de survie. Les valeurs 207 → 175 → 203 mg/dl de Frantz 1989 n'ont pas été rouvertes. |

Résultat : 6 fiches sur 6 sans écart trouvé avec les sources rouvertes, dont 4 vérifiées directement (Patriot, Toutânkhamon, Pompidou, Minnesota) et 2 vérifiées de seconde main (Hirschman, Petit Albert). Un échantillon de 6 ne permet pas d'estimer un taux d'erreur ; il écarte seulement une dérive grossière.

### Taux de retouche et de rejet

Sur les 125 fiches créées depuis le 06/10 (118 hors les 7 brouillons de ce matin) :

- **38 validées au premier passage, c'est-à-dire sans retouche entre le brouillon et la validation (32 %)** ;
- **63 validées après au moins une boucle de retouche (53 %)** ;
- **17 encore en retouche (14 %)** ;
- 0 rejetée parmi les fiches récentes.

Dernier verdict de contrôle sur ces 125 fiches : 59 « ok » (47 %), 55 « à revoir » (44 %), 11 « corrigé » (9 %).

Rejets : 6 fiches rejetées au total, dont 5 depuis le 06/10 d'après leur historique : Gary Dotson, loi Sapin II et Kelsen 1920 (06/10, déjà réparées deux fois), Convention de Vienne 1988 (07/10) et Jack Foley (11/10). La sixième, Adolf Beck, date du 20/08. Aucune des 5 n'est une fiche créée depuis le 06/10 : ce sont des fiches plus anciennes.

Décisions enregistrées depuis le 06/10 dans l'historique des fiches : 121 validations, 81 renvois en retouche, 5 rejets. Cela fait environ 32 décisions par jour pour ≈ 20 fiches créées par jour : chaque fiche passe en moyenne deux fois devant un décideur.

### Doublons

`npm run doublons` : **0 doublon probable**, 18 alertes de source partagée. 4 de ces alertes concernent une fiche récente : Chanteur de jazz / Premiers Oscars 1929, Ewigkeitsklausel / motion de censure constructive 1949, Daubert / détecteur de mensonge, Paix d'Augsbourg / Westphalie 1648. Ce sont des thèmes distincts qui citent la même page ; pas de dérive.

## 4. Incidents

`gh issue list -R tijacksh/Anagnosis` : 9 issues au total, aucune ne concerne les routines de contenu cette semaine.

- Ouvertes : #11 (TikTok/BrightBean refusé, 11/10), #9 (Réseaux : vérification, 08/10), #6 (carottes-de-glace : accroche coupée, 29/09, antérieure à la période), #3 (TikTok + Instagram, 28/09).
- Fermées cette semaine : #8 et #10 (TikTok refusé, fermées le 11/10 à 09:55).
- Échecs de push : aucun consigné.
- Passages sautés : le trou du 10 octobre (≈ 26 h sans passage d'Arnaud), puis des rattrapages groupés. C'est la principale perte de volume de la semaine : 12 fiches créées le 10/10 contre 20 visées.

## 5. Coût

Je ne peux pas mesurer le coût depuis cette session. **Arnaud : peux-tu regarder ta consommation d'abonnement sur la semaine du 06 au 12 octobre ?** Une consommation déjà proche du plafond rend le passage à 50-60 impossible sans l'étaler ou le répartir. Même à 20 par jour, chaque fiche génère plusieurs passages d'agent : au moins un contrôle et une relecture, plus une réparation pour les 68 % non validées au premier passage (80 sur 118).

## 6. Goulot, risques, recommandation

### Goulot principal : la vérification, pas la production

Les chiffres viennent des journaux et de `git`. Les explications causales ci-dessous sont des inférences.

- La file « à contrôler » est passée de **318 (06/10 06:46) à 422 (12/10 09:25, `npm run acontroler`), soit +104 en 6 jours**, alors que `controler` examine 8 fiches par passage, soit environ 30 contrôles par jour pour ≈17 fiches créées. Si ces ≈ 30 contrôles par jour sortent bien de la file, il y entre ≈ 47 fiches par jour pour ≈ 20 fiches nouvelles : chaque fiche y revient plusieurs fois.
- Cause probable : `relire` et `reparer` modifient le texte, ce qui change l'empreinte. La CLI refuse alors `valide` sans contrôle à jour, et la fiche repart au contrôle (« le CLI refuse `valide` dès que le texte a changé », journal du 11 et 12/10). Une fiche peut passer trois fois devant le contrôle.
- Le stock en retouche est passé de **0 (06/10 10:26) à 20 (12/10 09:25, `stats`)** et oscille entre 10 et 21 depuis le 07/10. `reparer` traite au mieux 4 fiches par passage, 3 passages par jour, et n'a réalisé que 73 % de ses passages.
- Le flux de retouches (≈ 12 renvois par jour) est à peu près égal à la capacité de réparation (≈ 12 par jour). Il n'y a aucune marge.
- Aucun backlog de relecture : la file reste sous 30/60. `produire` n'est jamais bloqué par le plafond.
- Le quota ne peut pas être évalué d'ici (voir §5).
- Hors périmètre de cette revue : la routine `corriger-cartes` (8 passages, ≈ 59 cartes corrigées) et `controler-droit` (2 passages) consomment aussi des passages.

### Risques de qualité

- Le journal décrit des corrections de fond (accroches fausses, chiffres trop forts, attributions) à chaque boucle de retouche : la vérification a l'air de travailler utilement. Le risque est que la validation devienne un geste par lot si la file déborde.
- Si les proportions restent les mêmes, un passage de 20 à 50-60 par jour (×2,5 à ×3) porterait le flux de retouches à ≈ 30-36 par jour contre ≈ 12 de capacité de réparation, et la file « à contrôler » grossirait de ≈ 45-55 par jour au lieu de ≈ 17 (estimation par proportionnalité, non mesurée).
- Sources primaires inaccessibles (403, paywalls) : de plus en plus de fiches reposent sur des résumés, Wikipédia ou des PDF lus par un autre biais (Hirschman, Powell 2014 ci-dessus). C'est tolérable à 20 par jour avec relecture, plus fragile en volume.
- Le palier dépend d'un seul poste : le trou du 10/10 a limité ce jour-là à 12 fiches, mais le rattrapage groupé du 11/10 (22 fiches) a compensé en partie.

### Recommandation : rester à 20 et corriger d'abord

1. **Casser la boucle de recontrôle.** Permettre à `relire` de valider une fiche qu'elle vient de corriger (en recalculant l'empreinte) lorsque la correction est une simple retouche de forme, au lieu de la renvoyer à `controler`. C'est le réglage à changer en premier : l'objectif est de ramener le nombre de contrôles par fiche vers 1,5 (cible à mesurer, non calculée).
2. **Équilibrer `controler` et `reparer`.** Faire passer `reparer` de 3 à 4 ou 5 passages par jour. Faire contrôler d'abord les fiches récentes avant le stock plus ancien (422 en attente).
3. **Fiabiliser l'exécution.** L'arrêt du 10 octobre est le seul vrai trou de la semaine. Faire tourner les routines sur un poste toujours allumé, ou régler la mise en veille.
4. **Éviter les sujets sans source ouverte.** Ne retenir un sujet que s'il a au moins une source primaire ou institutionnelle lisible en ligne (PMC, Wikisource, Gutenberg, sites officiels). Cela réduit les ≈ 25 sujets abandonnés par semaine.
5. **Équilibrer les disciplines.** Les 6 disciplines à 14 fiches (Droit international, PI et IA, Droit social, Écologie, Océanographie, Physique) sont à prioriser dans `cible`.
6. **Surveiller avant d'augmenter.** Reprendre cette revue dans une semaine. Si les trois conditions du verdict sont remplies, monter par paliers (par exemple 30 par jour avec `produire` à 7 passages), en réexaminant à chaque palier, pas directement à 50-60.

Réglages à toucher pour un futur passage à 50-60 (à ne pas faire maintenant) : plafond de file et lot de relecture (variables d'environnement ajoutées au commit 35457ed), nombre de passages de `produire`, `controler` et `reparer`, et le lot de `controler` (8 fiches). Il faudrait au minimum tripler `controler` et `reparer` en parallèle.
