/**
 * Contrôle qualité d'une fiche.
 *
 * Deux niveaux :
 *  - `erreur`  : bloquant. Une fiche en erreur ne peut pas être validée.
 *  - `alerte`  : non bloquant, signalé au relecteur dans l'outil Admin.
 *
 * Le validateur code la ligne éditoriale (docs/ligne-editoriale.md). Il ne juge
 * pas le fond — c'est le rôle du relecteur humain — mais il garantit qu'aucune
 * fiche incomplète n'arrive devant lui.
 */
import {
  DISCIPLINES,
  NIVEAUX,
  STATUTS,
  TYPES_SOURCE,
  REGLES,
  MARQUEURS_INTERDITS,
} from './schema.js';
import { motsDe } from './store.js';

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function urlValide(u) {
  try {
    const parsed = new URL(u);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * @param {object} fiche
 * @param {{ toutes?: object[] }} ctx  autres fiches, pour les contrôles d'unicité
 * @returns {{ erreurs: string[], alertes: string[], ok: boolean, mots: number }}
 */
/**
 * Une question réduite à ce qui la rend identique à une autre.
 *
 * Casse, accents, ponctuation et espaces ne distinguent pas deux questions : « Que fait la
 * loi ? » et « que fait la loi » sont la même, et un doublon écrit à un accent près
 * passerait sans cette réduction.
 */
function normaliserQuestion(texte) {
  return String(texte)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function validerFiche(fiche, ctx = {}) {
  const erreurs = [];
  const alertes = [];
  const err = (m) => erreurs.push(m);
  const warn = (m) => alertes.push(m);

  if (fiche._parseError) {
    return { erreurs: [`JSON illisible : ${fiche._parseError}`], alertes: [], ok: false, mots: 0 };
  }

  // --- Identité ---------------------------------------------------------
  if (!fiche.id) err('`id` manquant');
  if (!fiche.slug) err('`slug` manquant');
  else if (!SLUG_RE.test(fiche.slug)) err(`\`slug\` invalide : « ${fiche.slug} » (attendu : kebab-case)`);

  const toutes = ctx.toutes ?? [];
  if (fiche.id && toutes.filter((f) => f.id === fiche.id).length > 1) err(`\`id\` en double : ${fiche.id}`);
  if (fiche.slug && toutes.filter((f) => f.slug === fiche.slug).length > 1) err(`\`slug\` en double : ${fiche.slug}`);

  // --- Titre / accroche -------------------------------------------------
  const titre = fiche.titre ?? '';
  if (titre.length < REGLES.titreMin) err('`titre` manquant ou trop court');
  else if (titre.length > REGLES.titreMax) err(`\`titre\` trop long (${titre.length} > ${REGLES.titreMax})`);
  if (/[.]$/.test(titre.trim())) warn('`titre` se termine par un point (ligne éditoriale §2)');

  const accroche = fiche.accroche ?? '';
  if (accroche.length < REGLES.accrocheMin) err('`accroche` manquante ou trop courte (texte de la notification push)');
  else if (accroche.length > REGLES.accrocheMax)
    err(`\`accroche\` trop longue pour une notification (${accroche.length} > ${REGLES.accrocheMax})`);

  // --- Classement -------------------------------------------------------
  // Plus d'alerte « hors taxonomie V1 » : les trente-trois disciplines sont déclarées
  // d'un bloc et toutes exportées. C'est le client qui n'offre une discipline que
  // lorsqu'elle a du stock et une encre — retenir une fiche écrite à cause d'un drapeau
  // n'avait plus de raison d'être.
  if (!fiche.discipline) err('`discipline` manquante');
  else if (!DISCIPLINES[fiche.discipline]) err(`\`discipline\` inconnue : « ${fiche.discipline} »`);

  if (fiche.niveau && !NIVEAUX.includes(fiche.niveau)) err(`\`niveau\` inconnu : « ${fiche.niveau} »`);
  if (!STATUTS.includes(fiche.statut)) err(`\`statut\` inconnu : « ${fiche.statut} »`);

  // --- Corps ------------------------------------------------------------
  const mots = motsDe(fiche.contenu_vulgarise);
  if (!fiche.contenu_vulgarise) err('`contenu_vulgarise` vide');
  else if (mots < REGLES.motsMin) err(`corps trop court : ${mots} mots (minimum ${REGLES.motsMin})`);
  else if (mots > REGLES.motsMax) err(`corps trop long : ${mots} mots (maximum ${REGLES.motsMax})`);

  for (const marqueur of MARQUEURS_INTERDITS) {
    if (JSON.stringify(fiche).includes(marqueur)) err(`marqueur de brouillon trouvé : « ${marqueur} »`);
  }

  // --- Citation / repère ------------------------------------------------
  // Au moins l'un des deux (ligne éditoriale §4). Une citation sans source est
  // refusée : c'est le champ le plus exposé au risque de fabrication.
  if (!fiche.citation && !fiche.repere) err('ni `citation` ni `repere` : la fiche n\'a pas d\'encadré sourcé (ligne éditoriale §4)');

  if (fiche.citation) {
    if (!fiche.citation.texte) err('`citation.texte` manquant');
    if (!fiche.citation.auteur) err('`citation.auteur` manquant');
    if (!fiche.citation.source) err('`citation.source` manquante — une citation non sourcée est refusée (ligne éditoriale §4)');
    if (fiche.citation.url && !urlValide(fiche.citation.url)) err(`\`citation.url\` invalide : ${fiche.citation.url}`);
    // Le champ le plus exposé à la fabrication est aussi celui qui doit s'ouvrir le
    // plus vite : une citation qu'on peut aller lire en contexte est une citation
    // qu'on ne peut pas avoir inventée.
    if (!fiche.citation.url) err('`citation.url` manquante — une citation doit pouvoir être ouverte (ligne éditoriale §4)');
  }
  if (fiche.repere) {
    if (!fiche.repere.texte) err('`repere.texte` manquant');
    if (!fiche.repere.source) err('`repere.source` manquante');
    if (fiche.repere.url && !urlValide(fiche.repere.url)) err(`\`repere.url\` invalide : ${fiche.repere.url}`);
    if (!fiche.repere.url) err('`repere.url` manquante — le repère est un fait chiffré, il s\'ouvre');
  }

  // --- Carte partageable ------------------------------------------------
  // Le partage en story est le moteur de croissance retenu (docs/decisions.md) :
  // une fiche sans carte est lisible, mais elle ne circule pas.
  if (!fiche.carte) {
    warn('pas de `carte` : la fiche ne sera pas partageable en story');
  } else {
    const { punch, idee, source_courte: src } = fiche.carte;
    if (!punch) err('`carte.punch` manquant');
    else if (punch.length > REGLES.cartePunchMax)
      err(`\`carte.punch\` trop long pour un écran vertical (${punch.length} > ${REGLES.cartePunchMax})`);

    if (!idee) err('`carte.idee` manquante');
    else if (idee.length < REGLES.carteIdeeMin)
      err(`\`carte.idee\` trop courte pour tenir debout seule (${idee.length} < ${REGLES.carteIdeeMin})`);
    else if (idee.length > REGLES.carteIdeeMax)
      err(`\`carte.idee\` trop longue (${idee.length} > ${REGLES.carteIdeeMax})`);

    // Le crédit visible sur l'image est ce qui distingue la carte d'une
    // infographie anonyme : il n'est pas optionnel.
    if (!src) err('`carte.source_courte` manquante — le crédit visible est le cœur du positionnement');
    else if (src.length > REGLES.carteSourceMax)
      err(`\`carte.source_courte\` trop longue (${src.length} > ${REGLES.carteSourceMax})`);
  }

  // --- Sources ----------------------------------------------------------
  const sources = fiche.sources ?? [];
  if (sources.length < REGLES.sourcesMin) err(`${sources.length} source(s) — minimum ${REGLES.sourcesMin} (brief §3 : rigueur des sources)`);

  sources.forEach((s, i) => {
    const ref = `sources[${i}]`;
    if (!s.titre) err(`${ref}.titre manquant`);
    if (s.type && !TYPES_SOURCE.includes(s.type)) warn(`${ref}.type inconnu : « ${s.type} »`);
    if (s.url && !urlValide(s.url)) err(`${ref}.url invalide : ${s.url}`);
    // Une source doit être **atteignable d'un doigt**, pas seulement citée.
    //
    // La règle était « une URL, ou auteur + année ». Elle laissait la moitié du corpus
    // non cliquable : le lecteur voyait une référence bibliographique qu'il ne pouvait
    // pas ouvrir, et l'app n'avait rien d'autre à en faire que de l'afficher en texte
    // mort. Or la source visible est tout le positionnement (brief §3) — une source
    // qu'on ne peut pas aller vérifier ne prouve rien.
    //
    // Il n'existe pas de source légitime sans adresse stable : un article a un DOI, une
    // revue une notice Persée ou Cairn, un livre du domaine public une numérisation
    // Gallica ou archive.org, un ouvrage récent une page d'éditeur, un texte antique une
    // édition en ligne. Si aucune adresse n'existe, c'est la source qu'il faut changer.
    if (!s.url) err(`${ref} sans \`url\` — toute source doit être cliquable (brief §3)`);
    // Les sources antiques sont normales en philosophie : une année négative
    // note une date avant notre ère (Platon, La République → -375).
    if (s.annee && (s.annee < -800 || s.annee > 2100)) warn(`${ref}.annee suspecte : ${s.annee}`);
  });

  (fiche.pour_aller_plus_loin ?? []).forEach((l, i) => {
    if (!l.titre) err(`pour_aller_plus_loin[${i}].titre manquant`);
    if (l.url && !urlValide(l.url)) err(`pour_aller_plus_loin[${i}].url invalide : ${l.url}`);
    // Une lecture conseillée sans adresse est un titre à recopier dans un moteur de
    // recherche : autant ne rien conseiller.
    if (!l.url) err(`pour_aller_plus_loin[${i}] sans \`url\` — une lecture conseillée s'ouvre`);
  });

  // --- Illustration -----------------------------------------------------
  const illu = fiche.illustration ?? {};
  if (!illu.prompt) err('`illustration.prompt` manquant (brief §10 : génération en amont)');
  if (!illu.alt) warn('`illustration.alt` manquant (accessibilité)');
  if (/\b(texte|text|mot|lettre|chiffre)\b/i.test(illu.prompt ?? ''))
    warn('`illustration.prompt` semble demander du texte dans l\'image (ligne éditoriale §8)');

  // --- Quiz -------------------------------------------------------------
  const quiz = fiche.quiz;
  if (!quiz) {
    warn('pas de quiz (facultatif côté lecteur, mais prévu au brief §6)');
  } else {
    if (!quiz.question) err('`quiz.question` manquante');
    const choix = quiz.choix ?? [];
    if (choix.length < REGLES.quizChoixMin || choix.length > REGLES.quizChoixMax)
      err(`\`quiz.choix\` : ${choix.length} propositions (attendu ${REGLES.quizChoixMin}-${REGLES.quizChoixMax})`);
    if (choix.some((c) => !c || !String(c).trim())) err('`quiz.choix` contient une proposition vide');
    if (new Set(choix).size !== choix.length) err('`quiz.choix` contient des doublons');
    if (!Number.isInteger(quiz.bonne_reponse) || quiz.bonne_reponse < 0 || quiz.bonne_reponse >= choix.length)
      err(`\`quiz.bonne_reponse\` hors bornes : ${quiz.bonne_reponse}`);
    if (!quiz.explication || quiz.explication.length < REGLES.explicationMin)
      err(`\`quiz.explication\` trop courte (minimum ${REGLES.explicationMin} caractères — ligne éditoriale §6)`);
  }

  // --- Questions supplémentaires ----------------------------------------
  //
  // Mêmes exigences que la question principale : ce sont les mêmes questions, servies
  // ailleurs. Une question de rappel qui serait plus faible que celle du jour ferait de
  // la révision un exercice plus facile que la lecture.
  const supp = fiche.quiz_supplementaire ?? [];
  if (!Array.isArray(supp)) {
    err('`quiz_supplementaire` doit être un tableau');
  } else {
    if (supp.length > REGLES.quizSupplementaireMax)
      err(`\`quiz_supplementaire\` : ${supp.length} questions (maximum ${REGLES.quizSupplementaireMax})`);
    if (supp.length && !quiz)
      err('`quiz_supplementaire` sans `quiz` : la question du jour vient en premier');

    const vues = new Set([normaliserQuestion(quiz?.question ?? '')]);
    supp.forEach((q, i) => {
      const ou = `quiz_supplementaire[${i}]`;
      if (!q?.question) { err(`\`${ou}.question\` manquante`); return; }
      // **Deux fois la même question ne fait pas deux questions.** Le rappel et la
      // révision tirent dans le même sac : un doublon y reviendrait deux fois plus
      // souvent, et le lecteur croirait avoir retenu ce qu'il vient seulement de relire.
      const cle = normaliserQuestion(q.question);
      if (vues.has(cle)) err(`\`${ou}.question\` répète une question déjà posée`);
      vues.add(cle);

      const cx = q.choix ?? [];
      if (cx.length < REGLES.quizChoixMin || cx.length > REGLES.quizChoixMax)
        err(`\`${ou}.choix\` : ${cx.length} propositions (attendu ${REGLES.quizChoixMin}-${REGLES.quizChoixMax})`);
      if (cx.some((c) => !c || !String(c).trim())) err(`\`${ou}.choix\` contient une proposition vide`);
      if (new Set(cx).size !== cx.length) err(`\`${ou}.choix\` contient des doublons`);
      if (!Number.isInteger(q.bonne_reponse) || q.bonne_reponse < 0 || q.bonne_reponse >= cx.length)
        err(`\`${ou}.bonne_reponse\` hors bornes : ${q.bonne_reponse}`);
      if (!q.explication || q.explication.length < REGLES.explicationMin)
        err(`\`${ou}.explication\` trop courte (minimum ${REGLES.explicationMin} caractères)`);
    });
  }

  // --- Cohérence de statut ---------------------------------------------
  if (['valide', 'publie'].includes(fiche.statut) && !fiche.validation?.decide_le)
    warn('fiche validée sans trace de décision dans `validation`');

  return { erreurs, alertes, ok: erreurs.length === 0, mots };
}

/** Valide tout un lot, avec les contrôles d'unicité inter-fiches. */
export function validerLot(fiches) {
  return fiches.map((fiche) => ({ fiche, ...validerFiche(fiche, { toutes: fiches }) }));
}
