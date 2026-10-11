# Hébergement : anagnosis.fr sur Cloudflare

Depuis le 2026-10-11 (raisons : `docs/decisions.md`).

| Élément | Où | Comment |
|---|---|---|
| Vitrine + `contenu/concepts.json(.sig)` | Worker `anagnosis-site`, fichiers statiques | `npm run site`, puis `wrangler deploy --config worker/wrangler-site.toml` |
| Publication | GitHub Actions `publier-site.yml` | à chaque poussée utile, toutes les 4 h, ou `gh workflow run publier-site.yml` |
| Inscriptions | Worker, table D1 `inscriptions` | `POST /inscription` ; décompte : `node reseaux/inscriptions.js` |
| Courrier `contact@anagnosis.fr` | ImprovMX (MX + SPF dans le DNS) | inchangé, recopié dans la zone Cloudflare |
| Domaine | `anagnosis.fr` et `www` rattachés au Worker (Domains & Routes) | achat chez OVH, serveurs de noms Cloudflare (`cash`/`keyla`), bascule faite le 2026-10-11 |

Test sans toucher au domaine : `https://anagnosis-site.anagnosis.workers.dev`.

Vérifier que le flux est valide pour les apps : télécharger `contenu/concepts.json` et `.sig` et contrôler la signature Ed25519 avec la clé publique de `ContenuDistant.swift`.

Poser le jeton du décompte : `wrangler secret put CLE_DECOMPTE --config worker/wrangler-site.toml` (valeur dans `~/.anagnosis/decompte.jeton`).

Enregistrements DNS à garder (relevé du 2026-10-11) : MX `mx1.improvmx.com` (10) et `mx2.improvmx.com` (20) sur l'apex ; TXT SPF `v=spf1 include:spf.improvmx.com ~all` sur l'apex ; TXT `tiktok-developers-site-verification=…` ×2 sur `www`.

## État de la bascule (2026-10-11)

Faite : zone Cloudflare active, enregistrements A vers Netlify supprimés, domaines rattachés au Worker, flux vérifié (signature valide, 630 fiches), formulaire et décompte testés, courrier inchangé. Les 2 inscriptions Netlify étaient déjà dans D1.

Netlify : construction automatique arrêtée (`stop_builds`) sur le site `nimble-zabaione-e694b6`, `netlify.toml` et le secret `NETLIFY_BUILD_HOOK` retirés. Le site n'est pas supprimé : on peut le garder quelques semaines comme filet, puis le supprimer depuis l'interface Netlify.

## Travailler à deux (Vincent)

- Contenu : il pousse sur `main` comme avant ; la publication est automatique (GitHub Actions).
- Cloudflare : l'inviter au compte (Manage account > Members) pour le Worker, D1, R2 et le DNS.
- Décompte des inscriptions : lui transmettre `decompte.jeton` par un canal sûr, à placer dans `~/.anagnosis/`.
