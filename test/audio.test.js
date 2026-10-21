/**
 * Ce qui empêche une fiche de mentir à l'oreille.
 *
 * `empreinteAudio` ne couvre que ce que `aLire()` prononce réellement — pas le fond
 * éditorial entier comme l'empreinte de contrôle (`src/controle.js`), qui couvre aussi
 * les sources, la carte et le quiz, jamais lus à voix haute. Une routine qui se
 * contenterait de regarder si le fichier existe laisserait une fiche corrigée par
 * `/reparer` servir le son de l'ancien texte — **et rien ne le signalerait**. Le lecteur
 * entendrait une version que la fiche ne dit plus, jusqu'à ce que quelqu'un le remarque à
 * l'écoute, s'il le remarque.
 *
 * C'est le seul défaut de cette chaîne qui soit à la fois silencieux et durable. Ces
 * tests le verrouillent ; le reste du fichier compte moins.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { aSonoriser, motif, aLire, empreinteAudio, raisonDeRefaire, attribuerVoix, morceaux, publieeDans, MOTEUR, REGLAGES } from '../src/audio.js';

/** Une fiche publiable minimale. */
function fiche(modifs = {}) {
  return {
    id: 'ant-test', statut: 'valide', discipline: 'anthropologie',
    titre: 'Titre', accroche: 'Accroche', contenu_vulgarise: 'Corps',
    sources: [{ titre: 'S', url: 'https://exemple.fr' }],
    ...modifs,
  };
}

/** Le contexte de production, sans toucher au disque : deux voix, des poids, des règles. */
function ctx(modifs = {}) {
  return {
    regles: [],
    poids: 'abc123def456',
    voix: [
      { nom: 'gaelle', affiche: 'Gaëlle', genre: 'femme', allure: 1.18, empreinte: 'refgaelle' },
      { nom: 'sarah', affiche: 'Sarah', genre: 'femme', allure: 1.15, empreinte: 'refsarah' },
      { nom: 'julien', affiche: 'Julien', genre: 'homme', allure: 1.17, empreinte: 'refjulien' },
      { nom: 'leo', affiche: 'Léo', genre: 'homme', allure: 1.27, empreinte: 'refleo' },
    ],
    ...modifs,
  };
}

/** Un index qui décrit exactement la fiche donnée, produite par le moteur local. */
function indexPour(f, modifs = {}, c = ctx()) {
  return {
    [f.id]: {
      empreinte: empreinteAudio(f, c.regles), empreinte_texte: empreinteAudio(f),
      moteur: MOTEUR, modele: 'k2-fsa/OmniVoice', poids: c.poids, reglages: REGLAGES,
      voix_attribuee: 'gaelle', reference: 'refgaelle', allure: 1.18, produit_le: '2026-10-21T00:00:00Z',
      voix: { gaelle: { fichier: `${f.id}--${'a'.repeat(16)}.m4a`, genre: 'femme', sha256: 'a'.repeat(64), octets: 900_000, secondes: 200 } },
      ...modifs,
    },
  };
}

test('une fiche dont l’audio décrit le texte courant est à jour', () => {
  const f = fiche();
  assert.equal(aSonoriser(f, indexPour(f), ctx()), false);
});

test('une fiche jamais produite est à sonoriser', () => {
  assert.equal(aSonoriser(fiche(), {}, ctx()), true);
});

test('sans contexte, la décision refuse de répondre plutôt que de se tromper en silence', () => {
  const f = fiche();
  assert.throws(() => aSonoriser(f, indexPour(f)), /contexte/);
  assert.throws(() => aSonoriser(f, indexPour(f), { voix: [] }), /contexte/);
});

