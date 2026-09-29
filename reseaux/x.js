#!/usr/bin/env node
/**
 * X (Twitter) : publier le Reel du jour par notre propre app développeur.
 *
 * API X v2, OAuth 2.0 avec PKCE, envoi de la vidéo par morceaux (`/2/media/upload/...`).
 * Aucun service tiers, aucune dépendance (docs/passation-reseaux.md §6).
 *
 *   node reseaux/x.js autoriser                   ouvre la page X, garde les jetons
 *   node reseaux/x.js compte                      affiche le compte connecté
 *   node reseaux/x.js publier <mp4> <legende.txt> publie le post avec sa vidéo ; sur stdout :
 *                                                 « Publié : <url> » (code ≠ 0 et raison sur stderr sinon)
 *
 * Identifiants dans ~/.anagnosis/cles.env : X_CLIENT_ID (obligatoire) et X_CLIENT_SECRET
 * (si l'app est un « client confidentiel »). Jetons dans ~/.anagnosis/reseaux-jetons.json :
 * jamais dans le dépôt.
 *
 * À enregistrer dans l'app développeur X (console.x.com) :
 *   - URL de rappel exacte : http://127.0.0.1:8766/callback
 *   - permissions de l'app : lecture et écriture
 *   - portées demandées : tweet.read tweet.write users.read media.write offline.access
 *
 * Le jeton d'accès de X vit deux heures et le jeton de rafraîchissement **change à chaque
 * usage** : `acces()` réécrit toujours le nouveau. Ne jamais copier reseaux-jetons.json d'une
 * machine à l'autre après coup, sous peine d'invalider l'une des deux copies.
 *
 * Coût (docs.x.com, à confirmer dans la console) : paiement à l'usage, environ 0,015 $ par
 * post et 0,20 $ pour un post qui contient un lien. `legende-x.txt` contient anagnosis.fr :
 * le retirer de composer.py ramène le coût par post à l'ordre du centime.
 *
 * Pour les essais : X_API_BASE / X_AUTH_BASE / ANAGNOSIS_DIR redirigent vers un faux serveur
 * et un dossier de jetons jetable (test/x.test.js).
 */
