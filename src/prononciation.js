/**
 * La prononciation des noms propres : des réécritures, appliquées au seul texte envoyé
 * au moteur de voix.
 *
 *     audio/prononciations.json      les règles, versionnées
 *     outils/sources-prononciation.mjs   va chercher la prononciation en ligne
 *
 * ## Pourquoi des réécritures, et pas des phonèmes
 *
 * Le moteur local (OmniVoice, `docs/decisions.md`, 2026-10-20) ne lit que du texte : il
 * n'accepte ni SSML ni alphabet phonétique. On dirige donc la prononciation comme un
 * lecteur la dirigerait sur son script : en réécrivant le nom tel qu'un Français le lirait
 * pour le dire juste — « Eichmann » devient « Aïchmann ». La réécriture ne touche **que**
 * le texte envoyé au moteur, jamais celui que l'app affiche.
 *
 * ## Le piège que l'empreinte doit couvrir
 *
 * Une règle corrigée ne sert à rien si les fiches qu'elle touche ne repassent pas en
 * production : le son garderait l'ancienne prononciation, et rien ne le signalerait —
 * exactement le défaut silencieux que `audio/index.json` existe pour éviter. L'empreinte
 * audio couvre donc aussi les règles qui s'appliquent à la fiche (`reglesTouchant`), et
 * seulement celles-là : ajouter une règle pour « Kant » ne refait pas toute la chimie.
 */
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { ROOT } from './store.js';

export const FICHIER = path.join(ROOT, 'audio', 'prononciations.json');

/** Les règles, ou aucune si le fichier n'existe pas encore. */
export async function lireRegles(fichier = FICHIER) {
  try {
    const { regles = [] } = JSON.parse(await readFile(fichier, 'utf8'));
    return regles;
  } catch (e) {
    if (e.code === 'ENOENT') return [];
    throw e;
  }
}

const echapper = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Une seule expression pour toutes les règles, les noms les plus longs d'abord.
 *
 * Les bornes portent sur toute lettre, chiffre ou marque Unicode : `\b` ne connaît pas les
 * lettres accentuées, et sans cela une règle pour « Kant » toucherait « Kantien », une
 * règle pour « Hertz » toucherait « kilohertz ».
 *
 * **Un seul passage, jamais une règle après l'autre.** Appliquées en chaîne, une règle
 * pourrait réécrire la sortie d'une autre (le « dire » de « Hans-Ulrich Schnitzler »
 * contenant « Schnitzler »), et l'empreinte compterait alors une règle qui n'a rien changé,
 * ou en manquerait une qui a changé le texte. Ici, chaque morceau du texte est pris par une
 * règle au plus, et les règles « touchées » sont exactement celles qui ont trouvé quelque
 * chose.
 */
function expression(regles) {
  const noms = [...new Set(regles.map((r) => r.nom.normalize('NFC')))].sort((a, b) => b.length - a.length);
  if (!noms.length) return null;
  return new RegExp(`(?<![\\p{L}\\p{N}\\p{M}])(?:${noms.map(echapper).join('|')})(?![\\p{L}\\p{N}\\p{M}])`, 'gu');
}

function parcourir(texte, regles) {
  const net = texte.normalize('NFC');
  const re = expression(regles);
  if (!re) return { sortie: net, touchees: [] };
  const parNom = new Map(regles.map((r) => [r.nom.normalize('NFC'), r]));
  const touchees = new Map();
  // Une fonction, pas une chaîne : un « $ » dans une réécriture ne doit rien interpréter.
  const sortie = net.replace(re, (m) => { const r = parNom.get(m); touchees.set(r.nom, r); return r.dire; });
  return { sortie, touchees: [...touchees.values()] };
}

/** Les règles qui changent effectivement ce texte — la base de l'empreinte. */
export function reglesTouchant(texte, regles) {
  return parcourir(texte, regles).touchees;
}

/** Applique les règles au texte destiné au moteur, en un seul passage. */
export function appliquer(texte, regles) {
  return parcourir(texte, regles).sortie;
}

/**
 * Ce que le dictionnaire doit respecter pour ne jamais mentir à l'empreinte.
 *
 * Un nom vide toucherait chaque frontière de mot du catalogue ; un saut de ligne casserait
 * le découpage en blocs ; une réécriture qui contient le nom d'une autre règle ferait
 * dépendre le résultat de l'ordre. Renvoie la liste des problèmes, vide si tout va bien.
 */
