(() => {
  "use strict";

  
  
  
  const BRAND = "TENGDOSH-USTOZ";
  const BRAND_SHORT = "TU";
  const CONSOLE_TAG = "[TENGDOSH-USTOZ UI]";

  const FLAG = "__TENGDOSH_USTOZ_UI_LOADED__";
  if (globalThis[FLAG]) return;
  globalThis[FLAG] = { at: Date.now() };

  const GREEN = "#00FF41";
  const WHITE = "#E9EEF5";
  const DIM = "#8A8F98";
  const mono =
    'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace';

  const css = {
    banner: `color:${GREEN}; font-weight:800; line-height:1.05; font-family:${mono};`,
    white: `color:${WHITE}; font-family:${mono};`,
    dim: `color:${DIM}; font-family:${mono};`,
    green: `color:${GREEN}; font-weight:800; font-family:${mono};`,
  };

  function lockDocumentTitle(desiredTitle) {
    const head = document.head || document.getElementsByTagName("head")[0];

    const ensureOneTitle = () => {
      const all = head ? head.querySelectorAll("title") : document.querySelectorAll("title");
      let el = all[0];
      if (!el) {
        el = document.createElement("title");
        (head || document.documentElement).appendChild(el);
      }
      for (let i = 1; i < all.length; i++) all[i].remove();
      return el;
    };

    let titleEl = ensureOneTitle();

    titleEl.textContent = desiredTitle;
    document.title = desiredTitle;

    let internal = false;
    const sync = () => {
      if (internal) return;

      if (document.title !== desiredTitle) {
        internal = true;
        document.title = desiredTitle;
        internal = false;
      }
      if (titleEl.textContent !== desiredTitle) {
        internal = true;
        titleEl.textContent = desiredTitle;
        internal = false;
      }
    };

    const titleObserver = new MutationObserver(sync);
    titleObserver.observe(titleEl, { childList: true, characterData: true, subtree: true });

    const headObserver = new MutationObserver(() => {
      titleEl = ensureOneTitle();
      sync();
    });
    if (head) headObserver.observe(head, { childList: true, subtree: true });

    return {
      set: (t) => {
        desiredTitle = String(t);
        sync();
      },
      stop: () => {
        titleObserver.disconnect();
        headObserver.disconnect();
      },
    };
  }

  function prettifyFileName(file) {
    return (file || "")
      .replace(/\.html$/i, "")
      .replace(/[._-]+/g, " ")
      .trim()
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }

  function getShortPageName() {
    const pathname = decodeURIComponent(location.pathname || "/");
    const qs = new URLSearchParams(location.search || "");

    if (pathname === "/" || pathname.endsWith("/index.html")) return "";

    
    if (pathname.endsWith("/pages/study_materials/study_materials.html")) return "Study Materials";
    if (pathname.endsWith("/pages/chat/global.chat.html")) return "Global Chat";

    if (pathname.endsWith("/pages/study_materials/bridge.html")) {
      const mode = (qs.get("mode") || "").trim();
      if (!mode) return "Bridge";
      const niceMode = mode[0].toUpperCase() + mode.slice(1);
      return `Bridge — ${niceMode}`;
    }

    {
      const m = pathname.match(/\/reading\/test\d+\/pass(\d+)\/.+\.html$/i);
      if (m) return `Pass ${m[1]}`;
    }

    {
      const m = pathname.match(/\/listenings?\/test\d+\/sec(\d+)\/.+\.html$/i);
      if (m) return `Section ${m[1]}`;
    }

    const fileOnly = (pathname.split("/").filter(Boolean).pop() || "").trim();
    return prettifyFileName(fileOnly) || "Page";
  }

  function buildBrandTitle() {
    const page = getShortPageName();
    return page ? `${BRAND} | ${page}` : BRAND;
  }

  const titleLock = lockDocumentTitle(buildBrandTitle());

  function refreshTitle() {
    titleLock.set(buildBrandTitle());
  }

  window.addEventListener("popstate", refreshTitle);
  window.addEventListener("hashchange", refreshTitle);

  const _pushState = history.pushState;
  const _replaceState = history.replaceState;

  history.pushState = function (...args) {
    const r = _pushState.apply(this, args);
    refreshTitle();
    return r;
  };
  history.replaceState = function (...args) {
    const r = _replaceState.apply(this, args);
    refreshTitle();
    return r;
  };

  refreshTitle();

  console.log(`%c${CONSOLE_TAG} v2.0 (NO COMMANDS) LOADED`, css.green);

  const art = String.raw`
████████╗███████╗███╗   ██╗ ██████╗ ██████╗  ██████╗ ███████╗██╗  ██╗
╚══██╔══╝██╔════╝████╗  ██║██╔════╝ ██╔══██╗██╔═══██╗██╔════╝██║  ██║
   ██║   █████╗  ██╔██╗ ██║██║  ███╗██║  ██║██║   ██║███████╗███████║
   ██║   ██╔══╝  ██║╚██╗██║██║   ██║██║  ██║██║   ██║╚════██║██╔══██║
   ██║   ███████╗██║ ╚████║╚██████╔╝██████╔╝╚██████╔╝███████║██║  ██║
   ╚═╝   ╚══════╝╚═╝  ╚═══╝ ╚═════╝ ╚═════╝  ╚═════╝ ╚══════╝╚═╝  ╚═╝
`.trimEnd();

  const makeKey = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    const seg = (n) =>
      Array.from({ length: n }, () => chars[(Math.random() * chars.length) | 0]).join("");
    return `${BRAND_SHORT}-${seg(4)}-${seg(4)}-${seg(4)}-${seg(4)}`;
  };

  const LICENSE = {
    status: "VALID",
    edition: "Student Interface",
    key: makeKey(),
    issuedTo: "Local Session",
  };

  console.log(`%c${art}`, css.banner);

  console.log(`%cBooting %c${BRAND}%c interface…`, css.white, css.green, css.white);
  console.log("%cLicense verification… %cOK", css.dim, css.green);

  const W = 66;
  const top = "┌" + "─".repeat(W) + "┐";
  const bot = "└" + "─".repeat(W) + "┘";
  const line = (t = "") => `│ ${String(t).padEnd(W - 1, " ")}│`;

  const card =
    top +
    "\n" +
    line(`${BRAND} LICENSE`) +
    "\n" +
    line("") +
    "\n" +
    line(`Status: ${LICENSE.status}`) +
    "\n" +
    line(`Edition: ${LICENSE.edition}`) +
    "\n" +
    line(`Key: ${LICENSE.key}`) +
    "\n" +
    line(`Issued To: ${LICENSE.issuedTo}`) +
    "\n" +
    line("") +
    "\n" +
    bot;

  console.log(`%c${card}`, css.dim);
})();

