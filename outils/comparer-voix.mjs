#!/usr/bin/env node
/**
 * Fabrique la même fiche chez plusieurs fournisseurs de synthèse, pour juger à l'oreille.
 *
 *     node outils/comparer-voix.mjs <id-de-fiche>
 *     node outils/comparer-voix.mjs phy-effet-doppler
 *
 * **Pourquoi un outil et pas un choix sur dossier.** Les classements publics — l'arène
 * Artificial Analysis en tête — font voter des auditeurs **en anglais**, sur des extraits
 * d'agent conversationnel. Nous lisons du texte d'exposition **en français**, avec 832 noms
 * propres distincts sur l'ensemble du corpus : Doppler, Whorf, Boas, Eichmann, Ockham. Rien
 * ne garantit que l'ordre du classement tienne sur cette matière-là. Une fiche réelle passée
 * chez chacun tranche en trois minutes ce qu'aucune lecture de tableau ne tranchera.
 *
 * Le critère qui élimine n'est d'ailleurs pas le naturel mais la **prononciation dirigeable** :
 * une voix qui dit « Doppleur » discrédite une fiche dont tout le propos est l'exactitude.
 * OpenAI n'offre aucun moyen de figer une prononciation — il est ici comme témoin, pas comme
 * candidat.
 *
 * Les clés viennent de l'environnement et **n'entrent jamais dans le dépôt** — même règle
 * que la clé de signature :
 *
 *     export OPENAI_API_KEY=…        # TTS-1-HD
 *     export ELEVENLABS_API_KEY=…    # multilingual v2
 *     export AZURE_SPEECH_KEY=…      # + AZURE_SPEECH_REGION
 *
 * Seuls les fournisseurs dont la clé est présente sont appelés. Les fichiers sortent dans
 * `comparaison-voix/`, qui est ignoré par git.
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { loadAll } from '../src/store.js';

const SORTIE = 'comparaison-voix';

/**
 * Le texte réellement prononcé — **le même que celui de l'app**.
 *
 * Comparer sur un extrait choisi à la main donnerait un résultat sans rapport avec ce
 * qu'entendra le lecteur : c'est justement sur les enchaînements, les noms propres et les
 * dates que les voix se séparent.
 */
