"use client";

import MarketingPeerPageFrame from "@/features/studio/marketing-peer/MarketingPeerPageFrame";
import V17TodayView from "@/features/customer-v17/peer/V17TodayView";
import { buildV17TodayViewModel } from "@/lib/customer-v17/build-v17-today-view-model";
import { customerLocalePreferenceFromEnv } from "@/lib/i18n/resolve-customer-locale-preference";

export default function TeamPeerPage() {
  return (
    <MarketingPeerPageFrame activeTab="today">
      {({ domainInput, workspace }) => {
        if (!workspace.peer) return null;
        const model = buildV17TodayViewModel({
          peer: workspace.peer,
          domainInput,
          localePreference: customerLocalePreferenceFromEnv(),
        });
        return <V17TodayView model={model} />;
      }}
    </MarketingPeerPageFrame>
  );
}
