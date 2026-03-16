"use client";

import Script from "next/script";
import { useEffect, useMemo, useRef, useState } from "react";

/**
 * Loads scripts strictly in order (one-by-one).
 * Useful when later scripts depend on globals created by earlier ones.
 */
export default function ScriptChain({ scripts, idPrefix = "script", onDone }) {
  const normalized = useMemo(() => {
    return (scripts || [])
      .filter(Boolean)
      .map((s) => ({
        strategy: "afterInteractive",
        ...s,
      }));
  }, [scripts]);

  const total = normalized.length;
  const [index, setIndex] = useState(0);
  const advanced = useRef(new Set());

  useEffect(() => {
    if (index >= total) onDone?.();
  }, [index, total, onDone]);

  if (total === 0) return null;

  const last = Math.min(index, total - 1);
  const renderCount = Math.min(last + 1, total);

  return (
    <>
      {normalized.slice(0, renderCount).map((s, i) => {
        const isCurrent = i === index;
        const key = s.id || s.src || `${idPrefix}-${i}`;
        const id = s.id || `${idPrefix}-${i}`;

        return (
          <Script
            key={key}
            id={id}
            src={s.src}
            strategy={s.strategy}
            type={s.type}
            crossOrigin={s.crossOrigin}
            referrerPolicy={s.referrerPolicy}
            onReady={
              isCurrent
                ? () => {
                    if (advanced.current.has(i)) return;
                    advanced.current.add(i);
                    setIndex((n) => n + 1);
                  }
                : undefined
            }
            onError={
              isCurrent
                ? () => {
                    if (advanced.current.has(i)) return;
                    advanced.current.add(i);
                    console.error(`[ScriptChain] Failed to load: ${s.src}`);
                    setIndex((n) => n + 1);
                  }
                : undefined
            }
          />
        );
      })}
    </>
  );
}