export function problemes(regles) {
  const out = [];
  const vus = new Set();
  for (const r of regles) {
    if (!r.nom?.trim() || !r.dire?.trim()) out.push(`règle vide : ${JSON.stringify(r)}`);
    if (/\n/.test(`${r.nom}${r.dire}`)) out.push(`saut de ligne dans « ${r.nom} »`);
    if (vus.has(r.nom)) out.push(`nom en double : « ${r.nom} »`);
    vus.add(r.nom);
  }
  for (const r of regles) for (const autre of regles) {
    if (r !== autre && autre.nom && reglesTouchant(r.dire, [autre]).length) out.push(`la réécriture de « ${r.nom} » contient « ${autre.nom} »`);
  }
  return out;
}

/**
 * De l'alphabet phonétique international vers une graphie que le moteur lira juste.
 *
 * Ce n'est pas une transcription savante : c'est la graphie qu'un lecteur français
 * prononcerait comme le nom d'origine, au plus près. Les sons absents du français sont
 * rapprochés du voisin le plus proche (le *ch* allemand de « ich » devient « ch »).
 * Le résultat est une **proposition** : une règle n'entre dans le dictionnaire qu'après
 * une écoute avant/après.
 */
const SONS = [
  // diphtongues, avant les voyelles simples (le Wiktionnaire note la semi-voyelle « j »)
  ['aj', 'aï'], ['ɛj', 'èï'], ['ej', 'éï'], ['oj', 'oï'], ['ɔj', 'oï'], ['uj', 'ouï'],
  ['aɪ', 'aï'], ['ai', 'aï'], ['aʊ', 'aou'], ['au', 'aou'], ['ɔʏ', 'oï'], ['ɔɪ', 'oï'], ['oɪ', 'oï'],
  ['eɪ', 'éï'], ['ei', 'éï'], ['ɛi', 'èï'], ['œy', 'eu'], ['oʊ', 'ô'], ['əʊ', 'ô'], ['ɪə', 'ieu'],
  ['eə', 'èeu'], ['ʊə', 'oueu'],
  // consonnes syllabiques (allemand « -del », « -ken ») : une voyelle sourde avant
  ['l̩', 'eul'], ['n̩', 'eun'], ['m̩', 'eum'],
  // affriquées, avant les consonnes simples
  ['tʃ', 'tch'], ['dʒ', 'dj'], ['ts', 'ts'], ['pf', 'pf'],
  // voyelles nasales (prononciations françaises)
  ['ɑ̃', 'A~'], ['ɛ̃', 'I~'], ['ɔ̃', 'O~'], ['œ̃', 'U~'],
  // voyelles
  ['iː', 'i'], ['i', 'i'], ['ɪ', 'i'], ['yː', 'u'], ['y', 'u'], ['ʏ', 'u'], ['uː', 'ou'], ['u', 'ou'],
  ['ʊ', 'ou'], ['eː', 'é'], ['e', 'é'], ['ɛː', 'è'], ['ɛ', 'è'], ['øː', 'eu'], ['ø', 'eu'], ['œ', 'eu'],
  ['ɜː', 'eu'], ['ɜ', 'eu'], ['ə', 'eu'], ['ɐ̯', 'r'], ['ɐ', 'R~'], ['ʌ', 'a'], ['æ', 'a'], ['aː', 'a'], ['a', 'a'],
  ['ɑː', 'a'], ['ɑ', 'a'], ['ɒ', 'o'], ['ɔː', 'o'], ['ɔ', 'o'], ['oː', 'o'], ['o', 'o'],
  // consonnes
  ['ʃ', 'ch'], ['ʒ', 'j'], ['ç', 'ch'], ['x', 'kh'], ['χ', 'kh'], ['θ', 'th'], ['ð', 'dh'],
  ['ŋk', 'N~k'], ['ŋ', 'N~g'], ['ɲ', 'gn'], ['j', 'y'], ['w', 'ou'], ['ʋ', 'v'], ['ɹ', 'r'], ['ʁ', 'r'], ['r', 'r'],
  ['ɾ', 'r'], ['ɡ', 'g'], ['g', 'g'], ['k', 'k'], ['c', 'k'], ['ɫ', 'l'], ['l', 'l'], ['ʎ', 'ill'],
  ['h', 'h'], ['b', 'b'], ['d', 'd'], ['f', 'f'], ['m', 'm'], ['n', 'n'], ['p', 'p'], ['s', 's'],
  ['t', 't'], ['v', 'v'], ['z', 'z'],
];
const IGNORES = /[ˈˌ.ʔːˑ̯̩̃()\[\]/\\‿͡]/gu;

