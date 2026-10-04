import { test } from 'node:test';
import assert from 'node:assert/strict';
import { chercher, estDoublon, lireIdees, doublonsDuCorpus } from '../src/existe.js';

const fiches = [
  { id: 'rel-linceul', slug: 'linceul-turin-datation-1389', titre: 'Le linceul de Turin : une datation médiévale', statut: 'valide', sources: [{ url: 'https://www.nature.com/articles/x' }] },
  { id: 'his-nika', slug: 'revolte-nika', titre: 'La révolte Nika', statut: 'brouillon', sources: [] },
];

test('un sujet déjà traité est un doublon, même reformulé', () => {
  const t = chercher('datation du linceul de Turin', { fiches });
  assert.ok(estDoublon(t[0]));
  assert.equal(t[0].id, 'rel-linceul');
});

test('un sujet libre ne ressort pas', () => {
  assert.equal(chercher('transformée de Fourier', { fiches }).length, 0);
});

test('une même source trahit un doublon même sous un autre titre', () => {
  const t = chercher('radiocarbone', { fiches, url: 'http://nature.com/articles/x#abstract' });
  assert.equal(t[0].raison, 'même source');
});

test('les idées « en cours » comptent aussi', () => {
  const idees = lireIdees('| Discipline | Thème | Statut | Qui | Date |\n|---|---|---|---|---|\n| Histoire | Prix de la longitude, Harrison | en cours | x | 2026-10-04 |');
  assert.ok(estDoublon(chercher('prix de la longitude Harrison', { idees })[0]));
});

test('doublons du corpus : titres quasi identiques', () => {
  const a = [{ id: 'a', slug: 'x', titre: 'La révolte Nika de Constantinople', sources: [] }, { id: 'b', slug: 'y', titre: 'Révolte Nika Constantinople', sources: [] }];
  assert.equal(doublonsDuCorpus(a)[0].gravite, 'erreur');
});
