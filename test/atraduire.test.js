// L'état des traductions anglaises se déduit des fichiers : absente, périmée, à jour (outils/atraduire.mjs).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { etatTraductions, voiePour } from '../outils/atraduire.mjs';
import { empreinteFiche } from '../outils/empreinte-fr.mjs';

const fiche = (slug, statut, accroche) => ({ id: `x-${slug}`, slug, statut, titre: 'T', accroche, contenu_vulgarise: 'Texte.', quiz: { question: 'Q ?', choix: ['a', 'b'], bonne_reponse: 1, explication: 'E', statut: 'valide' } });
const ecrire = (f, o) => { mkdirSync(path.dirname(f), { recursive: true }); writeFileSync(f, JSON.stringify(o)); };

test('absente, périmée, à jour, rejetée ignorée', () => {
  const r = mkdtempSync(path.join(tmpdir(), 'atraduire-'));
  const fr = (d, s, o) => ecrire(path.join(r, 'content/concepts', d, `${s}.json`), o);
  const en = (d, s, o) => ecrire(path.join(r, 'content/concepts-en', d, `${s}.json`), o);
  const a = fiche('a', 'valide', 'Accroche A'), b = fiche('b', 'brouillon', 'Accroche B'), c = fiche('c', 'valide', 'Accroche C'), x = fiche('x', 'rejete', 'Accroche X');
  fr('philosophie', 'a', a); fr('philosophie', 'b', b); fr('droit_social', 'c', c); fr('philosophie', 'x', x);
  en('philosophie', 'a', { empreinte_fr: empreinteFiche(a) });
  en('philosophie', 'b', { empreinte_fr: 'ancienne' });
  const etats = Object.fromEntries(etatTraductions(r).map(e => [`${e.discipline}/${e.slug}`, e.etat]));
  assert.deepEqual(etats, { 'philosophie/a': 'a_jour', 'philosophie/b': 'perimee', 'droit_social/c': 'absente' });
});

test("l'empreinte ignore le statut, les adresses et les indices de bonne réponse, pas les textes", () => {
  const a = fiche('a', 'valide', 'Accroche');
  const b = { ...a, statut: 'publie', quiz: { ...a.quiz, bonne_reponse: 0, statut: 'rejete' }, sources: [{ url: 'https://x' }] };
  assert.equal(empreinteFiche(a), empreinteFiche(b));
  assert.notEqual(empreinteFiche(a), empreinteFiche({ ...a, accroche: 'Autre' }));
});

test('les voies se lisent par disciplines et exceptions', () => {
  const v = { vincent: { disciplines: ['droit_*'] }, arnaud: { disciplines: ['*'], sauf: ['droit_*'] } };
  assert.deepEqual(voiePour('droit_social', v), ['vincent']);
  assert.deepEqual(voiePour('philosophie', v), ['arnaud']);
});
