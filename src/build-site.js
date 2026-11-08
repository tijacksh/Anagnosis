#!/usr/bin/env node
/**
 * Assemble le site public — anagnosis.fr.
 *
 *   npm run site   → export/site/   (ce que publie Netlify)
 *
 * Deux choses distinctes, sous un seul dossier :
 *
 * 1. **La vitrine** (`site/index.html`) — présente le produit, renvoie vers les
 *    stores. Statique, aucune dépendance : les polices viennent de Google Fonts en
 *    CDN (seule exception au principe « zéro appel réseau », qui vaut pour le
 *    pipeline et les apps clientes, pas pour une page web publique).
 *
 * 2. **Le contenu signé** (`export/site/contenu/`) — c'est ce que l'app télécharge
 *    pour recevoir de nouvelles fiches sans passer par l'App Store / Play Store.
 *    Repris tel quel de l'ancien `build-app.js` : c'est l'infrastructure de
 *    production, elle ne bouge pas quand la vitrine change.
 *
 * Ce script remplace `build-app.js` et l'« esquisse jouable » qu'il assemblait
 * (`app/`, `banc/`) — retirée une fois que les apps natives (iOS, Android) ont pu
 * être testées directement sur simulateur et appareil réel. Voir CLAUDE.md.
 */
import { readFile, writeFile, mkdir, copyFile } from 'node:fs/promises';
import path from 'node:path';
import { loadAll, ROOT } from './store.js';
import { fichesPubliables, serialiser, signer, retirees, CLE_ENV } from './publier.js';

const SRC = path.join(ROOT, 'site');
const DEST = path.join(ROOT, 'export', 'site');

const toutes = await loadAll();
const publiables = toutes.filter((f) => ['valide', 'publie'].includes(f.statut));

const disciplinesAffichees = [...new Set(publiables.map((f) => f.discipline))].sort();
const { DISCIPLINES, ENCRES, FAMILLES, FAMILLE_PAR_DISCIPLINE } = await import('./schema.js');
const disponibles = Object.keys(DISCIPLINES).filter((d) => ENCRES[d]);

// Une discipline sans famille se tairait dans la vitrine plutôt que de se signaler —
// le même principe que la clé inconnue côté clients (`Disciplines.kt`) : ça doit se
// voir, pas se glisser en silence dans un export qui a l'air complet.
const orphelines = disponibles.filter((d) => !FAMILLE_PAR_DISCIPLINE[d]);
if (orphelines.length) {
  throw new Error(`Discipline(s) sans famille dans FAMILLE_PAR_DISCIPLINE : ${orphelines.join(', ')}`);
}

const puces = FAMILLES.map((famille) => {
  const membres = disponibles
    .filter((d) => FAMILLE_PAR_DISCIPLINE[d] === famille)
    .sort((a, b) => DISCIPLINES[a].localeCompare(DISCIPLINES[b], 'fr'));
  const nuancier = membres
    .map((d) => `<span class="nuance" style="background:${ENCRES[d]}"></span>`)
    .join('');
  const chips = membres
    .map((d) => `<span class="discipline"><span class="point" style="background:${ENCRES[d]}"></span>${DISCIPLINES[d]}</span>`)
    .join('\n          ');
  return `<details class="famille">
        <summary><span class="famille-nom">${famille}</span><span class="famille-nuancier">${nuancier}</span></summary>
        <div class="disciplines">
          ${chips}
        </div>
      </details>`;
}).join('\n      ');

// L'inscription au lancement, posée deux fois sur la page (sous l'accroche et en
// bas) : écrite une seule fois ici, pour que les deux ne divergent jamais.
//
// Netlify Forms plutôt qu'un lien `mailto:` : le lien ne fait rien sur un appareil
// sans messagerie configurée, et une inscription qui arrive dans une boîte mail ne
// se compte pas. Chaque envoi est ici une soumission du formulaire `lancement`,
// comptée par Netlify, et c'est la seule conversion que la vitrine sait mesurer.
// Netlify lit le formulaire dans le HTML publié au déploiement : aucun script,
// aucune dépendance. `bot-field` est un piège à robots que Netlify écarte.
let numeroFormulaire = 0;
const inscription = () => {
  const id = `courriel-${++numeroFormulaire}`;
  return `<form class="inscription" name="lancement" method="POST" action="/inscription">
      <input type="hidden" name="source" value="direct">
      <p class="piege" aria-hidden="true"><label>Ne pas remplir <input name="bot-field" tabindex="-1" autocomplete="off"></label></p>
      <label for="${id}">Être prévenu·e du lancement</label>
      <div class="ligne">
        <input id="${id}" type="email" name="email" required maxlength="254" autocomplete="email" inputmode="email" placeholder="vous@exemple.fr" aria-describedby="${id}-erreur ${id}-note">
        <button type="submit">Me prévenir</button>
      </div>
      <p class="erreur" id="${id}-erreur" role="alert" hidden></p>
      <p class="note" id="${id}-note">Un seul message, le jour de la sortie, puis l'adresse est effacée. <a href="/mentions-legales#lancement">Ce qu'on en fait</a>.</p>
    </form>`;
};

await mkdir(DEST, { recursive: true });

const html = (await readFile(path.join(SRC, 'index.html'), 'utf8'))
  .replace('{{DISCIPLINES}}', puces)
  .replaceAll('{{INSCRIPTION}}', inscription);
