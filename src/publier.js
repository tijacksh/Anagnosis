/**
 * Le contenu publié pour le client iOS, et sa signature.
 *
 * L'app embarque un corpus dans son bundle — c'est son plancher, elle fonctionne
 * entièrement hors ligne avec. Ce module produit le fichier qu'elle télécharge par
 * dessus, pour que de nouvelles fiches arrivent sans passer par l'App Store.
 *
 * **Pourquoi une signature.** Le fichier est servi par un CDN public. Sans signature,
 * quiconque prend la main sur l'hébergement peut réécrire toutes les sources de toutes
 * les fiches — et la source vérifiable *est* le produit (brief §3). Une prise de
 * contrôle silencieuse de l'hébergement retournerait l'app contre sa seule promesse.
 * Ed25519, clé publique dans le bundle, refus si la signature ne vérifie pas.
 *
 * **Pourquoi deux fichiers et non une enveloppe.** La signature porte sur les octets
 * exacts de `concepts.json`, servis tels quels. Une enveloppe `{signature, contenu}`
 * obligerait le client à re-sérialiser le contenu à l'identique avant de vérifier —
 * ordre des clés, espaces, échappement Unicode : le genre de détail qui marche jusqu'au
 * jour où il ne marche plus, en clientèle et sans trace.
 */
import { createSign, createPrivateKey, sign as signerBrut } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { loadAll, ROOT } from './store.js';
import { lireIndex } from './audio.js';

/** Où la clé privée est cherchée, dans cet ordre. */
export const CLE_ENV = 'ANAGNOSIS_CLE_PRIVEE';
export const CLE_FICHIER = path.join(process.env.HOME ?? '', '.anagnosis', 'signature-privee.pem');

/**
 * Le Worker qui sert l'audio depuis le bucket R2 privé — jamais R2 directement, qui
 * refuserait tout sans le jeton que seul ce Worker connaît (`worker/audio.js`,
 * `docs/passation-audio.md`). Le jeton lui-même n'entre pas dans le manifeste : il est
 * embarqué côté client, posé sur chaque requête de téléchargement, pas ici.
 */
export const AUDIO_BASE = 'https://anagnosis-audio.anagnosis.workers.dev';

/**
 * Le champ `audio` d'une fiche, ou `undefined` si aucune voix n'est encore hébergée.
 *
 * Une voix ne compte que si elle a été **téléversée** (`voix.<nom>.r2`) — pas seulement
 * produite : `audio/index.json` porte les deux états séparément, et publier l'un sans
 * l'autre écrirait dans le manifeste signé une adresse que le bucket ne sert pas encore.
 */
function audioPour(fiche, index) {
  const entree = index[fiche.id];
  if (!entree) return undefined;
  const voix = {};
  for (const nom of ['helene', 'jerome']) {
    const v = entree.voix?.[nom];
    if (v?.r2) voix[nom] = { url: `${AUDIO_BASE}/${v.fichier}`, sha256: v.sha256, secondes: v.secondes };
  }
  return Object.keys(voix).length ? voix : undefined;
}

/**
 * Les fiches telles que le client les reçoit.
 *
 * Même projection que `npm run export` : `_path`, `validation`, `meta` et `controle`
 * restent au pipeline. Une seule définition, pour que le fichier téléchargé et le
 * fichier embarqué ne puissent pas diverger de forme.
 */
export async function fichesPubliables(fiches = null) {
  const toutes = fiches ?? (await loadAll());
  const index = await lireIndex();
  return toutes
    .filter((f) => ['valide', 'publie'].includes(f.statut))
    .map(({ _path, validation, meta, controle, ...publique }) => {
      const audio = audioPour(publique, index);
      return audio ? { ...publique, audio } : publique;
    });
}

/**
 * Les identifiants sortis de la circulation.
 *
 * **Corriger une fiche a toujours marché ; la retirer, non.** Le client fusionne le
 * fichier reçu avec son corpus embarqué par une union — c'est ce qui empêche un export
 * tronqué de faire disparaître des fiches déjà lues — et une union ne sait pas
 * soustraire. Une fiche dont le contrôle révèle qu'elle affirme ce que ses sources ne
 * disent pas restait donc servie sur tous les appareils installés.
 *
 * On publie donc, à côté des fiches, la liste de celles qui n'ont plus à tomber :
 * `en_retouche` (sortie le temps d'être réparée) et `rejete` (sortie pour de bon).
 * `brouillon` n'y figure pas — une fiche jamais publiée n'est chez personne.
 *
 * La liste voyage dans le fichier signé : aucune requête de plus, et un retrait ne peut
 * pas être injecté par qui n'a pas la clé. Elle est **remplacée** à chaque publication,
 * jamais cumulée : c'est ainsi qu'une fiche corrigée puis revalidée revient en jeu.
 */
