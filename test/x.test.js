/**
 * reseaux/x.js publie sur X par l'API v2. Aucun accès à X n'est nécessaire : un faux serveur
 * local joue l'API (jeton, compte, envoi par morceaux, publication) et on lance l'outil pour de
 * bon, comme le fait deposer.py. Ce que ça ne prouve pas : que la vraie API accepte ces requêtes.
 * Le premier essai sur le vrai compte reste à faire (docs/passation-reseaux.md §6).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { execFile } from 'node:child_process';
import { mkdtempSync, writeFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { longueurX } from '../reseaux/x.js';

const X_JS = new URL('../reseaux/x.js', import.meta.url).pathname;

test('longueurX : un lien vaut 23 caractères, quelle que soit sa longueur', () => {
  assert.equal(longueurX('abc'), 3);
  assert.equal(longueurX('abc\n\nanagnosis.fr'), 5 + 23);
  assert.equal(longueurX('https://exemple.org/un/tres/long/chemin?x=1 fin'), 23 + 4);
});

/** Démarre un faux X ; `journal` garde ce qu'il a reçu. */
async function fauxX({ tweet = 200 } = {}) {
  const journal = [];
  const serveur = createServer((req, res) => {
    const morceaux = [];
    req.on('data', (c) => morceaux.push(c));
    req.on('end', () => {
      const corps = Buffer.concat(morceaux);
      const url = new URL(req.url, 'http://x');
      const rep = (code, obj) => res.writeHead(code, { 'Content-Type': 'application/json' }).end(JSON.stringify(obj));
      journal.push({ methode: req.method, chemin: url.pathname, requete: url.search, auth: req.headers.authorization, corps });
      if (url.pathname === '/2/oauth2/token') return rep(200, { access_token: 'ACCES-2', refresh_token: 'RAFRAICHI-2', expires_in: 7200, scope: 'tweet.write' });
      if (url.pathname === '/2/users/me') return rep(200, { data: { id: '1', username: 'anagnosis_app', name: 'Anagnosis' } });
      if (url.pathname === '/2/media/upload/initialize') return rep(200, { data: { id: 'M1', media_key: '7_M1' } });
      if (url.pathname === '/2/media/upload/M1/append') return rep(200, { data: { expires_at: 1 } });
      if (url.pathname === '/2/media/upload/M1/finalize') return rep(200, { data: { id: 'M1', processing_info: { state: 'pending', check_after_secs: 0 } } });
      if (url.pathname === '/2/media/upload') return rep(200, { data: { id: 'M1', processing_info: { state: 'succeeded' } } });
      if (url.pathname === '/2/tweets') return tweet === 200 ? rep(200, { data: { id: '999', text: 'ok' } })
        : rep(tweet, { title: 'CreditsDepleted', detail: 'Your enrolled account does not have any credits' });
      rep(404, { detail: 'inconnu' });
    });
  });
  await new Promise((r) => serveur.listen(0, '127.0.0.1', r));
  return { journal, base: `http://127.0.0.1:${serveur.address().port}`, fermer: () => serveur.close() };
}

function lancer(args, env) {
  return new Promise((resoudre) => {
    execFile('node', [X_JS, ...args], { env: { ...process.env, ...env } }, (err, stdout, stderr) =>
      resoudre({ code: err ? err.code : 0, stdout, stderr }));
  });
}

function dossierDeTest({ expire }) {
  const dossier = mkdtempSync(join(tmpdir(), 'x-test-'));
  writeFileSync(join(dossier, 'cles.env'), 'X_CLIENT_ID=id-test\nX_CLIENT_SECRET=secret-test\n');
  writeFileSync(join(dossier, 'reseaux-jetons.json'), JSON.stringify({
    tiktok: { garde: 'intact' },
    x: { access_token: 'ACCES-1', refresh_token: 'RAFRAICHI-1', expire } }));
  const mp4 = join(dossier, 'reel.mp4');
  writeFileSync(mp4, Buffer.alloc(9 * 1024 * 1024, 7)); // 9 Mo : trois morceaux de 4 Mo
  const legende = join(dossier, 'legende-x.txt');
  writeFileSync(legende, 'Elle est dans tous les manuels.\n\nSource : Bridgman, 2019\n\nanagnosis.fr\n');
  return { dossier, mp4, legende };
}

