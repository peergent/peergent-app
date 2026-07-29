"use client";

import MarketingPeerPageFrame from "@/features/studio/marketing-peer/MarketingPeerPageFrame";
import V17DoneView from "@/features/customer-v17/peer/V17DoneView";
import { buildV17DoneViewModel } from "@/lib/customer-v17/build-v17-done-view-model";
import { customerLocalePreferenceFromEnv } from "@/lib/i18n/resolve-customer-locale-preference";

export default function TeamPeerDonePage() {
  return (
    <MarketingPeerPageFrame activeTab="done">
      {({ domainInput, workspace }) => {
        if (!workspace.peer) return null;
        const model = buildV17DoneViewModel({
          domainInput,
          localePreference: customerLocalePreferenceFromEnv(),
        });
        return <V17DoneView model={model} />;
      }}
    </MarketingPeerPageFrame>
  );
}
