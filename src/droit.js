/**
 * Quelles fiches juridiques demandent une revue de juridiction et de mutabilité ?
 *
 *     npm run adroit
 *
 * ## Pourquoi une file de plus
 *
 * `npm run acontroler` se déclenche sur **l'empreinte du texte** : une fiche contrôlée
 * puis retouchée repasse. C'est le bon critère pour vingt-deux disciplines sur
 * vingt-trois, et le mauvais pour celle-ci.
 *
 * Une fiche de droit peut devenir fausse **sans qu'un caractère n'ait bougé**. Le texte
 * qu'elle décrit est modifié, ou bien elle décrivait depuis toujours l'état du droit d'un
 * seul pays sans le dire, et l'empreinte est restée identique tout du long. Le contrôle
 * ordinaire la trouve donc en règle, à juste titre : il vérifie que la fiche dit ce que
 * dit la source, et l'article de 2015 dit toujours en 2030 ce qu'il disait en 2015.
 *
 * C'est le même genre de défaut que l'audio produit à partir d'un texte périmé : à la
 * fois silencieux et durable. Il se traite pareil, par une file qui ne regarde pas le
 * contenu mais **l'âge de la dernière vérification**.
 *
 * ## Ce qui limite les dégâts en amont
 *
 * La règle éditoriale (`docs/ligne-editoriale.md` §3.1) veut qu'une fiche de droit soit
 * écrite comme histoire et comme idée, jamais comme état actuel d'une règle en vigueur.
 * Une fiche conforme est **par construction** insensible aux deux risques : le Statute of
 * Anne de 1710 ne se périme pas.
 *
 * Cette file n'est donc pas la défense principale, c'est le filet. Elle existe parce
 * qu'une règle éditoriale se tient à la main et qu'une fiche finit par passer entre les
 * mailles — et parce que, s'il en passe une, rien d'autre dans la chaîne ne la
 * rattraperait.
 */
import { loadAll } from './store.js';
import { SANS_ECOUTE } from './schema.js';

/**
 * Les disciplines soumises à cette revue : les sept de la famille Droit et justice.
 *
 * Aujourd'hui les mêmes que celles qu'on ne sonorise pas, par coïncidence et non par
 * principe : ce sont deux propriétés distinctes du droit. Elles sont donc déclarées
 * séparément, pour que retirer l'une ne retire pas l'autre par accident.
 */
export const DISCIPLINES_JURIDIQUES = new Set([
  'droit_institutions', 'droit_preuve', 'droit_international', 'droit_pi_ia',
  'droit_constitutionnel', 'droit_social', 'droit_conformite',
]);

/**
 * Au-delà de combien de mois une fiche juridique redemande une revue.
 *
 * **C'est ce nombre, et non la cadence de la routine, qui décide combien de temps une
 * fiche devenue fausse continue d'être servie.** La distinction est contre-intuitive et
 * mérite d'être posée une fois pour toutes.
 *
 * Une loi change du jour au lendemain. Si elle change le lendemain d'une revue, la fiche
 * ment jusqu'à la revue suivante, c'est-à-dire pendant toute la durée de validité. Faire
 * passer la routine plus souvent ne raccourcit que la queue : le délai entre le moment où
 * une fiche devient exigible et celui où elle est effectivement reprise. Passer d'un
 * passage par mois à un par semaine gagne trois semaines sur une exposition qui se compte
 * en mois.
 *
 * Trois mois, donc, et non six. Ce que la cadence hebdomadaire rend possible : à raison de
 * quatre revues par fiche et par an sur quatorze fiches, cela fait cinquante-six revues
 * annuelles, loin sous la capacité (voir `PAR_PASSAGE`). L'exposition maximale passe de
 * six mois à trois.
 *
 * Descendre plus bas se paierait ailleurs : chaque revue rouvre des sources, et une
 * routine qui repasse sur les mêmes fiches historiques toutes les six semaines finit par
 * être expédiée. Le Statute of Anne de 1710 n'a pas changé depuis la dernière fois.
 */
export const MOIS_VALIDITE = 3;

/**
 * Fiches revues par passage.
 *
 * Huit, comme les autres routines. L'arithmétique vaut d'être écrite parce qu'elle dit
 * jusqu'où le dispositif tient : la routine passe une fois par semaine, donc cinquante-deux
 * passages par an, donc une capacité de 416 revues annuelles. Avec une validité de trois
 * mois, chaque fiche en demande quatre par an — le dispositif tient donc jusqu'à **cent
 * quatre fiches juridiques**, contre quatorze aujourd'hui.
 *
 * La marge est large à dessein. C'est elle qui permet de raccourcir la validité sans
 * toucher à rien d'autre, si l'exposition de trois mois se révélait encore trop longue.
 */
export const PAR_PASSAGE = 8;

/** Le jour, en ISO, décalé de `mois` mois vers le passé. */
function ilYA(mois, maintenant) {
  const d = new Date(maintenant);
  d.setMonth(d.getMonth() - mois);
  return d.toISOString().slice(0, 10);
}

