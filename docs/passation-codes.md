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

**Garanti aussi (depuis le 2026-08-27)** : la réponse est signée en Ed25519
(`code|jours|horodatage`, secret `CLE_SIGNATURE`), et les deux apps refusent une
réponse dont la signature ne vérifie pas ou dont l'horodatage a plus de cinq minutes.
Sans ça, n'importe quelle app de proxy posée sur son propre appareil — sans root ni
jailbreak, un geste à la portée de beaucoup plus de monde qu'un binaire repatché —
pouvait réécrire `{"jours":30}` en `{"jours":99999}` en clair sur le réseau, et l'app
n'avait aucun moyen de le voir. Vérifié en direct : signature capturée sur le fil,
revérifiée indépendamment avec les 32 octets bruts de la clé publique (Node d'un
côté, BouncyCastle de l'autre) — et un vrai échange, du bouton de l'app jusqu'au
compteur D1, sur un appareil dont l'horloge était sciemment fausse pour confirmer que
la fenêtre de fraîcheur rejette bien une réponse trop ancienne.

**Non garanti** : rien n'empêche quelqu'un contrôlant pleinement son propre appareil —
root, jailbreak, binaire repatché — de s'accorder Premium sans jamais appeler le
Worker. Même limite que documentée dans `Atelier.swift` pour la bascule de
démonstration : ni la signature ni le plafond ne sont une frontière de sécurité contre
un appareil hostile. Ce qu'ils ferment, c'est l'interception réseau la plus
accessible — un utilisateur sans outils particuliers ne peut plus se distribuer
Premium en modifiant une réponse en clair.

### La clé de signature

Générée le 2026-08-27, **distincte** de celle du contenu (`ContenuDistant`) : deux
domaines de confiance séparés, pour qu'une rotation de l'une ne touche jamais l'autre.

- Privée (PKCS8 DER, base64) : `~/.anagnosis/signature-codes-privee.pem`, et dans le
  seul secret Cloudflare `CLE_SIGNATURE` — jamais dans un dépôt.
- Publique (32 octets bruts, base64) : `~/.anagnosis/signature-codes-publique.b64`,
  et embarquée en dur dans les deux apps (`CodePromo.swift`, `CodePromo.kt`).

Régénérer la paire (rotation) :

```bash
node -e "
const crypto = require('node:crypto');
const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519');
console.log('privee_pkcs8_b64=' + privateKey.export({ type: 'pkcs8', format: 'der' }).toString('base64'));
const pubDer = publicKey.export({ type: 'spki', format: 'der' });
console.log('publique_brute_b64=' + pubDer.subarray(pubDer.length - 32).toString('base64'));
"
```

Poser la nouvelle clé privée : `wrangler secret put CLE_SIGNATURE --config
wrangler-codes.toml`. La nouvelle clé publique doit être recopiée dans les deux apps
et publiée avant, ou une régénération invalide toute réponse en circulation tant que
les deux ne sont pas à jour.

## Redéployer le Worker

```bash
cd worker
CLOUDFLARE_API_TOKEN=... CLOUDFLARE_ACCOUNT_ID=... npx wrangler deploy --config wrangler-codes.toml
```

Le secret `CLE_PARTAGEE` (même valeur que `ANAGNOSIS_CLE_AUDIO_PARTAGEE`, celui
d'`audio.js`) survit à un redéploiement — pas besoin de le reposer sauf s'il change.
