/**
 * Le transport signé vers Cloudflare R2 — écrit à la main, sans SDK AWS.
 *
 * R2 expose une API compatible S3 : la signature `AWS4-HMAC-SHA256` (SigV4) suffit à
 * s'authentifier, avec `node:crypto` et rien de plus. Un SDK apporterait des dizaines
 * de dépendances transitives pour un usage aussi étroit qu'un PUT — contraire
 * à la contrainte zéro dépendance runtime du pipeline (CLAUDE.md).
 *
 * Le bucket est **privé** : ceci ne fait que déposer les fichiers. Ce qui les sert au
 * lecteur — validation du reçu d'abonnement, URL signée ou proxy — est un Worker
 * Cloudflare distinct, pas encore construit (`docs/passation-audio.md`).
 */
import { createHash, createHmac } from 'node:crypto';

export const CLES_ENV = ['R2_ACCOUNT_ID', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY'];
const BUCKET_DEFAUT = 'anagnosis-audio';
const REGION = 'auto';
const SERVICE = 's3';

/** La config vient de l'environnement — jamais du dépôt. Lève tôt si elle manque. */
export function config() {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error(`${CLES_ENV.join(', ')} absentes de l'environnement`);
  }
  return {
    accountId, accessKeyId, secretAccessKey,
    bucket: process.env.R2_BUCKET || BUCKET_DEFAUT,
    hote: `${accountId}.r2.cloudflarestorage.com`,
  };
}

function hmac(cle, message) {
  return createHmac('sha256', cle).update(message, 'utf8').digest();
}

/** La chaîne de dérivation SigV4 : date → région → service → requête. */
function cleDeSignature(secretAccessKey, dateStamp) {
  const kDate = hmac(`AWS4${secretAccessKey}`, dateStamp);
  const kRegion = hmac(kDate, REGION);
  const kService = hmac(kRegion, SERVICE);
  return hmac(kService, 'aws4_request');
}

/**
 * Construit les en-têtes d'une requête signée pour `methode` sur `cle` (le chemin de
 * l'objet dans le bucket). Séparé de l'appel réseau pour rester testable sans réseau :
 * étant donné les mêmes entrées (y compris `maintenant`), la sortie est déterministe.
 */
export function signer({ methode, cle, corps = Buffer.alloc(0), maintenant = new Date() }) {
  const { accountId, accessKeyId, secretAccessKey, bucket, hote } = config();
  const amzDate = maintenant.toISOString().replace(/[:-]|\.\d{3}/g, '');
  const dateStamp = amzDate.slice(0, 8);
  const hashCorps = createHash('sha256').update(corps).digest('hex');
  const cheminEncode = `/${bucket}/${cle.split('/').map(encodeURIComponent).join('/')}`;

  const entetesSignes = ['host', 'x-amz-content-sha256', 'x-amz-date'];
  const entetesCanoniques = `host:${hote}\nx-amz-content-sha256:${hashCorps}\nx-amz-date:${amzDate}\n`;

  const requeteCanonique = [
    methode, cheminEncode, '', entetesCanoniques, entetesSignes.join(';'), hashCorps,
  ].join('\n');

  const portee = `${dateStamp}/${REGION}/${SERVICE}/aws4_request`;
  const aSigner = [
    'AWS4-HMAC-SHA256', amzDate, portee,
    createHash('sha256').update(requeteCanonique).digest('hex'),
  ].join('\n');

  const signature = hmac(cleDeSignature(secretAccessKey, dateStamp), aSigner).toString('hex');
  const autorisation = `AWS4-HMAC-SHA256 Credential=${accessKeyId}/${portee}, `
    + `SignedHeaders=${entetesSignes.join(';')}, Signature=${signature}`;

  return {
    url: `https://${hote}${cheminEncode}`,
    entetes: {
      host: hote,
      'x-amz-content-sha256': hashCorps,
      'x-amz-date': amzDate,
      authorization: autorisation,
    },
  };
}

async function requete(methode, cle, { corps, typeContenu } = {}) {
  const { url, entetes } = signer({ methode, cle, corps });
  if (typeContenu) entetes['content-type'] = typeContenu;
  return fetch(url, { method: methode, headers: entetes, body: corps });
}

/** Dépose `corps` sous `cle`. Écrase sans avertir : à l'appelant de vérifier avant. */
export async function televerser(cle, corps, { typeContenu = 'application/octet-stream' } = {}) {
  const r = await requete('PUT', cle, { corps, typeContenu });
  if (!r.ok) {
    throw new Error(`R2 PUT ${cle} — ${r.status} ${(await r.text()).slice(0, 200)}`);
  }
}
