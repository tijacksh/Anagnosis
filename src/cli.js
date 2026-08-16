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
import { DISCIPLINES, SANS_ECOUTE, STATUTS_LABELS } from './schema.js';
import { cible as choisirCible, afficher } from './cible.js';
import { file as fileControle, afficher as afficherControle, marquer, reparation } from './controle.js';
import { file as fileReparer, afficher as afficherReparer } from './reparer.js';
import { file as fileRelire, afficher as afficherRelire, relecture } from './relire.js';
import { file as fileAudio, afficher as afficherAudio, sonoriser } from './audio.js';
import { file as fileHeberger, afficher as afficherHeberger, televerserTout } from './heberger.js';
import { file as fileDroit, afficher as afficherDroit, marquer as marquerDroit } from './droit.js';
import { fichesPubliables, serialiser, retirees } from './publier.js';

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
  const sorties = retirees(resultats.map((r) => r.fiche));
  await writeFile(cible, serialiser(aExporter, sorties));

  console.log(c('green', `${aExporter.length} fiche(s) exportée(s) → ${path.relative(ROOT, cible)}`));
  return 0;
}

const commandes = {
  validate: cmdValidate, queue: cmdQueue, stats: cmdStats, export: cmdExport,
  cible: cmdCible, acontroler: cmdAControler, controle: cmdControle,
  areparer: cmdAReparer, reparation: cmdReparation,
  arelire: cmdARelire, relecture: cmdRelecture,
  asonoriser: cmdASonoriser, sonoriser: cmdSonoriser,
  adroit: cmdADroit, 'controle-droit': cmdControleDroit,
  heberger: cmdHeberger,
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

/**
 * Quelles fiches juridiques redemandent une revue ? La décision est dans `src/droit.js`.
 *
 * Une file à part parce que son déclencheur l'est : le contrôle ordinaire repasse quand
 * le texte bouge, celle-ci quand le temps passe.
 */
async function cmdADroit() {
  afficherDroit(await fileDroit());
}

/** Pose la trace d'une revue juridique. */
async function cmdControleDroit() {
  const [id, verdict, ...notes] = process.argv.slice(3);
  if (!id || !verdict) {
    console.error('Usage : node src/cli.js controle-droit <id> <ok|a_revoir> [note...]');
    return 2;
  }
  try {
    const trace = await marquerDroit(id, verdict, notes);
    console.log(c('green', `${id} — ${trace.verdict} (revue du ${trace.fait_le})`));
  } catch (e) {
    console.error(c('red', e.message));
    return 1;
  }
  return 0;
}

/** Que réparer maintenant ? La décision est dans `src/reparer.js`. */
async function cmdAReparer() {
  afficherReparer(await fileReparer());
}

/** Quels brouillons sont décidables maintenant ? La décision est dans `src/relire.js`. */
async function cmdARelire() {
  afficherRelire(await fileRelire());
}

/** Quelles fiches n'ont pas d'audio à jour ? La décision est dans `src/audio.js`. */
async function cmdASonoriser() {
  afficherAudio(await fileAudio());
}

/**
 * Produit l'audio : `sonoriser <id>`, ou `sonoriser --lot` pour tout le passage.
 *
 * Chaque appel coûte des crédits, donc rien ne part sans qu'on l'ait demandé — et la
 * commande dit ce qu'elle va dépenser avant de le dépenser.
 */
async function cmdSonoriser() {
  const args = process.argv.slice(3);
  const force = args.includes('--force');
  const cibles = args.filter((a) => !a.startsWith('--'));
  const lot = args.includes('--lot');

  if (!cibles.length && !lot) {
    console.error('Usage : node src/cli.js sonoriser <id…> | --lot [--force]');
    return 2;
  }

  const f = await fileAudio();
  const fiches = lot
    ? f.lot.map((e) => e.fiche)
    : (await loadAll()).filter((x) => cibles.includes(x.id));

  const introuvables = cibles.filter((id) => !fiches.some((x) => x.id === id));
  if (introuvables.length) {
    console.error(c('red', `fiche(s) introuvable(s) : ${introuvables.join(', ')}`));
    return 1;
  }
  // `--lot` ne les propose déjà pas, mais un identifiant donné à la main court-circuite
  // la file. On refuse ici plutôt que de dépenser les crédits : la commande est le
  // dernier endroit où « on ne sonorise pas cette discipline » peut encore être tenu.
  const interdites = fiches.filter((x) => SANS_ECOUTE.has(x.discipline));
  if (interdites.length) {
    console.error(c('red', `discipline sans écoute : ${interdites.map((x) => x.id).join(', ')}`));
    return 1;
  }
  if (!fiches.length) {
    console.log('Rien à produire.');
    return 0;
  }

  let echecs = 0;
  for (const fiche of fiches) {
    try {
      const entree = await sonoriser(fiche, { force });
      const voix = Object.entries(entree.voix)
        .map(([nom, v]) => `${nom} ${Math.floor(v.secondes / 60)}m${String(v.secondes % 60).padStart(2, '0')}`)
        .join(' · ');
      console.log(c('green', `  ✓ ${fiche.id}  ${voix}`));
    } catch (e) {
      // Une fiche en échec n'arrête pas les autres : ce qui est produit est acquis.
      console.error(c('red', `  ✗ ${fiche.id}  ${e.message}`));
      echecs += 1;
    }
  }
  return echecs ? 1 : 0;
}

/**
 * Téléverse vers R2 les dérivés produits mais pas encore en ligne.
 *
 * Séparée de `sonoriser` : ça ne coûte rien et se rejoue sans risque, contrairement à
 * un appel ElevenLabs. `npm run heberger` dit d'abord quoi téléverser, la commande fait
 * le travail.
 */
async function cmdHeberger() {
  const aFaire = await fileHeberger();
  if (!aFaire.length) {
    console.log(c('green', 'Rien à téléverser — chaque voix publiable est déjà dans le bucket.'));
    return 0;
  }
  console.log(`${aFaire.length} fichier(s) à téléverser vers R2 :`);
  for (const e of aFaire) console.log(`  ${e.ficheId} — ${e.voix}`);

  const resultats = await televerserTout();
  afficherHeberger(resultats);
  return resultats.some((r) => !r.ok) ? 1 : 0;
}

/** Pose la décision d'une relecture : `relecture <id> <statut> "note"`. */
async function cmdRelecture() {
  const [id, statut, ...notes] = process.argv.slice(3);
  if (!id || !statut) {
    console.error('Usage : node src/cli.js relecture <id> <valide|en_retouche|rejete> "note"');
    return 2;
  }
  try {
    const f = await relecture(id, statut, notes);
    console.log(c('green', `${id} — ${f.statut} (par ${f.validation.decide_par})`));
  } catch (e) {
    console.error(c('red', e.message));
    return 1;
  }
  return 0;
}

/** Pose la décision d'une réparation : `reparation <id> <statut> "note"`. */
async function cmdReparation() {
  const [id, statut, ...notes] = process.argv.slice(3);
  if (!id || !statut) {
    console.error('Usage : node src/cli.js reparation <id> <valide|en_retouche|rejete> "note"');
    return 2;
  }
  try {
    const f = await reparation(id, statut, notes);
    console.log(c('green', `${id} — ${f.statut} (par ${f.validation.decide_par})`));
  } catch (e) {
    console.error(c('red', e.message));
    return 1;
  }
  return 0;
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
