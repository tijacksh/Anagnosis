// Empreinte des textes français traduisibles d'une fiche : elle ne change que si ces textes changent
// (pas quand seuls le statut, la validation ou le contrôle changent). Sert à savoir si la version anglaise
// (content/concepts-en/) est à jour. Voir docs/traduction-en.md.
// CLI : node outils/empreinte-fr.mjs content/concepts/<discipline>/<slug>.json
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';

export const CHAMPS = ['titre', 'accroche', 'contenu_vulgarise', 'citation', 'repere', 'carte', 'pour_aller_plus_loin', 'quiz', 'quiz_supplementaire'];
const EXCLUS = new Set(['url', 'statut', 'bonne_reponse']);

export function empreinteFiche(fiche) {
  const out = {};
  const walk = (v, chemin) => {
    if (Array.isArray(v)) v.forEach((x, i) => walk(x, [...chemin, String(i)]));
    else if (v && typeof v === 'object') { for (const [k, x] of Object.entries(v)) if (!EXCLUS.has(k)) walk(x, [...chemin, k]); }
    else if (typeof v === 'string' && v.trim() && !v.startsWith('http')) out[chemin.join('/')] = v;
  };
  for (const c of CHAMPS) if (fiche[c] != null) walk(fiche[c], [c]);
  const json = '{' + Object.keys(out).sort().map(k => JSON.stringify(k) + ': ' + JSON.stringify(out[k])).join(', ') + '}';
  return createHash('sha256').update(json).digest('hex').slice(0, 16);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  console.log(empreinteFiche(JSON.parse(readFileSync(process.argv[2], 'utf8'))));
}
