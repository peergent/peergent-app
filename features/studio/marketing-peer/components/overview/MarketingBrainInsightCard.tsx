"use client";

import Link from "next/link";
import type { MarketingBrainInsight } from "@/lib/peer-experience/marketing/domain/marketing-peer-types";

export type MarketingBrainInsightCardProps = {
  insight: MarketingBrainInsight;
  onDismiss?: (id: string) => void;
};

export default function MarketingBrainInsightCard({
  insight,
  onDismiss,
}: MarketingBrainInsightCardProps) {
  const primaryActions = insight.actions.filter((a) => a.type !== "dismiss");
  const dismissAction = insight.actions.find((a) => a.type === "dismiss");

  return (
    <article className="mp-brain-card" data-testid={`brain-insight-${insight.id}`}>
      <header className="mp-brain-card__header">
        <span className="mp-brain-card__category">{insight.category}</span>
        {insight.status === "needs_approval" && (
          <span className="mp-brain-card__badge">Needs approval</span>
        )}
      </header>
      <p className="mp-brain-card__observation">{insight.observation}</p>
      {insight.businessImpact && (
        <p className="mp-brain-card__impact">
          <span className="mp-brain-card__impact-label">Impact:</span> {insight.businessImpact}
        </p>
      )}
      {insight.actionTaken && (
        <p className="mp-brain-card__action-taken">
          <span className="mp-brain-card__impact-label">Action taken:</span>{" "}
          {insight.actionTaken.summary}
        </p>
      )}
      {insight.recommendation && (
        <p className="mp-brain-card__recommendation">
          <span className="mp-brain-card__impact-label">Recommendation:</span>{" "}
          {insight.recommendation.summary}
        </p>
      )}
      {insight.evidence?.changePercent !== undefined && (
        <p className="mp-brain-card__evidence">
          Evidence: {insight.evidence.source}
          {insight.evidence.period ? ` · ${insight.evidence.period}` : ""}
        </p>
      )}
      <div className="mp-brain-card__actions">
        {primaryActions.map((action) =>
          action.href ? (
            <Link
              key={action.id}
              href={action.href}
              className="mp-brain-card__action pg-focus-premium"
              data-testid={`brain-cta-${insight.id}-${action.id}`}
            >
              {action.label}
            </Link>
          ) : null
        )}
        {(onDismiss || dismissAction) && (
          <button
            type="button"
            className="mp-brain-card__dismiss pg-focus-premium"
            onClick={() => onDismiss?.(insight.id)}
          >
            Dismiss
          </button>
        )}
      </div>
    </article>
  );
}
