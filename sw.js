const SHELL_CACHE = 'loreca-shell-v1';
// self.registration.scope = 'https://lorecajp.github.io/loreca/' を基準に解決
const BASE = self.registration.scope;
const SHELL = ['index_v2.html', 'style.css', 'app.js', 'loreca_config.json']
  .map(f => new URL(f, BASE).href);

self.addEventListener('install', e => {
  e.waitUntil(caches.open(SHELL_CACHE).then(c => c.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k.startsWith('loreca-shell-') && k !== SHELL_CACHE)
            .map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // R2画像はapp.jsのCache APIで管理されるためSWは素通し
  if (url.hostname.endsWith('r2.dev')) return;

  // ナビゲーション: ネットワークファースト、オフライン時はシェルにフォールバック
  if (e.request.mode === 'navigate') {
    e.respondWith(fetch(e.request).catch(() => caches.match(SHELL[0])));
    return;
  }

  // アプリシェル(HTML/CSS/JS/config): キャッシュファースト
  if (SHELL.includes(e.request.url)) {
    e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
  }
});
