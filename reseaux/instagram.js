#!/usr/bin/env node
/**
 * Instagram : publier des Reels et des carrousels par notre propre app Meta.
 *
 * API Instagram avec connexion Instagram (`graph.instagram.com`) : pas de Page Facebook, et
 * pas d'App Review tant que le compte a un rôle sur l'app (docs/reseaux.md §3). Aucun
 * service tiers, aucune dépendance.
 *
 *   node reseaux/instagram.js jeton <jeton court>       échange le jeton du tableau de bord
 *                                                       contre un jeton de 60 jours
 *   node reseaux/instagram.js compte                    affiche le compte connecté
 *   node reseaux/instagram.js rafraichir                prolonge le jeton de 60 jours
 *   node reseaux/instagram.js reel <mp4> <legende.txt>  publie un Reel
 *   node reseaux/instagram.js carrousel <legende.txt> <jpg>...   publie un carrousel (2 à 10)
 *
 * Identifiants dans ~/.anagnosis/cles.env (INSTAGRAM_APP_ID, INSTAGRAM_APP_SECRET), jeton
 * dans ~/.anagnosis/reseaux-jetons.json : jamais dans le dépôt.
 *
 * Instagram lit les médias par URL : le fichier est déposé dans notre bucket R2 (privé),
 * sous `reseaux/`, et Instagram le lit par une URL présignée d'une heure.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, basename } from 'node:path';
import { televerser, urlPresignee } from '../src/r2.js';

const DOSSIER = join(homedir(), '.anagnosis');
const JETONS = join(DOSSIER, 'reseaux-jetons.json');
const API = 'https://graph.instagram.com';
const VERSION = 'v23.0';

function lireEnv() {
  const env = {};
  for (const ligne of readFileSync(join(DOSSIER, 'cles.env'), 'utf8').split('\n')) {
    const m = ligne.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
  return env;
}

// `src/r2.js` lit ses clés dans l'environnement du processus, pas dans cles.env.
for (const [k, v] of Object.entries(lireEnv())) if (k.startsWith('R2_') && !process.env[k]) process.env[k] = v;

function cles() {
  const env = lireEnv();
  if (!env.INSTAGRAM_APP_SECRET) throw new Error('INSTAGRAM_APP_SECRET absent de ~/.anagnosis/cles.env');
  return { secret: env.INSTAGRAM_APP_SECRET };
}

const lireJetons = () => (existsSync(JETONS) ? JSON.parse(readFileSync(JETONS, 'utf8')) : {});
function garder(instagram) {
  const tout = lireJetons();
  tout.instagram = instagram;
  writeFileSync(JETONS, JSON.stringify(tout, null, 2), { mode: 0o600 });
}

async function get(chemin, params) {
  const r = await fetch(`${API}${chemin}?${new URLSearchParams(params)}`);
  const d = await r.json();
  if (d.error) throw new Error(`${chemin} : ${JSON.stringify(d.error)}`);
  return d;
}

async function post(chemin, params) {
  const r = await fetch(`${API}/${VERSION}${chemin}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(params),
  });
  const d = await r.json();
  if (d.error) throw new Error(`${chemin} : ${JSON.stringify(d.error)}`);
  return d;
}

/** Le jeton du compte ; prolongé s'il lui reste moins de 10 jours (refus si déjà expiré). */
async function acces() {
  let t = lireJetons().instagram;
  if (!t) throw new Error('aucun jeton Instagram : lancer « jeton <jeton court> »');
  if (t.expire < Date.now()) throw new Error('jeton Instagram expiré : en générer un nouveau dans le tableau de bord Meta');
  if (t.expire - Date.now() < 10 * 86400_000) t = await rafraichir();
  return t;
}

async function rafraichir() {
  const t = lireJetons().instagram;
  const d = await get('/refresh_access_token', { grant_type: 'ig_refresh_token', access_token: t.access_token });
  const neuf = { ...t, access_token: d.access_token, expire: Date.now() + d.expires_in * 1000 };
  garder(neuf);
  console.log(`Jeton prolongé jusqu'au ${new Date(neuf.expire).toISOString().slice(0, 10)}.`);
  return neuf;
}

