/**
 * Quelles fiches restent à contrôler ?
 *
 *     npm run acontroler
 *
 * Le pendant de `npm run cible`. La production écrit, le contrôle relit — et comme la
 * production, la routine de contrôle ne choisit rien : elle exécute ce que cette commande
 * lui dit.
 *
 * **Ce que le contrôle n'est pas.** `npm run validate` vérifie la forme : longueurs,
 * champs obligatoires, équilibre du quiz. Il ne peut pas vérifier qu'une source existe ni
 * qu'elle dit ce que la fiche lui fait dire. C'est précisément ce trou que cette routine
 * comble, et c'est le seul risque du projet qui ne se rattrape pas une fois publié.
 *
 * **L'empreinte.** Une fiche contrôlée puis modifiée doit repasser. On enregistre donc une
 * empreinte du contenu de fond au moment du contrôle : si elle a bougé, la fiche
 * redevient à contrôler. Sans ça, une correction post-contrôle passerait à travers.
 */
import { createHash } from 'node:crypto';
import { loadAll } from './store.js';
import { DISCIPLINES } from './schema.js';

/** Fiches contrôlées par passage. Aligné sur la production : 8 écrites, 8 relues. */
export const PAR_PASSAGE = 8;

/**
 * Empreinte du contenu de fond.
 *
 * Ne couvre que ce dont la véracité dépend. Le statut, l'historique de validation ou la
 * trace de contrôle elle-même en sont exclus : les toucher ne rend pas la fiche fausse,
 * et les inclure ferait repasser toutes les fiches au premier changement de statut.
 */
export function empreinte(fiche) {
  const fond = {
    titre: fiche.titre,
    accroche: fiche.accroche,
    discipline: fiche.discipline,
    contenu: fiche.contenu_vulgarise,
    citation: fiche.citation,
    repere: fiche.repere,
    carte: fiche.carte,
    sources: fiche.sources,
    pour_aller_plus_loin: fiche.pour_aller_plus_loin,
    quiz: fiche.quiz,
  };
  return createHash('sha256').update(JSON.stringify(fond)).digest('hex').slice(0, 16);
}

/** Une fiche a-t-elle besoin d'un contrôle ? */
export function aControler(fiche) {
  // Les fiches rejetées ne valent pas le coût d'une vérification de sources.
  if (fiche.statut === 'rejete') return false;
  const c = fiche.controle;
  if (!c || !c.fait_le) return true;
  // Contrôlée, puis retouchée : à repasser.
  return c.empreinte !== empreinte(fiche);
}

export async function file() {
  const fiches = await loadAll();
  const enRetard = fiches.filter(aControler);

  // Les brouillons d'abord : ce sont eux qui attendent une décision humaine, et un
  // contrôle en amont fait gagner du temps au relecteur.
  const rang = (f) => (f.statut === 'brouillon' ? 0 : f.statut === 'en_retouche' ? 1 : 2);
  enRetard.sort((a, b) => rang(a) - rang(b) || a.id.localeCompare(b.id));

  const parVerdict = {};
  for (const f of fiches) {
    const v = f.controle?.verdict ?? 'jamais contrôlée';
    parVerdict[v] = (parVerdict[v] ?? 0) + 1;
  }

  return {
    controler: enRetard.length > 0,
    lot: enRetard.slice(0, PAR_PASSAGE),
    restant: Math.max(0, enRetard.length - PAR_PASSAGE),
    total: fiches.length,
    enRetard: enRetard.length,
    parVerdict,
  };
}

export function afficher(f) {
  const t = (s) => process.stdout.write(s + '\n');
  t('');
  t(`  fiches en base      ${f.total}`);
  t(`  à contrôler         ${f.enRetard}`);
  for (const [verdict, n] of Object.entries(f.parVerdict).sort()) {
    t(`    ${String(n).padStart(4)}  ${verdict}`);
  }
  t('');
  if (!f.controler) {
    t('  RIEN À FAIRE — toutes les fiches sont contrôlées et inchangées depuis.');
    t('');
    return;
  }
  t(`  CONTRÔLER  ${f.lot.length} fiche(s)`);
  if (f.restant) t(`  ${f.restant} de plus attendront le passage suivant.`);
  t('');
  for (const fiche of f.lot) {
    const raison = fiche.controle?.fait_le ? 'modifiée depuis' : 'jamais contrôlée';
    t(`    ${fiche.id.padEnd(42)} ${DISCIPLINES[fiche.discipline] ?? fiche.discipline} · ${fiche.statut} · ${raison}`);
  }
  t('');
}
