/**
 * Sert l'audio du bucket R2 privé, derrière une garde légère en attendant mieux.
 *
 * **Ce que ce Worker fait aujourd'hui.** Il exige un en-tête `X-Anagnosis-Cle` qui doit
 * correspondre au secret posé sur ce Worker (`wrangler secret put CLE_PARTAGEE`), et sert
 * l'objet demandé depuis le bucket R2 lié. C'est ce qui empêche le pillage anonyme du
 * bucket par une URL R2 devinée — le bucket lui-même reste privé, seul ce Worker y a accès.
 * Il plafonne aussi chaque IP appelante à un débit par minute (binding `LIMITEUR`,
 * `wrangler.toml`), pour la même raison que `codes.js` : ce jeton fixe et partagé par
 * tous les lecteurs ne borne à lui seul aucun volume de requêtes.
 *
 * **Ce que ce Worker ne fait pas encore.** Il ne valide aucun reçu d'abonnement : le
 * jeton est fixe, embarqué dans les deux apps, identique pour tous les lecteurs. Ce n'est
 * *pas* « Premium vérifié », seulement « requête venue de l'app plutôt que d'un scan de
 * bucket ». La vraie garde — un reçu App Store / Play Store vérifié par requête — attend
 * le point 2 de la passation (produits App Store Connect / Play Console, encore
 * inexistants). Ce jour-là, ce fichier remplace la comparaison de jeton par un appel à
 * l'App Store Server API / Play Developer API, sans toucher au reste : la forme de la
 * réponse ne change pas, seule la condition qui l'autorise change.
 *
 * Pendant de `src/r2.js` (le pipeline dépose, ce Worker sert) — même bucket, deux accès
 * distincts : le pipeline en écriture avec les clés S3 dans `~/.anagnosis/cles.env`, ce
 * Worker en lecture avec une liaison R2 native (pas de clés à lui donner).
 *
 * La limite de débit partage la base D1 `anagnosis-codes` avec `codes.js` (binding
 * `DB`, portée `audio` dans la même table `debit`) plutôt qu'une base dédiée à ce seul
 * compteur — voir `debit.js` pour pourquoi ce n'est pas le binding `Rate Limit` natif.
 */
import { autorise } from './debit.js';

export default {
  async fetch(request, env) {
    // Voir « Ce que ce Worker fait aujourd'hui » en tête de fichier, et le commentaire
    // équivalent dans `codes.js` pour le raisonnement complet. Le plafond est plus
    // large ici qu'aux codes : un lecteur qui enchaîne plusieurs fiches dans la même
    // minute est un usage normal pour de l'audio, alors que dix requêtes par minute
    // suffisent déjà à un échange de code.
    const ip = request.headers.get('CF-Connecting-IP') || 'sans-ip';
    if (!(await autorise(env, 'audio', ip, 60, 60))) {
      return new Response('trop de requêtes', { status: 429 });
    }

    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return new Response('méthode refusée', { status: 405 });
    }

    const cle = request.headers.get('X-Anagnosis-Cle');
    if (!cle || cle !== env.CLE_PARTAGEE) {
      return new Response('non autorisé', { status: 401 });
    }

    const chemin = new URL(request.url).pathname.replace(/^\/+/, '');
    if (!/^[a-z0-9-]+--(helene|jerome)\.m4a$/.test(chemin)) {
      // Une forme de chemin inattendue n'a aucune raison d'exister dans le bucket ; le
      // refuser avant l'appel R2 évite de transformer ce Worker en sonde de contenu.
      return new Response('introuvable', { status: 404 });
    }

    const objet = await env.AUDIO.get(`audio/${chemin}`);
    if (!objet) return new Response('introuvable', { status: 404 });

    return new Response(objet.body, {
      headers: {
        'content-type': 'audio/mp4',
        'content-length': String(objet.size),
        etag: objet.httpEtag,
        // Le fichier ne change jamais sous une même URL : une fiche corrigée reproduit
        // un fichier différent (voir `audio/index.json`), jamais le même chemin avec un
        // contenu différent. Le cache peut donc être définitif.
        'cache-control': 'public, max-age=31536000, immutable',
      },
    });
  },
};
