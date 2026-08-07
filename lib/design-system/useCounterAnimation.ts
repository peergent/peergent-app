"use client";

import { useEffect, useState } from "react";
import { DS_MOTION } from "./motion";
import { usePrefersReducedMotion } from "./usePrefersReducedMotion";

function parseNumericValue(formatted: string): { prefix: string; number: number; suffix: string } | null {
  const match = formatted.match(/^([^0-9\-]*)(-?[\d.,]+)(.*)$/);
  if (!match) return null;
  const raw = match[2].replace(/\./g, "").replace(",", ".");
  const number = Number.parseFloat(raw);
  if (Number.isNaN(number)) return null;
  return { prefix: match[1], number, suffix: match[3] };
}

export function useCounterAnimation(
  value: string,
  enabled = true
): string {
  const reduced = usePrefersReducedMotion();
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    if (!enabled || reduced) {
      setDisplay(value);
      return;
    }

    const parsed = parseNumericValue(value);
    if (!parsed || parsed.number === 0) {
      setDisplay(value);
      return;
    }

    const target = parsed.number;
    const start = performance.now();
    const duration = DS_MOTION.counter;

    let frame = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - (1 - t) ** 3;
      const current = Math.round(target * eased);
      const formatted =
        parsed.prefix +
        current.toLocaleString(undefined, { maximumFractionDigits: 0 }) +
        parsed.suffix;
      setDisplay(formatted);
      if (t < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [enabled, reduced, value]);

  return display;
}
