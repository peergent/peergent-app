"use client";

import { Suspense, useCallback, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useAccount } from "@/components/account/AccountProvider";
import AdminCampaignInspector from "@/features/marketing-workspace/admin/AdminCampaignInspector";
import MarketingPeerPageFrame from "@/features/studio/marketing-peer/MarketingPeerPageFrame";
import { buildCampaignExecutionPlanViewModelOrUnavailable } from "@/lib/peer-experience/marketing/campaign-planning/build-campaign-execution-plan-view-model";
import { resolveCampaignProjectContext } from "@/lib/peer-experience/marketing/campaign-review/resolve-campaign-project-context";
import { isMarketingCampaignWorkspaceEnabled } from "@/lib/peer-experience/marketing/marketing-workspace-feature-flags";
import type { MarketingPeerDomainInput } from "@/lib/peer-experience/marketing/view-models/marketing-peer-domain-input";

function InspectorBody({
  peerId,
  projectId,
  organizationId,
  domainInput,
  workspace,
}: {
  peerId: string;
  projectId: string;
  organizationId?: string;
  domainInput: MarketingPeerDomainInput;
  workspace: ReturnType<
    typeof import("@/hooks/useMarketingWorkspace").useMarketingWorkspace
  >;
}) {
  const [, setRefreshKey] = useState(0);
  const refreshView = useCallback(() => {
    void workspace.loadWorkspace();
    setRefreshKey((k) => k + 1);
  }, [workspace]);

  const resolved = useMemo(
    () =>
      resolveCampaignProjectContext({
        domainInput,
        projectId,
        workspaceReady: workspace.isWorkspaceReady,
      }),
    [domainInput, projectId, workspace.isWorkspaceReady]
  );

  if (resolved.status === "loading") {
    return (
      <p className="mw-empty-inline" role="status" aria-live="polite">
        Loading campaign inspector…
      </p>
    );
  }

  if (resolved.status === "not-found") {
    return (
      <section className="mw-section">
        <p className="mw-empty-inline">No project found for id: {resolved.projectId}</p>
      </section>
    );
  }

  const campaignsEnabled = isMarketingCampaignWorkspaceEnabled();
  const executionPlan = buildCampaignExecutionPlanViewModelOrUnavailable({
    projectId,
    domainInput,
    assembledAt: resolved.project.updatedAt,
  });

  return (
    <AdminCampaignInspector
      peerId={peerId}
      projectId={projectId}
      organizationId={organizationId}
      domainInput={domainInput}
      campaign={resolved.campaignDetail}
      project={resolved.project}
      projectOrigin={resolved.project.origin}
      campaignsEnabled={campaignsEnabled}
      executionPlan={executionPlan}
      projectActivity={resolved.projectDetail.timeline}
      contentItems={resolved.projectDetail.contentItems}
      workspaceReady={workspace.isWorkspaceReady}
      onRefresh={refreshView}
      onStartCampaignExecution={workspace.handleStartCampaignExecution}
      onCompleteCampaignOnboarding={workspace.handleCompleteCampaignOnboarding}
      onExecuteMarketingWorkUnit={workspace.handleExecuteMarketingWorkUnit}
      onContinueCampaign={workspace.handleContinueCampaign}
      campaignContinuationRunning={workspace.campaignContinuationRunning}
      executingWorkUnitId={workspace.activeWorkUnitId}
      apiWarnings={workspace.apiWarnings}
    />
  );
}

function CampaignInspectorPageInner() {
  const params = useParams<{ peerId: string; projectId: string }>();
  const peerId = params.peerId ?? "";
  const projectId = decodeURIComponent(params.projectId ?? "");
  const { organizationId } = useAccount();

  return (
    <MarketingPeerPageFrame activeTab="work">
      {({ domainInput, workspace }) => (
        <InspectorBody
          peerId={peerId}
          projectId={projectId}
          organizationId={organizationId ?? undefined}
          domainInput={domainInput}
          workspace={workspace}
        />
      )}
    </MarketingPeerPageFrame>
  );
}

export default function CampaignInspectorPageClient() {
  return (
    <Suspense fallback={<p className="mw-empty-inline">Loading campaign inspector…</p>}>
      <CampaignInspectorPageInner />
    </Suspense>
  );
}