test('un texte corrigé après coup fait repasser l’audio en production', () => {
  // Le cœur du fichier. L'index décrit l'ancien texte ; la fiche a été réparée depuis.
  // Sans cette détection, le son continuerait d'affirmer ce que la fiche a rétracté.
  const avant = fiche();
  const index = indexPour(avant);
  const apres = fiche({ contenu_vulgarise: 'Corps corrigé après un signalement' });

  assert.notEqual(empreinteAudio(apres), empreinteAudio(avant), 'le scénario suppose un texte modifié');
  assert.equal(aSonoriser(apres, index, ctx()), true);
  assert.equal(motif(apres, index, ctx()), 'texte modifié depuis');
});

test('une correction qui ne touche pas au fond ne redéclenche rien', () => {
  const f = fiche();
  const index = indexPour(f);
  const servie = fiche({ statut: 'publie', meta: { vu: 12 } });
  assert.equal(aSonoriser(servie, index, ctx()), false);
});

test('une correction de source, de carte ou de quiz ne redéclenche rien', () => {
  // Le piège précis que `empreinteAudio` existe pour éviter : un lien mort réparé, une
  // note de source corrigée, un distracteur de quiz retouché — rien de tout ça ne
  // change un seul mot de ce que `aLire()` prononce.
  const f = fiche({
    carte: { punch: 'Punch', idee: 'Idée', source_courte: 'Source' },
    quiz: { question: 'Q', choix: ['A', 'B'], reponse: 0, explication: 'E' },
  });
  const index = indexPour(f);
  const corrigee = fiche({
    accroche: 'Accroche reformulée',
    sources: [{ titre: 'S corrigé', url: 'https://exemple.fr/corrige' }],
    carte: { punch: 'Punch corrigé', idee: 'Idée', source_courte: 'Source' },
    quiz: { question: 'Q', choix: ['A corrigé', 'B'], reponse: 0, explication: 'E corrigée' },
  });
  assert.equal(aSonoriser(corrigee, index, ctx()), false);
});

// ── Ce dont le son est fait : jamais deux rendus mélangés en silence ────────────────

test('l’index enregistre le moteur : un audio d’ElevenLabs repasse en production', () => {
  const f = fiche();
  const ancien = { [f.id]: { empreinte: empreinteAudio(f), modele: 'eleven_v3', allure: 1.25, voix: { helene: {}, jerome: {} } } };
  assert.equal(aSonoriser(f, ancien, ctx()), true);
  assert.match(motif(f, ancien, ctx()), /eleven_v3/);
});

test('un modèle changé refait la fiche', () => {
  const f = fiche();
  assert.match(raisonDeRefaire(f, indexPour(f, { modele: 'k2-fsa/OmniVoice-2' }), ctx()), /modèle changé/);
});

test('des poids d’OmniVoice changés refont la fiche', () => {
  const f = fiche();
  assert.match(motif(f, indexPour(f), ctx({ poids: 'fffffffffff0' })), /poids/);
});

test('des réglages de lecture changés refont la fiche', () => {
  const f = fiche();
  assert.match(motif(f, indexPour(f, { reglages: 'lecture-ancienne' }), ctx()), /réglages/);
});

test('une référence de voix changée refait les fiches de cette voix', () => {
  const f = fiche();
  const c = ctx();
  c.voix[0] = { ...c.voix[0], empreinte: 'nouvelle-ref' };
  assert.match(motif(f, indexPour(f), c), /référence/);
});

test('l’allure d’une voix changée refait ses fiches', () => {
  const f = fiche();
  const c = ctx();
  c.voix[0] = { ...c.voix[0], allure: 1.3 };
  assert.match(motif(f, indexPour(f), c), /allure/);
});

test('une voix retirée de la rotation refait ses fiches', () => {
  const f = fiche();
  const c = ctx({ voix: ctx().voix.filter((v) => v.nom !== 'gaelle') });
  assert.match(motif(f, indexPour(f), c), /retirée/);
});

test('un fichier manquant dans l’index refait la fiche', () => {
  const f = fiche();
  assert.equal(raisonDeRefaire(f, indexPour(f, { voix: {} }), ctx()), 'fichier manquant');
});

