/* =============================================================
   Anagnosis — application
   Tout est local : aucun appel réseau, aucun serveur. La progression vit dans
   localStorage. La synchronisation iCloud est prévue côté iOS natif (CloudKit) ;
   le web reste volontairement local seul, un navigateur ne pouvant pas y écrire.
   ============================================================= */
'use strict';

const CLE = 'anagnosis.etat.v1';
const FICHES = window.ANAGNOSIS_CONTENU.fiches;
const DISCIPLINES = window.ANAGNOSIS_CONTENU.disciplines;
const ENCRES = window.ANAGNOSIS_CONTENU.encres;
const JAUNE = '#FFE800';
const PAPIER_CLAIR = '#F4EFE1';

/* ---------- état ---------- */

const DEFAUT = {
  version: 1,
  onboarde: false,
  disciplines: [],
  heure: '08:10',
  debut: null,          // ISO du jour 0
  pseudo: '',
  premium: false,
  theme: 'auto',        // auto | clair | sombre
  materiau: 'riso',     // riso | verre
  journal: {},          // 'AAAA-MM-JJ' -> { id, quiz: index|null }
  record: 0,
};

let S = charger();
let vue = { onglet: 'jour', ecran: null, fiche: null, quiz: null };

function charger() {
  try {
    const brut = JSON.parse(localStorage.getItem(CLE) || '{}');
    return { ...DEFAUT, ...brut, journal: { ...(brut.journal || {}) } };
  } catch { return { ...DEFAUT }; }
}
function sauver() {
  try { localStorage.setItem(CLE, JSON.stringify(S)); }
  catch { toast('Stockage indisponible — la progression ne sera pas conservée'); }
}

/* ---------- dates ---------- */

const jourISO = (d = new Date()) => {
  const x = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return x.toISOString().slice(0, 10);
};
const depuisISO = (s) => { const [a, m, j] = s.split('-').map(Number); return new Date(a, m - 1, j); };
const ajouterJours = (iso, n) => { const d = depuisISO(iso); d.setDate(d.getDate() + n); return jourISO(d); };
const ecartJours = (a, b) => Math.round((depuisISO(b) - depuisISO(a)) / 86400000);

const FR_JOUR = ['dim', 'lun', 'mar', 'mer', 'jeu', 'ven', 'sam'];
const FR_MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet',
  'août', 'septembre', 'octobre', 'novembre', 'décembre'];
const dateLongue = (iso) => {
  const d = depuisISO(iso);
  return `${FR_JOUR[d.getDay()]} ${d.getDate()} ${FR_MOIS[d.getMonth()]}`;
};

/* ---------- corpus et attribution des jours ---------- */

/** Mélange déterministe : la même sélection donne toujours la même suite. */
function graine(txt) {
  let h = 2166136261;
  for (let i = 0; i < txt.length; i++) { h ^= txt.charCodeAt(i); h = Math.imul(h, 16777619); }
  return () => { h += 0x6D2B79F5; let t = h; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

function corpus() {
  const choisies = S.disciplines.length ? S.disciplines : Object.keys(DISCIPLINES);
  const liste = FICHES.filter((f) => choisies.includes(f.discipline));
  const rnd = graine(choisies.slice().sort().join('|'));
  const c = liste.slice();
  for (let i = c.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [c[i], c[j]] = [c[j], c[i]]; }
  return c;
}

const indexDuJour = () => (S.debut ? Math.max(0, ecartJours(S.debut, jourISO())) : 0);
function ficheDuJourIndex(n) { const c = corpus(); return c.length ? c[n % c.length] : null; }
const ficheDuJour = () => ficheDuJourIndex(indexDuJour());
function ficheDeLaDate(iso) {
  if (!S.debut) return null;
  const n = ecartJours(S.debut, iso);
  return n < 0 ? null : ficheDuJourIndex(n);
}

/* ---------- règles d'accès ---------- */

const LIBRE_RETRO = 3;   // jours passés consultables sans Premium

function estLu(iso) { return Boolean(S.journal[iso]); }
function accessible(iso) {
  const aujourd = jourISO();
  const n = ecartJours(iso, aujourd);
  if (n < 0) return false;                 // futur
  if (n === 0) return true;                // aujourd'hui
  if (S.premium) return true;              // archive complète
  return n <= LIBRE_RETRO;                 // fenêtre gratuite
}

function serie() {
  let n = 0;
  let curseur = jourISO();
  if (!estLu(curseur)) curseur = ajouterJours(curseur, -1);
  while (estLu(curseur)) { n++; curseur = ajouterJours(curseur, -1); }
  return n;
}

function lues() {
  return Object.entries(S.journal)
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([iso, e]) => ({ iso, fiche: FICHES.find((f) => f.id === e.id) }))
    .filter((x) => x.fiche);
}

/* ---------- rendu : utilitaires ---------- */

const $ = (sel, ctx = document) => ctx.querySelector(sel);
const esc = (s = '') => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
  .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const encreDe = (d) => ENCRES[d] || '#3D5588';
const nomDe = (d) => DISCIPLINES[d] || d;

function markdown(md = '') {
  return md.split(/\n{2,}/).map((b) => b.trim()).filter(Boolean).map((b) => {
    const inl = (s) => esc(s).replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/\*([^*]+)\*/g, '<em>$1</em>');
    return b.startsWith('## ') ? `<h3>${inl(b.slice(3))}</h3>` : `<p>${inl(b)}</p>`;
  }).join('');
}