import { createServer } from 'node:http';
import { createHash, randomBytes } from 'node:crypto';
import { readFileSync, writeFileSync, existsSync, statSync, openSync, readSync, closeSync, mkdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { execFile } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const DOSSIER = process.env.ANAGNOSIS_DIR ?? join(homedir(), '.anagnosis');
const JETONS = join(DOSSIER, 'reseaux-jetons.json');
const API = process.env.X_API_BASE ?? 'https://api.x.com';
const AUTORISATION = `${process.env.X_AUTH_BASE ?? 'https://x.com'}/i/oauth2/authorize`;
const PORT = 8766;
const REDIRECTION = `http://127.0.0.1:${PORT}/callback`;
const PORTEES = 'tweet.read tweet.write users.read media.write offline.access';
const MORCEAU = 4 * 1024 * 1024; // la doc recommande 4 à 5 Mo (limite serveur : 8 Mo)
const LIMITE = 280;
const LONGUEUR_LIEN = 23; // X compte tout lien pour 23 caractères

/** Longueur telle que X la compte : chaque lien vaut 23, le reste un caractère par symbole. */
export function longueurX(texte) {
  const lien = /(?:https?:\/\/)?(?:[\w-]+\.)+[a-z]{2,}(?:\/\S*)?/gi;
  const sansLiens = texte.replace(lien, '');
  const nb = (texte.match(lien) ?? []).length;
  return [...sansLiens].length + nb * LONGUEUR_LIEN;
}

function lireEnv() {
  const env = {};
  if (!existsSync(join(DOSSIER, 'cles.env'))) return env;
  for (const ligne of readFileSync(join(DOSSIER, 'cles.env'), 'utf8').split('\n')) {
    const m = ligne.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
  return env;
}

function cles() {
  const env = lireEnv();
  const id = process.env.X_CLIENT_ID ?? env.X_CLIENT_ID;
  if (!id) throw new Error('X_CLIENT_ID absent de ~/.anagnosis/cles.env');
  return { id, secret: process.env.X_CLIENT_SECRET ?? env.X_CLIENT_SECRET };
}

const lireJetons = () => (existsSync(JETONS) ? JSON.parse(readFileSync(JETONS, 'utf8')) : {});
function garder(x) {
  mkdirSync(DOSSIER, { recursive: true });
  const tout = lireJetons();
  tout.x = x;
  writeFileSync(JETONS, JSON.stringify(tout, null, 2), { mode: 0o600 });
}

/** Lit la réponse d'X et en fait une erreur lisible (402 = crédits épuisés, 429 = quota). */
async function lire(r, quoi) {
  const texte = await r.text();
  let d = {};
  try { d = texte ? JSON.parse(texte) : {}; } catch { d = { detail: texte.slice(0, 300) }; }
  if (r.ok) return d;
  const raison = d.detail ?? d.error_description ?? d.error ?? d.title ?? texte.slice(0, 300);
  const indice = r.status === 402 ? ' (crédits de l\'API X épuisés : en racheter dans la console développeur)'
    : r.status === 429 ? ' (limite de débit atteinte : réessayer plus tard)'
    : r.status === 401 ? ' (jeton refusé : relancer « autoriser »)' : '';
  throw new Error(`${quoi} : HTTP ${r.status} ${raison}${indice}`);
}

function enteteClient({ id, secret }) {
  // Client confidentiel : Basic id:secret. Client public : l'identifiant va dans le corps.
  return secret ? { Authorization: 'Basic ' + Buffer.from(`${id}:${secret}`).toString('base64') } : {};
}

async function jeton(corps) {
  const k = cles();
  const params = new URLSearchParams(corps);
  if (!k.secret) params.set('client_id', k.id);
  const r = await fetch(`${API}/2/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', ...enteteClient(k) },
    body: params,
  });
  const d = await lire(r, 'jeton');
  if (!d.access_token) throw new Error(`jeton refusé : ${JSON.stringify(d)}`);
  return {
    access_token: d.access_token,
    refresh_token: d.refresh_token,
    scope: d.scope,
    expire: Date.now() + (d.expires_in ?? 7200) * 1000,
  };
}

/** Le jeton d'accès vit deux heures : rafraîchi s'il lui reste moins de dix minutes. */
async function acces() {
  let t = lireJetons().x;
  if (!t) throw new Error('aucun jeton X : lancer « autoriser »');
  if (t.expire - Date.now() < 600_000) {
    if (!t.refresh_token) throw new Error('pas de jeton de rafraîchissement (portée offline.access) : relancer « autoriser »');
    const neuf = await jeton({ grant_type: 'refresh_token', refresh_token: t.refresh_token });
    t = { ...t, ...neuf };
    garder(t); // le jeton de rafraîchissement change à chaque usage : on garde le nouveau tout de suite
  }
  return t.access_token;
}

async function appel(chemin, { methode = 'GET', json, form } = {}) {
  const r = await fetch(`${API}${chemin}`, {
    method: methode,
    headers: { Authorization: `Bearer ${await acces()}`, ...(json ? { 'Content-Type': 'application/json' } : {}) },
    body: json ? JSON.stringify(json) : form,
  });
  return lire(r, chemin);
}

function ouvrir(url) {
  const [cmd, args] = process.platform === 'darwin' ? ['open', [url]]
    : process.platform === 'win32' ? ['cmd', ['/c', 'start', '', url.replaceAll('&', '^&')]]
    : ['xdg-open', [url]];
  execFile(cmd, args, () => {}); // si rien ne s'ouvre, l'adresse est affichée dans la console
}

async function autoriser() {
  const k = cles();
  const verificateur = randomBytes(48).toString('base64url');
  const defi = createHash('sha256').update(verificateur).digest('base64url');
  const etat = randomBytes(16).toString('hex');
  const url = AUTORISATION + '?' + new URLSearchParams({
    response_type: 'code', client_id: k.id, redirect_uri: REDIRECTION, scope: PORTEES,
    state: etat, code_challenge: defi, code_challenge_method: 'S256',
  });

  const code = await new Promise((resoudre, rejeter) => {
    const serveur = createServer((req, res) => {
      const u = new URL(req.url, REDIRECTION);
      if (u.pathname !== '/callback') { res.writeHead(404).end(); return; }
      const page = (titre) => `<!doctype html><meta charset="utf-8"><title>Anagnosis</title>
        <body style="background:#F4EFE1;color:#1B1A17;font:18px Georgia,serif;padding:48px">
        <p style="font:600 12px Menlo,monospace;letter-spacing:.12em">ANAGNOSIS · X</p><h1>${titre}</h1>`;
      if (u.searchParams.get('state') !== etat || !u.searchParams.get('code')) {
        res.writeHead(400, { 'Content-Type': 'text/html' }).end(page('Autorisation refusée ou incomplète.'));
        serveur.close();
        rejeter(new Error(`retour X : ${u.searchParams.get('error') ?? 'état invalide'} ${u.searchParams.get('error_description') ?? ''}`));
        return;
      }
      res.writeHead(200, { 'Content-Type': 'text/html' }).end(page('C’est fait. Vous pouvez fermer cet onglet.'));
      serveur.close();
      resoudre(u.searchParams.get('code'));
    }).listen(PORT, '127.0.0.1', () => {
      console.log(`Autorisation X : la page s'ouvre dans le navigateur (à faire connecté au compte @anagnosis_app).\n${url}\n`);
      ouvrir(url);
    });
    setTimeout(() => { serveur.close(); rejeter(new Error('pas de réponse en 10 minutes')); }, 600_000).unref();
  });

  const t = await jeton({ grant_type: 'authorization_code', code, redirect_uri: REDIRECTION, code_verifier: verificateur });
  garder(t);
  console.log(`Jetons gardés dans ${JETONS} (portées : ${t.scope}).`);
  await compte();
}

