"use client";

import { useCallback, useMemo, useState } from "react";
import TuScripts from "../../components/TuScripts";

export default function ScriptsDemo() {
  const [ready, setReady] = useState(false);

  const detect = useCallback(() => {
    setReady(true);
  }, []);

  const status = useMemo(() => {
    const hasFirebase = typeof globalThis.firebase !== "undefined";
    const hasTU = typeof globalThis.TU !== "undefined";
    const hasDb = !!globalThis.TU?.db;
    const hasAuth = !!globalThis.TU?.auth;
    const hasI18n = typeof globalThis.TU_i18n !== "undefined";
    return { hasFirebase, hasTU, hasDb, hasAuth, hasI18n };
  }, [ready]);

  return (
    <main style={{ fontFamily: "system-ui", padding: 24, maxWidth: 820 }}>
      <h1 style={{ marginTop: 0 }}>Next.js script loader (ordered)</h1>
      <p style={{ marginTop: 0, opacity: 0.8 }}>
        Loads Firebase -&gt; config -&gt; TU -&gt; i18n in order, without racing.
      </p>

      <TuScripts preset="site" autoInit onReady={detect} />

      <div
        style={{
          marginTop: 16,
          padding: 16,
          border: "1px solid rgba(0,0,0,0.12)",
          borderRadius: 12,
        }}
      >
        <div>firebase: {status.hasFirebase ? "OK" : "..."}</div>
        <div>TU: {status.hasTU ? "OK" : "..."}</div>
        <div>TU.auth: {status.hasAuth ? "OK" : "..."}</div>
        <div>TU.db: {status.hasDb ? "OK" : "..."}</div>
        <div>TU_i18n: {status.hasI18n ? "OK" : "..."}</div>
      </div>

      <p style={{ marginTop: 16, opacity: 0.7 }}>
        Note: local scripts must exist in <code>public/</code> for <code>/assets/...</code> and{" "}
        <code>/script-internet-checker.js</code> to load.
      </p>
    </main>
  );
}
