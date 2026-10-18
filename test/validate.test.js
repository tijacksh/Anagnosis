import test from 'node:test';
import assert from 'node:assert/strict';
import { validerFiche, validerLot } from '../src/validate.js';
import { fresh } from '../src/schema.js';
import { loadAll, motsDe } from '../src/store.js';

/** Fiche minimale conforme, à dégrader champ par champ dans les tests. */
function ficheValide(patch = {}) {
  return fresh({
    id: 'phy-test',
    slug: 'test',
    titre: 'Un titre de test',
    accroche: 'Une accroche suffisamment longue pour passer le seuil',
    discipline: 'physique',
    contenu_vulgarise: Array.from({ length: 420 }, (_, i) => `mot${i}`).join(' '),
    repere: { texte: 'Un fait sourcé', source: 'Une référence', url: 'https://example.org/repere' },
    carte: {
      punch: 'Une accroche qui arrête le pouce',
      idee: "L'idée de la fiche, formulée pour tenir debout toute seule dans une story, sans renvoyer à l'app.",
      source_courte: 'Auteur, 2000',
    },
    sources: [
      { type: 'article', titre: 'Source A', auteur: 'Auteur A', annee: 2000, url: 'https://example.org/a' },
      { type: 'web', titre: 'Source B', auteur: 'Institution B', url: 'https://example.org/b' },
    ],
    illustration: { prompt: 'Composition abstraite', alt: 'Description', url: null, statut: 'a_generer' },
    quiz: {
      question: 'Une question ?',
      choix: ['A', 'B', 'C', 'D'],
      bonne_reponse: 1,
      explication: 'Une explication assez longue pour dépasser le seuil minimal requis.',
    },
    ...patch,
  });
}

test('une fiche conforme ne produit ni erreur ni alerte', () => {
  const { erreurs, alertes, ok } = validerFiche(ficheValide());
  assert.deepEqual(erreurs, []);
  assert.deepEqual(alertes, []);
  assert.ok(ok);
});

test('refuse une citation sans source (risque de fabrication)', () => {
  const { erreurs } = validerFiche(
    ficheValide({ repere: null, citation: { texte: 'Une phrase', auteur: 'Quelqu\'un' } }),
  );
  assert.ok(erreurs.some((e) => e.includes('citation.source')));
});

test('accepte une citation correctement sourcée', () => {
  const { ok } = validerFiche(
    ficheValide({
      repere: null,
      citation: {
        texte: 'Une phrase',
        auteur: 'Quelqu\'un',
        source: 'Une œuvre, 1900',
        url: 'https://example.org/citation',
      },
    }),
  );
  assert.ok(ok);
});

test('exige un encadré : ni citation ni repère est refusé', () => {
  const { erreurs } = validerFiche(ficheValide({ citation: null, repere: null }));
  assert.ok(erreurs.some((e) => e.includes('encadré sourcé')));
});

test('signale une fiche sans carte sans la bloquer', () => {
  const { erreurs, alertes } = validerFiche(ficheValide({ carte: null }));
  assert.deepEqual(erreurs, []);
  assert.ok(alertes.some((a) => a.includes('partageable')));
});

test('refuse une carte sans crédit source visible', () => {
  const { erreurs } = validerFiche(
    ficheValide({ carte: { ...ficheValide().carte, source_courte: '' } }),
  );
  assert.ok(erreurs.some((e) => e.includes('source_courte')));
});

test('borne le punch et l\'idée de la carte', () => {
  const punchLong = validerFiche(ficheValide({ carte: { ...ficheValide().carte, punch: 'x'.repeat(150) } }));
  assert.ok(punchLong.erreurs.some((e) => e.includes('punch')));

  const ideeCourte = validerFiche(ficheValide({ carte: { ...ficheValide().carte, idee: 'Trop court.' } }));
  assert.ok(ideeCourte.erreurs.some((e) => e.includes('idee')));
});

test('accepte une source antique (année négative)', () => {
  const { erreurs, alertes } = validerFiche(
    ficheValide({
      sources: [
        { titre: 'La République', auteur: 'Platon', annee: -375, url: 'https://example.org/platon' },
        { titre: 'B', auteur: 'Auteur B', url: 'https://example.org/b' },
      ],
    }),
  );
  assert.deepEqual(erreurs, []);
  assert.deepEqual(alertes, []);
});

test('refuse une source sans url, même complètement référencée', () => {
  // La règle « une url, ou auteur + année » laissait la moitié du corpus non
  // cliquable. Une référence bibliographique complète ne suffit donc plus : le
  // lecteur doit pouvoir ouvrir la source, sinon elle ne prouve rien (brief §3).
  const { erreurs } = validerFiche(
    ficheValide({
      sources: [
        { titre: 'Référencée mais fermée', auteur: 'Auteur A', annee: 2000 },
        { titre: 'B', auteur: 'Auteur B', url: 'https://example.org' },
      ],
    }),
  );
  assert.ok(erreurs.some((e) => e.includes('cliquable')));
});

