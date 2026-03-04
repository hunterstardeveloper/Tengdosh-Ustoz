"use strict";
const CACHE_VERSION = "tengdosh-v15.1.3"; 
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
  u("icon.png"),
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
    h.includes("firestore.googleapis.com") ||
    h.includes("identitytoolkit.googleapis.com") ||
    h.includes("securetoken.googleapis.com")
  );
}

self.addEventListener("install", (event) => {
  self.skipWaiting();
  
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      for (const asset of ASSETS) {
        try {
          const request = new Request(asset, { cache: 'reload' }); 
          const response = await fetch(request);
          if (response.ok) {
            await cache.put(request, response);
          } else {
            console.warn(`[Service Worker] Skipping missing file: ${asset} (Status: ${response.status})`);
          }
        } catch (error) {
          console.warn(`[Service Worker] Failed to fetch ${asset}:`, error);
        }
      }
    })
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    self.clients.claim().then(() =>
      caches.keys().then((keys) =>
        Promise.all(
          keys.map((key) => {
            if (key !== CACHE_NAME) return caches.delete(key);
          })
        )
      )
    )
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);

  if (isFirebaseApi(url)) return;

  if (url.pathname.endsWith("/ping.txt")) {
    event.respondWith(
      fetch(req).catch(() => new Response("", { status: 503 }))
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
            caches.open(CACHE_NAME).then((cache) => cache.put(req, copy)).catch(() => {})
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