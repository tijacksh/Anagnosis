/**
 * Les fiches en anglais, telles que le fichier signé les porte — **éteintes par défaut**.
 *
 * Décisions d'Arnaud (PLAN-APP, 16/11/2026) :
 *
 * - **Un seul fichier signé pour les deux langues** : une signature, un ETag, un point
 *   réseau. Chaque concept reçoit, quand sa version anglaise est sûre, un objet
 *   additionnel `en` qui ne porte que les champs traduits.
 * - **Le français seul fait foi** pour les identifiants, les retraits (`retirees`), la
 *   date de fabrication (`genere_le`), l'ordre et l'audio. L'anglais ne remplace jamais
 *   que des textes : la langue ne peut pas changer la suite des fiches du jour.
 * - **Pas d'audio en anglais** : la voix et ses repères sont liés au texte français.
 *   `audio` reste au niveau du concept, et `en` n'en porte pas.
 *
 * ## Pourquoi un champ additif
 *
 * Les apps déjà installées décodent le fichier reçu sans être mises à jour : elles
 * ignorent la clé qu'elles ne connaissent pas (Kotlin : `ignoreUnknownKeys` ; Swift :
 * `CodingKeys` explicites). Vérifié sur les décodeurs de la balise `i18n-base`
 * (docs/traduction-en.md, section « Fichier signé »).
 *
 * ## La garde : en cas de doute, pas d'`en`
 *
 * Tout refus de la garde veut dire « cette fiche n'a pas d'`en` », jamais une erreur de
 * construction. Les routines poussent des fiches anglaises toute la journée et le site
 * se reconstruit toutes les quatre heures : un fichier anglais cassé ne doit jamais
 * empêcher la publication du français. L'app retombe alors sur le français, fiche par
 * fiche.
 *
 * Une version anglaise n'est servie que si, à la fois :
 *   1. elle est lisible, de bon `id`, de bon `slug`, `langue` « en », sans doublon ;
 *   2. son `empreinte_fr` est celle du français **actuel** (sinon elle est périmée) ;
 *   3. elle a la même forme que le français (mêmes chemins de texte, mêmes listes) ;
 *   4. son quiz est le même : `bonne_reponse`, nombre de choix, nombre de questions
 *      (le lecteur enregistre ses réponses par numéro, le quiz ne peut pas bouger
 *      d'une langue à l'autre) ;
 *   5. ses adresses sont celles du français (l'empreinte les ignore : une adresse
 *      réparée en français resterait cassée en anglais), sauf pour une citation ou un
 *      texte officiel retrouvé en anglais, signalé par son drapeau ;
 *   6. aucun drapeau qui demande un humain : seuls les drapeaux d'information passent
 *      (`DRAPEAUX_INFO`), tout autre type, connu ou non, bloque, sauf s'il est toléré
 *      explicitement (`ANAGNOSIS_EN_DRAPEAUX_TOLERES`) ;
 *   7. si `ANAGNOSIS_EN_RELU=1`, elle a été relue par un humain (`relu: true`).
 */
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { ROOT } from './store.js';
import { CHAMPS, empreinteFiche } from '../outils/empreinte-fr.mjs';

export const VARIABLE_LANGUES = 'ANAGNOSIS_LANGUES';
export const VARIABLE_DRAPEAUX = 'ANAGNOSIS_EN_DRAPEAUX_TOLERES';
export const VARIABLE_RELU = 'ANAGNOSIS_EN_RELU';

export const DOSSIER_EN = path.join(ROOT, 'content', 'concepts-en');

/** Les langues que le fichier sait porter. Le français est toujours là : il fait foi. */
const LANGUES_CONNUES = ['fr', 'en'];

/**
 * Les drapeaux qui ne demandent rien à personne : le texte anglais cité est l'original,
 * retrouvé et recopié mot pour mot (docs/traduction-en.md).
 */
export const DRAPEAUX_INFO = new Set(['citation-originale-anglaise', 'texte-officiel-anglais']);

/** Un de ces drapeaux justifie qu'une adresse de citation diffère du français. */
const DRAPEAUX_SOURCE_ANGLAISE = new Set(['citation-originale-anglaise', 'texte-officiel-anglais']);

/**
 * Les réglages de construction, lus dans l'environnement.
 *
 * - `ANAGNOSIS_LANGUES` : « fr » (défaut, absent ou vide) ou « fr,en ». Le français est
 *   obligatoire ; toute autre langue est une erreur : mieux vaut un build qui s'arrête
 *   qu'un fichier qui ne porte pas ce qu'on croit.
 * - `ANAGNOSIS_EN_DRAPEAUX_TOLERES` : types de drapeaux de plus qui n'empêchent pas
 *   l'anglais (ex. « citation-traduite »), séparés par des virgules.
 * - `ANAGNOSIS_EN_RELU` : « 1 » exige `relu: true`.
 */
