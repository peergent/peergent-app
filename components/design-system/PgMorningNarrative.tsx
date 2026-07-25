"use client";

import { cn } from "@/lib/ui/cn";
import type { HomeMorningNarrative } from "@/lib/home";

type PgMorningNarrativeProps = {
  narrative: HomeMorningNarrative;
  /** Executive brief: greeting is the dominant headline; headline becomes body copy. */
  variant?: "default" | "executive";
  className?: string;
};

export default function PgMorningNarrative({
  narrative,
  variant = "default",
  className,
}: PgMorningNarrativeProps) {
  if (variant === "executive") {
    return (
      <header
        className={cn("briefing-narrative-header space-y-5", className)}
        aria-live="polite"
        aria-atomic="true"
      >
        <h1 className="briefing-greeting max-w-[680px] text-[clamp(2rem,4.8vw,2.5rem)] font-extrabold leading-[1.08] tracking-[-0.042em] text-[var(--pg-color-text-primary)]">
          {narrative.greeting}
        </h1>
        {narrative.headline && (
          <p className="briefing-prose max-w-[680px] text-[15px] font-normal leading-[1.75] text-[var(--pg-color-text-secondary)]">
            {narrative.headline}
          </p>
        )}
        {narrative.detail && (
          <p className="briefing-prose max-w-[680px] text-[15px] font-normal leading-[1.75] text-[var(--pg-color-text-secondary)]">
            {narrative.detail}
          </p>
        )}
      </header>
    );
  }

  return (
    <header
      className={cn("space-y-2", className)}
      aria-live="polite"
      aria-atomic="true"
    >
      <p className="text-sm text-[var(--pg-color-text-tertiary)]">{narrative.greeting}</p>
      <h1 className="text-[length:var(--pg-text-display-size,32px)] font-semibold leading-tight tracking-tight text-[var(--pg-color-text-primary)] md:text-[2rem]">
        {narrative.headline}
      </h1>
      {narrative.detail && (
        <p className="max-w-2xl text-base leading-relaxed text-[var(--pg-color-text-secondary)]">
          {narrative.detail}
        </p>
      )}
    </header>
  );
}
