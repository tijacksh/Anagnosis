#!/usr/bin/env node
/**
 * TikTok : autoriser l'outil sur le compte, puis déposer des vidéos en brouillon.
 *
 * Aucun service tiers, aucune dépendance : notre propre app TikTok for Developers
 * (Login Kit + Content Posting API, scope `video.upload`). La vidéo arrive dans la boîte
 * de réception TikTok du compte ; on la publie à la main depuis l'app (docs/reseaux.md §2).
 *
 *   node reseaux/tiktok.js autoriser          ouvre la page TikTok, garde les jetons
 *   node reseaux/tiktok.js compte             affiche le compte connecté
 *   node reseaux/tiktok.js brouillon <mp4>    dépose une vidéo en brouillon (sans légende :
 *                                             l'API inbox n'en accepte pas)
 *   node reseaux/tiktok.js publier <mp4> <txt> publie directement avec sa légende, en public
 *                                             si TikTok l'autorise, sinon en privé (SELF_ONLY)
 *   node reseaux/tiktok.js statut <id>        où en est un dépôt
 *
 * Identifiants dans ~/.anagnosis/cles.env, jetons dans ~/.anagnosis/reseaux-jetons.json :
 * jamais dans le dépôt. `TIKTOK_MODE=production` bascule sur les clés hors Sandbox.
 */
import { createServer } from 'node:http';
import { createHash, randomBytes } from 'node:crypto';
import { readFileSync, writeFileSync, existsSync, statSync, openSync, readSync, closeSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { execFile } from 'node:child_process';

const DOSSIER = join(homedir(), '.anagnosis');
const JETONS = join(DOSSIER, 'reseaux-jetons.json');
const PORT = 8765;
const REDIRECTION = `http://localhost:${PORT}/callback/`;
const API = 'https://open.tiktokapis.com';

function cles() {
  const env = {};
  for (const ligne of readFileSync(join(DOSSIER, 'cles.env'), 'utf8').split('\n')) {
    const m = ligne.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
  const sandbox = (process.env.TIKTOK_MODE ?? 'sandbox') !== 'production';
  const cle = env[sandbox ? 'TIKTOK_SANDBOX_CLIENT_KEY' : 'TIKTOK_CLIENT_KEY'];
  const secret = env[sandbox ? 'TIKTOK_SANDBOX_CLIENT_SECRET' : 'TIKTOK_CLIENT_SECRET'];
  if (!cle || !secret) throw new Error('clés TikTok absentes de ~/.anagnosis/cles.env');
  return { cle, secret, mode: sandbox ? 'sandbox' : 'production' };
}

function lireJetons() {
  return existsSync(JETONS) ? JSON.parse(readFileSync(JETONS, 'utf8')) : {};
}

function garderJetons(tiktok) {
  const tout = lireJetons();
  tout.tiktok = tiktok;
  writeFileSync(JETONS, JSON.stringify(tout, null, 2), { mode: 0o600 });
}

async function jeton(corps) {
  const r = await fetch(`${API}/v2/oauth/token/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(corps),
  });
  const d = await r.json();
  if (!d.access_token) throw new Error(`jeton refusé : ${JSON.stringify(d)}`);
  const maintenant = Date.now();
  return {
    open_id: d.open_id,
    scope: d.scope,
    access_token: d.access_token,
    expire: maintenant + d.expires_in * 1000,
    refresh_token: d.refresh_token,
    refresh_expire: maintenant + d.refresh_expires_in * 1000,
  };
}

/** Le jeton d'accès vit 24 h : on le rafraîchit s'il lui reste moins d'une heure. */
async function acces() {
  const { cle, secret, mode } = cles();
  let t = lireJetons().tiktok;
  if (!t || t.mode !== mode) throw new Error(`aucun jeton ${mode} : lancer « autoriser »`);
  if (t.expire - Date.now() < 3600_000) {
    if (t.refresh_expire < Date.now()) throw new Error('jeton de rafraîchissement expiré : relancer « autoriser »');
    t = { ...(await jeton({ client_key: cle, client_secret: secret, grant_type: 'refresh_token',
                            refresh_token: t.refresh_token })), mode };
    garderJetons(t);
  }
  return t.access_token;
}

async function appel(chemin, { methode = 'POST', corps } = {}) {
  const r = await fetch(`${API}${chemin}`, {
    method: methode,
    headers: { Authorization: `Bearer ${await acces()}`, 'Content-Type': 'application/json; charset=UTF-8' },
    body: corps ? JSON.stringify(corps) : undefined,
  });
  const d = await r.json();
  if (d.error && d.error.code !== 'ok') throw new Error(`${chemin} : ${JSON.stringify(d.error)}`);
  return d.data;
}

async function autoriser() {
  const { cle, secret, mode } = cles();
  const verificateur = randomBytes(48).toString('base64url');
  // TikTok attend, pour le bureau, le SHA-256 du vérificateur en hexadécimal, pas en base64url.
  const defi = createHash('sha256').update(verificateur).digest('hex');
  const etat = randomBytes(16).toString('hex');
  const url = 'https://www.tiktok.com/v2/auth/authorize/?' + new URLSearchParams({
    client_key: cle, response_type: 'code', scope: process.env.TIKTOK_SCOPES ?? 'user.info.basic,video.upload,video.publish',
    redirect_uri: REDIRECTION, state: etat, code_challenge: defi, code_challenge_method: 'S256',
  });

  const code = await new Promise((resoudre, rejeter) => {
    const serveur = createServer((req, res) => {
      const u = new URL(req.url, REDIRECTION);
      if (!u.pathname.startsWith('/callback')) { res.writeHead(404).end(); return; }
      const page = (titre) => `<!doctype html><meta charset="utf-8"><title>Anagnosis</title>
        <body style="background:#F4EFE1;color:#1B1A17;font:18px Georgia,serif;padding:48px">
        <p style="font:600 12px Menlo,monospace;letter-spacing:.12em">ANAGNOSIS · TIKTOK</p><h1>${titre}</h1>`;
      if (u.searchParams.get('state') !== etat || !u.searchParams.get('code')) {
        res.writeHead(400, { 'Content-Type': 'text/html' }).end(page('Autorisation refusée ou incomplète.'));
        serveur.close();
        rejeter(new Error(`retour TikTok : ${u.searchParams.get('error') ?? 'état invalide'} ${u.searchParams.get('error_description') ?? ''}`));
        return;
      }
      res.writeHead(200, { 'Content-Type': 'text/html' }).end(page('C’est fait. Vous pouvez fermer cet onglet.'));
      serveur.close();
      resoudre(u.searchParams.get('code'));
    }).listen(PORT, '127.0.0.1', () => {
      console.log(`Autorisation TikTok (${mode}) : la page s'ouvre dans le navigateur.\n${url}\n`);
      execFile('open', [url]);
    });
    setTimeout(() => { serveur.close(); rejeter(new Error('pas de réponse en 10 minutes')); }, 600_000);
  });

  const t = await jeton({ client_key: cle, client_secret: secret, code, grant_type: 'authorization_code',
                          redirect_uri: REDIRECTION, code_verifier: verificateur });
  garderJetons({ ...t, mode });
  console.log(`Jetons gardés dans ${JETONS} (scopes : ${t.scope}).`);
  await compte();
}

