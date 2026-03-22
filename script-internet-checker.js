(() => {
  "use strict";

  if (window.__TU_CONNECTIVITY_CHECKER__) return;
  window.__TU_CONNECTIVITY_CHECKER__ = true;

  const BANNER_ID = "tu-connection-banner";
  const STYLE_ID = "tu-connection-banner-style";
  const OFFLINE_TEXT = "You're offline. Some live data may be unavailable.";
  const SLOW_TEXT = "Slow connection detected. Heavy visuals stay reduced for faster loading.";

  function ensureStyles() {
    if (document.getElementById(STYLE_ID)) return;

    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      #${BANNER_ID} {
        position: fixed;
        left: 50%;
        bottom: 1rem;
        z-index: 120;
        display: flex;
        align-items: center;
        gap: 0.6rem;
        max-width: min(92vw, 520px);
        padding: 0.75rem 1rem;
        border: 1px solid rgba(201, 162, 39, 0.28);
        border-radius: 999px;
        background: rgba(23, 20, 16, 0.92);
        color: #efe5d2;
        box-shadow: 0 18px 40px rgba(0, 0, 0, 0.24);
        backdrop-filter: blur(18px);
        -webkit-backdrop-filter: blur(18px);
        font: 600 0.8rem/1.35 "Inter", system-ui, sans-serif;
        letter-spacing: 0.02em;
        transform: translate(-50%, 120%);
        opacity: 0;
        pointer-events: none;
        transition: transform 220ms ease, opacity 220ms ease;
      }

      html[data-theme="light"] #${BANNER_ID} {
        background: rgba(255, 249, 239, 0.96);
        color: #3a2d1c;
        border-color: rgba(139, 105, 20, 0.24);
      }

      #${BANNER_ID}.is-visible {
        transform: translate(-50%, 0);
        opacity: 1;
      }

      #${BANNER_ID}::before {
        content: "";
        width: 0.65rem;
        height: 0.65rem;
        flex: 0 0 auto;
        border-radius: 999px;
        background: #e16259;
        box-shadow: 0 0 0 6px rgba(225, 98, 89, 0.16);
      }

      #${BANNER_ID}[data-mode="slow"]::before {
        background: #c9a227;
        box-shadow: 0 0 0 6px rgba(201, 162, 39, 0.16);
      }
    `;

    document.head.appendChild(style);
  }

  function ensureBanner() {
    let banner = document.getElementById(BANNER_ID);
    if (banner) return banner;

    ensureStyles();
    banner = document.createElement("div");
    banner.id = BANNER_ID;
    banner.setAttribute("role", "status");
    banner.setAttribute("aria-live", "polite");
    document.body.appendChild(banner);
    return banner;
  }

  function getConnection() {
    return navigator.connection || navigator.mozConnection || navigator.webkitConnection || null;
  }

  function isSlowConnection() {
    const connection = getConnection();
    if (!connection) return false;
    const type = String(connection.effectiveType || "").toLowerCase();
    return !!(
      connection.saveData ||
      type.includes("slow-2g") ||
      type.includes("2g") ||
      type.includes("3g")
    );
  }

  function setBanner(mode) {
    const banner = ensureBanner();

    if (!mode) {
      banner.classList.remove("is-visible");
      return;
    }

    banner.dataset.mode = mode;
    banner.textContent = mode === "offline" ? OFFLINE_TEXT : SLOW_TEXT;
    banner.classList.add("is-visible");
  }

  function update() {
    if (!navigator.onLine) {
      setBanner("offline");
      return;
    }

    if (isSlowConnection()) {
      setBanner("slow");
      return;
    }

    setBanner("");
  }

  const start = () => {
    update();
    window.addEventListener("online", update, { passive: true });
    window.addEventListener("offline", update, { passive: true });
    const connection = getConnection();
    if (connection && typeof connection.addEventListener === "function") {
      connection.addEventListener("change", update);
    }
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})();
