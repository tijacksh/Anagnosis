#!/usr/bin/env node
/**
 * Compte les inscriptions à la liste d'attente, par réseau d'origine.
 *
 *   node reseaux/inscriptions.js [--depuis AAAA-MM-JJ]
 *
 * Lit les soumissions du formulaire `lancement` de anagnosis.fr par l'API de Netlify. Le champ
 * `source` vient du paramètre `?s=` du lien (`ig`, `tt`, `x`) ; `direct` = pas de paramètre.
 * Aucune adresse e-mail n'est affichée ni gardée : seuls les décomptes sortent.
 *
 * Jeton dans ~/.anagnosis/cles.env : NETLIFY_TOKEN (Netlify > User settings > Applications >
 * Personal access tokens). Aucune dépendance.
 */
import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const env = {};
for (const l of readFileSync(join(homedir(), '.anagnosis', 'cles.env'), 'utf8').split('\n')) {
  const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}
if (!env.NETLIFY_TOKEN) {
  console.error('NETLIFY_TOKEN absent de ~/.anagnosis/cles.env');
  process.exit(1);
}

const i = process.argv.indexOf('--depuis');
const depuis = i > 0 ? new Date(process.argv[i + 1]) : new Date(0);

async function api(chemin) {
  const r = await fetch(`https://api.netlify.com/api/v1${chemin}`, { headers: { Authorization: `Bearer ${env.NETLIFY_TOKEN}` } });
  if (!r.ok) throw new Error(`${chemin} : ${r.status} ${await r.text()}`);
  return r.json();
}

const sites = await api('/sites?filter=all&per_page=100');
const site = sites.find((s) => (s.custom_domain ?? '') === 'anagnosis.fr' || (s.url ?? '').includes('anagnosis.fr'));
if (!site) throw new Error('site anagnosis.fr introuvable pour ce jeton');
const formulaires = await api(`/sites/${site.id}/forms`);
const lancement = formulaires.find((f) => f.name === 'lancement');
if (!lancement) throw new Error('formulaire « lancement » introuvable');

const parSource = {};
let total = 0;
for (let page = 1; ; page++) {
  const lot = await api(`/forms/${lancement.id}/submissions?per_page=100&page=${page}`);
  if (!lot.length) break;
  for (const s of lot) {
    if (new Date(s.created_at) < depuis) continue;
    const source = (s.data?.source || 'avant le suivi').toString();
    parSource[source] = (parSource[source] ?? 0) + 1;
    total++;
  }
}
console.log(`Inscriptions${i > 0 ? ` depuis le ${process.argv[i + 1]}` : ''} : ${total}`);
for (const [source, n] of Object.entries(parSource).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${source.padEnd(16)} ${String(n).padStart(4)}  ${((100 * n) / total).toFixed(0)} %`);
}
