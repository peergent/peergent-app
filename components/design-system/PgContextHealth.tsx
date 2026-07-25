"use client";

import Link from "next/link";
import type { HomeContextHealth } from "@/lib/home";
import { cn } from "@/lib/ui/cn";

type PgContextHealthProps = {
  title: string;
  health: HomeContextHealth;
  improveLabel: string;
  className?: string;
};

export default function PgContextHealth({
  title,
  health,
  improveLabel,
  className,
}: PgContextHealthProps) {
  return (
    <section
      aria-label={title}
      className={cn(
        "flex flex-col gap-3 rounded-[var(--pg-radius-lg)] border border-[var(--pg-color-border-subtle)]",
        "px-4 py-4 sm:flex-row sm:items-center sm:justify-between",
        className
      )}
    >
      <div className="min-w-0">
        <h2 className="text-[11px] font-medium uppercase tracking-wider text-[var(--pg-color-text-tertiary)]">
          {title}
        </h2>
        <p className="mt-1 text-sm font-medium text-[var(--pg-color-text-primary)]">
          {health.label}
        </p>
        {health.gapLabel && (
          <p className="mt-0.5 text-xs text-[var(--pg-color-text-secondary)]">{health.gapLabel}</p>
        )}
      </div>
      {health.improveHref && (
        <Link
          href={health.improveHref}
          className={cn(
            "pg-focus-premium inline-flex min-h-[44px] shrink-0 items-center justify-center",
            "rounded-[var(--pg-radius-md)] border border-[var(--pg-color-border)] px-4",
            "text-sm font-medium text-[var(--pg-color-text-primary)] transition",
            "hover:bg-[var(--pg-color-accent-muted)]"
          )}
        >
          {improveLabel} →
        </Link>
      )}
    </section>
  );
}
