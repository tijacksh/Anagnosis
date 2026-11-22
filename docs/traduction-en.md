# Les fiches en anglais

**Cette page est LA référence.** Le bloc « Écrire aussi la fiche en anglais » ci-dessous est celui que les prompts des routines contiennent ; en cas d'écart entre un prompt et cette page, c'est cette page qui fait foi, et le prompt se corrige.

Anagnosis est bilingue (français et anglais) sur iOS et Android. Le français reste la source de vérité : lui seul passe par le validateur, le statut, l'audio et la publication. Chaque fiche a une version anglaise, dans un dossier frère : `content/concepts-en/<discipline>/<slug>.json`. Ni `validate`, ni l'audio, ni les tests de forme du français ne lisent ce dossier. Seuls `npm run site` et `npm run export` le lisent, **et seulement si `ANAGNOSIS_LANGUES=fr,en`** (éteint par défaut : voir « Fichier signé à deux langues » plus bas). Tant que cette variable n'est pas posée, les fichiers anglais s'accumulent sans effet sur les apps ni sur le site.

## Quoi traduire, et qui : `npm run atraduire`
L'état se **déduit des fichiers**, rien n'est réservé ni écrit : `absente` (pas de fichier anglais), `périmée` (le français a changé depuis : `empreinte_fr` différente), `à jour`. Les fiches rejetées sont ignorées.
```
npm run atraduire -- --stats                    # compte par état
npm run atraduire -- --pour vincent --max 10    # le prochain lot de la voie « vincent » (périmées d'abord, puis absentes, validées avant brouillons)
npm run atraduire -- --discipline droit_social --json
```
- **Fiches nouvelles ou retouchées** : l'anglais est écrit par la routine qui vient d'écrire ou de retoucher le français de cette fiche, dans la même passe, et par personne d'autre.
- **Rattrapage des fiches sans version anglaise** : chacun traite sa voie, définie dans `content/concepts-en/_attribution.json` (édité à la main par les humains, jamais par une routine : un fichier que chaque routine écrit finit en conflit, comme `docs/journal-routines.md`). La répartition proposée : le droit (`droit_*`) chez Vincent, parce qu'il faut retrouver les textes officiels anglais sur le web ; le reste chez Arnaud. À valider.
- **Ne pas se marcher dessus** : une fiche = un fichier ; une seule voie par discipline ; `git pull --rebase origin main` avant de choisir le lot et avant de pousser ; si le rebase échoue, s'arrêter sans pousser. Le lot est toujours calculé après la mise à jour : deux routines de voies différentes ne tombent jamais sur la même fiche.

## Écrire aussi la fiche en anglais

Chaque fiche existe désormais en deux langues. Le français reste la source de vérité : c'est lui seul qui passe par le validateur, le statut et la publication. L'anglais est un second fichier, écrit dans la même passe.

**Où.** `content/concepts-en/<discipline>/<slug>.json`, même discipline et même nom de fichier que la fiche française. Jamais dans `content/concepts/` : le validateur, les tests et l'export le liraient comme une fiche française. Ne touche ni à `audio/` ni à l'export : l'anglais n'est pas publié et n'a pas de voix pour l'instant.

**Quand.** Une fois la fiche française écrite et `npm run validate` et `npm test` à zéro erreur, zéro alerte. Pour les routines qui retouchent une fiche existante (réparer, relire, questionner, contrôler-droit) : recalcule l'empreinte (ci-dessous) ; si elle diffère de `empreinte_fr` de la version anglaise, ou si celle-ci n'existe pas, écris ou réécris la version anglaise dans la même passe.

**Retouche partielle.** Si seule une partie de la fiche française a changé (par exemple des questions supplémentaires ajoutées), tu peux ne retraduire que les champs concernés dans la version anglaise existante, à condition que le reste y corresponde toujours au français ; mets alors l'empreinte à jour. Dans le doute, retraduis tout.

**Empreinte.** `node outils/empreinte-fr.mjs content/concepts/<discipline>/<slug>.json` donne l'empreinte des textes français traduisibles : elle ne change pas quand seuls le statut, la validation ou le contrôle changent.

**Format.** Un seul objet JSON :
- `id`, `slug` : identiques à la fiche française.
- `langue` : "en". `empreinte_fr` : l'empreinte calculée. `traduit_le` : la date du jour (AAAA-MM-JJ). `moteur` : "claude-code". `relu` : false.
- `drapeaux` : liste d'objets `{"chemin": "...", "type": "...", "note": "..."}` (types plus bas), vide si rien.
- Puis les champs traduits, avec les mêmes clés, le même ordre et la même structure que le français : `titre`, `accroche`, `contenu_vulgarise`, `citation`, `repere`, `carte`, `pour_aller_plus_loin`, `quiz`, `quiz_supplementaire`.
- Ne recopie pas `sources`, `validation`, `controle`, `meta`, `illustration`, `statut`, `discipline`, `theme`, `niveau`, `duree_lecture_min` : ils restent dans la fiche française.

