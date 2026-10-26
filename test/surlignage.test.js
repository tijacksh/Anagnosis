// Le surlignage par phrase : le pipeline publie, pour chaque bloc affiché, où commence chaque
// phrase dans le texte que l'app montre (`src/surlignage.js`). Le client ne fait que lire —
// tout ce qui pourrait tomber à côté se vérifie donc ici, sur le corpus réel.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { loadAll } from '../src/store.js';
import { morceaux } from '../src/audio.js';
import { phrases, bornesPhrases } from '../src/prononciation.js';
import { texteAffiche, blocsAffiches, phrasesParBloc } from '../src/surlignage.js';

const DORE = JSON.parse(await readFile(new URL('./fixtures/surlignage-dore.json', import.meta.url), 'utf8'));
const publiables = async () => (await loadAll()).filter((f) => ['valide', 'publie'].includes(f.statut));

test('le texte affiché suit MarkdownLeger, cas par cas (jeu doré partagé avec les apps)', () => {
  for (const { source, blocs } of DORE.blocs) {
    assert.deepEqual(blocsAffiches(source).map(({ intertitre, texte }) => ({ intertitre, texte })), blocs, source);
  }
  // Ce que le pipeline retire et que l'app garde : c'est tout l'objet de la projection.
  assert.equal(texteAffiche('le `login` et *l’ouvrage*'), 'le `login` et l’ouvrage');
  assert.equal(texteAffiche('5 * 3 = 15'), '5 * 3 = 15');
  assert.equal(texteAffiche('**gras *dedans* encore**'), 'gras *dedans* encore');
  // Un astérisque suivi d'un accent combinant forme un seul caractère pour Swift : pas une marque.
  assert.equal(texteAffiche('a *\u0301b* c'), 'a *\u0301b* c');
});

test('bornesPhrases coupe exactement où phrases() coupe, sur tout le corpus', async () => {
  const fautes = [];
  for (const f of await publiables()) {
    for (const ligne of (f.contenu_vulgarise ?? '').split('\n')) {
      const t = ligne.replace(/^##\s*/, '').replace(/[*_`]/g, '').trim();
      if (!t) continue;
      const ps = phrases(t);
      const bs = bornesPhrases(t);
      const recousues = bs.map((b, i) => t.slice(b, bs[i + 1] ?? t.length).trim().replace(/\s+/g, ' '));
      if (JSON.stringify(recousues) !== JSON.stringify(ps.map((p) => p.replace(/\s+/g, ' ')))) fautes.push(f.id);
    }
  }
  assert.deepEqual(fautes, []);
});

test('chaque phrase lue se projette sur le texte affiché, sur tout le corpus', async () => {
  // Des débuts fictifs, un par morceau : seule la projection est éprouvée ici. Une fiche qui
  // ne s'aligne pas garde le suivi par paragraphe — c'est le repli voulu, pas une panne : le
  // test ne bloque donc pas la publication pour une fiche isolée (la tâche de nuit en dépend),
  // seulement si le repli devenait la règle.
  const fiches = await publiables();
  const repli = [];
  const fautes = [];
  for (const f of fiches) {
    const r = phrasesParBloc(f, morceaux(f).map((_, i) => i * 2));
    if (!r) { repli.push(f.id); continue; }
    const blocs = blocsAffiches(f.contenu_vulgarise);
    if (r.length !== blocs.length) fautes.push(`${f.id} : ${r.length} pour ${blocs.length} blocs`);
    r.forEach(({ decalages }, i) => decalages.forEach((d, k) => {
      if (k === 0 ? d !== 0 : !/\s/.test(blocs[i].texte[d - 1])) fautes.push(`${f.id} : bloc ${i}, phrase ${k}`);
    }));
  }
  if (repli.length) console.warn(`surlignage par paragraphe seulement : ${repli.join(', ')}`);
  assert.deepEqual(fautes, []);
  assert.ok(repli.length <= fiches.length * 0.01, `${repli.length} fiches sans surlignage par phrase`);
});

test('une fiche qui ne s’aligne pas n’a aucun repère de phrase, plutôt que des faux', () => {
  const fiche = { titre: 'T', contenu_vulgarise: 'Une phrase. Une autre.', repere: { texte: 'R' } };
  // Titre, deux phrases, repère : quatre morceaux. Trois débuts ne décrivent pas cette fiche.
  assert.equal(phrasesParBloc(fiche, [0, 1, 2]), undefined);
  assert.deepEqual(phrasesParBloc(fiche, [0, 1, 3, 5]), [{ debuts: [1, 3], decalages: [0, 12] }]);
});

test('les phrases publiées commencent avec leur bloc et ne reculent jamais', async () => {
  const { fichesPubliables } = await import('../src/publier.js');
  const fautes = [];
  for (const f of await fichesPubliables()) {
    const l = f.audio?.lecture;
    if (!l?.phrases) continue;
    if (f.audio.helene?.phrases || f.audio.jerome?.phrases) fautes.push(`${f.id} : phrases hors de lecture`);
    l.phrases.forEach((p, i) => {
      if (Math.abs(p.debuts[0] - l.reperes[i]) > 0.1) fautes.push(`${f.id} : bloc ${i} ne commence pas avec son repère`);
      if (p.debuts.some((t, k) => k && t <= p.debuts[k - 1])) fautes.push(`${f.id} : bloc ${i} recule`);
      if (p.debuts.at(-1) > l.secondes + 1) fautes.push(`${f.id} : bloc ${i} au-delà du son`);
    });
  }
  assert.deepEqual(fautes, []);
});
