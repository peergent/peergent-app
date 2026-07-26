"use client";

import {
  MARKETING_PEER_ONBOARDING_PREP_ITEMS,
  MARKETING_PEER_ONBOARDING_TASK_LABELS,
} from "../lib/marketing-peer-onboarding-presenter";

export type MarketingPeerOnboardingCardProps = {
  peerName: string;
  onContinue: () => void;
  onSkip: () => void;
};

export default function MarketingPeerOnboardingCard({
  peerName,
  onContinue,
  onSkip,
}: MarketingPeerOnboardingCardProps) {
  return (
    <div
      className="mw-section mw-glass mw-marketing-peer-onboarding"
      data-testid="mw-marketing-peer-onboarding"
      style={{ padding: 20, marginBottom: 16 }}
    >
      <p className="mw-marketing-peer-onboarding-lead">
        Great. I&apos;ve created your campaign.
      </p>
      <p className="mw-kn-helper" style={{ marginTop: 10 }}>
        Before I start creating content I&apos;d like to understand your business a little
        better.
      </p>
      <p className="mw-kn-helper" style={{ marginTop: 14 }}>
        I&apos;ll prepare:
      </p>
      <ul className="mw-marketing-peer-onboarding-prep" aria-label="What your marketing peer will prepare">
        {MARKETING_PEER_ONBOARDING_PREP_ITEMS.map((item) => (
          <li key={item}>
            <span className="mw-marketing-peer-onboarding-check" aria-hidden>
              ✓
            </span>
            {item}
          </li>
        ))}
      </ul>
      <p className="mw-kn-helper" style={{ marginTop: 12 }}>
        This usually takes just a few minutes.
      </p>

      <div className="mw-marketing-peer-onboarding-actions">
        <button
          type="button"
          className="mw-btn-primary pg-focus-premium"
          data-testid="mw-marketing-peer-onboarding-continue"
          onClick={onContinue}
        >
          Continue
        </button>
        <button
          type="button"
          className="mw-marketing-peer-onboarding-skip pg-focus-premium"
          data-testid="mw-marketing-peer-onboarding-skip"
          onClick={onSkip}
        >
          Skip for now
        </button>
      </div>

      <ul
        className="mw-marketing-peer-onboarding-tasks"
        aria-label={`${peerName} onboarding steps`}
      >
        {MARKETING_PEER_ONBOARDING_TASK_LABELS.map((label) => (
          <li key={label} className="mw-marketing-peer-onboarding-task">
            <span className="mw-marketing-peer-onboarding-task-marker" aria-hidden>
              ○
            </span>
            <span>{label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
