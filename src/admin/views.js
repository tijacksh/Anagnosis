/**
 * Rendu HTML de l'outil de validation.
 *
 * Pas de framework, pas de build : l'outil doit rester lançable d'un
 * `npm run admin` sur le NAS, des années après, sans réinstaller un écosystème.
 */
import { DISCIPLINES, STATUTS_LABELS, REGLES } from '../schema.js';

export function escape(s = '') {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Markdown volontairement minimal : `## titre`, `**gras**`, paragraphes.
 * C'est exactement ce que le client iOS aura à savoir rendre — garder le
 * sous-ensemble petit est une contrainte, pas une limite.
 */
export function renderCorps(md = '') {
  return md
    .split(/\n{2,}/)
    .map((bloc) => bloc.trim())
    .filter(Boolean)
    .map((bloc) => {
      if (bloc.startsWith('## ')) return `<h2>${inline(bloc.slice(3))}</h2>`;
      return `<p>${inline(bloc)}</p>`;
    })
    .join('\n');
}

function inline(s) {
  return escape(s)
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>');
}

const CSS = `
*,*::before,*::after{box-sizing:border-box}
body{margin:0;font:16px/1.6 ui-serif,Georgia,'Iowan Old Style',serif;color:#1c1a17;background:#f7f5f1}
a{color:#8a5a2b}
button{font:inherit}
.wrap{max-width:1180px;margin:0 auto;padding:0 24px}
header.top{background:#1c1a17;color:#f7f5f1;padding:14px 0;position:sticky;top:0;z-index:10}
header.top .wrap{display:flex;align-items:baseline;gap:20px;flex-wrap:wrap}
header.top h1{margin:0;font-size:17px;letter-spacing:.14em;text-transform:uppercase;font-weight:600}
header.top .sub{font-size:13px;opacity:.6;font-family:ui-sans-serif,system-ui,sans-serif}
header.top nav{margin-left:auto;display:flex;gap:16px;font-family:ui-sans-serif,system-ui,sans-serif;font-size:13px}
header.top nav a{color:#f7f5f1;opacity:.75;text-decoration:none}
header.top nav a:hover{opacity:1}

.sans{font-family:ui-sans-serif,system-ui,-apple-system,sans-serif}
.filters{display:flex;gap:8px;flex-wrap:wrap;margin:28px 0 20px;font-family:ui-sans-serif,system-ui,sans-serif;font-size:13px}
.filters a{padding:5px 12px;border:1px solid #d8d2c8;border-radius:999px;text-decoration:none;color:#5c554b;background:#fff}
.filters a.on{background:#1c1a17;border-color:#1c1a17;color:#f7f5f1}

.queue{display:flex;flex-direction:column;gap:10px;padding-bottom:60px}
.card{display:block;background:#fff;border:1px solid #e5e0d8;border-radius:10px;padding:16px 18px;text-decoration:none;color:inherit;transition:border-color .12s,transform .12s}
.card:hover,.card:focus-visible{border-color:#8a5a2b;transform:translateY(-1px);outline:none}
.card.sel{border-color:#8a5a2b;box-shadow:0 0 0 2px rgba(138,90,43,.16)}
.card h3{margin:0 0 4px;font-size:19px;font-weight:600}
.card p{margin:0;color:#5c554b;font-size:14.5px}
.card .row{display:flex;gap:10px;align-items:center;margin-bottom:8px;flex-wrap:wrap}

.tag{font-family:ui-sans-serif,system-ui,sans-serif;font-size:11px;letter-spacing:.09em;text-transform:uppercase;padding:3px 9px;border-radius:4px;background:#efece6;color:#5c554b;font-weight:600}
.tag.brouillon{background:#e8e5df;color:#57514a}
.tag.en_retouche{background:#fbeccf;color:#8a5c14}
.tag.valide{background:#d9ead9;color:#2f5d34}
.tag.rejete{background:#f4dad6;color:#8d3a2c}
.tag.publie{background:#d7e4f0;color:#2c4d70}
.tag.err{background:#f4dad6;color:#8d3a2c}
.tag.warn{background:#fbeccf;color:#8a5c14}

.layout{display:grid;grid-template-columns:minmax(0,1fr) 380px;gap:32px;align-items:start;padding-bottom:80px}
@media(max-width:980px){.layout{grid-template-columns:1fr}}

article.fiche{background:#fff;border:1px solid #e5e0d8;border-radius:12px;padding:40px 44px}
@media(max-width:640px){article.fiche{padding:26px 22px}}
article.fiche h1{font-size:32px;line-height:1.22;margin:0 0 10px}
article.fiche .accroche{font-size:18px;color:#5c554b;margin:0 0 26px;font-style:italic}
article.fiche h2{font-size:19px;margin:30px 0 8px;font-weight:600}
article.fiche p{margin:0 0 15px}
.illu{aspect-ratio:16/9;border:1px dashed #cfc7ba;border-radius:8px;display:flex;align-items:center;justify-content:center;text-align:center;color:#8b8377;background:#faf8f4;margin:0 0 28px;padding:20px;font-family:ui-sans-serif,system-ui,sans-serif;font-size:13px}
blockquote{margin:28px 0;padding:18px 22px;border-left:3px solid #8a5a2b;background:#faf8f4;font-size:17px}
blockquote p{margin:0 0 8px}
blockquote cite{font-size:13.5px;color:#6b6459;font-style:normal;font-family:ui-sans-serif,system-ui,sans-serif}

aside{position:sticky;top:70px;display:flex;flex-direction:column;gap:16px;font-family:ui-sans-serif,system-ui,sans-serif;font-size:13.5px}
.panel{background:#fff;border:1px solid #e5e0d8;border-radius:10px;padding:16px 18px}
.panel h4{margin:0 0 10px;font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:#8b8377;font-weight:700}
.panel ol,.panel ul{margin:0;padding-left:18px}
.panel li{margin-bottom:8px;line-height:1.5}
.panel li:last-child{margin-bottom:0}
.panel .kv{display:flex;justify-content:space-between;gap:12px;padding:3px 0;color:#5c554b}
.panel .kv b{font-weight:600;color:#1c1a17}

.quiz .q{font-weight:600;margin:0 0 10px}
.quiz ol{list-style:upper-alpha;padding-left:22px}
.quiz li.bon{color:#2f5d34;font-weight:600}
.quiz .exp{margin:12px 0 0;padding-top:11px;border-top:1px solid #eee8de;color:#5c554b}

.diag li{color:#8d3a2c}
.diag li.w{color:#8a5c14}

.actions{display:flex;flex-direction:column;gap:9px}
.actions form{display:contents}
.btn{display:block;width:100%;padding:11px 14px;border-radius:8px;border:1px solid transparent;cursor:pointer;font-weight:600;font-size:14px;text-align:center;font-family:ui-sans-serif,system-ui,sans-serif}
.btn:disabled{opacity:.4;cursor:not-allowed}
.btn-ok{background:#2f5d34;color:#fff}
.btn-retouche{background:#fff;color:#8a5c14;border-color:#e0c58a}
.btn-ko{background:#fff;color:#8d3a2c;border-color:#e6bfb7}
.btn-neutre{background:#fff;color:#5c554b;border-color:#d8d2c8}
.btn:hover:not(:disabled){filter:brightness(.96)}
textarea{width:100%;min-height:68px;padding:9px 11px;border:1px solid #d8d2c8;border-radius:8px;font:inherit;font-size:13.5px;resize:vertical;background:#fff}
kbd{font-family:ui-monospace,monospace;font-size:11px;background:#efece6;border:1px solid #ddd7cd;border-bottom-width:2px;border-radius:4px;padding:1px 5px;color:#5c554b}

.hist{font-size:12.5px;color:#6b6459}
.hist li{margin-bottom:6px}
.nav-fiches{display:flex;justify-content:space-between;gap:10px;font-family:ui-sans-serif,system-ui,sans-serif;font-size:13px;margin:20px 0 0}
.nav-fiches a{color:#5c554b;text-decoration:none;padding:7px 13px;border:1px solid #d8d2c8;border-radius:8px;background:#fff}
.empty{text-align:center;padding:80px 20px;color:#8b8377}
`;

export function page({ titre, corps, sousTitre = '' }) {
  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escape(titre)} — Anagnosis Admin</title>
<style>${CSS}</style>
</head>
<body>
<header class="top"><div class="wrap">
  <h1>Anagnosis</h1>
  <span class="sub">Validation éditoriale${sousTitre ? ` — ${escape(sousTitre)}` : ''}</span>
  <nav><a href="/">File d'attente</a><a href="/?statut=valide">Validées</a><a href="/?statut=rejete">Rejetées</a></nav>
</div></header>
<main class="wrap">${corps}</main>
</body></html>`;
}

const tag = (statut) => `<span class="tag ${statut}">${escape(STATUTS_LABELS[statut] ?? statut)}</span>`;

export function vueQueue({ resultats, filtres, compteurs }) {
  const lien = (params) => {
    const q = new URLSearchParams({ ...filtres, ...params });
    for (const [k, v] of [...q]) if (!v || v === 'tous') q.delete(k);
    const s = q.toString();
    return s ? `/?${s}` : '/';
  };

  const chipStatut = (val, label, n) =>
    `<a class="${(filtres.statut ?? 'a_relire') === val ? 'on' : ''}" href="${lien({ statut: val })}">${escape(label)}${n != null ? ` · ${n}` : ''}</a>`;

  const disciplines = [...new Set(resultats.map((r) => r.fiche.discipline))].sort();
  const chipDiscipline = (val, label) =>
    `<a class="${(filtres.discipline ?? 'tous') === val ? 'on' : ''}" href="${lien({ discipline: val })}">${escape(label)}</a>`;

  const cartes = resultats.length
    ? resultats
        .map(({ fiche, erreurs, alertes, mots }) => {
          const badges = [
            tag(fiche.statut),
            `<span class="tag">${escape(DISCIPLINES[fiche.discipline] ?? fiche.discipline)}</span>`,
            erreurs.length ? `<span class="tag err">${erreurs.length} erreur${erreurs.length > 1 ? 's' : ''}</span>` : '',
            alertes.length ? `<span class="tag warn">${alertes.length} alerte${alertes.length > 1 ? 's' : ''}</span>` : '',
            `<span class="tag">${mots} mots</span>`,
          ].filter(Boolean).join('');
          return `<a class="card" href="/fiche/${encodeURIComponent(fiche.id)}">
  <div class="row">${badges}</div>
  <h3>${escape(fiche.titre)}</h3>
  <p>${escape(fiche.accroche ?? '')}</p>
</a>`;
        })
        .join('\n')
    : `<div class="empty"><p>Rien dans cette file.</p></div>`;

  return page({
    titre: "File d'attente",
    corps: `
<div class="filters">
  ${chipStatut('a_relire', 'À relire', compteurs.a_relire)}
  ${chipStatut('valide', 'Validées', compteurs.valide)}
  ${chipStatut('rejete', 'Rejetées', compteurs.rejete)}
  ${chipStatut('publie', 'Publiées', compteurs.publie)}
  ${chipStatut('tous', 'Toutes', compteurs.tous)}
</div>
<div class="filters">
  ${chipDiscipline('tous', 'Toutes disciplines')}
  ${disciplines.map((d) => chipDiscipline(d, DISCIPLINES[d] ?? d)).join('\n  ')}
</div>
<div class="queue">${cartes}</div>`,
  });
}

export function vueFiche({ fiche, erreurs, alertes, mots, precedente, suivante }) {
  const f = fiche;

  const encadre = f.citation
    ? `<blockquote>
  <p>« ${escape(f.citation.texte)} »</p>
  <cite>${escape(f.citation.auteur)}${f.citation.source ? `, <em>${escape(f.citation.source)}</em>` : ''}${
        f.citation.url ? ` — <a href="${escape(f.citation.url)}" target="_blank" rel="noopener">source</a>` : ''
      }</cite>
</blockquote>`
    : f.repere
      ? `<blockquote>
  <p>${escape(f.repere.texte)}</p>
  <cite>${escape(f.repere.source)}</cite>
</blockquote>`
      : '';

  const sources = (f.sources ?? [])
    .map((s) => {
      const bits = [
        s.auteur ? `${escape(s.auteur)}, ` : '',
        `<b>${escape(s.titre)}</b>`,
        s.publication ? `, <em>${escape(s.publication)}</em>` : '',
        s.annee ? `, ${s.annee}` : '',
        s.url ? ` — <a href="${escape(s.url)}" target="_blank" rel="noopener">lien</a>` : '',
        s.note ? `<br><span style="color:#8b8377">${escape(s.note)}</span>` : '',
      ];
      return `<li>${bits.join('')}</li>`;
    })
    .join('\n');

  const plusLoin = (f.pour_aller_plus_loin ?? [])
    .map((l) => `<li>${l.url ? `<a href="${escape(l.url)}" target="_blank" rel="noopener">${escape(l.titre)}</a>` : escape(l.titre)}${l.note ? ` — ${escape(l.note)}` : ''}</li>`)
    .join('\n');

  const quiz = f.quiz
    ? `<div class="panel quiz">
  <h4>Quiz</h4>
  <p class="q">${escape(f.quiz.question)}</p>
  <ol>${(f.quiz.choix ?? []).map((c, i) => `<li class="${i === f.quiz.bonne_reponse ? 'bon' : ''}">${escape(c)}</li>`).join('')}</ol>
  <p class="exp">${escape(f.quiz.explication ?? '')}</p>
</div>`
    : `<div class="panel"><h4>Quiz</h4><p style="color:#8b8377;margin:0">Aucun quiz.</p></div>`;

  const diagnostic =
    erreurs.length || alertes.length
      ? `<div class="panel">
  <h4>Contrôle qualité</h4>
  <ul class="diag">
    ${erreurs.map((e) => `<li>${escape(e)}</li>`).join('')}
    ${alertes.map((a) => `<li class="w">${escape(a)}</li>`).join('')}
  </ul>
</div>`
      : `<div class="panel"><h4>Contrôle qualité</h4><p style="margin:0;color:#2f5d34">Aucune anomalie — ${mots} mots.</p></div>`;

  const historique = (f.validation?.historique ?? []).length
    ? `<div class="panel">
  <h4>Historique</h4>
  <ul class="hist">${f.validation.historique
    .slice()
    .reverse()
    .map((h) => `<li><b>${escape(h.action)}</b> · ${escape(h.le?.slice(0, 16).replace('T', ' ') ?? '')} · ${escape(h.par)}${h.note ? `<br>« ${escape(h.note)} »` : ''}</li>`)
    .join('')}</ul>
</div>`
    : '';

  const bloque = erreurs.length > 0;

  return page({
    titre: f.titre,
    sousTitre: DISCIPLINES[f.discipline] ?? f.discipline,
    corps: `
<div class="nav-fiches">
  <a href="/">← File d'attente</a>
  <span>
    ${precedente ? `<a href="/fiche/${encodeURIComponent(precedente)}">← Précédente</a>` : ''}
    ${suivante ? `<a href="/fiche/${encodeURIComponent(suivante)}">Suivante →</a>` : ''}
  </span>
</div>

<div class="layout">
  <article class="fiche">
    <div class="illu">
      <div><b>Illustration à générer</b><br>${escape(f.illustration?.prompt ?? '—')}</div>
    </div>
    <h1>${escape(f.titre)}</h1>
    <p class="accroche">${escape(f.accroche ?? '')}</p>
    ${renderCorps(f.contenu_vulgarise)}
    ${encadre}
  </article>

  <aside>
    <div class="panel">
      <h4>Fiche</h4>
      <div class="kv"><span>Statut</span>${tag(f.statut)}</div>
      <div class="kv"><span>Discipline</span><b>${escape(DISCIPLINES[f.discipline] ?? f.discipline)}</b></div>
      <div class="kv"><span>Thème</span><b>${escape(f.theme ?? '—')}</b></div>
      <div class="kv"><span>Niveau</span><b>${escape(f.niveau ?? '—')}</b></div>
      <div class="kv"><span>Longueur</span><b>${mots} mots (${REGLES.motsMin}-${REGLES.motsMax})</b></div>
      <div class="kv"><span>Identifiant</span><b>${escape(f.id)}</b></div>
    </div>

    ${diagnostic}

    <div class="panel">
      <h4>Sources (${(f.sources ?? []).length})</h4>
      <ol>${sources || '<li>Aucune source.</li>'}</ol>
    </div>

    ${plusLoin ? `<div class="panel"><h4>Pour aller plus loin</h4><ul>${plusLoin}</ul></div>` : ''}

    ${
      f.carte
        ? `<div class="panel">
      <h4>Carte partageable</h4>
      <p style="margin:0 0 8px;font-weight:600;font-size:15px">${escape(f.carte.punch)}</p>
      <p style="margin:0 0 8px">${escape(f.carte.idee)}</p>
      <p style="margin:0;color:#8b8377;font-size:12.5px">${escape(f.carte.source_courte)}</p>
    </div>`
        : ''
    }

    ${quiz}

    <form class="panel actions" method="POST" action="/fiche/${encodeURIComponent(f.id)}/decision">
      <h4>Décision</h4>
      <textarea name="note" placeholder="Note de relecture (obligatoire pour une retouche ou un rejet)"></textarea>
      <button class="btn btn-ok" name="action" value="valider" ${bloque ? 'disabled' : ''}>
        Valider ${bloque ? '(bloqué : erreurs)' : '<kbd>V</kbd>'}
      </button>
      <button class="btn btn-retouche" name="action" value="retoucher">Renvoyer en retouche <kbd>R</kbd></button>
      <button class="btn btn-ko" name="action" value="rejeter">Rejeter <kbd>X</kbd></button>
      ${f.statut === 'valide' ? '<button class="btn btn-neutre" name="action" value="publier">Publier</button>' : ''}
      ${['valide', 'rejete', 'publie'].includes(f.statut) ? '<button class="btn btn-neutre" name="action" value="rouvrir">Remettre en brouillon</button>' : ''}
    </form>

    ${historique}
  </aside>
</div>

<script>
// Raccourcis clavier : relire 30 fiches à la souris est un frein réel.
document.addEventListener('keydown', (e) => {
  if (e.target.matches('textarea,input') || e.metaKey || e.ctrlKey || e.altKey) return;
  const clic = (v) => { const b = document.querySelector('button[value="' + v + '"]'); if (b && !b.disabled) b.click(); };
  const va = (sel) => { const a = document.querySelector(sel); if (a) location.href = a.href; };
  switch (e.key.toLowerCase()) {
    case 'v': clic('valider'); break;
    case 'r': clic('retoucher'); break;
    case 'x': clic('rejeter'); break;
    case 'j': va('.nav-fiches a[href*="/fiche/"]:last-of-type'); break;
    case 'k': va('.nav-fiches a[href*="/fiche/"]:first-of-type'); break;
    case 'escape': location.href = '/'; break;
  }
});
</script>`,
  });
}