// ── La rotation ─────────────────────────────────────────────────────────────────────

test('une fiche garde sa voix quand on la refait', () => {
  const f = fiche();
  const index = indexPour(f, { voix_attribuee: 'leo' });
  assert.equal(attribuerVoix(f, index, ctx().voix).nom, 'leo');
});

test('la rotation alterne les genres et prend la voix la moins employée', () => {
  const c = ctx();
  const index = {
    a: { voix_attribuee: 'gaelle', produit_le: '2026-10-21T01:00:00Z' },
    b: { voix_attribuee: 'julien', produit_le: '2026-10-21T02:00:00Z' },
    c: { voix_attribuee: 'gaelle', produit_le: '2026-10-21T03:00:00Z' },
  };
  // La dernière est une femme : au tour d'un homme, et Léo n'a encore rien lu.
  assert.equal(attribuerVoix(fiche({ id: 'neuve' }), index, c.voix).nom, 'leo');
  index.d = { voix_attribuee: 'leo', produit_le: '2026-10-21T04:00:00Z' };
  // Puis une femme : Sarah, jamais employée, passe devant Gaëlle.
  assert.equal(attribuerVoix(fiche({ id: 'neuve' }), index, c.voix).nom, 'sarah');
});

test('les quatre dernières voix se reposent, même quand une autre a moins lu', () => {
  // Une voix ajoutée en cours de route a peu lu : sans repos, elle prendrait une fiche de
  // son genre sur deux jusqu'à rattraper les autres.
  const voix = [...ctx().voix, { nom: 'claire', genre: 'femme', allure: 1.2, empreinte: 'refclaire' }];
  const ordre = ['gaelle', 'julien', 'sarah', 'leo', 'gaelle', 'julien', 'sarah', 'leo', 'claire', 'julien'];
  const index = Object.fromEntries(ordre.map((nom, i) => [`f${i}`, { voix_attribuee: nom, produit_le: `2026-10-21T${String(i).padStart(2, '0')}:00:00Z` }]));
  // Au tour d'une femme. Claire n'a lu qu'une fois, mais elle est parmi les quatre dernières
  // (sarah, leo, claire, julien), comme Sarah : c'est Gaëlle.
  assert.equal(attribuerVoix(fiche({ id: 'neuve' }), index, voix).nom, 'gaelle');
});

test('une fiche dont la voix a été retirée en reçoit une nouvelle', () => {
  const f = fiche();
  const index = indexPour(f, { voix_attribuee: 'mélanie' });
  assert.ok(ctx().voix.some((v) => v.nom === attribuerVoix(f, index, ctx().voix).nom));
});

// ── Le texte dit ────────────────────────────────────────────────────────────────────

test('les morceaux : une phrase par morceau, titres ponctués, années à l’oral', () => {
  const f = fiche({ titre: 'Le procès', contenu_vulgarise: '## La suite\n\nEn 1961, il parle. Elle écoute.', repere: { texte: 'Un fait.' } });
  const m = morceaux(f);
  assert.deepEqual(m.map((x) => x.type), ['titre', 'intertitre', 'phrase', 'paragraphe', 'citation']);
  assert.equal(m[0].texte, 'Le procès.');
  assert.equal(m[2].texte, 'En dix-neuf cent soixante-et-un, il parle.');
  // Chaque morceau garde la ligne lue dont il vient : c'est la base des chapitres.
  assert.deepEqual(m.map((x) => x.ligne), [0, 1, 2, 2, 3]);
});

test('les réécritures passent dans les morceaux, pas dans le texte lu', () => {
  const regles = [{ nom: 'Noether', dire: 'Neuteur' }];
  const f = fiche({ contenu_vulgarise: 'Emmy Noether démontre.' });
  assert.match(morceaux(f, regles)[1].texte, /Neuteur/);
  assert.doesNotMatch(aLire(f), /Neuteur/);
});

