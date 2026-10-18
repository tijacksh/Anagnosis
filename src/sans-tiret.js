/**
 * Remplace les tirets cadratins (—) du texte que lit l'utilisateur.
 *
 *     node src/sans-tiret.js            essai à blanc : compte et montre des exemples
 *     node src/sans-tiret.js --write    écrit les fiches, recalcule les empreintes
 *
 * Le tiret cadratin est l'un des 17 signes d'un texte produit en série (docs/criteres-vibecode.md,
 * n° 14). On ne touche qu'au texte lu : titre, accroche, contenu, repère, carte, quiz. Jamais aux
 * citations (verbatim), aux sources, aux notes de contrôle ni aux adresses.
 *
 * Deux empreintes dépendent du texte, et un simple changement de ponctuation ne doit relancer
 * ni l'audio ni le contrôle des sources. Pour chaque fiche **qui était à jour** avant la
 * retouche, on recalcule donc :
 *   - `controle.empreinte` (src/controle.js), pour qu'elle ne soit pas remise en file ;
 *   - l'entrée de `audio/index.json` (src/audio.js), pour qu'on ne régénère pas la voix.
 * Une fiche déjà périmée (à contrôler, ou à resonoriser) le reste : on n'efface pas un retard.
 */
import { loadAll, save } from './store.js';
import { champsLus, TIRET_CADRATIN } from './texte-lu.js';
import { empreinte as empreinteControle } from './controle.js';
import { empreinteAudio, lireIndex, ecrireIndex } from './audio.js';

const TIRET = '—';

/**
 * Réécrit une chaîne sans tiret cadratin.
 *
 * - dans « … » : intact (une citation reste telle qu'elle est) ;
 * - en tête de ligne : intact (réplique de dialogue) ;
 * - deux tirets dans la même phrase = une incise : virgules si elle est courte et simple,
 *   parenthèses si elle dépasse six mots ou porte déjà de la ponctuation ;
 * - un tiret seul : virgule s'il prolonge la phrase (et, mais, qui, de…) ou si elle porte déjà des
 *   deux-points ; deux-points sinon (explication, énumération, chiffre, nom propre).
 */
export function sansTiret(texte) {
  const gardes = [];
  const masque = texte.replace(/«[^»]*»/g, (m) => { gardes.push(m); return `\u0001${gardes.length - 1}\u0002`; });
  const lignes = masque.split('\n').map((ligne) => {
    if (!ligne.includes(TIRET) || ligne.trimStart().startsWith(TIRET)) return ligne;
    // Découpe en phrases : fin de phrase = . ! ? … suivi d'une espace.
    const phrases = ligne.split(/(?<=[.!?…])(\s+)/);
    return phrases.map(unePhrase).join('');
  });
  return lignes.join('\n').replace(/\u0001(\d+)\u0002/g, (_, i) => gardes[Number(i)]);
}

/** Mots qui prolongent la phrase : le tiret devient une virgule. */
const SUITE = /^(et|mais|ou|ni|donc|car|or|puis|que|qu'|qui|dont|où|sans|pour|de|d'|du|des|à|au|aux|en|avec|alors|soit|quand|lorsque|parce|comme|sauf|même|ni|jusqu)\b/i;

function unePhrase(p) {
  if (!p.includes(TIRET)) return p;
  const morceaux = p.split(new RegExp(`\\s*${TIRET}\\s*`));
  if (morceaux.length === 1) return p;
  let sortie = morceaux[0];
  let i = 1;
  // Incises par paires : virgules si l'incise est courte et simple, parenthèses sinon.
  while (morceaux.length - i >= 2) {
    const incise = morceaux[i].replace(/[,\s]+$/, '');
    const suite = morceaux[i + 1];
    const longue = /[,;:]/.test(incise) || incise.split(/\s+/).length > 6;
    sortie += longue ? ` (${incise}) ${suite}` : `, ${incise}, ${suite}`;
    sortie = sortie.replace(/,\s*,/g, ',').replace(/\s+([,.;])/g, '$1').replace(/\(\s+/g, '(').replace(/\s+\)/g, ')');
    i += 2;
  }
  // Dernier tiret seul : deux-points pour une explication ou une énumération, virgule pour une suite.
  if (i < morceaux.length) {
    const suite = morceaux[i];
    if (!suite) return sortie;
    const virgule = SUITE.test(suite.trimStart()) || /\s:\s/.test(sortie) || suite.trimStart().startsWith(',');
    sortie += virgule ? `, ${suite.replace(/^,\s*/, '')}` : ` : ${suite}`;
  }
  return sortie.replace(/ {2,}/g, ' ');
}

function retouche(fiche) {
  let n = 0;
  const avant = [];
  for (const [objet, cle] of champsLus(fiche)) {
    const v = objet[cle];
    if (!v.includes(TIRET)) continue;
    const w = sansTiret(v);
    if (w !== v) { avant.push([v, w]); objet[cle] = w; n += (v.split(TIRET).length - 1) - (w.split(TIRET).length - 1); }
  }
  return { n, avant };
}

if (process.argv[1]?.endsWith('sans-tiret.js')) {
  const ecrire = process.argv.includes('--write');
  const fiches = await loadAll();
  const index = await lireIndex();
  let fichesTouchees = 0; let tirets = 0; let controleGarde = 0; let audioGarde = 0; let audioATraiter = 0;
  const exemples = [];
  for (const fiche of fiches) {
    const controleAJour = fiche.controle?.empreinte && fiche.controle.empreinte === empreinteControle(fiche);
    const entree = index[fiche.id];
    const audioAJour = entree && entree.empreinte === empreinteAudio(fiche);
    const { n, avant } = retouche(fiche);
    if (!n) continue;
    fichesTouchees += 1; tirets += n;
    if (exemples.length < 400) exemples.push(...avant.slice(0, 2));
    if (controleAJour) { fiche.controle.empreinte = empreinteControle(fiche); controleGarde += 1; }
    if (audioAJour) { entree.empreinte = empreinteAudio(fiche); audioGarde += 1; } else if (entree) audioATraiter += 1;
    if (ecrire) await save(fiche);
  }
  if (ecrire) await ecrireIndex(index);
  console.log(`${ecrire ? 'écrit' : 'essai à blanc'} : ${tirets} tirets retirés dans ${fichesTouchees} fiches`);
  console.log(`empreinte de contrôle conservée : ${controleGarde} ; audio conservé sans régénération : ${audioGarde} ; audio déjà périmé avant : ${audioATraiter}`);
  if (process.argv.includes('--exemples')) {
    for (const [a, b] of exemples) {
      const i = a.indexOf(TIRET);
      console.log(`\n- ${a.slice(Math.max(0, i - 50), i + 70).replace(/\n/g, ' ')}\n+ ${b.slice(Math.max(0, i - 50), i + 70).replace(/\n/g, ' ')}`);
    }
  }
}