export function optionsDepuisEnv(env = process.env) {
  const brut = (env[VARIABLE_LANGUES] ?? '').trim();
  const langues = brut === '' ? ['fr'] : [...new Set(brut.toLowerCase().split(',').map((l) => l.trim()).filter(Boolean))];
  const inconnues = langues.filter((l) => !LANGUES_CONNUES.includes(l));
  if (inconnues.length) {
    throw new Error(`${VARIABLE_LANGUES} : langue(s) inconnue(s) « ${inconnues.join(', ')} » (attendu : fr ou fr,en)`);
  }
  if (!langues.includes('fr')) {
    throw new Error(`${VARIABLE_LANGUES} : le français est obligatoire, il fait foi pour les identifiants, les retraits et la date (reçu : « ${brut} »)`);
  }
  const toleres = (env[VARIABLE_DRAPEAUX] ?? '').split(',').map((t) => t.trim()).filter(Boolean);
  return {
    langues: LANGUES_CONNUES.filter((l) => langues.includes(l)),
    drapeauxToleres: new Set([...DRAPEAUX_INFO, ...toleres]),
    exigerRelu: (env[VARIABLE_RELU] ?? '').trim() === '1',
  };
}

/**
 * Lit `content/concepts-en/`, **sans jamais lever** : un fichier illisible est compté et
 * ignoré, une fiche dont l'`id` apparaît dans deux fichiers est écartée des deux (on ne
 * sait pas laquelle dit vrai).
 *
 * @returns {Promise<{ parId: Map<string, {fiche: object, chemin: string}>, doublons: Set<string>, illisibles: string[] }>}
 */
export async function lireAnglais(dossier = DOSSIER_EN) {
  const parId = new Map();
  const doublons = new Set();
  const illisibles = [];
  let disciplines = [];
  try {
    disciplines = (await readdir(dossier, { withFileTypes: true })).filter((d) => d.isDirectory());
  } catch (e) {
    if (e.code !== 'ENOENT') throw e;
  }
  for (const d of disciplines.sort((a, b) => a.name.localeCompare(b.name))) {
    let noms;
    try {
      noms = (await readdir(path.join(dossier, d.name))).filter((f) => f.endsWith('.json')).sort();
    } catch {
      illisibles.push(d.name);
      continue;
    }
    for (const nom of noms) {
      const chemin = path.join(dossier, d.name, nom);
      let fiche;
      try {
        fiche = JSON.parse(await readFile(chemin, 'utf8'));
      } catch {
        illisibles.push(path.relative(dossier, chemin));
        continue;
      }
      if (!fiche || typeof fiche !== 'object' || typeof fiche.id !== 'string') {
        illisibles.push(path.relative(dossier, chemin));
        continue;
      }
      if (parId.has(fiche.id) || doublons.has(fiche.id)) {
        parId.delete(fiche.id);
        doublons.add(fiche.id);
        continue;
      }
      parId.set(fiche.id, { fiche, chemin });
    }
  }
  return { parId, doublons, illisibles };
}

/** Les textes d'une fiche, par chemin : la même notion que l'empreinte (`empreinte-fr.mjs`). */
function feuilles(fiche) {
  const sortie = new Map();
  const marcher = (v, chemin) => {
    if (Array.isArray(v)) v.forEach((x, i) => marcher(x, [...chemin, String(i)]));
    else if (v && typeof v === 'object') {
      for (const [k, x] of Object.entries(v)) if (!['url', 'statut', 'bonne_reponse'].includes(k)) marcher(x, [...chemin, k]);
    } else if (typeof v === 'string' && v.trim() && !v.startsWith('http')) sortie.set(chemin.join('/'), v);
  };
  for (const c of CHAMPS) if (fiche[c] != null) marcher(fiche[c], [c]);
  return sortie;
}

const questions = (f) => [...(f.quiz ? [f.quiz] : []), ...(f.quiz_supplementaire ?? [])];

/**
 * Pourquoi cette version anglaise ne peut pas être servie, ou `null` si elle le peut.
 *
 * @returns {{ motif: string, detail: string } | null}
 *   motifs : identite, perimee, structure, quiz, url, drapeau, non_relue
 */
