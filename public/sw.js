/*
 * ツールひろばの Service Worker（ホーム画面に追加したときに、電波がなくても一度開いたページを使えるようにする）
 * - ページ（HTML）：まずネットから取り、取れたら保存。電波がないときだけ保存したものを出す（更新がすぐ届くように）
 * - /_next/static/ の JS・CSS：中身が変わるとファイル名が変わるので、保存したものを優先して使う
 * - ほかのサイト（広告・楽天の画像など）には手を出さない
 */
const PAGES = "pages-v1";
const ASSETS = "assets-v1";

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== PAGES && k !== ASSETS).map((k) => caches.delete(k)))).then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      caches.open(ASSETS).then(async (cache) => {
        const hit = await cache.match(req);
        if (hit) return hit;
        const res = await fetch(req);
        if (res.ok) cache.put(req, res.clone());
        return res;
      }),
    );
    return;
  }

  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(PAGES).then((cache) => cache.put(req, copy));
          }
          return res;
        })
        .catch(async () => (await caches.match(req)) || (await caches.match("/")) || Response.error()),
    );
  }
});
