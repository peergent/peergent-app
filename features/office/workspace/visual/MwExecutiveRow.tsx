"use client";

import { useMemo, useState } from "react";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/ui/cn";
import PgTrendChart from "@/components/design-system/PgTrendChart";
import { CcAnimatedMetric } from "@/features/home/command-center/visual/CcAnimatedMetric";
import type {
  MarketingChartMetricId,
  MarketingWorkspaceBusinessIntelligenceBand,
  MarketingWorkspacePerformanceBand,
} from "@/lib/office/workspace/types";
import { MwBusinessIntelligence } from "./MwBusinessIntelligence";

export function MwExecutiveRow({
  performance,
  businessIntelligence,
  nl,
}: {
  performance: MarketingWorkspacePerformanceBand;
  businessIntelligence: MarketingWorkspaceBusinessIntelligenceBand;
  nl: boolean;
}) {
  const [chartMetricId, setChartMetricId] = useState<MarketingChartMetricId>(
    performance.defaultMetricId
  );

  const activeChart = useMemo(
    () =>
      performance.metrics.find((m) => m.id === chartMetricId) ??
      performance.metrics[0] ??
      null,
    [performance.metrics, chartMetricId]
  );

  if (!activeChart) return null;

  return (
    <section
      className="pg-mw-row pg-mw-row--exec pg-cc15-row pg-cc15-row--exec pg-mw-exec-surface"
      aria-label={nl ? "Performance en intelligence" : "Performance and intelligence"}
    >
      <MwBusinessIntelligence
        band={businessIntelligence}
        bullets={activeChart.bullets}
        metricKey={chartMetricId}
        nl={nl}
      />

      <article
        className="pg-cc6-card pg-cc6-chart-panel pg-cc8-hero--chart pg-mw-chart-panel"
        data-testid="pg-mw-performance"
      >
        <header className="pg-cc6-chart-head">
          <div className="pg-cc6-chart-head__copy">
            <p className="pg-ds-label">{performance.periodLabel}</p>
            <h2 className="pg-cc6-panel-title">{performance.title}</h2>
          </div>
          <div className="pg-cc6-chart-head__metric pg-mw-chart-metric">
            {activeChart.delta ? (
              <span
                key={`${chartMetricId}-delta`}
                className={cn(
                  "pg-cc6-chart-head__delta pg-mw-fade-swap",
                  activeChart.deltaPositive
                    ? "pg-cc6-chart-head__delta--up"
                    : "pg-cc6-chart-head__delta--down"
                )}
              >
                {activeChart.delta}
              </span>
            ) : null}
            <CcAnimatedMetric
              key={chartMetricId}
              value={activeChart.heroValue}
              className={cn(
                "pg-cc6-chart-head__value pg-mw-fade-swap",
                (chartMetricId === "revenue" || chartMetricId === "leads") &&
                  "pg-cc7-grad-text"
              )}
            />
          </div>
        </header>

        {performance.metrics.length > 1 ? (
          <div className="pg-mw-metric-tabs" role="tablist" aria-label={nl ? "Metric" : "Metric"}>
            {performance.metrics.map((metric) => (
              <button
                key={metric.id}
                type="button"
                role="tab"
                aria-selected={metric.id === chartMetricId}
                className={cn(
                  "pg-mw-metric-tab pg-focus-premium",
                  metric.id === chartMetricId && "pg-mw-metric-tab--active"
                )}
                onClick={() => setChartMetricId(metric.id)}
              >
                {metric.label}
              </button>
            ))}
          </div>
        ) : null}

        {activeChart.points.length >= 2 ? (
          <div className="pg-cc6-chart-wrap pg-mw-chart-wrap">
            <svg width="0" height="0" aria-hidden className="pg-cc6-chart-defs">
              <defs>
                <linearGradient id="pg-mw-chart-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="var(--pg-peer-marketing)" />
                  <stop offset="100%" stopColor="var(--pg-v13-purple-accent, #7c3aed)" />
                </linearGradient>
                <linearGradient id="pg-mw-chart-area-grad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="var(--pg-peer-marketing)" stopOpacity="0.2" />
                  <stop
                    offset="100%"
                    stopColor="var(--pg-v13-purple-accent, #7c3aed)"
                    stopOpacity="0.02"
                  />
                </linearGradient>
              </defs>
            </svg>
            <PgTrendChart
              key={chartMetricId}
              points={activeChart.points}
              label={activeChart.chartLabel}
              height={148}
              colorVar="url(#pg-mw-chart-grad)"
              areaFillVar="url(#pg-mw-chart-area-grad)"
              animate
              variant="hero"
              valueFormat={
                activeChart.valueFormat === "currency"
                  ? "currency"
                  : activeChart.valueFormat === "percent"
                    ? "number"
                    : "number"
              }
              className="pg-cc6-chart"
            />
          </div>
        ) : null}

        {activeChart.insight ? (
          <p key={`${chartMetricId}-insight`} className="pg-cc6-chart-insight pg-mw-fade-swap">
            <Sparkles size={14} aria-hidden className="pg-cc6-chart-insight__icon" />
            {activeChart.insight}
          </p>
        ) : null}
      </article>
    </section>
  );
}
