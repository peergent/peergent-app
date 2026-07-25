"use client";

import { useEffect, useState } from "react";
import { useReducedMotion } from "motion/react";
import { cn } from "@/lib/ui/cn";

export type EmmaAnimatedCounterProps = {
  value: number;
  className?: string;
  suffix?: string;
};

export default function EmmaAnimatedCounter({
  value,
  className,
  suffix = "",
}: EmmaAnimatedCounterProps) {
  const reduceMotion = useReducedMotion();
  const [display, setDisplay] = useState(reduceMotion ? value : 0);

  useEffect(() => {
    if (reduceMotion) {
      setDisplay(value);
      return;
    }

    const start = display;
    const diff = value - start;
    if (diff === 0) return;

    const duration = 600;
    const startTime = performance.now();

    let frame = 0;
    const tick = (now: number) => {
      const elapsed = now - startTime;
      const t = Math.min(1, elapsed / duration);
      const eased = 1 - (1 - t) ** 3;
      setDisplay(Math.round(start + diff * eased));
      if (t < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- animate from current display
  }, [value, reduceMotion]);

  return (
    <span className={cn("emma-counter", className)}>
      {display}
      {suffix}
    </span>
  );
}
