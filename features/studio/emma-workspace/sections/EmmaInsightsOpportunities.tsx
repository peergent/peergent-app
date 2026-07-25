"use client";

import { Lightbulb } from "lucide-react";
import type { EmmaInsightsViewModel } from "@/lib/peer-experience/marketing/emma-workspace-types";
import EmmaCard from "../components/EmmaCard";
import EmmaWorkspaceSection from "../components/EmmaWorkspaceSection";

export type EmmaInsightsOpportunitiesProps = {
  model: EmmaInsightsViewModel;
  onDismiss?: (insightId: string) => void;
  onApply?: (insightId: string) => void;
  onReview?: (insightId: string) => void;
};

export default function EmmaInsightsOpportunities({
  model,
  onDismiss,
  onApply,
  onReview,
}: EmmaInsightsOpportunitiesProps) {
  return (
    <EmmaWorkspaceSection
      title="Insights & Opportunities"
      className="emma-workspace-section--compact"
    >
      {!model.hasInsights ? (
        <EmmaCard>
          <p className="emma-voice emma-voice--muted">{model.emptyMessage}</p>
        </EmmaCard>
      ) : (
        <EmmaCard className="emma-insights-card">
          <ul className="emma-insights-list">
            {model.insights.slice(0, 3).map((insight) => (
              <li key={insight.id} className="emma-insight">
                <div className="emma-insight__icon" aria-hidden>
                  <Lightbulb size={18} />
                </div>
                <div className="emma-insight__body">
                  <p className="emma-insight__voice">{insight.voice}</p>
                  {insight.detail && <p className="emma-insight__detail">{insight.detail}</p>}
                  {insight.source && (
                    <p className="emma-insight__detail">Source: {insight.source}</p>
                  )}
                  {insight.impact && (
                    <p className="emma-insight__detail">Impact: {insight.impact}</p>
                  )}
                  {insight.estimatedValue && (
                    <p className="emma-insight__savings">{insight.estimatedValue}</p>
                  )}
                  {insight.savingsLabel && (
                    <p className="emma-insight__savings">{insight.savingsLabel}</p>
                  )}
                  <div className="emma-insight__actions">
                    <button
                      type="button"
                      className="emma-insight__action pg-focus-premium"
                      onClick={() =>
                        insight.actionLabel === "Apply"
                          ? onApply?.(insight.id)
                          : onReview?.(insight.id)
                      }
                    >
                      {insight.actionLabel}
                    </button>
                    {onDismiss && (
                      <button
                        type="button"
                        className="emma-insight__action emma-insight__action--muted pg-focus-premium"
                        onClick={() => onDismiss(insight.id)}
                      >
                        Dismiss
                      </button>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </EmmaCard>
      )}
    </EmmaWorkspaceSection>
  );
}
