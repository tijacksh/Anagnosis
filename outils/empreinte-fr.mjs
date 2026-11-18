// Usage : node empreinte.mjs content/concepts/<discipline>/<slug>.json
// Affiche l'empreinte (16 caractères hexadécimaux) des textes français traduisibles de la fiche.
import { readFileSync } from 'node:fs'; import { createHash } from 'node:crypto';
const CHAMPS = ['titre', 'accroche', 'contenu_vulgarise', 'citation', 'repere', 'carte', 'pour_aller_plus_loin', 'quiz', 'quiz_supplementaire'];
const EXCLUS = new Set(['url', 'statut', 'bonne_reponse']);
const out = {};
function walk(v, chemin) {
  if (Array.isArray(v)) v.forEach((x, i) => walk(x, [...chemin, String(i)]));
  else if (v && typeof v === 'object') { for (const [k, x] of Object.entries(v)) if (!EXCLUS.has(k)) walk(x, [...chemin, k]); }
  else if (typeof v === 'string' && v.trim() && !v.startsWith('http')) out[chemin.join('/')] = v;
}
const fiche = JSON.parse(readFileSync(process.argv[2], 'utf8'));
for (const c of CHAMPS) if (fiche[c] != null) walk(fiche[c], [c]);
const json = '{' + Object.keys(out).sort().map(k => JSON.stringify(k) + ': ' + JSON.stringify(out[k])).join(', ') + '}';
console.log(createHash('sha256').update(json).digest('hex').slice(0, 16));
