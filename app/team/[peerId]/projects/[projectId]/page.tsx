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
      {({ domainInput, workspace }) => (
        <ProjectDetailTab
          peerId={peerId}
          projectId={decodeURIComponent(projectId)}
          domainInput={domainInput}
          onStartCampaignExecution={workspace.handleStartCampaignExecution}
          onCompleteCampaignOnboarding={workspace.handleCompleteCampaignOnboarding}
          onExecuteMarketingWorkUnit={workspace.handleExecuteMarketingWorkUnit}
          onContinueCampaign={workspace.handleContinueCampaign}
          onApproveCampaign={workspace.handleApproveCampaign}
          campaignContinuationRunning={workspace.campaignContinuationRunning}
          executingWorkUnitId={workspace.activeWorkUnitId}
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
