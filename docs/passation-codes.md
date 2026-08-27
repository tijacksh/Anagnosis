# Codes promotionnels — passation

Déployé le 2026-08-27. `worker/codes.js`, sur `https://anagnosis-codes.anagnosis.workers.dev`
(`worker/wrangler-codes.toml`, base D1 `anagnosis-codes`, liaison `DB`). Décision et
raisons dans `docs/decisions.md`.

## Créer un code

Aucun outil dédié : `wrangler d1 execute` suffit, et un outil de plus serait une
surface de plus à maintenir pour un geste rare.

```bash
cd worker
CLOUDFLARE_API_TOKEN=... CLOUDFLARE_ACCOUNT_ID=... npx wrangler d1 execute anagnosis-codes \
  --remote --config wrangler-codes.toml \
  --command "INSERT INTO codes (code, max, jours) VALUES ('ANAG-XXXX-XXXX', 50, 30)"
```

(variables déjà dans `~/.anagnosis/cles.env` : `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`)

- `code` — ce que le lecteur saisit dans l'app. Assez long et aléatoire pour ne pas se
  deviner : la forme acceptée par le Worker est 6 à 20 caractères, lettres et chiffres.
- `max` — combien de fois ce code peut être échangé, au total, tous appareils confondus.
- `jours` — combien de jours de Premium chaque échange accorde, à partir du jour de
  l'échange (pas du jour de création du code).

## Vérifier un code

```bash
npx wrangler d1 execute anagnosis-codes --remote --config wrangler-codes.toml \
  --command "SELECT code, max, utilises, jours FROM codes WHERE code = 'ANAG-XXXX-XXXX'"
```

## Ce que le Worker garantit, et ce qu'il ne garantit pas

**Garanti** : `utilises` ne dépasse jamais `max`, y compris sous deux tentatives
simultanées — l'échange est un `UPDATE ... WHERE utilises < max`, pas une lecture
suivie d'une écriture. Vérifié en direct à l'issue du déploiement (deux requêtes
concurrentes sur un code à une seule utilisation, un seul gagnant, `utilises = 1`).

**Non garanti** : rien n'empêche quelqu'un de patcher son app pour s'accorder Premium
sans jamais appeler le Worker — même limite que documentée dans `Atelier.swift` pour
la bascule de démonstration. Ce n'est pas une frontière de sécurité contre un appareil
hostile, seulement ce qui rend un plafond de distribution réel plutôt qu'indicatif.

## Redéployer le Worker

```bash
cd worker
CLOUDFLARE_API_TOKEN=... CLOUDFLARE_ACCOUNT_ID=... npx wrangler deploy --config wrangler-codes.toml
```

Le secret `CLE_PARTAGEE` (même valeur que `ANAGNOSIS_CLE_AUDIO_PARTAGEE`, celui
d'`audio.js`) survit à un redéploiement — pas besoin de le reposer sauf s'il change.
