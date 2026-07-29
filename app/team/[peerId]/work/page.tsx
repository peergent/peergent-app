"use client";

import { Suspense, useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import MarketingPeerPageFrame from "@/features/studio/marketing-peer/MarketingPeerPageFrame";
import V17WorkView from "@/features/customer-v17/peer/V17WorkView";
import CreateCampaignModal from "@/features/marketing-workspace/components/CreateCampaignModal";
import { buildV17WorkViewModel } from "@/lib/customer-v17/build-v17-work-view-model";
import { customerLocalePreferenceFromEnv } from "@/lib/i18n/resolve-customer-locale-preference";
import { getProjectHref } from "@/lib/peer-experience/marketing/navigation/marketing-peer-links";
import { isMarketingCampaignWorkspaceEnabled } from "@/lib/peer-experience/marketing/marketing-workspace-feature-flags";

function WorkPageInner() {
  const router = useRouter();
  const [wizardOpen, setWizardOpen] = useState(false);
  const campaignsEnabled = isMarketingCampaignWorkspaceEnabled();

  return (
    <MarketingPeerPageFrame activeTab="work">
      {({ peerId, domainInput, workspace }) => {
        if (!workspace.peer) return null;
        const model = buildV17WorkViewModel({
          domainInput,
          peerDisplayName: workspace.peer?.name,
          localePreference: customerLocalePreferenceFromEnv(),
        });
        return (
          <>
            <V17WorkView model={model} onCreateCampaign={() => setWizardOpen(true)} />
            {campaignsEnabled && (
              <CreateCampaignModal
                open={wizardOpen}
                onClose={() => setWizardOpen(false)}
                peerId={peerId}
                ownerLabel={domainInput.userName}
                peerName={domainInput.peerName}
                presentation="v17"
                localePreference={customerLocalePreferenceFromEnv()}
                onCreate={async (input) => {
                  const result = await workspace.handleCreateCampaign(input);
                  router.push(getProjectHref(peerId, result.projectId));
                  return result;
                }}
              />
            )}
          </>
        );
      }}
    </MarketingPeerPageFrame>
  );
}

export default function TeamPeerWorkPage() {
  return (
    <Suspense fallback={null}>
      <WorkPageInner />
    </Suspense>
  );
}
