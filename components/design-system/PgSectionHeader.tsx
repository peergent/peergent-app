"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/ui/cn";

/**
 * The header that separates one movement of a page from the next.
 *
 * Office section headings were 10.5px uppercase micro-labels — the same tier
 * as a timestamp. A page whose structural landmarks are set at metadata weight
 * has no landmarks, which is why the eye had to read rather than scan.
 *
 * `level` distinguishes the two jobs a heading does:
 *
 *   band     names a movement of the page. Section tier, real presence.
 *   group    names a cluster inside one. Stays quiet on purpose.
 */

export type PgSectionHeaderLevel = "band" | "group";

export type PgSectionHeaderProps = {
  title: string;
  /** A real count. Omitted rather than shown as zero. */
  count?: number | null;
  /** One line of context. Never a second sentence. */
  hint?: string | null;
  action?: ReactNode;
  level?: PgSectionHeaderLevel;
  className?: string;
  testId?: string;
};

export default function PgSectionHeader({
  title,
  count = null,
  hint = null,
  action,
  level = "band",
  className,
  testId,
}: PgSectionHeaderProps) {
  const isBand = level === "band";

  return (
    <div
      className={cn(
        "flex flex-wrap items-baseline gap-x-[var(--pg-space-3)] gap-y-1",
        className
      )}
      data-testid={testId}
    >
      <h2
        className={cn(
          isBand
            ? "pg-section-title text-[var(--pg-color-text-primary)]"
            : "pg-micro font-medium tracking-[0.09em] uppercase"
        )}
      >
        {title}
      </h2>

      {typeof count === "number" ? (
        <span
          className={cn(
            "tabular-nums",
            isBand
              ? "text-[var(--pg-type-meta)] text-[var(--pg-color-text-tertiary)]"
              : "pg-micro"
          )}
        >
          {count}
        </span>
      ) : null}

      {hint ? (
        <span className="min-w-0 flex-1 truncate text-[var(--pg-type-meta)] text-[var(--pg-color-text-tertiary)]">
          {hint}
        </span>
      ) : null}

      {action ? <div className={cn(hint ? "" : "ml-auto")}>{action}</div> : null}
    </div>
  );
}