test('refuse une source sans auteur, nul, absent ou blanc', () => {
  // Un auteur nul faisait écarter la fiche par iOS et refuser tout le fichier publié
  // par Android. Une page sans signature se crédite à son institution.
  for (const auteur of [null, undefined, '', '  ']) {
    const { erreurs } = validerFiche(
      ficheValide({
        sources: [
          { titre: 'A', auteur: 'Auteur A', url: 'https://example.org/a' },
          { titre: 'B', auteur, url: 'https://example.org/b' },
        ],
      }),
    );
    assert.ok(erreurs.some((e) => e.startsWith('sources[1].auteur manquant')), String(auteur));
  }
});

test('refuse moins de deux sources', () => {
  const { erreurs } = validerFiche(ficheValide({ sources: [{ titre: 'A', url: 'https://example.org' }] }));
  assert.ok(erreurs.some((e) => e.includes('minimum 2')));
});

test('refuse une url malformée', () => {
  const { erreurs } = validerFiche(
    ficheValide({ sources: [{ titre: 'A', url: 'pas-une-url' }, { titre: 'B', url: 'https://example.org' }] }),
  );
  assert.ok(erreurs.some((e) => e.includes('url invalide')));
});

test('borne la longueur du corps des deux côtés', () => {
  const court = validerFiche(ficheValide({ contenu_vulgarise: 'trois petits mots' }));
  assert.ok(court.erreurs.some((e) => e.includes('trop court')));

  const long = validerFiche({
    ...ficheValide(),
    contenu_vulgarise: Array.from({ length: 900 }, (_, i) => `mot${i}`).join(' '),
  });
  assert.ok(long.erreurs.some((e) => e.includes('trop long')));
});

test('refuse une accroche trop longue pour une notification', () => {
  const { erreurs } = validerFiche(ficheValide({ accroche: 'x'.repeat(200) }));
  assert.ok(erreurs.some((e) => e.includes('accroche')));
});

test('détecte les marqueurs de brouillon', () => {
  const { erreurs } = validerFiche(ficheValide({ titre: 'Titre TODO' }));
  assert.ok(erreurs.some((e) => e.includes('marqueur de brouillon')));
});

test('contrôle les questions supplémentaires comme la principale', () => {
  const bonne = {
    question: 'Une autre question ?',
    choix: ['A', 'B', 'C'],
    bonne_reponse: 0,
    explication: 'Une explication assez longue pour dépasser le seuil minimal requis.',
  };

  // Le cas nominal : jusqu'à quatre questions de plus, donc cinq en tout.
  const quatre = validerFiche(ficheValide({
    quiz_supplementaire: [0, 1, 2, 3].map((i) => ({ ...bonne, question: `Question ${i} ?` })),
  }));
  assert.deepEqual(quatre.erreurs, []);

  const trop = validerFiche(ficheValide({
    quiz_supplementaire: [0, 1, 2, 3, 4].map((i) => ({ ...bonne, question: `Question ${i} ?` })),
  }));
  assert.ok(trop.erreurs.some((e) => e.includes('maximum')));

  // **Deux fois la même question ne fait pas deux questions**, et l'accent ne sauve rien :
  // le rappel et la révision tirent dans le même sac.
  const repetee = validerFiche(ficheValide({
    quiz_supplementaire: [{ ...bonne, question: 'UNE QUESTION ?' }],
  }));
  assert.ok(repetee.erreurs.some((e) => e.includes('répète')));

  const sansQuiz = validerFiche(ficheValide({ quiz: null, quiz_supplementaire: [bonne] }));
  assert.ok(sansQuiz.erreurs.some((e) => e.includes('sans `quiz`')));

  const horsBornes = validerFiche(ficheValide({
    quiz_supplementaire: [{ ...bonne, bonne_reponse: 7 }],
  }));
  assert.ok(horsBornes.erreurs.some((e) => e.includes('bonne_reponse')));

  const courte = validerFiche(ficheValide({
    quiz_supplementaire: [{ ...bonne, explication: 'Trop court.' }],
  }));
  assert.ok(courte.erreurs.some((e) => e.includes('explication')));
});

test('contrôle la cohérence du quiz', () => {
  const horsBornes = validerFiche(ficheValide({
    quiz: { ...ficheValide().quiz, bonne_reponse: 9 },
  }));
  assert.ok(horsBornes.erreurs.some((e) => e.includes('bonne_reponse')));

  const doublons = validerFiche(ficheValide({
    quiz: { ...ficheValide().quiz, choix: ['A', 'A', 'B'] },
  }));
  assert.ok(doublons.erreurs.some((e) => e.includes('doublons')));

  const explicationCourte = validerFiche(ficheValide({
    quiz: { ...ficheValide().quiz, explication: 'Trop court.' },
  }));
  assert.ok(explicationCourte.erreurs.some((e) => e.includes('explication')));
});

