/**
 * Où commence chaque phrase **dans le texte que l'app affiche** — pour le surlignage pendant
 * l'écoute.
 *
 * ## Pourquoi c'est calculé ici
 *
 * La voix lit des morceaux (une phrase de paragraphe, un intertitre) découpés sur le texte
 * **nettoyé** de ses marques (`nettoyer()` retire tous les `*`, `_` et `` ` ``), ligne par
 * ligne. L'app, elle, affiche des **blocs** (lignes consécutives réunies par une espace) dont
 * `MarkdownLeger` ne retire que les paires `*` / `**` appariées : un backtick, un tiret bas ou
 * un astérisque orphelin y restent visibles. Les deux textes diffèrent donc de quelques
 * caractères, et un décalage calculé sur l'un tomberait à côté sur l'autre.
 *
 * Le pipeline possède les deux. Il projette chaque début de phrase de la ligne nettoyée sur
 * le texte brut du bloc par une marche à deux pointeurs, qui ne saute que des marques et des
 * espaces. Au premier caractère qui ne s'aligne pas, la fiche entière est rendue sans repères
 * de phrase : l'app garde alors le suivi par paragraphe, plutôt que de surligner faux.
 *
 * Les décalages sont en unités UTF-16 : la longueur native des chaînes JavaScript et Kotlin,
 * et `String.utf16` côté Swift.
 *
 * **Le miroir de `MarkdownLeger.swift` / `MarkdownLeger.kt`** pour `blocsAffiches` et
 * `texteAffiche` : toute évolution de l'analyseur des apps doit être reportée ici, et le jeu
 * doré `test/surlignage.test.js` le vérifie.
 */
import { createHash } from 'node:crypto';
import { bornesPhrases, phrases } from './prononciation.js';

/** Ce que la marche peut sauter dans le texte affiché : des marques et des espaces. */
const SAUTABLE = new Set(['*', '_', '`', ' ', '\t']);
const GRAPHEMES = new Intl.Segmenter('fr', { granularity: 'grapheme' });

/** `MarkdownLeger.fragments`, réduit à ce qui compte ici : le texte affiché. */
export function texteAffiche(ligne) {
  // Par graphème, comme les `Character` de Swift : un `*` suivi d'un accent combinant n'est
  // pas une marque pour l'app, il ne doit pas l'être ici.
  const c = [...GRAPHEMES.segment(ligne)].map((g) => g.segment);
  let sortie = '';
  let i = 0;
  while (i < c.length) {
    if (c[i] === '*') {
      const largeur = c[i + 1] === '*' ? 2 : 1;
      const fin = fermeture(c, i + largeur, largeur);
      if (fin !== null) {
        sortie += c.slice(i + largeur, fin).join('');
        i = fin + largeur;
        continue;
      }
    }
    sortie += c[i];
    i += 1;
  }
  return sortie;
}

function fermeture(c, depuis, largeur) {
  for (let i = depuis; i < c.length; i += 1) {
    if (c[i] !== '*') continue;
    if (largeur === 1) return i > depuis ? i : null;
    if (c[i + 1] === '*') return i > depuis ? i : null;
  }
  return null;
}

/**
 * `MarkdownLeger.blocs` : les blocs du corps, chacun avec son texte affiché et les lignes
 * source qui le composent (rangs dans `contenu_vulgarise.split('\n')`).
 */
export function blocsAffiches(contenu = '') {
  const blocs = [];
  let courant = [];
  const fermer = () => {
    const texte = courant.map((x) => x.texte).join(' ').trim();
    const lignes = courant.map((x) => x.rang);
    courant = [];
    if (!texte) return;
    const intertitre = texte.startsWith('## ');
    blocs.push({ intertitre, lignes, texte: texteAffiche(intertitre ? texte.slice(3) : texte) });
  };
  contenu.split('\n').forEach((ligne, rang) => {
    const l = ligne.trim();
    if (!l) fermer(); else courant.push({ texte: l, rang });
  });
  fermer();
  return blocs;
}

