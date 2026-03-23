const CACHE_NAME = 'basicfit-v1';
const ASSETS = [
  './index.html',
  './manifest.json'
];

// Images exercices à mettre en cache
const IMAGE_CACHE = 'basicfit-images-v1';
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

self.addEventListener('install', event => {
  event.waitUntil(
    Promise.all([
      caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)),
      caches.open(IMAGE_CACHE).then(cache => {
        return Promise.allSettled(
          IMAGES.map(url => cache.add(url).catch(() => {}))
        );
      })
    ])
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME && k !== IMAGE_CACHE)
            .map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        if (!response || response.status !== 200) return response;
        const clone = response.clone();
        const cacheName = event.request.url.match(/\.(gif|jpg|png|webp)/) ? IMAGE_CACHE : CACHE_NAME;
        caches.open(cacheName).then(cache => cache.put(event.request, clone));
        return response;
      }).catch(() => {
        if (event.request.destination === 'document') {
          return caches.match('./index.html');
        }
      });
    })
  );
});
