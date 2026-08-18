/**
 * Quelles fiches n'ont encore qu'une seule question ?
 *
 *     npm run aquestionner
 *
 * ## Pourquoi cette file existe
 *
 * Le corpus a été écrit avec **une** question par fiche, et c'était suffisant tant que la
 * question ne servait qu'une fois, le jour de la lecture. Le rappel, la révision et
 * l'épreuve tirent tous dans le même sac : avec une seule question, ils rejouent celle du
 * jour mot pour mot, et le lecteur qui la retrouve intacte croit avoir retenu ce qu'il a
 * seulement reconnu.
 *
 * Le champ `quiz_supplementaire` a été ouvert pour ça. Il est vide sur les trois cent
 * dix-neuf fiches déjà validées, et rien ne le remplira tout seul : les routines
 * existantes contrôlent, réparent, relisent et produisent, aucune ne revient sur une fiche
 * en règle pour lui ajouter quelque chose. D'où celle-ci, qui ne fait que ça et s'arrête
 * quand le corpus est complet.
 *
 * ## Pourquoi elle finira par ne plus rien avoir à faire
 *
 * C'est une file de **rattrapage**, pas une file d'entretien. Les fiches neuves doivent
 * naître avec leurs questions supplémentaires (`.claude/commands/produire.md`) ; sinon
 * cette file se remplirait aussi vite qu'elle se vide, et on aurait installé pour toujours
 * une routine qui répare un oubli qu'on continue de commettre.
 *
 * ## L'ordre, et pourquoi il compte
 *
 * Par discipline la moins pourvue d'abord, jamais par identifiant. Le lecteur ne coche que
 * trois disciplines : un rattrapage qui traiterait le corpus dans l'ordre alphabétique
 * remplirait Anthropologie et Archéologie en entier avant de toucher à la Physique, et la
 * révision resterait creuse pendant des jours pour tout lecteur qui n'a pas coché les
 * premières lettres de l'alphabet. En tournant, chaque discipline avance ensemble, et le
 * sac se remplit pour tout le monde à la même vitesse.
 *
 * C'est le même raisonnement que `src/cible.js`, pour la même raison : l'app sert un
 * concept par jour **parmi les disciplines choisies**, et un stock déséquilibré est
 * inutilisable pour qui n'a pas coché la discipline remplie.
 */
import { loadAll } from './store.js';
import { REGLES } from './schema.js';

/**
 * Combien de fiches par passage.
 *
 * Dix, quatre fois par jour : quarante par jour, donc huit jours pour les trois cent
 * dix-neuf fiches validées. Le plafond n'est pas une limite de calcul — écrire deux à
 * quatre questions demande de **relire la fiche entière** et de vérifier que chaque
 * réponse fausse est fausse. C'est le temps d'attention disponible en un passage qui fixe
 * le chiffre, pas la machine.
 */
export const PAR_PASSAGE = 10;

/**
 * Combien de questions supplémentaires visées par fiche.
 *
 * Deux au minimum, quatre au maximum (`REGLES.quizSupplementaireMax`). Une fiche à deux
 * suffit à ce que le rappel ne se répète pas d'une fois sur l'autre ; en viser quatre
 * partout doublerait le travail pour un gain que le lecteur ne verrait qu'au quatrième
 * passage sur la même fiche, c'est-à-dire presque jamais.
 */
export const CIBLE_MINIMUM = 2;

/**
 * Les statuts qui méritent des questions.
 *
 * Ce qui est servi, et rien d'autre. Un brouillon en attente de relecture peut encore être
 * écarté, une fiche en retouche peut être réécrite : écrire des questions dessus, c'est
 * écrire des questions sur un texte qui n'est pas arrêté, et les refaire ensuite.
 */
const SERVIES = ['valide', 'publie'];

/** Combien de questions cette fiche porte en tout, celle du jour comprise. */
export function nombreDeQuestions(fiche) {
  return (fiche.quiz ? 1 : 0) + (fiche.quiz_supplementaire ?? []).length;
}

