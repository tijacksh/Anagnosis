#!/usr/bin/env node
/**
 * Retrouve le début de chaque phrase des fiches sonorisées avant que `sonoriser()` ne le
 * note (`debuts`), sans rien régénérer.
 *
 *   node outils/rattraper-phrases.mjs [dossier des fichiers .m4a] [--ecrire]
 *
 * Les pauses entre morceaux sont des silences numériques insérés par le pipeline
 * (`anullsrc`) : `silencedetect` les retrouve dans le fichier servi. Une fiche n'est
 * retenue que si **tout** concorde — exactement un silence par frontière de morceau, et
 * chaque début de ligne à moins de 80 ms du chapitre connu. Au moindre doute, elle garde le
 * suivi par paragraphe jusqu'à sa prochaine production, qui notera ses débuts d'elle-même.
 */
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';
import { existsSync } from 'node:fs';
import { loadAll } from '../src/store.js';
import { empreinteAudio, lireIndex, ecrireIndex, morceaux, DERIVES } from '../src/audio.js';
import { empreinteDecoupage } from '../src/surlignage.js';

const exec = promisify(execFile);
const dossier = process.argv.slice(2).find((a) => !a.startsWith('--')) ?? DERIVES;
const ecrire = process.argv.includes('--ecrire');
const TOLERANCE = 0.08;

/** Les silences du fichier, [début, fin] en secondes. */
async function silences(fichier, duree) {
  const { stderr } = await exec('ffmpeg', ['-hide_banner', '-i', fichier, '-af',
    `silencedetect=noise=-80dB:d=${duree}`, '-f', 'null', '-'], { maxBuffer: 1 << 24 });
  const s = [...stderr.matchAll(/silence_start: (-?[\d.]+)/g)].map((m) => Number(m[1]));
  const e = [...stderr.matchAll(/silence_end: (-?[\d.]+)/g)].map((m) => Number(m[1]));
  return s.map((d, i) => [d, e[i]]).filter(([, f]) => typeof f === 'number');
}

/** Les débuts de morceau, ou `null` si quelque chose ne concorde pas. */
function apparier(ms, chapitres, sil) {
  // Un silence par frontière : on ne garde que ceux qui ne sont ni au tout début ni à la fin.
  const internes = sil.filter(([d]) => d > 0.05);
  if (internes.length !== ms.length - 1) return null;
  const debuts = [0, ...internes.map(([, f]) => Math.round(f * 100) / 100)];
  // Chaque premier morceau de ligne doit tomber sur son chapitre.
  const vues = new Set();
  for (const [k, m] of ms.entries()) {
    if (vues.has(m.ligne)) continue;
    vues.add(m.ligne);
    const attendu = chapitres[m.ligne]?.debut;
    if (typeof attendu !== 'number' || Math.abs(attendu - debuts[k]) > TOLERANCE) return null;
  }
  return debuts;
}

const fiches = new Map((await loadAll()).map((f) => [f.id, f]));
const index = await lireIndex();
const bilan = { retenues: 0, ecartees: 0, deja: 0, sansFichier: 0, texteChange: 0 };
const ecartees = [];
for (const [id, entree] of Object.entries(index)) {
  const v = entree.voix?.[entree.voix_attribuee];
  const fiche = fiches.get(id);
  if (!v || !fiche) continue;
  if (Array.isArray(v.debuts)) { bilan.deja++; continue; }
  if (entree.empreinte_texte !== empreinteAudio(fiche)) { bilan.texteChange++; continue; }
  const fichier = path.join(dossier, v.fichier);
  if (!existsSync(fichier)) { bilan.sansFichier++; continue; }
  const ms = morceaux(fiche);
  let debuts = null;
  // Les pauses posées par le pipeline sont du silence numérique (≤ −80 dB), au moins 0,3 s ;
  // les respirations de la voix, elles, ne descendent jamais si bas.
  for (const d of [0.2, 0.25, 0.15]) {
    debuts = apparier(ms, v.chapitres, await silences(fichier, d));
    if (debuts) break;
  }
  if (!debuts) { bilan.ecartees++; ecartees.push(id); continue; }
  v.debuts = debuts;
  v.decoupage = empreinteDecoupage(fiche);
  bilan.retenues++;
}
console.log(bilan);
if (ecartees.length) console.log('écartées :', ecartees.slice(0, 20).join(', '), ecartees.length > 20 ? '…' : '');
if (ecrire && bilan.retenues) {
  // Relire juste avant d'écrire, comme `sonoriser()` : ne poser que nos `debuts`.
  const aJour = await lireIndex();
  for (const [id, entree] of Object.entries(index)) {
    const v = entree.voix?.[entree.voix_attribuee];
    const cible = aJour[id]?.voix?.[entree.voix_attribuee];
    if (v?.debuts && cible && cible.sha256 === v.sha256 && !cible.debuts) {
      cible.debuts = v.debuts;
      cible.decoupage = v.decoupage;
    }
  }
  await ecrireIndex(aJour);
  console.log('index écrit');
}
