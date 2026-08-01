"use client";

import Link from "next/link";
import { cn } from "@/lib/ui/cn";
import {
  PgCard,
  PgChartFrame,
  PgFilterBar,
  PgMetric,
  PgMethodology,
  PgPage,
  PgPageHeader,
  PgSectionHeader,
  PgTable,
  PgTrendChart,
} from "@/components/design-system";
import type {
  PerformanceCut,
  PerformanceSectionModel,
  PerformanceViewModel,
} from "@/lib/office/performance/types";

/**
 * §4.5 Performance — the analytics centre, still in interrogation mode.
 *
 * ## Why this composition
 *
 * The previous version had the right *order* (outcomes lead, production
 * trails) but expressed it entirely through five identical `PgCard` rectangles
 * stacked in a column. Order alone is not hierarchy — a reader has to read
 * every label to discover what matters, which is scanning, not seeing.
 *
 * This version expresses the same order through size, elevation and form:
 *
 *   1. hero            one number, at display size, with her read beneath it
 *   2. trend            demoted deliberately — it plots volume, not outcome
 *   3. reporting        outcome sections, each shaped for its own content
 *   4. produced         activity, quiet, last among the things that can speak
 *   5. unavailable      one card, not a wall of identical ones
 *
 * A founder should be able to look at this page for three seconds and know
 * whether marketing is working, before reading a single label.
 *
 * ## Grounding
 *
 * Nothing here reaches past `model`. Every figure arrived already filtered by
 * `buildPerformanceSections`, which renders a metric only when a connected
 * source genuinely reported it — this file only decides what shares a
 * container with what.
 */

export type PerformanceViewProps = {
  model: PerformanceViewModel;
};

/* ---------------- Shared fragments ----------------------------------------- */

/** Compact comparison rows — the right shape for a section of 2–4 figures. */
function SectionMetrics({ section }: { section: PerformanceSectionModel }) {
  return (
    <div className="flex flex-col">
      {section.metrics.map((metric) => (
        <div
          key={metric.key}
          className={cn(
            "flex flex-wrap items-baseline gap-x-[var(--pg-space-4)] gap-y-1",
            "border-b border-[var(--pg-office-line)] py-[var(--pg-space-3)]",
            "last:border-b-0"
          )}
          data-testid={`perf-metric-${metric.key}`}
        >
          <span className="min-w-0 flex-1 text-[var(--pg-type-meta)] text-[var(--pg-color-text-secondary)]">
            {metric.label}
          </span>
          <span className="text-[18px] leading-none font-semibold tabular-nums text-[var(--pg-color-text-primary)]">
            {metric.value}
          </span>
          {/* Provenance in neutral blue: information, carrying no judgement. */}
          <span
            className="pg-micro w-full shrink-0 sm:w-auto sm:text-right"
            style={{ color: "var(--pg-state-neutral)" }}
          >
            {metric.sourceLabel}
          </span>
        </div>
      ))}
    </div>
  );
}

function cutToTableRows(cut: PerformanceCut) {
  return cut.rows.map((row) => ({ ...row, cutId: cut.id }));
}

