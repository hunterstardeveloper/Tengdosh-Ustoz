(function () {
  "use strict";

  const CFG = {
    blockContextMenu: true,
    blockShortcuts: true,
    blockAllCtrlCmdLetters: true,
    reactOnDevtools: true,
    devtoolsReaction: "overlay", // "overlay" | "blur" | "redirect"
    redirectTo: "/auth/banned.html",
  };

  const isMac = /Mac|iPhone|iPad|iPod/i.test(navigator.platform || navigator.userAgent);

  function stop(e) {
    e.preventDefault();
    e.stopPropagation();
    if (e.stopImmediatePropagation) e.stopImmediatePropagation();
    return false;
  }

  function addCap(target, type, fn) {
    target.addEventListener(type, fn, { capture: true, passive: false });
  }

  function ensureOverlay() {
    let el = document.getElementById("__lock_overlay__");
    if (el) return el;

    el = document.createElement("div");
    el.id = "__lock_overlay__";
    el.style.cssText =
      "position:fixed;inset:0;z-index:2147483647;" +
      "display:flex;align-items:center;justify-content:center;" +
      "background:rgba(0,0,0,.75);backdrop-filter:blur(6px);" +
      "color:#fff;font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial;" +
      "text-align:center;padding:24px;";
    el.innerHTML =
      '<div style="max-width:520px">' +
      '<div style="font-size:26px;font-weight:800;margin-bottom:10px">Access Restricted</div>' +
      '<div style="opacity:.9;line-height:1.4">This page is locked.</div>' +
      "</div>";

    document.documentElement.appendChild(el);
    return el;
  }

  function lockUI() {
    if (!CFG.reactOnDevtools) return;

    if (CFG.devtoolsReaction === "redirect") {
      try { location.href = CFG.redirectTo; } catch (_) {}
      return;
    }
    if (CFG.devtoolsReaction === "blur") {
      document.documentElement.style.filter = "blur(6px)";
      return;
    }
    ensureOverlay().style.display = "flex";
  }

  function unlockUI() {
    const el = document.getElementById("__lock_overlay__");
    if (el) el.style.display = "none";
    document.documentElement.style.filter = "";
  }

  if (CFG.blockContextMenu) {
    addCap(window, "contextmenu", (e) => stop(e));
  }

  if (CFG.blockShortcuts) {
    addCap(window, "keydown", (e) => {
      const ctrlOrCmd = e.ctrlKey || e.metaKey;

      if (e.key === "F12" || e.code === "F12") return stop(e);

      if (!isMac && e.ctrlKey && e.shiftKey) {
        const c = e.code;
        if (c === "KeyI" || c === "KeyJ" || c === "KeyC" || c === "KeyK") return stop(e);
      }

      if (isMac && e.metaKey && e.altKey) {
        const c = e.code;
        if (c === "KeyI" || c === "KeyJ" || c === "KeyC") return stop(e);
      }

      if (CFG.blockAllCtrlCmdLetters && ctrlOrCmd && /^Key[A-Z]$/.test(e.code)) {
        return stop(e);
      }
    });

    addCap(window, "keyup", (e) => {
      const ctrlOrCmd = e.ctrlKey || e.metaKey;
      if (CFG.blockAllCtrlCmdLetters && ctrlOrCmd && /^Key[A-Z]$/.test(e.code)) {
        return stop(e);
      }
    });
  }

  // DevTools detection (heuristics) — not reliable, but adds friction
  let devtoolsLikely = false;

  function checkDevtoolsBySize() {
    const w = window.outerWidth - window.innerWidth;
    const h = window.outerHeight - window.innerHeight;
    return (w > 160 || h > 160);
  }

  function checkDevtoolsByDebuggerTiming() {
    const t0 = performance.now();
    debugger; // if DevTools open + pause on debugger, timing jumps
    const dt = performance.now() - t0;
    return dt > 120;
  }

  function tick() {
    let detected = false;

    try { detected = detected || checkDevtoolsBySize(); } catch (_) {}
    try { detected = detected || checkDevtoolsByDebuggerTiming(); } catch (_) {}

    if (detected && !devtoolsLikely) {
      devtoolsLikely = true;
      lockUI();
    } else if (!detected && devtoolsLikely) {
      devtoolsLikely = false;
      unlockUI();
    }
  }

  if (CFG.reactOnDevtools) {
    setInterval(tick, 600);
    addCap(window, "resize", tick);
    addCap(window, "focus", tick);
    addCap(document, "visibilitychange", tick);
  }
})();