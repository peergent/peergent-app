"use client";

import { cn } from "@/lib/ui/cn";

export type PgMarketInsightLine = {
  id: string;
  text: string;
};

export type PgMarketInsightsProps = {
  title: string;
  insights: PgMarketInsightLine[];
  compact?: boolean;
  className?: string;
  testId?: string;
};

function TelescopeIcon() {
  return (
    <svg viewBox="0 0 24 24" width={14} height={14} aria-hidden className="shrink-0 opacity-80">
      <circle cx="12" cy="12" r="2.5" fill="none" stroke="currentColor" strokeWidth={1.8} />
      <path
        d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.6}
        strokeLinecap="round"
      />
      <path
        d="M8 16l8-8"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * Vision v13 Markt Insights — compact scrollable intelligence card.
 */
export default function PgMarketInsights({
  title,
  insights,
  compact = false,
  className,
  testId,
}: PgMarketInsightsProps) {
  return (
    <div
      className={cn("pg-v13-market-insights", compact && "pg-v13-market-insights--compact", className)}
      data-testid={testId}
    >
      <div className="pg-v13-market-insights-head">
        <TelescopeIcon />
        <span>{title}</span>
      </div>
      <div className="pg-v13-market-insights-scroll" role="region" aria-label={title}>
        {insights.map((line, index) => (
          <p key={line.id} className="pg-v13-market-insights-line">
            <span className="pg-v13-market-insights-dot" aria-hidden />
            {line.text}
            {index < insights.length - 1 ? (
              <span className="pg-v13-market-insights-fade" aria-hidden />
            ) : null}
          </p>
        ))}
      </div>
    </div>
  );
}
