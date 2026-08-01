"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/ui/cn";
import PgMetric, { type PgMetricProps } from "./PgMetric";
import { PgMethodology } from "./PgOfficeLayout";

export type PgHeroSurfaceProps = {
  accentVar: string;
  eyebrow: string;
  headline: string;
  detail?: string | null;
  voice?: string | null;
  voiceFact?: string | null;
  recommendation?: string | null;
  primaryMetric?: (PgMetricProps & { id?: string }) | null;
  secondaryMetrics?: (PgMetricProps & { id?: string })[];
  chart?: ReactNode;
  actions?: ReactNode;
  periodLabel?: string | null;
  className?: string;
  testId?: string;
};

export default function PgHeroSurface({
  accentVar,
  eyebrow,
  headline,
  detail,
  voice,
  voiceFact,
  recommendation,
  primaryMetric,
  secondaryMetrics = [],
  chart,
  actions,
  periodLabel,
  className,
  testId = "pg-hero-surface",
}: PgHeroSurfaceProps) {
  return (
    <section
      className={cn("pg-hero-surface pg-band-enter p-[var(--pg-space-6)] md:p-[var(--pg-space-8)]", className)}
      style={{ ["--pg-hero-wash" as string]: `${accentVar}18` }}
      data-testid={testId}
    >
      <div className="relative grid gap-[var(--pg-space-8)] lg:grid-cols-[1fr_min(42%,360px)] lg:items-start">
        <div className="min-w-0">
          <p
            className="pg-micro font-medium tracking-[0.09em] uppercase"
            style={{ color: accentVar }}
          >
            {eyebrow}
          </p>

          <h1 className="pg-display mt-[var(--pg-space-3)] max-w-[22ch] text-[var(--pg-color-text-primary)]">
            {headline}
          </h1>

          {detail ? (
            <p className="pg-body mt-[var(--pg-space-4)] max-w-[48ch]">{detail}</p>
          ) : null}

          {primaryMetric ? (
            <div className="mt-[var(--pg-space-6)] border-t border-[var(--pg-office-line)] pt-[var(--pg-space-5)]">
              <PgMetric {...primaryMetric} emphasis="hero" testId={`${testId}-primary-metric`} />
              {periodLabel ? (
                <PgMethodology className="mt-[var(--pg-space-2)]">{periodLabel}</PgMethodology>
              ) : null}
            </div>
          ) : null}

          {secondaryMetrics.length > 0 ? (
            <div className="mt-[var(--pg-space-5)] flex flex-wrap gap-x-[var(--pg-space-6)] gap-y-[var(--pg-space-4)]">
              {secondaryMetrics.map((metric, index) => (
                <div
                  key={metric.id ?? index}
                  className={cn(
                    "min-w-[8rem]",
                    index > 0 && "border-l border-[var(--pg-office-line)] pl-[var(--pg-space-5)]"
                  )}
                >
                  <PgMetric {...metric} emphasis="outcome" />
                </div>
              ))}
            </div>
          ) : null}

          {voice ? (
            <div
              className="mt-[var(--pg-space-6)] border-t border-[var(--pg-office-line)] pt-[var(--pg-space-5)]"
              data-testid={`${testId}-voice`}
            >
              <p className="pg-voice pg-measure">{voice}</p>
              {voiceFact ? <PgMethodology className="mt-[var(--pg-space-2)]">{voiceFact}</PgMethodology> : null}
              {recommendation ? (
                <p
                  className="mt-[var(--pg-space-3)] border-l-2 pl-[var(--pg-space-4)] text-[var(--pg-type-body)] text-[var(--pg-color-text-secondary)]"
                  style={{ borderColor: "var(--pg-state-voice)" }}
                >
                  {recommendation}
                </p>
              ) : null}
            </div>
          ) : null}

          {actions ? <div className="mt-[var(--pg-space-5)] flex flex-wrap gap-[var(--pg-space-3)]">{actions}</div> : null}
        </div>

        {chart ? (
          <div
            className="min-w-0 rounded-[var(--pg-radius-md)] border border-[var(--pg-office-line)] bg-[var(--pg-office-inset)] p-[var(--pg-space-4)]"
            data-testid={`${testId}-chart`}
          >
            {chart}
          </div>
        ) : null}
      </div>
    </section>
  );
}
