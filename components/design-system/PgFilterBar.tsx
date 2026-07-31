"use client";

import Link from "next/link";
import { cn } from "@/lib/ui/cn";

/**
 * Shared filter bar for Performance and Content.
 *
 * Both destinations previously hand-rolled identical pill markup, which is how
 * they drifted apart. Filters are links so every filtered view stays shareable.
 */

export type PgFilterOption = {
  id: string;
  label: string;
  active: boolean;
  href: string;
  /** Shown beside the label so the customer can judge before clicking. */
  count?: number | null;
};

export type PgFilterGroup = {
  id: string;
  label: string;
  options: PgFilterOption[];
};

export type PgFilterBarProps = {
  groups: readonly PgFilterGroup[];
  /** Prefix for option test ids, e.g. "perf-filter". */
  testIdPrefix?: string;
  className?: string;
};

export default function PgFilterBar({
  groups,
  testIdPrefix,
  className,
}: PgFilterBarProps) {
  if (groups.length === 0) return null;

  return (
    <div
      className={cn("flex flex-col gap-[var(--pg-space-2)]", className)}
      data-testid={testIdPrefix ? `${testIdPrefix}-bar` : undefined}
    >
      {groups.map((group) => (
        <div
          key={group.id}
          className="flex flex-wrap items-center gap-x-[var(--pg-space-2)] gap-y-[var(--pg-space-2)]"
          role="group"
          aria-label={group.label}
        >
          <span className="w-16 shrink-0 text-[11.5px] text-[var(--pg-color-text-tertiary)]">
            {group.label}
          </span>

          {/* Horizontally scrollable on narrow screens so filters never wrap
              into an unusable stack or push the page sideways. */}
          <div className="-mx-1 flex min-w-0 flex-1 gap-[var(--pg-space-1)] overflow-x-auto px-1 py-0.5">
            {group.options.map((option) => (
              <Link
                key={option.id}
                href={option.href}
                aria-current={option.active ? "true" : undefined}
                className={cn(
                  "pg-focus-premium inline-flex shrink-0 items-center gap-1.5",
                  "rounded-[var(--pg-radius-full)] px-3 py-1 text-[13px]",
                  "border transition-colors duration-[var(--pg-duration-state)]",
                  option.active
                    ? "border-[var(--pg-color-accent)]/35 bg-[var(--pg-color-accent-muted)] text-[var(--pg-color-text-primary)]"
                    : "border-transparent text-[var(--pg-color-text-tertiary)] hover:border-[var(--pg-office-line)] hover:text-[var(--pg-color-text-secondary)]"
                )}
                data-testid={
                  testIdPrefix ? `${testIdPrefix}-${group.id}-${option.id}` : undefined
                }
              >
                {option.label}
                {typeof option.count === "number" ? (
                  <span className="tabular-nums opacity-60">{option.count}</span>
                ) : null}
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
