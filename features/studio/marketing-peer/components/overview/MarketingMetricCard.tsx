"use client";

import Link from "next/link";
import type { MarketingResultMetric } from "@/lib/peer-experience/marketing/domain/marketing-peer-types";

export type MarketingMetricCardProps = {
  metric: MarketingResultMetric;
};

function comparisonArrow(direction: "up" | "down" | "neutral"): string {
  if (direction === "up") return "↑";
  if (direction === "down") return "↓";
  return "→";
}

export default function MarketingMetricCard({ metric }: MarketingMetricCardProps) {
  if (metric.status === "setup_required") {
    return (
      <article className="mp-metric mp-metric--setup" data-testid={`result-${metric.id}`}>
        <p className="mp-metric__label">{metric.label}</p>
        <p className="mp-metric__setup-copy">{metric.setupMessage}</p>
        {metric.setupCta && (
          <Link href={metric.setupCta.href} className="mp-metric__cta pg-focus-premium">
            {metric.setupCta.label}
          </Link>
        )}
      </article>
    );
  }

  return (
    <article className="mp-metric" data-testid={`result-${metric.id}`}>
      <p className="mp-metric__value">{metric.value}</p>
      <p className="mp-metric__label">{metric.label}</p>
      {metric.comparison && (
        <p className="mp-metric__comparison">
          {comparisonArrow(metric.comparison.direction)} {metric.comparison.value}%{" "}
          {metric.comparison.periodLabel}
        </p>
      )}
      {metric.estimatedNote && (
        <p className="mp-metric__note">{metric.estimatedNote}</p>
      )}
      {metric.sourceLabel && metric.status === "live" && (
        <p className="mp-metric__source">Source: {metric.sourceLabel}</p>
      )}
      {metric.status === "estimated" && !metric.estimatedNote && (
        <p className="mp-metric__note">Estimated</p>
      )}
      {metric.performanceHref && (
        <Link href={metric.performanceHref} className="mp-metric__cta pg-focus-premium">
          View performance
        </Link>
      )}
    </article>
  );
}