let minuteurToast;
function toast(msg) {
  const t = $('#toast');
  t.textContent = msg; t.classList.add('on');
  clearTimeout(minuteurToast);
  minuteurToast = setTimeout(() => t.classList.remove('on'), 2200);
}

/* ---------- champ d'encre : les six opérations ---------- */
/* systeme-illustration.md §3 — la forme dit le concept. Grille 8x8, hors-repérage
   constant porté par l'encre de discipline, jamais par le noir. */

function champEncre(fiche, hauteur = 'champ') {
  const op = (fiche.illustration && fiche.illustration.operation) || operationParDefaut(fiche);
  const e = encreDe(fiche.discipline);
  return `<div class="${hauteur}" aria-hidden="true">${FORMES[op](e)}</div>`;
}

function operationParDefaut(f) {
  const ops = Object.keys(FORMES);
  let h = 0;
  for (const c of f.id) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return ops[h % ops.length];
}

const bloc = (x, y, w, h, c, o = 1, dec = false) =>
  `<span class="aplat" style="left:${x}%;top:${y}%;width:${w}%;height:${h}%;background:${c};opacity:${o}${dec ? ';transform:translate(2px,3px)' : ''}"></span>`;
const disque = (x, y, t, c, o = 1) =>
  `<span class="aplat" style="left:${x}%;top:${y}%;width:${t}%;aspect-ratio:1;border-radius:50%;background:${c};opacity:${o}"></span>`;
const anneau = (x, y, t, c, ep = 7) =>
  `<span class="aplat" style="left:${x}%;top:${y}%;width:${t}%;aspect-ratio:1;border-radius:50%;border:${ep}px solid ${c};opacity:.9"></span>`;
const trame = (x, y, w, h, c, pas = 13, r = 3) =>
  `<span class="aplat" style="left:${x}%;top:${y}%;width:${w}%;height:${h}%;opacity:.9;background-image:radial-gradient(${c} ${r}px,transparent ${r + .5}px);background-size:${pas}px ${pas}px"></span>`;

const FORMES = {
  /* conformité, norme, exception */
  repetition_ecart: (e) => {
    let s = '';
    for (let i = 0; i < 5; i++) for (let j = 0; j < 3; j++) {
      const hors = (i === 2 && j === 1);
      s += bloc(6 + i * 18, 8 + j * 30, 14, 24, hors ? JAUNE : e, hors ? .95 : .88, !hors);
    }
    return s + bloc(6 + 2 * 18 + 3, 8 + 30 + 4, 9, 16, e, .85);
  },
  /* accumulation, seuil, inégalité */
  densite_graduee: (e) =>
    trame(4, 14, 22, 66, e, 16, 2) + trame(28, 14, 22, 66, e, 12, 3) +
    trame(52, 14, 20, 66, e, 9, 3.5) + bloc(74, 14, 22, 66, e, .9, true),
  /* propagation, émission, décalage */
  concentricite_decalee: (e) =>
    anneau(28, -34, 76, e, 9) + anneau(38, -12, 56, e, 8) + anneau(46, 8, 38, e, 7) +
    disque(56, 30, 12, JAUNE, .95),
  /* énumération, coupure, diagonale */
  partition: (e) => {
    let s = '';
    for (let i = 0; i < 6; i++) s += bloc(5 + i * 15.5, 12 + i * 11, 12, 22, e, .86, true);
    return s + `<span class="aplat" style="left:0;top:46%;width:100%;height:4px;background:${JAUNE};opacity:.95"></span>`;
  },
  /* deux états dans un même objet */
  recouvrement: (e) =>
    bloc(10, 16, 40, 58, e, .88, true) + bloc(34, 28, 40, 58, JAUNE, .92) + bloc(52, 12, 34, 50, e, .8),
  /* proportion, révision d'un chiffre */
  rapport: (e) =>
    bloc(6, 22, 26, 52, e, .9, true) + bloc(36, 40, 20, 34, e, .55) +
    trame(60, 16, 34, 64, e, 11, 3),
};

/* ---------- écrans ---------- */

