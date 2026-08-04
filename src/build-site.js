#!/usr/bin/env node
/**
 * Assemble le site public — anagnosis.fr.
 *
 *   npm run site   → export/site/   (ce que publie Netlify)
 *
 * Deux choses distinctes, sous un seul dossier :
 *
 * 1. **La vitrine** (`site/index.html`) — présente le produit, renvoie vers les
 *    stores. Statique, aucune dépendance : les polices viennent de Google Fonts en
 *    CDN (seule exception au principe « zéro appel réseau », qui vaut pour le
 *    pipeline et les apps clientes, pas pour une page web publique).
 *
 * 2. **Le contenu signé** (`export/site/contenu/`) — c'est ce que l'app télécharge
 *    pour recevoir de nouvelles fiches sans passer par l'App Store / Play Store.
 *    Repris tel quel de l'ancien `build-app.js` : c'est l'infrastructure de
 *    production, elle ne bouge pas quand la vitrine change.
 *
 * Ce script remplace `build-app.js` et l'« esquisse jouable » qu'il assemblait
 * (`app/`, `banc/`) — retirée une fois que les apps natives (iOS, Android) ont pu
 * être testées directement sur simulateur et appareil réel. Voir CLAUDE.md.
 */
import { readFile, writeFile, mkdir, copyFile } from 'node:fs/promises';
import path from 'node:path';
import { loadAll, ROOT } from './store.js';
import { fichesPubliables, serialiser, signer, retirees, CLE_ENV } from './publier.js';

const SRC = path.join(ROOT, 'site');
const DEST = path.join(ROOT, 'export', 'site');

const toutes = await loadAll();
const publiables = toutes.filter((f) => ['valide', 'publie'].includes(f.statut));

const disciplinesAffichees = [...new Set(publiables.map((f) => f.discipline))].sort();
const { DISCIPLINES, ENCRES } = await import('./schema.js');
const puces = Object.keys(DISCIPLINES)
  .filter((d) => ENCRES[d])
  .sort((a, b) => DISCIPLINES[a].localeCompare(DISCIPLINES[b], 'fr'))
  .map((d) => `<span class="discipline"><span class="point" style="background:${ENCRES[d]}"></span>${DISCIPLINES[d]}</span>`)
  .join('\n      ');

await mkdir(DEST, { recursive: true });

const html = (await readFile(path.join(SRC, 'index.html'), 'utf8'))
  .replace('{{DISCIPLINES}}', puces);
await writeFile(path.join(DEST, 'index.html'), html, 'utf8');

for (const f of ['icone.svg', 'icone-180.png', 'icone-512.png']) {
  await copyFile(path.join(SRC, f), path.join(DEST, f));
}

// Le contenu du client iOS et Android, signé — voir docs/passation-audio.md pour
// ce que ce fichier porte et pourquoi il est signé.
//
// **Sans clé, on ne publie rien.** Un `concepts.json` non signé serait refusé par
// les apps de toute façon ; le publier quand même donnerait un endpoint qui a
// l'air de marcher et ne marche pas. Mieux vaut qu'il soit absent, et que le
// build le dise.
const octetsContenu = serialiser(await fichesPubliables(publiables), retirees(toutes));
const signature = await signer(octetsContenu);
if (signature) {
  const dossier = path.join(DEST, 'contenu');
  await mkdir(dossier, { recursive: true });
  await writeFile(path.join(dossier, 'concepts.json'), octetsContenu);
  await writeFile(path.join(dossier, 'concepts.json.sig'), `${signature}\n`, 'utf8');
}

const ko = (n) => `${Math.round(n / 1024)} Ko`;
console.log(`${publiables.length} fiche(s) publiable(s), ${disciplinesAffichees.length} discipline(s) en stock`);
console.log(`  export/site/            vitrine + contenu`);
console.log(signature
  ? `  export/site/contenu/    contenu signé (${ko(octetsContenu.length)})`
  : `  export/site/contenu/    NON PUBLIÉ — aucune clé de signature (${CLE_ENV})`);
