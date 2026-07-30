/**
 * Schéma de la base de connaissance Anagnosis.
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
  // Sciences exactes
  mathematiques: 'Mathématiques',
  physique: 'Physique',
  chimie: 'Chimie',
  astronomie: 'Astronomie',
  informatique: 'Informatique',
  statistiques: 'Statistiques',

  // Vivant et santé
  biologie: 'Biologie',
  medecine: 'Médecine / Santé',
  neurosciences: 'Neurosciences',
  genetique: 'Génétique',
  ecologie: 'Écologie',
  nutrition: 'Nutrition',

  // Terre et environnement
  geologie: 'Sciences de la Terre',
  climat: 'Climat et météorologie',
  oceanographie: 'Océanographie',
  paleontologie: 'Paléontologie',

  // Sciences humaines
  philosophie: 'Philosophie',
  psychologie: 'Psychologie',
  sociologie: 'Sociologie',
  anthropologie: 'Anthropologie',
  linguistique: 'Linguistique',
  archeologie: 'Archéologie',
  geographie: 'Géographie',

  // Société
  histoire: 'Histoire',
  economie: 'Économie',
  droit: 'Droit',
  sciences_politiques: 'Sciences politiques',
  religions: 'Religions et mythologies',

  // Arts et lettres
  litterature: 'Littérature',
  histoire_art: "Histoire de l'art",
  musique: 'Musique',
  cinema: 'Cinéma',
  architecture: 'Architecture',
};

/**
 * Plus d'extensions séparées : les trente-trois disciplines sont déclarées d'un bloc
 * et **toutes exportées**.
 *
 * Le filtrage a changé de côté. Retenir une discipline à l'export revenait à décider
 * ici de ce que le client peut servir, alors que la seule question qui vaille est
 * « y a-t-il de quoi lire ? ». C'est donc le client qui n'offre une discipline que
 * lorsqu'elle a du stock et une encre attribuée. La taxonomie peut ainsi être posée
 * en entier tout de suite, et s'ouvrir au fil du remplissage — sans date de lancement
 * à repousser, et sans qu'une fiche écrite reste invisible parce qu'un drapeau
 * n'a pas été levé.
 */
export const DISCIPLINES_EXTENSIONS = {};

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
 *   repere:   { texte, source, url } | null,   // alternative sourcée à la citation
 *   sources:  [{ type, auteur, titre, publication, annee, url, note }],
 *   pour_aller_plus_loin: [{ titre, url, note }],
 *   illustration: { prompt, alt, url, statut },
 *   quiz: { question, choix: [], bonne_reponse: int, explication },
 *   statut, validation: { decide_par, decide_le, historique: [] },
 *   controle: { fait_le, verdict, empreinte, notes: [] } | null,
 *   meta: { genere_le, genere_par, version }
 * }
 *
 * **Toute `url` de source est obligatoire** — `sources`, `citation`, `repere`,
 * `pour_aller_plus_loin`. Une source qu'on ne peut pas ouvrir ne prouve rien, et c'est
 * la preuve qui est le produit (brief §3). Voir `src/validate.js`.
 *
 * `controle` est la trace de la relecture de fond (`src/controle.js`) : sources
 * réellement ouvertes, sens vérifié. Interne au pipeline — dépouillé à l'export, comme
 * `validation` et `meta`.
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
    // Relecture de fond : absente tant que personne n'a rouvert les sources.
    controle: null,
    meta: { genere_le: null, genere_par: 'claude-code', version: 1 },
    ...partial,
  };
}
