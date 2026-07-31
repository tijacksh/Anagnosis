/**
 * Quelles fiches attendent une réparation ?
 *
 *     npm run areparer
 *
 * Le troisième temps du cycle. `npm run cible` dit quoi écrire, `npm run acontroler` dit
 * quoi relire, celle-ci dit **quoi réparer** : les fiches qu'un contrôle a sorties de la
 * circulation parce que leur texte affirme ce que leurs sources ne disent pas.
 *
 * **Pourquoi une commande à part.** Ces fiches sont déjà contrôlées : les remettre dans
 * la file de `acontroler` referait le travail de détection au lieu de traiter ce qui a
 * été trouvé. Et elles ne sont pas non plus dans la file de production : il ne s'agit pas
 * d'écrire, mais de faire dire à un texte exactement ce que ses sources soutiennent.
 *
 * **La routine revalide elle-même quand tout est vérifié**, et c'est un écart assumé au
 * principe « `valide` est la trace d'une décision humaine ». Il est rendu visible plutôt
 * que dissimulé : la fiche porte `decide_par: routine-reparation`, jamais l'adresse d'une
 * personne. On sait donc toujours ce qui a été relu par un humain et ce qui ne l'a pas
 * été, et l'historique de validation garde chaque passage.
 *
 * Deux garde-fous compensent l'absence de relecteur :
 *
 * - réécrire change le texte, donc l'empreinte, donc la fiche **repasse au contrôle**
 *   (`npm run acontroler`) sans qu'on ait à le demander : une réparation qui touche au
 *   texte est toujours revérifiée par un passage indépendant. Une réparation qui ne fait
 *   que décider — le texte ayant déjà été corrigé lors d'un contrôle antérieur — ne
 *   repasse pas, et n'en a pas besoin : elle a été contrôlée sur ce texte exactement ;
 * - une fiche qui revient en retouche après deux réparations est **rejetée** plutôt que
 *   réparée une troisième fois. Sans cette borne, une fiche dont la thèse même est
 *   fausse ferait la navette indéfiniment.
 */
import { loadAll } from './store.js';
import { DISCIPLINES } from './schema.js';
import { empreinte } from './controle.js';

/** Fiches réparées par passage. Une réparation coûte plus qu'un contrôle : on en fait moins. */
export const PAR_PASSAGE = 4;

/** Une fiche attend-elle une réparation ? */
export function aReparer(fiche) {
  return fiche.statut === 'en_retouche';
}

/**
 * A-t-elle été retouchée depuis le contrôle qui l'a sortie ?
 *
 * Si oui, quelqu'un — ou un passage précédent — y a déjà travaillé sans que le contrôle
 * soit repassé. On la traite en dernier : son diagnostic n'est plus à jour, et le
 * contrôle la reprendra de toute façon.
 */
export function diagnosticPerime(fiche) {
  return Boolean(fiche.controle?.empreinte) && fiche.controle.empreinte !== empreinte(fiche);
}

/** Combien de fois la routine de réparation est déjà passée sur cette fiche. */
export function passagesDeReparation(fiche) {
  return (fiche.validation?.historique ?? [])
    .filter((h) => h.par === 'routine-reparation').length;
}

export async function file() {
  const fiches = await loadAll();
  const attente = fiches.filter(aReparer);

  // Diagnostic à jour d'abord : ce sont les seules pour lesquelles les notes de contrôle
  // décrivent encore le texte qu'on a sous les yeux.
  attente.sort((a, b) => Number(diagnosticPerime(a)) - Number(diagnosticPerime(b))
    || a.id.localeCompare(b.id));

  return {
    reparer: attente.length > 0,
    lot: attente.slice(0, PAR_PASSAGE),
    restant: Math.max(0, attente.length - PAR_PASSAGE),
    total: fiches.length,
    attente: attente.length,
    sansDiagnostic: attente.filter((f) => !f.controle?.notes?.length).length,
  };
}

export function afficher(f) {
  const t = (s) => process.stdout.write(s + '\n');
  t('');
  t(`  fiches en base      ${f.total}`);
  t(`  en retouche         ${f.attente}`);
  if (f.sansDiagnostic) t(`  dont sans note de contrôle : ${f.sansDiagnostic}`);
  t('');
  if (!f.reparer) {
    t('  RIEN À FAIRE — aucune fiche en retouche.');
    t('');
    return;
  }
  t(`  RÉPARER  ${f.lot.length} fiche(s)`);
  if (f.restant) t(`  ${f.restant} de plus attendront le passage suivant.`);
  t('');
  for (const fiche of f.lot) {
    const passages = passagesDeReparation(fiche);
    t(`    ${fiche.id}`);
    t(`      ${DISCIPLINES[fiche.discipline] ?? fiche.discipline}`
      + `${diagnosticPerime(fiche) ? ' · DIAGNOSTIC PÉRIMÉ, fiche modifiée depuis' : ''}`
      + `${passages ? ` · ${passages} réparation(s) déjà tentée(s)` : ''}`
      + `${passages >= 2 ? ' — À REJETER, ne pas réparer une fois de plus' : ''}`);
    for (const note of fiche.controle?.notes ?? []) {
      // La note est le cahier des charges de la réparation : on l'affiche en entier.
      t(`      → ${note}`);
    }
    t('');
  }
}
