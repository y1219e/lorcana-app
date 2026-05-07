const SHELL_CACHE = 'loreca-shell-v12';
const BASE = self.registration.scope;
const SHELL = ['index_v2.html', 'style.css', 'app.js', 'loreca_config.json']
  .map(f => new URL(f, BASE).href);

self.addEventListener('install', e => {
  // cache:'no-cache' でCDNにも再検証を強制して常に最新を取得
  e.waitUntil(
    caches.open(SHELL_CACHE).then(c =>
      Promise.all(SHELL.map(url =>
        fetch(new Request(url, { cache: 'no-cache' })).then(r => c.put(url, r))
      ))
    )
  );
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
    e.respondWith(
      fetch(new Request(e.request, { cache: 'no-cache' }))
        .catch(() => caches.match(SHELL[0]))
    );
    return;
  }

  // アプリシェル: cache:'no-cache' でCDN再検証＋ネットワークファースト
  if (SHELL.includes(e.request.url)) {
    e.respondWith(
      fetch(new Request(e.request, { cache: 'no-cache' }))
        .then(response => {
          const clone = response.clone();
          caches.open(SHELL_CACHE).then(c => c.put(e.request, clone));
          return response;
        })
        .catch(() => caches.match(e.request))
    );
  }
});
