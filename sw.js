const CACHE_PREFIX = 'swallow-cloze-614-new-';
const CACHE = CACHE_PREFIX + 'v17-compact1390-qaSA';
const ASSETS = [
  './','./index.html','./manifest.json','./styles.css',
  './data-sections-01-05.js','./data-sections-06-09.js','./data-sections-10-13.js','./data-sections-14-17.js',
  './data.js','./qa-data-patch.js','./core.js','./qa-progress-migration.js','./data-transfer.js','./results.js','./memory.js'
];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k.startsWith(CACHE_PREFIX) && k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const u = new URL(e.request.url);
  if (u.origin !== self.location.origin || !u.href.startsWith(self.registration.scope)) return;
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request)
        .then(r => {
          if (r && r.status === 200) {
            const copy = r.clone();
            caches.open(CACHE).then(c => c.put('./index.html', copy));
          }
          return r;
        })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }
  e.respondWith(caches.match(e.request, {ignoreSearch:true}).then(cached => cached || fetch(e.request)));
});
