/**
 * L'audio des fiches : ce qui manque, et comment on le produit.
 *
 *     npm run asonoriser                       ce qui n'a pas d'audio à jour
 *     node src/cli.js sonoriser <id>           produire l'audio d'une fiche
 *     node src/cli.js sonoriser --file [--jusqua 04:30]   toute la file (tâche de nuit)
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
 * ## Un moteur local, huit voix en rotation
 *
 * Depuis le 2026-10-21, l'audio est produit **sur le Mac mini**, par OmniVoice servi par
 * VoiceStudio (`src/voicestudio.js`), avec huit voix clonées (`audio/voix.json`). Une seule
 * voix par fiche, attribuée par rotation et **gardée** ensuite : une fiche régénérée après
 * correction ne change pas de voix. Plus de service distant, plus de crédits.
 *
 * ## Le piège que cet index existe pour éviter
 *
 * Si l'on se contentait de regarder si le fichier existe, une fiche corrigée par
 * `/reparer` garderait le son de l'ancien texte, **et rien ne le signalerait** : le
 * lecteur entendrait une version que la fiche ne dit plus, sans que personne ne puisse
 * s'en apercevoir avant un signalement.
 *
 * L'index enregistre donc l'empreinte du texte **à partir duquel** chaque fichier a été
 * produit — l'empreinte de `aLire()` (`empreinteAudio`), pas celle du contrôle
 * (`src/controle.js`), qui couvre aussi les sources et le quiz, jamais lus à voix haute.
 * Il enregistre aussi **de quoi** le son est fait : le moteur, la révision des poids, la
 * référence de la voix, les réglages de lecture. Un seul de ces éléments qui bouge, et la
 * fiche repasse en production — jamais deux rendus de voix mélangés en silence.
 *
 * ## Une génération, deux formats
 *
 * Le master (MP3 128 kbit/s mono) est archivé pour le podcast ; l'app reçoit un dérivé
 * AAC 32 kbit/s mono, ré-encodé localement. `ffmpeg` est un outil d'atelier, pas une
 * dépendance du pipeline : ni le NAS ni la chaîne de construction n'y touchent.
 */