**Ce qui ne change jamais.** Toutes les `url` (sauf une citation ou un texte officiel retrouvé en anglais, voir plus bas), `bonne_reponse` (même indice, même ordre des choix), le `statut` de chaque question, le nombre de questions, le nombre d'éléments de chaque liste.

**Traduction.**
- Anglais américain naturel, registre d'un bon magazine de vulgarisation, phrases courtes et rythme de l'original. Fidèle : rien d'ajouté, rien de retiré, rien de simplifié.
- Chiffres, noms propres et unités gardés ; chiffres en chiffres. Dates « June 10, 2000 » ; siècles « 2nd century BCE » ; guillemets “ ”.
- Titres d'œuvres françaises en italique entre astérisques **dans `contenu_vulgarise` seulement** (dans tous les autres champs : titre, accroche, carte, citation, repère, liens, questions, choix, explications, le titre s'écrit en clair, sans astérisque : les apps l'affichent tel quel), avec le titre anglais entre parenthèses à la première occurrence. Termes de droit français entre guillemets avec une glose anglaise à la première occurrence.
- Traduis aussi `citation.auteur`, `citation.source` et `carte.source_courte`.
- Glossaire : concept du jour = Today's concept ; fiche = entry (jamais « card », réservé à la carte partageable) ; carte partageable = share card ; série = streak ; Ce jour-là = On this day ; discipline = field ; épreuve = quiz.

**Citations et textes officiels : le point qui compte.** Tu as accès au web : tu ne retraduis plus une citation de mémoire.
- Si la citation (ou le texte officiel cité : loi, convention, arrêt, traité) existe en anglais : retrouve le texte anglais publié, recopie-le mot pour mot, mets l'adresse de la source anglaise dans `citation.url` (ou `repere.url`), adapte `auteur` et `source`, et pose le drapeau `citation-originale-anglaise` ou `texte-officiel-anglais`.
- Si l'original est français ou dans une autre langue et qu'aucune traduction anglaise publiée n'existe : traduis fidèlement et pose `citation-traduite` avec la raison en note.
- Jamais de citation anglaise reconstruite, résumée ou « à peu près ». Ne remplace jamais une formulation par « le texte publié » sans l'avoir sous les yeux.

**Drapeaux.** `citation-originale-anglaise` (info), `texte-officiel-anglais` (info), `citation-traduite` (à revoir), `texte-officiel-a-verifier`, `citation-langue-originale`, `incertain` (choix de traduction qui change le sens), `erreur-possible-fr` (voir ci-dessous).

