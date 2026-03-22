"use strict";
const CACHE_VERSION = "v3.7";
const PRECACHE = `tengdosh-precache-${CACHE_VERSION}`;
const RUNTIME = `tengdosh-runtime-${CACHE_VERSION}`;

const SCOPE = self.registration ? self.registration.scope : (self.location.origin + "/");
const u = (path) => new URL(path, SCOPE).toString();
const uniq = (arr) => Array.from(new Set(arr));

const OFFLINE_FALLBACK = u("index.html");

const STATIC_EXT = /\.(?:js|css|mjs|png|jpg|jpeg|webp|gif|svg|ico|woff2?|ttf|otf)$/i;
const LIVE_UPDATE_EXT = /\.(?:js|css|mjs|json)$/i;

const ASSETS = uniq([
  u(""),
  u("index.html"),
  u("home.html"),
  u("auth/login.html"),
  u("auth/register.html"),
  u("auth/reset.html"),
  u("auth/banned.html"),
  u("pages/classes/classes.html"),
  u("pages/contact/contact.html"),
  u("pages/account/account.html"),
  u("pages/private chat/private_chat.html"),
  u("style.css"),
  u("pages/classes/classes.css"),
  u("pages/contact/contact.css"),
  u("assets/home-page.js"),
  u("assets/home-quotes.js"),
  u("assets/i18n.js"),
  u("script-internet-checker.js"),
  u("assets/UI.js"),
  u("assets/tu-firebase.js"),
  u("assets/quote-likes.js"),
  u("assets/pdf.js"),
  u("assets/online-lessons-uploader.js"),
  u("assets/theme-bridge.js"),
  u("assets/retro-foundation.css"),
  u("assets/club-index.css"),
  u("assets/auth-retro.css"),
  u("assets/private-chat-retro.css"),
  u("assets/incoming.mp3"),
  u("assets/outcoming.mp3"),
  u("assets/retro-scene.js"),
  u("assets/techers-sec.css"),
  u("assets/online-tech.css"),
  u("assets/offline-tech.css"),
  u("ping.txt"),
  u("icon.png"),
  u("logo.png"),
]);

const MAX_RUNTIME_ENTRIES = 60;
const MAX_RUNTIME_AGE_MS = 7 * 24 * 60 * 60 * 1000;

function isFirebaseApi(url) {
  const h = url.hostname;
  return (
    h.includes("firebaseio.com") ||
    h.includes("identitytoolkit.googleapis.com") ||
    h.includes("securetoken.googleapis.com")
  );
}

function shouldBypassBrowserCache(req) {
  try {
    const url = new URL(req.url);
    return url.origin === self.location.origin && (isHtmlRequest(req) || LIVE_UPDATE_EXT.test(url.pathname || ""));
  } catch (_) {
    return false;
  }
}

function fetchFresh(req) {
  try {
    return fetch(new Request(req, { cache: "no-store" }));
  } catch (_) {
    return fetch(req);
  }
}