test('publier : rafraîchit le jeton, envoie la vidéo en trois morceaux, publie avec le média', async () => {
  const x = await fauxX();
  const { dossier, mp4, legende } = dossierDeTest({ expire: Date.now() - 1000 }); // jeton d'accès expiré
  const r = await lancer(['publier', mp4, legende], { X_API_BASE: x.base, ANAGNOSIS_DIR: dossier });
  x.fermer();
  assert.equal(r.code, 0, r.stderr);
  assert.match(r.stdout, /^Publié : https:\/\/x\.com\/anagnosis_app\/status\/999$/m);

  const j = x.journal;
  // 1. le jeton est rafraîchi, avec l'identifiant en Basic (client confidentiel)
  assert.equal(j[0].chemin, '/2/oauth2/token');
  assert.equal(j[0].auth, 'Basic ' + Buffer.from('id-test:secret-test').toString('base64'));
  assert.match(j[0].corps.toString(), /grant_type=refresh_token/);
  assert.match(j[0].corps.toString(), /refresh_token=RAFRAICHI-1/);
  // 2. le nouveau jeton de rafraîchissement est gardé, sans toucher aux jetons des autres plateformes
  const gardes = JSON.parse(readFileSync(join(dossier, 'reseaux-jetons.json'), 'utf8'));
  assert.equal(gardes.x.refresh_token, 'RAFRAICHI-2');
  assert.equal(gardes.x.access_token, 'ACCES-2');
  assert.deepEqual(gardes.tiktok, { garde: 'intact' });
  // 3. tous les appels suivants portent le nouveau jeton d'accès
  assert.ok(j.slice(1).every((c) => c.auth === 'Bearer ACCES-2'));
  // 4. l'envoi : initialisation, trois morceaux numérotés, finalisation
  const init = j.find((c) => c.chemin === '/2/media/upload/initialize');
  assert.deepEqual(JSON.parse(init.corps), { media_type: 'video/mp4', total_bytes: 9 * 1024 * 1024, media_category: 'tweet_video' });
  const appends = j.filter((c) => c.chemin === '/2/media/upload/M1/append');
  assert.equal(appends.length, 3);
  appends.forEach((a, i) => assert.match(a.corps.toString('latin1'), new RegExp(`name="segment_index"\\r\\n\\r\\n${i}\\r\\n`)));
  assert.ok(appends.reduce((n, a) => n + a.corps.length, 0) >= 9 * 1024 * 1024);
  // 5. le post porte le texte tel quel et l'identifiant du média
  const post = JSON.parse(j.find((c) => c.chemin === '/2/tweets').corps);
  assert.equal(post.text, readFileSync(legende, 'utf8').trim());
  assert.deepEqual(post.media, { media_ids: ['M1'] });
  // 6. la finalisation précède la publication
  const ordre = j.map((c) => c.chemin);
  assert.ok(ordre.indexOf('/2/media/upload/M1/finalize') < ordre.indexOf('/2/tweets'));
});

test('publier : un jeton encore valide n\'est pas rafraîchi', async () => {
  const x = await fauxX();
  const { dossier, mp4, legende } = dossierDeTest({ expire: Date.now() + 3600_000 });
  const r = await lancer(['publier', mp4, legende], { X_API_BASE: x.base, ANAGNOSIS_DIR: dossier });
  x.fermer();
  assert.equal(r.code, 0, r.stderr);
  assert.ok(!x.journal.some((c) => c.chemin === '/2/oauth2/token'));
  assert.equal(x.journal[0].auth, 'Bearer ACCES-1');
});

test('publier : crédits épuisés (402) → échec lisible, code ≠ 0', async () => {
  const x = await fauxX({ tweet: 402 });
  const { dossier, mp4, legende } = dossierDeTest({ expire: Date.now() + 3600_000 });
  const r = await lancer(['publier', mp4, legende], { X_API_BASE: x.base, ANAGNOSIS_DIR: dossier });
  x.fermer();
  assert.notEqual(r.code, 0);
  assert.match(r.stderr, /HTTP 402/);
  assert.match(r.stderr, /crédits/);
  assert.doesNotMatch(r.stdout, /Publié/);
});

test('publier : une légende de plus de 280 caractères est refusée avant tout appel', async () => {
  const x = await fauxX();
  const { dossier, mp4, legende } = dossierDeTest({ expire: Date.now() + 3600_000 });
  writeFileSync(legende, 'a'.repeat(281));
  const r = await lancer(['publier', mp4, legende], { X_API_BASE: x.base, ANAGNOSIS_DIR: dossier });
  x.fermer();
  assert.notEqual(r.code, 0);
  assert.match(r.stderr, /281 caractères/);
  assert.equal(x.journal.length, 0);
});

test('sans jeton : demande d\'autoriser, sans rien envoyer', async () => {
  const x = await fauxX();
  const { dossier, mp4, legende } = dossierDeTest({ expire: 0 });
  writeFileSync(join(dossier, 'reseaux-jetons.json'), '{}');
  const r = await lancer(['publier', mp4, legende], { X_API_BASE: x.base, ANAGNOSIS_DIR: dossier });
  x.fermer();
  assert.notEqual(r.code, 0);
  assert.match(r.stderr, /autoriser/);
});
