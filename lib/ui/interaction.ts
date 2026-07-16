/**
 * Project Aurora — reusable interaction class recipes.
 * Compose with `cn()` alongside component-specific styles.
 */

import { cn } from "@/lib/ui/cn";

/** Subtle Y lift + shadow on hover — cards, inset groups, interactive tiles. */
export const hoverLift = cn(
  "transition-[transform,box-shadow,border-color,background-color]",
  "duration-[var(--pg-duration-base)] ease-[var(--pg-ease-standard)]",
  "hover:-translate-y-[var(--pg-hover-lift)]",
  "active:translate-y-0 active:scale-[0.995]"
);

/** Border brightens on hover without movement. */
export const borderHighlight = cn(
  "transition-[border-color,background-color]",
  "duration-[var(--pg-duration-fast)] ease-[var(--pg-ease-standard)]",
  "hover:border-white/[0.14]",
  "hover:bg-white/[0.03]"
);

/** Violet-tinted border highlight for accent surfaces. */
export const borderHighlightAccent = cn(
  "transition-[border-color,background-color]",
  "duration-[var(--pg-duration-fast)] ease-[var(--pg-ease-standard)]",
  "hover:border-[var(--pg-accent-edge)]",
  "hover:bg-[var(--pg-accent-soft)]"
);

/** Standard surface property transitions. */
export const surfaceTransition = cn(
  "transition-[transform,border-color,background-color,box-shadow,opacity]",
  "duration-[var(--pg-duration-base)] ease-[var(--pg-ease-standard)]"
);

/** Premium keyboard focus — violet ring, no default outline. */
export const focusPremium = cn(
  "focus:outline-none",
  "focus-visible:ring-2 focus-visible:ring-violet-500/30",
  "focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--pg-bg-base)]"
);

/** Muted focus for ghost / secondary controls. */
export const focusMuted = cn(
  "focus:outline-none",
  "focus-visible:ring-2 focus-visible:ring-white/20",
  "focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--pg-bg-base)]"
);

/** Link-style interactive text. */
export const linkInteractive = cn(
  "transition-colors duration-[var(--pg-duration-fast)] ease-[var(--pg-ease-standard)]",
  "text-violet-400/80 hover:text-violet-300",
  focusPremium
);

/** Base skeleton surface — pair with Skeleton component or loading rows. */
export const skeletonSurface = cn(
  "relative overflow-hidden rounded-[var(--pg-radius-md)] bg-white/[0.06]",
  "before:absolute before:inset-0 before:-translate-x-full",
  "before:animate-[pg-skeleton-shimmer_var(--pg-duration-sequence)_ease-in-out_infinite]",
  "before:bg-gradient-to-r before:from-transparent before:via-white/[0.06] before:to-transparent"
);

/** Inline success flash after an action completes. */
export const successFeedback = cn(
  "animate-[pg-success-flash_var(--pg-duration-slow)_var(--pg-ease-emphasis)]"
);

/** Press feedback for buttons and tappable rows. */
export const pressScale = "active:scale-[0.98]";

/** Disabled interaction state. */
export const disabledInteraction = "disabled:cursor-not-allowed disabled:opacity-50";

/** Elevation presets for interactive cards. */
export const elevation = {
  flat: "",
  raised: "shadow-[var(--pg-shadow-sm)] hover:shadow-[var(--pg-shadow-md)]",
  floating:
    "shadow-[var(--pg-shadow-md)] hover:shadow-[var(--pg-shadow-lg)] hover:-translate-y-[var(--pg-hover-lift)]",
} as const;