function ecranOnboarding() {
  const etape = vue.etape || 1;
  if (etape === 1) {
    return `<div class="ecran sans-barre"><div class="defile"><div class="bloc" style="padding-top:12vh">
      <p class="sur-titre">Anagnosis</p>
      <h1 class="titre-xl" style="margin-top:16px">Un concept<br>par jour.</h1>
      <p class="accroche" style="margin-top:20px;max-width:32ch">Une notion expliquée en trois minutes,
      illustrée, et sourcée. Un seul concept par jour — c'est le principe, pas une limite technique.</p>
      <div style="margin-top:40px">${champEncre(FICHES[0], 'champ haut')}</div>
      <button class="cta" style="margin-top:32px" data-act="etape2">Choisir mes disciplines</button>
    </div></div></div>`;
  }
  const tuiles = Object.keys(DISCIPLINES)
    .filter((d) => FICHES.some((f) => f.discipline === d))
    .map((d) => `<button class="tuile" data-disc="${d}" style="--t-enc:${encreDe(d)}"
      aria-pressed="${S.disciplines.includes(d)}"><span class="puce"></span>${esc(nomDe(d))}</button>`).join('');
  const n = S.disciplines.length;
  return `<div class="ecran sans-barre"><div class="defile"><div class="bloc" style="padding-top:6vh">
    <p class="sur-titre">Étape 2 sur 2</p>
    <h1 class="titre-l" style="margin-top:12px">Qu'est-ce que vous voulez comprendre&nbsp;?</h1>
    <p class="discret" style="margin-top:12px">Trois disciplines au moins, pour que la suite reste variée.</p>
    <div class="tuiles">${tuiles}</div>
    <p class="sur-titre" style="margin-top:32px;color:var(--texte-3)">Heure de la notification</p>
    <input class="champ-heure" type="time" id="heure" value="${esc(S.heure)}">
    <button class="cta" style="margin-top:24px" data-act="demarrer" ${n ? '' : 'disabled'}>
      Commencer demain matin<span class="app">${n} choisie${n > 1 ? 's' : ''}</span>
    </button>
    <button class="cta creux" style="margin-top:8px" data-act="commencer-maintenant" ${n ? '' : 'disabled'}>
      Commencer tout de suite
    </button>
  </div></div></div>`;
}

function ecranJour() {
  const f = ficheDuJour();
  if (!f) return `<div class="ecran"><div class="defile"><div class="bloc" style="padding-top:12vh">
    <h1 class="titre-l">Aucun concept</h1><p class="discret" style="margin-top:12px">Activez au moins une discipline dans les réglages.</p>
  </div></div></div>${barreOnglets()}`;

  const iso = jourISO();
  const lu = estLu(iso);
  return `<div class="ecran"><div class="defile">
    ${champEncre(f, 'champ haut')}
    <div class="bloc" style="padding-top:20px">
      <p class="sur-titre">${esc(dateLongue(iso))} · jour ${indexDuJour() + 1}</p>
      <h1 class="titre-l" style="margin-top:10px">${esc(f.titre)}</h1>
      <p class="accroche" style="margin-top:12px">${esc(f.accroche)}</p>
      <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:16px">
        <span class="etiq pleine">${esc(nomDe(f.discipline))}</span>
        <span class="etiq">${esc(f.niveau)}</span>
        <span class="etiq">${f.duree_lecture_min} min</span>
      </div>
      <button class="cta" style="margin-top:24px" data-act="lire" data-id="${esc(f.id)}">${lu ? 'Relire' : 'Lire'}</button>
      ${lu ? `<button class="cta creux" style="margin-top:8px" data-act="verrou">Voir le prochain concept</button>` : ''}
      <p class="discret" style="margin-top:24px">Série en cours&nbsp;: <b>${serie()}</b> jour${serie() > 1 ? 's' : ''}</p>
    </div>
  </div></div>${barreOnglets()}`;
}

function ecranLecture() {
  const f = vue.fiche;
  const enc = f.citation
    ? `<div class="encadre"><p>«&#8239;${esc(f.citation.texte)}&#8239;»</p><cite>${esc(f.citation.auteur)} — ${esc(f.citation.source)}</cite></div>`
    : (f.repere ? `<div class="encadre"><p>${esc(f.repere.texte)}</p><cite>${esc(f.repere.source)}</cite></div>` : '');
  const src = (f.sources || []).map((s) => `<li>${s.auteur ? esc(s.auteur) + ', ' : ''}<b>${esc(s.titre)}</b>${
    s.publication ? ', ' + esc(s.publication) : ''}${
    s.annee ? ', ' + (s.annee < 0 ? (-s.annee) + ' av. J.-C.' : s.annee) : ''}</li>`).join('');
  // La lecture garde la barre de menu — écrans §2 : c'est une destination, pas
  // une séquence. Seuls le quiz et la feuille de partage s'en passent.
  return `<div class="ecran">
    <header class="barre-titre">
      <div class="ligne">
        <button data-act="retour" aria-label="Retour" style="padding:4px 8px 4px 0"><svg class="glyphe" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 2 4 8l6 6"/></svg></button>
        <span class="pastille"></span>
        <span class="t">${esc(f.titre)}</span>
      </div>
      <div class="progression"><i id="prog" style="width:0%"></i></div>
    </header>
    <div class="defile" id="lecture">
      <div class="bloc" style="padding-top:20px">
        <p class="sur-titre">${esc(nomDe(f.discipline))} · ${esc(f.niveau)}</p>
        <h1 class="titre-l" style="margin-top:10px">${esc(f.titre)}</h1>
        <p class="accroche" style="margin-top:12px">${esc(f.accroche)}</p>
      </div>
      ${champEncre(f)}
      <div class="bloc" style="padding-top:20px">
        <div class="fiche-corps">${markdown(f.contenu_vulgarise)}</div>
        ${enc}
        <div class="sources"><h4 class="sur-titre" style="color:var(--texte-3)">Sources vérifiées</h4><ol>${src}</ol></div>
        <div style="margin-top:32px">
          ${f.quiz ? `<button class="cta creux" data-act="quiz">Quiz — facultatif</button>` : ''}
          <button class="cta encre" style="margin-top:8px" data-act="partage">Partager cette idée</button>
        </div>
      </div>
    </div>
  </div>${barreOnglets()}`;
}

