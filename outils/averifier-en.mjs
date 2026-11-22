// Quelles fiches anglaises NE SERONT PAS servies à cause d'un drapeau, sous la politique décidée le 2026-11-22
// (drapeaux acceptés : citation-originale-anglaise, texte-officiel-anglais, citation-traduite) ?
// Ce sont les fiches du CONTRÔLE QUALITÉ anglais : voir docs/traduction-en.md « Routine de contrôle qualité des fiches anglaises ».
//   node outils/averifier-en.mjs [--max N] [--json] [--stats] [--discipline <d>] [--drapeau <type>]
// Ne lit que les fichiers ; n'écrit rien. Les fiches `erreur-possible-fr` attendent que le français soit réparé (routines controler/réparer).
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TOLERES = new Set(['citation-originale-anglaise', 'texte-officiel-anglais', 'citation-traduite']);
const args = process.argv.slice(2);
const val = n => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : null; };
const max = Number(val('--max') ?? Infinity);
const disc = val('--discipline');
const filtre = val('--drapeau');

const sortie = [];
const dossierEn = path.join(RACINE, 'content', 'concepts-en');
for (const d of readdirSync(dossierEn, { withFileTypes: true })) {
  if (!d.isDirectory() || (disc && d.name !== disc)) continue;
  for (const f of readdirSync(path.join(dossierEn, d.name)).filter(x => x.endsWith('.json'))) {
    const en = JSON.parse(readFileSync(path.join(dossierEn, d.name, f), 'utf8'));
    const bloquants = [...new Set((en.drapeaux ?? []).map(x => x.type).filter(t => !TOLERES.has(t)))];
    if (!bloquants.length || (filtre && !bloquants.includes(filtre))) continue;
    const frF = path.join(RACINE, 'content', 'concepts', d.name, f);
    if (!existsSync(frF)) continue;
    // le français doit être publiable (valide) pour que la fiche compte
    sortie.push({ discipline: d.name, slug: f.slice(0, -5), drapeaux: bloquants,
      attend_le_francais: bloquants.includes('erreur-possible-fr') });
  }
}
sortie.sort((a, b) => Number(a.attend_le_francais) - Number(b.attend_le_francais) || a.discipline.localeCompare(b.discipline) || a.slug.localeCompare(b.slug));

if (args.includes('--stats')) {
  const par = {};
  for (const s of sortie) for (const t of s.drapeaux) par[t] = (par[t] ?? 0) + 1;
  console.log(JSON.stringify({ fiches_a_verifier: sortie.length, dont_attendent_le_francais: sortie.filter(s => s.attend_le_francais).length, par_drapeau: par }));
} else if (args.includes('--json')) {
  console.log(JSON.stringify(sortie.slice(0, max)));
} else {
  for (const s of sortie.slice(0, max)) console.log(`${s.discipline}/${s.slug}  ${s.drapeaux.join(', ')}${s.attend_le_francais ? '  (attend le français)' : ''}`);
}
