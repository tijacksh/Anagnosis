#!/usr/bin/env node
/**
 * CLI du pipeline — contrôle qualité et export.
 *
 *   npm run validate   contrôle toutes les fiches (code de sortie 1 si erreur)
 *   npm run queue      file d'attente de relecture, par discipline
 *   npm run cible      quelle discipline alimenter maintenant, et combien
 *   npm run acontroler quelles fiches restent à relire au fond
 *   npm run stats      état de la base
 *   npm run export     export des fiches publiables vers export/
 */
import { writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { loadAll, ROOT } from './store.js';
import { validerLot } from './validate.js';
import { DISCIPLINES, STATUTS_LABELS } from './schema.js';
import { cible as choisirCible, afficher } from './cible.js';
import { file as fileControle, afficher as afficherControle, marquer } from './controle.js';
import { fichesPubliables, serialiser } from './publier.js';

const C = {
  reset: '\x1b[0m', dim: '\x1b[2m', bold: '\x1b[1m',
  red: '\x1b[31m', green: '\x1b[32m', yellow: '\x1b[33m', blue: '\x1b[34m',
};
const c = (color, s) => `${C[color]}${s}${C.reset}`;

async function cmdValidate() {
  const resultats = validerLot(await loadAll());
  if (!resultats.length) {
    console.log(c('yellow', 'Aucune fiche dans content/concepts/.'));
    return 0;
  }

  let nbErreurs = 0;
  let nbAlertes = 0;

  for (const { fiche, erreurs, alertes, mots } of resultats) {
    nbErreurs += erreurs.length;
    nbAlertes += alertes.length;

    if (!erreurs.length && !alertes.length) {
      console.log(`${c('green', '✓')} ${fiche.id} ${c('dim', `— ${mots} mots`)}`);
      continue;
    }
    const marque = erreurs.length ? c('red', '✗') : c('yellow', '!');
    console.log(`${marque} ${c('bold', fiche.id)} ${c('dim', `— ${mots} mots`)}`);
    for (const e of erreurs) console.log(`    ${c('red', 'erreur')}  ${e}`);
    for (const a of alertes) console.log(`    ${c('yellow', 'alerte')}  ${a}`);
  }

  console.log();
  const resume = `${resultats.length} fiche(s) — ${nbErreurs} erreur(s), ${nbAlertes} alerte(s)`;
  console.log(nbErreurs ? c('red', resume) : c('green', resume));
  return nbErreurs ? 1 : 0;
}

async function cmdQueue() {
  const fiches = await loadAll();
  const aRelire = fiches.filter((f) => ['brouillon', 'en_retouche'].includes(f.statut));

  if (!aRelire.length) {
    console.log(c('green', 'File vide — rien à relire.'));
    return 0;
  }

  const parDiscipline = new Map();
  for (const f of aRelire) {
    if (!parDiscipline.has(f.discipline)) parDiscipline.set(f.discipline, []);
    parDiscipline.get(f.discipline).push(f);
  }

  for (const [discipline, liste] of [...parDiscipline].sort()) {
    console.log(c('bold', `\n${DISCIPLINES[discipline] ?? discipline} (${liste.length})`));
    for (const f of liste) {
      const etat = f.statut === 'en_retouche' ? c('yellow', '[à retoucher]') : c('dim', '[brouillon]');
      console.log(`  ${etat} ${f.titre}  ${c('dim', f.id)}`);
    }
  }
  console.log(c('dim', `\n${aRelire.length} fiche(s) en attente — \`npm run admin\` pour relire.`));
  return 0;
}

async function cmdStats() {
  const fiches = await loadAll();
  const parStatut = new Map();
  const parDiscipline = new Map();

  for (const f of fiches) {
    parStatut.set(f.statut, (parStatut.get(f.statut) ?? 0) + 1);
    parDiscipline.set(f.discipline, (parDiscipline.get(f.discipline) ?? 0) + 1);
  }

  console.log(c('bold', `\nBase de connaissance — ${fiches.length} fiche(s)\n`));
  console.log(c('bold', 'Par statut'));
  for (const [statut, label] of Object.entries(STATUTS_LABELS)) {
    const n = parStatut.get(statut) ?? 0;
    if (n) console.log(`  ${String(n).padStart(4)}  ${label}`);
  }

  console.log(c('bold', '\nPar discipline'));
  for (const [discipline, n] of [...parDiscipline].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${String(n).padStart(4)}  ${DISCIPLINES[discipline] ?? discipline}`);
  }

  // Brief §9 : viser 200-300 fiches validées avant lancement (60-90 jours d'avance).
  const publiables = fiches.filter((f) => ['valide', 'publie'].includes(f.statut)).length;
  console.log(c('bold', '\nAvance de publication'));
  console.log(`  ${publiables} fiche(s) prête(s) → ${publiables} jour(s) de contenu`);
  console.log(c('dim', `  objectif avant lancement public : 200-300 (brief §9)`));
  return 0;
}

async function cmdExport() {
  const resultats = validerLot(await loadAll());
  const bloquantes = resultats.filter(
    (r) => ['valide', 'publie'].includes(r.fiche.statut) && !r.ok,
  );

  if (bloquantes.length) {
    console.error(c('red', `${bloquantes.length} fiche(s) validée(s) ne passent pas le contrôle qualité :`));
    for (const r of bloquantes) console.error(`  ${r.fiche.id} — ${r.erreurs[0]}`);
    return 1;
  }

  // Toutes les disciplines sont exportées : l'export livre la base, il ne décide
  // pas de ce qui est servi. C'est le client qui n'offre une discipline qu'une fois
  // qu'elle a du stock et une encre (docs/charte-visuelle.md §2.2) — retenir ici une
  // fiche écrite et validée reviendrait à la perdre deux fois.
  // La projection vient de `src/publier.js` : c'est la **même** que celle du fichier
  // téléchargé par l'app. Si les deux divergeaient, une fiche n'aurait pas la même
  // forme selon qu'elle est embarquée ou reçue par le réseau, et le décodeur du
  // client casserait sur l'une des deux — en clientèle, et seulement chez les gens
  // qui ont déjà téléchargé.
  const aExporter = await fichesPubliables(resultats.map((r) => r.fiche));

  const dir = path.join(ROOT, 'export');
  await mkdir(dir, { recursive: true });
  const cible = path.join(dir, 'concepts.json');
  await writeFile(cible, serialiser(aExporter));

  console.log(c('green', `${aExporter.length} fiche(s) exportée(s) → ${path.relative(ROOT, cible)}`));
  return 0;
}

const commandes = {
  validate: cmdValidate, queue: cmdQueue, stats: cmdStats, export: cmdExport,
  cible: cmdCible, acontroler: cmdAControler, controle: cmdControle,
};
const commande = process.argv[2];

if (!commandes[commande]) {
  console.error(`Usage : node src/cli.js <${Object.keys(commandes).join('|')}>`);
  process.exit(2);
}
process.exit(await commandes[commande]());

/** Que produire maintenant ? La décision est dans `src/cible.js`. */
async function cmdCible() {
  afficher(await choisirCible());
}

/** Que relire au fond maintenant ? La décision est dans `src/controle.js`. */
async function cmdAControler() {
  afficherControle(await fileControle());
}

/** Pose la trace de contrôle : `controle <id> <verdict> [note...]`. */
async function cmdControle() {
  const [id, verdict, ...notes] = process.argv.slice(3);
  if (!id || !verdict) {
    console.error('Usage : node src/cli.js controle <id> <ok|corrige|a_revoir> [note...]');
    return 2;
  }
  try {
    const trace = await marquer(id, verdict, notes);
    console.log(c('green', `${id} — ${trace.verdict} (empreinte ${trace.empreinte})`));
  } catch (e) {
    console.error(c('red', e.message));
    return 1;
  }
  return 0;
}