export function ipaVersFrancais(ipa) {
  const mots = ipa.normalize('NFC').replace(/[\[\]/\\]/g, '').trim().split(/\s+/);
  return mots.map((mot) => {
    let reste = mot.normalize('NFD').replace(/[ˈˌ.ʔ]/g, '').normalize('NFC');
    let out = '';
    while (reste.length) {
      const son = SONS.find(([s]) => reste.startsWith(s));
      if (son) { out += son[1]; reste = reste.slice(son[0].length); }
      else reste = reste.slice(1);   // signe diacritique ou symbole inconnu : on l'ignore
    }
    out = out.replace(IGNORES, '');
    // Une voyelle orale suivie de n ou m, puis d'une consonne ou de la fin du mot, se
    // lirait nasale (« -man » comme « Allemand ») : on double la consonne (« -mann »).
    out = out.replace(/([aeiouéèïô])([nm])(?=[^aeiouyéèêëïônm~]|$)/gu, '$1$2$2');
    // Le « -er » final allemand (ɐ) se dit « eur » ; ailleurs, c'est un « a » sourd.
    out = out.replace(/R~$/u, 'eur').replace(/R~/g, 'a');
    // Le « ng » d'origine n'est pas un « n » à doubler.
    out = out.replace(/N~/g, 'n');
    // Les vraies nasales, gardées à l'écart jusqu'ici, reprennent leur graphie.
    out = out.replace(/A~/g, 'an').replace(/I~/g, 'in').replace(/O~/g, 'on').replace(/U~/g, 'un');
    // Graphie française : une consonne finale muette serait avalée (« Hertz » → « hèrts »
    // lu « hèr »). On la fait entendre par un « e » muet final.
    out = out.replace(/([tdspkgzf])$/u, '$1e');
    // « s » entre deux voyelles se lirait « z » : on le double.
    out = out.replace(/([aeiouyéèêëïô])s([aeiouyéèêëïô])/gu, '$1ss$2');
    // « g » devant e, i, é, è se lirait « j » : on écrit « gu ».
    out = out.replace(/g([eiéèêy])/gu, 'gu$1');
    return out.charAt(0).toUpperCase() + out.slice(1);
  }).join(' ');
}

/**
 * Cette transcription décrit-elle bien ce nom ?
 *
 * Garde-fou contre la source qui répond à côté : une redirection (« Pays-Bas » renvoie la
 * prononciation de *Nederland*) ou un nom complet mal découpé (le dernier mot de « Luis
 * Buñuel Portolés »). On compare les familles de consonnes du nom écrit et de la
 * transcription : sans la moitié en commun, c'est un autre mot.
 */
const FAMILLES = [
  [/[pb]/, 'P'], [/[td]/, 'T'], [/[kgcqɡxχç]/, 'K'], [/[fvʋw]/, 'F'], [/[szʃʒ]/, 'S'],
  [/[mn]|ŋ|ɲ/, 'N'], [/[lɫʎ]/, 'L'], [/[rʁɹɾ]/, 'R'], [/[θð]/, 'T'], [/j|y/, 'J'],
];
function familles(chaine) {
  const out = new Set();
  for (const c of chaine.normalize('NFD').toLowerCase()) {
    const f = FAMILLES.find(([re]) => re.test(c));
    if (f) out.add(f[1]);
  }
  return out;
}
export function coherent(nom, ipa) {
  const a = familles(nom.replace(/sch/gi, 's').replace(/ch/gi, 's').replace(/ph/gi, 'f').replace(/th/gi, 't'));
  const b = familles(ipa);
  if (!a.size || !b.size) return false;
  const communes = [...a].filter((x) => b.has(x)).length;
  return communes / Math.max(a.size, b.size) >= 0.5;
}

// ── Le texte dit : années à l'oral, phrases ─────────────────────────────────────────
//
// Deux réglages de lecture retenus à l'écoute (docs/decisions.md, 2026-10-20), qui ne
// touchent, comme les réécritures, que le texte envoyé au moteur.

