#!/usr/bin/env node
/**
 * Compte les inscriptions à la liste d'attente, par réseau d'origine.
 *
 *   node reseaux/inscriptions.js [--depuis AAAA-MM-JJ] [--hote https://…]
 *
 * Lit le décompte du Worker du site (`worker/site.js`, adresse `/inscriptions/decompte`), qui
 * interroge la table D1 `inscriptions`. Le champ `source` vient du paramètre `?s=` du lien (`ig`,
 * `tt`, `x`) ; `direct` = pas de paramètre. Aucune adresse e-mail n'est affichée ni gardée :
 * seuls les décomptes sortent.
 *
 * Depuis le 2026-10-11 la vitrine n'est plus chez Netlify (les crédits de déploiement étaient
 * épuisés en neuf jours) ; le formulaire non plus. Jeton : ~/.anagnosis/decompte.jeton (le même
 * que le secret CLE_DECOMPTE du Worker). Aucune dépendance.
 */
import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const argument = (nom) => { const i = process.argv.indexOf(nom); return i > 0 ? process.argv[i + 1] : null; };
const depuis = argument('--depuis');
const hote = argument('--hote') ?? 'https://anagnosis.fr';

let jeton;
try {
  jeton = readFileSync(join(homedir(), '.anagnosis', 'decompte.jeton'), 'utf8').trim();
} catch {
  console.error('~/.anagnosis/decompte.jeton absent');
  process.exit(1);
}

const r = await fetch(`${hote}/inscriptions/decompte${depuis ? `?depuis=${encodeURIComponent(depuis)}` : ''}`, {
  headers: { Authorization: `Bearer ${jeton}` },
});
if (!r.ok) {
  console.error(`${hote} a répondu ${r.status}`);
  process.exit(1);
}
const { total, par_source: parSource } = await r.json();
console.log(`Inscriptions${depuis ? ` depuis le ${depuis}` : ''} : ${total}`);
for (const { source, n } of parSource) {
  console.log(`  ${source.padEnd(16)} ${String(n).padStart(4)}  ${total ? ((100 * n) / total).toFixed(0) : 0} %`);
}