import { createHash } from 'node:crypto';
import { execFile } from 'node:child_process';
import { copyFile, mkdir, mkdtemp, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { promisify } from 'node:util';
import os from 'node:os';
import path from 'node:path';
import { loadAll, ROOT } from './store.js';
import { SANS_ECOUTE } from './schema.js';
import { appliquer, ecrireAnnees, lireRegles, phrases, reglesTouchant } from './prononciation.js';
import * as moteurLocal from './voicestudio.js';

const executer = promisify(execFile);

/** Où vivent les fichiers. Les deux dossiers d'audio sont ignorés par git — l'index, non. */
export const DOSSIER = path.join(ROOT, 'audio');
export const MASTERS = path.join(DOSSIER, 'masters');
export const DERIVES = path.join(DOSSIER, 'app');
export const INDEX = path.join(DOSSIER, 'index.json');
export const FICHIER_VOIX = path.join(DOSSIER, 'voix.json');

/** Les clips de référence des voix vivent hors du dépôt, comme les accords de droits. */
export const VOIX_ENV = 'ANAGNOSIS_VOIX';
const dossierReferences = () => process.env[VOIX_ENV] ?? path.join(os.homedir(), '.anagnosis', 'voix', 'production');

export const MOTEUR = 'omnivoice';
export const MODELE = moteurLocal.DEPOT_POIDS;

/**
 * La version des réglages de lecture — découpage, pauses, années, volume.
 *
 * Elle entre dans l'index : changer une pause ou la normalisation du volume refait tout le
 * catalogue, parce qu'une fiche à l'ancien réglage au milieu des autres s'entend. On
 * l'incrémente à chaque changement qui modifie le son.
 */
export const REGLAGES = 'lecture-2026-10-21';

/**
 * Les silences entendus dans l'app, en secondes, **après** accélération.
 *
 * Réglés à l'écoute : le moteur enchaîne tout, titres compris, et c'est au pipeline de
 * détacher le titre, les intertitres, les paragraphes et les phrases (2026-10-20).
 */
export const PAUSES = {
  apres: { titre: 0.8, intertitre: 0.45, paragraphe: 0.45, phrase: 0.3, citation: 0.45 },
  avant: { intertitre: 0.8, citation: 0.6 },
};

/** Combien de fiches par passage manuel (`sonoriser --lot`). La tâche de nuit, elle, a une heure de fin. */
export const PAR_PASSAGE = 8;

/** Le volume, normalisé une fois sur la fiche entière (EBU R128) : la rotation ne doit pas s'entendre au volume. */
const VOLUME = 'loudnorm=I=-16:TP=-1.5:LRA=11';

/**
 * Le texte réellement prononcé.
 *
 * Les marqueurs de titre et d'emphase sont retirés — `##` ne se prononce pas — mais les
 * blocs restent séparés par une ligne vide. Un bloc par ligne non vide du corps, plus le
 * titre en tête et la citation (ou le repère) à la fin : c'est cette suite que les
 * chapitres décrivent, et que `src/publier.js` ramène aux blocs affichés par l'app.
 */
export function aLire(fiche) {
  return lignesLues(fiche).map((l) => l.texte).join('\n\n');
}

/** Les lignes lues, typées : le type règle la pause qui suit. */
export function lignesLues(fiche) {
  const lignes = [{ type: 'titre', texte: nettoyer(fiche.titre) }];
  for (const ligne of (fiche.contenu_vulgarise ?? '').split('\n')) {
    const nette = nettoyer(ligne.replace(/^##\s*/, ''));
    if (nette) lignes.push({ type: /^##\s*/.test(ligne) ? 'intertitre' : 'paragraphe', texte: nette });
  }
  if (fiche.citation) {
    lignes.push({ type: 'citation', texte: nettoyer(`Citation. ${fiche.citation.texte} ${fiche.citation.auteur}.`) });
  } else if (fiche.repere) {
    lignes.push({ type: 'citation', texte: nettoyer(fiche.repere.texte) });
  }
  return lignes;
}

/**
 * L'empreinte de ce qui est réellement prononcé — pas celle du contrôle.
 *
 * Hachée sur la sortie d'`aLire()` : une correction de lien mort ou de note de source
 * n'invalide pas un audio dont pas un mot prononcé n'a changé. Les règles de prononciation
 * qui touchent la fiche y entrent aussi : une règle corrigée doit refaire les fiches
 * qu'elle touche — et elles seules. Sans règle, l'empreinte reste celle d'avant le
 * dictionnaire, octet pour octet.
 */
export function empreinteAudio(fiche, regles = []) {
  const h = createHash('sha256').update(aLire(fiche));
  // Tri par code de caractère, pas `localeCompare` : l'empreinte doit être la même sur toutes
  // les machines, quelle que soit leur langue (« ø » ne se range pas pareil partout).
  const touchees = reglesTouchant(aLire(fiche), regles).map(({ nom, dire }) => ({ nom, dire }))
    .sort((a, b) => (a.nom < b.nom ? -1 : a.nom > b.nom ? 1 : 0));
  if (touchees.length) h.update(`\n${JSON.stringify(touchees)}`);
  return h.digest('hex').slice(0, 16);
}

/**
 * Le texte envoyé au moteur : celui qu'on lit, prononciations appliquées.
 *
 * Jamais affiché, jamais stocké dans la fiche : la réécriture « Neuteur » n'existe que le
 * temps de la synthèse.
 */
export function aEnvoyer(fiche, regles = []) {
  return appliquer(aLire(fiche), regles);
}

/**
 * Retire les marques de mise en forme, **sans insérer d'espace**.
 *
 * Les simples astérisques de l'italique partaient autrefois à la synthèse avec les titres
 * d'ouvrage. Pas d'espace en remplacement, pour la même raison que `motsDe`
 * (`src/store.js`) : « l'*italique* » deviendrait deux mots, et la voix marquerait une
 * coupure au milieu.
 */
function nettoyer(texte = '') {
  return texte.replace(/[*_`]/g, '').trim();
}

const ponctuer = (t) => (/[.!?…:»"]$/.test(t) ? t : `${t}.`);

/**
 * Les morceaux générés un par un, dans l'ordre : la phrase est l'unité de génération.
 *
 * Chaque morceau garde le rang de la ligne lue dont il vient (`ligne`), pour que les
 * chapitres se recalculent sans alignement : le début d'une ligne est le début de son
 * premier morceau. Le texte dit passe par les réécritures de prononciation, puis par les
 * années à l'oral ; les titres reçoivent un point final, pour une intonation descendante.
 */
export function morceaux(fiche, regles = []) {
  const sortie = [];
  for (const [ligne, { type, texte }] of lignesLues(fiche).entries()) {
    const dire = (t) => ecrireAnnees(appliquer(t, regles));
    if (type === 'paragraphe') {
      const ps = phrases(texte);
      ps.forEach((p, i) => sortie.push({ ligne, type: i < ps.length - 1 ? 'phrase' : 'paragraphe', texte: dire(p) }));
    } else {
      sortie.push({ ligne, type, texte: dire(type === 'citation' ? texte : ponctuer(texte)) });
    }
  }
  return sortie;
}

/** La pause entre deux morceaux, entendue dans l'app (avant étirement). */
export function pauseEntre(precedent, suivant) {
  return Math.max(PAUSES.apres[precedent.type] ?? 0.3, PAUSES.avant[suivant.type] ?? 0);
}

// ── Les voix ────────────────────────────────────────────────────────────────────────

/** Les voix actives, avec le chemin et l'empreinte de leur référence. */
export async function lireVoix({ fichier = FICHIER_VOIX, references = dossierReferences() } = {}) {
  const { voix = [] } = JSON.parse(await readFile(fichier, 'utf8'));
  return Promise.all(voix.map(async (v) => {
    const dossier = path.join(references, v.reference);
    const refWav = path.join(dossier, 'reference.wav');
    const refTxt = path.join(dossier, 'reference.txt');
    // L'empreinte de la référence : changer le clip d'une voix refait toutes ses fiches.
    const empreinte = existsSync(refWav) && existsSync(refTxt)
      ? createHash('sha256').update(await readFile(refWav)).update(await readFile(refTxt)).digest('hex').slice(0, 16)
      : null;
    return { ...v, refWav, refTxt, empreinte };
  }));
}

/**
 * Tout ce qui décide si un audio est à jour, chargé une fois.
 *
 * Passé explicitement à `aSonoriser` et `motif` : un appelant qui oublierait les règles
 * ou les voix obtiendrait sinon une réponse fausse **sans erreur**, exactement le défaut
 * silencieux que l'index existe pour éviter.
 */
export async function contexte() {
  const voix = await lireVoix();
  // Une référence absente se signale tout de suite, une fois, plutôt que par l'échec de
  // chaque fiche de cette voix, nuit après nuit.
  const sansReference = voix.filter((v) => !v.empreinte);
  if (sansReference.length) {
    throw new Error(`référence introuvable pour ${sansReference.map((v) => v.nom).join(', ')} (${dossierReferences()}) — SSD 1To monté ?`);
  }
  return { regles: await lireRegles(), voix, poids: await moteurLocal.revisionPoids() };
}

function exigerContexte(ctx) {
  if (!ctx?.voix || !ctx?.regles || !ctx.poids) throw new Error('contexte audio manquant : appeler contexte() une fois et le passer');
}

/**
 * La voix de cette fiche : celle qu'elle a déjà, sinon la suivante de la rotation.
 *
 * Une fiche garde sa voix tant que celle-ci est active : corrigée et régénérée, elle ne
 * change pas de lecteur. Pour une fiche nouvelle, la rotation alterne les genres par
 * rapport à la dernière fiche produite, puis prend, dans ce genre, la voix la moins
 * employée du catalogue, en évitant les dernières employées. Ni hasard ni ordre fixe : le
 * hasard fait des séries, et trois fois la même voix d'affilée s'entend.
 */
export function attribuerVoix(fiche, index, voix) {
  const actives = new Map(voix.map((v) => [v.nom, v]));
  const deja = index[fiche.id]?.voix_attribuee;
  if (deja && actives.has(deja)) return actives.get(deja);

  const produites = Object.entries(index)
    .filter(([id, e]) => id !== fiche.id && e.voix_attribuee && actives.has(e.voix_attribuee))
    .sort(([, a], [, b]) => (a.produit_le < b.produit_le ? -1 : a.produit_le > b.produit_le ? 1 : 0))
    .map(([, e]) => e.voix_attribuee);
  const derniere = produites.at(-1);
  const genre = derniere ? (actives.get(derniere).genre === 'femme' ? 'homme' : 'femme') : 'femme';
  const usage = (nom) => produites.filter((n) => n === nom).length;
  const recentes = new Set(produites.slice(-4));
  const duGenre = voix.filter((v) => v.genre === genre);
  const candidates = duGenre.length ? duGenre : voix;
  // Les quatre dernières voix employées sont écartées **avant** de regarder l'usage : sinon
  // une voix ajoutée (usage nul) lirait une fiche sur deux jusqu'à rattraper les autres.
  const reposees = candidates.filter((v) => !recentes.has(v.nom));
  const pool = reposees.length ? reposees : candidates;
  return [...pool].sort((a, b) => usage(a.nom) - usage(b.nom) || voix.indexOf(a) - voix.indexOf(b))[0];
}

// ── L'index ─────────────────────────────────────────────────────────────────────────

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
  const trie = Object.fromEntries(Object.entries(index).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)));
  await mkdir(DOSSIER, { recursive: true });
  // Un fichier temporaire puis un renommage : un arrêt en pleine écriture laisse l'ancien
  // index intact, jamais un index tronqué.
  const tmp = `${INDEX}.${process.pid}.tmp`;
  await writeFile(tmp, `${JSON.stringify(trie, null, 2)}\n`, 'utf8');
  await rename(tmp, INDEX);
}

/**
 * Pourquoi cet audio n'est plus à jour — ou `null` s'il l'est.
 *
 * Une seule fonction pour la décision et pour le motif affiché : les deux ne peuvent pas
 * diverger.
 */
export function raisonDeRefaire(fiche, index, ctx) {
  exigerContexte(ctx);
  const e = index[fiche.id];
  if (!e) return 'jamais produit';
  if (e.moteur !== MOTEUR) return `produit par ${e.modele ?? e.moteur ?? 'un autre moteur'}, pas par le moteur local`;
  if (e.modele !== MODELE) return `modèle changé (${e.modele} → ${MODELE})`;
  if (e.poids !== ctx.poids) return `poids d'OmniVoice changés (${e.poids} → ${ctx.poids})`;
  if (e.reglages !== REGLAGES) return `réglages de lecture changés (${e.reglages} → ${REGLAGES})`;
  const v = ctx.voix.find((x) => x.nom === e.voix_attribuee);
  if (!v) return `voix « ${e.voix_attribuee} » retirée`;
  if (e.reference !== v.empreinte) return `référence de la voix « ${v.nom} » changée`;
  if (e.allure !== v.allure) return `allure de « ${v.nom} » changée (${e.allure} → ${v.allure})`;
  if (e.empreinte !== empreinteAudio(fiche, ctx.regles)) {
    return e.empreinte_texte === empreinteAudio(fiche) ? 'prononciation modifiée depuis' : 'texte modifié depuis';
  }
  if (!e.voix?.[v.nom]) return 'fichier manquant';
  return null;
}

/** Cette fiche a-t-elle un audio qui décrit encore son texte, dans la voix et le rendu actuels ? */
export function aSonoriser(fiche, index, ctx) {
  if (!['valide', 'publie'].includes(fiche.statut)) return false;
  // Une discipline qu'on ne sonorise pas ne rejoint jamais la file : la voix rend en
  // bouillie les dates, numéros d'article et noms d'arrêts (`SANS_ECOUTE`).
  if (SANS_ECOUTE.has(fiche.discipline)) return false;
  return raisonDeRefaire(fiche, index, ctx) !== null;
}

/** Pourquoi cette fiche est dans la file — pour que la sortie le dise. */
export function motif(fiche, index, ctx) {
  return raisonDeRefaire(fiche, index, ctx) ?? 'à jour';
}

/** Durée moyenne mesurée sur le Mac mini, une voix, phrase par phrase : pour l'estimation. */
const SECONDES_PAR_CARACTERE = 0.08;

export async function file(ctx = null) {
  const c = ctx ?? await contexte();
  const fiches = await loadAll();
  const index = await lireIndex();
  const aFaire = fiches.filter((f) => aSonoriser(f, index, c));

  // Les périmées d'abord : une fiche dont le son ment sur le texte est plus urgente
  // qu'une fiche qui n'en a pas encore.
  const rang = (f) => (index[f.id] ? 0 : 1);
  aFaire.sort((a, b) => rang(a) - rang(b) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));

  // Les disciplines sans écoute sont hors du dénominateur, pas dedans avec un compte parfait.
  const publiables = fiches.filter(
    (f) => ['valide', 'publie'].includes(f.statut) && !SANS_ECOUTE.has(f.discipline));
  const caracteres = aFaire.reduce((s, f) => s + aLire(f).length, 0);
  return {
    sonoriser: aFaire.length > 0,
    toutes: aFaire,
    lot: aFaire.slice(0, PAR_PASSAGE).map((f) => ({ fiche: f, motif: motif(f, index, c) })),
    restant: Math.max(0, aFaire.length - PAR_PASSAGE),
    publiables: publiables.length,
    sonorisees: publiables.length - aFaire.length,
    caracteres,
    heures: Math.round((caracteres * SECONDES_PAR_CARACTERE / 3600) * 10) / 10,
  };
}

// ── La production ───────────────────────────────────────────────────────────────────

async function duree(fichier) {
  const { stdout } = await executer('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', fichier]);
  return Number(stdout.trim());
}

/** Sans ffmpeg on ne dérive rien — et le dire avant de lancer une génération de plusieurs minutes. */
export async function verifierOutils() {
  for (const outil of ['ffmpeg', 'ffprobe']) {
    try {
      await executer(outil, ['-version']);
    } catch {
      throw new Error(`${outil} est introuvable — l'installer (brew install ffmpeg) avant de produire quoi que ce soit.`);
    }
  }
}

/**
 * Produit l'audio d'une fiche, dans sa voix, et met l'index à jour.
 *
 * Phrase par phrase : chaque morceau est généré, débarrassé de ses blancs de début et de
 * fin, puis assemblé avec les pauses du tableau `PAUSES`. L'allure de la voix et le volume
 * sont appliqués une seule fois, sur la fiche entière. Les chapitres tombent du calcul :
 * on sait à quelle seconde commence chaque morceau, donc chaque ligne lue.
 *
 * Idempotent : une fiche à jour n'est pas refaite, sauf `force`. Rien n'est écrit dans
 * l'index tant que le master et le dérivé ne sont pas complets.
 */
/**
 * La part déjà en ligne d'une entrée de l'index — ses voix téléversées — ou, si elle n'en
 * a aucune, ce qu'elle gardait elle-même de la production d'avant. `undefined` si rien.
 */
export function publieeDans(entree) {
  if (!entree) return undefined;
  const enLigne = Object.entries(entree.voix ?? {}).filter(([, v]) => v.r2?.sha256 === v.sha256);
  if (!enLigne.length) return entree.precedente;
  return { voix_attribuee: entree.voix_attribuee ?? null, voix: Object.fromEntries(enLigne) };
}

export async function sonoriser(fiche, { ctx, force = false, journal = () => {} } = {}) {
  exigerContexte(ctx);
  if (SANS_ECOUTE.has(fiche.discipline)) throw new Error(`${fiche.id} : discipline sans écoute (${fiche.discipline}), jamais sonorisée`);
  await verifierOutils();
  const version = await moteurLocal.sante();
  await mkdir(MASTERS, { recursive: true });
  await mkdir(DERIVES, { recursive: true });

  const index = await lireIndex();
  if (!force && !aSonoriser(fiche, index, ctx)) return index[fiche.id];
  const voix = attribuerVoix(fiche, index, ctx.voix);
  if (!voix.empreinte) throw new Error(`référence de la voix « ${voix.nom} » introuvable (${voix.refWav})`);

  const parts = morceaux(fiche, ctx.regles);
  const tmp = await mkdtemp(path.join(os.tmpdir(), `sonoriser-${fiche.id}-`));
  try {
    // 1. Chaque morceau, généré puis rogné de ses blancs : la pause, c'est nous.
    const nets = [];
    for (const [k, p] of parts.entries()) {
      const brut = path.join(tmp, `${k}.brut.wav`);
      const net = path.join(tmp, `${k}.wav`);
      await writeFile(brut, await moteurLocal.generer(p.texte, voix));
      await executer('ffmpeg', ['-loglevel', 'error', '-y', '-i', brut, '-af',
        'silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.05,areverse,silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.08,areverse',
        '-ac', '1', '-ar', '24000', net]);
      const d = await duree(net);
      // Une phrase rognée jusqu'au vide décalerait tous les repères suivants sans bruit.
      if (!(d > 0)) throw new Error(`morceau ${k + 1} vide après génération : « ${p.texte.slice(0, 60)} »`);
      nets.push({ ...p, fichier: net, duree: d });
      journal(`    ${k + 1}/${parts.length}`);
    }

    // 2. L'assemblage, pauses comprises. Les silences passent par l'étirement avec le
    //    reste : on les allonge d'autant pour qu'ils durent ce qu'on entend dans l'app.
    const liste = [];
    const debutsDeLigne = new Map();
    let t = 0;
    for (const [k, n] of nets.entries()) {
      if (k > 0) {
        const pause = pauseEntre(nets[k - 1], n) * voix.allure;
        const silence = path.join(tmp, `silence-${pause.toFixed(3)}.wav`);
        if (!existsSync(silence)) await executer('ffmpeg', ['-loglevel', 'error', '-y', '-f', 'lavfi', '-i', 'anullsrc=r=24000:cl=mono', '-t', pause.toFixed(3), silence]);
        liste.push(silence);
        t += pause;
      }
      if (!debutsDeLigne.has(n.ligne)) debutsDeLigne.set(n.ligne, t);
      liste.push(n.fichier);
      t += n.duree;
    }
    const listeTxt = path.join(tmp, 'liste.txt');
    await writeFile(listeTxt, liste.map((f) => `file '${f.replace(/'/g, "'\\''")}'`).join('\n'));
    const assemble = path.join(tmp, 'assemble.wav');
    await executer('ffmpeg', ['-loglevel', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', listeTxt, '-ac', '1', assemble]);

    // 3. Master (podcast) puis dérivé (app), à l'allure de la voix, volume normalisé.
    //    Le dérivé est nommé par son empreinte, jamais par la voix : son nom devient l'URL
    //    publiée et la clé R2. Le nom d'une voix n'en sort donc pas, et une fiche refaite
    //    n'écrase jamais le fichier que le manifeste déjà déployé désigne encore.
    const masterTmp = path.join(tmp, 'master.mp3');
    const deriveTmp = path.join(tmp, 'derive.m4a');
    await executer('ffmpeg', ['-loglevel', 'error', '-y', '-i', assemble, '-filter:a', `atempo=${voix.allure},${VOLUME}`,
      '-ar', '44100', '-c:a', 'libmp3lame', '-b:a', '128k', '-ac', '1', masterTmp]);
    await executer('ffmpeg', ['-loglevel', 'error', '-y', '-i', masterTmp, '-ac', '1', '-c:a', 'aac', '-b:a', '32k', deriveTmp]);
    const contenu = await readFile(deriveTmp);
    const sha256 = createHash('sha256').update(contenu).digest('hex');
    const master = path.join(MASTERS, `${fiche.id}.mp3`);
    const derive = path.join(DERIVES, `${fiche.id}--${sha256.slice(0, 16)}.m4a`);
    await copyFile(masterTmp, master);
    await copyFile(deriveTmp, derive);

    // 4. Les chapitres : un par ligne lue, au début de son premier morceau, à l'allure de
    //    la voix. Libellés pris dans le texte lu, jamais dans le texte réécrit.
    const lues = lignesLues(fiche);
    const chapitres = lues.map((l, i) => ({
      debut: Math.round(((debutsDeLigne.get(i) ?? 0) / voix.allure) * 100) / 100, texte: l.texte.slice(0, 70) }));

    const entree = {
      empreinte: empreinteAudio(fiche, ctx.regles),
      empreinte_texte: empreinteAudio(fiche),
      moteur: MOTEUR,
      modele: MODELE,
      poids: ctx.poids,
      moteur_version: version,
      reglages: REGLAGES,
      voix_attribuee: voix.nom,
      reference: voix.empreinte,
      allure: voix.allure,
      caracteres: aLire(fiche).length,
      produit_le: new Date().toISOString(),
      voix: {
        [voix.nom]: {
          fichier: path.basename(derive),
          genre: voix.genre,
          affiche: voix.affiche,
          sha256,
          octets: contenu.length,
          // Un entier : les deux apps décodent `secondes` en Int et rejettent la fiche sinon.
          secondes: Math.round(await duree(derive)),
          chapitres,
        },
      },
    };
    // Relire l'index juste avant d'écrire : une autre fiche a pu être produite entre-temps.
    const aJour = await lireIndex();
    // Ce qui était en ligne reste publié tant que le nouveau fichier n'est pas téléversé :
    // entre la production et `heberger`, la fiche garde son ancien son au lieu de se taire.
    const precedente = publieeDans(aJour[fiche.id]);
    if (precedente) entree.precedente = precedente;
    aJour[fiche.id] = entree;
    await ecrireIndex(aJour);
    return entree;
  } finally {
    await rm(tmp, { recursive: true, force: true });
  }
}

export function afficher(f) {
  const t = (s) => process.stdout.write(`${s}\n`);
  t('');
  t(`  fiches publiables     ${f.publiables}`);
  t(`  déjà sonorisées       ${f.sonorisees}`);
  t('');
  if (!f.sonoriser) {
    t('  RIEN À FAIRE — chaque fiche publiable a son audio à jour.');
    t('');
    return;
  }
  t(`  SONORISER  ${f.toutes.length} fiche(s), environ ${f.heures} h de génération sur le Mac mini`);
  t('');
  for (const { fiche, motif: m } of f.lot) {
    t(`    ${fiche.id}`);
    t(`      ${aLire(fiche).length} caractères · ${m}`);
  }
  if (f.restant) t(`    … et ${f.restant} de plus.`);
  t('');
}
