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
  epistemologie: 'Épistémologie',
  psychologie: 'Psychologie',
  sociologie: 'Sociologie',
  anthropologie: 'Anthropologie',
  linguistique: 'Linguistique',
  archeologie: 'Archéologie',
  geographie: 'Géographie',

  histoire: 'Histoire',
  economie: 'Économie',
  sciences_politiques: 'Sciences politiques',
  religions: 'Religions et mythologies',

  // Droit et justice
  //
  // **Une famille, et non une discipline.** « Droit » a d'abord été posé comme une
  // discipline unique, au niveau d'Histoire ou d'Économie. C'était le mauvais grain :
  // un lecteur veut cocher la preuve judiciaire sans prendre la propriété
  // intellectuelle, comme il coche Génétique sans prendre toute la Biologie.
  //
  // Le nuancier ne fournissait plus sept encres à pleine distance : les sept retenues
  // tiennent 13,5 d'écart Lab entre elles et 10,1 avec les trente-deux autres, contre
  // le seuil de 15 appliqué ailleurs. C'est un écart assumé, et il est supportable ici
  // parce que ces sept-là portent toujours leur libellé écrit à côté de l'aplat.
  droit_institutions: 'Institutions judiciaires',
  droit_preuve: 'Preuve et erreur judiciaire',
  droit_international: 'Droit international',
  droit_pi_ia: 'Propriété intellectuelle et IA',
  droit_constitutionnel: 'Droit constitutionnel',
  droit_social: 'Droit social',
  droit_conformite: 'Conformité',

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
  // Épistémologie a rejoint la famille le 24 août 2026 (docs/decisions.md). Smoky Teal,
  // choisie pour son écart : 14,9 de la plus proche de toutes les encres (Lagoon, Droit
  // social — une autre famille), 18,1 de la plus proche au sein de Sciences humaines
  // (Sciences politiques). Mieux que ce que le droit avait dû accepter pour ses sept
  // encres (13,5 / 10,1), et un registre froid, retenu, qui va à une discipline qui
  // interroge ce qu'on a le droit de tenir pour su.
  epistemologie: '#5F8289',
  psychologie: '#765BA7',
  sociologie: '#914E72',
  anthropologie: '#FF6C2F',
  linguistique: '#F15060',
  archeologie: '#FFB511',
  geographie: '#237E74',

  histoire: '#A75154',
  economie: '#B49F29',
  sciences_politiques: '#375E77',
  religions: '#845991',

  // Droit et justice — sept encres à distance réduite, voir le commentaire de la
  // taxonomie. Contraste et plus proche voisine parmi les trente-deux autres :
  droit_institutions: '#435060',    // Midnight     7,15:1  · 10,1 de Sciences politiques
  droit_preuve: '#5E695E',          // Slate        5,00:1  · 23,5 de Géographie
  droit_international: '#0074A2',   // Sea Blue     4,55:1  · 15,6 de Physique
  droit_pi_ia: '#775D7A',           // Raisin       5,03:1  · 16,7 de Religions
  droit_constitutionnel: '#3255A4', // Medium Blue  6,15:1  · 17,2 de Philosophie
  droit_social: '#2F6165',          // Lagoon       6,06:1  · 14,4 de Sciences politiques
  droit_conformite: '#407060',      // Hunter Green 4,93:1  · 10,9 de Géographie

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
export const SANS_ECOUTE = new Set([
  'droit_institutions', 'droit_preuve', 'droit_international', 'droit_pi_ia',
  'droit_constitutionnel', 'droit_social', 'droit_conformite',
]);

// Les familles de disciplines — recopiées des clients iOS et Android
// (`Discipline.swift`, `Disciplines.kt`), qui regroupent leurs menus en accordéons pour
// ne pas présenter quarante disciplines à plat. Le pipeline n'en avait jusqu'ici aucun
// usage propre ; la vitrine est le premier endroit ici qui affiche la taxonomie entière
// d'un coup plutôt qu'une fiche à la fois, et hérite donc du même besoin.
export const FAMILLES = [
  'Sciences exactes',
  'Vivant et santé',
  'Terre et environnement',
  'Sciences humaines',
  'Droit et justice',
  'Arts et lettres',
];

export const FAMILLE_PAR_DISCIPLINE = {
  mathematiques: 'Sciences exactes',
  physique: 'Sciences exactes',
  chimie: 'Sciences exactes',
  astronomie: 'Sciences exactes',
  informatique: 'Sciences exactes',
  statistiques: 'Sciences exactes',
  biologie: 'Vivant et santé',
  medecine: 'Vivant et santé',
  neurosciences: 'Vivant et santé',
  genetique: 'Vivant et santé',
  ecologie: 'Vivant et santé',
  nutrition: 'Vivant et santé',
  geologie: 'Terre et environnement',
  climat: 'Terre et environnement',
  oceanographie: 'Terre et environnement',
  paleontologie: 'Terre et environnement',
  philosophie: 'Sciences humaines',
  epistemologie: 'Sciences humaines',
  psychologie: 'Sciences humaines',
  sociologie: 'Sciences humaines',
  anthropologie: 'Sciences humaines',
  linguistique: 'Sciences humaines',
  archeologie: 'Sciences humaines',
  geographie: 'Sciences humaines',
  histoire: 'Sciences humaines',
  economie: 'Sciences humaines',
  sciences_politiques: 'Sciences humaines',
  religions: 'Sciences humaines',
  droit_institutions: 'Droit et justice',
  droit_preuve: 'Droit et justice',
  droit_international: 'Droit et justice',
  droit_pi_ia: 'Droit et justice',
  droit_constitutionnel: 'Droit et justice',
  droit_social: 'Droit et justice',
  droit_conformite: 'Droit et justice',
  litterature: 'Arts et lettres',
  histoire_art: 'Arts et lettres',
  musique: 'Arts et lettres',
  cinema: 'Arts et lettres',
  architecture: 'Arts et lettres',
};

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
  // Quatre questions de plus au maximum, donc cinq en tout avec `quiz`.
  //
  // Le plafond n'est pas esthétique : chaque question est une affirmation de plus à
  // vérifier, sur une fiche de 500 mots dont tout l'argument est qu'on peut contrôler ce
  // qu'elle avance. Au-delà de cinq, on répète le texte au lieu d'en éprouver la
  // compréhension, et on multiplie la surface d'erreur pour rien.
  quizSupplementaireMax: 4,
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
 *   quiz_supplementaire: [{ question, choix: [], bonne_reponse: int, explication }],
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
    // Questions de plus sur la **même** fiche, pour le rappel, l'épreuve et la révision.
    //
    // **Un champ additif, jamais `quiz` transformé en tableau.** Le tableau aurait été plus
    // propre sur le papier et aurait cassé deux choses à la fois : les 300 fiches déjà
    // écrites, qu'il aurait fallu migrer, et surtout le décodeur des binaires **déjà
    // installés** — un lecteur qui ne met pas l'app à jour reçoit le fichier signé et ne
    // sait plus le lire. Ici, une version ancienne ignore simplement la clé qu'elle ne
    // connaît pas, et une fiche sans supplément se contente de rebattre l'ordre de ses
    // propositions : dégradé, pas cassé.
    quiz_supplementaire: [],
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
