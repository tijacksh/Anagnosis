/**
 * Le moteur de voix local : l'API HTTP de VoiceStudio, qui sert OmniVoice sur le Mac mini.
 *
 * VoiceStudio tourne à part (application installée, `docs/passation-audio.md`) ; le
 * pipeline ne fait que l'appeler. Aucune dépendance : `node:http` et les primitives de
 * Node.
 *
 * **Pourquoi pas `fetch`.** Son client abandonne toute réponse dont les en-têtes tardent
 * plus de 300 s ; une génération longue, ou une machine chargée, dépasse ce délai, et la
 * requête meurt alors que VoiceStudio continue de calculer dans le vide. `node:http` n'a
 * pas cette limite.
 */
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

export const URL_ENV = 'VOICESTUDIO_URL';
export const API = () => process.env[URL_ENV] ?? 'http://127.0.0.1:3900';

/** Le dépôt Hugging Face des poids d'OmniVoice — ceux que VoiceStudio charge. */
export const DEPOT_POIDS = 'k2-fsa/OmniVoice';

function requete(methode, chemin, { corps, entetes = {}, delai = 0 } = {}) {
  return new Promise((ok, ko) => {
    const req = http.request(`${API()}${chemin}`, { method: methode, headers: entetes }, (res) => {
      const morceaux = [];
      res.on('data', (m) => morceaux.push(m));
      res.on('end', () => ok({ statut: res.statusCode, type: res.headers['content-type'] ?? '', octets: Buffer.concat(morceaux) }));
      res.on('error', ko);
    });
    if (delai) req.setTimeout(delai, () => req.destroy(new Error(`pas de réponse en ${delai / 1000} s`)));
    req.on('error', ko);
    req.end(corps);
  });
}

/** VoiceStudio répond-il ? Renvoie sa version, ou lève une erreur qui dit quoi faire. */
export async function sante() {
  let r;
  try {
    r = await requete('GET', '/health', { delai: 10_000 });
  } catch (e) {
    throw new Error(`VoiceStudio injoignable sur ${API()} (${e.message}) — l'ouvrir (open -g /Applications/VoiceStudio.app) avant de sonoriser.`);
  }
  if (r.statut !== 200) throw new Error(`VoiceStudio répond ${r.statut} sur /health`);
  return JSON.parse(r.octets.toString()).version ?? 'inconnue';
}

/**
 * Une phrase, dans une voix clonée. Renvoie le WAV tel que VoiceStudio le produit.
 *
 * `effect_preset=raw` : aucun traitement ajouté (le volume est normalisé ensuite, une fois,
 * sur la fiche entière). `pronounce=false` : pas le dictionnaire global de VoiceStudio, qui
 * changerait la prononciation sans que l'empreinte le sache — le seul dictionnaire est
 * `audio/prononciations.json`. Graine fixe : deux rendus du même texte se ressemblent.
 */
export async function generer(texte, { refWav, refTxt }) {
  const form = new FormData();
  const champs = { text: texte, language: 'French', engine: 'omnivoice', effect_preset: 'raw', pronounce: 'false', seed: '42' };
  for (const [k, v] of Object.entries(champs)) form.set(k, v);
  form.set('ref_audio', new Blob([await readFile(refWav)]), 'reference.wav');
  form.set('ref_text', (await readFile(refTxt, 'utf8')).trim());
  // FormData sait sérialiser le multipart ; on lui emprunte le corps et son en-tête.
  const enveloppe = new Request(`${API()}/generate`, { method: 'POST', body: form });
  const corps = Buffer.from(await enveloppe.arrayBuffer());
  // Une phrase prend quelques secondes, une minute sur une machine en swap. Au-delà de dix,
  // VoiceStudio est bloqué : mieux vaut perdre la fiche que tenir la nuit entière.
  const r = await requete('POST', '/generate', {
    delai: 600_000, corps, entetes: { 'content-type': enveloppe.headers.get('content-type'), 'content-length': corps.length },
  });
  if (r.statut !== 200) throw new Error(`VoiceStudio ${r.statut} — ${r.octets.toString().slice(0, 300)}`);
  if (r.type.includes('json')) throw new Error(`VoiceStudio a répondu du JSON au lieu d'audio : ${r.octets.toString().slice(0, 300)}`);
  return r.octets;
}

/**
 * Décharge OmniVoice de VoiceStudio — et lui seul.
 *
 * Règle d'atelier : VoiceStudio partage la machine (Jarvis s'en sert la nuit, d'autres
 * travaux le jour) ; on ne garde aucun modèle en mémoire hors d'une production. Les
 * moteurs des autres (VoxCPM2 pour Jarvis) ne sont pas les nôtres : on n'y touche pas. Il se
 * recharge seul au premier appel suivant. Ne lève jamais : un échec de déchargement ne
 * doit pas masquer l'erreur qui a interrompu la production.
 */
export async function decharger() {
  try {
    const r = await requete('GET', '/model/loaded', { delai: 10_000 });
    const { models = [] } = JSON.parse(r.octets.toString());
    for (const m of models.filter((x) => x.unloadable && /omnivoice/i.test(`${x.engine_id ?? ''} ${x.id ?? ''}`))) {
      await requete('POST', `/model/unload/${encodeURIComponent(m.id)}`, { delai: 30_000 });
    }
    return models.length;
  } catch {
    return 0;
  }
}

/**
 * L'empreinte des poids qu'OmniVoice charge : la révision Hugging Face du dépôt en cache.
 *
 * C'est ce qui rend visible un changement de modèle : si VoiceStudio télécharge une
 * nouvelle révision, chaque fiche produite avec l'ancienne repasse en production, au lieu
 * de mélanger en silence deux rendus de voix dans le catalogue. Sans révision lisible, on
 * refuse de produire : un audio dont on ne sait pas de quels poids il sort ne se range pas.
 */
export async function revisionPoids() {
  const racine = process.env.HF_HUB_CACHE ?? path.join(process.env.HF_HOME ?? path.join(os.homedir(), '.cache', 'huggingface'), 'hub');
  const fichier = path.join(racine, `models--${DEPOT_POIDS.replace('/', '--')}`, 'refs', 'main');
  if (!existsSync(fichier)) throw new Error(`poids d'OmniVoice introuvables (${fichier}) — le cache Hugging Face est-il monté ?`);
  const rev = (await readFile(fichier, 'utf8')).trim();
  if (!/^[0-9a-f]{40}$/.test(rev)) throw new Error(`révision des poids illisible : « ${rev} »`);
  return rev.slice(0, 12);
}