(function registerTengdoshUstozServiceWorker() {
  "use strict";

  if (window.__TENGDOSH_USTOZ_SW_REG_DONE) return;
  window.__TENGDOSH_USTOZ_SW_REG_DONE = true;

  const LOG = true;
  const CHECK_EVERY_MIN = 10;

  const log = (...a) => LOG && console.log("[SW-REG]", ...a);
  const warn = (...a) => LOG && console.warn("[SW-REG]", ...a);

  const isLocalhost =
    location.hostname === "localhost" ||
    location.hostname === "127.0.0.1" ||
    location.hostname === "[::1]";

  if (!("serviceWorker" in navigator)) {
    warn("Service workers not supported in this browser.");
    return;
  }

  if (location.protocol !== "https:" && !isLocalhost) {
    warn("SW requires HTTPS (or localhost). Current:", location.protocol);
    return;
  }

  async function findSwUrl() {
    const candidates = ["/sw.js", "./sw.js", "../sw.js", "../../sw.js", "../../../sw.js", "../../../../sw.js"];

    for (const p of candidates) {
      try {
        const url = new URL(p, location.href).toString();
        const res = await fetch(url, { cache: "no-store" });
        if (res.ok) return url;
      } catch (_) {}
    }
    return null;
  }

  function computeScopeFromSwUrl(swUrl) {
    try {
      const u = new URL(swUrl);
      const scopePath = u.pathname.replace(/[^/]*$/, "");
      return scopePath || "/";
    } catch {
      return "/";
    }
  }

  async function register() {
    const swUrl = await findSwUrl();
    if (!swUrl) {
      warn("Could not locate sw.js. Make sure sw.js is deployed (ideally at site root: /sw.js).");
      return;
    }

    const scope = computeScopeFromSwUrl(swUrl);

    try {
      const reg = await navigator.serviceWorker.register(swUrl, {
        scope,
        updateViaCache: "none",
      });
      reg.update().catch(() => {});

      if (reg.waiting) {
        log("Update waiting → telling it to SKIP_WAITING");
        reg.waiting.postMessage({ type: "SKIP_WAITING" });
      }

      reg.addEventListener("updatefound", () => {
        const sw = reg.installing;
        if (!sw) return;
        sw.addEventListener("statechange", () => {
          if (sw.state === "installed") {
            if (navigator.serviceWorker.controller) {
              log("New SW installed → SKIP_WAITING");
              sw.postMessage({ type: "SKIP_WAITING" });
            } else {
              log("SW installed for first time.");
            }
          }
        });
      });

      let refreshed = false;
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        if (refreshed) return;
        refreshed = true;
        log("Controller changed → reloading page once.");
        location.reload();
      });

      if (CHECK_EVERY_MIN > 0) {
        setInterval(() => {
          reg.update().catch(() => {});
        }, CHECK_EVERY_MIN * 60 * 1000);
      }
    } catch (err) {
      warn("Registration failed:", err);
      warn("Common causes: sw.js not at the expected path, wrong MIME type, or hosting config blocks it.");
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", register);
  } else {
    register();
  }
})();