const UNITES = ['zéro', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf', 'dix',
  'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize', 'dix-sept', 'dix-huit', 'dix-neuf'];
const DIZAINES = { 2: 'vingt', 3: 'trente', 4: 'quarante', 5: 'cinquante', 6: 'soixante' };

function moinsDeCent(n) {
  if (n < 20) return UNITES[n];
  const d = Math.floor(n / 10), u = n % 10;
  if (d === 7) return u === 1 ? 'soixante-et-onze' : `soixante-${UNITES[10 + u]}`;
  if (d === 8) return u ? `quatre-vingt-${UNITES[u]}` : 'quatre-vingts';
  if (d === 9) return `quatre-vingt-${UNITES[10 + u]}`;
  return u === 0 ? DIZAINES[d] : u === 1 ? `${DIZAINES[d]}-et-un` : `${DIZAINES[d]}-${UNITES[u]}`;
}

/** 1979 → « dix-neuf cent soixante-dix-neuf » ; 2024 → « deux mille vingt-quatre ». */
export function annee(n) {
  if (n >= 1100 && n <= 1999) {
    const s = Math.floor(n / 100), r = n % 100;
    return `${moinsDeCent(s)} cent${r ? ` ${moinsDeCent(r)}` : ''}`;
  }
  if (n >= 2000 && n <= 2099) return `deux mille${n % 100 ? ` ${moinsDeCent(n % 100)}` : ''}`;
  return String(n);
}

/**
 * Les années à l'oral court.
 *
 * « Mille neuf cent soixante-dix-neuf », la forme que la normalisation de VoiceStudio
 * produit, s'entend poussive à la lecture ; « dix-neuf cent soixante-dix-neuf » est la forme
 * orale courante. Seules les années isolées sont touchées : pas un nombre collé à d'autres
 * chiffres, à une virgule décimale (« 1,75 »), ni « 1 984 cas ».
 */
export function ecrireAnnees(texte) {
  return texte.replace(/(?<![\d,.])\b(1[1-9]\d\d|20\d\d)\b(?![\d,.]\d)/g, (m) => annee(Number(m)));
}

// Une phrase finit sur . ! ? … ou » suivis d'une majuscule — sauf après une abréviation
// ou une initiale, qui ne ferment rien (« J.-C. », « M. », « E. Noether »).
const ABREVIATION = /(?:\b(?:M|Mme|Mlle|Dr|Pr|St|av|apr|J\.-C|cf|env|etc|p|vol|chap|n°|no)|\b[A-ZÀ-ÖØ-Þ])\.$/u;

/**
 * Un paragraphe en phrases.
 *
 * Le moteur enchaîne les phrases d'un paragraphe sans pause : chaque phrase est donc
 * générée à part, et c'est le pipeline qui pose le silence entre elles.
 */
export function phrases(paragraphe) {
  const sortie = [];
  let courante = '';
  for (const morceau of paragraphe.split(/(?<=[.!?…»])\s+(?=[«"(]?[A-ZÀ-ÖØ-Þ0-9])/u)) {
    courante = courante ? `${courante} ${morceau}` : morceau;
    if (!ABREVIATION.test(courante)) { sortie.push(courante); courante = ''; }
  }
  if (courante) sortie.push(courante);
  return sortie;
}

/**
 * Où commence chaque phrase de `phrases(paragraphe)`, en unités UTF-16 dans `paragraphe`.
 *
 * Même coupure, même règle d'abréviation : les positions viennent du découpage lui-même,
 * jamais d'une recherche de la phrase dans le texte — `phrases()` recolle une abréviation
 * avec une espace simple là où la coupure a pu avaler une insécable ou plusieurs espaces.
 */
export function bornesPhrases(paragraphe) {
  const bornes = [];
  let ouverte = false;
  let debut = 0;
  const coupure = /(?<=[.!?…»])\s+(?=[«"(]?[A-ZÀ-ÖØ-Þ0-9])/gu;
  const segments = [];
  for (const m of paragraphe.matchAll(coupure)) {
    segments.push([debut, m.index]);
    debut = m.index + m[0].length;
  }
  segments.push([debut, paragraphe.length]);
  for (const [d, f] of segments) {
    if (!ouverte) { bornes.push(d); ouverte = true; }
    if (!ABREVIATION.test(paragraphe.slice(bornes.at(-1), f))) ouverte = false;
  }
  return bornes;
}