/** Cette fiche a-t-elle besoin de questions supplémentaires ? */
export function aCompleter(fiche) {
  if (!SERVIES.includes(fiche.statut)) return false;
  // Sans question du jour, il n'y a rien à compléter : c'est `quiz` qu'il faut écrire
  // d'abord, et ce n'est pas le travail de cette file.
  if (!fiche.quiz) return false;
  return (fiche.quiz_supplementaire ?? []).length < CIBLE_MINIMUM;
}

export async function file() {
  const fiches = await loadAll();
  const servies = fiches.filter((f) => SERVIES.includes(f.statut));
  const aFaire = servies.filter(aCompleter);

  // Combien de fiches restent à compléter dans chaque discipline : c'est ce compte qui
  // donne l'ordre, la moins avancée passant devant.
  const resteParDiscipline = new Map();
  for (const f of aFaire) {
    resteParDiscipline.set(f.discipline, (resteParDiscipline.get(f.discipline) ?? 0) + 1);
  }

  // Un tour de rôle : une fiche de chaque discipline, puis on recommence. Les disciplines
  // les moins pourvues ouvrent le tour, et l'identifiant tranche à égalité pour que deux
  // exécutions du même jour donnent le même lot.
  const parDiscipline = new Map();
  for (const f of [...aFaire].sort((a, b) => a.id.localeCompare(b.id))) {
    if (!parDiscipline.has(f.discipline)) parDiscipline.set(f.discipline, []);
    parDiscipline.get(f.discipline).push(f);
  }
  const disciplines = [...parDiscipline.keys()].sort((a, b) =>
    parDiscipline.get(b).length - parDiscipline.get(a).length || a.localeCompare(b));

  const lot = [];
  let tour = 0;
  while (lot.length < PAR_PASSAGE) {
    const avant = lot.length;
    for (const d of disciplines) {
      const f = parDiscipline.get(d)[tour];
      if (f) lot.push(f);
      if (lot.length >= PAR_PASSAGE) break;
    }
    if (lot.length === avant) break; // toutes les disciplines épuisées
    tour += 1;
  }

  const sansQuiz = servies.filter((f) => !f.quiz);

  return {
    completer: aFaire.length > 0,
    lot,
    restant: Math.max(0, aFaire.length - lot.length),
    servies: servies.length,
    completes: servies.length - aFaire.length,
    cible: CIBLE_MINIMUM,
    maximum: REGLES.quizSupplementaireMax,
    // Signalées à part : elles n'ont pas de question du tout, ce qui est un autre défaut
    // et ne se répare pas ici. Les taire ferait croire le corpus complet.
    sansQuiz: sansQuiz.map((f) => f.id),
  };
}

export function afficher(f) {
  const t = (s) => process.stdout.write(s + '\n');
  t('');
  t(`  fiches servies      ${f.servies}`);
  t(`  au moins ${f.cible} questions de plus   ${f.completes}`);
  t('');
  if (f.sansQuiz.length) {
    t(`  ${f.sansQuiz.length} fiche(s) servie(s) sans aucune question — à écrire d'abord :`);
    for (const id of f.sansQuiz.slice(0, 10)) t(`    ${id}`);
    t('');
  }
  if (!f.completer) {
    t('  RIEN À FAIRE — chaque fiche servie porte assez de questions.');
    t('');
    return;
  }
  t(`  COMPLÉTER  ${f.lot.length} fiche(s)`);
  if (f.restant) t(`  ${f.restant} de plus attendront le passage suivant.`);
  t('');
  t(`  ${f.cible} questions de plus au minimum, ${f.maximum} au maximum, sur la fiche elle-même.`);
  t('  Chaque réponse fausse doit être fausse, et vérifiable dans le texte de la fiche.');
  t('');
  for (const fiche of f.lot) {
    t(`    ${fiche.id}  ${fiche.titre}`);
    t(`      ${fiche.discipline} · ${nombreDeQuestions(fiche)} question(s) aujourd'hui`);
    t('');
  }
}
