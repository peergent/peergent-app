"use client";

import Link from "next/link";
import { cn } from "@/lib/ui/cn";
import {
  PgCard,
  PgFilterBar,
  PgMethodology,
  PgPage,
  PgPageHeader,
  PgSection,
  PgChartFrame,
  PgTrendChart,
} from "@/components/design-system";
import type { PerformanceViewModel } from "@/lib/office/performance/types";

/**
 * §4.5 Performance — interrogation mode.
 *
 * The customer forms their own conclusion; her reading sits above the evidence
 * in the shell's presence line rather than gatekeeping it. Observed fact,
 * interpretation and recommendation stay visually separated, and methodology
 * is always present but never competes.
 */

export type PerformanceViewProps = {
  model: PerformanceViewModel;
};

export default function PerformanceView({ model }: PerformanceViewProps) {
  const { copy } = model;

  return (
    <PgPage testId="office-performance-view">
      <PgPageHeader title={copy.title} subtitle={copy.subtitle} />

      <PgFilterBar
        groups={model.filterGroups.map((group) => ({
          id: group.id,
          label: group.label,
          options: group.options,
        }))}
        testIdPrefix="perf-filter"
      />

      {/* §4.5 Outcome row — four maximum, each declaring its methodology. */}
      {model.metrics.length > 0 ? (
        <PgSection title={copy.observedHeading}>
          {/* Inherited from the Desk briefing: a measured number needs a rule
              and a label, not a box. Four boxes in a row read as a dashboard;
              four columns read as a report. */}
          <div className="grid gap-x-[var(--pg-space-6)] gap-y-[var(--pg-space-6)] sm:grid-cols-2 lg:grid-cols-4">
            {model.metrics.map((metric) => (
              <div
                key={metric.id}
                className="flex min-w-0 flex-col border-t border-[var(--pg-office-line)] pt-[var(--pg-space-4)]"
                data-testid={`perf-metric-${metric.id}`}
              >
                <p className="text-[11.5px] text-[var(--pg-color-text-tertiary)]">
                  {metric.label}
                </p>
                <p className="pg-metric mt-[var(--pg-space-2)]">{metric.value}</p>
                {metric.comparison ? (
                  <p
                    className={cn(
                      "mt-[var(--pg-space-1)] text-[11.5px] tabular-nums",
                      metric.comparison.direction === "up" &&
                        "text-[var(--pg-color-success)]",
                      metric.comparison.direction === "down" &&
                        "text-[var(--pg-color-decision)]",
                      metric.comparison.direction === "flat" &&
                        "text-[var(--pg-color-text-tertiary)]"
                    )}
                  >
                    {metric.comparison.label}
                  </p>
                ) : null}
                <PgMethodology className="mt-auto pt-[var(--pg-space-3)]">
                  {metric.methodology}
                </PgMethodology>
              </div>
            ))}
          </div>
        </PgSection>
      ) : null}

      {/* §4.5 One chart. Methodology sits beneath it, deliberately quiet. */}
      {model.trend ? (
        <PgSection title={copy.trendHeading}>
          <PgCard>
            <p className="text-[11.5px] text-[var(--pg-color-text-tertiary)]">
              {model.trend.label}
            </p>
            <PgTrendChart
              className="mt-[var(--pg-space-3)]"
              points={model.trend.points}
              label={model.trend.label}
            />
            <PgMethodology className="mt-[var(--pg-space-3)]">
              {model.trend.methodology}
            </PgMethodology>
          </PgCard>
        </PgSection>
      ) : null}

      {/* Interpretation, kept explicitly separate from the numbers above. */}
      {model.signals.length > 0 ? (
        <PgSection title={copy.title}>
          {model.signals.map((signal) => (
            <PgCard key={signal.id} data-testid={`perf-signal-${signal.id}`}>
              <p className="pg-voice pg-measure">{signal.interpretation}</p>
              <PgMethodology className="mt-[var(--pg-space-2)]">
                {signal.fact}
              </PgMethodology>
              {signal.recommendation ? (
                <div
                  className={cn(
                    "mt-[var(--pg-space-3)] border-l-2 pl-[var(--pg-space-3)]",
                    "border-[var(--pg-color-border)]"
                  )}
                >
                  <p className="pg-body pg-body--sm pg-measure">
                    {signal.recommendation}
                  </p>
                </div>
              ) : null}
            </PgCard>
          ))}
        </PgSection>
      ) : null}

      {/* §4.5 Cuts — a structured list reads better than a table at this width. */}
      {model.cuts.map((cut) => (
        <PgSection key={cut.id} title={cut.title}>
          <PgCard className="p-0">
            <ul className="m-0 list-none p-0">
              {cut.rows.map((row) => (
                <li
                  key={row.id}
                  className="border-b border-[var(--pg-office-line)] last:border-b-0"
                >
                  {row.href ? (
                    <Link
                      href={row.href}
                      className={cn(
                        "pg-focus-premium flex items-baseline gap-[var(--pg-space-3)]",
                        "px-[var(--pg-space-4)] py-[var(--pg-space-3)] transition-colors",
                        "duration-[var(--pg-duration-state)]",
                        "hover:bg-[var(--pg-color-accent-subtle)]"
                      )}
                    >
                      <span className="min-w-0 flex-1 truncate text-[13px] text-[var(--pg-color-text-secondary)]">
                        {row.label}
                      </span>
                      {row.share ? (
                        <span className="shrink-0 text-[11.5px] tabular-nums text-[var(--pg-color-text-tertiary)]">
                          {row.share}
                        </span>
                      ) : null}
                      <span className="w-10 shrink-0 text-right text-[13px] tabular-nums text-[var(--pg-color-text-primary)]">
                        {row.value}
                      </span>
                    </Link>
                  ) : null}
                </li>
              ))}
            </ul>
          </PgCard>
          <PgMethodology>{cut.methodology}</PgMethodology>
        </PgSection>
      ))}

      {/* §4.5 What she cannot see yet — drawn as the charts they will become.
          The frames are deliberately empty: a placeholder series would be a
          fabricated analytic, and the eye reads any shape as a trend. What
          fills the space is the measurement's name and what unlocks it, so the
          page communicates its future value without inventing proof. */}
      {model.gaps.length > 0 ? (
        <PgSection title={copy.futureHeading}>
          <div className="grid gap-[var(--pg-space-6)] md:grid-cols-2">
            {model.trend ? null : (
              <PgChartFrame
                title={copy.trendHeading}
                promise={copy.trendFuture}
                testId="perf-frame-trend"
              />
            )}
            {model.gaps.map((gap) => (
              <PgChartFrame
                key={gap.id}
                title={gap.missing}
                promise={copy.willShow(gap.unlocks)}
                unlocks={copy.notReportedYet}
                ctaLabel={gap.ctaLabel}
                ctaHref={gap.ctaHref}
                testId={`perf-gap-${gap.id}`}
              />
            ))}
          </div>
        </PgSection>
      ) : null}

    </PgPage>
  );
}