function ecranQuiz() {
  const f = vue.fiche, q = f.quiz, rep = vue.quiz;
  const opts = q.choix.map((c, i) => {
    let etat = '';
    if (rep !== null && rep !== undefined) etat = i === q.bonne_reponse ? 'bon' : 'rate';
    return `<button class="choix" data-choix="${i}"${etat ? ` data-etat="${etat}"` : ''}>${esc(c)}</button>`;
  }).join('');
  return `<div class="ecran sans-barre"><div class="defile"><div class="bloc" style="padding-top:24px">
    <p class="sur-titre">Quiz · facultatif</p>
    <h1 class="titre-m" style="margin-top:12px;font-size:21px">${esc(q.question)}</h1>
    <div style="margin-top:20px">${opts}</div>
    ${rep !== null && rep !== undefined
      ? `<div class="explication"><h4>Pourquoi les autres sont fausses</h4>${esc(q.explication)}</div>
         <p class="discret mono" style="margin-top:16px;text-align:center">Le quiz ne compte pas dans votre série</p>`
      : ''}
    <button class="cta creux" style="margin-top:24px" data-act="retour-fiche">Retour à la fiche</button>
  </div></div></div>`;
}

function ecranCalendrier() {
  if (!S.debut) return ecranJour();
  const aujourd = jourISO();
  const debutGrille = ajouterJours(aujourd, -34);
  let cases = '';
  for (let i = 0; i < 35; i++) {
    const iso = ajouterJours(debutGrille, i);
    const f = ficheDeLaDate(iso);
    const lu = estLu(iso);
    const futur = ecartJours(iso, aujourd) < 0;
    const dispo = accessible(iso);
    const cls = ['jour', lu ? 'lu' : '', iso === aujourd ? 'aujourdhui' : '',
      futur ? 'futur' : (!dispo ? 'verrou' : '')].filter(Boolean).join(' ');
    const enc = lu && f ? encreDe(f.discipline) : '';
    cases += `<button class="${cls}" ${enc ? `style="--jour-enc:${enc}"` : ''}
      data-jour="${iso}" ${futur || !f ? 'disabled' : ''}
      aria-label="${esc(dateLongue(iso))}${lu ? ', lu' : dispo ? '' : ', verrouillé'}">${depuisISO(iso).getDate()}</button>`;
  }
  const verrouilles = Object.keys(S.journal).filter((iso) => !accessible(iso)).length;
  return `<div class="ecran"><div class="defile"><div class="bloc" style="padding-top:24px">
    <p class="sur-titre">Calendrier</p>
    <h1 class="titre-l" style="margin-top:10px">Cinq semaines</h1>
    <p class="discret" style="margin-top:10px">Les jours remplis portent l'encre de la discipline lue.</p>
    <div class="calendrier">${cases}</div>
    ${!S.premium ? `<div style="margin-top:28px;border:2px dashed var(--filet);padding:16px">
      <p class="titre-m">La consultation rétroactive est illimitée avec Premium</p>
      <p class="discret" style="margin-top:8px">Sans abonnement, les ${LIBRE_RETRO} derniers jours restent accessibles.
      ${verrouilles ? `<b>${verrouilles} jour${verrouilles > 1 ? 's' : ''}</b> déjà lu${verrouilles > 1 ? 's' : ''} ${verrouilles > 1 ? 'sont' : 'est'} hors de portée.` : ''}</p>
      <button class="cta" style="margin-top:12px" data-act="premium">Activer Premium (démo)</button>
    </div>` : ''}
  </div></div></div>${barreOnglets()}`;
}

function ecranArchive() {
  const L = lues();
  const lignes = L.map(({ iso, fiche }) => {
    const ok = accessible(iso);
    return `<button class="rangee ${ok ? '' : 'bloque'}" data-ouvrir="${esc(fiche.id)}" ${ok ? '' : 'disabled'}
      style="--enc:${encreDe(fiche.discipline)}">
      <span class="barre"></span>
      <span style="flex:1"><span class="t">${esc(fiche.titre)}</span>
      <span class="d">${esc(nomDe(fiche.discipline))} · ${esc(dateLongue(iso))}${ok ? '' : ' · verrouillé'}</span></span>
    </button>`;
  }).join('');
  return `<div class="ecran"><div class="defile"><div class="bloc" style="padding-top:24px">
    <p class="sur-titre">Archive</p>
    <h1 class="titre-l" style="margin-top:10px">${L.length} concept${L.length > 1 ? 's' : ''} lu${L.length > 1 ? 's' : ''}</h1>
    ${L.length ? lignes : '<p class="discret" style="margin-top:16px">Rien encore. Lisez le concept du jour.</p>'}
  </div></div></div>${barreOnglets()}`;
}

