"use client";

import { Suspense } from "react";
import MarketingPeerPageFrame from "@/features/studio/marketing-peer/MarketingPeerPageFrame";
import ProjectsTab from "@/features/marketing-workspace/tabs/ProjectsTab";

function WorkPageInner() {
  return (
    <MarketingPeerPageFrame activeTab="work">
      {({ peerId, domainInput }) => (
        <ProjectsTab peerId={peerId} domainInput={domainInput} />
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
