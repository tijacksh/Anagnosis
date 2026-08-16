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
import { aSonoriser, motif, aLire, empreinteAudio, VOIX, LIMITE_CARACTERES, ALLURE } from '../src/audio.js';

/** Une fiche publiable minimale. */
function fiche(modifs = {}) {
  return {
    id: 'ant-test', statut: 'valide', discipline: 'anthropologie',
    titre: 'Titre', accroche: 'Accroche', contenu_vulgarise: 'Corps',
    sources: [{ titre: 'S', url: 'https://exemple.fr' }],
    ...modifs,
  };
}

/** Un index qui décrit exactement la fiche donnée, dans les deux voix. */
function indexPour(f, modifs = {}) {
  const voix = Object.fromEntries(VOIX.map((v) => [v.nom, {
    fichier: `${f.id}--${v.nom}.m4a`, genre: v.genre,
    sha256: 'a'.repeat(64), octets: 900_000, secondes: 200,
  }]));
  return {
    [f.id]: { empreinte: empreinteAudio(f), modele: 'eleven_v3', allure: ALLURE, voix, ...modifs },
  };
}

test('une fiche dont l’audio décrit le texte courant est à jour', () => {
  const f = fiche();
  assert.equal(aSonoriser(f, indexPour(f)), false);
});

test('une fiche jamais produite est à sonoriser', () => {
  assert.equal(aSonoriser(fiche(), {}), true);
});

test('un texte corrigé après coup fait repasser l’audio en production', () => {
  // Le cœur du fichier. L'index décrit l'ancien texte ; la fiche a été réparée depuis.
  // Sans cette détection, le son continuerait d'affirmer ce que la fiche a rétracté.
  const avant = fiche();
  const index = indexPour(avant);
  const apres = fiche({ contenu_vulgarise: 'Corps corrigé après un signalement' });

  assert.notEqual(empreinteAudio(apres), empreinteAudio(avant), 'le scénario suppose un texte modifié');
  assert.equal(aSonoriser(apres, index), true);
  assert.match(motif(apres, index), /modifié/);
});

test('une correction qui ne touche pas au fond ne redéclenche rien', () => {
  // `empreinteAudio` ne couvre pas les champs de service : y toucher ne doit pas coûter
  // 3 200 crédits et une voix potentiellement différente.
  const f = fiche();
  const index = indexPour(f);
  const servie = fiche({ statut: 'publie', meta: { vu: 12 } });
  assert.equal(aSonoriser(servie, index), false);
});

test('une correction de source, de carte ou de quiz ne redéclenche rien', () => {
  // Le piège précis que `empreinteAudio` existe pour éviter : un lien mort réparé, une
  // note de source corrigée, un distracteur de quiz retouché — rien de tout ça ne
  // change un seul mot de ce que `aLire()` prononce. Avant, ces corrections coûtaient
  // 3 200 crédits pour rien parce que l'audio réutilisait l'empreinte du contrôle, qui
  // couvre bien plus large que ce qui est lu à voix haute.
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
  assert.equal(aSonoriser(corrigee, index), false);
});

test('une allure de référence changée refait tout le catalogue', () => {
  // Une fiche à l'ancienne cadence au milieu des autres s'entend immédiatement : c'est
  // une incohérence de catalogue, pas une préférence de lecteur.
  const f = fiche();
  const ancien = indexPour(f, { allure: 1 });
  assert.equal(aSonoriser(f, ancien), true);
  assert.match(motif(f, ancien), new RegExp(String(ALLURE)));
});

test('une seule voix produite ne suffit pas', () => {
  const f = fiche();
  const index = indexPour(f);
  delete index[f.id].voix[VOIX[1].nom];
  assert.equal(aSonoriser(f, index), true);
  assert.match(motif(f, index), new RegExp(VOIX[1].nom));
});

test('un brouillon n’est pas sonorisé', () => {
  // Produire l'audio d'une fiche qui peut encore être rejetée, c'est payer pour rien.
  const f = fiche({ statut: 'brouillon' });
  assert.equal(aSonoriser(f, {}), false);
});

test('une fiche sortie de circulation n’est pas sonorisée', () => {
  for (const statut of ['en_retouche', 'rejete']) {
    assert.equal(aSonoriser(fiche({ statut }), {}), false, statut);
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

test('aucune fiche du dépôt ne dépasse la limite d’une requête', async () => {
  // Le choix de `eleven_v3` tient à ce que chaque fiche entre en une seule requête :
  // il ne sait pas recoudre la prosodie entre deux morceaux. Si une fiche franchit la
  // limite un jour, c'est la fiche qu'il faut raccourcir, pas le son qu'il faut couper.
  const { loadAll } = await import('../src/store.js');
  const trop = (await loadAll())
    .filter((f) => ['valide', 'publie'].includes(f.statut))
    .map((f) => ({ id: f.id, n: aLire(f).length }))
    .filter((f) => f.n > LIMITE_CARACTERES);
  assert.deepEqual(trop, []);
});

test('une discipline sans écoute ne rejoint jamais la file', () => {
  // « Pas d'audio pour le droit » ne peut pas tenir seulement à ne jamais lancer la
  // commande : la routine passe deux fois par jour et prendrait ces fiches comme les
  // autres. Le filtre est donc dans `aSonoriser`, en amont de tout le reste.
  const f = fiche({ id: 'dro-test', discipline: 'droit_conformite' });
  assert.equal(aSonoriser(f, {}), false);
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
  assert.equal((await file()).publiables, attendu);
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
