# [Nom provisoire] — Brief produit pour Claude Code

> Ce document est fait pour être donné en contexte à Claude Code (à placer dans `docs/brief-produit.md` du futur repo). Il couvre le produit, le contenu, la stack et le modèle économique. Les points encore ouverts sont listés en §14.

## 1. Pitch

Une app qui remplace le scroll passif par l'apprentissage actif : chaque jour, une notion ou un concept (philosophie, sociologie, anthropologie, psychologie, biologie, mathématiques, physique, littérature...) expliqué simplement, illustré et sourcé — à lire en 2-3 minutes pendant un temps mort (transport, file d'attente, pause).

## 2. Le problème

- Lassitude croissante vis-à-vis du scroll passif et de la "culture du vide"
- Beaucoup de temps mort quotidien sur mobile (transports, salle d'attente, ennui) actuellement occupé par du contenu qui n'apporte rien
- Le besoin est réel — mais voir §3 : plusieurs apps y répondent déjà, avec des résultats inégaux

## 3. Paysage concurrentiel — à connaître avant de se lancer

Le terrain n'est pas vierge. Repères utiles :

- **Nibble, Mindsnap, SmartyMe, Learny, Keydle** (US) : format quasi identique — un concept/une leçon par jour, plusieurs disciplines, notifications, streaks. Keydle (encore en pré-lancement) a un pitch très proche : un concept plutôt qu'un scroll infini.
- **Imprint** : différenciation par l'illustration/l'animation, plutôt orienté format long que "1/jour" strict.
- **Brilliant** : très qualitatif mais concentré sur les sciences dures (maths, code, logique), pas généraliste.
- **En France** : "Ça m'intéresse" (anecdote du jour + notif), "GenK" (1 minute/jour), "Sapio", "Qulture", "Mémorable" (Le Monde, avec répétition espacée). La plupart restent sur un format quiz/anecdote plutôt qu'une vraie explication de fond sourcée, et aucun ne structure sa taxonomie autour de disciplines académiques comme proposé ici.

**Angle différenciant recommandé :**
- **Profondeur + rigueur des sources** plutôt que du trivia — c'est l'angle le moins occupé du marché
- **Cadence stricte 1/jour, sans possibilité de "binge"** — la plupart des concurrents laissent enchaîner les leçons librement, ce qui reproduit le mécanisme même qu'on cherche à combattre. Un vrai verrou (un seul concept accessible par jour) est plus radical et plus cohérent avec la proposition de valeur
- **Exigence visuelle et éditoriale** — dans une catégorie où le design est souvent générique, une identité visuelle vraiment travaillée est un vrai différenciateur

## 4. Public cible

Urbains 25-45 ans, déjà sensibilisés à la fatigue numérique (le type de profil qui a déjà essayé une app de méditation ou de "digital detox"), curieux généralistes plutôt que spécialistes, trajets domicile-travail quotidiens en transports en commun.

## 5. Fonctionnalités — MVP (V1)

- **Onboarding** : sélection des disciplines d'intérêt parmi la taxonomie de départ
- **Concept du jour** : notification à une heure choisie, fiche complète (titre, texte vulgarisé, illustration, citation, sources, "pour aller plus loin"), un seul concept accessible par jour
- **Profil / stats** : streak actuel, répartition en % par discipline vue, archive des jours passés (accès limité en gratuit, complet en premium — voir §12)
- **Réglages** : heure de notification, disciplines actives

## 6. Fonctionnalités — V1.5 / plus tard

- Quiz flash facultatif après lecture (renforce la mémorisation sans dénaturer l'esprit "lecture calme")
- Partage social : génération d'une carte-image du concept du jour, pour la viralité organique
- Répétition espacée : relance ponctuelle d'anciens concepts pour ancrer la mémorisation
- Mode audio (lecture du concept)
- Packs thématiques en achat unique (voir §12)

## 7. Disciplines (taxonomie de départ)

Philosophie, Sociologie, Anthropologie, Psychologie, Biologie, Mathématiques, Physique / Physique quantique, Littérature.

Extensions possibles à prévoir dans le modèle de données dès le départ (même si non lancées en V1) : Histoire, Économie, Histoire de l'art, Astronomie.

## 8. Modèle de données (pistes de départ)

```
User
- id, email, date_inscription
- disciplines_actives: [liste]
- heure_notification_preferee

Concept
- id, titre, discipline
- niveau (optionnel : introductif / intermédiaire)
- contenu_vulgarise
- citation, citation_auteur
- sources: [liste de références]
- illustration_url
- pour_aller_plus_loin: [liens optionnels]
- statut (brouillon / validé / rejeté)
- date_publication_prevue

Quiz
- id, concept_id
- question, choix: [liste], bonne_reponse
- statut (brouillon / validé / rejeté)

UserProgress
- user_id, concept_id, date_vue

UserStats (dérivé)
- streak_actuel, streak_record
- repartition_par_discipline (%)
- total_concepts_vus

Subscription
- user_id, statut (gratuit/premium)
- type (mensuel/annuel/pack)
- date_expiration
```

## 9. Pipeline de contenu — architecture retenue

Décision actée : zéro API externe, y compris pour la génération. Tout tourne via un projet Claude Code dédié (séparé du repo de l'app), qui génère le contenu en semi-autonomie ; l'intégration dans l'app reste toujours soumise à validation manuelle.

**Le flux :**

1. **Génération** : un projet Claude Code à part (pas le repo de l'app iOS) tourne en semi-autonomie pour produire des brouillons de fiches concepts (texte vulgarisé, sources, citation) et de quiz associés, discipline par discipline. Claude Code peut s'appuyer sur sa capacité de recherche web pour proposer des sources réelles et vérifiables plutôt que de s'appuyer uniquement sur ses connaissances internes — un vrai plus pour la fiabilité factuelle
2. **Validation Admin** : chaque brouillon (fiche + quiz) passe par un vrai outil de validation dédié — pas un script — sur le même principe que l'outil existant pour la KB du radar. Vue "file d'attente" par discipline, aperçu complet (texte + illustration + sources + quiz), actions valider / rejeter / renvoyer en retouche
3. **Intégration à la base de connaissance** : une fois validé, le contenu passe de "brouillon" à "publié" et devient visible par l'app
4. **L'app (client iOS)** ne fait strictement aucun appel API, ni à la génération ni en cours d'usage : elle lit uniquement la base de connaissance déjà validée

Deux systèmes bien distincts à garder en tête pour la stack (§11) :
- **Pipeline génération + validation** : usage interne, faible trafic — peut tourner en local ou sur le NAS sans souci de charge
- **Backend de l'app** : usage public, doit être fiable pour tous les utilisateurs — c'est lui qui a la contrainte d'hébergement évoquée en §11

Avec 8 disciplines et un usage quotidien, prévoir un stock de départ d'au moins 200-300 fiches validées (60-90 jours d'avance) avant le lancement public, puis un rythme de production continu via Claude Code.

## 10. Illustrations

Même principe que le texte : générées en amont via le même projet Claude Code, jamais en direct dans l'app.

- **Génération IA locale** (déjà testé : Draw Things / ComfyUI, FLUX.1 Dev, Qwen Image) — contrôle total, coût marginal nul une fois le setup fait. Le vrai défi : garder un style cohérent sur des centaines d'illustrations (prompt de style fixe, voire LoRA dédié)
- **Connecteur `AI:generate_image`** (déjà utilisé pour Clara) — plus simple à mettre en œuvre, mais pensé à l'origine pour du visuel de personnage/lifestyle, probablement à adapter pour de l'illustration conceptuelle/abstraite
- **Identité visuelle fixe conçue par Claude Design** — un système d'illustration (formes, palette, grille) défini une fois, puis décliné pour chaque concept

## 11. Stack technique — hypothèses de départ

- **Plateforme : iOS natif (Swift/SwiftUI) pour démarrer**, Android envisagé dans un second temps — le backend/API doit rester agnostique de la plateforme dès le départ pour que l'ajout d'un client Android plus tard soit un nouveau front, pas une refonte
- **Exigence non négociable** : le rendu final ne doit jamais être identifiable comme "généré par IA" (même exigence que sur Gabarit) — direction artistique confiée à Claude Design, Claude Code sur l'ingénierie, et à rappeler explicitement lors du Lot 5
- **Backend de l'app** : attention, le NAS (4 Go de RAM) fait déjà tourner deux services en parallèle (Clara + radar) avec une contrainte RAM déjà identifiée. Pour le backend public (celui que l'app iOS interroge), un hébergement léger et géré (type Supabase ou Firebase : auth, base de données, stockage et notifications push inclus) est plus sûr pour le MVP, quitte à rapatrier sur le NAS plus tard une fois la charge mieux connue
- **Pipeline génération + validation** : usage interne, faible trafic — peut tourner directement sur le NAS aux côtés de Clara et du radar, ou même en local le temps du développement, sans les mêmes contraintes de disponibilité que le backend public
- **Notifications push** nécessaires pour le rituel quotidien
- **Repo** : nouveau dépôt séparé, avec ce brief dans `docs/`, et un `CLAUDE.md` généré via `/init` une fois le squelette posé

## 12. Modèle économique

Contrainte de départ : pas de publicité, monétisation par abonnement et/ou achat unique.

**Gratuit — pour toujours**
- 1 concept du jour, dans les disciplines choisies
- Profil + stats de base (streak, % par discipline)

C'est le cœur de la proposition de valeur ("remplacer le scroll") : le rendre payant tuerait l'adoption et le bouche-à-oreille, principal moteur de croissance d'une app gratuite dans cette catégorie.

**Premium — abonnement (ex. 4,99€/mois ou 39,99€/an)**
- Archive complète (relire tous les concepts déjà publiés)
- Garantie de non-répétition étendue
- Contenu bonus : version audio, "pour aller plus loin" étoffé
- Notifications avancées

**Packs thématiques — achat unique (ex. 2,99–4,99€/pack)**
- Pour approfondir un sujet précis sans s'abonner ("Philosophie antique", "Physique quantique pour les nuls"...) — bonne passerelle vers l'abonnement

**Repères de prix marché (mi-2026)** : Duolingo Super ~96$/an, Blinkist ~100-180$/an, Keydle (concurrent direct, pré-lancement) ~70$/an. Pour une app grand public pas encore installée en France, démarrer plus bas (30-40€/an) pour lever la friction à l'essai, puis ajuster une fois la traction confirmée.

**Piste plus lointaine** : licences B2B (formation continue / marque employeur — Duolingo for Business se vend par exemple ~50-68$/apprenant/an), un modèle proche de la formation professionnelle en entreprise.

## 13. Approche de développement recommandée (par lots)

- **Lot 0** — Projet Claude Code de génération + vrai outil de validation Admin (une interface dédiée dès le départ, pas un script). Produire et valider 20-30 fiches concepts et leurs quiz via ce pipeline complet avant d'écrire une ligne d'UI côté app : si le contenu n'est pas bon, rien d'autre ne compte
- **Lot 1** — Squelette app : navigation, onboarding, sélection des disciplines
- **Lot 2** — Concept du jour : affichage de la fiche, notification quotidienne
- **Lot 3** — Profil, stats, streak, archive
- **Lot 4** — Abonnement / paywall / achats
- **Lot 5** — Passage Claude Design pour la direction artistique et le polish visuel

## 14. Décisions à confirmer avant de lancer Claude Code

- [x] Plateforme : iOS natif pour démarrer, Android envisagé ensuite
- [x] Pipeline de contenu : projet Claude Code dédié (génération) + vrai outil de validation Admin dès le Lot 0, zéro API externe, app en prod sans aucun appel API
- [ ] Nom de l'app
- [ ] Prix précis des paliers premium
- [ ] Les 8 disciplines dès le lancement, ou un sous-ensemble pour aller plus vite ?

## 15. Comment utiliser ce brief avec Claude Code

Le pipeline de génération (Lot 0) et l'app iOS sont deux projets séparés (voir §9) — on démarre par le premier.

1. Créer un nouveau dépôt pour le pipeline de génération + outil de validation, y placer ce fichier dans `docs/brief-produit.md`
2. Lancer Claude Code dans ce dépôt et démarrer directement sur le Lot 0, par exemple :
   > « Lis docs/brief-produit.md pour le contexte complet du projet. On démarre uniquement le Lot 0 : le pipeline de génération de contenu (fiches + quiz) et l'outil de validation Admin. Génère et fais-moi valider un premier lot de 5-10 fiches sur [discipline] avant d'aller plus loin. »
3. Une fois ce projet posé, lancer `/init` pour générer un `CLAUDE.md` de départ, puis le compléter (stack, commandes, renvoi vers `docs/brief-produit.md`)
4. Créer le dépôt de l'app iOS séparément une fois le Lot 0 validé (mêmes étapes : brief dans `docs/`, `/init`, démarrage sur le Lot 1)
5. Comme pour Gabarit, rappeler explicitement à Claude Code et Claude Design l'exigence de ne pas avoir un rendu "généré par IA" une fois la partie visuelle attaquée (Lot 5)

## 16. Bonus — quelques pistes de nom

Dans le même esprit que Gabarit, Verdict, Cadence, Locus, Echo : **Kaïros** (le "moment opportun" en grec — cohérent thématiquement), **Sillon**, **Lucide**, **Aparté**, **Butineur**.
