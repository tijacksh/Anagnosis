#!/usr/bin/env node
/**
 * Assemble l'application à partir des fiches validées.
 *
 *   npm run app     → export/app/   (PWA complète, à servir ou à déployer)
 *                   → export/site/  (la même, sous /app/, avec le banc d'essai
 *                                    à la racine : c'est ce que publie Netlify)
 *
 * L'app est statique et autonome : tout le contenu validé est embarqué dans
 * `contenu.js`, il n'y a aucun appel réseau en usage normal et aucun serveur.
 *
 * Ce dossier n'est PAS le client iOS. C'est l'esquisse jouable : elle sert à
 * éprouver le parcours et la direction visuelle sur un vrai téléphone, sans
 * Xcode ni App Store. Le client natif vivra dans son propre dépôt.
 */
import { readFile, writeFile, mkdir, readdir, copyFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { loadAll, ROOT } from './store.js';
import { DISCIPLINES } from './schema.js';

/**
 * Encres par discipline — docs/charte-visuelle.md §2.2.
 *
 * Vingt-trois des trente-trois disciplines déclarées ont une encre. Les dix
 * autres — Géographie, les cinq disciplines de « Société », et quatre des
 * « Arts et lettres » — attendent la leur, et sont absentes d'ici à dessein :
 * c'est cette table qui décide de ce que le client peut offrir (voir plus bas).
 */
const ENCRES = {
  // Sciences exactes
  mathematiques: '#00838A',
  physique: '#0078BF',
  chimie: '#67B346',
  astronomie: '#9D7AD2',
  informatique: '#5EC8E5',
  statistiques: '#AC936E',

  // Vivant et santé
  biologie: '#00A95C',
  medecine: '#FF665E',
  neurosciences: '#FF8E91',
  genetique: '#FF7477',
  ecologie: '#397E58',
  nutrition: '#E3ED55',

  // Terre et environnement
  geologie: '#8E595A',
  climat: '#82D8D5',
  oceanographie: '#62A8E5',
  paleontologie: '#BB8B41',

  // Sciences humaines
  philosophie: '#3D5588',
  psychologie: '#765BA7',
  sociologie: '#914E72',
  anthropologie: '#FF6C2F',
  linguistique: '#F15060',
  archeologie: '#FFB511',

  // Arts et lettres
  litterature: '#FF48B0',
};

const SRC = path.join(ROOT, 'app');
const DEST = path.join(ROOT, 'export', 'app');
const BANC = path.join(ROOT, 'banc');
const SITE = path.join(ROOT, 'export', 'site');

const publiables = (await loadAll()).filter((f) => ['valide', 'publie'].includes(f.statut));

// Une discipline n'est offerte que lorsqu'elle a du stock **et** une encre
// (docs/charte-visuelle.md §2.2). Le stock se constate — une discipline sans fiche
// validée n'entre pas dans `presentes`. L'encre, elle, se vérifie ici : la taxonomie
// peut être posée en entier sans qu'une discipline s'ouvre avant d'être habillée.
const sansEncre = publiables.filter((f) => !ENCRES[f.discipline]);

const fiches = publiables
  .filter((f) => ENCRES[f.discipline])
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

// Une fiche écrite et validée qui disparaît de l'export sans un mot est un piège :
// on la croit servie. On dit donc ce qui est écarté, et pourquoi.
if (sansEncre.length) {
  const disciplines = [...new Set(sansEncre.map((f) => f.discipline))]
    .map((d) => DISCIPLINES[d] ?? d)
    .join(', ');
  console.warn(`${sansEncre.length} fiche(s) validée(s) écartée(s), faute d'encre attribuée : ${disciplines}`);
}

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

const [html, css, js] = await Promise.all(
  ['index.html', 'styles.css', 'app.js'].map((f) => readFile(path.join(SRC, f), 'utf8')),
);

// Le service worker porte l'empreinte de ce qu'il sert. Deux assemblages
// identiques donnent le même nom de cache — rien ne bouge inutilement ; un
// changement en donne un nouveau, et l'ancien est purgé à l'activation.
const empreinte = createHash('sha256').update(html + css + js + contenu).digest('hex').slice(0, 10);
const sw = (await readFile(path.join(SRC, 'sw.js'), 'utf8')).replace('__EMPREINTE__', empreinte);
await writeFile(path.join(DEST, 'sw.js'), sw, 'utf8');

// Variante mono-fichier, pour envoyer l'app par message ou la publier telle quelle.
const seul = html
  .replace(/<link rel="manifest"[^>]*>/, '')
  .replace(/<link rel="icon"[^>]*>/, '')
  .replace(/<link rel="apple-touch-icon"[^>]*>/, '')
  .replace('<link rel="stylesheet" href="./styles.css">', `<style>\n${css}\n</style>`)
  .replace('<script src="./contenu.js"></script>', `<script>\n${contenu}\n</script>`)
  .replace('<script src="./app.js"></script>', `<script>\n${js}\n</script>`);
await writeFile(path.join(ROOT, 'export', 'anagnosis-autonome.html'), seul, 'utf8');

// Le site publié : le banc d'essai à la racine, l'app dans /app/.
//
// L'app n'est pas à la racine à dessein — son service worker sert la coquille
// pour toute navigation dans sa portée, et finirait par servir l'app à la place
// du banc. Sous /app/, sa portée s'arrête à l'app.
await mkdir(path.join(SITE, 'app'), { recursive: true });
for (const f of await readdir(DEST)) {
  await copyFile(path.join(DEST, f), path.join(SITE, 'app', f));
}
const banc = (await readFile(path.join(BANC, 'index.html'), 'utf8')).replace(
  '{{INFO}}',
  `${fiches.length} fiches · ${presentes.length} disciplines · ${new Date().toISOString().slice(0, 10)}`,
);
await writeFile(path.join(SITE, 'index.html'), banc, 'utf8');

const ko = (n) => `${Math.round(n / 1024)} Ko`;
console.log(`${fiches.length} fiches · ${presentes.length} disciplines`);
console.log(`  ${path.relative(ROOT, DEST)}/            PWA installable (${ko(contenu.length)} de contenu)`);
console.log(`  export/anagnosis-autonome.html   fichier unique (${ko(seul.length)})`);
console.log(`  export/site/                     site à publier (banc d'essai + /app/)`);
console.log(`  empreinte ${empreinte} — change à chaque modification de l'app`);
