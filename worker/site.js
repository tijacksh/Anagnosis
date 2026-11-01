/**
 * Worker du site anagnosis.fr : sert la vitrine statique (binding ASSETS, dossier export/site)
 * et ne s'exécute que pour les adresses déclarées dans `wrangler-site.toml`
 * (`run_worker_first`) :
 *
 *   POST /inscription           le formulaire « Être prévenu·e du lancement ». Remplace Netlify
 *                               Forms (Netlify facturait chaque déploiement en crédits ; la vitrine
 *                               est passée chez Cloudflare le 2026-10-11, docs/decisions.md).
 *   GET  /inscriptions/decompte décompte des inscriptions par réseau d'origine, derrière un jeton
 *                               (`CLE_DECOMPTE`). Lu par `reseaux/inscriptions.js`. Jamais d'adresse.
 *   GET  /*.mp4                 les vidéos, servies par plages (`Range`) pour Safari : `plage.js`.
 *
 * Les adresses vont dans la table D1 `inscriptions` (base `anagnosis-codes`, voir
 * `inscriptions.schema.sql`). La politique de confidentialité promet un seul message au lancement,
 * puis l'effacement : la table ne garde que l'adresse, le réseau d'origine et la date.
 */
import { autorise } from './debit.js';
import { servirPlage } from './plage.js';

const SOURCES = new Set(['ig', 'tt', 'x', 'direct']);
const COURRIEL = /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,}$/;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/inscription') {
      return request.method === 'POST' ? inscrire(request, env) : new Response('Méthode non permise', { status: 405 });
    }
    if (url.pathname === '/inscriptions/decompte') return decompte(request, env);
    // Vidéos : le fichier entier est demandé à ASSETS (les en-têtes conditionnels suivent,
    // d'où les 304), la plage est découpée ici (voir plage.js).
    if (url.pathname.endsWith('.mp4') && (request.method === 'GET' || request.method === 'HEAD')) {
      const entetes = new Headers(request.headers);
      entetes.delete('Range');
      entetes.delete('If-Range');
      return servirPlage(request, await env.ASSETS.fetch(new Request(url, { method: 'GET', headers: entetes })));
    }
    return env.ASSETS.fetch(request);
  },
};

async function inscrire(request, env) {
  const ip = request.headers.get('CF-Connecting-IP') ?? 'inconnue';
  // 10 envois par heure et par adresse IP : de quoi couvrir une famille derrière une box, pas un robot.
  if (!(await autorise(env, 'inscription', ip, 10, 3600))) {
    return new Response('Trop de tentatives, réessayez plus tard.', { status: 429 });
  }
  let formulaire;
  try { formulaire = await request.formData(); } catch { return new Response('Requête illisible', { status: 400 }); }

  // Piège à robots : un champ caché que seul un script remplit. On répond comme si tout allait bien.
  if ((formulaire.get('bot-field') ?? '') !== '') return Response.redirect(new URL('/merci', request.url).href, 303);

  const courriel = String(formulaire.get('email') ?? '').trim().toLowerCase();
  if (courriel.length > 254 || !COURRIEL.test(courriel)) {
    return new Response('Adresse invalide. Revenez en arrière et corrigez-la.', { status: 400 });
  }
  let source = String(formulaire.get('source') ?? 'direct').toLowerCase();
  if (!SOURCES.has(source)) source = 'direct';

  await env.DB.prepare('INSERT OR IGNORE INTO inscriptions (courriel, source, cree_le) VALUES (?, ?, ?)')
    .bind(courriel, source, new Date().toISOString()).run();
  return Response.redirect(new URL('/merci', request.url).href, 303);
}

async function decompte(request, env) {
  const attendu = env.CLE_DECOMPTE;
  const recu = (request.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '');
  if (!attendu || recu.length !== attendu.length || !egaux(recu, attendu)) {
    return new Response('Non autorisé', { status: 401 });
  }
  const depuis = new URL(request.url).searchParams.get('depuis') ?? '1970-01-01';
  const { results } = await env.DB.prepare(
    'SELECT source, COUNT(*) AS n FROM inscriptions WHERE cree_le >= ? GROUP BY source ORDER BY n DESC',
  ).bind(depuis).all();
  return Response.json({ depuis, total: results.reduce((t, r) => t + r.n, 0), par_source: results });
}

/** Comparaison à durée constante. */
function egaux(a, b) {
  let ecart = 0;
  for (let i = 0; i < a.length; i += 1) ecart |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return ecart === 0;
}
