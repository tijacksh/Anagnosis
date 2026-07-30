/**
 * Service worker — Anagnosis.
 *
 * L'app doit fonctionner entièrement hors ligne après la première visite : tout
 * le contenu validé est embarqué dans `contenu.js`, il n'y a aucun appel réseau
 * en usage normal. Le réseau ne sert qu'à récupérer les polices, et leur absence
 * est rattrapée par la pile de repli.
 *
 * Le jeton de version ci-dessous est réécrit à l'assemblage (`npm run app`) avec
 * l'empreinte du contenu servi : un déploiement change le nom du cache, donc
 * l'ancien est purgé à l'activation. En dehors de l'assemblage, le jeton reste
 * tel quel et le service worker fonctionne quand même.
 */
const VERSION = 'anagnosis-__EMPREINTE__';
const COQUILLE = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './contenu.js',
  './manifest.webmanifest',
  './icone.svg',
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(VERSION)
      // `cache: 'reload'` court-circuite le cache HTTP : à l'installation, on
      // veut les fichiers du déploiement en cours, pas ceux du précédent.
      .then((c) => c.addAll(COQUILLE.map((u) => new Request(u, { cache: 'reload' }))))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((cles) => Promise.all(cles.filter((c) => c !== VERSION).map((c) => caches.delete(c))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (e) => {
  const { request } = e;
  if (request.method !== 'GET') return;

  // Nos propres fichiers : le réseau d'abord, le cache en secours.
  //
  // L'inverse — le cache d'abord — laisse un testeur sur la version qu'il a
  // ouverte la première fois, indéfiniment : la requête n'atteint jamais le
  // réseau, donc aucun déploiement ne redescend. Hors ligne, le cache répond
  // exactement comme avant.
  if (new URL(request.url).origin === self.location.origin) {
    e.respondWith(
      fetch(request)
        .then((rep) => {
          if (rep.ok) {
            const copie = rep.clone();
            caches.open(VERSION).then((c) => c.put(request, copie));
          }
          return rep;
        })
        .catch(() => caches.match(request)
          .then((cache) => cache || (request.mode === 'navigate' ? caches.match('./index.html') : undefined))),
    );
    return;
  }

  // Polices : elles ne changent pas, le cache d'abord suffit, et on les garde
  // au passage pour le premier lancement hors ligne.
  e.respondWith(
    caches.match(request).then((cache) => cache || fetch(request).then((rep) => {
      if (rep.ok && request.url.includes('fonts.g')) {
        const copie = rep.clone();
        caches.open(VERSION).then((c) => c.put(request, copie));
      }
      return rep;
    }).catch(() => cache)),
  );
});
