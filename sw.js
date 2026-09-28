// Service Worker ـی پەڕتووک: بۆ خێرایی لە سەردانی دووەم و کارکردن بێ ئینتەرنێت
const VERSION = 'pertwk-v1';
const SHELL = ['/', '/books.json', '/manifest.webmanifest', '/icon.svg'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  const url = new URL(req.url);
  // تەنها GET ـی هەمان دۆمەین؛ PDF و دەنگی R2 و داواکاری Range دەستیان لێنادرێت
  if (req.method !== 'GET' || url.origin !== location.origin || req.headers.has('range')) return;

  // لاپەڕە و لیستی کتێبەکان: سەرەتا تۆڕ (بۆ ئەوەی کتێبی نوێ یەکسەر دەربکەوێت)، ئەگەر نەبوو Cache
  if (req.mode === 'navigate' || url.pathname === '/books.json') {
    e.respondWith(
      fetch(req).then(res => {
        const copy = res.clone();
        caches.open(VERSION).then(c => c.put(req.mode === 'navigate' ? '/' : req, copy));
        return res;
      }).catch(() => caches.match(req.mode === 'navigate' ? '/' : req))
    );
    return;
  }

  // بەرگ، فۆنت، pdf.js و ئایکۆن: سەرەتا Cache
  if (/^\/(covers|fonts|vendor)\//.test(url.pathname) || url.pathname.startsWith('/icon')) {
    e.respondWith(
      caches.match(req).then(hit => hit || fetch(req).then(res => {
        if (res.ok) { const copy = res.clone(); caches.open(VERSION).then(c => c.put(req, copy)); }
        return res;
      }))
    );
  }
});
