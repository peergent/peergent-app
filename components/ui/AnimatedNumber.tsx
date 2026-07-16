"use client";

import { useEffect, useRef, useState } from "react";
import { duration, easing } from "@/lib/ui/motion";
import { cn } from "@/lib/ui/cn";

export type AnimatedNumberProps = {
  value: number;
  /** ms */
  duration?: number;
  /** Optional formatter — e.g. percent, currency. */
  format?: (value: number) => string;
  className?: string;
};

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

export default function AnimatedNumber({
  value,
  duration: durationMs = duration.slow,
  format = (n) => Math.round(n).toLocaleString(),
  className,
}: AnimatedNumberProps) {
  const [display, setDisplay] = useState(value);
  const fromRef = useRef(value);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    const from = fromRef.current;
    const to = value;
    const start = performance.now();

    if (from === to) {
      setDisplay(to);
      return;
    }

    const tick = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / durationMs, 1);
      const eased = easeOutCubic(progress);
      const current = from + (to - from) * eased;

      setDisplay(current);

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(tick);
      } else {
        fromRef.current = to;
      }
    };

    frameRef.current = requestAnimationFrame(tick);

    return () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [value, durationMs]);

  return (
    <span
      className={cn(
        "tabular-nums transition-opacity duration-[var(--pg-duration-fast)]",
        className
      )}
      style={{ transitionTimingFunction: easing.standard }}
    >
      {format(display)}
    </span>
  );
}
