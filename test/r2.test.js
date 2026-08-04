/**
 * La signature SigV4 vers R2 est écrite à la main (`src/r2.js`) : pas de SDK AWS pour
 * un usage aussi étroit qu'un PUT (contrainte zéro dépendance du pipeline). Ces tests
 * ne vérifient pas la requête réseau — aucun accès à R2 n'est nécessaire pour les
 * lancer — seulement que `signer` produit une autorisation cohérente et sensible à ce
 * qui doit la changer.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { signer } from '../src/r2.js';

const ENV = {
  R2_ACCOUNT_ID: 'abc123',
  R2_ACCESS_KEY_ID: 'AKIDEXAMPLE',
  R2_SECRET_ACCESS_KEY: 'secretdetest',
  R2_BUCKET: 'anagnosis-audio',
};

function avecEnv(fn) {
  const avant = { ...process.env };
  Object.assign(process.env, ENV);
  try { return fn(); } finally {
    for (const cle of Object.keys(ENV)) delete process.env[cle];
    Object.assign(process.env, avant);
  }
}

const MAINTENANT = new Date('2026-08-04T11:30:00.000Z');

test('signer produit une autorisation SigV4 bien formée', () => {
  avecEnv(() => {
    const { url, entetes } = signer({ methode: 'PUT', cle: 'audio/x--helene.m4a', maintenant: MAINTENANT });
    assert.equal(url, 'https://abc123.r2.cloudflarestorage.com/anagnosis-audio/audio/x--helene.m4a');
    assert.match(
      entetes.authorization,
      /^AWS4-HMAC-SHA256 Credential=AKIDEXAMPLE\/20260804\/auto\/s3\/aws4_request, SignedHeaders=host;x-amz-content-sha256;x-amz-date, Signature=[0-9a-f]{64}$/,
    );
    assert.equal(entetes['x-amz-date'], '20260804T113000Z');
  });
});

test('le hash du corps signé est celui du corps réel', () => {
  avecEnv(() => {
    const corps = Buffer.from('un fichier audio');
    const { entetes } = signer({ methode: 'PUT', cle: 'audio/x--helene.m4a', corps, maintenant: MAINTENANT });
    assert.equal(entetes['x-amz-content-sha256'], createHash('sha256').update(corps).digest('hex'));
  });
});

test('la signature dépend du corps — deux fichiers différents signent différemment', () => {
  avecEnv(() => {
    const a = signer({ methode: 'PUT', cle: 'audio/x--helene.m4a', corps: Buffer.from('a'), maintenant: MAINTENANT });
    const b = signer({ methode: 'PUT', cle: 'audio/x--helene.m4a', corps: Buffer.from('b'), maintenant: MAINTENANT });
    assert.notEqual(a.entetes.authorization, b.entetes.authorization);
  });
});

test('la signature dépend de la clé secrète', () => {
  const a = avecEnv(() => signer({ methode: 'PUT', cle: 'audio/x--helene.m4a', maintenant: MAINTENANT }));
  process.env.R2_ACCOUNT_ID = ENV.R2_ACCOUNT_ID;
  process.env.R2_ACCESS_KEY_ID = ENV.R2_ACCESS_KEY_ID;
  process.env.R2_SECRET_ACCESS_KEY = 'autre-secret';
  process.env.R2_BUCKET = ENV.R2_BUCKET;
  const b = signer({ methode: 'PUT', cle: 'audio/x--helene.m4a', maintenant: MAINTENANT });
  for (const cle of Object.keys(ENV)) delete process.env[cle];
  assert.notEqual(a.entetes.authorization, b.entetes.authorization);
});

test('sans les clés d\'environnement, signer refuse plutôt que de partir sans authentification', () => {
  assert.throws(() => signer({ methode: 'PUT', cle: 'audio/x--helene.m4a' }), /R2_ACCOUNT_ID/);
});
