#!/usr/bin/env node
/**
 * Assemble l'application à partir des fiches validées.
 *
 *   npm run app     → export/app/  (PWA complète, à servir ou à déployer)
 *
 * L'app est statique et autonome : tout le contenu validé est embarqué dans
 * `contenu.js`, il n'y a aucun appel réseau en usage normal et aucun serveur.
 *
 * Ce dossier n'est PAS le client iOS. C'est l'esquisse jouable : elle sert à
 * éprouver le parcours et la direction visuelle sur un vrai téléphone, sans
 * Xcode ni App Store. Le client natif vivra dans son propre dépôt.
 */
import { readFile, writeFile, mkdir, readdir, copyFile } from 'node:fs/promises';
import path from 'node:path';
import { loadAll, ROOT } from './store.js';
import { DISCIPLINES, DISCIPLINES_V1 } from './schema.js';

/** Encres par discipline — docs/charte-visuelle.md §2.2 */
const ENCRES = {
  philosophie: '#3D5588',
  sociologie: '#914E72',
  anthropologie: '#FF6C2F',
  psychologie: '#765BA7',
  biologie: '#00A95C',
  medecine: '#FF665E',
  mathematiques: '#00838A',
  physique: '#0078BF',
  litterature: '#FF48B0',
};

const SRC = path.join(ROOT, 'app');
const DEST = path.join(ROOT, 'export', 'app');

const fiches = (await loadAll())
  .filter((f) => ['valide', 'publie'].includes(f.statut) && DISCIPLINES_V1[f.discipline])
  .map(({ _path, validation, meta, pour_aller_plus_loin, sources, ...f }) => ({
    ...f,
    // Les sources restent embarquées : c'est le cœur du positionnement, une app
    // qui les tairait serait une autre app.
    sources: sources.map((s) => ({
      auteur: s.auteur ?? null,
      titre: s.titre,
      publication: s.publication ?? null,
      annee: s.annee ?? null,
    })),
  }))
  .sort((a, b) => a.id.localeCompare(b.id));

if (!fiches.length) {
  console.error('Aucune fiche validée — rien à embarquer. Lancez d\'abord la validation.');
  process.exit(1);
}

const presentes = [...new Set(fiches.map((f) => f.discipline))];
const disciplines = Object.fromEntries(presentes.map((d) => [d, DISCIPLINES[d]]));

const contenu = `/* Généré par \`npm run app\` — ne pas modifier à la main.
   ${fiches.length} fiches validées, ${presentes.length} disciplines. */
window.ANAGNOSIS_CONTENU = ${JSON.stringify({ fiches, disciplines, encres: ENCRES }, null, 0)};
`;

await mkdir(DEST, { recursive: true });
for (const f of await readdir(SRC)) {
  await copyFile(path.join(SRC, f), path.join(DEST, f));
}
await writeFile(path.join(DEST, 'contenu.js'), contenu, 'utf8');

// Variante mono-fichier, pour envoyer l'app par message ou la publier telle quelle.
const [html, css, js] = await Promise.all(
  ['index.html', 'styles.css', 'app.js'].map((f) => readFile(path.join(SRC, f), 'utf8')),
);
const seul = html
  .replace(/<link rel="manifest"[^>]*>/, '')
  .replace(/<link rel="icon"[^>]*>/, '')
  .replace(/<link rel="apple-touch-icon"[^>]*>/, '')
  .replace('<link rel="stylesheet" href="./styles.css">', `<style>\n${css}\n</style>`)
  .replace('<script src="./contenu.js"></script>', `<script>\n${contenu}\n</script>`)
  .replace('<script src="./app.js"></script>', `<script>\n${js}\n</script>`);
await writeFile(path.join(ROOT, 'export', 'anagnosis-autonome.html'), seul, 'utf8');

const ko = (n) => `${Math.round(n / 1024)} Ko`;
console.log(`${fiches.length} fiches · ${presentes.length} disciplines`);
console.log(`  ${path.relative(ROOT, DEST)}/            PWA installable (${ko(contenu.length)} de contenu)`);
console.log(`  export/anagnosis-autonome.html   fichier unique (${ko(seul.length)})`);