async function compte() {
  const d = await appel('/v2/user/info/?fields=open_id,display_name,avatar_url', { methode: 'GET' });
  console.log(`Compte connecté : ${d.user.display_name} (${cles().mode})`);
}

/**
 * Envoi en un seul morceau : TikTok l'accepte sous 64 Mo, et nos Reels font quelques Mo.
 * Au-delà, il faudrait découper en morceaux de 5 à 64 Mo.
 */
async function envoyer(chemin, fichier, extra = {}) {
  const taille = statSync(fichier).size;
  if (taille > 64 * 1024 * 1024) throw new Error('vidéo de plus de 64 Mo : découpage non géré');
  const d = await appel(chemin, {
    corps: { ...extra, source_info: { source: 'FILE_UPLOAD', video_size: taille, chunk_size: taille, total_chunk_count: 1 } },
  });
  const tampon = Buffer.alloc(taille);
  const fd = openSync(fichier, 'r');
  readSync(fd, tampon, 0, taille, 0);
  closeSync(fd);
  const r = await fetch(d.upload_url, {
    method: 'PUT',
    headers: { 'Content-Type': 'video/mp4', 'Content-Length': String(taille),
               'Content-Range': `bytes 0-${taille - 1}/${taille}` },
    body: tampon,
  });
  if (!r.ok) throw new Error(`envoi refusé : ${r.status} ${await r.text()}`);
  console.log(`Envoyé : ${d.publish_id}`);
  return d.publish_id;
}

const brouillon = (fichier) => envoyer('/v2/post/publish/inbox/video/init/', fichier);

/**
 * Publication directe (scope `video.publish`). Un client non audité ne peut publier qu'en
 * SELF_ONLY : on demande au compte les visibilités permises et on prend la plus large.
 * Contenu de marque : c'est notre propre marque (`brand_organic_toggle`), pas un partenariat.
 */
async function publier(fichier, legendeFichier) {
  const legende = readFileSync(legendeFichier, 'utf8').trim();
  if (legende.length > 2200) throw new Error('légende de plus de 2 200 caractères');
  const createur = await appel('/v2/post/publish/creator_info/query/');
  const options = createur.privacy_level_options ?? [];
  const visibilite = options.includes('PUBLIC_TO_EVERYONE') ? 'PUBLIC_TO_EVERYONE' : 'SELF_ONLY';
  console.log(`Visibilités permises : ${options.join(', ')} → ${visibilite}`);
  return envoyer('/v2/post/publish/video/init/', fichier, {
    post_info: {
      title: legende, privacy_level: visibilite,
      disable_comment: false, disable_duet: false, disable_stitch: false,
      video_cover_timestamp_ms: 1000,
      brand_content_toggle: false, brand_organic_toggle: true,
    },
  });
}

async function statut(id) {
  const d = await appel('/v2/post/publish/status/fetch/', { corps: { publish_id: id } });
  console.log(JSON.stringify(d, null, 2));
  return d;
}

const [commande, arg] = process.argv.slice(2);
const [, , , legende] = process.argv;
const actions = { autoriser, compte, brouillon: () => brouillon(arg), publier: () => publier(arg, legende),
                  statut: () => statut(arg) };
if (!actions[commande]) {
  console.error('usage : tiktok.js autoriser | compte | brouillon <mp4> | publier <mp4> <legende.txt> | statut <publish_id>');
  process.exit(2);
}
actions[commande]().catch((e) => { console.error(e.message); process.exit(1); });
