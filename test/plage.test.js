import { test } from 'node:test';
import assert from 'node:assert/strict';
import { lirePlage, servirPlage } from '../worker/plage.js';

test('lirePlage : formes usuelles et limites', () => {
  assert.deepEqual(lirePlage('bytes=0-1', 10), [0, 1]);
  assert.deepEqual(lirePlage('bytes=0-', 10), [0, 9]);
  assert.deepEqual(lirePlage('bytes=4-99', 10), [4, 9]);
  assert.deepEqual(lirePlage('bytes=-3', 10), [7, 9]);
  assert.deepEqual(lirePlage('bytes=-30', 10), [0, 9]);
  assert.equal(lirePlage('bytes=10-', 10), 'hors');
  assert.equal(lirePlage('bytes=-0', 10), 'hors');
  // illisible ou multi-plages : ignoré (fichier entier), pas 416
  assert.equal(lirePlage('bytes=5-2', 10), null);
  assert.equal(lirePlage('bytes=0-1,4-5', 10), null);
  assert.equal(lirePlage('octets=0-1', 10), null);
});

const fichier = () => new Response(new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]), {
  status: 200, headers: { 'Content-Type': 'video/mp4', 'Content-Length': '10', ETag: '"v1"' },
});
const req = (range, method = 'GET', autres = {}) => new Request('https://anagnosis.fr/v.mp4', {
  method, headers: { ...(range ? { Range: range } : {}), ...autres },
});

test('servirPlage : sans Range, le fichier entier annonce les plages', async () => {
  const r = await servirPlage(req(), fichier());
  assert.equal(r.status, 200);
  assert.equal(r.headers.get('Accept-Ranges'), 'bytes');
  assert.equal((await r.arrayBuffer()).byteLength, 10);
});

test('servirPlage : 206 avec le bon morceau', async () => {
  const r = await servirPlage(req('bytes=2-4'), fichier());
  assert.equal(r.status, 206);
  assert.equal(r.headers.get('Content-Range'), 'bytes 2-4/10');
  assert.equal(r.headers.get('Content-Length'), '3');
  assert.equal(r.headers.get('Content-Type'), 'video/mp4');
  assert.deepEqual([...new Uint8Array(await r.arrayBuffer())], [2, 3, 4]);
});

test('servirPlage : plage hors fichier → 416', async () => {
  const r = await servirPlage(req('bytes=20-30'), fichier());
  assert.equal(r.status, 416);
  assert.equal(r.headers.get('Content-Range'), 'bytes */10');
});

test('servirPlage : un 404 passe tel quel', async () => {
  const r = await servirPlage(req('bytes=0-1'), new Response('absent', { status: 404 }));
  assert.equal(r.status, 404);
});

test('servirPlage : suffixe et HEAD', async () => {
  const r = await servirPlage(req('bytes=-3'), fichier());
  assert.equal(r.headers.get('Content-Range'), 'bytes 7-9/10');
  assert.deepEqual([...new Uint8Array(await r.arrayBuffer())], [7, 8, 9]);
  const h = await servirPlage(req('bytes=0-1', 'HEAD'), fichier());
  assert.equal(h.status, 206);
  assert.equal(h.headers.get('Content-Length'), '2');
  assert.equal((await h.arrayBuffer()).byteLength, 0);
});

test('servirPlage : en-tête illisible → fichier entier', async () => {
  const r = await servirPlage(req('bytes=0-1,4-5'), fichier());
  assert.equal(r.status, 200);
  assert.equal((await r.arrayBuffer()).byteLength, 10);
});

test('servirPlage : If-Range périmé → fichier entier, à jour → plage', async () => {
  const vieux = await servirPlage(req('bytes=0-1', 'GET', { 'If-Range': '"v0"' }), fichier());
  assert.equal(vieux.status, 200);
  const frais = await servirPlage(req('bytes=0-1', 'GET', { 'If-Range': '"v1"' }), fichier());
  assert.equal(frais.status, 206);
});
