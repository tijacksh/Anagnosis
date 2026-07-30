/**
 * Que produire maintenant ?
 *
 *     npm run cible
 *
 * Décide seul de la discipline à alimenter et dit s'il faut produire ou s'arrêter.
 * C'est le point d'entrée de la routine de production : elle ne choisit rien, elle
 * exécute ce que cette commande lui dit.
 *
 * Deux règles, et elles suffisent.
 *
 * **On vise le stock le plus mince.** Pas au hasard : le brief §9 demande un socle sur
 * toutes les disciplines actives avant publication, et `docs/decisions.md` prévient
 * qu'un stock déséquilibré rend le service impraticable pour qui n'a pas coché la
 * discipline remplie. Viser le plus mince fait converger l'ensemble au lieu de creuser
 * l'écart.
 *
 * **On s'arrête quand la file de relecture est pleine.** Le goulot n'est pas la
 * génération, c'est la relecture : le validateur vérifie la forme, il ne peut pas
 * vérifier qu'une source existe ni qu'elle dit ce que la fiche prétend. Produire plus
 * vite qu'on ne relit ne fabrique pas du stock, ça fabrique un arriéré illisible — et
 * `statut: valide` doit rester la trace d'une décision humaine.
 */
import { loadAll } from './store.js';
import { DISCIPLINES, ENCRES } from './schema.js';

/** Fiches en attente de relecture au-delà desquelles on cesse de produire. */
export const FILE_MAX = 24;

/** Fiches par passage. Huit par jour, soit environ 180 par mois. */
export const PAR_PASSAGE = 8;

/**
 * Socle visé par discipline. En dessous, une discipline cochée seule ferait tourner
 * la même fiche trop vite ; le client ne l'offre pas tant qu'elle n'a rien.
 */
export const SOCLE = 25;

export async function cible() {
  const fiches = await loadAll();

  const publiables = fiches.filter((f) => ['valide', 'publie'].includes(f.statut));
  const enAttente = fiches.filter((f) => ['brouillon', 'en_retouche'].includes(f.statut));

  const stock = {};
  for (const cle of Object.keys(DISCIPLINES)) stock[cle] = 0;
  for (const f of publiables) {
    if (f.discipline in stock) stock[f.discipline]++;
  }

  // Les brouillons comptent à moitié dans le classement : ils ne sont pas encore du
  // stock, mais viser deux fois la même discipline avant qu'elle soit relue serait
  // aveugle.
  const enCours = {};
  for (const f of enAttente) enCours[f.discipline] = (enCours[f.discipline] ?? 0) + 1;

  // On ne vise que les disciplines habillées. Le client n'offre une discipline que
  // lorsqu'elle a du stock **et** une encre (docs/charte-visuelle.md §2.2) : produire
  // pour une discipline sans encre écrit des fiches que `npm run app` écartera, et
  // que personne ne lira. Le stock le plus mince n'est le bon critère qu'à l'intérieur
  // de ce qui est servable — sinon la cible désigne indéfiniment les dix disciplines
  // en attente d'encre, qui resteront à zéro quoi qu'on écrive.
  const servables = Object.keys(DISCIPLINES).filter((cle) => ENCRES[cle]);
  const sansEncre = Object.keys(DISCIPLINES).length - servables.length;

  const classement = servables
    .map((cle) => ({
      discipline: cle,
      nom: DISCIPLINES[cle],
      publiables: stock[cle] ?? 0,
      enAttente: enCours[cle] ?? 0,
      poids: (stock[cle] ?? 0) + (enCours[cle] ?? 0) * 0.5,
    }))
    .sort((a, b) => a.poids - b.poids || a.discipline.localeCompare(b.discipline));

  const fileTropPleine = enAttente.length >= FILE_MAX;
  const socleAtteint = classement.every((d) => d.publiables >= SOCLE);

  return {
    produire: !fileTropPleine,
    raison: fileTropPleine
      ? `file de relecture pleine (${enAttente.length} ≥ ${FILE_MAX})`
      : socleAtteint
        ? `socle de ${SOCLE} atteint partout — on approfondit`
        : 'socle incomplet',
    discipline: classement[0].discipline,
    nom: classement[0].nom,
    combien: PAR_PASSAGE,
    fileDAttente: enAttente.length,
    total: publiables.length,
    sansEncre,
    classement,
  };
}

export function afficher(c) {
  const t = (s) => process.stdout.write(s + '\n');
  t('');
  t(`  file de relecture   ${c.fileDAttente} / ${FILE_MAX}`);
  t(`  fiches publiables   ${c.total}`);
  t('');
  if (!c.produire) {
    t(`  STOP — ${c.raison}`);
    t('  Relire la file avant de produire à nouveau : npm run admin');
    t('');
    return;
  }
  t(`  PRODUIRE  ${c.combien} fiche(s) en « ${c.nom} »`);
  t(`  ${c.raison}`);
  t('');
  t('  les cinq disciplines les plus minces :');
  for (const d of c.classement.slice(0, 5)) {
    t(`    ${String(d.publiables).padStart(3)} publiables  ${String(d.enAttente).padStart(2)} en attente   ${d.nom}`);
  }
  if (c.sansEncre) {
    t('');
    t(`  ${c.sansEncre} discipline(s) hors classement — pas encore d'encre attribuée`);
  }
  t('');
}