test('la fiche publiée sert sa voix sous les clés que les apps installées connaissent', async () => {
  // Les versions déjà sur les téléphones ne lisent que `helene` et `jerome` : sous un nom
  // nouveau, la fiche y serait muette. La même voix sous les deux clés, et `lecture` pour
  // les versions qui savent qui lit.
  const { audioPour } = await import('../src/publier.js');
  const f = fiche();
  const index = indexPour(f);
  index[f.id].voix.gaelle = { ...index[f.id].voix.gaelle, affiche: 'Gaëlle', r2: { sha256: 'a'.repeat(64) } };
  const a = audioPour(f, index);
  assert.deepEqual(a.helene, a.jerome);
  assert.equal(a.lecture.genre, 'femme');
  assert.equal(a.lecture.voix, undefined, 'le nom des voix ne part pas dans le manifeste');
  assert.equal(a.lecture.sha256, 'a'.repeat(64));
  assert.ok(Number.isInteger(a.helene.secondes), 'les apps décodent `secondes` en entier');
  // Pas encore téléversée : rien n'est publié, jamais une adresse que le bucket ne sert pas.
  delete index[f.id].voix.gaelle.r2;
  assert.equal(audioPour(f, index), undefined);
});

test('une fiche refaite garde son ancien son en ligne tant que le nouveau n’est pas téléversé', async () => {
  const { audioPour } = await import('../src/publier.js');
  const f = fiche();
  const avant = indexPour(f)[f.id];
  avant.voix.gaelle.r2 = { sha256: 'a'.repeat(64) };
  const refaite = indexPour(f, {
    voix: { gaelle: { fichier: `${f.id}--${'b'.repeat(16)}.m4a`, genre: 'femme', sha256: 'b'.repeat(64), octets: 1, secondes: 190 } },
  })[f.id];
  refaite.precedente = publieeDans(avant);
  const a = audioPour(f, { [f.id]: refaite });
  assert.equal(a.lecture.sha256, 'a'.repeat(64), 'l’ancien fichier, encore servi');
  // Une fois le nouveau en ligne, c'est lui.
  refaite.voix.gaelle.r2 = { sha256: 'b'.repeat(64) };
  assert.equal(audioPour(f, { [f.id]: refaite }).lecture.sha256, 'b'.repeat(64));
  // Refaite deux fois sans téléversement entre les deux : c'est toujours le son en ligne.
  delete refaite.voix.gaelle.r2;
  assert.equal(publieeDans(refaite), refaite.precedente);
});

test('aucun fichier produit par le moteur local ne porte le nom de sa voix', async () => {
  // Le nom de fichier devient l'URL publiée : le nom d'une voix n'en sort jamais.
  const { readFile } = await import('node:fs/promises');
  const index = JSON.parse(await readFile(new URL('../audio/index.json', import.meta.url), 'utf8'));
  for (const [id, e] of Object.entries(index)) {
    if (!e.voix_attribuee) continue;
    for (const [nom, v] of Object.entries(e.voix)) {
      // Le suffixe seul : l'identifiant de la fiche peut contenir un nom (« cameleon »).
      const suffixe = v.fichier.slice(id.length);
      assert.doesNotMatch(suffixe, new RegExp(nom, 'i'), `${id} : ${v.fichier}`);
      assert.equal(v.fichier, `${id}--${v.sha256.slice(0, 16)}.m4a`);
    }
  }
});

test('un brouillon n’est pas sonorisé', () => {
  // Produire l'audio d'une fiche qui peut encore être rejetée, c'est payer pour rien.
  const f = fiche({ statut: 'brouillon' });
  assert.equal(aSonoriser(f, {}, ctx()), false);
});

test('une fiche sortie de circulation n’est pas sonorisée', () => {
  for (const statut of ['en_retouche', 'rejete']) {
    assert.equal(aSonoriser(fiche({ statut }), {}, ctx()), false, statut);
  }
});

