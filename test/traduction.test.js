// Le fichier signé porte les deux langues, ÉTEINT par défaut (src/traduction.js, src/publier.js).
// Garde : absente, périmée, quiz incohérent, drapeau, adresse, forme, relecture. Éteint : mêmes octets qu'avant.
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { loadAll } from '../src/store.js';
import { lireIndex } from '../src/audio.js';
import { audioPour, publication, fichesPubliables, retirees, serialiser } from '../src/publier.js';
import { optionsDepuisEnv, refus, projeterAnglais, lireAnglais, DRAPEAUX_INFO } from '../src/traduction.js';
import { CHAMPS, empreinteFiche } from '../outils/empreinte-fr.mjs';

const JOUR = new Date('2026-11-22T10:00:00Z');
const copie = (o) => JSON.parse(JSON.stringify(o));

const question = (q, bonne = 1) => ({ question: q, choix: ['a', 'b', 'c', 'd'], bonne_reponse: bonne, explication: 'Parce que.' });

const frFiche = (slug, extra = {}) => ({
  id: `x-${slug}`, slug, statut: 'valide', discipline: 'philosophie', theme: null, niveau: 'introductif', duree_lecture_min: 3,
  titre: `Titre ${slug}`, accroche: 'Une accroche.', contenu_vulgarise: 'Un texte.\n\nUn autre paragraphe.',
  citation: { texte: 'Une citation.', auteur: 'Un auteur', source: 'Une source', url: 'https://fr.example/citation' },
  repere: null,
  carte: { punch: 'Punch', idee: 'Idée', source_courte: 'Source courte' },
  sources: [{ type: 'web', titre: 'S', url: 'https://fr.example/s' }],
  pour_aller_plus_loin: [{ titre: 'Lire', url: 'https://fr.example/lire', note: 'Note' }],
  illustration: { prompt: 'p', alt: 'a', url: null, statut: 'a_generer' },
  quiz: { ...question('Pourquoi ?'), statut: 'valide' },
  quiz_supplementaire: [question('Combien ?', 2), question('Quand ?', 0)],
  validation: { historique: [] }, controle: null, meta: { version: 1 },
  ...extra,
});

/** La version anglaise « parfaite » d'une fiche française. */
function enDe(fr, extra = {}) {
  const en = {
    id: fr.id, slug: fr.slug, langue: 'en', empreinte_fr: empreinteFiche(fr), traduit_le: '2026-11-20', moteur: 'claude-code', relu: false, drapeaux: [],
    theme_ordre: 4, // clé égarée, jamais publiée
    titre: `Title ${fr.slug}`, accroche: 'A hook.', contenu_vulgarise: 'A text.\n\nAnother paragraph.',
    citation: { texte: 'A quote.', auteur: 'An author', source: 'A source', url: fr.citation.url },
    repere: null,
    carte: { punch: 'Punch', idee: 'Idea', source_courte: 'Short source' },
    pour_aller_plus_loin: [{ titre: 'Read', url: fr.pour_aller_plus_loin[0].url, note: 'Note' }],
    quiz: { ...question('Why?', fr.quiz.bonne_reponse), statut: 'valide' },
    quiz_supplementaire: fr.quiz_supplementaire.map((q, i) => question(`How ${i}?`, q.bonne_reponse)),
  };
  return { ...en, ...extra };
}

const dossiers = [];
after(() => { for (const d of dossiers) rmSync(d, { recursive: true, force: true }); });

function dossierEn(fichesEn) {
  const d = mkdtempSync(path.join(tmpdir(), 'concepts-en-'));
  dossiers.push(d);
  for (const [i, f] of fichesEn.entries()) {
    mkdirSync(path.join(d, 'philosophie'), { recursive: true });
    writeFileSync(path.join(d, 'philosophie', `${f.slug ?? `f${i}`}.json`), typeof f === 'string' ? f : JSON.stringify(f));
  }
  return d;
}

const avecEn = async (fr, en, options = {}) => {
  const d = dossierEn(Array.isArray(en) ? en : [en]);
  return publication([fr], { langues: ['fr', 'en'], index: {}, dossierEn: d, drapeauxToleres: DRAPEAUX_INFO, exigerRelu: false, ...options });
};

// --- l'environnement -------------------------------------------------------------------------

