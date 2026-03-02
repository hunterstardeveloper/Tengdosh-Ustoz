"use strict";
const CACHE_VERSION = "tengdosh-v10.1.1";
const CACHE_NAME = `tengdosh-cache-${CACHE_VERSION}`;

const SCOPE = self.registration ? self.registration.scope : (self.location.origin + "/");
const u = (path) => new URL(path, SCOPE).toString();
const uniq = (arr) => Array.from(new Set(arr));

const OFFLINE_FALLBACK = u("index.html");

const ASSETS = uniq([
  u(""),
  u("index.html"),
  u("register.html"),
  u("style.css"),
  u("script.js"),
  u("assets.js"),
  u("script-internet-checker.js"),
  u("favicon.ico"),
  u("ping.txt"),
  u("assets/techers-sec.css"),
  u("assets/base64.js"),
  u("assets/techers-sec.js"),
  u("Elements/icon.png"),
  u("Elements/icon light.png"),
  u("clubs/english/teachers-sec-eng.html"),
  u("clubs/full-stack/teachers-sec-FS.html"),
  u("clubs/java/teachers-sec-Json.html"),
  u("clubs/py/teachers-sec-py.html"),
  u("clubs/SI/teachers-sec-SI.html"),
]);

function isFirebaseApi(url) {
  const h = url.hostname;
  return (
    h.includes("firebaseio.com") ||
    h.includes("firebasedatabase.app") ||
    (h.includes("googleapis.com") &&
      (url.pathname.includes("identitytoolkit") ||
        url.pathname.includes("securetoken") ||
        url.pathname.includes("/firebaseinstallations/")))
  );
}

async function addAllSafe(cache, urls) {
  for (const url of urls) {
    try {
      const res = await fetch(new Request(url, { cache: "reload" }));
      if (res && res.ok) await cache.put(url, res.clone());
    } catch (err) {
    }
  }
}

self.addEventListener("install", (e) => {
  e.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      await addAllSafe(cache, ASSETS);

      try {
        const res = await fetch(new Request(OFFLINE_FALLBACK, { cache: "reload" }));
        if (res && res.ok) await cache.put(OFFLINE_FALLBACK, res.clone());
      } catch (_) {}

      self.skipWaiting();
    })()
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    (async () => {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map((n) => (n !== CACHE_NAME ? caches.delete(n) : undefined))
      );
      await self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  let url;
  try {
    url = new URL(req.url);
  } catch (e) {
    
    
    event.respondWith(fetch(req));
    return;
  }

  if (isFirebaseApi(url)) return;

  if (url.pathname.endsWith("/ping.txt")) {
    event.respondWith(
      fetch(new Request(req, { cache: "no-store" }))
        .catch(() => new Response("", { status: 503 }))
    );
    return;
  }

  const networkOnly =
    req.cache === "no-store" ||
    url.searchParams.has("sw-network-only") ||
    req.headers.get("x-sw-network-only") === "1";

  if (networkOnly) {
    event.respondWith(fetch(req).catch(() => new Response("", { status: 503 })));
    return;
  }

  event.respondWith(
    fetch(req)
      .then((networkRes) => {
        if (networkRes && networkRes.status === 200) {
          const copy = networkRes.clone();
          event.waitUntil(
            caches.open(CACHE_NAME).then((cache) => cache.put(req, copy)).catch(() => {}
            )
          );
        }
        return networkRes;
      })
      .catch(async () => {
        const cached = await caches.match(req);
        if (cached) return cached;

        if (req.mode === "navigate") {
          const fallback = await caches.match(OFFLINE_FALLBACK);
          if (fallback) return fallback;
        }

        return new Response("Offline", {
          status: 503,
          headers: { "Content-Type": "text/plain; charset=utf-8" },
        });
      })
  );
});

self.addEventListener("message", (event) => {
  const data = event.data;
  if (!data) return;
  if (data.action === "skipWaiting" || data.type === "SKIP_WAITING" || data === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
