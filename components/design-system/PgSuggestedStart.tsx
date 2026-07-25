"use client";

import Link from "next/link";
import type { HomeSuggestedStart } from "@/lib/home";
import { cn } from "@/lib/ui/cn";

type PgSuggestedStartProps = {
  label: string;
  suggested: HomeSuggestedStart;
  className?: string;
};

export default function PgSuggestedStart({ label, suggested, className }: PgSuggestedStartProps) {
  return (
    <section
      aria-label={label}
      className={cn(
        "rounded-[var(--pg-radius-lg)] bg-[var(--pg-color-surface)] px-5 py-5 md:px-6",
        className
      )}
    >
      <p className="text-[11px] font-medium uppercase tracking-wider text-[var(--pg-color-text-tertiary)]">
        {label}
      </p>
      <h2 className="mt-2 text-lg font-semibold leading-snug text-[var(--pg-color-text-primary)] md:text-xl">
        {suggested.headline}
      </h2>
      {suggested.detail && (
        <p className="mt-1 text-sm text-[var(--pg-color-text-secondary)]">{suggested.detail}</p>
      )}
      <Link
        href={suggested.href}
        className={cn(
          "pg-focus-premium mt-5 inline-flex min-h-[44px] items-center justify-center",
          "rounded-[var(--pg-radius-md)] bg-[var(--pg-color-accent)] px-5 text-sm font-medium",
          "text-[var(--pg-color-text-inverse)] transition",
          "hover:bg-[var(--pg-color-accent-hover)] active:scale-[0.98]"
        )}
      >
        {suggested.ctaLabel} →
      </Link>
    </section>
  );
}