test("ANAGNOSIS_LANGUES : « fr » par défaut, « fr,en » allume, tout le reste est une erreur", () => {
  assert.deepEqual(optionsDepuisEnv({}).langues, ['fr']);
  assert.deepEqual(optionsDepuisEnv({ ANAGNOSIS_LANGUES: '' }).langues, ['fr']);
  assert.deepEqual(optionsDepuisEnv({ ANAGNOSIS_LANGUES: 'fr' }).langues, ['fr']);
  assert.deepEqual(optionsDepuisEnv({ ANAGNOSIS_LANGUES: ' FR , en ' }).langues, ['fr', 'en']);
  assert.deepEqual(optionsDepuisEnv({ ANAGNOSIS_LANGUES: 'en,fr' }).langues, ['fr', 'en']);
  assert.throws(() => optionsDepuisEnv({ ANAGNOSIS_LANGUES: 'en' }), /français est obligatoire/);
  assert.throws(() => optionsDepuisEnv({ ANAGNOSIS_LANGUES: 'fr,de' }), /inconnue/);
  assert.equal(optionsDepuisEnv({}).exigerRelu, false);
  assert.equal(optionsDepuisEnv({ ANAGNOSIS_EN_RELU: '1' }).exigerRelu, true);
  assert.ok(optionsDepuisEnv({ ANAGNOSIS_EN_DRAPEAUX_TOLERES: 'citation-traduite, incertain' }).drapeauxToleres.has('incertain'));
  assert.ok([...DRAPEAUX_INFO].every((t) => optionsDepuisEnv({}).drapeauxToleres.has(t)));
});

// --- la garde --------------------------------------------------------------------------------

test('une version anglaise sûre donne `en`, avec les seuls champs traduits', async () => {
  const fr = frFiche('a');
  const { fiches, rapport } = await avecEn(fr, enDe(fr));
  assert.equal(rapport.avec, 1);
  const en = fiches[0].en;
  assert.deepEqual(Object.keys(en), ['titre', 'accroche', 'contenu_vulgarise', 'citation', 'carte', 'pour_aller_plus_loin', 'quiz', 'quiz_supplementaire']);
  assert.ok(Object.keys(en).every((k) => CHAMPS.includes(k)));
  assert.equal(en.titre, 'Title a');
  assert.equal(en.quiz.statut, 'valide', 'le statut des questions vient du français');
  assert.equal('audio' in en, false);
  // Le français est intact : mêmes clés, mêmes valeurs, `en` en plus.
  const { en: _, ...sansEn } = fiches[0];
  const sansAnglais = await publication([fr], { langues: ['fr'], index: {} });
  assert.deepEqual(sansEn, sansAnglais.fiches[0]);
});

test('absente : pas de version anglaise, donc pas d\'`en` (repli sur le français)', async () => {
  const fr = frFiche('a');
  const { fiches, rapport } = await avecEn(fr, enDe(frFiche('autre')));
  assert.equal('en' in fiches[0], false);
  assert.equal(rapport.sans, 1);
  assert.equal(rapport.orphelines, 1);
  assert.equal(rapport.refus.length, 0);
});

test('périmée : le français a changé depuis la traduction', async () => {
  const fr = frFiche('a');
  const en = enDe(fr);
  const retouche = { ...fr, accroche: 'Une accroche retouchée.' };
  const { fiches, rapport } = await avecEn(retouche, en);
  assert.equal('en' in fiches[0], false);
  assert.equal(rapport.refus[0].motif, 'perimee');
});

test("l'empreinte ignore le statut, les adresses et les indices : une retouche de ces champs ne périme pas", () => {
  const fr = frFiche('a');
  assert.equal(refus({ ...fr, statut: 'publie', quiz: { ...fr.quiz, statut: 'rejete' } }, enDe(fr)), null);
});

test('quiz incohérent : bonne_reponse, nombre de choix ou de questions différents', () => {
  const fr = frFiche('a');
  const ok = (en) => refus(fr, en)?.motif;
  const base = enDe(fr);
  assert.equal(ok(base), undefined);

  const e1 = copie(base); e1.quiz.bonne_reponse = (fr.quiz.bonne_reponse + 1) % 4;
  assert.equal(ok(e1), 'quiz');
  const e2 = copie(base); e2.quiz_supplementaire[1].bonne_reponse = 3;
  assert.equal(ok(e2), 'quiz');
  const e3 = copie(base); e3.quiz_supplementaire.pop();
  assert.ok(['quiz', 'structure'].includes(ok(e3)));
  const e4 = copie(base); e4.quiz.choix.pop();
  assert.ok(['quiz', 'structure'].includes(ok(e4)));
  const e5 = copie(base); delete e5.quiz;
  assert.ok(['quiz', 'structure'].includes(ok(e5)));
});

