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
  droit: 'Droit et justice',
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

/**
 * Encres par discipline — docs/charte-visuelle.md §2.2.
 *
 * **Les trente-trois sont attribuées.** Cette table n'en portait que vingt-trois
 * pendant que les deux clients en portaient trente-trois : la production croyait donc
 * dix disciplines fermées alors que les apps les auraient servies. Le désaccord ne
 * s'est vu qu'en ouvrant le droit. Toute valeur ajoutée ici doit l'être aussi dans
 * `Anagnosis/Charte/Encres.swift` et `charte/Encres.kt`, qui sont la référence
 * d'affichage.
 *
 * Cette table décide de ce que le client peut offrir : une discipline n'est servie
 * que si elle a du stock **et** une encre. Elle vit donc dans le schéma, à côté de la
 * taxonomie, et non dans le seul assembleur de l'app — la production la consulte
 * aussi, pour ne pas écrire des fiches que personne ne pourra lire.
 */
export const ENCRES = {
  // Sciences exactes
  mathematiques: '#00838A',
  physique: '#0078BF',
  chimie: '#67B346',
  astronomie: '#9D7AD2',
  informatique: '#5EC8E5',
  statistiques: '#AC936E',

  // Vivant et santé
  biologie: '#00A95C',
  medecine: '#FF665E',
  neurosciences: '#FF8E91',
  genetique: '#FF7477',
  ecologie: '#397E58',
  nutrition: '#E3ED55',

  // Terre et environnement
  geologie: '#8E595A',
  climat: '#82D8D5',
  oceanographie: '#62A8E5',
  paleontologie: '#BB8B41',

  // Sciences humaines
  philosophie: '#3D5588',
  psychologie: '#765BA7',
  sociologie: '#914E72',
  anthropologie: '#FF6C2F',
  linguistique: '#F15060',
  archeologie: '#FFB511',
  geographie: '#237E74',

  // Société
  histoire: '#A75154',
  economie: '#B49F29',
  // Medium Blue, et non l'Indigo #484D7A qui figurait dans les clients avant
  // l'ouverture de la discipline : Indigo tombait à 6,6 d'écart Lab de Federal Blue
  // (Philosophie), la paire la plus proche des trente-trois, sur deux disciplines qu'un
  // même lecteur coche volontiers ensemble. Medium Blue tient 17,2 de Philosophie,
  // 34,9 de Sciences politiques et 19,4 de Physique — les trois bleus déjà pris.
  droit: '#3255A4',
  sciences_politiques: '#375E77',
  religions: '#845991',

  // Arts et lettres
  litterature: '#FF48B0',
  histoire_art: '#AA60BF',
  musique: '#00AA93',
  cinema: '#BD6439',
  architecture: '#A5AAA8',
};

/**
 * Les disciplines qu'on ne sonorise pas, et qu'on ne sonorisera pas.
 *
 * Le droit se lit, il ne s'écoute pas : ses fiches vivent de dates, de numéros
 * d'article et de noms d'arrêts, que la voix rend en bouillie et sur lesquels l'oreille
 * ne peut pas revenir en arrière.
 *
 * Ce n'est pas la même chose que « pas encore d'audio », et la distinction va jusqu'aux
 * clients : `Ecoute.sansEcoute` y retire le bouton et le lecteur, au lieu d'annoncer un
 * « audio prochainement disponible » qui ne viendrait jamais.
 */
export const SANS_ECOUTE = new Set(['droit']);

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
    // Revue de juridiction et de mutabilité, disciplines juridiques uniquement
    // (`src/droit.js`). Distincte de `controle` parce qu'elle ne se déclenche pas sur
    // les mêmes critères : `controle` repasse quand le **texte** bouge, celle-ci quand
    // le **temps** passe. Une fiche de droit devient fausse sans que rien n'y change.
    controle_juridique: null,
    meta: { genere_le: null, genere_par: 'claude-code', version: 1 },
    ...partial,
  };
}
