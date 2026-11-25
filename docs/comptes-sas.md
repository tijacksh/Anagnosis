# Comptes développeur au nom de CVLASTUDIO SAS

Établi le 2026-11-25, après l'immatriculation (Kbis du 25/11/2026). Les apps sont encore sur les comptes personnels d'Arnaud Louvigny ; ce document donne l'ordre des étapes et les données à saisir.

## Les données de la société (Kbis)

| Champ | Valeur |
|---|---|
| Dénomination exacte | CVLASTUDIO |
| Forme | Société par actions simplifiée, capital 2 € |
| RCS / SIREN | 133 377 481 R.C.S. Paris (immatriculée le 25/11/2026) |
| EUID | FR7501.133377481 |
| Siège (domiciliation SeDomicilier SAS) | 173 rue de Courcelles, 75017 Paris, France |
| Président | Arnaud Louvigny |
| Directeur général | Vincent Charbonnier |
| Site | cvlastudio.com — contact@cvlastudio.com |

Apple n'accepte que la dénomination juridique exacte : pas de nom de marque, pas « CVLASTUDIO SAS ».

## Ordre des étapes

1. **Numéro D-U-N-S** (gratuit, jusqu'à 5 jours ouvrés chez Dun & Bradstreet, puis jusqu'à 2 jours pour qu'Apple le reçoive). Le passage se fait par l'outil de recherche d'Apple, connecté à l'identifiant Apple du développeur : developer.apple.com/enroll/duns-lookup. Chercher d'abord (la société a pu être créée dans la base D&B par le greffe) ; sinon, l'outil propose d'envoyer la demande à D&B. Pour une société d'un jour, D&B peut demander le Kbis : le PDF est à portée de main.
2. **Apple Developer Program, inscription Organisation** (99 €/an, payés par la société). Il faut le D-U-N-S, un identifiant Apple dédié à la société (pas l'identifiant personnel), une double authentification, et un appel de vérification d'Apple au signataire (le Président).
3. **Transfert des apps** de l'ancien compte vers le nouveau (App Store Connect, Apps > Informations de l'app > Transférer l'app). Les abonnements suivent l'app. Conditions : pas de version en revue, accords en ordre des deux côtés.
4. **Accords Apple du nouveau compte** : Apps payantes, coordonnées bancaires et fiscalité (IBAN de la société, données du Président). À saisir par Arnaud.
5. **Google Play Console, compte Organisation** : même D-U-N-S, 25 $ une fois, vérification d'identité du Président. Puis profil de paiement Google (IBAN de la société, fiscalité) : à saisir par Arnaud. Puis transfert de l'app depuis Play Console (Paramètres > Transférer l'app).
6. **Relancer** `Anagnosis-android/outils/creer-abonnements-play.py` quand le profil de paiement existe ; finir la capture de revue Apple des abonnements.
7. **CNPM** : adhérer au nom de la société, puis publier ses coordonnées dans `site/conditions.html` (voir la mémoire du projet).
8. Quand les comptes sont transférés : retirer des pages légales la phrase « diffusée à ce jour depuis les comptes de développeur d'Arnaud Louvigny, en cours de transfert à la société » (site anagnosis.fr et pages `mentions-legales/*` de cvlastudio.com).

## Ce qui reste personnel à Arnaud

L'identifiant Apple et le compte Google, les mots de passe, les codes de vérification, les coordonnées bancaires, l'appel de vérification d'Apple.