function ecranProfil() {
  const L = lues();
  const parD = {};
  L.forEach(({ fiche }) => { parD[fiche.discipline] = (parD[fiche.discipline] || 0) + 1; });
  const total = L.length || 1;
  const barres = Object.entries(parD).sort((a, b) => b[1] - a[1]).map(([d, n]) =>
    `<div style="margin-top:14px;--jauge-enc:${encreDe(d)}">
      <div style="display:flex;justify-content:space-between;font-size:13.5px"><span>${esc(nomDe(d))}</span>
      <span class="mono" style="font-size:10px">${Math.round(n / total * 100)}&nbsp;%</span></div>
      <div class="jauge"><i style="width:${n / total * 100}%"></i></div></div>`).join('');
  return `<div class="ecran"><div class="defile"><div class="bloc" style="padding-top:24px">
    <p class="sur-titre">Profil</p>
    <h1 class="compte" style="margin-top:6px">${serie()}</h1>
    <p class="discret" style="margin-top:-6px">jour${serie() > 1 ? 's' : ''} d'affilée</p>
    <div style="margin-top:24px">
      <div class="stat"><span>Record</span><b>${Math.max(S.record, serie())}</b></div>
      <div class="stat"><span>Concepts lus</span><b>${L.length}</b></div>
      <div class="stat"><span>Disciplines actives</span><b>${S.disciplines.length}</b></div>
    </div>
    ${barres ? `<p class="sur-titre" style="margin-top:32px;color:var(--texte-3)">Répartition</p>${barres}` : ''}
  </div></div></div>${barreOnglets()}`;
}

function ecranReglages() {
  const tuiles = Object.keys(DISCIPLINES)
    .filter((d) => FICHES.some((f) => f.discipline === d))
    .map((d) => `<button class="tuile" data-disc="${d}" style="--t-enc:${encreDe(d)}"
      aria-pressed="${S.disciplines.includes(d)}"><span class="puce"></span>${esc(nomDe(d))}</button>`).join('');
  const seg = (nom, cle, opts) => `<p class="sur-titre" style="margin-top:28px;color:var(--texte-3)">${nom}</p>
    <div class="segment">${opts.map(([v, l]) =>
      `<button data-reglage="${cle}" data-valeur="${v}" aria-pressed="${S[cle] === v}">${l}</button>`).join('')}</div>`;
  return `<div class="ecran"><div class="defile"><div class="bloc" style="padding-top:24px">
    <p class="sur-titre">Réglages</p>
    <h1 class="titre-l" style="margin-top:10px">Réglages</h1>
    <p class="sur-titre" style="margin-top:28px;color:var(--texte-3)">Disciplines</p>
    <div class="tuiles">${tuiles}</div>
    <p class="sur-titre" style="margin-top:28px;color:var(--texte-3)">Heure de la notification</p>
    <input class="champ-heure" type="time" id="heure" value="${esc(S.heure)}">
    ${seg('Apparence', 'theme', [['auto', 'Auto'], ['clair', 'Clair'], ['sombre', 'Sombre']])}
    ${seg('Barre de menu', 'materiau', [['riso', 'Aplat riso'], ['verre', 'Liquid Glass']])}
    <p class="sur-titre" style="margin-top:28px;color:var(--texte-3)">Pseudo sur les cartes partagées</p>
    <input class="champ-heure" type="text" id="pseudo" placeholder="@votrepseudo" value="${esc(S.pseudo)}" maxlength="20">
    ${seg('Abonnement (démo)', 'premium', [[false, 'Gratuit'], [true, 'Premium']])}
    <button class="cta creux" style="margin-top:32px" data-act="reset">Tout réinitialiser</button>
    <p class="discret mono" style="margin-top:16px;font-size:9.5px;line-height:1.8">
      Progression stockée sur cet appareil uniquement.<br>Aucun serveur, aucun compte, aucun suivi.
    </p>
  </div></div></div>${barreOnglets()}`;
}

function ecranVerrou() {
  const demain = ajouterJours(jourISO(), 1);
  const f = ficheDeLaDate(demain);
  return `<div class="ecran"><div class="defile"><div class="bloc" style="padding-top:10vh;text-align:center">
    <p class="sur-titre">Prochain concept dans</p>
    <p class="compte" id="compte">--:--:--</p>
    <p class="discret" style="margin-top:8px">${f ? esc(nomDe(f.discipline)) : ''} · ${esc(dateLongue(demain))}</p>
    <p class="accroche" style="margin-top:32px;max-width:28ch;margin-left:auto;margin-right:auto">
      Un seul concept par jour. C'est le principe, pas une limite technique.</p>
    <div style="margin-top:40px">${f ? champEncre(f) : ''}</div>
    <button class="cta creux" style="margin-top:32px" data-act="onglet-jour">Revenir à aujourd'hui</button>
  </div></div></div>${barreOnglets()}`;
}

