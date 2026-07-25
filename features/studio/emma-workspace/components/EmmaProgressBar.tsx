"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/ui/cn";

export type EmmaProgressBarProps = {
  progress: number;
  status: "complete" | "active" | "pending";
  label: string;
  className?: string;
};

export default function EmmaProgressBar({
  progress,
  status,
  label,
  className,
}: EmmaProgressBarProps) {
  const reduceMotion = useReducedMotion();
  const [displayProgress, setDisplayProgress] = useState(progress);

  useEffect(() => {
    if (reduceMotion) {
      setDisplayProgress(progress);
      return;
    }
    const id = window.setTimeout(() => setDisplayProgress(progress), 80);
    return () => window.clearTimeout(id);
  }, [progress, reduceMotion]);

  useEffect(() => {
    if (!reduceMotion && status === "active") {
      const interval = window.setInterval(() => {
        setDisplayProgress((prev) => {
          const cap = Math.min(progress + 8, 98);
          return prev >= cap ? prev : prev + 0.5;
        });
      }, 1200);
      return () => window.clearInterval(interval);
    }
    return undefined;
  }, [status, progress, reduceMotion]);

  return (
    <div className={cn("emma-progress", className)}>
      <div className="emma-progress__row">
        <span className="emma-progress__label">{label}</span>
        <span className="emma-progress__value">{Math.round(displayProgress)}%</span>
      </div>
      <div className="emma-progress__track" aria-hidden>
        <motion.div
          className={cn(
            "emma-progress__fill",
            status === "complete" && "emma-progress__fill--complete",
            status === "active" && "emma-progress__fill--active"
          )}
          initial={false}
          animate={{ width: `${displayProgress}%` }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>
    </div>
  );
}
