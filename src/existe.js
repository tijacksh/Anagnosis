/**
 * Cette fiche existe-t-elle déjà ?
 *
 *     npm run existe -- "linceul de Turin datation" [--url https://…]
 *     npm run doublons
 *
 * `existe` est le premier geste de toute production : il cherche le sujet dans les fiches
 * (titre, identifiant, accroche, sources, quel que soit leur statut, y compris les retirées)
 * et dans `docs/idees-fiches.md` (proposé, en cours, fait, abandonné). Plusieurs routines
 * écrivent en parallèle sur ce dépôt ; ce contrôle est ce qui empêche deux fiches sur le même
 * thème. Code de sortie 1 s'il trouve un doublon probable : on ne produit alors pas.
 *
 * `doublons` relit tout le corpus avant un commit : titres trop proches, ou même source
 * primaire citée par deux fiches (à examiner, pas toujours une erreur).
 */
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { loadAll, ROOT } from './store.js';

const MOTS_VIDES = new Set(['dans', 'avec', 'pour', 'sans', 'sous', 'entre', 'vers', 'chez', 'cette', 'comme',
  'plus', 'mais', 'tout', 'tous', 'sont', 'etre', 'avoir', 'fait', 'leur', 'leurs', 'ainsi', 'dont', 'quand',
  'meme', 'faire', 'apres', 'avant', 'depuis', 'encore', 'aussi', 'celle', 'celui', 'selon', 'unique']);

export function jetons(texte = '') {
  return new Set(
    String(texte).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
      .split(/[^a-z0-9]+/).filter((m) => m.length >= 4 && !MOTS_VIDES.has(m)),
  );
}

export function normaliserUrl(u = '') {
  return String(u).toLowerCase().replace(/^https?:\/\/(www\.)?/, '').replace(/[#?].*$/, '').replace(/\/+$/, '');
}

/** Part des mots de la requête retrouvés dans `texte`. */
export function couverture(requete, texte) {
  const q = jetons(requete);
  if (!q.size) return 0;
  const t = jetons(texte);
  let n = 0;
  for (const m of q) if (t.has(m)) n += 1;
  return n / q.size;
}

const SEUIL_FORT = 0.6;
const SEUIL_PROCHE = 0.4;

export function chercher(requete, { fiches = [], idees = [], url = null } = {}) {
  const trouvees = [];
  for (const f of fiches) {
    const tete = `${f.titre ?? ''} ${f.slug ?? ''} ${f.id ?? ''}`;
    const score = Math.max(couverture(requete, tete), 0.9 * couverture(requete, `${tete} ${f.accroche ?? ''}`));
    const memeUrl = url && (f.sources ?? []).some((s) => normaliserUrl(s.url) === normaliserUrl(url));
    if (score >= SEUIL_PROCHE || memeUrl) {
      trouvees.push({ type: 'fiche', id: f.id, statut: f.statut, titre: f.titre, score: memeUrl ? 1 : score,
        raison: memeUrl ? 'même source' : 'titre proche' });
    }
  }
  for (const l of idees) {
    const score = couverture(requete, l.theme);
    if (score >= SEUIL_PROCHE) trouvees.push({ type: 'idée', statut: l.statut, titre: `${l.discipline} : ${l.theme}`, score, raison: 'thème proche' });
  }
  return trouvees.sort((a, b) => b.score - a.score);
}

export const estDoublon = (t) => t.score >= SEUIL_FORT;

/** Lignes du tableau de `docs/idees-fiches.md`. */
export function lireIdees(markdown) {
  return markdown.split('\n').filter((l) => /^\|/.test(l) && !/^\|[-\s|]+\|?$/.test(l) && !/Discipline \| Th/.test(l))
    .map((l) => l.split('|').slice(1, -1).map((x) => x.trim()))
    .filter((c) => c.length >= 3)
    .map(([discipline, theme, statut, qui, date]) => ({ discipline, theme, statut, qui, date }));
}

export function doublonsDuCorpus(fiches) {
  const alertes = [];
  const actives = fiches.filter((f) => f.titre && !f._parseError);
  for (let i = 0; i < actives.length; i += 1) {
    for (let j = i + 1; j < actives.length; j += 1) {
      const a = actives[i]; const b = actives[j];
      const ta = jetons(`${a.titre} ${a.slug}`); const tb = jetons(`${b.titre} ${b.slug}`);
      const commun = [...ta].filter((m) => tb.has(m)).length;
      const jaccard = commun / (ta.size + tb.size - commun || 1);
      if (jaccard >= 0.6) alertes.push({ gravite: 'erreur', a: a.id, b: b.id, raison: `titres très proches (${Math.round(jaccard * 100)} %)` });
    }
  }
  const parUrl = new Map();
  for (const f of actives) {
    for (const s of f.sources ?? []) {
      const k = normaliserUrl(s.url);
      if (!k) continue;
      if (!parUrl.has(k)) parUrl.set(k, new Set());
      parUrl.get(k).add(f.id);
    }
  }
  for (const [k, ids] of parUrl) {
    if (ids.size > 1) alertes.push({ gravite: 'alerte', a: [...ids][0], b: [...ids].slice(1).join(', '), raison: `même source : ${k}` });
  }
  return alertes;
}

export async function cmdExiste(args) {
  const url = args.includes('--url') ? args[args.indexOf('--url') + 1] : null;
  const requete = args.filter((a, i) => !a.startsWith('--') && args[i - 1] !== '--url').join(' ');
  if (!requete) { console.error('Usage : npm run existe -- "sujet" [--url https://…]'); return 2; }
  const idees = lireIdees(await readFile(path.join(ROOT, 'docs', 'idees-fiches.md'), 'utf8').catch(() => ''));
  const trouvees = chercher(requete, { fiches: await loadAll(), idees, url });
  if (!trouvees.length) { console.log(`AUCUN résultat pour « ${requete} » : le sujet est libre.`); return 0; }
  for (const t of trouvees.slice(0, 8)) {
    console.log(`${estDoublon(t) ? 'DOUBLON' : 'proche '} ${t.type} [${t.statut}] ${t.id ?? ''} ${t.titre} (${t.raison}, ${Math.round(t.score * 100)} %)`);
  }
  const doublon = trouvees.some(estDoublon);
  console.log(doublon ? `\n→ « ${requete} » existe déjà (ou est réservé) : ne pas produire.` : '\n→ rien d\'identique, mais compare avec les lignes « proche » avant de choisir.');
  return doublon ? 1 : 0;
}

export async function cmdDoublons() {
  const alertes = doublonsDuCorpus(await loadAll());
  for (const a of alertes) console.log(`${a.gravite === 'erreur' ? 'ERREUR' : 'alerte'}  ${a.a} ~ ${a.b} : ${a.raison}`);
  const erreurs = alertes.filter((a) => a.gravite === 'erreur').length;
  console.log(`${alertes.length} signalement(s), ${erreurs} doublon(s) probable(s).`);
  return erreurs ? 1 : 0;
}