/** Cette fiche demande-t-elle une revue de juridiction et de mutabilité ? */
export function aRevoir(fiche, maintenant = new Date()) {
  if (!DISCIPLINES_JURIDIQUES.has(fiche.discipline)) return false;
  // Une fiche rejetée ne sera jamais servie : elle ne vaut pas le coût des vérifications.
  if (fiche.statut === 'rejete') return false;
  const c = fiche.controle_juridique;
  if (!c || !c.fait_le) return true;
  return c.fait_le < ilYA(MOIS_VALIDITE, maintenant);
}

/** Pourquoi cette fiche est dans la file — pour que la sortie le dise. */
export function motif(fiche) {
  const c = fiche.controle_juridique;
  if (!c || !c.fait_le) return 'jamais revue';
  return `dernière revue le ${c.fait_le}`;
}

export async function file(maintenant = new Date()) {
  const fiches = await loadAll();
  const juridiques = fiches.filter((f) => DISCIPLINES_JURIDIQUES.has(f.discipline));
  const aFaire = juridiques.filter((f) => aRevoir(f, maintenant));

  // Les jamais revues d'abord, puis la plus ancienne revue : c'est l'ordre du risque.
  const rang = (f) => (f.controle_juridique?.fait_le ? 1 : 0);
  aFaire.sort((a, b) => rang(a) - rang(b)
    || (a.controle_juridique?.fait_le ?? '').localeCompare(b.controle_juridique?.fait_le ?? '')
    || a.id.localeCompare(b.id));

  return {
    revoir: aFaire.length > 0,
    lot: aFaire.slice(0, PAR_PASSAGE).map((f) => ({ fiche: f, motif: motif(f) })),
    restant: Math.max(0, aFaire.length - PAR_PASSAGE),
    juridiques: juridiques.length,
    aJour: juridiques.length - aFaire.length,
    mois: MOIS_VALIDITE,
    // Rappelé ici pour que la sortie de la commande le porte : la routine réveille
    // rarement, et l'opérateur n'aura pas la règle en tête au moment où elle réveille.
    sansEcoute: [...SANS_ECOUTE],
  };
}

/**
 * Pose la trace d'une revue juridique.
 *
 *     node src/cli.js controle-droit <id> <ok|a_revoir> "note"
 *
 * Pas de verdict `corrige` ici, à la différence du contrôle ordinaire. Une revue qui
 * trouve la juridiction tue ou le texte modifié touche au **sens** de la fiche, et le
 * partage des rôles du dépôt veut que le sens se signale au lieu de se réparer en
 * silence : `a_revoir` plus `statut: en_retouche`, et `/reparer` fait le reste.
 */
export async function marquer(id, verdict, notes = []) {
  const VERDICTS = ['ok', 'a_revoir'];
  if (!VERDICTS.includes(verdict)) {
    throw new Error(`verdict inconnu « ${verdict} » — attendu : ${VERDICTS.join(', ')}`);
  }
  const fiches = await loadAll();
  const fiche = fiches.find((f) => f.id === id);
  if (!fiche) throw new Error(`fiche introuvable : ${id}`);
  if (!DISCIPLINES_JURIDIQUES.has(fiche.discipline)) {
    throw new Error(`${id} n'est pas une fiche juridique (discipline « ${fiche.discipline} »)`);
  }
  if (verdict === 'a_revoir' && !notes.length) {
    throw new Error('un verdict « a_revoir » sans note ne dit pas quoi revoir');
  }

  const { readFile, writeFile } = await import('node:fs/promises');
  const brut = JSON.parse(await readFile(fiche._path, 'utf8'));
  // Pas d'empreinte, contrairement à `controle` : ce n'est pas le texte qu'on horodate,
  // c'est la vérification. Une fiche inchangée doit repasser quand même.
  brut.controle_juridique = {
    fait_le: new Date().toISOString().slice(0, 10),
    verdict,
    notes,
  };
  await writeFile(fiche._path, `${JSON.stringify(brut, null, 2)}\n`, 'utf8');
  return brut.controle_juridique;
}

export function afficher(f) {
  const t = (s) => process.stdout.write(s + '\n');
  t('');
  t(`  fiches juridiques   ${f.juridiques}`);
  t(`  revue à jour        ${f.aJour}  (validité ${f.mois} mois)`);
  t('');
  if (!f.revoir) {
    t('  RIEN À FAIRE — chaque fiche juridique a une revue à jour.');
    t('');
    return;
  }
  t(`  REVOIR  ${f.lot.length} fiche(s)`);
  if (f.restant) t(`  ${f.restant} de plus attendront le passage suivant.`);
  t('');
  t('  Deux questions, et seulement celles-là :');
  t('    1. la fiche dit-elle de quel pays elle parle ?');
  t('    2. ce qu\'elle décrit est-il toujours vrai aujourd\'hui ?');
  t('');
  for (const e of f.lot) {
    t(`    ${e.fiche.id}  ${e.fiche.titre}`);
    t(`      ${e.motif}`);
    for (const note of e.fiche.controle_juridique?.notes ?? []) t(`      → ${note}`);
    t('');
  }
}