await writeFile(path.join(DEST, 'index.html'), html, 'utf8');

const FICHIERS_STATIQUES = [
  'icone.svg', 'icone-180.png', 'icone-192.png', 'icone-512.png', 'favicon.ico',
  'og.png', 'contact.html', 'mentions-legales.html', 'confidentialite.html',
  'conditions.html', 'merci.html', '404.html', 'robots.txt', '_headers',
  // Trailer et captures dans les vrais cadres d'Apple (iPhone 18 Pro Max, iPhone Duo).
  'trailer-duo.mp4', 'trailer-iphone.mp4', 'trailer-duo.jpg', 'trailer-iphone.jpg',
  'appareil-fiche.webp', 'appareil-ecoute.webp', 'appareil-quiz.webp', 'appareil-carte.webp',
  'appareil-duo-replie.webp', 'appareil-duo-deplie.webp', 'android.html',
  // Démonstration de la lecture en arrière-plan, demandée par la Play Console
  // (déclaration FOREGROUND_SERVICE_MEDIA_PLAYBACK). Hors plan du site.
  'lecture-en-arriere-plan.mp4',
];
for (const f of FICHIERS_STATIQUES) {
  await copyFile(path.join(SRC, f), path.join(DEST, f));
}

// Le plan du site, engendré plutôt qu'écrit à la main : une page ajoutée à
// `FICHIERS_STATIQUES` ci-dessus s'y retrouve sans qu'il y ait une seconde liste à
// tenir à jour en parallèle, et donc rien à oublier.
// `/merci` n'y figure pas : c'est la page qui suit une inscription, marquée
// `noindex`, sans intérêt pour qui arrive d'un moteur de recherche.
const PAGES_PROPRES = ['/', '/contact', '/mentions-legales', '/confidentialite', '/conditions'];
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${PAGES_PROPRES.map((p) => `  <url><loc>https://anagnosis.fr${p}</loc></url>`).join('\n')}
</urlset>
`;
await writeFile(path.join(DEST, 'sitemap.xml'), sitemap, 'utf8');

// **Le filet contre la panne du 27 août 2026** : deux pages légales manquantes,
// jamais construites, jamais testées, découvertes en revue plutôt qu'au build.
// Chaque lien interne posé dans `site/*.html` doit désigner un fichier qui existe
// réellement dans `DEST` une fois la vitrine assemblée — sans quoi le lien atterrit
// sur la 404 générique de l'hébergeur au lieu de la page voulue, en silence.
const pagesVitrine = [...FICHIERS_STATIQUES.filter((f) => f.endsWith('.html')), 'index.html'];
// `action` compte aussi : un formulaire qui renvoie vers une page absente perd
// l'inscription qu'il vient d'envoyer, sans que personne le voie. Et une ancre
// (`/mentions-legales#lancement`) doit désigner un `id` qui existe dans la page.
// Adresses servies par le Worker (`worker/site.js`), pas par un fichier de la vitrine.
const POINTS_D_ENTREE_WORKER = new Set(['inscription']);
const LIENS_INTERNES = /(?:href|action)="\/([a-z0-9-]*)(?:#([a-z0-9-]+))?"/g;
for (const nom of pagesVitrine) {
  const contenu = await readFile(path.join(DEST, nom), 'utf8');
  for (const [, cible, ancre] of contenu.matchAll(LIENS_INTERNES)) {
    if (POINTS_D_ENTREE_WORKER.has(cible)) continue;
    const fichierCible = cible === '' ? 'index.html' : `${cible}.html`;
    let page;
    try {
      page = await readFile(path.join(DEST, fichierCible), 'utf8');
    } catch {
      throw new Error(`${nom} pointe vers /${cible}, absent de la vitrine construite (${fichierCible} introuvable)`);
    }
    if (ancre && !page.includes(`id="${ancre}"`)) {
      throw new Error(`${nom} pointe vers /${cible}#${ancre}, ancre absente de ${fichierCible}`);
    }
  }
}

// Le contenu du client iOS et Android, signé — voir docs/passation-audio.md pour
// ce que ce fichier porte et pourquoi il est signé.
//
// **Sans clé, on ne publie rien.** Un `concepts.json` non signé serait refusé par
// les apps de toute façon ; le publier quand même donnerait un endpoint qui a
// l'air de marcher et ne marche pas. Mieux vaut qu'il soit absent, et que le
// build le dise.
const octetsContenu = serialiser(await fichesPubliables(publiables), retirees(toutes));
const signature = await signer(octetsContenu);
if (signature) {
  const dossier = path.join(DEST, 'contenu');
  await mkdir(dossier, { recursive: true });
  await writeFile(path.join(dossier, 'concepts.json'), octetsContenu);
  await writeFile(path.join(dossier, 'concepts.json.sig'), `${signature}\n`, 'utf8');
}

const ko = (n) => `${Math.round(n / 1024)} Ko`;
console.log(`${publiables.length} fiche(s) publiable(s), ${disciplinesAffichees.length} discipline(s) en stock`);
console.log(`  export/site/            vitrine + contenu`);
console.log(signature
  ? `  export/site/contenu/    contenu signé (${ko(octetsContenu.length)})`
  : `  export/site/contenu/    NON PUBLIÉ — aucune clé de signature (${CLE_ENV})`);
