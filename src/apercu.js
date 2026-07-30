#!/usr/bin/env node
/**
 * Génère un aperçu cliquable de l'app à partir des fiches validées.
 *
 *   npm run apercu              → export/apercu.html (fichier autonome, à envoyer)
 *   npm run apercu -- --artifact → export/apercu-artifact.html (sans en-tête HTML)
 *
 * Ce n'est PAS le code de l'app : c'est une maquette jetable, produite par le
 * pipeline pour faire réagir des gens sur le contenu et la direction visuelle
 * avant d'écrire une ligne de Swift. Le fichier produit est autonome — aucune
 * dépendance, aucun appel réseau — donc envoyable par mail ou messagerie, et
 * ouvrable hors ligne par quelqu'un qui n'a accès à rien de ce projet.
 */
import { writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { loadAll, ROOT } from './store.js';
import { DISCIPLINES, DISCIPLINES_V1 } from './schema.js';

/** Encres par discipline — docs/direction-artistique.md §4.2 */
const ENCRES = {
  philosophie: '#3D5588',
  sociologie: '#914E72',
  anthropologie: '#FF6C2F',
  psychologie: '#765BA7',
  biologie: '#00A95C',
  medecine: '#FF665E',
  mathematiques: '#00838A',
  physique: '#0078BF',
  litterature: '#FF48B0',
};

const PAPIER = '#F4EFE1';
const NOIR = '#1B1A17';
const JAUNE = '#FFE800';

const fiches = (await loadAll())
  .filter((f) => ['valide', 'publie'].includes(f.statut) && DISCIPLINES_V1[f.discipline])
  .map(({ _path, validation, meta, sources, ...f }) => ({
    ...f,
    // On garde les sources : c'est le cœur du positionnement, la maquette
    // serait trompeuse sans elles.
    sources: sources.map((s) => ({
      auteur: s.auteur ?? null,
      titre: s.titre,
      publication: s.publication ?? null,
      annee: s.annee ?? null,
      url: s.url ?? null,
    })),
  }))
  .sort((a, b) => a.id.localeCompare(b.id));

const disciplinesPresentes = [...new Set(fiches.map((f) => f.discipline))]
  .sort((a, b) => DISCIPLINES[a].localeCompare(DISCIPLINES[b], 'fr'));

const CSS = `
*,*::before,*::after{box-sizing:border-box}
body{margin:0;background:#15131A;color:#E8E4EC;
  font-family:ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;
  font-size:15px;line-height:1.6;-webkit-font-smoothing:antialiased}
button{font:inherit;cursor:pointer;border:0;background:none;color:inherit}
h1,h2,h3,p{margin:0}

/* ---- cadre de démonstration ---- */
.demo{max-width:1000px;margin:0 auto;padding:26px 18px 60px}
.demo-head{display:flex;flex-wrap:wrap;gap:16px;align-items:flex-end;justify-content:space-between;
  padding-bottom:18px;border-bottom:1px solid #2C2833;margin-bottom:22px}
.demo-head h1{font-size:20px;font-weight:800;letter-spacing:-.02em}
.demo-head p{font-size:13px;color:#9A93A6;max-width:56ch;margin-top:6px}
.demo-ctl{display:flex;gap:8px;flex-wrap:wrap}
.demo-ctl button{font-size:12.5px;font-weight:600;padding:8px 14px;border:1px solid #3A3546;
  border-radius:6px;color:#C9C2D4}
.demo-ctl button:hover{border-color:#6E6580;color:#fff}
.demo-ctl button:focus-visible{outline:2px solid ${JAUNE};outline-offset:2px}
.stage{display:flex;justify-content:center}

/* ---- appareil ---- */
.phone{width:390px;max-width:100%;height:812px;max-height:calc(100vh - 190px);min-height:600px;
  border:10px solid #24202D;border-radius:42px;overflow:hidden;position:relative;
  background:${PAPIER};box-shadow:0 24px 60px rgba(0,0,0,.5)}
@media(max-width:520px){
  .demo{padding:12px 0 0}
  .demo-head{padding:0 14px 14px}
  .phone{width:100%;height:calc(100vh - 150px);border-radius:0;border-width:0;border-top:1px solid #24202D}
}
.screen{position:absolute;inset:0;display:flex;flex-direction:column;color:${NOIR};overflow:hidden}
.scroll{flex:1;overflow-y:auto;overscroll-behavior:contain;-webkit-overflow-scrolling:touch}
.grain{position:absolute;inset:0;pointer-events:none;z-index:5;opacity:.36;
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='90' height='90'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.84' numOctaves='3'/%3E%3C/filter%3E%3Crect width='90' height='90' filter='url(%23n)' opacity='.3'/%3E%3C/svg%3E")}

/* ---- barre d'onglets ---- */
.tabs{display:flex;border-top:2px solid ${NOIR};background:${PAPIER};flex:0 0 auto}
.tabs button{flex:1;padding:12px 6px 16px;font-size:10.5px;font-weight:800;letter-spacing:.1em;
  text-transform:uppercase;color:#8A8375;display:flex;flex-direction:column;align-items:center;gap:5px}
.tabs button .dot{width:7px;height:7px;border-radius:50%;background:transparent}
.tabs button[aria-current="page"]{color:${NOIR}}
.tabs button[aria-current="page"] .dot{background:var(--enc)}

/* ---- écrans ---- */
.pad{padding:22px 22px 30px}
.eyebrow{font-size:10px;font-weight:800;letter-spacing:.15em;text-transform:uppercase;color:var(--enc)}
.big{font-weight:800;letter-spacing:-.035em;line-height:1.02;font-size:32px;margin-top:10px}
.sub{font-size:14.5px;color:#4E4A40;margin-top:12px;line-height:1.55}

/* onboarding */
.chips{display:flex;flex-wrap:wrap;gap:8px;margin-top:22px}
.chips button{padding:9px 14px;border:2px solid ${NOIR};border-radius:4px;font-size:13px;font-weight:700}
.chips button[aria-pressed="true"]{background:var(--c);color:${PAPIER};border-color:var(--c)}
.cta{width:100%;margin-top:26px;padding:15px;border-radius:6px;background:${NOIR};color:${PAPIER};
  font-size:15px;font-weight:800;letter-spacing:-.01em}
.cta:disabled{opacity:.32;cursor:not-allowed}
.cta.ghost{background:none;color:${NOIR};border:2px solid ${NOIR}}

/* carte du jour */
.today-art{height:180px;position:relative;overflow:hidden;isolation:isolate;flex:0 0 auto}
.ink{position:absolute;mix-blend-mode:multiply;border-radius:50%;pointer-events:none}
.today-art .i1{width:214px;height:214px;background:var(--enc);top:-72px;right:-54px;opacity:.9}
.today-art .i2{width:160px;height:160px;background:${JAUNE};top:-34px;right:16px;opacity:.9}
.today-art .i3{width:96px;height:96px;border-radius:8px;background:var(--enc);bottom:-30px;left:18px;
  opacity:.55;transform:rotate(-17deg)}
.today-art .i4{width:52px;height:52px;border-radius:6px;background:${JAUNE};top:34px;left:-14px;
  opacity:.85;transform:rotate(12deg)}
.meta{display:flex;gap:7px;flex-wrap:wrap;margin-top:16px}
.tag{font-size:9.5px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;
  padding:4px 9px;border:1.5px solid #C9C0AC;border-radius:3px;color:#5E5849}
.tag.enc{background:var(--enc);border-color:var(--enc);color:${PAPIER}}

/* lecture */
.read h2{font-weight:800;letter-spacing:-.03em;line-height:1.08;font-size:27px}
.read .acc{font-family:ui-serif,Georgia,serif;font-style:italic;font-size:16px;color:#4E4A40;
  margin-top:11px;line-height:1.45}
.body{font-family:ui-serif,"Iowan Old Style",Palatino,Georgia,serif;font-size:16.5px;line-height:1.68;
  margin-top:22px;color:#231F1A}
.body p{margin:0 0 15px}
.body h3{font-family:inherit;font-size:12.5px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;
  color:var(--enc);margin:26px 0 9px}
.pull{margin:24px 0 0;padding:16px 18px;border-left:4px solid var(--enc);background:rgba(0,0,0,.035)}
.pull p{font-family:ui-serif,Georgia,serif;font-size:16px;line-height:1.5}
.pull cite{display:block;margin-top:9px;font-family:inherit;font-size:12px;color:#5E5849;font-style:normal}
.srcs{margin-top:26px;padding-top:18px;border-top:2px solid ${NOIR}}
.srcs h4{font-size:10px;font-weight:800;letter-spacing:.13em;text-transform:uppercase;color:#8A8375;margin-bottom:10px}
.srcs ol{margin:0;padding-left:17px;font-size:12.5px;line-height:1.5;color:#4E4A40}
.srcs li{margin-bottom:8px}
.srcs b{color:${NOIR}}
.actions{display:flex;gap:9px;margin-top:24px}
.actions button{flex:1;padding:14px;border-radius:6px;font-size:13.5px;font-weight:800}
.act-q{background:${NOIR};color:${PAPIER}}
.act-s{background:var(--enc);color:${PAPIER}}

/* quiz */
.qopt{display:block;width:100%;text-align:left;padding:14px 16px;border:2px solid ${NOIR};
  border-radius:6px;margin-bottom:9px;font-size:14px;line-height:1.4}
.qopt[data-etat="bon"]{background:#1E7A5E;border-color:#1E7A5E;color:${PAPIER}}
.qopt[data-etat="mauvais"]{background:#B4382A;border-color:#B4382A;color:${PAPIER}}
.qexp{margin-top:16px;padding:15px 16px;background:rgba(0,0,0,.045);border-radius:6px;
  font-size:13.5px;line-height:1.55;color:#3A3630}

/* carte partageable */
.share-wrap{padding:20px;display:flex;flex-direction:column;align-items:center;gap:16px}
.share{width:100%;max-width:300px;aspect-ratio:9/16;border-radius:14px;padding:26px 22px;
  position:relative;overflow:hidden;background:${PAPIER};isolation:isolate;display:flex;flex-direction:column}
.share .i1{width:186px;height:186px;background:var(--enc);top:-66px;right:-52px;opacity:.9}
.share .i2{width:146px;height:146px;background:${JAUNE};top:-34px;right:6px;opacity:.92}
.share .i3{width:74px;height:74px;border-radius:6px;background:var(--enc);top:6px;left:-26px;
  opacity:.55;transform:rotate(21deg)}
.share .sct{position:relative;z-index:2;display:flex;flex-direction:column;height:100%}
/* Réserve haute pour l'encre : le punch ne doit jamais la percuter. */
.share .zone{flex:0 0 29%}
.share .p{font-weight:800;letter-spacing:-.03em;line-height:1.06;font-size:25px}
.share .i{font-family:ui-serif,Georgia,serif;font-size:13.5px;line-height:1.55;margin-top:15px;color:#2E2A27}
.share .f{margin-top:auto;display:flex;flex-direction:column;gap:7px}
.share .s{font-family:ui-monospace,Menlo,monospace;font-size:9px;font-weight:700;background:var(--enc);
  color:${PAPIER};padding:6px 9px;align-self:flex-start;box-shadow:2px 3px 0 ${JAUNE}}
.share .b{font-size:9.5px;font-weight:800;letter-spacing:.22em;text-transform:uppercase;color:#6B6559}

/* archive & profil */
.lock{margin-top:20px;padding:16px 18px;border:2px dashed #C9C0AC;border-radius:8px;
  font-size:13px;color:#5E5849;line-height:1.5}
.lock b{color:${NOIR}}
.row{display:flex;align-items:center;gap:12px;padding:13px 0;border-bottom:1px solid #DDD4BE;
  width:100%;text-align:left}
.row .bar{width:4px;align-self:stretch;border-radius:2px;background:var(--c);flex:0 0 auto}
.row .t{font-size:14.5px;font-weight:600;line-height:1.3}
.row .d{font-size:11px;color:#7A7365;margin-top:2px}
.stat{display:flex;justify-content:space-between;align-items:baseline;padding:11px 0;border-bottom:1px solid #DDD4BE}
.stat b{font-size:26px;font-weight:800;letter-spacing:-.03em}
.dist{margin-top:20px}
.dist .l{display:flex;justify-content:space-between;font-size:12.5px;margin:11px 0 5px}
.dist .g{height:9px;border-radius:5px;background:#E2D9C4;overflow:hidden}
.dist .g i{display:block;height:100%;background:var(--c)}
.toast{position:absolute;left:50%;bottom:88px;transform:translateX(-50%);z-index:20;
  background:${NOIR};color:${PAPIER};padding:11px 18px;border-radius:6px;font-size:13px;font-weight:600;
  opacity:0;transition:opacity .2s;pointer-events:none;white-space:nowrap}
.toast.on{opacity:1}
@media (prefers-reduced-motion:reduce){*{transition:none!important}}
`;

const JS = `
const FICHES = __DATA__;
const DISCIPLINES = __DISC__;
const ENCRES = __ENC__;
const CLE = 'epignosis-apercu-v1';

const defaut = { onboarde:false, actives:[], jour:0, vues:[], quiz:{} };
let S = { ...defaut, ...JSON.parse(localStorage.getItem(CLE) || '{}') };
let onglet = 'jour', vue = null, quizRep = null;

const sauver = () => localStorage.setItem(CLE, JSON.stringify(S));
const esc = (s='') => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const enc = (d) => ENCRES[d] || '#3D5588';

function corpus() {
  const f = FICHES.filter(x => S.actives.includes(x.discipline));
  return f.length ? f : FICHES;
}
function duJour() { const c = corpus(); return c[S.jour % c.length]; }
function vuesFiches() { return S.vues.map(id => FICHES.find(f => f.id === id)).filter(Boolean); }

function md(t) {
  return t.split(/\\n{2,}/).map(b => b.trim()).filter(Boolean).map(b => {
    const i = (s) => esc(s).replace(/\\*\\*([^*]+)\\*\\*/g,'<strong>$1</strong>').replace(/\\*([^*]+)\\*/g,'<em>$1</em>');
    return b.startsWith('## ') ? '<h3>'+i(b.slice(3))+'</h3>' : '<p>'+i(b)+'</p>';
  }).join('');
}

function ecranOnboarding() {
  return '<div class="scroll"><div class="pad">'
    + '<p class="eyebrow">Bienvenue</p>'
    + '<h1 class="big">Un concept<br>par jour.</h1>'
    + '<p class="sub">Choisissez les disciplines qui vous intéressent. Vous recevrez chaque jour une notion '
    + 'expliquée en trois minutes, illustrée, et sourcée.</p>'
    + '<div class="chips">' + DISCIPLINES.map(d =>
        '<button data-disc="'+d.cle+'" style="--c:'+enc(d.cle)+'" aria-pressed="'+S.actives.includes(d.cle)+'">'
        + esc(d.nom) + '</button>').join('') + '</div>'
    + '<button class="cta" id="go" '+(S.actives.length?'':'disabled')+'>'
    + (S.actives.length ? 'Commencer' : 'Choisissez au moins une discipline') + '</button>'
    + '</div></div>';
}

function ecranJour() {
  const f = duJour();
  const lu = S.vues.includes(f.id);
  return '<div class="scroll">'
    + '<div class="today-art"><span class="ink i1"></span><span class="ink i2"></span>'
    + '<span class="ink i3"></span><span class="ink i4"></span></div>'
    + '<div class="pad">'
    + '<p class="eyebrow">Concept du jour · Jour ' + (S.jour + 1) + '</p>'
    + '<h1 class="big" style="font-size:29px">' + esc(f.titre) + '</h1>'
    + '<p class="sub">' + esc(f.accroche) + '</p>'
    + '<div class="meta"><span class="tag enc">' + esc(DISCIPLINES.find(d=>d.cle===f.discipline).nom) + '</span>'
    + '<span class="tag">' + esc(f.niveau) + '</span><span class="tag">' + f.duree_lecture_min + ' min</span></div>'
    + '<button class="cta" id="lire">' + (lu ? 'Relire' : 'Lire') + '</button>'
    + '<div class="lock"><b>Un seul concept par jour.</b> Le suivant sera disponible demain — c\\'est le principe. '
    + 'Dans cette démo, le bouton « Jour suivant » en haut de page force le passage.</div>'
    + '</div></div>';
}

function ecranLecture() {
  const f = vue;
  const enca = f.citation
    ? '<div class="pull"><p>«&#8239;'+esc(f.citation.texte)+'&#8239;»</p><cite>'+esc(f.citation.auteur)+' — '+esc(f.citation.source)+'</cite></div>'
    : '<div class="pull"><p>'+esc(f.repere.texte)+'</p><cite>'+esc(f.repere.source)+'</cite></div>';
  const srcs = f.sources.map(s => '<li>'+(s.auteur?esc(s.auteur)+', ':'')+'<b>'+esc(s.titre)+'</b>'
    + (s.publication?', '+esc(s.publication):'') + (s.annee?', '+(s.annee<0?(-s.annee)+' av. J.-C.':s.annee):'')
    + (s.url?' · <a href="'+esc(s.url)+'" target="_blank" rel="noopener">lien</a>':'') + '</li>').join('');
  return '<div class="scroll"><div class="pad read">'
    + '<p class="eyebrow">' + esc(DISCIPLINES.find(d=>d.cle===f.discipline).nom) + '</p>'
    + '<h2>' + esc(f.titre) + '</h2><p class="acc">' + esc(f.accroche) + '</p>'
    + '<div class="body">' + md(f.contenu_vulgarise) + '</div>' + enca
    + '<div class="srcs"><h4>Sources vérifiées</h4><ol>' + srcs + '</ol></div>'
    + '<div class="actions"><button class="act-q" id="quiz">Quiz</button>'
    + '<button class="act-s" id="partage">Partager</button></div>'
    + '<button class="cta ghost" id="retour">Retour</button>'
    + '</div></div>';
}

function ecranQuiz() {
  const f = vue, q = f.quiz;
  const opts = q.choix.map((c,i) => {
    let etat = '';
    if (quizRep !== null) { if (i === q.bonne_reponse) etat = 'bon'; else if (i === quizRep) etat = 'mauvais'; }
    return '<button class="qopt" data-i="'+i+'"'+(etat?' data-etat="'+etat+'"':'')+'>'+esc(c)+'</button>';
  }).join('');
  return '<div class="scroll"><div class="pad">'
    + '<p class="eyebrow">Quiz · facultatif</p>'
    + '<h2 style="font-size:19px;font-weight:800;margin-top:12px;line-height:1.3">' + esc(q.question) + '</h2>'
    + '<div style="margin-top:20px">' + opts + '</div>'
    + (quizRep !== null ? '<div class="qexp">' + esc(q.explication) + '</div>' : '')
    + '<button class="cta ghost" id="retour">Retour à la fiche</button>'
    + '</div></div>';
}

function ecranPartage() {
  const f = vue, c = f.carte;
  return '<div class="scroll"><div class="share-wrap">'
    + '<div class="share"><span class="ink i1"></span><span class="ink i2"></span><span class="ink i3"></span>'
    + '<span class="grain"></span>'
    + '<div class="sct"><div class="zone"></div><p class="p">' + esc(c.punch) + '</p><p class="i">' + esc(c.idee) + '</p>'
    + '<div class="f"><span class="s">' + esc(c.source_courte) + '</span><span class="b">Epignosis</span></div>'
    + '</div></div>'
    + '<button class="cta act-s" id="envoyer" style="max-width:300px">Partager en story</button>'
    + '<button class="cta ghost" id="retour" style="max-width:300px;margin-top:0">Retour</button>'
    + '</div></div>';
}

function ecranArchive() {
  const v = vuesFiches();
  const libres = v.slice(-3), verrouillees = v.slice(0, Math.max(0, v.length - 3));
  const ligne = (f) => '<button class="row" data-open="'+f.id+'" style="--c:'+enc(f.discipline)+'">'
    + '<span class="bar"></span><span><span class="t">'+esc(f.titre)+'</span>'
    + '<span class="d">'+esc(DISCIPLINES.find(d=>d.cle===f.discipline).nom)+'</span></span></button>';
  return '<div class="scroll"><div class="pad">'
    + '<p class="eyebrow">Archive</p><h1 class="big" style="font-size:26px">' + v.length + ' concept'
    + (v.length>1?'s':'') + ' lu' + (v.length>1?'s':'') + '</h1>'
    + (v.length === 0 ? '<p class="sub">Rien encore. Lisez le concept du jour.</p>' : '')
    + libres.slice().reverse().map(ligne).join('')
    + (verrouillees.length ? '<div class="lock"><b>' + verrouillees.length + ' concept'
        + (verrouillees.length>1?'s':'') + ' plus ancien' + (verrouillees.length>1?'s':'')
        + '.</b> L\\'archive complète fait partie de l\\'offre premium. Les trois derniers restent toujours accessibles.</div>' : '')
    + '</div></div>';
}

function ecranProfil() {
  const v = vuesFiches();
  const parD = {};
  v.forEach(f => { parD[f.discipline] = (parD[f.discipline] || 0) + 1; });
  const total = v.length || 1;
  const dist = Object.entries(parD).sort((a,b) => b[1]-a[1]).map(([d,n]) =>
    '<div style="--c:'+enc(d)+'"><div class="l"><span>'+esc(DISCIPLINES.find(x=>x.cle===d).nom)
    + '</span><span>'+Math.round(n/total*100)+' %</span></div>'
    + '<div class="g"><i style="width:'+(n/total*100)+'%"></i></div></div>').join('');
  return '<div class="scroll"><div class="pad">'
    + '<p class="eyebrow">Profil</p><h1 class="big" style="font-size:26px">Votre série</h1>'
    + '<div style="margin-top:20px">'
    + '<div class="stat"><span>Série en cours</span><b>' + v.length + ' j</b></div>'
    + '<div class="stat"><span>Concepts vus</span><b>' + v.length + '</b></div>'
    + '<div class="stat"><span>Disciplines actives</span><b>' + S.actives.length + '</b></div>'
    + '</div>'
    + (dist ? '<div class="dist"><h3 style="font-size:10px;font-weight:800;letter-spacing:.13em;'
        + 'text-transform:uppercase;color:#8A8375;margin-top:26px">Répartition</h3>' + dist + '</div>' : '')
    + '<button class="cta ghost" id="reglages">Modifier mes disciplines</button>'
    + '</div></div>';
}

function rendre() {
  const app = document.getElementById('app');
  const f = duJour();
  app.style.setProperty('--enc', enc((vue || f).discipline));

  let contenu, tabs = true;
  if (!S.onboarde) { contenu = ecranOnboarding(); tabs = false; }
  else if (onglet === 'lecture') { contenu = ecranLecture(); tabs = false; }
  else if (onglet === 'quiz') { contenu = ecranQuiz(); tabs = false; }
  else if (onglet === 'partage') { contenu = ecranPartage(); tabs = false; }
  else if (onglet === 'archive') contenu = ecranArchive();
  else if (onglet === 'profil') contenu = ecranProfil();
  else contenu = ecranJour();

  const barre = tabs ? '<nav class="tabs">'
    + [['jour','Aujourd\\'hui'],['archive','Archive'],['profil','Profil']].map(([k,l]) =>
        '<button data-tab="'+k+'"'+(onglet===k?' aria-current="page"':'')+'><span class="dot"></span>'+l+'</button>'
      ).join('') + '</nav>' : '';

  app.innerHTML = '<div class="screen">' + contenu + barre + '</div>'
    + '<span class="grain"></span><div class="toast" id="toast"></div>';
  brancher();
}

function toast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg; t.classList.add('on');
  setTimeout(() => t.classList.remove('on'), 1800);
}

function brancher() {
  document.querySelectorAll('[data-disc]').forEach(b => b.onclick = () => {
    const d = b.dataset.disc;
    S.actives = S.actives.includes(d) ? S.actives.filter(x => x !== d) : [...S.actives, d];
    sauver(); rendre();
  });
  const go = document.getElementById('go');
  if (go) go.onclick = () => { S.onboarde = true; sauver(); rendre(); };

  const lire = document.getElementById('lire');
  if (lire) lire.onclick = () => {
    const f = duJour();
    if (!S.vues.includes(f.id)) { S.vues.push(f.id); sauver(); }
    vue = f; quizRep = null; onglet = 'lecture'; rendre();
  };

  document.querySelectorAll('[data-tab]').forEach(b => b.onclick = () => { onglet = b.dataset.tab; vue = null; rendre(); });
  document.querySelectorAll('[data-open]').forEach(b => b.onclick = () => {
    vue = FICHES.find(f => f.id === b.dataset.open); quizRep = null; onglet = 'lecture'; rendre();
  });

  const q = document.getElementById('quiz');
  if (q) q.onclick = () => { quizRep = null; onglet = 'quiz'; rendre(); };
  const p = document.getElementById('partage');
  if (p) p.onclick = () => { onglet = 'partage'; rendre(); };
  document.querySelectorAll('.qopt').forEach(b => b.onclick = () => {
    if (quizRep !== null) return;
    quizRep = Number(b.dataset.i); S.quiz[vue.id] = quizRep; sauver(); rendre();
  });
  const env = document.getElementById('envoyer');
  if (env) env.onclick = () => toast('Aperçu — le partage réel arrivera avec l\\'app');

  const r = document.getElementById('retour');
  if (r) r.onclick = () => {
    if (onglet === 'quiz' || onglet === 'partage') { onglet = 'lecture'; }
    else { onglet = 'jour'; vue = null; }
    rendre();
  };
  const reg = document.getElementById('reglages');
  if (reg) reg.onclick = () => { S.onboarde = false; sauver(); rendre(); };
}

document.getElementById('suivant').onclick = () => {
  S.jour++; sauver(); onglet = 'jour'; vue = null; rendre();
  document.querySelector('.scroll')?.scrollTo(0, 0);
};
document.getElementById('reset').onclick = () => {
  S = { ...defaut }; sauver(); onglet = 'jour'; vue = null; rendre();
};

rendre();
`;

const corpsHtml = `<div class="demo">
  <header class="demo-head">
    <div>
      <h1>Epignosis — aperçu cliquable</h1>
      <p>Maquette de démonstration, avec ${fiches.length} concepts réels et validés. Ce n'est pas l'app :
      c'est un aperçu pour réagir au contenu et à la direction visuelle. Vos choix restent dans ce navigateur.</p>
    </div>
    <div class="demo-ctl">
      <button id="suivant">Jour suivant →</button>
      <button id="reset">Réinitialiser</button>
    </div>
  </header>
  <div class="stage"><div class="phone" id="app"></div></div>
</div>
<script>
${JS
  .replace('__DATA__', JSON.stringify(fiches))
  .replace('__DISC__', JSON.stringify(disciplinesPresentes.map((c) => ({ cle: c, nom: DISCIPLINES[c] }))))
  .replace('__ENC__', JSON.stringify(ENCRES))}
</script>`;

const artifact = process.argv.includes('--artifact');
const html = artifact
  ? `<title>Epignosis — aperçu cliquable</title>\n<style>${CSS}</style>\n${corpsHtml}`
  : `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>Epignosis — aperçu cliquable</title>
<style>${CSS}</style>
</head>
<body>
${corpsHtml}
</body>
</html>`;

const dir = path.join(ROOT, 'export');
await mkdir(dir, { recursive: true });
const cible = path.join(dir, artifact ? 'apercu-artifact.html' : 'apercu.html');
await writeFile(cible, html, 'utf8');

console.log(`${fiches.length} concepts · ${Math.round(html.length / 1024)} Ko → ${path.relative(ROOT, cible)}`);
if (!artifact) console.log('Fichier autonome : envoyable par mail ou messagerie, ouvrable hors ligne.');
