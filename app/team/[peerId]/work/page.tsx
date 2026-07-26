"use client";

import { Suspense, useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import MarketingPeerPageFrame from "@/features/studio/marketing-peer/MarketingPeerPageFrame";
import ProjectsTab from "@/features/marketing-workspace/tabs/ProjectsTab";
import { getProjectHref } from "@/lib/peer-experience/marketing/navigation/marketing-peer-links";
import { isMarketingCampaignWorkspaceEnabled } from "@/lib/peer-experience/marketing/marketing-workspace-feature-flags";

function WorkPageInner() {
  const router = useRouter();
  const [wizardOpen, setWizardOpen] = useState(false);
  const campaignsEnabled = isMarketingCampaignWorkspaceEnabled();

  const openWizard = useCallback(() => {
    if (campaignsEnabled) {
      setWizardOpen(true);
    }
  }, [campaignsEnabled]);

  return (
    <MarketingPeerPageFrame activeTab="work">
      {({ peerId, domainInput, workspace }) => (
        <ProjectsTab
          peerId={peerId}
          domainInput={domainInput}
          ownerLabel={domainInput.userName}
          peerName={domainInput.peerName}
          campaignsEnabled={campaignsEnabled}
          createCampaignWizardOpen={wizardOpen}
          onOpenCreateCampaignWizard={openWizard}
          onCloseCreateCampaignWizard={() => setWizardOpen(false)}
          onCreateCampaign={
            campaignsEnabled
              ? async (input) => workspace.handleCreateCampaign(input)
              : undefined
          }
          onCampaignCreated={(projectId) => {
            router.push(getProjectHref(peerId, projectId));
          }}
        />
      )}
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
