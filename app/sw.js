/**
 * Service worker — Anagnosis.
 *
 * L'app doit fonctionner entièrement hors ligne après la première visite : tout
 * le contenu validé est embarqué dans `contenu.js`, il n'y a aucun appel réseau
 * en usage normal. Le réseau ne sert qu'à récupérer les polices, et leur absence
 * est rattrapée par la pile de repli.
 */
const VERSION = 'anagnosis-v1';
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
      .then((c) => c.addAll(COQUILLE))
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

  // Navigation : on sert la coquille depuis le cache, sinon le réseau.
  if (request.mode === 'navigate') {
    e.respondWith(caches.match('./index.html').then((r) => r || fetch(request)));
    return;
  }

  // Reste : cache d'abord, réseau en secours, et on met en cache au passage
  // (utile pour les polices, récupérées au premier lancement en ligne).
  e.respondWith(
    caches.match(request).then((cache) => cache || fetch(request).then((rep) => {
      if (rep.ok && (request.url.startsWith(self.location.origin) || request.url.includes('fonts.g'))) {
        const copie = rep.clone();
        caches.open(VERSION).then((c) => c.put(request, copie));
      }
      return rep;
    }).catch(() => cache)),
  );
});
