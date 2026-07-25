"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { BarChart3 } from "lucide-react";
import {
  buildMarketingPerformanceViewModel,
  parsePerformanceFilters,
} from "@/lib/peer-experience/marketing/view-models/build-marketing-performance-view-model";
import { buildMarketingBrainInsights } from "@/lib/peer-experience/marketing/view-models/build-marketing-brain-insights";
import type { MarketingPeerDomainInput } from "@/lib/peer-experience/marketing/view-models/marketing-peer-domain-input";
import { getReviewHref } from "@/lib/peer-experience/marketing/navigation/marketing-peer-links";

type PerfPeriod = "day" | "week" | "month";

const PERIOD_LABELS: Record<PerfPeriod, string> = {
  day: "today",
  week: "this week",
  month: "this month",
};

function metricDisplay(
  metric: ReturnType<typeof buildMarketingPerformanceViewModel>["executiveMetrics"][number]
): string {
  if (metric.status === "setup_required") return "—";
  return String(metric.value);
}

export type PerformanceTabProps = {
  domainInput: MarketingPeerDomainInput;
};

export default function PerformanceTab({ domainInput }: PerformanceTabProps) {
  const searchParams = useSearchParams();
  const filters = parsePerformanceFilters(searchParams);
  const vm = useMemo(
    () => buildMarketingPerformanceViewModel({ ...domainInput, filters }),
    [domainInput, filters]
  );
  const insights = useMemo(() => buildMarketingBrainInsights(domainInput), [domainInput]);
  const [period, setPeriod] = useState<PerfPeriod>("month");

  const topInsight = insights[0];
  const recommendation = topInsight?.recommendation;
  const bullets = insights.slice(0, 3).map((i) => i.observation);

  return (
    <>
      <section className="mw-section mw-glass mw-narrative-card" style={{ animationDelay: "0.03s" }}>
        <div className="mw-narrative-top">
          <div className="mw-narrative-eyebrow">{PERIOD_LABELS.month}</div>
          {vm.hasTrendData && topInsight?.evidence?.changePercent != null && (
            <div className="mw-narrative-trend">
              {topInsight.evidence.changePercent > 0 ? "+" : ""}
              {topInsight.evidence.changePercent}%
            </div>
          )}
        </div>
        {bullets.length > 0 ? (
          <>
            <div className="mw-narrative-why">Why?</div>
            <ul className="mw-narrative-bullets">
              {bullets.map((text) => (
                <li key={text.slice(0, 40)}>{text}</li>
              ))}
            </ul>
          </>
        ) : (
          <p className="mw-empty-inline">
            Connect channels and publish work to see performance explanations grounded in your data.
          </p>
        )}
        {recommendation && (
          <div className="mw-narrative-rec">
            <div>
              <div className="mw-narrative-rec-label">Recommendation</div>
              <div className="mw-narrative-rec-text">{recommendation.summary}</div>
            </div>
            <Link
              href={getReviewHref(domainInput.peerId)}
              className="mw-btn-primary pg-focus-premium"
            >
              Send as decision
            </Link>
          </div>
        )}
      </section>

      <section className="mw-section" style={{ animationDelay: "0.12s", marginBottom: 0 }}>
        <div className="mw-section-head">
          <div className="mw-section-title">
            <BarChart3 size={15} aria-hidden />
            Results <span>{PERIOD_LABELS[period]}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div className="mw-segmented" role="group" aria-label="Performance period">
              {(["day", "week", "month"] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  className={period === p ? "mw-segmented--active" : undefined}
                  onClick={() => setPeriod(p)}
                  aria-pressed={period === p}
                  disabled={p !== "month"}
                  title={p !== "month" ? "Requires connected analytics period breakdown" : undefined}
                >
                  {p === "day" ? "Day" : p === "week" ? "Week" : "Month"}
                </button>
              ))}
            </div>
          </div>
        </div>
        {period !== "month" && (
          <p className="mw-empty-inline" style={{ marginBottom: 12 }}>
            Day and week views need connected analytics. Showing month-to-date metrics.
          </p>
        )}
        {vm.emptyMessage && vm.groundedMetrics.length === 0 && (
          <p className="mw-empty-inline" style={{ marginBottom: 12 }}>
            {vm.emptyMessage}
          </p>
        )}
        <div className="mw-results-grid">
          {vm.executiveMetrics.map((metric) => (
            <div key={metric.id} className="mw-glass mw-result-card">
              <div className="mw-result-title">{metric.label}</div>
              <div className="mw-result-value">{metricDisplay(metric)}</div>
              <div className="mw-result-caption">
                {metric.estimatedNote ?? metric.setupMessage ?? metric.sourceLabel ?? " "}
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