test('quiz incohérent : le concept sort sans `en`', async () => {
  const fr = frFiche('a');
  const en = enDe(fr); en.quiz_supplementaire[0].bonne_reponse = 3;
  const { fiches, rapport } = await avecEn(fr, en);
  assert.equal('en' in fiches[0], false);
  assert.equal(rapport.refus[0].motif, 'quiz');
});

test('forme différente : liste plus courte, champ en moins, phrase vide', () => {
  const fr = frFiche('a');
  const e1 = enDe(fr); e1.pour_aller_plus_loin = [];
  assert.equal(refus(fr, e1)?.motif, 'structure');
  const e2 = enDe(fr); delete e2.carte;
  assert.equal(refus(fr, e2)?.motif, 'structure');
  const e3 = enDe(fr); e3.accroche = '  ';
  assert.equal(refus(fr, e3)?.motif, 'structure');
  const e4 = enDe(fr); e4.citation = null;
  assert.equal(refus(fr, e4)?.motif, 'structure');
});

test("une liste devenue objet, ou une clé égarée en profondeur, ne passent pas et ne cassent rien", async () => {
  const fr = frFiche('a');
  const e1 = enDe(fr); e1.quiz_supplementaire = { 0: e1.quiz_supplementaire[0], 1: e1.quiz_supplementaire[1] };
  assert.equal(refus(fr, e1)?.motif, 'structure');
  const e2 = enDe(fr); e2.quiz_supplementaire = {};
  assert.equal(refus(fr, e2)?.motif, 'structure');
  const e3 = enDe(fr); e3.quiz = 'oups';
  assert.ok(refus(fr, e3));
  const e4 = enDe(fr); e4.citation.lien = 'https://x'; e4.carte.couleur = 3; e4.quiz.choix_secrets = [1];
  assert.equal(refus(fr, e4), null);
  const p = projeterAnglais(fr, e4);
  assert.equal('lien' in p.citation, false);
  assert.equal('couleur' in p.carte, false);
  assert.equal('choix_secrets' in p.quiz, false);
  assert.deepEqual(p.citation, { texte: 'A quote.', auteur: 'An author', source: 'A source', url: fr.citation.url });
  // Et par la construction : jamais d'exception, au pire pas d'`en`.
  const { fiches } = await avecEn(fr, e1);
  assert.equal('en' in fiches[0], false);
});

test('identité : mauvais id, mauvais slug ou langue autre que « en »', () => {
  const fr = frFiche('a');
  assert.equal(refus(fr, enDe(fr, { id: 'x-autre' }))?.motif, 'identite');
  assert.equal(refus(fr, enDe(fr, { slug: 'autre' }))?.motif, 'identite');
  assert.equal(refus(fr, enDe(fr, { langue: 'fr' }))?.motif, 'identite');
});

test('drapeau : seul l\'information passe ; tout autre type, connu ou non, bloque ; un type toléré passe', () => {
  const fr = frFiche('a');
  const avec = (...types) => enDe(fr, { drapeaux: types.map((type) => ({ chemin: 'citation', type, note: 'n' })) });
  assert.equal(refus(fr, avec()), null);
  const enAnglais = enDe(fr, { drapeaux: [{ chemin: 'citation', type: 'texte-officiel-anglais', note: '' }] });
  enAnglais.citation.url = 'https://en.example/original';
  assert.equal(refus(fr, enAnglais), null, 'une citation retrouvée en anglais change d\'adresse, son drapeau le dit');
  for (const t of ['citation-traduite', 'incertain', 'texte-officiel-a-verifier', 'erreur-possible-fr', 'citation-langue-originale', 'drapeau-inconnu']) {
    assert.equal(refus(fr, avec(t))?.motif, 'drapeau', t);
  }
  assert.equal(refus(fr, avec('citation-originale-anglaise', 'incertain'))?.motif, 'drapeau');
  const tolere = new Set([...DRAPEAUX_INFO, 'citation-traduite']);
  assert.equal(refus(fr, avec('citation-traduite'), { drapeauxToleres: tolere }), null);
  assert.equal(refus(fr, avec('citation-traduite', 'incertain'), { drapeauxToleres: tolere })?.motif, 'drapeau');
  assert.equal(refus(fr, enDe(fr, { drapeaux: 'oups' }))?.motif, 'drapeau');
  assert.equal(refus(fr, enDe(fr, { drapeaux: undefined }))?.motif, 'drapeau');
});

