// Quelles fiches traduire en anglais ? L'état se DÉDUIT des fichiers (rien n'est réservé ni écrit) :
//   absente  : pas de content/concepts-en/<discipline>/<slug>.json
//   périmée  : le français a changé depuis la traduction (empreinte_fr différente)
//   à jour   : rien à faire
// Voir docs/traduction-en.md. Usage :
//   node outils/atraduire.mjs [--pour <voie>] [--max N] [--etat absente|perimee|tous] [--discipline <d>] [--json] [--stats]
// `--pour <voie>` : ne garde que les disciplines de cette voie (content/concepts-en/_attribution.json, édité à la main).
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { empreinteFiche } from './empreinte-fr.mjs';

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PRIORITE = { publie: 0, valide: 1, en_retouche: 2, brouillon: 3 };

const lire = f => JSON.parse(readFileSync(f, 'utf8'));
const correspond = (motifs, nom) => (motifs ?? []).some(m => m === '*' || (m.endsWith('*') ? nom.startsWith(m.slice(0, -1)) : m === nom));

export function voies(racine = RACINE) {
  const f = path.join(racine, 'content', 'concepts-en', '_attribution.json');
  return existsSync(f) ? Object.fromEntries(Object.entries(lire(f)).filter(([k, v]) => !k.startsWith('_') && v && typeof v === 'object')) : {};
}

export function voiePour(discipline, toutes) {
  const gagnantes = Object.entries(toutes).filter(([, v]) => correspond(v.disciplines, discipline) && !correspond(v.sauf, discipline));
  return gagnantes.map(([nom]) => nom);
}

export function etatTraductions(racine = RACINE) {
  const fr = path.join(racine, 'content', 'concepts');
  const en = path.join(racine, 'content', 'concepts-en');
  const toutes = voies(racine);
  const liste = [];
  for (const d of readdirSync(fr, { withFileTypes: true })) {
    if (!d.isDirectory()) continue;
    for (const f of readdirSync(path.join(fr, d.name)).filter(x => x.endsWith('.json'))) {
      const fiche = lire(path.join(fr, d.name, f));
      if (fiche.statut === 'rejete') continue;
      const cible = path.join(en, d.name, f);
      let etat = 'absente';
      if (existsSync(cible)) etat = lire(cible).empreinte_fr === empreinteFiche(fiche) ? 'a_jour' : 'perimee';
      liste.push({ discipline: d.name, slug: f.replace(/\.json$/, ''), statut: fiche.statut, etat, voies: voiePour(d.name, toutes) });
    }
  }
  const ordreEtat = { perimee: 0, absente: 1, a_jour: 2 };
  return liste.sort((a, b) => ordreEtat[a.etat] - ordreEtat[b.etat] || (PRIORITE[a.statut] ?? 9) - (PRIORITE[b.statut] ?? 9)
    || a.discipline.localeCompare(b.discipline) || a.slug.localeCompare(b.slug));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const args = process.argv.slice(2);
  const opt = (n, def) => args.includes(n) ? args[args.indexOf(n) + 1] : def;
  const pour = opt('--pour'), max = Number(opt('--max', 10)), etat = opt('--etat', 'tous'), disc = opt('--discipline');
  const toutes = etatTraductions();
  if (pour && !voies()[pour]) { console.error(`Voie inconnue : ${pour}. Voies : ${Object.keys(voies()).join(', ') || '(aucune)'}`); process.exit(2); }
  let lot = toutes.filter(x => (!pour || x.voies.includes(pour)) && (!disc || x.discipline === disc));
  if (args.includes('--stats')) {
    const c = {}; for (const x of lot) { c[x.etat] = (c[x.etat] ?? 0) + 1; }
    console.log(JSON.stringify({ voie: pour ?? 'toutes', ...c, total: lot.length }));
    process.exit(0);
  }
  lot = lot.filter(x => etat === 'tous' ? x.etat !== 'a_jour' : x.etat === (etat === 'perimee' ? 'perimee' : 'absente')).slice(0, max);
  if (args.includes('--json')) console.log(JSON.stringify(lot, null, 1));
  else if (!lot.length) console.log('Rien à traduire.');
  else for (const x of lot) console.log(`${x.etat.padEnd(8)} ${x.statut.padEnd(11)} ${x.discipline}/${x.slug}  [${x.voies.join(',') || 'sans voie'}]`);
}