async function moi() {
  const d = await appel('/2/users/me');
  return d.data;
}

async function compte() {
  const u = await moi();
  console.log(`Compte connecté : @${u.username} (${u.name})`);
}

/** Envoi par morceaux : INIT, APPEND (multipart) puis FINALIZE, et attente du traitement. */
async function televerser(fichier) {
  const taille = statSync(fichier).size;
  const init = await appel('/2/media/upload/initialize', {
    methode: 'POST', json: { media_type: 'video/mp4', total_bytes: taille, media_category: 'tweet_video' } });
  const id = init.data?.id;
  if (!id) throw new Error(`initialisation de l'envoi refusée : ${JSON.stringify(init)}`);

  const fd = openSync(fichier, 'r');
  try {
    for (let i = 0, lu = 0; lu < taille; i++, lu += MORCEAU) {
      const tampon = Buffer.alloc(Math.min(MORCEAU, taille - lu));
      readSync(fd, tampon, 0, tampon.length, lu);
      const form = new FormData();
      form.set('segment_index', String(i));
      form.set('media', new Blob([tampon], { type: 'video/mp4' }), 'reel.mp4');
      await appel(`/2/media/upload/${id}/append`, { methode: 'POST', form });
    }
  } finally { closeSync(fd); }

  const fin = await appel(`/2/media/upload/${id}/finalize`, { methode: 'POST' });
  let info = fin.data?.processing_info;
  for (let i = 0; info && info.state !== 'succeeded' && i < 40; i++) {
    if (info.state === 'failed') throw new Error(`traitement de la vidéo refusé : ${JSON.stringify(info.error ?? info)}`);
    await new Promise((r) => setTimeout(r, (info.check_after_secs ?? 5) * 1000));
    const s = await appel(`/2/media/upload?${new URLSearchParams({ command: 'STATUS', media_id: id })}`);
    info = s.data?.processing_info;
  }
  if (info && info.state !== 'succeeded') throw new Error('traitement de la vidéo toujours en cours après l\'attente maximale');
  return id;
}

async function publier(fichier, legendeFichier) {
  if (!fichier || !legendeFichier) throw new Error('usage : x.js publier <mp4> <legende.txt>');
  const legende = readFileSync(legendeFichier, 'utf8').trim();
  if (!legende) throw new Error('légende vide');
  const n = longueurX(legende);
  if (n > LIMITE) throw new Error(`légende de ${n} caractères pour X (limite ${LIMITE}, liens comptés ${LONGUEUR_LIEN})`);
  const u = await moi();
  const media = await televerser(fichier);
  const d = await appel('/2/tweets', { methode: 'POST', json: { text: legende, media: { media_ids: [media] } } });
  if (!d.data?.id) throw new Error(`publication refusée : ${JSON.stringify(d)}`);
  const lien = `https://x.com/${u.username}/status/${d.data.id}`;
  console.log(`Publié : ${lien}`);
  return { id: d.data.id, lien };
}

// Importé par les tests (longueurX) sans lancer la ligne de commande.
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [commande, ...args] = process.argv.slice(2);
  const actions = { autoriser, compte, publier: () => publier(args[0], args[1]) };
  if (!actions[commande]) {
    console.error('usage : x.js autoriser | compte | publier <mp4> <legende.txt>');
    process.exit(2);
  }
  actions[commande]().catch((e) => { console.error(e.message); process.exit(1); });
}