test('adresse : celle du français, sauf source retrouvée en anglais', () => {
  const fr = frFiche('a');
  const e1 = enDe(fr); e1.citation.url = 'https://en.example/autre';
  assert.equal(refus(fr, e1)?.motif, 'url');
  const e2 = enDe(fr); e2.pour_aller_plus_loin[0].url = 'https://en.example/lire';
  assert.equal(refus(fr, e2)?.motif, 'url');
  const e3 = enDe(fr, { drapeaux: [{ chemin: 'pour_aller_plus_loin/0', type: 'texte-officiel-anglais', note: '' }] });
  e3.pour_aller_plus_loin[0].url = 'https://en.example/lire';
  assert.equal(refus(fr, e3)?.motif, 'url', 'la liste « pour aller plus loin » ne change jamais d\'adresse');
  // Le drapeau vaut pour son chemin, et l'adresse anglaise doit être une vraie adresse.
  const e4 = enDe(fr, { drapeaux: [{ chemin: 'repere', type: 'citation-originale-anglaise', note: '' }] });
  e4.citation.url = 'https://en.example/original';
  assert.equal(refus(fr, e4)?.motif, 'url', 'un drapeau sur `repere` ne libère pas `citation`');
  const e5 = enDe(fr, { drapeaux: [{ chemin: 'citation.texte', type: 'citation-originale-anglaise', note: '' }] });
  e5.citation.url = 'https://en.example/original';
  assert.equal(refus(fr, e5), null);
  delete e5.citation.url;
  assert.equal(refus(fr, e5)?.motif, 'url', 'adresse anglaise absente');
  e5.citation.url = 'pas une adresse';
  assert.equal(refus(fr, e5)?.motif, 'url');
});

test('relecture : exigée seulement sur demande', () => {
  const fr = frFiche('a');
  assert.equal(refus(fr, enDe(fr)), null);
  assert.equal(refus(fr, enDe(fr), { exigerRelu: true })?.motif, 'non_relue');
  assert.equal(refus(fr, enDe(fr, { relu: true }), { exigerRelu: true }), null);
});

test('un fichier anglais cassé ou en double ne casse jamais la construction', async () => {
  const fr = frFiche('a');
  const bon = enDe(fr);
  const d = dossierEn([
    { ...bon, slug: 'a' },
    '<<<<<<< HEAD\n{ pas du json',
    '{"slug": "sans-id"}',
    { ...enDe(frFiche('b')), slug: 'b1' },
    { ...enDe(frFiche('b')), slug: 'b2' },
  ]);
  const lecture = await lireAnglais(d);
  assert.equal(lecture.illisibles.length, 2);
  assert.ok(lecture.doublons.has('x-b'));
  const frB = frFiche('b');
  const { fiches, rapport } = await publication([fr, frB], { langues: ['fr', 'en'], index: {}, dossierEn: d });
  assert.ok(fiches[0].en, 'la fiche saine garde son anglais');
  assert.equal('en' in fiches[1], false);
  assert.equal(rapport.refus[0].motif, 'doublon');
  assert.equal(rapport.illisibles, 2);
});

test('dossier anglais absent : le français sort seul', async () => {
  const { fiches, rapport } = await publication([frFiche('a')], { langues: ['fr', 'en'], index: {}, dossierEn: '/nulle/part' });
  assert.equal('en' in fiches[0], false);
  assert.equal(rapport.sans, 1);
});

test('projeterAnglais ne copie jamais audio, drapeaux ni clés égarées', () => {
  const fr = frFiche('a');
  const en = enDe(fr, { audio: { lecture: {} }, sources: [{ url: 'x' }], statut: 'valide' });
  const p = projeterAnglais(fr, en);
  for (const interdit of ['audio', 'drapeaux', 'relu', 'empreinte_fr', 'theme_ordre', 'sources', 'statut', 'id', 'slug']) assert.equal(interdit in p, false, interdit);
});

// --- éteint : mêmes octets qu'avant ------------------------------------------------------------

/** La projection d'AVANT cette fonctionnalité, réécrite ici : le test ne se compare pas à son propre code. */
function projectionAncienne(toutes, index) {
  return toutes
    .filter((f) => ['valide', 'publie'].includes(f.statut))
    .map(({ _path, validation, meta, controle, ...publique }) => {
      const audio = audioPour(publique, index);
      return audio ? { ...publique, audio } : publique;
    });
}

