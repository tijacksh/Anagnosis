/**
 * Ce qui empêche une fiche juridique de mentir en silence.
 *
 * Le contrôle ordinaire (`src/controle.js`) se déclenche sur l'empreinte du texte. Une
 * fiche de droit peut devenir fausse **sans qu'un caractère n'ait bougé** : la règle
 * qu'elle décrit est modifiée, ou elle décrivait le droit d'un seul pays sans le dire.
 * L'empreinte est restée identique tout du long, et le contrôle la trouve conforme — à
 * juste titre, puisqu'il compare la fiche à sa source et que la source n'a pas changé.
 *
 * Ces tests verrouillent le seul mécanisme qui rattrape ce cas : une file qui regarde
 * l'âge de la vérification, pas le contenu.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { aRevoir, motif, MOIS_VALIDITE, DISCIPLINES_JURIDIQUES } from '../src/droit.js';

const LE_JOUR = new Date('2026-08-16');

function fiche(modifs = {}) {
  return { id: 'dro-test', statut: 'valide', discipline: 'droit', titre: 'T', ...modifs };
}

test('une fiche juridique jamais revue est dans la file', () => {
  assert.equal(aRevoir(fiche(), LE_JOUR), true);
  assert.equal(motif(fiche()), 'jamais revue');
});

test('une fiche revue hier n’y est pas', () => {
  const f = fiche({ controle_juridique: { fait_le: '2026-08-15', verdict: 'ok', notes: [] } });
  assert.equal(aRevoir(f, LE_JOUR), false);
});

test('une fiche revue il y a plus de six mois y revient seule', () => {
  // Le cœur du fichier. Rien n'a bougé dans la fiche, et c'est précisément pour ça
  // qu'aucune autre file ne la reprendrait.
  const f = fiche({ controle_juridique: { fait_le: '2026-01-01', verdict: 'ok', notes: [] } });
  assert.equal(aRevoir(f, LE_JOUR), true);
  assert.match(motif(f), /2026-01-01/);
});

test('la bascule tombe bien à six mois', () => {
  const juste = fiche({ controle_juridique: { fait_le: '2026-02-17', verdict: 'ok', notes: [] } });
  const trop = fiche({ controle_juridique: { fait_le: '2026-02-15', verdict: 'ok', notes: [] } });
  assert.equal(MOIS_VALIDITE, 6);
  assert.equal(aRevoir(juste, LE_JOUR), false);
  assert.equal(aRevoir(trop, LE_JOUR), true);
});

test('les autres disciplines n’entrent jamais dans cette file', () => {
  // Sans ce filtre, la routine juridique rouvrirait tout le corpus tous les six mois.
  for (const d of ['physique', 'histoire', 'sociologie', 'sciences_politiques']) {
    assert.equal(aRevoir(fiche({ discipline: d }), LE_JOUR), false, d);
  }
  assert.equal(DISCIPLINES_JURIDIQUES.has('droit'), true);
});

test('une fiche rejetée ne coûte pas une vérification', () => {
  assert.equal(aRevoir(fiche({ statut: 'rejete' }), LE_JOUR), false);
});

test('la revue juridique ne porte pas d’empreinte', async () => {
  // Volontaire, et c'est la différence de fond avec `controle` : horodater le texte
  // ferait qu'une fiche jamais retouchée ne repasserait jamais — le cas même qu'on veut
  // attraper. On horodate la vérification.
  const { marquer } = await import('../src/droit.js');
  assert.equal(typeof marquer, 'function');
  const src = await import('node:fs/promises')
    .then((fs) => fs.readFile(new URL('../src/droit.js', import.meta.url), 'utf8'));
  assert.equal(/empreinte:/.test(src), false);
});
