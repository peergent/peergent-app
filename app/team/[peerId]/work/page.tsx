"use client";

import { Suspense } from "react";
import MarketingPeerPageFrame from "@/features/studio/marketing-peer/MarketingPeerPageFrame";
import ProjectsTab from "@/features/marketing-workspace/tabs/ProjectsTab";

function WorkPageInner() {
  return (
    <MarketingPeerPageFrame activeTab="work">
      {({ peerId, domainInput }) => (
        <ProjectsTab
          peerId={peerId}
          domainInput={domainInput}
          onCreateCampaign={() => {
            // TODO: Sprint 15+ — wire dedicated campaign/project creation (not Create post modal).
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
