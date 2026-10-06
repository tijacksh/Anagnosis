/**
 * Quels brouillons sont prêts à être décidés ?
 *
 *     npm run arelire
 *
 * Le quatrième temps du cycle. `npm run cible` dit quoi écrire, `npm run acontroler` dit
 * quoi relire, `npm run areparer` dit quoi réparer — celle-ci dit **quoi trancher** : les
 * brouillons qui attendent qu'on les mette en circulation ou qu'on les écarte.
 *
 * ## Ce que ça change, et pourquoi c'est écrit ici
 *
 * `CLAUDE.md` posait jusqu'ici que `valide` est la trace d'une **décision humaine**. Le
 * propriétaire du produit a délégué cette décision à une routine. Ce n'est donc plus vrai,
 * et le dissimuler serait le pire des choix : la fiche porte `decide_par: routine-relecture`,
 * jamais une adresse personnelle. On peut à tout moment répondre à la question « qu'est-ce
 * qu'un humain a réellement lu ? », et la réponse restera juste dans deux ans.
 *
 * ## Le garde-fou : deux passages, pas un
 *
 * La routine ne prend **que** les brouillons portant déjà une trace de contrôle **à jour**
 * — même empreinte, verdict `ok` ou `corrige`. Autrement dit : un premier passage a rouvert
 * les sources et n'a rien trouvé à signaler ; ce second passage rouvre tout à nouveau et
 * décide.
 *
 * C'est le point qui distingue cette routine d'une simple validation automatique. Un seul
 * passage qui vérifie et valide dans la foulée ne se contredit jamais lui-même : il refait
 * la même lecture, avec les mêmes angles morts. Deux passages séparés dans le temps, partant
 * chacun du texte brut, se rattrapent l'un l'autre — c'est le seul filet qui reste une fois
 * le relecteur retiré.
 *
 * Ça ne coûte aucun délai : le contrôle tourne toutes les quatre heures et traite les
 * brouillons en priorité (`src/controle.js`, tri par statut). Un brouillon écrit le matin
 * est contrôlé dans la journée et décidable le lendemain.
 *
 * Une fiche que le contrôle a jugée `a_revoir` n'arrive jamais ici : il l'a passée en
 * `en_retouche`, donc elle appartient à `npm run areparer`.
 */
import { loadAll } from './store.js';
import { DISCIPLINES } from './schema.js';
import { empreinte } from './controle.js';

/**
 * Brouillons décidés par passage.
 *
 * Aligné sur la réparation, et pour la même raison : rouvrir toutes les sources d'une fiche
 * et répondre de chaque affirmation coûte cher. Quatre faites sérieusement valent mieux que
 * douze survolées — et c'est exactement le travers qu'une routine autonome doit s'interdire.
 */
export const PAR_PASSAGE = Number(process.env.ANAGNOSIS_RELIRE_PAR_PASSAGE) || 4;

/** La trace de contrôle décrit-elle encore le texte qu'on a sous les yeux ? */
export function controleAJour(fiche) {
  const c = fiche.controle;
  return Boolean(c?.fait_le) && c.empreinte === empreinte(fiche);
}

/** Ce brouillon est-il décidable — contrôlé, à jour, et sans réserve ? */
export function aRelire(fiche) {
  if (fiche.statut !== 'brouillon') return false;
  if (!controleAJour(fiche)) return false;
  return fiche.controle.verdict === 'ok' || fiche.controle.verdict === 'corrige';
}

/** Un brouillon qui attend encore son contrôle : rien à faire ici, il viendra. */
export function enAttenteDeControle(fiche) {
  return fiche.statut === 'brouillon' && !aRelire(fiche);
}

export async function file() {
  const fiches = await loadAll();
  const prets = fiches.filter(aRelire);

  // Le contrôle le plus ancien d'abord : un brouillon qui traîne a plus de chances d'avoir
  // été écrit avant un ajustement de la ligne éditoriale, donc mérite d'être tranché avant
  // que l'écart ne se creuse.
  prets.sort((a, b) => (a.controle.fait_le ?? '').localeCompare(b.controle.fait_le ?? '')
    || a.id.localeCompare(b.id));

  const attente = fiches.filter(enAttenteDeControle);

  return {
    relire: prets.length > 0,
    lot: prets.slice(0, PAR_PASSAGE),
    restant: Math.max(0, prets.length - PAR_PASSAGE),
    total: fiches.length,
    prets: prets.length,
    attenteDeControle: attente.length,
  };
}

/**
 * Applique la décision d'une relecture, avec sa trace.
 *
 *     node src/cli.js relecture <id> <valide|en_retouche|rejete> "note"
 *
 * La note n'est pas décorative : elle est la **seule** justification d'une mise en
 * circulation sans relecteur. Elle doit dire quelles sources ont été rouvertes et ce qui a
 * été vérifié. C'est aussi ce qu'on relira le jour où une fiche se révélera fausse.
 */
export async function relecture(id, statut, notes = []) {
  const STATUTS = ['valide', 'en_retouche', 'rejete'];
  if (!STATUTS.includes(statut)) {
    throw new Error(`statut inconnu « ${statut} » — attendu : ${STATUTS.join(', ')}`);
  }
  if (!notes.length) {
    throw new Error('une relecture sans note ne dit pas ce qui a été vérifié');
  }

  const { appliquerDecision, save } = await import('./store.js');
  const fiches = await loadAll();
  const fiche = fiches.find((f) => f.id === id);
  if (!fiche) throw new Error(`fiche introuvable : ${id}`);
  if (fiche.statut !== 'brouillon') {
    throw new Error(`${id} n'est pas un brouillon (statut : ${fiche.statut})`);
  }
  // Le garde-fou est ici, pas seulement dans la file : rien ne doit pouvoir valider une
  // fiche qu'aucun contrôle indépendant n'a vue, même en appelant la commande à la main.
  if (statut === 'valide' && !aRelire(fiche)) {
    throw new Error(
      `${id} n'a pas de contrôle à jour sans réserve — `
      + `elle ne peut pas être validée par la routine. Lancer /controler d'abord.`,
    );
  }

  const action = statut === 'valide' ? 'valider' : statut === 'rejete' ? 'rejeter' : 'retoucher';
  const decidee = appliquerDecision(fiche, {
    statut, action, note: notes.join(' — '),
    par: 'routine-relecture', quand: new Date().toISOString(),
  });
  await save(decidee);
  return decidee;
}

export function afficher(f) {
  const t = (s) => process.stdout.write(s + '\n');
  t('');
  t(`  fiches en base        ${f.total}`);
  t(`  brouillons décidables ${f.prets}`);
  if (f.attenteDeControle) {
    t(`  en attente de contrôle : ${f.attenteDeControle} — /controler les prendra`);
  }
  t('');
  if (!f.relire) {
    t('  RIEN À FAIRE — aucun brouillon ne porte de contrôle à jour sans réserve.');
    t('');
    return;
  }
  t(`  RELIRE  ${f.lot.length} brouillon(s)`);
  if (f.restant) t(`  ${f.restant} de plus attendront le passage suivant.`);
  t('');
  for (const fiche of f.lot) {
    t(`    ${fiche.id}`);
    t(`      ${DISCIPLINES[fiche.discipline] ?? fiche.discipline}`
      + ` · contrôlée le ${fiche.controle.fait_le} · verdict ${fiche.controle.verdict}`);
    for (const note of fiche.controle.notes ?? []) {
      // Ce que le contrôle a corrigé en passant : à revérifier, pas à croire sur parole.
      t(`      → ${note}`);
    }
    t('');
  }
}