async function jeton(court) {
  const champs = 'user_id,username,account_type';
  let acces = court, duree = 60 * 86400;
  // Le tableau de bord de Meta délivre déjà un jeton de 60 jours : on l'essaie tel quel
  // avant de tenter l'échange, réservé aux jetons courts (une heure) d'un parcours OAuth.
  let moi;
  try { moi = await get(`/${VERSION}/me`, { fields: champs, access_token: court }); }
  catch {
    const { secret } = cles();
    const long = await get('/access_token', { grant_type: 'ig_exchange_token', client_secret: secret, access_token: court });
    acces = long.access_token; duree = long.expires_in;
    moi = await get(`/${VERSION}/me`, { fields: champs, access_token: acces });
  }
  garder({ access_token: acces, expire: Date.now() + duree * 1000, user_id: moi.user_id, username: moi.username });
  console.log(`Jeton gardé pour @${moi.username} (${moi.account_type}), valable jusqu'au ${new Date(Date.now() + duree * 1000).toISOString().slice(0, 10)} et prolongé seul ensuite.`);
}

async function compte() {
  const t = await acces();
  const moi = await get(`/${VERSION}/me`, { fields: 'user_id,username,account_type,media_count', access_token: t.access_token });
  console.log(`@${moi.username} · ${moi.account_type} · ${moi.media_count} publications`);
}

/** Dépose le fichier sur R2 et rend l'URL présignée que lira Instagram. */
async function heberger(fichier, typeContenu) {
  const cle = `reseaux/${Date.now()}-${basename(fichier)}`;
  await televerser(cle, readFileSync(fichier), { typeContenu });
  return urlPresignee(cle, { expireSecondes: 3600 });
}

/** Attend que le conteneur soit traité (Instagram télécharge et transcode la vidéo). */
async function attendre(id, t) {
  for (let i = 0; i < 40; i++) {
    const d = await get(`/${VERSION}/${id}`, { fields: 'status_code,status', access_token: t.access_token });
    if (d.status_code === 'FINISHED') return;
    if (d.status_code === 'ERROR' || d.status_code === 'EXPIRED') throw new Error(`conteneur ${id} : ${d.status_code} ${d.status ?? ''}`);
    await new Promise((r) => setTimeout(r, 10_000));
  }
  throw new Error(`conteneur ${id} : traitement toujours en cours après 400 s`);
}

async function publier(conteneur, t) {
  const d = await post(`/${t.user_id}/media_publish`, { creation_id: conteneur, access_token: t.access_token });
  const infos = await get(`/${VERSION}/${d.id}`, { fields: 'permalink', access_token: t.access_token });
  console.log(`Publié : ${infos.permalink}`);
  return { id: d.id, lien: infos.permalink };
}

async function reel(fichier, legendeFichier) {
  const t = await acces();
  const legende = readFileSync(legendeFichier, 'utf8').trim();
  if (legende.length > 2200) throw new Error('légende de plus de 2 200 caractères');
  const url = await heberger(fichier, 'video/mp4');
  const c = await post(`/${t.user_id}/media`, {
    media_type: 'REELS', video_url: url, caption: legende, share_to_feed: 'true', access_token: t.access_token });
  await attendre(c.id, t);
  return publier(c.id, t);
}

async function carrousel(legendeFichier, ...images) {
  if (images.length < 2 || images.length > 10) throw new Error('un carrousel compte de 2 à 10 images');
  const t = await acces();
  const legende = readFileSync(legendeFichier, 'utf8').trim();
  const enfants = [];
  for (const img of images) {
    const url = await heberger(img, 'image/jpeg');
    const c = await post(`/${t.user_id}/media`, { image_url: url, is_carousel_item: 'true', access_token: t.access_token });
    await attendre(c.id, t);
    enfants.push(c.id);
  }
  const c = await post(`/${t.user_id}/media`, {
    media_type: 'CAROUSEL', children: enfants.join(','), caption: legende, access_token: t.access_token });
  await attendre(c.id, t);
  return publier(c.id, t);
}

const [commande, ...args] = process.argv.slice(2);
const actions = { jeton: () => jeton(args[0]), compte, rafraichir, reel: () => reel(args[0], args[1]),
                  carrousel: () => carrousel(...args) };
if (!actions[commande]) {
  console.error('usage : instagram.js jeton <jeton> | compte | rafraichir | reel <mp4> <legende> | carrousel <legende> <jpg>...');
  process.exit(2);
}
actions[commande]().catch((e) => { console.error(e.message); process.exit(1); });
