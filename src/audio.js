/**
 * L'audio des fiches : ce qui manque, et comment on le produit.
 *
 *     npm run asonoriser              ce qui n'a pas d'audio à jour
 *     node src/cli.js sonoriser <id>  produire l'audio d'une fiche
 *
 * Le cinquième temps du cycle. `npm run cible` dit quoi écrire, `acontroler` quoi relire,
 * `areparer` quoi réparer, `arelire` quoi trancher — celle-ci dit **quoi faire entendre**.
 *
 * ## Pourquoi des fichiers, et pas une synthèse sur l'appareil
 *
 * `AVSpeechSynthesizer` donne un résultat que le lecteur identifie immédiatement comme
 * une machine. C'est le même critère non négociable que pour les illustrations : le rendu
 * ne doit jamais s'entendre comme généré. Une voix synthétique décrédibilise une fiche
 * dont tout le propos est l'exactitude (`docs/decisions.md`, 2026-08-02).
 *
 * ## Le piège que cet index existe pour éviter
 *
 * L'empreinte de contrôle (`src/controle.js`) ne couvre que le fond éditorial — titre,
 * contenu, sources, quiz. Elle ne sait rien de l'audio. Si l'on se contentait de
 * regarder si le fichier existe, une fiche corrigée par `/reparer` garderait le son de
 * l'ancien texte, **et rien ne le signalerait** : le lecteur entendrait une version que
 * la fiche ne dit plus, sans que personne ne puisse s'en apercevoir avant un signalement.
 *
 * L'index enregistre donc l'empreinte du texte **à partir duquel** chaque fichier a été
 * produit. Une fiche dont l'empreinte a bougé repasse d'elle-même en production, comme
 * elle repasse d'elle-même au contrôle. Même mécanisme, même raison.
 *
 * ## Une génération, deux formats
 *
 * Régénérer coûte des crédits *et* prend le risque que le modèle ait bougé entre-temps :
 * la voix du catalogue changerait en silence, d'une fiche à l'autre. On génère donc une
 * fois, au format le plus riche qu'on servira jamais, et on dérive le reste localement —
 * gratuit, déterministe, refaisable.
 *
 * Le ré-encodage a lieu ici, sur le poste de production. Ni le NAS ni la chaîne de
 * construction n'y touchent : `ffmpeg` est un outil d'atelier, pas une dépendance du
 * pipeline.
 */
import { createHash } from 'node:crypto';
import { execFile } from 'node:child_process';
import { mkdir, readFile, writeFile, unlink } from 'node:fs/promises';
import { promisify } from 'node:util';
import path from 'node:path';
import { loadAll, ROOT } from './store.js';
import { empreinte } from './controle.js';

const executer = promisify(execFile);

/** Où vivent les fichiers. Les deux dossiers d'audio sont ignorés par git — l'index, non. */
export const DOSSIER = path.join(ROOT, 'audio');
export const MASTERS = path.join(DOSSIER, 'masters');
export const DERIVES = path.join(DOSSIER, 'app');
export const INDEX = path.join(DOSSIER, 'index.json');

export const CLE_ENV = 'ELEVENLABS_API_KEY';

/**
 * Les deux voix servies, choisies à l'écoute et non au classement.
 *
 * Un compte ElevenLabs neuf n'expose que des voix anglophones : les faire lire du
 * français donne du français à l'accent américain. Celles-ci viennent de la bibliothèque
 * partagée et sont explicitement francophones. Elles couvrent nos deux registres —
 * l'exposition documentaire et la narration réflexive — et le lecteur choisit.
 */
export const VOIX = [
  { nom: 'helene', id: 'a2NqrzzRklNWkb04aqW1', genre: 'femme' },
  { nom: 'jerome', id: 'TES2Z4FdTbwd5F5uHmLW', genre: 'homme' },
];

/**
 * `eleven_v3` et pas `multilingual_v2`.
 *
 * v3 est le seul des deux à honorer un dictionnaire de prononciation IPA, et le corpus
 * fait dire 832 noms propres distincts. En échange il ne sait pas recoudre la prosodie
 * entre deux requêtes — ce qui ne nous coûte rien : sa limite est de 5 000 caractères et
 * la fiche la plus longue du corpus en fait 3 874. Une fiche tient toujours en une
 * requête, donc il n'y a jamais rien à recoudre.
 */
export const MODELE = 'eleven_v3';
export const LIMITE_CARACTERES = 5000;

/** Le master, archivé et jamais servi : c'est lui qui alimentera le podcast. */
const FORMAT_MASTER = 'mp3_44100_128';

