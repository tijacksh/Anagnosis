/**
 * Le texte que lit l'utilisateur, champ par champ.
 *
 * Titre, accroche, contenu, repère, carte, quiz. Pas les citations (verbatim), les sources,
 * les notes de contrôle ni les adresses : ce qui n'est pas de nous ne se corrige pas, et ce
 * qui n'est pas lu n'entre pas dans les critères de docs/criteres-vibecode.md.
 *
 * Renvoie des paires [objet, clé] : on lit `objet[clé]` et, pour corriger, on y réécrit.
 */
export function champsLus(fiche) {
  const liste = [];
  const pose = (objet, cle) => { if (objet && typeof objet[cle] === 'string') liste.push([objet, cle]); };
  pose(fiche, 'titre');
  pose(fiche, 'accroche');
  pose(fiche, 'contenu_vulgarise');
  pose(fiche.repere, 'texte');
  pose(fiche.carte, 'punch');
  pose(fiche.carte, 'idee');
  for (const q of [fiche.quiz, ...(fiche.quiz_supplementaire ?? [])]) {
    if (!q) continue;
    pose(q, 'question');
    pose(q, 'explication');
    (q.choix ?? []).forEach((_, i) => pose(q.choix, i));
  }
  return liste;
}

export const TIRET_CADRATIN = '—';

/** Pictogrammes et emojis (hors flèches et symboles typographiques courants). */
export const EMOJI = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B50}\u{2B06}\u{2705}\u{274C}\u{2728}]/u;

/** Mots d'une prose écrite en série : un seul suffit à lever une alerte. */
export const MOTS_CREUX = /\b(révolutionnaire|révolutionne|game[- ]changer|disruptif|disruptive|next[- ]gen|de nouvelle génération|à l'ère de|plongeons|plongez|dévoilons|libérez|boostez|booster|synergie|incontournable|dans un monde où|il est temps de)\b/i;