function ecranPartage() {
  const f = vue.fiche;
  return `<div class="ecran sans-barre"><div class="defile"><div class="bloc" style="padding-top:24px">
    <p class="sur-titre">Partager</p>
    <h1 class="titre-m" style="margin-top:10px;font-size:22px">Carte composée sur l'appareil</h1>
    <div style="margin-top:20px"><canvas id="carte" class="apercu-carte" width="1080" height="1920"></canvas></div>
    <div class="segment" style="margin-top:16px">
      <button data-format="9:16" aria-pressed="true">Story 9:16</button>
      <button data-format="1:1" aria-pressed="false">Carré 1:1</button>
    </div>
    <button class="cta encre" style="margin-top:16px" data-act="envoyer">Partager l'image</button>
    <button class="cta creux" style="margin-top:8px" data-act="telecharger">Enregistrer</button>
    <button class="cta creux" style="margin-top:8px" data-act="retour-fiche">Retour</button>
    <p class="discret mono" style="margin-top:16px;font-size:9.5px;line-height:1.8;text-align:center">
      Image générée localement — aucun réseau.<br>Le crédit source n'est pas une option.
    </p>
  </div></div></div>`;
}

/* ---------- barre d'onglets ---------- */

const GLYPHES = {
  jour: '<rect x="2" y="2" width="11" height="11" fill="currentColor"/>',
  calendrier: '<g fill="currentColor"><rect x="1" y="1" width="3" height="3"/><rect x="6" y="1" width="3" height="3"/><rect x="11" y="1" width="3" height="3"/><rect x="1" y="6" width="3" height="3"/><rect x="6" y="6" width="3" height="3"/><rect x="11" y="6" width="3" height="3"/><rect x="1" y="11" width="3" height="3"/><rect x="6" y="11" width="3" height="3"/><rect x="11" y="11" width="3" height="3"/></g>',
  archive: '<g fill="currentColor"><rect x="1" y="2" width="13" height="2.4"/><rect x="1" y="6.5" width="13" height="2.4"/><rect x="1" y="11" width="13" height="2.4"/></g>',
  profil: '<circle cx="7.5" cy="7.5" r="6" fill="none" stroke="currentColor" stroke-width="2.4"/>',
  reglages: '<path d="M7.5 1 14 7.5 7.5 14 1 7.5Z" fill="none" stroke="currentColor" stroke-width="2.4"/>',
};
const ONGLETS = [['jour', "Aujourd'hui"], ['calendrier', 'Calendrier'], ['archive', 'Archive'],
  ['profil', 'Profil'], ['reglages', 'Réglages']];

function barreOnglets() {
  return `<nav class="onglets ${S.materiau === 'verre' ? 'verre' : ''}" role="tablist">${
    ONGLETS.map(([cle, lib]) => `<button role="tab" data-onglet="${cle}"
      ${vue.onglet === cle ? 'aria-current="page"' : ''} aria-label="${lib}">
      <svg class="glyphe" viewBox="0 0 15 15">${GLYPHES[cle]}</svg>
      <span class="lib">${lib}</span></button>`).join('')}</nav>`;
}

/* ---------- carte partageable (canvas) ---------- */
/* Décision DA §13 : l'image est composée sur l'appareil, ce qui permet d'y porter
   la série ou le pseudo. Zonage conforme à ecrans.md §1. */

