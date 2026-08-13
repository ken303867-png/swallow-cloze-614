const CACHE_PREFIX = 'swallow-cloze-614-new-';
const CACHE = CACHE_PREFIX + 'v8-transfer';
const ASSETS = ['./', './index.html', './manifest.json', './results-patch.js?v=1', './data-transfer.js'];
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