/**
 * L'allure de référence, appliquée à la production.
 *
 * Les deux voix lisent naturellement à 120 et 131 mots par minute — la bande du discours
 * structuré à pauses marquées, nettement sous la norme du livre audio (150-160). C'est
 * juste pour de l'exposition, et trop lent pour qui écoute des podcasts. À 1,25× on
 * rejoint exactement cette norme.
 *
 * **Pourquoi au ré-encodage et non à la génération.** `voice_settings.speed` existe bien
 * dans l'API, mais `eleven_v3` ne l'honore pas : mesuré, deux appels au même texte à 1,0
 * et à 1,25 rendent des fichiers de durée identique à la milliseconde. On applique donc
 * `atempo`, qui étire le temps sans toucher à la hauteur de voix.
 *
 * **Elle est cuite dans le fichier**, master compris, pour que le podcast ait la même
 * allure que l'app. Le lecteur garde par-dessus son réglage 1× / 1,25× / 1,5×, qui part
 * désormais de cette référence-là.
 */
export const ALLURE = 1.25;

/**
 * Combien de fiches par passage.
 *
 * Une fiche en deux voix coûte ~3 200 crédits. Le garde-fou n'est pas le prix mais la
 * bévue : une boucle qui part de travers doit s'arrêter avant d'avoir vidé le mois.
 */
export const PAR_PASSAGE = 8;

/**
 * Le texte réellement prononcé.
 *
 * Les marqueurs de titre et d'emphase sont retirés — `##` ne se prononce pas — mais les
 * blocs restent séparés par une ligne vide : c'est ce qui fait entendre la pause devant
 * un titre de section, et c'est le point que la relecture à l'oreille a validé.
 */