export function refus(fr, en, { drapeauxToleres = DRAPEAUX_INFO, exigerRelu = false } = {}) {
  if (en.id !== fr.id || en.slug !== fr.slug || en.langue !== 'en') {
    return { motif: 'identite', detail: `id/slug/langue : ${en.id}/${en.slug}/${en.langue}` };
  }
  if (en.empreinte_fr !== empreinteFiche(fr)) {
    return { motif: 'perimee', detail: `empreinte_fr ${en.empreinte_fr} ≠ ${empreinteFiche(fr)}` };
  }

  // Même forme : les mêmes chemins de texte, et des listes de même longueur.
  const f = feuilles(fr), e = feuilles(en);
  const manquants = [...f.keys()].filter((k) => !e.has(k));
  const enTrop = [...e.keys()].filter((k) => !f.has(k));
  if (manquants.length || enTrop.length) {
    return { motif: 'structure', detail: `manque ${manquants.slice(0, 3).join(', ') || '—'} ; en trop ${enTrop.slice(0, 3).join(', ') || '—'}` };
  }
  for (const c of CHAMPS) {
    if ((fr[c] == null) !== (en[c] == null)) return { motif: 'structure', detail: `${c} : présent d'un seul côté` };
  }
  // Une liste est une liste : un objet `{"0": …}` donnerait les mêmes chemins de texte.
  for (const c of ['pour_aller_plus_loin', 'quiz_supplementaire']) {
    if ((fr[c] != null && !Array.isArray(fr[c])) || (en[c] != null && !Array.isArray(en[c]))) {
      return { motif: 'structure', detail: `${c} : n'est pas une liste` };
    }
  }
  if ((fr.pour_aller_plus_loin ?? []).length !== (en.pour_aller_plus_loin ?? []).length) {
    return { motif: 'structure', detail: 'pour_aller_plus_loin : longueur différente' };
  }
  for (const c of ['quiz', 'citation', 'repere', 'carte']) {
    if (en[c] != null && (typeof en[c] !== 'object' || Array.isArray(en[c]))) {
      return { motif: 'structure', detail: `${c} : n'est pas un objet` };
    }
  }

  // Le quiz : l'état du lecteur l'enregistre par numéro de réponse.
  const qf = questions(fr), qe = questions(en);
  if ((fr.quiz_supplementaire ?? []).length !== (en.quiz_supplementaire ?? []).length || qf.length !== qe.length) {
    return { motif: 'quiz', detail: 'nombre de questions différent' };
  }
  for (let i = 0; i < qf.length; i++) {
    if (qf[i].bonne_reponse !== qe[i].bonne_reponse || (qf[i].choix ?? []).length !== (qe[i].choix ?? []).length) {
      return { motif: 'quiz', detail: `question ${i} : bonne_reponse ou nombre de choix différent` };
    }
  }

  const drapeaux = Array.isArray(en.drapeaux) ? en.drapeaux : null;
  if (!drapeaux) return { motif: 'drapeau', detail: 'drapeaux absents ou mal formés' };
  const types = drapeaux.map((d) => (typeof d?.type === 'string' ? d.type : '?'));

  // Les adresses : l'empreinte les ignore. Elles restent celles du français, sauf pour un
  // texte cité retrouvé en anglais : le drapeau, posé sur ce chemin (`citation` ou
  // `repere`), l'autorise, à condition que l'adresse anglaise soit une vraie adresse.
  // La liste « pour aller plus loin » ne change jamais d'adresse.
  const libre = (chemin) => ['citation', 'repere'].includes(chemin) && drapeaux.some((d) => typeof d?.type === 'string' && DRAPEAUX_SOURCE_ANGLAISE.has(d.type)
    && typeof d.chemin === 'string' && d.chemin.split(/[/.]/)[0] === chemin.split('/')[0]);
  const urlHttps = (u) => typeof u === 'string' && /^https?:\/\/\S+$/.test(u);
  const adresses = [
    ['citation', fr.citation?.url ?? null, en.citation?.url ?? null],
    ['repere', fr.repere?.url ?? null, en.repere?.url ?? null],
    ...(fr.pour_aller_plus_loin ?? []).map((l, i) => [`pour_aller_plus_loin/${i}`, l?.url ?? null, en.pour_aller_plus_loin[i]?.url ?? null]),
  ];
  for (const [chemin, uf, ue] of adresses) {
    if (uf === ue) continue;
    if (!libre(chemin) || !urlHttps(ue)) {
      return { motif: 'url', detail: `${chemin} : adresse différente du français sans drapeau de source anglaise valide` };
    }
  }

  const bloquants = [...new Set(types.filter((t) => !drapeauxToleres.has(t)))];
  if (bloquants.length) return { motif: 'drapeau', detail: bloquants.join(', ') };

  if (exigerRelu && en.relu !== true) return { motif: 'non_relue', detail: 'relu ≠ true' };
  return null;
}

