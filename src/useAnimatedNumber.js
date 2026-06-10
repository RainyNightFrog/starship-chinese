import { useEffect, useRef, useState } from 'react';

/**
 * 金幣數字滾動動畫 — 兌換扣款時平滑過渡（如 120 → 90）
 */
export function useAnimatedNumber(value, durationMs = 550) {
  const [display, setDisplay] = useState(value);
  const displayRef = useRef(value);

  useEffect(() => {
    const from = displayRef.current;
    const to = value;
    if (from === to) return undefined;

    const start = performance.now();
    let raf;

    const tick = (now) => {
      const p = Math.min(1, (now - start) / durationMs);
      const eased = 1 - (1 - p) ** 3;
      const next = Math.round(from + (to - from) * eased);
      setDisplay(next);
      displayRef.current = next;
      if (p < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        displayRef.current = to;
      }
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, durationMs]);

  return display;
}