/** La ligne telle que `lignesLues` la lit : sans `##`, sans marques. */
const ligneLue = (brute) => brute.replace(/^##\s*/, '').replace(/[*_`]/g, '').trim();

/**
 * Les repères de phrase de chaque bloc, ou `undefined` si un seul ne s'aligne pas.
 *
 * `debuts` : la seconde de début de chaque morceau, dans l'ordre de `morceaux(fiche)` (titre,
 * lignes du corps, citation). Rend un tableau aligné sur les blocs affichés :
 * `{ debuts: [s…], decalages: [utf16…] }`, une entrée par phrase du bloc.
 */
export function phrasesParBloc(fiche, debuts) {
  if (!Array.isArray(debuts) || !debuts.length) return undefined;
  const brutes = (fiche.contenu_vulgarise ?? '').split('\n');

  // Le rang de chaque ligne source parmi les lignes lues (le titre est la ligne lue 0), et
  // les morceaux qu'elle a donnés.
  const parLigne = new Map();
  let k = 1; // le titre est le morceau 0
  brutes.forEach((brute, rang) => {
    const lue = ligneLue(brute);
    if (!lue) return;
    const paragraphe = !/^##\s*/.test(brute);
    const bornes = paragraphe ? bornesPhrases(lue) : [0];
    parLigne.set(rang, { lue, bornes, debuts: debuts.slice(k, k + bornes.length) });
    k += bornes.length;
  });
  // Après le corps, au plus la citation ou le repère : un seul morceau.
  const attendus = k + (fiche.citation || fiche.repere ? 1 : 0);
  if (attendus !== debuts.length) return undefined;

  const sortie = [];
  for (const bloc of blocsAffiches(fiche.contenu_vulgarise)) {
    const affiche = bloc.texte;
    const r = { debuts: [], decalages: [] };
    let p = 0;
    for (const rang of bloc.lignes) {
      const ligne = parLigne.get(rang);
      if (!ligne) continue; // une ligne faite de seules marques : rien n'y est lu
      const bornes = new Set(ligne.bornes);
      for (let j = 0; j < ligne.lue.length; j += 1) {
        while (p < affiche.length && affiche[p] !== ligne.lue[j] && SAUTABLE.has(affiche[p])) p += 1;
        if (affiche[p] !== ligne.lue[j]) return undefined;
        if (bornes.has(j)) {
          r.decalages.push(p);
          r.debuts.push(ligne.debuts[ligne.bornes.indexOf(j)]);
        }
        p += 1;
      }
    }
    // Le reste du bloc ne peut être que des marques ou des espaces.
    while (p < affiche.length && SAUTABLE.has(affiche[p])) p += 1;
    if (p !== affiche.length || !r.decalages.length) return undefined;
    // Une marque ouvrante (`` ` ``, `_`) en tête de bloc appartient à la première phrase.
    r.decalages[0] = 0;
    if (!croissant(r.decalages) || !croissant(r.debuts)) return undefined;
    // Une phrase commence après une espace, jamais au milieu d'un mot ni d'un caractère.
    if (r.decalages.some((d, i) => i && !/\s/.test(affiche[d - 1]))) return undefined;
    sortie.push(r);
  }
  return sortie.length ? sortie : undefined;
}

const croissant = (t) => t.every((x, i) => typeof x === 'number' && (i === 0 || x > t[i - 1]));

/**
 * À quelle seconde commence chaque bloc affiché (`reperes`), d'après les chapitres (un par
 * ligne lue, le titre en tête).
 *
 * Même correspondance ligne source → ligne lue que `phrasesParBloc` : une ligne faite de
 * seules marques n'est pas lue, donc ne compte pas — l'ancien calcul la comptait, et tous
 * les blocs suivants héritaient du repère de leur voisin.
 */
export function reperesParBloc(fiche, chapitres) {
  if (!Array.isArray(chapitres) || !chapitres.length) return undefined;
  const rangLu = new Map();
  let lue = 1; // chapitres[0] est le titre
  (fiche.contenu_vulgarise ?? '').split('\n').forEach((brute, rang) => {
    if (ligneLue(brute)) rangLu.set(rang, lue++);
  });
  const sortie = blocsAffiches(fiche.contenu_vulgarise).map((bloc) => {
    const premiere = bloc.lignes.find((r) => rangLu.has(r));
    return premiere === undefined ? undefined : chapitres[rangLu.get(premiere)]?.debut;
  });
  return sortie.every((t) => typeof t === 'number') ? sortie : undefined;
}

/**
 * L'empreinte du découpage en morceaux d'une fiche : ce que `debuts` décrit.
 *
 * Le compte ne suffit pas : une règle de coupure qui change (`phrases()`, `ABREVIATION`)
 * peut déplacer une frontière sans changer le nombre de morceaux, et des temps justes
 * tomberaient alors sur les mauvaises phrases. Notée avec les `debuts`, comparée à la
 * publication : au moindre écart, la fiche garde le suivi par paragraphe jusqu'à sa
 * prochaine production.
 */
export function empreinteDecoupage(fiche) {
  const parts = [fiche.titre ?? ''];
  for (const brute of (fiche.contenu_vulgarise ?? '').split('\n')) {
    const lue = ligneLue(brute);
    if (!lue) continue;
    parts.push(...(/^##\s*/.test(brute) ? [lue] : phrases(lue)));
  }
  return createHash('sha256').update(JSON.stringify(parts)).digest('hex').slice(0, 16);
}
