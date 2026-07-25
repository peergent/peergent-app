"use client";

import Link from "next/link";
import type { MarketingContentPerformanceMetric } from "@/lib/peer-experience/marketing/domain/marketing-peer-types";

export type ContentPerformanceSummaryProps = {
  metrics: MarketingContentPerformanceMetric[];
  emptyMessage: string;
  hasLiveData: boolean;
  performanceHref: string;
};

export default function ContentPerformanceSummary({
  metrics,
  emptyMessage,
  hasLiveData,
  performanceHref,
}: ContentPerformanceSummaryProps) {
  return (
    <section className="mp-section" aria-labelledby="content-perf-heading">
      <div className="mp-section__header">
        <h3 id="content-perf-heading" className="mp-section__title">
          Performance
        </h3>
        <Link
          href={performanceHref}
          className="mp-section__link"
          data-testid="content-performance-cta"
        >
          View performance
        </Link>
      </div>
      {!hasLiveData ? (
        <p className="mp-empty">{emptyMessage}</p>
      ) : (
        <div className="mp-results-grid mp-results-grid--compact">
          {metrics.map((m) => (
            <article key={m.id} className="mp-metric mp-metric--compact">
              <p className="mp-metric__value">{m.value}</p>
              <p className="mp-metric__label">{m.label}</p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