function dessinerCarte(format = '9:16') {
  const cv = $('#carte'); if (!cv) return;
  const L = 1080, H = format === '1:1' ? 1080 : 1920;
  cv.width = L; cv.height = H;
  const g = cv.getContext('2d');
  const f = vue.fiche, c = f.carte, e = encreDe(f.discipline);
  const M = 72;

  g.fillStyle = PAPIER_CLAIR; g.fillRect(0, 0, L, H);

  // Zone d'encre : 0-35 % (charte : surimpression en multiply)
  g.save();
  g.globalCompositeOperation = 'multiply';
  g.globalAlpha = 0.88;
  const zh = H * 0.35;
  g.fillStyle = e;
  g.beginPath(); g.arc(L * 0.82, zh * 0.18, zh * 0.62, 0, Math.PI * 2); g.fill();
  g.fillStyle = JAUNE;
  g.beginPath(); g.arc(L * 0.66, zh * 0.30, zh * 0.44, 0, Math.PI * 2); g.fill();
  g.fillStyle = e; g.globalAlpha = 0.55;
  g.translate(2, 3);                                  // hors-repérage constant
  g.fillRect(M, zh * 0.30, 150, 150);
  g.restore();

  /** Découpe en lignes sans dessiner — permet de mesurer avant de composer. */
  const decouper = (txt, larg, police, taille) => {
    g.font = police.replace('__T__', taille);
    const mots = String(txt).split(' '); const out = []; let ligne = '';
    for (const m of mots) {
      const essai = ligne ? ligne + ' ' + m : m;
      if (g.measureText(essai).width > larg && ligne) { out.push(ligne); ligne = m; }
      else ligne = essai;
    }
    if (ligne) out.push(ligne);
    return out;
  };
  const poser = (lignes, x, y, taille, police, couleur, hauteurLigne) => {
    g.fillStyle = couleur; g.font = police.replace('__T__', taille);
    lignes.forEach((l, i) => g.fillText(l, x, y + i * hauteurLigne));
    return y + lignes.length * hauteurLigne;
  };

  // Punch : 35-55 %. Le corps s'adapte à la longueur (ecrans.md §1).
  const n = (c.punch || '').length;
  const tp = n > 80 ? 76 : n > 55 ? 90 : 118;
  const dispo = L - M * 2;
  const policeD = '800 __T__px "Bricolage Grotesque", system-ui, sans-serif';
  let y = poser(decouper(c.punch, dispo, policeD, tp), M, H * 0.36 + tp, tp, policeD, '#1B1A17', tp * 0.95);

  // Crédit : plancher fixe. C'est lui qui borne le texte, jamais l'inverse
  // (ecrans.md §1 — « c'est le crédit qui fixe le plancher »).
  const yc = H * 0.80;

  // Idée : 55-78 %, réduite si nécessaire pour ne jamais toucher le crédit.
  const policeC = '400 __T__px Newsreader, Georgia, serif';
  const yi = Math.max(y + 40, H * 0.57);
  const place = yc - 40 - yi;
  let ti = 40, hl = 58, lignes = decouper(c.idee, dispo, policeC, ti);
  while (lignes.length * hl > place && ti > 28) {
    ti -= 3; hl = Math.round(ti * 1.45); lignes = decouper(c.idee, dispo, policeC, ti);
  }
  poser(lignes, M, yi + ti, ti, policeC, '#2E2A27', hl);
  g.font = '600 26px "Martian Mono", ui-monospace, monospace';
  const w = g.measureText(c.source_courte).width;
  g.fillStyle = JAUNE; g.fillRect(M + 5, yc + 5, w + 40, 62);      // ombre d'encre dure
  g.fillStyle = e; g.fillRect(M, yc, w + 40, 62);
  g.fillStyle = PAPIER_CLAIR; g.fillText(c.source_courte, M + 20, yc + 41);

  // Marque
  const ym = H * 0.895;
  g.fillStyle = '#1B1A17'; g.fillRect(M, ym, L - M * 2, 3);
  g.font = '800 26px "Bricolage Grotesque", system-ui, sans-serif';
  g.fillStyle = '#1B1A17'; g.fillText('ANAGNOSIS', M, ym + 46);
  g.font = '400 22px "Martian Mono", ui-monospace, monospace';
  g.fillStyle = '#6B6559';
  const j = serie();
  const droite = S.pseudo || `SÉRIE ${j} JOUR${j > 1 ? 'S' : ''}`;
  g.fillText(droite, L - M - g.measureText(droite).width, ym + 46);

  // Grain, une seule fois sur la composition entière
  const img = g.getImageData(0, 0, L, H), d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const b = (Math.random() - 0.5) * 16;
    d[i] += b; d[i + 1] += b; d[i + 2] += b;
  }
  g.putImageData(img, 0, 0);
}