export function aLire(fiche) {
  const morceaux = [nettoyer(fiche.titre)];
  for (const ligne of (fiche.contenu_vulgarise ?? '').split('\n')) {
    const nette = nettoyer(ligne.replace(/^##\s*/, ''));
    if (nette) morceaux.push(nette);
  }
  if (fiche.citation) {
    morceaux.push(nettoyer(`Citation. ${fiche.citation.texte} ${fiche.citation.auteur}.`));
  } else if (fiche.repere) {
    morceaux.push(nettoyer(fiche.repere.texte));
  }
  return morceaux.join('\n\n');
}

/**
 * Retire les marques de mise en forme, **sans insérer d'espace**.
 *
 * Les doubles astérisques du gras étaient bien retirés, les simples de l'italique non :
 * 88 fiches sur 162 partaient donc à la synthèse avec leurs étoiles autour des titres
 * d'ouvrage — « l'astérisque Essai sur le don astérisque ». Trouvé sur la fiche témoin,
 * avant la génération du corpus ; sur les 162 fiches, c'était un demi-million de crédits
 * dépensés pour un catalogue à refaire.
 *
 * Pas d'espace en remplacement, pour la même raison que `motsDe` (`src/store.js`) :
 * « l'*italique* » deviendrait deux mots, et la synthèse marquerait une coupure au milieu.
 */
function nettoyer(texte = '') {
  return texte.replace(/[*_`]/g, '').trim();
}

/** L'index, ou un index vide s'il n'existe pas encore. */
export async function lireIndex() {
  try {
    return JSON.parse(await readFile(INDEX, 'utf8'));
  } catch (e) {
    if (e.code === 'ENOENT') return {};
    throw e;
  }
}

export async function ecrireIndex(index) {
  const trie = Object.fromEntries(Object.entries(index).sort(([a], [b]) => a.localeCompare(b)));
  await mkdir(DOSSIER, { recursive: true });
  await writeFile(INDEX, `${JSON.stringify(trie, null, 2)}\n`, 'utf8');
}

/**
 * Cette fiche a-t-elle un audio qui décrit encore son texte ?
 *
 * Trois façons de répondre non : jamais produit, produit à partir d'un texte qui a
 * changé depuis, ou produit pour une seule des deux voix.
 */
export function aSonoriser(fiche, index) {
  if (!['valide', 'publie'].includes(fiche.statut)) return false;
  const entree = index[fiche.id];
  if (!entree) return true;
  if (entree.empreinte !== empreinte(fiche)) return true;
  // Une allure de référence changée rend tout le catalogue incohérent : une fiche à
  // l'ancienne cadence au milieu des autres s'entend immédiatement.
  if (entree.allure !== ALLURE) return true;
  return VOIX.some((v) => !entree.voix?.[v.nom]);
}

/** Pourquoi cette fiche est dans la file — pour que la sortie le dise. */
export function motif(fiche, index) {
  const entree = index[fiche.id];
  if (!entree) return 'jamais produit';
  if (entree.empreinte !== empreinte(fiche)) return 'texte modifié depuis';
  if (entree.allure !== ALLURE) return `produit à ${entree.allure ?? 1}× au lieu de ${ALLURE}×`;
  const manquantes = VOIX.filter((v) => !entree.voix?.[v.nom]).map((v) => v.nom);
  return `voix manquante : ${manquantes.join(', ')}`;
}

export async function file() {
  const fiches = await loadAll();
  const index = await lireIndex();
  const aFaire = fiches.filter((f) => aSonoriser(f, index));

  // Les périmées d'abord : une fiche dont le son ment sur le texte est plus urgente
  // qu'une fiche qui n'en a pas encore.
  const rang = (f) => (index[f.id] ? 0 : 1);
  aFaire.sort((a, b) => rang(a) - rang(b) || a.id.localeCompare(b.id));

  const publiables = fiches.filter((f) => ['valide', 'publie'].includes(f.statut));
  return {
    sonoriser: aFaire.length > 0,
    lot: aFaire.slice(0, PAR_PASSAGE).map((f) => ({ fiche: f, motif: motif(f, index) })),
    restant: Math.max(0, aFaire.length - PAR_PASSAGE),
    publiables: publiables.length,
    sonorisees: publiables.length - aFaire.length,
    caracteres: aFaire.reduce((s, f) => s + aLire(f).length, 0),
  };
}

/**
 * Un appel à ElevenLabs. Renvoie les octets **et** l'horodatage de chaque caractère.
 *
 * L'endpoint `/with-timestamps` coûte le même nombre de crédits que l'ordinaire et rend en
 * plus l'instant où chaque caractère est prononcé. On le prend systématiquement : sans lui,
 * chapitrer une fiche supposerait de deviner les frontières au prorata des caractères, ce
 * qui suppose un débit constant que la voix n'a pas. Et surtout, s'en apercevoir plus tard
 * coûterait une seconde génération de tout le corpus — un demi-million de crédits.
 */
async function synthetiser(texte, voix, cle) {
  if (texte.length > LIMITE_CARACTERES) {
    // Découper reviendrait à recoudre la prosodie, ce que v3 ne sait pas faire. Mieux
    // vaut refuser bruyamment que servir une fiche dont les paragraphes ne se suivent pas.
    throw new Error(`${texte.length} caractères — au-delà de la limite de ${LIMITE_CARACTERES}`
      + ' pour ce modèle. Raccourcir la fiche plutôt que de découper le son.');
  }
  const r = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voix.id}/with-timestamps`
    + `?output_format=${FORMAT_MASTER}`, {
      method: 'POST',
      headers: { 'xi-api-key': cle, 'content-type': 'application/json' },
      body: JSON.stringify({ text: texte, model_id: MODELE }),
    });
  if (!r.ok) throw new Error(`ElevenLabs ${r.status} — ${(await r.text()).slice(0, 200)}`);

  const rendu = await r.json();
  if (!rendu.audio_base64) throw new Error('réponse sans audio');
  return {
    octets: Buffer.from(rendu.audio_base64, 'base64'),
    alignement: rendu.alignment ?? rendu.normalized_alignment ?? null,
  };
}

/**
 * Écrit le master à l'allure de référence.
 *
 * `atempo` étire le temps sans toucher à la hauteur de voix — c'est le filtre prévu pour
 * ça. On le pose ici et non à la dérivation pour que le master et le fichier de l'app
 * aient la même allure : le master alimentera le podcast, et deux podcasts qui n'ont pas
 * le même débit que l'app seraient deux produits différents.
 */
async function ecrireMaster(brut, cible) {
  const temporaire = `${cible}.brut.mp3`;
  await writeFile(temporaire, brut);
  try {
    await executer('ffmpeg', [
      '-loglevel', 'error', '-y', '-i', temporaire,
      '-filter:a', `atempo=${ALLURE}`, '-c:a', 'libmp3lame', '-b:a', '128k', '-ac', '1', cible,
    ]);
  } finally {
    // Même en cas d'échec : un brut qui traîne serait pris pour un master au passage suivant.
    await unlink(temporaire).catch(() => {});
  }
}

/**
 * Le format servi à l'app : AAC 32 kbit/s mono, ~900 Ko la fiche.
 *
 * Le master fait quatre fois ce poids pour une différence que personne n'entend sur de
 * la parole, dans des écouteurs, dans le métro. Il reste archivé pour le podcast, où le
 * débit se justifie.
 */
async function deriver(master, cible) {
  await executer('ffmpeg', [
    '-loglevel', 'error', '-y', '-i', master,
    '-ac', '1', '-c:a', 'aac', '-b:a', '32k', cible,
  ]);
}

/**
 * Les frontières de passage, en secondes, dans le fichier **accéléré**.
 *
 * L'alignement rendu par l'API porte sur l'audio d'origine ; le master est étiré de
 * `ALLURE`, donc chaque instant se divise d'autant. C'est exact, pas approché.
 *
 * On repère chaque morceau par sa position en caractères dans le texte prononcé : les
 * morceaux sont justement les blocs séparés par une ligne vide, donc leurs débuts se
 * retrouvent sans ambiguïté.
 */
function chapitres(texte, alignement) {
  if (!alignement?.character_start_times_seconds) return null;
  const debuts = alignement.character_start_times_seconds;
  const blocs = texte.split('\n\n');

  const sortie = [];
  let curseur = 0;
  for (const bloc of blocs) {
    const position = texte.indexOf(bloc, curseur);
    if (position < 0) continue;
    curseur = position + bloc.length;
    const t = debuts[Math.min(position, debuts.length - 1)];
    if (typeof t === 'number') {
      sortie.push({ debut: Math.round((t / ALLURE) * 100) / 100, texte: bloc.slice(0, 70) });
    }
  }
  return sortie.length ? sortie : null;
}

/** La durée réelle du fichier produit, pour que l'app puisse l'annoncer avant de lire. */
async function secondes(fichier) {
  const { stdout } = await executer('ffprobe', [
    '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', fichier,
  ]);
  return Math.round(Number(stdout.trim()));
}

/** Sans ffmpeg on ne dérive rien — et le dire tôt vaut mieux qu'échouer après l'appel payant. */
export async function verifierOutils() {
  for (const outil of ['ffmpeg', 'ffprobe']) {
    try {
      await executer(outil, ['-version']);
    } catch {
      throw new Error(`${outil} est introuvable — nécessaire pour dériver le format de l'app.`
        + ' L\'installer (brew install ffmpeg) avant de produire quoi que ce soit :'
        + ' sans lui, la génération payante partirait pour rien.');
    }
  }
}

/**
 * Produit l'audio d'une fiche, dans les deux voix, et met l'index à jour.
 *
 * Idempotent sur le texte, pas sur le fichier : on ne régénère pas une voix dont
 * l'empreinte correspond déjà, même si on rappelle la commande.
 */
export async function sonoriser(fiche, { cle = process.env[CLE_ENV], force = false } = {}) {
  if (!cle) throw new Error(`${CLE_ENV} absente de l'environnement`);
  await verifierOutils();
  await mkdir(MASTERS, { recursive: true });
  await mkdir(DERIVES, { recursive: true });

  const index = await lireIndex();
  const marque = empreinte(fiche);
  const texte = aLire(fiche);
  const entree = index[fiche.id];
  const aJour = !force && entree?.empreinte === marque;

  const voix = {};
  for (const v of VOIX) {
    if (aJour && entree.voix?.[v.nom]) {
      voix[v.nom] = entree.voix[v.nom];   // déjà produite pour ce texte : on n'y retouche pas
      continue;
    }
    const master = path.join(MASTERS, `${fiche.id}--${v.nom}.mp3`);
    const derive = path.join(DERIVES, `${fiche.id}--${v.nom}.m4a`);
    const { octets: brut, alignement } = await synthetiser(texte, v, cle);
    await ecrireMaster(brut, master);
    await deriver(master, derive);

    const contenu = await readFile(derive);
    voix[v.nom] = {
      fichier: path.basename(derive),
      genre: v.genre,
      sha256: createHash('sha256').update(contenu).digest('hex'),
      octets: contenu.length,
      secondes: await secondes(derive),
      chapitres: chapitres(texte, alignement),
    };
  }

  index[fiche.id] = {
    empreinte: marque,
    modele: MODELE,
    allure: ALLURE,
    caracteres: texte.length,
    produit_le: new Date().toISOString(),
    voix,
  };
  await ecrireIndex(index);
  return index[fiche.id];
}

export function afficher(f) {
  const t = (s) => process.stdout.write(s + '\n');
  t('');
  t(`  fiches publiables     ${f.publiables}`);
  t(`  déjà sonorisées       ${f.sonorisees}`);
  t('');
  if (!f.sonoriser) {
    t('  RIEN À FAIRE — chaque fiche publiable a son audio, dans les deux voix.');
    t('');
    return;
  }
  t(`  SONORISER  ${f.lot.length} fiche(s)`);
  if (f.restant) t(`  ${f.restant} de plus attendront le passage suivant.`);
  // Ce que ça va coûter, avant de le dépenser : ~0,55 crédit par caractère, deux voix.
  t(`  ~${Math.round(f.caracteres * 0.55 * VOIX.length / 1000)}k crédits pour tout le reste`);
  t('');
  for (const { fiche, motif } of f.lot) {
    t(`    ${fiche.id}`);
    t(`      ${aLire(fiche).length} caractères · ${motif}`);
  }
  t('');
}
