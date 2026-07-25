"use client";

import { Suspense } from "react";
import { useParams } from "next/navigation";
import MarketingPeerPageFrame from "@/features/studio/marketing-peer/MarketingPeerPageFrame";
import ProjectDetailTab from "@/features/marketing-workspace/details/ProjectDetailTab";

function ProjectDetailPageInner() {
  const params = useParams<{ peerId: string; projectId: string }>();
  const peerId = params.peerId ?? "";
  const projectId = params.projectId ?? "";

  return (
    <MarketingPeerPageFrame activeTab="work">
      {({ domainInput }) => (
        <ProjectDetailTab
          peerId={peerId}
          projectId={decodeURIComponent(projectId)}
          domainInput={domainInput}
        />
      )}
    </MarketingPeerPageFrame>
  );
}

export default function TeamPeerProjectDetailPage() {
  return (
    <Suspense fallback={null}>
      <ProjectDetailPageInner />
    </Suspense>
  );
}
