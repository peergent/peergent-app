"use client";

import { useEffect, useId, useState } from "react";
import { cn } from "@/lib/ui/cn";

const STATIC_PATHS = [
  "M 200 150 L 280 95 L 340 110",
  "M 200 150 L 310 150 L 360 180",
  "M 200 150 L 270 200 L 330 220",
  "M 200 150 L 240 220 L 200 260",
  "M 200 150 L 150 200 L 90 210",
  "M 200 150 L 120 150 L 60 130",
  "M 200 150 L 130 95 L 70 80",
  "M 200 150 L 170 60 L 200 30",
  "M 200 150 L 250 55 L 300 40",
];

const PULSE_PATHS = [
  "M 200 150 L 280 95 L 340 110",
  "M 200 150 L 310 150 L 360 180",
  "M 200 150 L 150 200 L 90 210",
  "M 200 150 L 250 55 L 300 40",
];

export default function NeuralCircuitAnimation({ className }: { className?: string }) {
  const [reducedMotion, setReducedMotion] = useState(false);
  const uid = useId().replace(/:/g, "");
  const coreGlowId = `neural-core-glow-${uid}`;
  const pulseGradientId = `neural-pulse-gradient-${uid}`;

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const handler = () => setReducedMotion(mq.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return (
    <div className={cn("neural-circuit relative h-full w-full", className)} aria-hidden>
      <svg
        viewBox="0 0 400 300"
        className="h-full w-full"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <radialGradient id={coreGlowId} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(139,124,246,0.9)" />
            <stop offset="100%" stopColor="rgba(139,124,246,0)" />
          </radialGradient>
          <linearGradient id={pulseGradientId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(139,124,246,0)" />
            <stop offset="45%" stopColor="rgba(167,154,255,0.15)" />
            <stop offset="50%" stopColor="rgba(200,190,255,0.85)" />
            <stop offset="55%" stopColor="rgba(167,154,255,0.15)" />
            <stop offset="100%" stopColor="rgba(139,124,246,0)" />
          </linearGradient>
        </defs>

        {STATIC_PATHS.map((d, i) => (
          <path
            key={`static-${i}`}
            d={d}
            fill="none"
            stroke="rgba(139,124,246,0.12)"
            strokeWidth="1"
            strokeLinecap="round"
          />
        ))}

        {!reducedMotion &&
          PULSE_PATHS.map((d, i) => (
            <path
              key={`pulse-${i}`}
              d={d}
              fill="none"
              stroke={`url(#${pulseGradientId})`}
              strokeWidth="1.5"
              strokeLinecap="round"
              className="neural-pulse-path"
              style={{ animationDelay: `${i * 1.4}s` }}
            />
          ))}

        <circle cx="200" cy="150" r="28" fill={`url(#${coreGlowId})`} className="neural-core-glow" />
        <circle cx="200" cy="150" r="5" fill="rgba(200,190,255,0.95)" className="neural-core-node" />

        {[
          [280, 95],
          [340, 110],
          [310, 150],
          [150, 200],
          [90, 210],
          [250, 55],
          [300, 40],
          [130, 95],
        ].map(([cx, cy], i) => (
          <circle
            key={`node-${i}`}
            cx={cx}
            cy={cy}
            r="2.5"
            fill="rgba(139,124,246,0.35)"
            className={!reducedMotion ? "neural-branch-node" : undefined}
            style={{ animationDelay: `${i * 0.7}s` }}
          />
        ))}
      </svg>
    </div>
  );
}
