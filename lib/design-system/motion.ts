/**
 * Peergent Design System v2 — motion tokens (mirrors CSS + JS timing).
 * @see docs/DESIGN_SYSTEM.md §3.8
 */

export const DS_MOTION = {
  instant: 80,
  fast: 120,
  normal: 200,
  moderate: 250,
  slow: 400,
  chart: 600,
  counter: 800,
  pulse: 2000,
  shimmer: 1500,
  mesh: 60000,
} as const;

export const DS_EASE = {
  out: "cubic-bezier(0.16, 1, 0.3, 1)",
  spring: "cubic-bezier(0.34, 1.4, 0.4, 1)",
} as const;

/** Legacy alias — foundation.ts MOTION */
export const MOTION = {
  state: DS_MOTION.fast,
  enter: DS_MOTION.normal,
  mode: DS_MOTION.moderate,
  breathe: DS_MOTION.pulse,
} as const;
