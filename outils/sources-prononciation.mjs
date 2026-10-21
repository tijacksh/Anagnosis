/**
 * Va chercher en ligne la prononciation des noms propres du corpus, et la met en cache.
 *
 *     node outils/sources-prononciation.mjs [--limite 400]
 *
 * Trois sources, dans cet ordre :
 *
 *   1. le Wiktionnaire français — la prononciation *française* d'usage, celle qu'on veut
 *      entendre (« Kant » \kɑ̃t\) ; rare sur les noms étrangers ;
 *   2. la première phrase de Wikipédia en anglais — la prononciation d'origine
 *      (« German: [ˈaɪçman] »), présente pour la plupart des personnes notables ;
 *   3. Wikidata (P898), en dernier recours.
 *
 * Le cache (`audio/prononciations-sources.json`) garde la source et l'adresse de chaque
 * prononciation : une règle du dictionnaire doit pouvoir dire d'où elle vient. Il rend la
 * commande rejouable sans rien retélécharger — une fiche nouvelle n'interroge que ses noms
 * nouveaux. Ce fichier ne contient que des transcriptions de noms ; aucune règle n'en sort
 * sans écoute (`audio/prononciations.json`).
 *
 * Aucune dépendance : `fetch` et un rythme d'une requête par seconde, par politesse
 * envers des services gratuits.
 */
