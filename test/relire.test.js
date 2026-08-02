/**
 * Le garde-fou de la relecture autonome.
 *
 * Cette routine valide des fiches **sans relecteur derrière elle**. Le seul filet qui reste
 * est la règle « deux passages indépendants » : elle ne peut trancher qu'un brouillon
 * portant déjà un contrôle à jour et sans réserve. Ces tests vérifient ce filet, et rien
 * d'autre n'a autant d'importance dans ce fichier.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { aRelire, controleAJour, enAttenteDeControle } from '../src/relire.js';
import { empreinte } from '../src/controle.js';

/** Une fiche minimale, avec une trace de contrôle cohérente avec son contenu. */
function fiche(modifs = {}, controle = {}) {
  const base = {
    id: 'phi-test', statut: 'brouillon', discipline: 'philosophie',
    titre: 'Titre', accroche: 'Accroche', contenu_vulgarise: 'Corps',
    sources: [{ titre: 'S', url: 'https://exemple.fr' }],
    ...modifs,
  };
  if (controle !== null) {
    base.controle = {
      fait_le: '2026-07-31', verdict: 'ok', notes: [],
      empreinte: empreinte(base), ...controle,
    };
  }
  return base;
}

test('un brouillon contrôlé « ok » et inchangé est décidable', () => {
  assert.equal(aRelire(fiche()), true);
});

test('un brouillon contrôlé « corrige » est décidable aussi', () => {
  // Le contrôle a corrigé une coquille ou un lien : il n'a rien signalé sur le fond.
  assert.equal(aRelire(fiche({}, { verdict: 'corrige' })), true);
});

test('un brouillon jamais contrôlé n’est pas décidable', () => {
  const f = fiche();
  delete f.controle;
  assert.equal(aRelire(f), false);
  assert.equal(enAttenteDeControle(f), true);
});

test('un brouillon modifié depuis son contrôle n’est pas décidable', () => {
  // C'est le cœur du filet : l'empreinte enregistrée ne décrit plus le texte qu'on lit.
  const f = fiche();
  f.contenu_vulgarise = 'Un corps entièrement réécrit après le contrôle';
  assert.equal(controleAJour(f), false);
  assert.equal(aRelire(f), false);
  assert.equal(enAttenteDeControle(f), true);
});

test('un brouillon dont le contrôle a émis une réserve n’est pas décidable', () => {
  assert.equal(aRelire(fiche({}, { verdict: 'a_revoir', notes: ['un doute'] })), false);
});

test('seuls les brouillons entrent dans la file', () => {
  for (const statut of ['valide', 'en_retouche', 'rejete']) {
    assert.equal(aRelire(fiche({ statut })), false, `${statut} ne doit pas être relu`);
    assert.equal(enAttenteDeControle(fiche({ statut })), false);
  }
});

test('la trace de contrôle sans date ne vaut rien', () => {
  // Une trace posée à la main, ou tronquée par une écriture interrompue.
  const f = fiche({}, { fait_le: undefined });
  assert.equal(controleAJour(f), false);
  assert.equal(aRelire(f), false);
});
