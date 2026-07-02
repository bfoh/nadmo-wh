'use client';

import { useEffect, useRef, useState } from 'react';

interface AnimatedNumberProps {
  value: number;
  /** ms; the count-up duration. */
  duration?: number;
  /** Intl.NumberFormat options (e.g. thousands separators). */
  format?: Intl.NumberFormatOptions;
  className?: string;
}

/**
 * Counts up to `value` on mount. Respects prefers-reduced-motion (renders the
 * final value immediately) and is SSR-safe (renders the final value on the
 * server / first paint, then animates on the client).
 */
export function AnimatedNumber({ value, duration = 900, format, className }: AnimatedNumberProps) {
  const [display, setDisplay] = useState(value);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const reduce =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    if (reduce || duration <= 0) {
      setDisplay(value);
      return;
    }

    const from = 0;
    const start = performance.now();
    // ease-out cubic
    const ease = (t: number) => 1 - Math.pow(1 - t, 3);

    function tick(now: number) {
      const t = Math.min(1, (now - start) / duration);
      setDisplay(from + (value - from) * ease(t));
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [value, duration]);

  const formatter = new Intl.NumberFormat('en-US', format);
  return <span className={className}>{formatter.format(Math.round(display))}</span>;
}