import { readFile, writeFile } from 'node:fs/promises';
import { realpathSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
import { loadAll, ROOT } from '../src/store.js';
import { aLire } from '../src/audio.js';
import { SANS_ECOUTE } from '../src/schema.js';
import { ipaVersFrancais, coherent } from '../src/prononciation.js';

const CACHE = path.join(ROOT, 'audio', 'prononciations-sources.json');
const UA = 'AnagnosisPrononciation/0.1 (https://anagnosis.fr)';
const PAUSE_MS = 1000;
const limite = Number(process.argv[process.argv.indexOf('--limite') + 1]) || 400;

const attendre = (ms) => new Promise((r) => setTimeout(r, ms));
async function json(url) {
  await attendre(PAUSE_MS);
  const r = await fetch(url, { headers: { 'user-agent': UA } });
  if (!r.ok) throw new Error(`${r.status} ${url}`);
  return r.json();
}

/** Les noms propres du corpus publiable : jamais écrits en minuscule ailleurs. */
export async function nomsDuCorpus() {
  const fiches = (await loadAll()).filter((f) => ['valide', 'publie'].includes(f.statut) && !SANS_ECOUTE.has(f.discipline));
  const textes = fiches.map(aLire);
  const minuscules = new Set();
  for (const t of textes) for (const m of t.matchAll(/\p{Ll}[\p{L}’'-]*/gu)) minuscules.add(m[0]);
  const MAJ = "[A-ZÀ-ÖØ-Þ][\\p{L}’'-]*\\p{L}";
  const SEQ = new RegExp(`${MAJ}(?:\\s+(?:(?:van|von|der|de|da|di|ibn|al)\\s+)?${MAJ}){0,3}`, 'gu');
  const propre = (w) => !minuscules.has(w.toLowerCase()) && !/^[IVXLC]+e?$/.test(w) && !/^[A-Z0-9]{2,}$/.test(w);
  const cles = new Map();   // nom de famille (ou mot seul) → { occurrences, complets: Map }
  for (const t of textes) {
    for (const m of t.matchAll(SEQ)) {
      const toks = m[0].replace(/^(?:L|D)['’]/, '').split(/\s+/).filter((w) => /^[A-ZÀ-ÖØ-Þ]/.test(w));
      if (!toks.length || !toks.every(propre)) continue;
      const cle = toks.at(-1);
      const c = cles.get(cle) ?? cles.set(cle, { occurrences: 0, complets: new Map() }).get(cle);
      c.occurrences += 1;
      if (toks.length > 1) c.complets.set(toks.join(' '), (c.complets.get(toks.join(' ')) ?? 0) + 1);
    }
  }
  return [...cles].map(([nom, c]) => ({
    nom, occurrences: c.occurrences,
    complet: [...c.complets].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null,
  })).sort((a, b) => b.occurrences - a.occurrences);
}

/** Wiktionnaire français : le modèle {{pron|…|fr}} de la page du nom. */
async function wiktionnaire(nom) {
  const d = await json(`https://fr.wiktionary.org/w/api.php?action=parse&page=${encodeURIComponent(nom)}&prop=wikitext&format=json&formatversion=2`);
  const t = d.parse?.wikitext ?? '';
  const ipa = [...t.matchAll(/\{\{pron\|([^|}]+)\|fr\}\}/g)].map((m) => m[1].trim()).find(Boolean);
  return ipa ? { source: 'wiktionnaire-fr', langue: 'fr', ipa, url: `https://fr.wiktionary.org/wiki/${encodeURIComponent(nom)}` } : null;
}

/** Wikipédia en anglais : {{IPA|de|…}} ou {{IPA-de|…}} dans l'introduction. */
async function wikipedia(nom, complet) {
  const titre = (complet ?? nom).replace(/ /g, '_');
  const d = await json(`https://en.wikipedia.org/w/api.php?action=parse&page=${encodeURIComponent(titre)}&prop=wikitext&section=0&redirects=1&format=json&formatversion=2`);
  const t = (d.parse?.wikitext ?? '').replace(/<ref[\s\S]*?<\/ref>/g, '');
  const m = /\{\{IPA[-|]([a-z]{2,3})(?:-[a-z]+)?\|([^}|]+)/.exec(t);
  if (!m || m[1] === 'en') return null;   // l'anglais : le moteur le lit déjà, on ne réécrit pas
  // L'IPA porte sur le nom complet : on garde le dernier mot, celui du nom de famille.
  const mots = m[2].replace(/[[\]/]/g, '').trim().split(/\s+/);
  return { source: 'wikipedia-en', langue: m[1], ipa: mots.at(-1), ipa_complet: m[2].trim(),
    url: `https://en.wikipedia.org/wiki/${encodeURIComponent(d.parse?.title?.replace(/ /g, '_') ?? titre)}` };
}

/** Wikidata, propriété P898 (transcription API), sur l'élément trouvé par son nom. */
async function wikidata(nom, complet) {
  const s = await json(`https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${encodeURIComponent(complet ?? nom)}&language=fr&limit=1&format=json`);
  const id = s.search?.[0]?.id;
  if (!id) return null;
  const e = Object.values((await json(`https://www.wikidata.org/wiki/Special:EntityData/${id}.json`)).entities)[0];
  const v = e.claims?.P898?.[0]?.mainsnak?.datavalue?.value;
  const ipa = typeof v === 'object' ? v?.text : v;
  return ipa ? { source: 'wikidata', langue: v?.language || null, ipa: ipa.split(/\s+/).at(-1), ipa_complet: ipa,
    url: `https://www.wikidata.org/wiki/${id}` } : null;
}

async function main() {
  let cache = {};
  try { cache = JSON.parse(await readFile(CACHE, 'utf8')); } catch (e) { if (e.code !== 'ENOENT') throw e; }
  const noms = (await nomsDuCorpus()).slice(0, limite);
  let neufs = 0;
  for (const { nom, occurrences, complet } of noms) {
    if (cache[nom]) {   // déjà cherché : on ne retélécharge pas, on recalcule la proposition
      if (cache[nom].ipa) Object.assign(cache[nom], { proposition: ipaVersFrancais(cache[nom].ipa), douteux: !coherent(nom, cache[nom].ipa) });
      continue;
    }
    let trouve = null;
    for (const source of [() => wiktionnaire(nom), () => wikipedia(nom, complet), () => wikidata(nom, complet)]) {
      try { trouve = await source(); } catch (e) { process.stderr.write(`  ${nom} : ${e.message}\n`); }
      if (trouve) break;
    }
    cache[nom] = { occurrences, complet, ...(trouve ?? { source: null }),
      proposition: trouve ? ipaVersFrancais(trouve.ipa) : null,
      // Une page de redirection ou un nom complet mal découpé donnent la prononciation
      // d'un autre mot (« Pays-Bas » → *Nederland*) : on le marque, on ne le propose pas.
      douteux: trouve ? !coherent(nom, trouve.ipa) : undefined, cherche_le: new Date().toISOString().slice(0, 10) };
    neufs += 1;
    if (neufs % 20 === 0) await ecrire(cache);
    process.stdout.write(`${nom.padEnd(22)} ${trouve ? `${trouve.source} [${trouve.langue}] ${trouve.ipa} → ${cache[nom].proposition}` : '—'}\n`);
  }
  await ecrire(cache);
  const avec = Object.values(cache).filter((x) => x.source).length;
  process.stdout.write(`\n${Object.keys(cache).length} noms en cache, ${avec} avec une prononciation.\n`);
}

async function ecrire(cache) {
  const trie = Object.fromEntries(Object.entries(cache).sort(([a], [b]) => a.localeCompare(b)));
  await writeFile(CACHE, `${JSON.stringify(trie, null, 1)}\n`, 'utf8');
}

// Lancé directement (même depuis un chemin à espace ou par un lien, comme « SSD 1To »).
if (process.argv[1] && import.meta.url === pathToFileURL(realpathSync(process.argv[1])).href) await main();
