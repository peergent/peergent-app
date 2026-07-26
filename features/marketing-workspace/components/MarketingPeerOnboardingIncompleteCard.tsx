"use client";

export type MarketingPeerOnboardingIncompleteCardProps = {
  peerName: string;
  onContinueSetup: () => void;
};

export default function MarketingPeerOnboardingIncompleteCard({
  peerName,
  onContinueSetup,
}: MarketingPeerOnboardingIncompleteCardProps) {
  return (
    <div
      className="mw-section mw-glass mw-marketing-peer-onboarding-incomplete"
      data-testid="mw-marketing-peer-onboarding-incomplete"
      style={{ padding: 20, marginBottom: 16 }}
    >
      <p className="mw-marketing-peer-onboarding-lead">Campaign setup is not finished yet.</p>
      <p className="mw-kn-helper" style={{ marginTop: 10 }}>
        {peerName} needs a few answers before preparing your campaign strategy, plan, and content
        calendar.
      </p>
      <button
        type="button"
        className="mw-btn-primary pg-focus-premium"
        style={{ marginTop: 16 }}
        data-testid="mw-marketing-peer-continue-setup"
        onClick={onContinueSetup}
      >
        Continue setup
      </button>
    </div>
  );
}
