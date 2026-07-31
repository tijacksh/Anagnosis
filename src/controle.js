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

/**
 * Pose la trace de contrôle sur une fiche.
 *
 *     node src/cli.js controle <id> <ok|corrige|a_revoir> [note] [note...]
 *
 * L'empreinte est calculée ici, pas recopiée à la main : une empreinte fausse rendrait
 * la fiche éternellement « à contrôler », ou pire, masquerait une retouche ultérieure.
 */
export async function marquer(id, verdict, notes = []) {
  const VERDICTS = ['ok', 'corrige', 'a_revoir'];
  if (!VERDICTS.includes(verdict)) {
    throw new Error(`verdict inconnu « ${verdict} » — attendu : ${VERDICTS.join(', ')}`);
  }
  const fiches = await loadAll();
  const fiche = fiches.find((f) => f.id === id);
  if (!fiche) throw new Error(`fiche introuvable : ${id}`);
  if (verdict === 'a_revoir' && !notes.length) {
    throw new Error('un verdict « a_revoir » sans note ne dit pas quoi revoir');
  }

  const { readFile, writeFile } = await import('node:fs/promises');
  const brut = JSON.parse(await readFile(fiche._path, 'utf8'));
  brut.controle = {
    fait_le: new Date().toISOString().slice(0, 10),
    verdict,
    empreinte: empreinte(brut),
    notes,
  };
  await writeFile(fiche._path, `${JSON.stringify(brut, null, 2)}\n`, 'utf8');
  return brut.controle;
}

/**
 * Applique la décision d'une réparation, avec sa trace.
 *
 *     node src/cli.js reparation <id> <valide|en_retouche|rejete> "note"
 *
 * `decide_par` vaut **`routine-reparation`**, jamais l'adresse d'une personne : c'est la
 * seule chose qui permette, plus tard, de savoir ce qui a été relu par un humain et ce
 * qui ne l'a pas été. Une routine qui signerait du nom du relecteur rendrait cette
 * question définitivement sans réponse.
 *
 * La trace de contrôle n'est **pas** rafraîchie ici, à dessein — mais il faut être précis
 * sur ce que ça garantit :
 *
 * - la réparation a **changé le texte** : l'empreinte enregistrée ne correspond plus, la
 *   fiche retourne dans `npm run acontroler`, et un passage indépendant revérifie le
 *   travail avant qu'elle ne soit servie longtemps ;
 * - la réparation n'a **rien changé** — le texte avait déjà été corrigé lors d'un contrôle
 *   antérieur, il ne restait qu'à décider : l'empreinte correspond toujours, la fiche ne
 *   repasse pas. C'est correct : elle a bien été contrôlée, sur ce texte exactement.
 *
 * Autrement dit le filet attrape les réécritures, pas les simples décisions. Dire qu'il
 * attrape tout serait faux.
 */
export async function reparation(id, statut, notes = []) {
  const STATUTS = ['valide', 'en_retouche', 'rejete'];
  if (!STATUTS.includes(statut)) {
    throw new Error(`statut inconnu « ${statut} » — attendu : ${STATUTS.join(', ')}`);
  }
  if (!notes.length) {
    throw new Error('une réparation sans note ne dit pas ce qui a été fait');
  }

  const { appliquerDecision, save } = await import('./store.js');
  const fiches = await loadAll();
  const fiche = fiches.find((f) => f.id === id);
  if (!fiche) throw new Error(`fiche introuvable : ${id}`);
  if (fiche.statut !== 'en_retouche') {
    throw new Error(`${id} n'est pas en retouche (statut : ${fiche.statut})`);
  }

  const action = statut === 'valide' ? 'valider' : statut === 'rejete' ? 'rejeter' : 'retoucher';
  const decidee = appliquerDecision(fiche, {
    statut, action, note: notes.join(' — '),
    par: 'routine-reparation', quand: new Date().toISOString(),
  });
  await save(decidee);
  return decidee;
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