export default function PerformanceView({ model }: PerformanceViewProps) {
  const { copy } = model;

  const reporting = model.sections.filter((s) => s.state === "reporting");
  const unavailable = model.sections.filter((s) => s.state === "unavailable");

  // Production activity is real and useful, and it goes last among the things
  // that can speak — marketing is judged on outcomes, not output.
  const outcomeSectionsRaw = reporting.filter((s) => s.id !== "workforce_roi");
  const producedSection = reporting.find((s) => s.id === "workforce_roi") ?? null;

  const topSignal = model.signals[0] ?? null;

  // A figure promoted into the hero must not also repeat, unchanged, in the
  // section it came from — the reader would read the same number twice a few
  // hundred pixels apart and conclude the page has nothing new to say. This is
  // presentation-only: `model.sections` still reports the full, correct truth,
  // and this only decides what draws twice on the page.
  const promoted = new Set(model.executive.map((m) => m.key));
  const outcomeSections = outcomeSectionsRaw
    .map((section) => ({
      ...section,
      metrics: section.metrics.filter((m) => !promoted.has(m.key)),
    }))
    // A section that loses every metric to the hero has nothing left to say
    // on its own — its story already told above, not a hollow card below.
    .filter((section) => section.metrics.length > 0);

  // Channels and Paid media read well side by side — but *where* that pair
  // sits still has to obey business-first ordering. Splicing it out to the
  // front (an earlier version of this) jumped Paid media ahead of Business
  // outcomes and Campaigns, which is the exact mistake this phase exists to
  // prevent. So the pair is built and then rendered *at "channels"'s original
  // position* in the domain's own section order, not ahead of it.
  type PerformanceRenderItem =
    | { kind: "single"; section: PerformanceSectionModel }
    | { kind: "pair"; sections: PerformanceSectionModel[] };

  const adsSection = outcomeSections.find((s) => s.id === "ads") ?? null;
  const consumed = new Set<string>();
  const renderItems: PerformanceRenderItem[] = [];
  for (const section of outcomeSections) {
    if (consumed.has(section.id)) continue;
    if (section.id === "channels" && adsSection) {
      renderItems.push({ kind: "pair", sections: [section, adsSection] });
      consumed.add(section.id);
      consumed.add(adsSection.id);
      continue;
    }
    renderItems.push({ kind: "single", section });
    consumed.add(section.id);
  }

  const byCampaign = model.cuts.find((c) => c.id === "by-campaign") ?? null;
  const otherCuts = model.cuts.filter((c) => c.id !== "by-campaign");

  const heroMetric = model.executive[0] ?? null;
  const secondaryMetrics = model.executive.slice(1);

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
        className="-mb-[var(--pg-space-2)]"
      />

      {/* 1. The hero. One number the page leads with, the figures around it,
             and her reading — three tiers, one card, three seconds. */}
      {heroMetric ? (
        <PgCard elevation="feature" data-testid="perf-hero">
          <PgMetric
            label={heroMetric.label}
            value={heroMetric.value}
            delta={
              heroMetric.delta
                ? { ...heroMetric.delta, upIsGood: heroMetric.upIsGood }
                : null
            }
            methodology={heroMetric.methodology}
            emphasis="hero"
            testId="perf-hero-metric"
          />

          {secondaryMetrics.length > 0 ? (
            <div
              className={cn(
                "mt-[var(--pg-space-6)] flex flex-wrap gap-x-[var(--pg-space-6)] gap-y-[var(--pg-space-4)]",
                "border-t border-[var(--pg-office-line)] pt-[var(--pg-space-5)]"
              )}
              data-testid="perf-hero-secondary"
            >
              {secondaryMetrics.map((metric, index) => (
                <div
                  key={metric.key}
                  className={cn(
                    // Full width and horizontally divided while stacked on
                    // narrow screens; a vertical divider only makes sense once
                    // the row has room to actually be a row.
                    "w-full min-w-[9rem] sm:w-auto",
                    index > 0 &&
                      cn(
                        "border-t border-[var(--pg-office-line)] pt-[var(--pg-space-3)]",
                        "sm:border-t-0 sm:border-l sm:pt-0 sm:pl-[var(--pg-space-6)]"
                      )
                  )}
                >
                  <PgMetric
                    label={metric.label}
                    value={metric.value}
                    delta={
                      metric.delta ? { ...metric.delta, upIsGood: metric.upIsGood } : null
                    }
                    emphasis="outcome"
                    testId={`perf-hero-secondary-${metric.key}`}
                  />
                </div>
              ))}
            </div>
          ) : null}

          {topSignal ? (
            <div
              className="mt-[var(--pg-space-6)] border-t border-[var(--pg-office-line)] pt-[var(--pg-space-5)]"
              data-testid={`perf-signal-${topSignal.id}`}
            >
              {/* Her voice — the only purple on the page, because it is the
                  only place she is speaking rather than reporting. */}
              <p className="pg-voice pg-measure text-[var(--pg-color-text-primary)]">
                {topSignal.interpretation}
              </p>
              <PgMethodology className="mt-[var(--pg-space-2)]">
                {topSignal.fact}
              </PgMethodology>
              {topSignal.recommendation ? (
                <p
                  className="mt-[var(--pg-space-3)] border-l-2 pl-[var(--pg-space-4)] text-[var(--pg-type-body)] text-[var(--pg-color-text-secondary)]"
                  style={{ borderColor: "var(--pg-state-voice)" }}
                >
                  {topSignal.recommendation}
                </p>
              ) : null}
            </div>
          ) : null}
        </PgCard>
      ) : topSignal ? (
        // No connected source yet, but she still has a reading — her voice
        // stands alone rather than waiting for numbers that do not exist.
        <PgCard elevation="feature" data-testid={`perf-signal-${topSignal.id}`}>
          <p className="pg-voice pg-measure text-[var(--pg-color-text-primary)]">
            {topSignal.interpretation}
          </p>
          <PgMethodology className="mt-[var(--pg-space-2)]">
            {topSignal.fact}
          </PgMethodology>
        </PgCard>
      ) : null}

      {/* 2. The one real series — demoted deliberately. It plots how much went
             out, not what it returned, so it is smaller than the hero and
             coloured as information rather than as her voice. */}
      {model.trend ? (
        <section aria-label={copy.trendHeading} data-testid="perf-trend">
          <PgSectionHeader
            title={copy.trendHeading}
            hint={model.trend.label}
            level="group"
          />
          <PgCard className="mt-[var(--pg-space-3)]" elevation="raised">
            <PgTrendChart
              points={model.trend.points}
              label={model.trend.label}
              height={72}
              colorVar="var(--pg-state-neutral)"
            />
            <PgMethodology className="mt-[var(--pg-space-3)]">
              {model.trend.methodology}
            </PgMethodology>
          </PgCard>
        </section>
      ) : heroMetric === null ? (
        <PgChartFrame
          title={copy.trendHeading}
          promise={copy.trendFuture}
          testId="perf-frame-trend"
        />
      ) : null}

      {/* 3. Every reporting section, in the domain's own business-first order.
             Channels and Paid media render as a side-by-side comparison when
             both report, but at "channels"'s position in that order — a
             comparison is a shape, not a promotion. */}
      {renderItems.map((item) =>
        item.kind === "pair" ? (
          <div
            key={item.sections.map((s) => s.id).join("+")}
            className="grid gap-[var(--pg-space-6)] md:grid-cols-2"
          >
            {item.sections.map((section) => (
              <section
                key={section.id}
                aria-label={section.title}
                data-testid={`perf-section-${section.id}`}
              >
                <PgSectionHeader title={section.title} hint={section.description} />
                <PgCard className="mt-[var(--pg-space-4)] py-[var(--pg-space-2)]">
                  <SectionMetrics section={section} />
                </PgCard>
              </section>
            ))}
          </div>
        ) : (
          <section
            key={item.section.id}
            aria-label={item.section.title}
            data-testid={`perf-section-${item.section.id}`}
          >
            <PgSectionHeader title={item.section.title} hint={item.section.description} />
            <PgCard className="mt-[var(--pg-space-4)] py-[var(--pg-space-2)]">
              <SectionMetrics section={item.section} />
            </PgCard>
          </section>
        )
      )}

      {/* Campaign split, as a real table — the shape this data has always
          deserved. Counted from what actually went live, same as before. */}
      {byCampaign ? (
        <section aria-label={byCampaign.title} data-testid="perf-cut-by-campaign">
          <PgSectionHeader title={byCampaign.title} />
          <div className="mt-[var(--pg-space-4)]">
            <PgTable
              testId="perf-campaign-table"
              rows={cutToTableRows(byCampaign)}
              rowKey={(row) => row.id}
              rowHref={(row) => row.href}
              caption={byCampaign.title}
              columns={[
                { id: "label", header: byCampaign.title, render: (row) => row.label },
                ...(byCampaign.rows.some((r) => r.share)
                  ? [
                      {
                        id: "share",
                        header: "%",
                        align: "right" as const,
                        render: (row: (typeof byCampaign.rows)[number]) => row.share,
                      },
                    ]
                  : []),
                {
                  id: "value",
                  header: byCampaign.valueHeader,
                  align: "right" as const,
                  numeric: true,
                  sortable: true,
                  sortValue: (row) => row.numericValue,
                  render: (row) => row.value,
                },
              ]}
            />
          </div>
          <PgMethodology className="mt-[var(--pg-space-3)]">
            {byCampaign.methodology}
          </PgMethodology>
        </section>
      ) : null}

      {otherCuts.map((cut) => (
        <section key={cut.id} aria-label={cut.title} data-testid={`perf-cut-${cut.id}`}>
          <PgSectionHeader title={cut.title} level="group" />
          <PgCard className="mt-[var(--pg-space-3)] p-0" elevation="raised">
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
                        "hover:bg-[var(--pg-office-panel-hover)]"
                      )}
                    >
                      <span className="min-w-0 flex-1 truncate text-[var(--pg-type-meta)] text-[var(--pg-color-text-secondary)]">
                        {row.label}
                      </span>
                      {row.share ? (
                        <span className="pg-micro shrink-0 tabular-nums">
                          {row.share}
                        </span>
                      ) : null}
                      <span className="w-10 shrink-0 text-right text-[var(--pg-type-meta)] tabular-nums text-[var(--pg-color-text-primary)]">
                        {row.value}
                      </span>
                    </Link>
                  ) : null}
                </li>
              ))}
            </ul>
          </PgCard>
          <PgMethodology className="mt-[var(--pg-space-3)]">
            {cut.methodology}
          </PgMethodology>
        </section>
      ))}

      {/* 5. What she produced. Real, useful, quiet, and last among the things
             that can speak. */}
      {producedSection ? (
        <section
          aria-label={producedSection.title}
          data-testid="perf-section-workforce_roi"
        >
          <PgSectionHeader
            title={producedSection.title}
            hint={producedSection.description}
            level="group"
          />
          <div className="mt-[var(--pg-space-3)]">
            <SectionMetrics section={producedSection} />
          </div>
        </section>
      ) : null}

      {/* 6. What cannot report yet — one card, not a wall of identical ones.
             A live workspace with nothing connected can have five or more of
             these; five near-identical boxes is exactly the pattern this
             redesign exists to remove. */}
      {unavailable.length > 0 ? (
        <section aria-label={copy.futureHeading} data-testid="perf-unavailable">
          <PgSectionHeader title={copy.futureHeading} level="group" />
          <PgCard
            elevation="inset"
            className="mt-[var(--pg-space-3)] p-0"
            data-testid="perf-unavailable-list"
          >
            <ul className="m-0 list-none p-0">
              {unavailable.map((section) => (
                <li
                  key={section.id}
                  className={cn(
                    "flex flex-wrap items-baseline justify-between gap-x-[var(--pg-space-4)] gap-y-1",
                    "border-b border-[var(--pg-office-line)] px-[var(--pg-space-4)] py-[var(--pg-space-3)]",
                    "last:border-b-0"
                  )}
                  data-testid={`perf-unavailable-${section.id}`}
                >
                  <div className="min-w-0">
                    <p className="text-[var(--pg-type-meta)] text-[var(--pg-color-text-secondary)]">
                      {section.title}
                    </p>
                    {section.unavailable?.missing.length ? (
                      <p
                        className="pg-micro mt-0.5"
                        style={{ color: "var(--pg-state-neutral)" }}
                      >
                        {section.unavailable.missing.join(" · ")}
                      </p>
                    ) : null}
                  </div>
                  {section.unavailable?.ctaHref && section.unavailable?.ctaLabel ? (
                    <Link
                      href={section.unavailable.ctaHref}
                      className="pg-focus-premium shrink-0 text-[var(--pg-type-meta)] text-[var(--pg-color-accent)]"
                    >
                      {section.unavailable.ctaLabel}
                    </Link>
                  ) : null}
                </li>
              ))}
            </ul>
          </PgCard>
        </section>
      ) : null}
    </PgPage>
  );
}
