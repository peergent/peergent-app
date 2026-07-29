"use client";

import { Suspense } from "react";
import MarketingPeerPageFrame from "@/features/studio/marketing-peer/MarketingPeerPageFrame";
import WebsiteIntelligenceExperience from "@/components/website-intelligence/WebsiteIntelligenceExperience";
import { customerLocalePreferenceFromEnv } from "@/lib/i18n/resolve-customer-locale-preference";
import { resolveMarketingCampaignLocale } from "@/lib/i18n/marketing-campaign-copy";

function WebsiteIntelligenceInner({ peerId }: { peerId: string }) {
  const locale = resolveMarketingCampaignLocale(customerLocalePreferenceFromEnv());
  const nl = locale === "nl";
  const knowledgeHref = `/team/${encodeURIComponent(peerId)}/settings?section=knowledge`;

  return (
    <WebsiteIntelligenceExperience
      variant="v17"
      backHref={knowledgeHref}
      backLabel={nl ? "← Terug naar bedrijfskennis" : "← Back to company knowledge"}
      title={nl ? "Websitescan" : "Website scan"}
      enableHireJourney={false}
    />
  );
}

export default function TeamWebsiteIntelligencePage() {
  return (
    <MarketingPeerPageFrame activeTab="settings">
      {({ peerId }) => <WebsiteIntelligenceInner peerId={peerId} />}
    </MarketingPeerPageFrame>
  );
}

export function TeamWebsiteIntelligencePageWithSuspense() {
  return (
    <Suspense fallback={null}>
      <TeamWebsiteIntelligencePage />
    </Suspense>
  );
}
