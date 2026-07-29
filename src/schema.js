/**
 * Schéma de la base de connaissance Epignosis.
 *
 * Source de vérité : les fichiers JSON de `content/concepts/<discipline>/<slug>.json`.
 * Git sert de journal d'audit (qui a validé quoi, quand) — pas de base de données
 * à faire tourner pour le Lot 0, ce qui garde le pipeline déployable sur le NAS.
 */

/**
 * Disciplines lancées en V1 (brief §7).
 *
 * « Médecine / Santé » ne figure pas dans la taxonomie du brief : elle a été
 * ajoutée après le premier lot, l'imagerie médicale se classant mal en Biologie
 * (voir docs/decisions.md).
 */
export const DISCIPLINES_V1 = {
  philosophie: 'Philosophie',
  sociologie: 'Sociologie',
  anthropologie: 'Anthropologie',
  psychologie: 'Psychologie',
  biologie: 'Biologie',
  medecine: 'Médecine / Santé',
  mathematiques: 'Mathématiques',
  physique: 'Physique',
  litterature: 'Littérature',
};

/**
 * Extensions prévues dans le modèle de données mais non lancées en V1 (brief §7).
 * Une fiche peut déjà s'y rattacher : elle sera simplement filtrée à l'export
 * tant que la discipline n'est pas activée.
 */
export const DISCIPLINES_EXTENSIONS = {
  histoire: 'Histoire',
  economie: 'Économie',
  histoire_art: "Histoire de l'art",
  astronomie: 'Astronomie',
};

export const DISCIPLINES = { ...DISCIPLINES_V1, ...DISCIPLINES_EXTENSIONS };

export const NIVEAUX = ['introductif', 'intermediaire'];

/**
 * Cycle de vie d'une fiche.
 *
 *   brouillon ──valider──> valide ──publier──> publie
 *       │  ▲                  │
 *       │  └──retoucher───────┘
 *       └──rejeter──> rejete
 *
 * `en_retouche` est distinct de `brouillon` : c'est une fiche qui est déjà passée
 * devant un relecteur et porte des demandes de correction explicites.
 */
export const STATUTS = ['brouillon', 'en_retouche', 'valide', 'rejete', 'publie'];

export const STATUTS_LABELS = {
  brouillon: 'Brouillon',
  en_retouche: 'À retoucher',
  valide: 'Validée',
  rejete: 'Rejetée',
  publie: 'Publiée',
};

/** Transitions autorisées depuis l'outil de validation. */
export const TRANSITIONS = {
  valider: { depuis: ['brouillon', 'en_retouche', 'rejete'], vers: 'valide' },
  rejeter: { depuis: ['brouillon', 'en_retouche', 'valide'], vers: 'rejete' },
  retoucher: { depuis: ['brouillon', 'valide', 'rejete'], vers: 'en_retouche' },
  publier: { depuis: ['valide'], vers: 'publie' },
  rouvrir: { depuis: ['valide', 'rejete', 'publie'], vers: 'brouillon' },
};

export const TYPES_SOURCE = ['article', 'revue', 'livre', 'web', 'institution', 'these'];

/** Contraintes éditoriales — voir docs/ligne-editoriale.md pour le pourquoi. */
export const REGLES = {
  titreMin: 3,
  titreMax: 80,
  accrocheMin: 20,
  accrocheMax: 160,
  // 2-3 min de lecture attentive en français ≈ 180-220 mots/min.
  motsMin: 380,
  motsMax: 700,
  sourcesMin: 2,
  quizChoixMin: 3,
  quizChoixMax: 4,
  explicationMin: 40,
  // Carte partageable en story : lisible en 2 secondes sur un écran vertical,
  // le pouce déjà prêt à passer au suivant.
  cartePunchMax: 100,
  carteIdeeMin: 90,
  carteIdeeMax: 300,
  carteSourceMax: 60,
};

/** Marqueurs qui trahissent un brouillon non terminé. */
export const MARQUEURS_INTERDITS = ['TODO', 'FIXME', 'Lorem ipsum', 'XXX', '[à compléter]', '...?'];

/**
 * Forme d'une fiche. `null` = champ optionnel autorisé à être absent.
 *
 * {
 *   id, slug, titre, accroche,
 *   discipline, theme, niveau, duree_lecture_min,
 *   contenu_vulgarise,            // markdown léger (## et **)
 *   citation: { texte, auteur, source, url } | null,
 *   repere:   { texte, source } | null,        // alternative sourcée à la citation
 *   sources:  [{ type, auteur, titre, publication, annee, url, note }],
 *   pour_aller_plus_loin: [{ titre, url, note }],
 *   illustration: { prompt, alt, url, statut },
 *   quiz: { question, choix: [], bonne_reponse: int, explication },
 *   statut, validation: { decide_par, decide_le, historique: [] },
 *   meta: { genere_le, genere_par, version }
 * }
 */
export function fresh(partial = {}) {
  return {
    id: '',
    slug: '',
    titre: '',
    accroche: '',
    discipline: '',
    theme: null,
    // Ordre de lecture conseillé à l'intérieur d'un pack thématique (brief §12).
    // Les fiches restent autonomes : cet ordre ne conditionne pas la publication.
    theme_ordre: null,
    niveau: 'introductif',
    duree_lecture_min: 3,
    contenu_vulgarise: '',
    citation: null,
    repere: null,
    // Carte partageable en story (docs/decisions.md) : le contenu du visuel que
    // le lecteur poste sur les réseaux. `source_courte` y est toujours visible —
    // c'est le signal qui distingue la carte d'un post d'infographie anonyme.
    carte: null,
    sources: [],
    pour_aller_plus_loin: [],
    illustration: { prompt: '', alt: '', url: null, statut: 'a_generer' },
    quiz: null,
    statut: 'brouillon',
    date_publication_prevue: null,
    validation: { decide_par: null, decide_le: null, historique: [] },
    meta: { genere_le: null, genere_par: 'claude-code', version: 1 },
    ...partial,
  };
}