export function retirees(fiches) {
  return fiches
    .filter((f) => ['en_retouche', 'rejete'].includes(f.statut))
    .map((f) => f.id)
    .sort();
}

/** Les octets exacts qui seront servis, et signés. */
export function serialiser(fiches, retires = []) {
  return Buffer.from(`${JSON.stringify({ concepts: fiches, retirees: retires }, null, 2)}\n`, 'utf8');
}

/**
 * Signe les octets, ou rend `null` si aucune clé n'est disponible.
 *
 * Rendre `null` plutôt que lever : une machine sans clé doit pouvoir construire le
 * site (le banc d'essai n'a rien à signer). C'est l'appelant qui décide si publier
 * sans signature est acceptable — et pour le contenu du client iOS, ça ne l'est pas.
 */
/**
 * Remet un PEM d'aplomb, quelle que soit la façon dont il a voyagé.
 *
 * Un champ de variable d'environnement n'est pas un éditeur de texte : Netlify a rendu
 * la clé **sur une seule ligne**, les retours à la ligne devenus des espaces. D'autres
 * CI les échappent en « \n » littéraux. Le journal de build disait :
 *
 *     première ligne reçue : « -----BEGIN PRIVATE KEY----- MC4CAQAwBQYD »
 *
 * Plutôt que de chercher la manière de coller qui préserve les sauts de ligne — sur
 * laquelle on retombe au premier changement d'interface, et qui ne se voit qu'au
 * déploiement suivant — on ne garde que ce qui compte : le corps en base64. Les
 * en-têtes sont réécrits, le corps recoupé en lignes de 64. Toute forme de collage
 * fonctionne alors, y compris le corps seul sans en-tête.
 */
function normaliserPem(brut) {
  const corps = brut
    .replace(/\\n/g, '\n')
    .replace(/-----[^-]*-----/g, ' ')
    .replace(/[^A-Za-z0-9+/=]/g, '');
  if (!corps) return brut;
  const lignes = corps.match(/.{1,64}/g) ?? [];
  return `-----BEGIN PRIVATE KEY-----\n${lignes.join('\n')}\n-----END PRIVATE KEY-----\n`;
}

export async function signer(octets) {
  let pem = process.env[CLE_ENV];
  if (!pem) {
    try { pem = await readFile(CLE_FICHIER, 'utf8'); } catch { return null; }
  }
  pem = normaliserPem(pem);

  // Une clé mal formée ne doit pas emporter le site avec elle.
  //
  // `createPrivateKey` lève, et l'exception remontait jusqu'à faire échouer
  // `npm run app`. Sur Netlify, un build en échec ne déploie rien : le site entier
  // restait figé sur la version précédente à cause d'une variable d'environnement mal
  // collée. Le symptôme était trompeur — `/contenu/` en 404, comme si la clé était
  // simplement absente, alors que rien du tout ne se déployait plus.
  //
  // On rend donc `null`, comme pour une clé absente : le site part sans le dossier
  // `contenu/`, et le journal de build dit précisément ce qui cloche.
  try {
    const cle = createPrivateKey(pem);
    // Ed25519 signe le message entier, sans pré-hachage : l'algorithme passé à `sign`
    // doit être `null`, sans quoi Node refuse la clé.
    return signerBrut(null, octets, cle).toString('base64');
  } catch (e) {
    // La première ligne suffit à diagnostiquer sans divulguer quoi que ce soit : une
    // clé correcte commence par « -----BEGIN PRIVATE KEY----- ». Tout autre chose
    // signale un collage de travers — invite du terminal recopiée, guillemets ajoutés,
    // en-tête perdu.
    const debut = pem.split('\n')[0].slice(0, 40);
    console.error(`Clé de signature inutilisable (${e.code ?? e.message}).`);
    console.error(`  première ligne reçue : « ${debut} »`);
    console.error('  attendu              : « -----BEGIN PRIVATE KEY----- »');
    return null;
  }
}