test('éteint (défaut) : les octets sont ceux de la projection d\'avant, sur des fiches de fixtures', async () => {
  const a = frFiche('a'), b = frFiche('b', { statut: 'en_retouche' }), c = frFiche('c', { statut: 'publie' });
  const index = { [a.id]: { voix_attribuee: 'v1', voix: { v1: { r2: true, fichier: 'a.m4a', sha256: 'abc', secondes: 60, genre: 'femme' } } } };
  const toutes = [a, b, c];
  const attendu = serialiser(projectionAncienne(toutes, index), retirees(toutes), JOUR);
  // Sans options : défaut = environnement, ici non posé. Un bon anglais est à côté : il ne doit PAS sortir.
  const d0 = dossierEn([enDe(a)]);
  const saved = process.env.ANAGNOSIS_LANGUES;
  delete process.env.ANAGNOSIS_LANGUES;
  let defaut;
  try { defaut = serialiser(await fichesPubliables(toutes, { index, dossierEn: d0 }), retirees(toutes), JOUR); }
  finally { if (saved !== undefined) process.env.ANAGNOSIS_LANGUES = saved; }
  const explicite = serialiser(await fichesPubliables(toutes, { index, langues: ['fr'] }), retirees(toutes), JOUR);
  assert.ok(attendu.equals(defaut));
  assert.ok(attendu.equals(explicite));
  assert.ok(!attendu.toString().includes('"en"'));
  // Même avec des fichiers anglais parfaits à côté : éteint, ils ne sortent pas.
  const d = dossierEn([enDe(a)]);
  const avecDossier = serialiser(await fichesPubliables(toutes, { index, langues: ['fr'], dossierEn: d }), retirees(toutes), JOUR);
  assert.ok(attendu.equals(avecDossier));
});

test('éteint : sur le contenu réel, mêmes octets que la projection d\'avant', async () => {
  const toutes = await loadAll();
  const index = await lireIndex();
  const attendu = serialiser(projectionAncienne(toutes, index), retirees(toutes), JOUR);
  const obtenu = serialiser(await fichesPubliables(toutes, { index, langues: ['fr'] }), retirees(toutes), JOUR);
  assert.ok(attendu.equals(obtenu));
});

// --- allumé : le français ne bouge pas ---------------------------------------------------------

test('allumé sur le contenu réel : le français est inchangé, `en` est une addition sûre', async () => {
  const toutes = await loadAll();
  const index = await lireIndex();
  const fr = await publication(toutes, { index, langues: ['fr'] });
  const bi = await publication(toutes, { index, langues: ['fr', 'en'], drapeauxToleres: DRAPEAUX_INFO, exigerRelu: false });

  // Ôter `en` : on retombe sur les octets du français seul. Identifiants, ordre, retraits,
  // date et audio viennent donc du français seul, quelle que soit la langue.
  const sansEn = bi.fiches.map(({ en, ...reste }) => reste);
  assert.ok(serialiser(sansEn, retirees(toutes), JOUR).equals(serialiser(fr.fiches, retirees(toutes), JOUR)));
  assert.deepEqual(bi.fiches.map((f) => f.id), fr.fiches.map((f) => f.id));

  const parId = new Map(toutes.map((f) => [f.id, f]));
  const lecture = await lireAnglais();
  for (const f of bi.fiches) {
    if (!f.en) continue;
    const source = parId.get(f.id);
    const en = lecture.parId.get(f.id).fiche;
    assert.equal(en.empreinte_fr, empreinteFiche(source), `${f.id} : empreinte à jour`);
    assert.ok(Object.keys(f.en).every((k) => CHAMPS.includes(k)), `${f.id} : champs traduits seulement`);
    assert.equal('audio' in f.en, false);
    assert.equal(f.en.quiz?.bonne_reponse, source.quiz?.bonne_reponse, `${f.id} : même bonne réponse`);
    assert.equal(f.en.quiz?.choix.length, source.quiz?.choix.length);
    assert.deepEqual((f.en.quiz_supplementaire ?? []).map((q) => [q.bonne_reponse, q.choix.length]),
      (source.quiz_supplementaire ?? []).map((q) => [q.bonne_reponse, q.choix.length]), `${f.id} : même sac de questions`);
    for (const d of en.drapeaux) assert.ok(DRAPEAUX_INFO.has(d.type), `${f.id} : drapeau ${d.type} laissé passer`);
  }
  // Le compte rendu compte tout, sans exiger un nombre : l'anglais avance chaque jour.
  const r = bi.rapport;
  assert.equal(r.avec, bi.fiches.filter((f) => f.en).length);
  assert.equal(r.avec + r.sans + r.refus.length, bi.fiches.length);
});