**Si tu trouves une erreur dans le français pendant la traduction** (incohérence de chiffre, date, nombre de réponses d'un quiz…) : ne la corrige pas en silence et ne la recopie pas à l'identique sans le dire : écris `erreur-possible-fr` dans les drapeaux avec la note, et signale-la dans la sortie de la routine, pour que `controler` ou `réparer` la traite.

**Vérifie avant de livrer.** JSON valide ; mêmes chemins que le français ; mêmes `bonne_reponse` ; tous les chiffres du français retrouvés dans l'anglais ; aucune phrase restée en français (hors titres d'œuvres et citations en langue d'origine) ; dates à l'américaine ; `empreinte_fr` recalculée à l'instant.

**Un seul auteur par fiche, pas de collision.** Plusieurs jeux de routines poussent sur la même branche `main` (celles d'Arnaud et celles de Vincent). Règle : l'anglais d'une fiche est écrit par la routine qui vient d'écrire ou de retoucher le texte français de cette fiche, dans la même passe, et par personne d'autre. Avant de pousser : `git pull --rebase origin main`. Si le fichier anglais existe déjà et que son `empreinte_fr` est à jour, ne le touche pas. N'écris jamais de marqueurs de conflit dans un fichier : si un rebase échoue, arrête-toi et note-le dans la sortie de la routine au lieu de pousser.

**Livraison.** Même commit que la fiche française ou un commit voisin, message « Fiche EN : <slug> ». Ne modifie pas la fiche française à cause de la traduction.

## Outils
- `outils/empreinte-fr.mjs` : empreinte des textes français traduisibles d'une fiche (`node outils/empreinte-fr.mjs content/concepts/<discipline>/<slug>.json`). Elle ne change pas quand seuls le statut, la validation ou le contrôle changent.
- `outils/atraduire.mjs` (`npm run atraduire`) : l'état de chaque fiche et le prochain lot d'une voie.
- Un rattrapage de 429 fiches (anglais américain, relu mécaniquement : chiffres, dates, quiz) a été copié ici le 2026-11-18 ; leurs 141 citations retraduites depuis le français portent le drapeau `citation-traduite` et sont à remplacer par l'original anglais publié.

## Routine de rattrapage (une par voie)
Sert à traduire les fiches qu'aucune autre routine ne touche (l'anglais des fiches nouvelles ou retouchées, lui, est écrit par la routine qui écrit ou retouche le français). Prompt de la routine de la voie « vincent » (le droit) ; pour une autre voie, remplacer `vincent`.
1. Dans le dépôt : `git status --short` doit être vide (sinon s'arrêter et le dire), puis `git pull --rebase origin main`.
2. `npm run atraduire -- --pour vincent --max 10 --json`. Si la liste est vide (« Rien à traduire. »), s'arrêter : aucun commit.
3. Pour chaque fiche de la liste : lire la fiche française, écrire `content/concepts-en/<discipline>/<slug>.json` selon la section « Écrire aussi la fiche en anglais » ci-dessus. Pour le droit : retrouver sur le web le texte officiel anglais de chaque loi, convention, arrêt ou traité cité (ONU, OIT, Cornell, EUR-Lex…), le recopier mot pour mot avec son adresse ; sinon traduire et poser le drapeau.
4. `npm run validate` et `npm test` à zéro erreur ; un commit « Rattrapage anglais : N fiches (droit) » ; `git pull --rebase origin main` puis `git push origin HEAD:main` (si le push est refusé : re-pull et re-push une fois, jamais de force, et s'arrêter si le rebase échoue).
5. Rendre compte : fiches traduites, drapeaux posés, et `npm run atraduire -- --pour vincent --stats` (ce qu'il reste).
Rythme proposé : 2 passages par jour, à des heures où aucune autre routine du même compte ne tourne ; 176 fiches de droit à raison de 10 par passage = environ 9 jours. Modèle : Claude Sonnet 5.5, réglage par défaut. Appliquer la règle d'usage habituelle des routines.

## Fichier signé à deux langues (mécanisme livré, ÉTEINT)
`src/traduction.js` (garde et projection), appelé par `src/publier.js` (`publication`), donc par `npm run site` **et** `npm run export` : une seule projection pour le fichier reçu et l'embarqué.

- **Variable `ANAGNOSIS_LANGUES`** : absente, vide ou `fr` (défaut) = le fichier est identique, octet pour octet, à celui d'avant (`test/traduction.test.js`). `fr,en` ajoute un objet `en` à chaque concept dont l'anglais est sûr. Toute autre valeur arrête la construction.
- **`en` ne porte que les champs traduits** (`titre`, `accroche`, `contenu_vulgarise`, `citation`, `repere`, `carte`, `pour_aller_plus_loin`, `quiz`, `quiz_supplementaire`, ceux qui sont non nuls). Ni audio, ni drapeaux, ni `empreinte_fr`. Le français seul fait foi pour les identifiants, `retirees`, `genere_le`, l'ordre et l'audio ; ôter `en` de chaque concept redonne exactement le fichier français.
- **La garde** : sans `en` (repli sur le français, fiche par fiche, jamais d'erreur de construction) si la version anglaise est absente, illisible, en double, d'identité fausse, **périmée** (`empreinte_fr` différente), de forme différente, d'**adresses** différentes sans drapeau de source anglaise, de **quiz** différent (`bonne_reponse`, nombre de choix, nombre de questions), ou portant un **drapeau** autre que `citation-originale-anglaise` / `texte-officiel-anglais`. Réglages : `ANAGNOSIS_EN_DRAPEAUX_TOLERES=citation-traduite,…` (types de drapeaux de plus acceptés) et `ANAGNOSIS_EN_RELU=1` (exige `relu: true`).
- Chaque construction affiche le compte rendu (avec / sans / refusées par motif).
- **Pour allumer** : poser `ANAGNOSIS_LANGUES=fr,en` dans `.github/workflows/publier-site.yml` (étape « Construire »), retirer l'exclusion `!content/concepts-en/**` des `paths`, décider des drapeaux tolérés et de l'exigence de relecture, et que les apps lisent `en` (choix de la langue, repli par fiche, pas d'audio).
- **Taille** : le fichier passe de 12,96 Mo (français) à environ 16,7 Mo avec les 516 fiches anglaises à jour (+7,2 Ko par fiche, soit environ 20 Mo pour 982) ; limite d'un fichier statique Cloudflare : 25 MiB.
