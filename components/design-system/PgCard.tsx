import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/ui/cn";

/**
 * §2 Elevation — now three levels, because two could not express rank.
 *
 * Every card in the Office rendered at one elevation, so a KPI band and a
 * footnote were the same object wearing the same border. Elevation is one of
 * only three channels a UI has for ranking (the others are size and colour),
 * and flattening it is a third of why the page reads as a list.
 *
 *   inset    a quieter plane for content nested inside a raised surface
 *   raised   the default card — a genuine plane above the canvas
 *   feature  the one surface on a page that outranks everything around it
 *
 * `feature` is deliberately scarce: it exists so a page can have a subject.
 * Two features on one page means neither is one.
 */

export type PgCardElevation = "inset" | "raised" | "feature";

export type PgCardProps = HTMLAttributes<HTMLDivElement> & {
  /** §4 Amber edge marks "a human decision is required" and nothing else. */
  decision?: boolean;
  /** Identity accent for Peer-owned surfaces. Never used on controls. */
  accentVar?: string | null;
  interactive?: boolean;
  elevation?: PgCardElevation;
  /**
   * @deprecated Use `elevation="inset"`. Kept so existing call sites keep
   * working while the pages migrate onto the scale one at a time.
   */
  inset?: boolean;
  children: ReactNode;
};

const SURFACE: Record<PgCardElevation, string> = {
  inset: "border-[var(--pg-office-line)] bg-[var(--pg-office-inset)]",
  raised: "border-[var(--pg-office-line)] bg-[var(--pg-office-panel)]",
  feature:
    "border-[var(--pg-office-line-strong)] bg-[var(--pg-office-panel)] rounded-[var(--pg-radius-lg)]",
};

const PADDING: Record<PgCardElevation, string> = {
  inset: "p-[var(--pg-space-4)]",
  raised: "p-[var(--pg-space-4)]",
  // A feature surface earns its weight partly through the room inside it.
  feature: "p-[var(--pg-space-6)]",
};

export default function PgCard({
  decision = false,
  accentVar,
  interactive = false,
  elevation,
  inset = false,
  className,
  children,
  style,
  ...props
}: PgCardProps) {
  const level: PgCardElevation = elevation ?? (inset ? "inset" : "raised");

  return (
    <div
      className={cn(
        "relative rounded-[var(--pg-radius-md)] border",
        PADDING[level],
        SURFACE[level],
        decision && "border-l-2 border-l-[var(--pg-state-attention)]",
        interactive &&
          "transition-[background-color,border-color,transform] duration-[var(--pg-duration-state)] ease-[var(--pg-ease-peergent)] hover:-translate-y-px hover:border-[var(--pg-office-line-strong)] hover:bg-[var(--pg-office-panel-hover)]",
        className
      )}
      style={{
        boxShadow:
          level === "inset"
            ? undefined
            : level === "feature"
              ? "var(--pg-office-lift), 0 32px 64px -32px rgba(0, 0, 0, 0.6)"
              : "var(--pg-office-lift)",
        ...(accentVar ? { ["--pg-card-accent" as string]: accentVar } : null),
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  );
}
