// Version à incrémenter à chaque mise à jour
const CACHE_VERSION = 'basicfit-v4';
const CACHE_IMAGES = 'basicfit-images-v4';

const ASSETS = [
  './index.html',
  './manifest.json'
];

const IMAGES = [
  'https://bodybuilding-wizard.com/wp-content/uploads/2014/04/pec-deck-flyes-1.jpg',
  'https://weighttraining.guide/wp-content/uploads/2016/10/machine-chest-press.png',
  'https://bodybuilding-wizard.com/wp-content/uploads/2015/03/machine-lat-pulldown-1.jpg',
  'https://www.inspireusafoundation.org/wp-content/uploads/2022/04/seated-cable-row.gif',
  'https://www.inspireusafoundation.org/wp-content/uploads/2022/09/cable-face-pull.gif',
  'https://www.inspireusafoundation.org/wp-content/uploads/2022/04/leg-press.gif',
  'https://www.inspireusafoundation.org/wp-content/uploads/2022/01/leg-extension.gif',
  'https://www.inspireusafoundation.org/wp-content/uploads/2022/01/lying-leg-curl.gif',
  'https://www.inspireusafoundation.org/wp-content/uploads/2022/03/hip-abduction-machine.gif',
  'https://www.inspireusafoundation.org/wp-content/uploads/2022/04/machine-shoulder-press.gif',
  'https://homegymreview.co.uk/wp-content/uploads/2021/02/Cable-Lateral-Raise-1.jpg',
  'https://www.inspireusafoundation.org/wp-content/uploads/2022/01/machine-bicep-curl.gif',
  'https://fitnessvolt.com/wp-content/uploads/2019/11/tricep-rope-pushdown.gif',
  'https://homegymreview.co.uk/wp-content/uploads/2021/04/Cable-Upright-Row-female.jpg'
];

// INSTALL — met en cache les fichiers principaux
self.addEventListener('install', event => {
  // skipWaiting force l'activation immédiate sans attendre
  self.skipWaiting();
  event.waitUntil(
    Promise.all([
      caches.open(CACHE_VERSION).then(cache => cache.addAll(ASSETS)),
      caches.open(CACHE_IMAGES).then(cache =>
        Promise.allSettled(IMAGES.map(url => cache.add(url).catch(() => {})))
      )
    ])
  );
});

// ACTIVATE — supprime tous les anciens caches et prend le contrôle immédiatement
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => k !== CACHE_VERSION && k !== CACHE_IMAGES)
          .map(k => {
            console.log('Suppression ancien cache:', k);
            return caches.delete(k);
          })
      )
    ).then(() => {
      // Prend le contrôle de tous les clients immédiatement
      return self.clients.claim();
    })
  );
});

// FETCH — stratégie : réseau d'abord pour HTML, cache d'abord pour images
self.addEventListener('fetch', event => {
  const url = event.request.url;

  // Pour index.html : toujours essayer le réseau en premier
  if (url.includes('index.html') || url.endsWith('/')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_VERSION).then(cache => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  // Pour les images : cache d'abord
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        if (!response || response.status !== 200) return response;
        const clone = response.clone();
        const cacheName = url.match(/\.(gif|jpg|png|webp)/) ? CACHE_IMAGES : CACHE_VERSION;
        caches.open(cacheName).then(cache => cache.put(event.request, clone));
        return response;
      }).catch(() => cached);
    })
  );
});
