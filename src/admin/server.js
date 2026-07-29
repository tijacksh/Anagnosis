#!/usr/bin/env node
/**
 * Outil de validation Admin (brief §9, étape 2).
 *
 *   npm run admin        → http://localhost:4321
 *   PORT=8080 npm run admin
 *
 * Usage strictement interne (brief §11) : pas d'authentification, écoute sur
 * 127.0.0.1 par défaut. À ne pas exposer tel quel si l'outil part sur le NAS —
 * passer derrière le reverse proxy existant.
 */
import http from 'node:http';
import { loadAll, loadById, save, appliquerDecision } from '../store.js';
import { validerLot, validerFiche } from '../validate.js';
import { TRANSITIONS, STATUTS_LABELS } from '../schema.js';
import { vueQueue, vueFiche, page, escape } from './views.js';

const PORT = Number(process.env.PORT ?? 4321);
const HOST = process.env.HOST ?? '127.0.0.1';
const RELECTEUR = process.env.RELECTEUR ?? 'admin';

const A_RELIRE = ['brouillon', 'en_retouche'];

function filtrer(resultats, { statut = 'a_relire', discipline = 'tous' }) {
  return resultats
    .filter((r) => {
      if (statut === 'tous') return true;
      if (statut === 'a_relire') return A_RELIRE.includes(r.fiche.statut);
      return r.fiche.statut === statut;
    })
    .filter((r) => discipline === 'tous' || r.fiche.discipline === discipline);
}

function compter(resultats) {
  const n = (predicat) => resultats.filter(predicat).length;
  return {
    a_relire: n((r) => A_RELIRE.includes(r.fiche.statut)),
    valide: n((r) => r.fiche.statut === 'valide'),
    rejete: n((r) => r.fiche.statut === 'rejete'),
    publie: n((r) => r.fiche.statut === 'publie'),
    tous: resultats.length,
  };
}

function envoyer(res, code, corps, type = 'text/html; charset=utf-8') {
  res.writeHead(code, { 'content-type': type, 'cache-control': 'no-store' });
  res.end(corps);
}

function erreur(res, code, message) {
  envoyer(res, code, page({ titre: 'Erreur', corps: `<div class="empty"><h2>${code}</h2><p>${escape(message)}</p><p><a href="/">Retour à la file</a></p></div>` }));
}

async function lireCorps(req) {
  const morceaux = [];
  let taille = 0;
  for await (const c of req) {
    taille += c.length;
    if (taille > 64 * 1024) throw new Error('corps de requête trop volumineux');
    morceaux.push(c);
  }
  return Buffer.concat(morceaux).toString('utf8');
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const chemin = decodeURIComponent(url.pathname);

    // --- File d'attente -------------------------------------------------
    if (req.method === 'GET' && chemin === '/') {
      const resultats = validerLot(await loadAll());
      const filtres = {
        statut: url.searchParams.get('statut') ?? 'a_relire',
        discipline: url.searchParams.get('discipline') ?? 'tous',
      };
      const visibles = filtrer(resultats, filtres);
      return envoyer(res, 200, vueQueue({ resultats: visibles, filtres, compteurs: compter(resultats) }));
    }

    // --- Détail d'une fiche ---------------------------------------------
    const detail = chemin.match(/^\/fiche\/([^/]+)$/);
    if (req.method === 'GET' && detail) {
      const toutes = await loadAll();
      const fiche = toutes.find((f) => f.id === detail[1]);
      if (!fiche) return erreur(res, 404, `Fiche « ${detail[1]} » introuvable.`);

      // Navigation ← / → à l'intérieur de la file en cours de relecture.
      const file = toutes.filter((f) => A_RELIRE.includes(f.statut));
      const i = file.findIndex((f) => f.id === fiche.id);
      const controle = validerFiche(fiche, { toutes });

      return envoyer(res, 200, vueFiche({
        fiche,
        ...controle,
        precedente: i > 0 ? file[i - 1].id : null,
        suivante: i >= 0 && i < file.length - 1 ? file[i + 1].id : null,
      }));
    }

    // --- Décision de relecture ------------------------------------------
    const decision = chemin.match(/^\/fiche\/([^/]+)\/decision$/);
    if (req.method === 'POST' && decision) {
      const params = new URLSearchParams(await lireCorps(req));
      const action = params.get('action');
      const note = (params.get('note') ?? '').trim();

      const transition = TRANSITIONS[action];
      if (!transition) return erreur(res, 400, `Action inconnue : « ${action} ».`);

      const fiche = await loadById(decision[1]);
      if (!fiche) return erreur(res, 404, `Fiche « ${decision[1]} » introuvable.`);

      if (!transition.depuis.includes(fiche.statut)) {
        return erreur(res, 409,
          `Transition « ${action} » impossible depuis le statut « ${STATUTS_LABELS[fiche.statut] ?? fiche.statut} ».`);
      }

      // Une fiche qui ne passe pas le contrôle qualité ne peut pas être validée :
      // le validateur est un garde-fou, pas une suggestion.
      if (transition.vers === 'valide') {
        const { erreurs } = validerFiche(fiche, { toutes: await loadAll() });
        if (erreurs.length) {
          return erreur(res, 409, `Validation refusée — ${erreurs.length} erreur(s) de contrôle qualité : ${erreurs[0]}`);
        }
      }

      // Un rejet ou une retouche sans motif est inexploitable pour la regénération.
      if (['rejeter', 'retoucher'].includes(action) && !note) {
        return erreur(res, 400, 'Une note de relecture est obligatoire pour un rejet ou une retouche.');
      }

      const maj = appliquerDecision(fiche, {
        statut: transition.vers,
        action,
        note,
        par: RELECTEUR,
        quand: new Date().toISOString(),
      });
      await save(maj);

      // Enchaîner : après une décision, on repart sur la fiche suivante à relire.
      const restantes = (await loadAll()).filter((f) => A_RELIRE.includes(f.statut));
      const cible = restantes.length ? `/fiche/${encodeURIComponent(restantes[0].id)}` : '/';
      res.writeHead(303, { location: cible });
      return res.end();
    }

    return erreur(res, 404, 'Page inconnue.');
  } catch (err) {
    console.error(err);
    return erreur(res, 500, err.message);
  }
});

server.listen(PORT, HOST, () => {
  console.log(`\n  Epignosis — outil de validation`);
  console.log(`  http://${HOST}:${PORT}\n`);
  console.log(`  Raccourcis : V valider · R retouche · X rejeter · J/K naviguer · Échap file\n`);
});
