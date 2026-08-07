"use client";

import Link from "next/link";
import { cn } from "@/lib/ui/cn";
import PgMetricCard, { type PgMetricCardProps } from "./PgMetricCard";
import PgSparkline from "./PgSparkline";

export type PgPerformanceCardProps = {
  title: string;
  href?: string | null;
  metrics: readonly (PgMetricCardProps & { id?: string })[];
  sparkline?: readonly { value: number }[];
  recommendation?: string | null;
  recommendationHref?: string | null;
  accentVar?: string;
  className?: string;
  testId?: string;
};

/** P3 — post-publish or entity performance summary. */
export default function PgPerformanceCard({
  title,
  href,
  metrics,
  sparkline,
  recommendation,
  recommendationHref,
  accentVar = "var(--pg-peer-marketing)",
  className,
  testId = "pg-performance-card",
}: PgPerformanceCardProps) {
  const inner = (
    <>
      <div className="flex items-start justify-between gap-4">
        <h3 className="text-[15px] font-semibold text-[var(--pg-text)]">{title}</h3>
        {sparkline && sparkline.length >= 2 ? (
          <PgSparkline points={sparkline} colorVar={accentVar} className="w-24 shrink-0" />
        ) : null}
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {metrics.slice(0, 3).map((metric, index) => (
          <PgMetricCard key={metric.id ?? index} {...metric} emphasis="outcome" />
        ))}
      </div>
      {recommendation ? (
        <p className="mt-4 border-t border-[var(--pg-border-soft)] pt-3 text-[13px] text-[var(--pg-text-soft)]">
          {recommendation}
          {recommendationHref ? (
            <>
              {" "}
              <Link
                href={recommendationHref}
                className="font-semibold text-[var(--pg-action-primary)] no-underline"
              >
                Bekijk →
              </Link>
            </>
          ) : null}
        </p>
      ) : null}
    </>
  );

  const shell = cn(
    "pg-ds-card pg-ds-card--raised p-[var(--pg-card-padding-lg)]",
    href && "pg-ds-card--interactive pg-focus-premium block no-underline text-inherit",
    className
  );

  if (href) {
    return (
      <Link href={href} className={shell} data-testid={testId}>
        {inner}
      </Link>
    );
  }

  return (
    <article className={shell} data-testid={testId}>
      {inner}
    </article>
  );
}