test('accepte sans réserve toute discipline déclarée', () => {
  // Il n'y a plus de taxonomie « V1 » restreinte : les trente-neuf disciplines sont
  // déclarées d'un bloc et toutes exportées. C'est le client qui décide de ce qu'il
  // offre, selon le stock et l'encre disponibles.
  //
  // « droit » figurait ici et n'existe plus : c'est devenu une **famille** de sept
  // disciplines, et le test le vérifie plus bas.
  for (const discipline of ['astronomie', 'archeologie', 'cinema', 'droit_conformite']) {
    const { erreurs, alertes } = validerFiche(ficheValide({ discipline }));
    assert.deepEqual(erreurs, [], `${discipline} devrait passer sans erreur`);
    assert.ok(!alertes.some((a) => a.includes('taxonomie')), `${discipline} sans alerte`);
  }
});

test('refuse une discipline inconnue', () => {
  const { erreurs } = validerFiche(ficheValide({ discipline: 'cuisine' }));
  assert.ok(erreurs.some((e) => e.includes('discipline` inconnue')));
});

test('« droit » seul n’est plus une discipline, c’est une famille', () => {
  // Le grain a changé en cours de route : un lecteur coche la preuve judiciaire sans
  // prendre la propriété intellectuelle. Laisser « droit » accepté rouvrirait la porte
  // à des fiches sans discipline réelle, invisibles dans l'app faute d'encre.
  const { erreurs } = validerFiche(ficheValide({ discipline: 'droit' }));
  assert.ok(erreurs.some((e) => e.includes('discipline` inconnue')));
});

test('détecte les identifiants en double dans un lot', () => {
  const resultats = validerLot([ficheValide(), ficheValide()]);
  assert.ok(resultats[0].erreurs.some((e) => e.includes('en double')));
});

test('motsDe ignore les marques de mise en forme', () => {
  assert.equal(motsDe('## Un titre\n\nDu **gras** et de l\'*italique*'), 7);
});

// --- Contrôle du contenu réellement présent dans le dépôt ------------------

test('toutes les fiches du dépôt passent le contrôle qualité', async () => {
  const fiches = await loadAll();
  assert.ok(fiches.length > 0, 'aucune fiche trouvée dans content/concepts/');

  for (const { fiche, erreurs } of validerLot(fiches)) {
    assert.deepEqual(erreurs, [], `${fiche.id} : ${erreurs.join(' | ')}`);
  }
});

test('les sources d\'une fiche sont distinctes', async () => {
  for (const fiche of await loadAll()) {
    const urls = (fiche.sources ?? []).map((s) => s.url).filter(Boolean);
    assert.equal(new Set(urls).size, urls.length, `${fiche.id} : urls de sources en double`);
  }
});

test('la bonne réponse ne se devine pas à sa longueur', async () => {
  // Un classique du QCM mal écrit : la bonne réponse, plus détaillée que les
  // distracteurs, se repère sans rien comprendre à la question
  // (ligne éditoriale §6 : les mauvaises réponses doivent être plausibles).
  for (const fiche of await loadAll()) {
    if (!fiche.quiz) continue;
    const bonne = fiche.quiz.choix[fiche.quiz.bonne_reponse];
    const autres = fiche.quiz.choix.filter((_, i) => i !== fiche.quiz.bonne_reponse);
    const plusLongDistracteur = Math.max(...autres.map((c) => c.length));
    const ratio = bonne.length / plusLongDistracteur;

    assert.ok(
      ratio <= 1.4,
      `${fiche.id} : bonne réponse ${ratio.toFixed(2)}× plus longue que le meilleur distracteur`,
    );
  }
});

test('les positions de bonne réponse sont variées sur l\'ensemble du lot', async () => {
  // Toutes les bonnes réponses en position 0 se repèrent vite côté lecteur.
  const fiches = (await loadAll()).filter((f) => f.quiz);
  const positions = new Set(fiches.map((f) => f.quiz.bonne_reponse));
  assert.ok(positions.size > 1, `toutes les bonnes réponses sont en position ${[...positions][0]}`);
});

test('un tiret cadratin dans le texte lu est une erreur, pas dans une citation', () => {
  const avec = validerFiche(ficheValide({ accroche: 'Une accroche suffisamment longue — pour passer le seuil' }));
  assert.ok(avec.erreurs.some((e) => e.includes('tiret cadratin')), avec.erreurs.join('|'));
  const sans = validerFiche(ficheValide({ accroche: 'Une accroche suffisamment longue : pour passer le seuil' }));
  assert.ok(!sans.erreurs.some((e) => e.includes('tiret cadratin')));
});

test('un emoji dans le titre est une erreur, un mot creux une alerte', () => {
  const emoji = validerFiche(ficheValide({ titre: 'Un titre de test \u{1F680}' }));
  assert.ok(emoji.erreurs.some((e) => e.includes('emoji')));
  const creux = validerFiche(ficheValide({ accroche: 'Une accroche révolutionnaire et suffisamment longue' }));
  assert.ok(creux.alertes.some((a) => a.includes('sonne creux')));
});