async function partagerCarte(telecharger = false) {
  const cv = $('#carte'); if (!cv) return;
  const blob = await new Promise((r) => cv.toBlob(r, 'image/png'));
  if (!blob) return toast('Génération impossible');
  const nom = `anagnosis-${vue.fiche.slug}.png`;
  const fichier = new File([blob], nom, { type: 'image/png' });
  if (!telecharger && navigator.canShare && navigator.canShare({ files: [fichier] })) {
    try { await navigator.share({ files: [fichier] }); return; }
    catch (e) { if (e.name === 'AbortError') return; }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = nom; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  toast('Image enregistrée');
}

/* ---------- rendu principal ---------- */

function appliquerTheme() {
  const sombre = S.theme === 'sombre'
    || (S.theme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.dataset.theme = sombre ? 'sombre' : 'clair';
  const f = vue.fiche || ficheDuJour();
  if (f) {
    document.documentElement.style.setProperty('--enc', encreDe(f.discipline));
  }
}

function rendre() {
  appliquerTheme();
  let html;
  if (!S.onboarde) html = ecranOnboarding();
  else if (vue.ecran === 'lecture') html = ecranLecture();
  else if (vue.ecran === 'quiz') html = ecranQuiz();
  else if (vue.ecran === 'partage') html = ecranPartage();
  else if (vue.ecran === 'verrou') html = ecranVerrou();
  else if (vue.onglet === 'calendrier') html = ecranCalendrier();
  else if (vue.onglet === 'archive') html = ecranArchive();
  else if (vue.onglet === 'profil') html = ecranProfil();
  else if (vue.onglet === 'reglages') html = ecranReglages();
  else html = ecranJour();

  $('#app').innerHTML = html + '<div class="grain"></div>';
  if (vue.ecran === 'partage') dessinerCarte(vue.format || '9:16');
  if (vue.ecran === 'verrou') lancerCompte();
  if (vue.ecran === 'lecture') suivreProgression();
}

let minuteurCompte;
function lancerCompte() {
  clearInterval(minuteurCompte);
  const tic = () => {
    const el = $('#compte'); if (!el) return clearInterval(minuteurCompte);
    const d = new Date(); const demain = new Date(d); demain.setHours(24, 0, 0, 0);
    const s = Math.max(0, Math.floor((demain - d) / 1000));
    el.textContent = [Math.floor(s / 3600), Math.floor(s / 60) % 60, s % 60]
      .map((x) => String(x).padStart(2, '0')).join(':');
  };
  tic(); minuteurCompte = setInterval(tic, 1000);
}

function suivreProgression() {
  const z = $('#lecture'); const p = $('#prog'); if (!z || !p) return;
  // `#lecture` n'a pas de hauteur contrainte : c'est le document qui défile.
  // Écouter la div ne déclenchait donc jamais rien, et le filet restait à 0 %.
  // On vise le défileur réel, quel qu'il soit — la zone si elle défile un jour.
  const zone = z.scrollHeight > z.clientHeight;
  const cible = zone ? z : window;
  const mesurer = () => {
    // Le rendu remplace le DOM sans prévenir : l'écouteur se retire lui-même
    // quand le filet qu'il pilote n'est plus dans la page.
    if (!p.isConnected) return cible.removeEventListener('scroll', mesurer);
    const pos = zone ? z.scrollTop : window.scrollY;
    const max = zone ? z.scrollHeight - z.clientHeight
      : document.documentElement.scrollHeight - window.innerHeight;
    p.style.width = (max > 0 ? Math.min(100, pos / max * 100) : 0) + '%';
  };
  cible.addEventListener('scroll', mesurer, { passive: true });
  mesurer();
}

/* ---------- interactions ---------- */

function ouvrirFiche(id) {
  const f = FICHES.find((x) => x.id === id); if (!f) return;
  const iso = jourISO();
  if (f.id === (ficheDuJour() || {}).id && !estLu(iso)) {
    S.journal[iso] = { id: f.id, quiz: null };
    S.record = Math.max(S.record, serie());
    sauver();
  }
  vue.fiche = f; vue.quiz = (S.journal[iso] || {}).quiz ?? null;
  vue.ecran = 'lecture'; rendre();
  const z = $('#lecture'); if (z) z.scrollTop = 0;
}

document.addEventListener('click', (ev) => {
  const el = ev.target.closest('[data-act],[data-onglet],[data-disc],[data-reglage],[data-choix],[data-ouvrir],[data-jour],[data-format]');
  if (!el) return;
  const { act, onglet, disc, reglage, valeur, choix, ouvrir, jour, format } = el.dataset;

  if (onglet) { vue.onglet = onglet; vue.ecran = null; vue.fiche = null; return rendre(); }

  if (disc) {
    S.disciplines = S.disciplines.includes(disc)
      ? S.disciplines.filter((d) => d !== disc) : [...S.disciplines, disc];
    sauver(); return rendre();
  }

  if (reglage) {
    S[reglage] = valeur === 'true' ? true : valeur === 'false' ? false : valeur;
    sauver(); return rendre();
  }

  if (format) { vue.format = format; dessinerCarte(format);
    document.querySelectorAll('[data-format]').forEach((b) =>
      b.setAttribute('aria-pressed', String(b.dataset.format === format)));
    return; }

  if (choix !== undefined) {
    if (vue.quiz !== null && vue.quiz !== undefined) return;
    vue.quiz = Number(choix);
    const iso = jourISO();
    if (S.journal[iso]) { S.journal[iso].quiz = vue.quiz; sauver(); }
    return rendre();
  }

  if (ouvrir) return ouvrirFiche(ouvrir);

  if (jour) {
    if (!accessible(jour)) return toast('Verrouillé — la consultation rétroactive est réservée à Premium');
    const f = ficheDeLaDate(jour); if (!f) return;
    vue.fiche = f; vue.quiz = (S.journal[jour] || {}).quiz ?? null;
    vue.ecran = 'lecture'; return rendre();
  }

  switch (act) {
    case 'etape2': vue.etape = 2; return rendre();
    case 'demarrer':
    case 'commencer-maintenant': {
      const h = $('#heure'); if (h) S.heure = h.value || S.heure;
      S.debut = act === 'demarrer' ? ajouterJours(jourISO(), -0) : jourISO();
      S.onboarde = true; sauver(); vue.onglet = 'jour'; return rendre();
    }
    case 'lire': return ouvrirFiche(el.dataset.id);
    case 'quiz': vue.ecran = 'quiz'; return rendre();
    case 'partage': vue.ecran = 'partage'; return rendre();
    case 'retour-fiche': vue.ecran = 'lecture'; return rendre();
    case 'retour': vue.ecran = null; vue.fiche = null; return rendre();
    case 'verrou': vue.ecran = 'verrou'; return rendre();
    case 'onglet-jour': vue.ecran = null; vue.onglet = 'jour'; return rendre();
    case 'envoyer': return partagerCarte(false);
    case 'telecharger': return partagerCarte(true);
    case 'premium': S.premium = true; sauver(); toast('Premium activé (démo)'); return rendre();
    case 'reset':
      if (confirm('Effacer toute la progression sur cet appareil ?')) {
        S = { ...DEFAUT }; sauver(); vue = { onglet: 'jour', ecran: null, fiche: null }; return rendre();
      }
      return;
  }
});

document.addEventListener('change', (ev) => {
  if (ev.target.id === 'heure') { S.heure = ev.target.value; sauver(); }
  if (ev.target.id === 'pseudo') { S.pseudo = ev.target.value.trim(); sauver(); }
});

window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
  if (S.theme === 'auto') rendre();
});

if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
}

rendre();
