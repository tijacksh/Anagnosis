# Prise en main pour Vincent : hébergement Cloudflare

Depuis le 2026-10-11, le site `anagnosis.fr` et le flux signé que lisent les apps ne sont plus chez Netlify (les crédits de déploiement étaient épuisés) mais chez Cloudflare. Pour toi, presque rien ne change.

## Ce que tu fais comme avant
- Tu pousses sur `main` (contenu, fiches, site). La publication est automatique : GitHub Actions (`Publier le site`) construit, signe le flux et le dépose sur Cloudflare, à chaque poussée utile et toutes les 4 heures.
- Pour forcer une publication : `gh workflow run publier-site.yml`.
- Contrôle : https://anagnosis.fr/contenu/concepts.json (+ `.sig`) doit répondre, et l'onglet Actions du dépôt doit être vert.

## Compter les inscriptions à la liste d'attente
1. Copie `docs/acces/decompte.jeton` (dans ce dépôt privé) vers `~/.anagnosis/decompte.jeton` : `mkdir -p ~/.anagnosis && cp docs/acces/decompte.jeton ~/.anagnosis/`.
2. Lance `node reseaux/inscriptions.js` (option `--depuis AAAA-MM-JJ`). Tu obtiens le total et la répartition par réseau (ig, tt, x, direct). Aucune adresse e-mail n'est affichée.

Ce jeton ne donne que le décompte. S'il fuit : `npx wrangler secret put CLE_DECOMPTE --config worker/wrangler-site.toml` avec une nouvelle valeur, et remplace le fichier dans `docs/acces/` et dans `~/.anagnosis/`.

## Cloudflare (optionnel)
Tu peux être invité au compte Cloudflare pour voir le Worker `anagnosis-site`, la base D1 des inscriptions, le bucket R2 des audios et le DNS. Pas nécessaire pour publier.

## À ne pas toucher
- Le DNS : les MX et le SPF ImprovMX (courrier `contact@anagnosis.fr`) et les TXT de vérification TikTok.
- Les enregistrements AAAA de l'apex et de `www` (gérés par le rattachement au Worker).
- La clé de signature : `ANAGNOSIS_CLE_PRIVEE` reste dans les secrets GitHub, jamais dans le dépôt.

Détails techniques : `docs/hebergement.md` ; raisons du choix : `docs/decisions.md` (2026-10-11).
