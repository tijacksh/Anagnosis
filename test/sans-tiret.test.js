import test from 'node:test';
import assert from 'node:assert/strict';
import { sansTiret } from '../src/sans-tiret.js';

const T = '—';

test('une explication devient deux-points', () => {
  assert.equal(sansTiret(`Cela n'a jamais eu lieu ${T} elle sort d'un roman.`), "Cela n'a jamais eu lieu : elle sort d'un roman.");
});
test('une suite de phrase devient virgule', () => {
  assert.equal(sansTiret(`Il part ${T} et revient.`), 'Il part, et revient.');
});
test('une incise courte prend des virgules, une longue des parenthèses', () => {
  assert.equal(sansTiret(`Trois doigts ${T} ceux de la bénédiction ${T} sont tranchés.`), 'Trois doigts, ceux de la bénédiction, sont tranchés.');
  assert.equal(sansTiret(`Un bulbe ${T} une variété striée, obtenue par un virus ${T} s'échange cher.`), "Un bulbe (une variété striée, obtenue par un virus) s'échange cher.");
});
test('citations et répliques restent intactes', () => {
  assert.equal(sansTiret(`Il cite « a ${T} b » puis conclut ${T} fin.`), 'Il cite « a — b » puis conclut : fin.');
  assert.equal(sansTiret(`${T} Bonjour, dit-il.`), `${T} Bonjour, dit-il.`);
});