function aLire(fiche) {
  const morceaux = [fiche.titre];
  for (const ligne of (fiche.contenu_vulgarise ?? '').split('\n')) {
    const nette = ligne.replace(/^##\s*/, '').replace(/\*\*/g, '').trim();
    if (nette) morceaux.push(nette);
  }
  if (fiche.citation) {
    morceaux.push(`Citation. ${fiche.citation.texte} ${fiche.citation.auteur}.`);
  } else if (fiche.repere) {
    morceaux.push(fiche.repere.texte);
  }
  return morceaux.join('\n\n');
}

const FOURNISSEURS = {
  /** OpenAI TTS-1-HD. ~30 $ le million de caractères. */
  openai: {
    cle: 'OPENAI_API_KEY',
    extension: 'mp3',
    // Deux voix à écouter : elles ne se ressemblent pas sur du texte long.
    variantes: [{ id: 'onyx', voix: 'onyx' }, { id: 'nova', voix: 'nova' }],
    async fabriquer(texte, v, cle) {
      const r = await fetch('https://api.openai.com/v1/audio/speech', {
        method: 'POST',
        headers: { authorization: `Bearer ${cle}`, 'content-type': 'application/json' },
        body: JSON.stringify({ model: 'tts-1-hd', voice: v.voix, input: texte, speed: 0.95 }),
      });
      if (!r.ok) throw new Error(`OpenAI ${r.status} — ${(await r.text()).slice(0, 200)}`);
      return Buffer.from(await r.arrayBuffer());
    },
  },

  /**
   * ElevenLabs, sur **deux modèles à la fois**.
   *
   * `eleven_v3` est le plus expressif et le seul à honorer un dictionnaire de prononciation
   * IPA — ce qui compte ici, parce que le corpus fait prononcer 832 noms propres distincts.
   * En échange il ne sait pas recoudre la prosodie entre deux requêtes. Ça ne nous coûte
   * rien : sa limite est de 5 000 caractères et notre fiche la plus longue en fait 3 874,
   * donc une fiche tient toujours en une requête.
   *
   * `eleven_multilingual_v2` est annoncé comme le plus stable sur le format long. On écoute
   * les deux plutôt que de croire l'argumentaire.
   */
  elevenlabs: {
    cle: 'ELEVENLABS_API_KEY',
    extension: 'mp3',
    // Les identifiants de voix ne sont pas stables dans le temps : on les demande au
    // compte plutôt que de les figer ici, où ils pourrissent en silence.
    async variantes(cle) {
      const r = await fetch('https://api.elevenlabs.io/v1/voices', { headers: { 'xi-api-key': cle } });
      if (!r.ok) throw new Error(`liste des voix ${r.status} — ${(await r.text()).slice(0, 200)}`);
      const { voices = [] } = await r.json();
      // Une voix d'homme et une de femme, en préférant celles annoncées pour le français.
      const parle = (v) => /french|français/i.test(JSON.stringify(v.labels ?? {}) + (v.description ?? ''));
      const choisir = (genre) => {
        const duGenre = voices.filter((v) => v.labels?.gender === genre);
        return duGenre.find(parle) ?? duGenre[0];
      };
      const retenues = [choisir('male'), choisir('female')].filter(Boolean);
      if (!retenues.length) throw new Error('aucune voix sur ce compte');
      return retenues.flatMap((v) => ['eleven_v3', 'eleven_multilingual_v2'].map((modele) => ({
        id: `${v.name}-${modele.replace('eleven_', '')}`, voix: v.voice_id, modele,
      })));
    },
    async fabriquer(texte, v, cle) {
      const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${v.voix}`, {
        method: 'POST',
        headers: { 'xi-api-key': cle, 'content-type': 'application/json' },
        body: JSON.stringify({ text: texte, model_id: v.modele }),
      });
      if (!r.ok) throw new Error(`ElevenLabs ${r.status} — ${(await r.text()).slice(0, 200)}`);
      return Buffer.from(await r.arrayBuffer());
    },
  },

  /** Azure Neural HD. Le moins cher des trois. */
  azure: {
    cle: 'AZURE_SPEECH_KEY',
    extension: 'mp3',
    variantes: [{ id: 'HenriNeural', voix: 'fr-FR-HenriNeural' },
                { id: 'DeniseNeural', voix: 'fr-FR-DeniseNeural' }],
    async fabriquer(texte, v, cle) {
      const region = process.env.AZURE_SPEECH_REGION;
      if (!region) throw new Error('AZURE_SPEECH_REGION manquante');
      // Le texte passe en SSML : il faut échapper, sinon une esperluette casse la requête.
      const echappe = texte
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      const ssml = `<speak version="1.0" xml:lang="fr-FR">`
        + `<voice name="${v.voix}"><prosody rate="-5%">${echappe}</prosody></voice></speak>`;
      const r = await fetch(
        `https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`, {
          method: 'POST',
          headers: {
            'ocp-apim-subscription-key': cle,
            'content-type': 'application/ssml+xml',
            'x-microsoft-outputformat': 'audio-24khz-96kbitrate-mono-mp3',
          },
          body: ssml,
        });
      if (!r.ok) throw new Error(`Azure ${r.status} — ${(await r.text()).slice(0, 200)}`);
      return Buffer.from(await r.arrayBuffer());
    },
  },
};

const id = process.argv[2];
if (!id) {
  console.error('Usage : node outils/comparer-voix.mjs <id-de-fiche>');
  process.exit(2);
}

const fiche = (await loadAll()).find((f) => f.id === id);
if (!fiche) {
  console.error(`Fiche introuvable : ${id}`);
  process.exit(1);
}

const texte = aLire(fiche);
await mkdir(SORTIE, { recursive: true });
await writeFile(path.join(SORTIE, `${id}.txt`), texte, 'utf8');

console.log(`\n  ${fiche.titre}`);
console.log(`  ${texte.length} caractères\n`);

const presents = Object.entries(FOURNISSEURS).filter(([, f]) => process.env[f.cle]);
if (!presents.length) {
  console.error('  Aucune clé dans l\'environnement. Renseigner au moins :');
  for (const [nom, f] of Object.entries(FOURNISSEURS)) console.error(`    ${f.cle}   (${nom})`);
  process.exit(1);
}

for (const [nom, f] of presents) {
  const cle = process.env[f.cle];

  // Certains fournisseurs demandent au compte quelles voix il a : cet appel peut échouer
  // seul (clé sans le bon périmètre, par exemple) sans que ça condamne les autres.
  let variantes;
  try {
    variantes = typeof f.variantes === 'function' ? await f.variantes(cle) : f.variantes;
  } catch (e) {
    console.log(`  ✗ ${nom.padEnd(11)} ${''.padEnd(26)} ${e.message}`);
    continue;
  }

  for (const v of variantes) {
    const cible = path.join(SORTIE, `${id}--${nom}--${v.id}.${f.extension}`);
    try {
      const octets = await f.fabriquer(texte, v, cle);
      await writeFile(cible, octets);
      console.log(`  ✓ ${nom.padEnd(11)} ${v.id.padEnd(26)} ${(octets.length / 1024).toFixed(0)} Ko`);
    } catch (e) {
      // Un fournisseur en échec n'arrête pas les autres : le but est d'écouter ce qu'on a.
      console.log(`  ✗ ${nom.padEnd(11)} ${v.id.padEnd(26)} ${e.message}`);
    }
  }
}

console.log(`\n  Fichiers dans ${SORTIE}/ — écouter avant de choisir.\n`);
