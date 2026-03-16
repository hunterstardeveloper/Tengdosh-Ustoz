"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import ScriptChain from "./ScriptChain";

const FIREBASE_VERSION = "10.7.1";
const REMOTE = { crossOrigin: "anonymous", referrerPolicy: "no-referrer" };

const PRESETS = {
  core: [
    { src: `https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}/firebase-app-compat.js`, ...REMOTE },
    { src: `https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}/firebase-auth-compat.js`, ...REMOTE },
    { src: `https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}/firebase-database-compat.js`, ...REMOTE },
    { src: "/assets/firebase-config.js" },
    { src: "/assets/tu-firebase.js" },
    { src: "/assets/i18n.js" },
  ],
  site: [
    { src: `https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}/firebase-app-compat.js`, ...REMOTE },
    { src: `https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}/firebase-auth-compat.js`, ...REMOTE },
    { src: `https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}/firebase-database-compat.js`, ...REMOTE },
    { src: "/assets/firebase-config.js" },
    { src: "/assets/tu-firebase.js" },
    { src: "/assets/i18n.js" },
    // Heavy/non-critical UI helpers
    { src: "/script-internet-checker.js", strategy: "lazyOnload" },
    { src: "/assets/UI.js", strategy: "lazyOnload" },
  ],
  home: [
    { src: `https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}/firebase-app-compat.js`, ...REMOTE },
    { src: `https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}/firebase-auth-compat.js`, ...REMOTE },
    { src: `https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}/firebase-database-compat.js`, ...REMOTE },
    { src: "/assets/firebase-config.js" },
    { src: "/assets/tu-firebase.js" },
    { src: "/assets/quote-likes.js" },
    { src: "https://unpkg.com/lucide@latest", ...REMOTE },
    { src: "/script.js", strategy: "lazyOnload" },
    { src: "/assets.js", strategy: "lazyOnload" },
    { src: "/script-internet-checker.js", strategy: "lazyOnload" },
    { src: "/assets/i18n.js" },
    { src: "/assets/UI.js", strategy: "lazyOnload" },
  ],
};

export default function TuScripts({ preset = "site", autoInit = false, onReady }) {
  const scripts = useMemo(() => {
    return PRESETS[preset] || PRESETS.site;
  }, [preset]);

  const [done, setDone] = useState(false);
  const ranReady = useRef(false);

  useEffect(() => {
    if (!done) return;
    if (ranReady.current) return;
    ranReady.current = true;

    if (autoInit) {
      try {
        if (globalThis.TU && typeof globalThis.TU.init === "function") {
          globalThis.TU.init();
        }
      } catch (e) {
        console.error(e);
      }
    }

    onReady?.();
  }, [done, autoInit, onReady]);

  return <ScriptChain scripts={scripts} idPrefix={`tu-${preset}`} onDone={() => setDone(true)} />;
}
