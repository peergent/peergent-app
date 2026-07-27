"use client";

import type { MarketingCampaignCopy } from "@/lib/i18n/marketing-campaign-copy";
import type { EngagementJourneyPresentation } from "../lib/customer-campaign-presenter";

export type CustomerEngagementJourneyProps = {
  copy: MarketingCampaignCopy;
  journey: EngagementJourneyPresentation;
};

export default function CustomerEngagementJourney({
  copy,
  journey,
}: CustomerEngagementJourneyProps) {
  const trackPhases = journey.phases.filter(
    (p) => p.id !== "publish" && p.id !== "measure"
  );

  return (
    <section className="mw-engagement-journey" aria-label={copy.campaignProgressTitle}>
      <div className="mw-engagement-journey-summary">
        <p className="mw-engagement-journey-line">
          <span className="mw-engagement-journey-label">{copy.engagementPreparationLabel}</span>
          <span className="mw-engagement-journey-value">{journey.preparation}</span>
        </p>
        {journey.currentStage ? (
          <p className="mw-engagement-journey-line">
            <span className="mw-engagement-journey-label">{copy.engagementCurrentLabel}</span>
            <span className="mw-engagement-journey-value">{journey.currentStage}</span>
          </p>
        ) : null}
        {journey.whatsNext ? (
          <p className="mw-engagement-journey-line">
            <span className="mw-engagement-journey-label">{copy.engagementNextLabel}</span>
            <span className="mw-engagement-journey-value">{journey.whatsNext}</span>
          </p>
        ) : null}
      </div>
      <ol className="mw-engagement-journey-track">
        {trackPhases.map((phase) => (
          <li
            key={phase.id}
            className={`mw-engagement-journey-step mw-engagement-journey-step--${phase.state}`}
            title={phase.stateLabel}
          >
            <span className="mw-engagement-journey-dot" aria-hidden />
            <span className="sr-only">
              {phase.label}: {phase.stateLabel}
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}
