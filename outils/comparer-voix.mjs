#!/usr/bin/env node
/**
 * Fabrique la même fiche chez plusieurs fournisseurs de synthèse, pour juger à l'oreille.
 *
 *     node outils/comparer-voix.mjs <id-de-fiche>
 *     node outils/comparer-voix.mjs phy-effet-doppler
 *
 * **Pourquoi un outil et pas un choix sur dossier.** Les comparatifs 2026 donnent
 * ElevenLabs et OpenAI à égalité sur le naturel, et Azure à quinze pour cent derrière.
 * Ces classements portent sur de la voix d'agent conversationnel ; nous lisons du texte
 * d'exposition en français, avec des noms propres allemands et des dates. Rien ne dit que
 * l'ordre tient sur notre matière. Une fiche réelle passée chez les trois tranche en trois
 * minutes ce qu'aucune lecture de tableau ne tranchera.
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
    variantes: ['onyx', 'nova'],
    async fabriquer(texte, voix, cle) {
      const r = await fetch('https://api.openai.com/v1/audio/speech', {
        method: 'POST',
        headers: { authorization: `Bearer ${cle}`, 'content-type': 'application/json' },
        body: JSON.stringify({ model: 'tts-1-hd', voice: voix, input: texte, speed: 0.95 }),
      });
      if (!r.ok) throw new Error(`OpenAI ${r.status} — ${(await r.text()).slice(0, 200)}`);
      return Buffer.from(await r.arrayBuffer());
    },
  },

  /** ElevenLabs, multilingual v2. Facturé en crédits, ~2 caractères le crédit. */
  elevenlabs: {
    cle: 'ELEVENLABS_API_KEY',
    extension: 'mp3',
    // Identifiants publics de voix de la bibliothèque partagée.
    variantes: ['pNInz6obpgDQGcFmaJgB', 'EXAVITQu4vr4xnSDxMaL'],
    async fabriquer(texte, voix, cle) {
      const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voix}`, {
        method: 'POST',
        headers: { 'xi-api-key': cle, 'content-type': 'application/json' },
        body: JSON.stringify({ text: texte, model_id: 'eleven_multilingual_v2' }),
      });
      if (!r.ok) throw new Error(`ElevenLabs ${r.status} — ${(await r.text()).slice(0, 200)}`);
      return Buffer.from(await r.arrayBuffer());
    },
  },

  /** Azure Neural HD. Le moins cher des trois. */
  azure: {
    cle: 'AZURE_SPEECH_KEY',
    extension: 'mp3',
    variantes: ['fr-FR-HenriNeural', 'fr-FR-DeniseNeural'],
    async fabriquer(texte, voix, cle) {
      const region = process.env.AZURE_SPEECH_REGION;
      if (!region) throw new Error('AZURE_SPEECH_REGION manquante');
      // Le texte passe en SSML : il faut échapper, sinon une esperluette casse la requête.
      const echappe = texte
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      const ssml = `<speak version="1.0" xml:lang="fr-FR">`
        + `<voice name="${voix}"><prosody rate="-5%">${echappe}</prosody></voice></speak>`;
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
  for (const voix of f.variantes) {
    const cible = path.join(SORTIE, `${id}--${nom}--${voix.slice(0, 12)}.${f.extension}`);
    try {
      const octets = await f.fabriquer(texte, voix, process.env[f.cle]);
      await writeFile(cible, octets);
      console.log(`  ✓ ${nom.padEnd(11)} ${voix.padEnd(22)} ${(octets.length / 1024).toFixed(0)} Ko`);
    } catch (e) {
      // Un fournisseur en échec n'arrête pas les autres : le but est d'écouter ce qu'on a.
      console.log(`  ✗ ${nom.padEnd(11)} ${voix.padEnd(22)} ${e.message}`);
    }
  }
}

console.log(`\n  Fichiers dans ${SORTIE}/ — écouter avant de choisir.\n`);
