/**
 * Project Aurora — motion tokens.
 * CSS custom properties in `app/globals.css` are the runtime source of truth.
 * Use these constants for JS-driven animation (AnimatedNumber, FadeSequence delays).
 */

export const duration = {
  instant: 80,
  fast: 120,
  base: 200,
  slow: 280,
  slower: 400,
  sequence: 480,
} as const;

export const durationCss = {
  instant: "80ms",
  fast: "var(--pg-duration-fast)",
  base: "var(--pg-duration-base)",
  slow: "var(--pg-duration-slow)",
  slower: "var(--pg-duration-slower)",
  sequence: "var(--pg-duration-sequence)",
} as const;

export const easing = {
  standard: "cubic-bezier(0.4, 0, 0.2, 1)",
  enter: "cubic-bezier(0, 0, 0.2, 1)",
  exit: "cubic-bezier(0.4, 0, 1, 1)",
  emphasis: "cubic-bezier(0.16, 1, 0.3, 1)",
  spring: "cubic-bezier(0.34, 1.56, 0.64, 1)",
} as const;

export const easingCss = {
  standard: "var(--pg-ease-standard)",
  enter: "var(--pg-ease-enter)",
  exit: "var(--pg-ease-exit)",
  emphasis: "var(--pg-ease-emphasis)",
  spring: "var(--pg-ease-spring)",
} as const;

/** Vertical translate on hover lift — keep subtle (Linear / Apple). */
export const hoverLift = {
  distance: 2,
  distanceCss: "var(--pg-hover-lift)",
} as const;

/** Stagger step between sequenced children. */
export const stagger = {
  step: 60,
  stepCss: "var(--pg-stagger-step)",
  maxItems: 8,
} as const;

/** Opacity endpoints for enter / exit fades. */
export const opacity = {
  hidden: 0,
  muted: 0.55,
  visible: 1,
} as const;

/** Default reveal offset (px) for fade-in surfaces. */
export const reveal = {
  offsetY: 4,
  offsetYCss: "var(--pg-reveal-offset-y)",
  scaleFrom: 0.98,
} as const;

export type MotionDuration = keyof typeof duration;
export type MotionEasing = keyof typeof easing;