test('le texte lu ne prononce ni les dièses ni les astérisques', () => {
  const lu = aLire(fiche({ contenu_vulgarise: '## Ce qu’il soutenait\n\nUn **point** net.' }));
  assert.doesNotMatch(lu, /[#*]/);
  assert.match(lu, /Ce qu’il soutenait/);
  assert.match(lu, /Un point net/);
});

test('les blocs restent séparés, parce que la pause en dépend', () => {
  // C'est cette ligne vide qui fait entendre qu'un titre de section commence — le point
  // que la relecture à l'oreille a explicitement validé.
  const lu = aLire(fiche({ contenu_vulgarise: '## Section\n\nCorps.' }));
  assert.match(lu, /\n\n/);
});

test('la citation est annoncée, le repère ne l’est pas', () => {
  const avecCitation = aLire(fiche({ citation: { texte: 'Mot.', auteur: 'Untel' } }));
  assert.match(avecCitation, /Citation\. Mot\. Untel\./);

  // Un repère n'est pas une parole rapportée : l'annoncer comme une citation
  // fabriquerait exactement ce que la ligne éditoriale interdit.
  const avecRepere = aLire(fiche({ repere: { texte: 'Un fait daté.' } }));
  assert.doesNotMatch(avecRepere, /Citation/);
  assert.match(avecRepere, /Un fait daté\./);
});

test('aucun marqueur de mise en forme ne part à la synthèse', () => {
  const lu = aLire(fiche({
    titre: 'Un *titre* en italique',
    contenu_vulgarise: '## Section\n\nUn **gras**, une *italique*, un `code`.',
    repere: { texte: 'Dans *Les Rites de passage*, 1909.' },
  }));
  assert.doesNotMatch(lu, /[*_`]/);
  // Sans espace inséré : « l'*italique* » doit rester un seul mot.
  assert.match(lu, /une italique/);
});

test('aucune fiche du dépôt ne laisse passer de marqueur', async () => {
  // Le cas s'est produit : 88 fiches sur 162 partaient avec les astérisques de l'italique
  // autour des titres d'ouvrage. Sur le corpus entier, c'était un demi-million de crédits
  // dépensés pour un catalogue à refaire.
  const { loadAll } = await import('../src/store.js');
  const fautives = (await loadAll())
    .filter((f) => ['valide', 'publie'].includes(f.statut))
    .filter((f) => /[*_`]/.test(aLire(f)))
    .map((f) => f.id);
  assert.deepEqual(fautives, []);
});

test('la production refuse le droit, même nommé à la main', async () => {
  const { sonoriser } = await import('../src/audio.js');
  await assert.rejects(sonoriser(fiche({ id: 'dro-test', discipline: 'droit_social' }), { ctx: ctx() }), /sans écoute/);
});

test('une discipline sans écoute ne rejoint jamais la file', () => {
  // « Pas d'audio pour le droit » ne peut pas tenir seulement à ne jamais lancer la
  // commande : la routine passe deux fois par jour et prendrait ces fiches comme les
  // autres. Le filtre est donc dans `aSonoriser`, en amont de tout le reste.
  const f = fiche({ id: 'dro-test', discipline: 'droit_conformite' });
  assert.equal(aSonoriser(f, {}, ctx()), false);
});

test('la discipline sans écoute sort aussi du dénominateur', async () => {
  // Si elle restait dans « publiables », le décompte afficherait ces fiches comme
  // sonorisées — et un retard réel se lirait comme de l'avance.
  const { SANS_ECOUTE } = await import('../src/schema.js');
  const { loadAll } = await import('../src/store.js');
  const fiches = await loadAll();
  const { file } = await import('../src/audio.js');
  const attendu = fiches.filter(
    (f) => ['valide', 'publie'].includes(f.statut) && !SANS_ECOUTE.has(f.discipline)).length;
  assert.equal((await file(ctx())).publiables, attendu);
});

test('les encres du schéma couvrent les trente-trois disciplines', async () => {
  // Le désaccord a existé : vingt-trois ici, trente-trois dans les clients. La
  // production croyait donc dix disciplines fermées alors que les apps les servaient.
  const { DISCIPLINES, ENCRES } = await import('../src/schema.js');
  const sansEncre = Object.keys(DISCIPLINES).filter((d) => !ENCRES[d]);
  assert.deepEqual(sansEncre, []);
});

test('les repères publiés s’alignent exactement sur les blocs du corps', async () => {
  // Le contrat de la transcription suivie tient tout entier ici : le client lit
  // `reperes[i]` pour son bloc `i`, sans rien apparier. Si les deux découpages
  // divergeaient sur une seule fiche, le texte suivrait la voix avec un décalage
  // silencieux — visible seulement à l'écoute, et sur cette fiche-là uniquement.
  const { fichesPubliables } = await import('../src/publier.js');
  const fautives = [];
  for (const f of await fichesPubliables()) {
    for (const nom of ['helene', 'jerome']) {
      const r = f.audio?.[nom]?.reperes;
      if (!r) continue;
      const blocs = (f.contenu_vulgarise ?? '').split('\n')
        .reduce((acc, ligne) => {
          if (!ligne.trim()) { acc.ouvert = false; return acc; }
          if (!acc.ouvert) acc.n += 1;
          acc.ouvert = true;
          return acc;
        }, { n: 0, ouvert: false }).n;
      if (r.length !== blocs) fautives.push(`${f.id}/${nom} : ${r.length} repères pour ${blocs} blocs`);
      // Un repère qui recule ferait sauter la surbrillance en arrière au milieu d'une phrase.
      for (let i = 1; i < r.length; i++) {
        if (r[i] < r[i - 1]) fautives.push(`${f.id}/${nom} : repère ${i} recule`);
      }
    }
  }
  assert.deepEqual(fautives, []);
});

// ── La prononciation (audio/prononciations.json) ────────────────────────────────────
//
// Une règle corrigée doit refaire les fiches qu'elle touche — et elles seules. Sinon le
// son garderait l'ancienne prononciation, et rien ne le signalerait : le même défaut
// silencieux que pour un texte corrigé.

const EICHMANN = { nom: 'Eichmann', dire: 'Aïchmann' };

test('sans règle, l’empreinte reste celle d’avant le dictionnaire', () => {
  const f = fiche({ contenu_vulgarise: 'Le procès d’Eichmann.' });
  assert.equal(empreinteAudio(f, []), empreinteAudio(f));
  assert.equal(empreinteAudio(f, [{ nom: 'Kant', dire: 'Kante' }]), empreinteAudio(f),
    'une règle qui ne touche pas la fiche ne change rien');
});

test('une règle qui touche la fiche change son empreinte, et la fait repasser en production', () => {
  const f = fiche({ contenu_vulgarise: 'Le procès d’Eichmann.' });
  const index = indexPour(f);                   // produit avant la règle
  assert.notEqual(empreinteAudio(f, [EICHMANN]), empreinteAudio(f));
  assert.equal(aSonoriser(f, index, ctx({ regles: [EICHMANN] })), true);
  assert.equal(motif(f, index, ctx({ regles: [EICHMANN] })), 'prononciation modifiée depuis');
});

test('corriger la réécriture d’une règle refait la fiche une seconde fois', () => {
  const f = fiche({ contenu_vulgarise: 'Le procès d’Eichmann.' });
  const corrigee = { nom: 'Eichmann', dire: 'Aïchemann' };
  assert.notEqual(empreinteAudio(f, [EICHMANN]), empreinteAudio(f, [corrigee]));
  const index = { [f.id]: { ...indexPour(f)[f.id], empreinte: empreinteAudio(f, [EICHMANN]) } };
  assert.equal(aSonoriser(f, index, ctx({ regles: [EICHMANN] })), false, 'à jour avec la règle connue');
  assert.equal(aSonoriser(f, index, ctx({ regles: [corrigee] })), true, 'à refaire avec la règle corrigée');
  assert.equal(motif(f, index, ctx({ regles: [corrigee] })), 'prononciation modifiée depuis');
});

test('la réécriture ne touche que le texte envoyé au moteur, jamais le texte lu à l’écran', async () => {
  const { aEnvoyer } = await import('../src/audio.js');
  const f = fiche({ contenu_vulgarise: 'Le procès d’Eichmann.' });
  assert.match(aEnvoyer(f, [EICHMANN]), /Aïchmann/);
  assert.doesNotMatch(aLire(f), /Aïchmann/);
  assert.match(aLire(f), /Eichmann/);
});

test('une règle ne s’applique qu’au nom entier, jamais à un morceau de mot', async () => {
  const { appliquer, reglesTouchant } = await import('../src/prononciation.js');
  const hertz = { nom: 'Hertz', dire: 'Hèrtse' };
  assert.equal(appliquer('83 kilohertz', [hertz]), '83 kilohertz');
  assert.equal(appliquer('Heinrich Hertz.', [hertz]), 'Heinrich Hèrtse.');
  assert.deepEqual(reglesTouchant('la morale kantienne', [{ nom: 'Kant', dire: 'Kante' }]), []);
});

test('le nom complet passe avant le nom seul', async () => {
  const { appliquer } = await import('../src/prononciation.js');
  const regles = [{ nom: 'Schnitzler', dire: 'Chnitsleur' }, { nom: 'Hans-Ulrich Schnitzler', dire: 'Hannss-Oulrich Chnitsleur' }];
  assert.equal(appliquer('Hans-Ulrich Schnitzler, puis Schnitzler.', regles), 'Hannss-Oulrich Chnitsleur, puis Chnitsleur.');
});

test('le droit reste sans écoute, même avec un dictionnaire de prononciation', () => {
  const f = fiche({ id: 'dro-test', discipline: 'droit_conformite', contenu_vulgarise: 'L’arrêt Eichmann.' });
  assert.equal(aSonoriser(f, {}, ctx({ regles: [EICHMANN] })), false);
});

test('une règle n’en réécrit jamais une autre, et l’empreinte ne compte que celles qui ont agi', async () => {
  const { appliquer, reglesTouchant } = await import('../src/prononciation.js');
  const regles = [{ nom: 'Schnitzler', dire: 'Chnitsleur' }, { nom: 'Hans-Ulrich Schnitzler', dire: 'Hannss-Oulrich Schnitzler' }];
  // Le « dire » du nom complet garde « Schnitzler » : il ne doit pas être réécrit une seconde fois.
  assert.equal(appliquer('Hans-Ulrich Schnitzler.', regles), 'Hannss-Oulrich Schnitzler.');
  assert.deepEqual(reglesTouchant('Hans-Ulrich Schnitzler.', regles).map((r) => r.nom), ['Hans-Ulrich Schnitzler']);
});

test('un « $ » dans une réécriture n’est jamais interprété', async () => {
  const { appliquer } = await import('../src/prononciation.js');
  assert.equal(appliquer('Eichmann.', [{ nom: 'Eichmann', dire: 'A$&b$1' }]), 'A$&b$1.');
});

test('le dictionnaire versionné est sain : noms uniques, sans saut de ligne ni réécriture croisée', async () => {
  const { lireRegles, problemes } = await import('../src/prononciation.js');
  assert.deepEqual(problemes(await lireRegles()), []);
  assert.ok(problemes([{ nom: '', dire: 'x' }]).length, 'un nom vide est refusé');
  assert.ok(problemes([{ nom: 'A', dire: 'x' }, { nom: 'A', dire: 'y' }]).length, 'un doublon est refusé');
});
