import type { MarketingPeerDomainInput } from "@/lib/peer-experience/marketing/view-models/marketing-peer-domain-input";
import type { useMarketingWorkspace } from "@/hooks/useMarketingWorkspace";
import { resolveCampaignTitle } from "@/lib/peer-experience/marketing/resolve-campaign-title";

type Workspace = ReturnType<typeof useMarketingWorkspace>;

export function buildMarketingPeerDomainInput(input: {
  peerId: string;
  organizationId?: string;
  userName: string;
  peerName: string;
  workspace: Workspace;
  connections: MarketingPeerDomainInput["connections"];
}): MarketingPeerDomainInput {
  const { workspace } = input;
  return {
    peerId: input.peerId,
    organizationId: input.organizationId,
    userName: input.userName,
    peerName: input.peerName,
    campaignTitle: resolveCampaignTitle(workspace.plan, workspace.strategy),
    generating: workspace.generating,
    generatingActivity: workspace.generatingActivity,
    understanding: workspace.understanding,
    strategy: workspace.strategy,
    plan: workspace.plan,
    drafts: workspace.drafts,
    publicationPackages: workspace.publicationPackages,
    activityFeed: workspace.activityFeed,
    workUnits: workspace.syncedWorkUnits,
    projects: workspace.projects,
    responsibilities: workspace.responsibilities,
    automations: workspace.automations,
    connections: input.connections,
    storedMetrics: workspace.storedMetrics,
    approvalOverlays: workspace.approvalOverlays,
    insightRotation: workspace.insightRotation,
    selectedWorkUnitId: workspace.selectedWorkUnitId,
    activeWorkUnitId: workspace.activeWorkUnitId,
    selectedDraftId: workspace.selectedDraftId,
  };
}
