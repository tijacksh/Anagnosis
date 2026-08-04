/**
 * Héberger l'audio sur R2 — le tuyau entre les dérivés produits par `sonoriser` et le
 * bucket privé que le futur Worker Cloudflare servira derrière la validation d'abonnement.
 *
 *     npm run heberger                 téléverse tout ce qui manque
 *
 * Volontairement une passe **séparée** de `sonoriser` : produire coûte des crédits
 * ElevenLabs et dépend d'un fournisseur externe, téléverser est gratuit et rejouable.
 * Les découpler permet de relancer l'un sans l'autre — même logique que le cycle
 * contrôler → réparer → relire, qui sépare aussi ce qui coûte de ce qui vérifie.
 *
 * ## Ce que ce module ne fait pas
 *
 * Il ne touche pas au manifeste (`src/publier.js`). Le bucket est privé : une URL R2
 * directe n'est pas plus utilisable par l'app qu'une adresse muette, et publier un champ
 * `audio` avant que le Worker de validation existe reviendrait à écrire dans un fichier
 * signé une adresse qui rejettera tout le monde — le même piège que documenté pour la
 * clé de signature absente (CLAUDE.md : « mieux vaut un endpoint absent qu'un endpoint
 * que l'app rejettera »). Le champ `audio` du manifeste attend le Worker.
 */
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { loadAll } from './store.js';
import { DERIVES, VOIX, lireIndex, ecrireIndex } from './audio.js';
import { config, televerser } from './r2.js';

/** La clé R2 d'un dérivé : le nom de fichier suffit, il porte déjà l'id et la voix. */
export function cleR2(fichier) {
  return `audio/${fichier}`;
}

/**
 * Les voix produites pour une fiche publiable, dont le dérivé local n'est pas encore
 * dans le bucket sous la même empreinte.
 */
export async function file() {
  const fiches = await loadAll();
  const publiables = fiches.filter((f) => ['valide', 'publie'].includes(f.statut));
  const index = await lireIndex();

  const aTeleverser = [];
  for (const fiche of publiables) {
    const entree = index[fiche.id];
    if (!entree) continue;
    for (const v of VOIX) {
      const voix = entree.voix?.[v.nom];
      if (!voix) continue;
      if (voix.r2?.sha256 === voix.sha256) continue;
      aTeleverser.push({ ficheId: fiche.id, voix: v.nom, fichier: voix.fichier, sha256: voix.sha256 });
    }
  }
  return aTeleverser;
}

/**
 * Téléverse tout ce qui manque, et marque chaque succès dans l'index au fur et à mesure
 * — un échec au milieu du lot ne perd pas ce qui a déjà été déposé.
 */
export async function televerserTout() {
  const aFaire = await file();
  if (aFaire.length) config();   // échoue tôt, une seule fois, si les clés R2 manquent
  const resultats = [];

  for (const { ficheId, voix, fichier, sha256 } of aFaire) {
    try {
      const corps = await readFile(path.join(DERIVES, fichier));
      const empreinteLocale = createHash('sha256').update(corps).digest('hex');
      if (empreinteLocale !== sha256) {
        // Le fichier sur disque ne correspond plus à ce que l'index a enregistré : une
        // nouvelle génération l'a remplacé entre-temps. Téléverser quand même servirait
        // un son qui ne correspond à aucune empreinte connue.
        throw new Error('dérivé local différent de l\'index — relancer `sonoriser` avant de téléverser');
      }

      // Toujours téléverser, sans vérifier d'abord si l'objet existe déjà : un PUT S3
      // écrase sans condition, et l'index (pas un HEAD) est la source de vérité sur ce
      // qui est déjà en ligne.
      await televerser(cleR2(fichier), corps, { typeContenu: 'audio/mp4' });

      const index = await lireIndex();
      index[ficheId].voix[voix].r2 = { sha256, cle: cleR2(fichier), televerse_le: new Date().toISOString() };
      await ecrireIndex(index);
      resultats.push({ ficheId, voix, ok: true });
    } catch (e) {
      resultats.push({ ficheId, voix, ok: false, erreur: e.message });
    }
  }
  return resultats;
}

export function afficher(resultats) {
  const t = (s) => process.stdout.write(`${s}\n`);
  if (!resultats.length) {
    t('');
    t('  RIEN À FAIRE — chaque voix publiable est déjà dans le bucket.');
    t('');
    return;
  }
  t('');
  for (const r of resultats) {
    t(r.ok ? `  ✓ ${r.ficheId} — ${r.voix}` : `  ✗ ${r.ficheId} — ${r.voix} — ${r.erreur}`);
  }
  t('');
}