/**
 * L'objet `en` : **uniquement** les champs traduits. Ni `drapeaux`, ni `relu`, ni
 * `empreinte_fr`, ni les clés égarées dans un fichier anglais (`theme_ordre`…), ni audio.
 * Le `statut` des questions vient du français, qui fait foi.
 */
export function projeterAnglais(fr, en) {
  const sortie = {};
  for (const c of CHAMPS) {
    if (en[c] == null || fr[c] == null) continue;
    sortie[c] = calquer(en[c], fr[c]);
  }
  const poserStatut = (q, qFr) => {
    if (!q || typeof q !== 'object') return;
    if (qFr?.statut !== undefined) q.statut = qFr.statut; else delete q.statut;
  };
  poserStatut(sortie.quiz, fr.quiz);
  (sortie.quiz_supplementaire ?? []).forEach((q, i) => poserStatut(q, fr.quiz_supplementaire?.[i]));
  return sortie;
}

/**
 * Copie `en` en ne gardant que ce que le français a aussi : mêmes clés, même type de
 * valeur, listes de la longueur du français. Une clé égarée dans le fichier anglais, à
 * n'importe quelle profondeur, ne sort donc jamais.
 */
function calquer(en, fr) {
  if (Array.isArray(fr)) {
    return Array.isArray(en) ? fr.map((x, i) => calquer(en[i], x)) : fr.map(() => null);
  }
  if (fr && typeof fr === 'object') {
    const o = {};
    if (!en || typeof en !== 'object' || Array.isArray(en)) return o;
    for (const k of Object.keys(fr)) if (k in en) {
      const v = calquer(en[k], fr[k]);
      if (v !== undefined) o[k] = v;
    }
    return o;
  }
  return typeof en === typeof fr || (fr === null && en === null) ? en : undefined;
}

/**
 * Ajoute `en` aux fiches publiables qui y ont droit. Les autres sortent inchangées
 * (même objet, mêmes octets). Le français n'est jamais modifié.
 *
 * @returns {{ fiches: object[], rapport: object }}
 */
export function ajouterAnglais(publiables, lecture, options = {}) {
  const rapport = { avec: 0, sans: 0, refus: [], orphelines: 0, illisibles: lecture.illisibles.length };
  const ids = new Set(publiables.map((f) => f.id));
  rapport.orphelines = [...lecture.parId.keys()].filter((id) => !ids.has(id)).length;
  const fiches = publiables.map((fr) => {
    if (lecture.doublons.has(fr.id)) {
      rapport.refus.push({ id: fr.id, motif: 'doublon', detail: 'id présent dans plusieurs fichiers anglais' });
      return fr;
    }
    const entree = lecture.parId.get(fr.id);
    if (!entree) { rapport.sans++; return fr; }
    // Une version anglaise bizarre ne doit jamais arrêter la construction : pas d'`en`.
    try {
      const r = refus(fr, entree.fiche, options);
      if (r) { rapport.refus.push({ id: fr.id, ...r }); return fr; }
      const en = projeterAnglais(fr, entree.fiche);
      rapport.avec++;
      return { ...fr, en };
    } catch (e) {
      rapport.refus.push({ id: fr.id, motif: 'exception', detail: String(e?.message ?? e).slice(0, 80) });
      return fr;
    }
  });
  return { fiches, rapport };
}

/** Le compte rendu de construction, en lignes lisibles (vide quand l'anglais est éteint). */
export function resumeRapport(rapport) {
  if (!rapport) return [];
  const motifs = {};
  for (const r of rapport.refus) motifs[r.motif] = (motifs[r.motif] ?? 0) + 1;
  const detail = Object.entries(motifs).map(([m, n]) => `${m} ${n}`).join(', ') || 'aucun';
  return [
    `  anglais                 ${rapport.avec} fiche(s) avec en, ${rapport.sans} sans version anglaise, ${rapport.refus.length} refusée(s) (${detail})`,
    ...(rapport.orphelines ? [`  anglais                 ${rapport.orphelines} fichier(s) anglais sans fiche publiable`] : []),
    ...(rapport.illisibles ? [`  anglais                 ${rapport.illisibles} fichier(s) illisible(s) ignoré(s)`] : []),
  ];
}