self.addEventListener("install", (event) => {
  self.skipWaiting();
  
  event.waitUntil(
    caches.open(PRECACHE).then(async (cache) => {
      for (const asset of ASSETS) {
        try {
          const request = new Request(asset, { cache: 'reload' }); 
          const response = await fetch(request);
          if (response.ok) {
            await cache.put(request, response.clone());
            cache.put(asset + ".meta", new Response(String(Date.now()))).catch(() => {});
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
    self.clients.claim().then(() => cleanupCaches())
  );
});

self.addEventListener("message", (event) => {
  const data = event && event.data;
  if (data && data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("notificationclick", (event) => {
  try { event.notification.close(); } catch (_) {}
  const url = (event.notification && event.notification.data && event.notification.data.url) || "/";
  const target = new URL(url, SCOPE).toString();
  const targetUrl = new URL(target);

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(async (clientsArr) => {
      for (const client of clientsArr) {
        try {
          if (!client.url) continue;
          const clientUrl = new URL(client.url);
          if (clientUrl.origin !== targetUrl.origin) continue;
          if (client.url.startsWith(target)) {
            return client.focus();
          }
          if (clientUrl.pathname === targetUrl.pathname) {
            if (typeof client.navigate === "function" && client.url !== target) {
              try { await client.navigate(target); } catch (_) {}
            }
            return client.focus();
          }
        } catch (_) {}
      }
      return self.clients.openWindow(target);
    })
  );
});

function isHtmlRequest(req) {
  if (req.mode === "navigate") return true;
  const accept = req.headers.get("accept") || "";
  return accept.includes("text/html");
}

async function cacheFirst(req) {
  const cached = await caches.match(req);
  if (cached) return cached;
  const res = await fetch(req);
  if (res && res.status === 200) {
    const copy = res.clone();
    caches.open(RUNTIME).then((cache) => cache.put(req, copy)).catch(() => {});
    cleanupCaches().catch(() => {});
  }
  return res;
}

async function networkFirst(req) {
  try {
    const res = await (shouldBypassBrowserCache(req) ? fetchFresh(req) : fetch(req));
    if (res && res.status === 200) {
      const copy = res.clone();
      caches.open(RUNTIME).then((cache) => cache.put(req, copy)).catch(() => {});
      cleanupCaches().catch(() => {});
    }
    return res;
  } catch (_) {
    const cached = await caches.match(req);
    if (cached) return cached;
    const fallback = await caches.match(OFFLINE_FALLBACK);
    if (fallback) return fallback;
    return new Response("Offline", {
      status: 503,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }
}

async function staleWhileRevalidate(req) {
  const cached = await caches.match(req);
  const fetchPromise = fetch(req)
    .then((res) => {
      if (res && res.status === 200) {
        const copy = res.clone();
        caches.open(RUNTIME).then((cache) => cache.put(req, copy)).catch(() => {});
        cleanupCaches().catch(() => {});
      }
      return res;
    })
    .catch(() => null);
  return cached || (await fetchPromise) || new Response("Offline", { status: 503 });
}

async function cleanupCaches() {
  try {
    const keys = await caches.keys();
    await Promise.all(
      keys.map((key) => {
        if (key !== PRECACHE && key !== RUNTIME) return caches.delete(key);
      })
    );
  } catch (_) {}

  try {
    const cache = await caches.open(RUNTIME);
    const requests = await cache.keys();
    if (requests.length <= MAX_RUNTIME_ENTRIES) return;

    const metas = [];
    for (const req of requests) {
      if (req.url.endsWith(".meta")) continue;
      const meta = await cache.match(req.url + ".meta");
      const ts = meta ? Number(await meta.text()) : 0;
      metas.push({ req, ts });
    }

    metas.sort((a, b) => a.ts - b.ts);
    const now = Date.now();
    const tooOld = metas.filter((m) => m.ts && now - m.ts > MAX_RUNTIME_AGE_MS);
    const overflow = metas.slice(0, Math.max(0, metas.length - MAX_RUNTIME_ENTRIES));

    const toDelete = new Set();
    for (const m of tooOld.concat(overflow)) {
      toDelete.add(m.req.url);
      toDelete.add(m.req.url + ".meta");
    }

    await Promise.all(
      Array.from(toDelete).map((url) => cache.delete(url))
    );
  } catch (_) {}
}

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

  const pathname = url.pathname || "";
  const isStatic = STATIC_EXT.test(pathname);
  const isHtml = isHtmlRequest(req);
  const isLiveUpdateAsset = url.origin === self.location.origin && LIVE_UPDATE_EXT.test(pathname);

  if (isHtml || isLiveUpdateAsset) {
    event.respondWith(networkFirst(req));
    return;
  }

  if (isStatic) {
    event.respondWith(cacheFirst(req));
    return;
  }

  event.respondWith(staleWhileRevalidate(req));
});