(() => {
  "use strict";

  if (window.__TENGDOSH_USTOZ_CHECKER_LOADER__) return;
  window.__TENGDOSH_USTOZ_CHECKER_LOADER__ = true;

  const CHECKER_SRC = "/script-internet-checker.js";
  const CHECKER_VERSION = "2";

  function injectChecker() {
    const already = [...document.scripts].some((s) => (s.src || "").includes(CHECKER_SRC));
    if (already) return;

    const s = document.createElement("script");
    const v = CHECKER_VERSION ? `v=${encodeURIComponent(CHECKER_VERSION)}` : "";
    s.src = v ? (CHECKER_SRC + (CHECKER_SRC.includes("?") ? "&" : "?") + v) : CHECKER_SRC;
    s.defer = true;

    (document.head || document.documentElement).appendChild(s);
  }

  function schedule() {
    if ("requestIdleCallback" in window) {
      requestIdleCallback(injectChecker, { timeout: 3000 });
    } else {
      setTimeout(injectChecker, 1500);
    }
  }

  if (document.readyState === "complete") {
    schedule();
  } else {
    window.addEventListener("load", schedule, { once: true });
  }
})();

(() => {
  "use strict";

  if (window.__TENGDOSH_USTOZ_RETRO_SCENE__) return;
  window.__TENGDOSH_USTOZ_RETRO_SCENE__ = true;

  const path = decodeURIComponent(location.pathname || "");
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  const effectiveType = String(connection && connection.effectiveType ? connection.effectiveType : "").toLowerCase();
  const slowConnection = !!(
    connection && (
      connection.saveData ||
      effectiveType.includes("slow-2g") ||
      effectiveType.includes("2g") ||
      effectiveType.includes("3g")
    )
  );
  const lowMemory = typeof navigator.deviceMemory === "number" && navigator.deviceMemory > 0 && navigator.deviceMemory < 4;

  if (path.includes("/pages/private chat/")) return;
  if (document.body && document.body.dataset && document.body.dataset.noRetroScene === "true") return;
  if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  if (window.innerWidth < 1100 || slowConnection || lowMemory) return;

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const existing = [...document.scripts].find((script) => (script.src || "").includes(src));
      if (existing) {
        if (existing.dataset.loaded === "true") resolve();
        else {
          existing.addEventListener("load", () => resolve(), { once: true });
          existing.addEventListener("error", reject, { once: true });
        }
        return;
      }

      const script = document.createElement("script");
      script.src = src;
      script.defer = true;
      script.dataset.loaded = "false";
      script.addEventListener(
        "load",
        () => {
          script.dataset.loaded = "true";
          resolve();
        },
        { once: true }
      );
      script.addEventListener("error", reject, { once: true });
      (document.head || document.documentElement).appendChild(script);
    });
  }

  async function bootRetroScene() {
    try {
      if (!window.THREE) {
        await loadScript("https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js");
      }
      await loadScript("/assets/retro-scene.js?v=10");
    } catch (error) {
      console.warn("[RETRO-SCENE] Failed to initialize:", error);
    }
  }

  function schedule() {
    if ("requestIdleCallback" in window) {
      requestIdleCallback(() => void bootRetroScene(), { timeout: 6000 });
    } else {
      setTimeout(() => void bootRetroScene(), 2500);
    }
  }

  if (document.readyState === "complete") schedule();
  else window.addEventListener("load", schedule, { once: true });
})();
