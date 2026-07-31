import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/ui/cn";

/**
 * §2 Elevation — two levels only. Ground (page) and raised (card), separated by
 * a hairline border plus one soft shadow. There is no third level and no
 * nested card.
 *
 * The card sits on the Office elevation ladder rather than the base theme's
 * near-transparent surface, so it reads as a genuine plane above the canvas
 * instead of dissolving into it.
 */
export type PgCardProps = HTMLAttributes<HTMLDivElement> & {
  /** §4 Amber edge marks "a human decision is required" and nothing else. */
  decision?: boolean;
  /** Identity accent for Peer-owned surfaces. Never used on controls. */
  accentVar?: string | null;
  interactive?: boolean;
  /** A quieter plane for content nested inside an already-raised surface. */
  inset?: boolean;
  children: ReactNode;
};

export default function PgCard({
  decision = false,
  accentVar,
  interactive = false,
  inset = false,
  className,
  children,
  style,
  ...props
}: PgCardProps) {
  return (
    <div
      className={cn(
        "relative rounded-[var(--pg-radius-md)] border",
        "p-[var(--pg-space-4)]",
        inset
          ? "border-[var(--pg-office-line)] bg-[var(--pg-office-inset)]"
          : "border-[var(--pg-office-line)] bg-[var(--pg-office-panel)]",
        decision && "border-l-2 border-l-[var(--pg-color-decision)]",
        interactive &&
          "transition-[background-color,border-color,transform] duration-[var(--pg-duration-state)] ease-[var(--pg-ease-peergent)] hover:-translate-y-px hover:border-[var(--pg-office-line-strong)] hover:bg-[var(--pg-office-panel-hover)]",
        className
      )}
      style={{
        boxShadow: inset ? undefined : "var(--pg-office-lift)",
        ...(accentVar ? { ["--pg-card-accent" as string]: accentVar } : null),
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  );
}
