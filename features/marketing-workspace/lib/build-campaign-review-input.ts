import type { MarketingPeerDomainInput } from "@/lib/peer-experience/marketing/view-models/marketing-peer-domain-input";
import type { MarketingCampaignDetailViewModel } from "@/lib/peer-experience/marketing/view-models/marketing-campaign-types";
import type { MarketingProject } from "@/lib/peer-experience/marketing/projects/types";
import { isCampaignOnboardingComplete } from "@/lib/peer-experience/marketing/campaign-onboarding";
import type { CampaignReviewBuildInput } from "@/lib/peer-experience/marketing/campaign-review";
import { projectHasCampaignExecutionWork } from "../lib/campaign-start-action-presenter";

export function buildCampaignReviewBuildInput(input: {
  peerId: string;
  projectId: string;
  domainInput: MarketingPeerDomainInput;
  campaignDetail: MarketingCampaignDetailViewModel;
  project: MarketingProject;
  campaignsEnabled: boolean;
  continuationRunning?: boolean;
  activeWorkUnitId?: string | null;
}): CampaignReviewBuildInput {
  return {
    peerId: input.peerId,
    peerName: input.domainInput.peerName,
    projectId: input.projectId,
    project: input.project,
    campaignDetail: input.campaignDetail,
    workUnits: input.domainInput.workUnits,
    strategy: input.domainInput.strategy,
    creativeBriefByCampaignId: input.domainInput.creativeBriefByCampaignId,
    linkedinPostByWorkUnitId: input.domainInput.linkedinPostByWorkUnitId,
    emailByWorkUnitId: input.domainInput.emailByWorkUnitId,
    approvalMode: input.project.campaignSetup?.approvalMode,
    campaignsEnabled: input.campaignsEnabled,
    onboardingComplete: isCampaignOnboardingComplete(input.project.campaignSetup),
    hasExecutionWork: projectHasCampaignExecutionWork(
      input.projectId,
      input.domainInput.workUnits
    ),
    continuationRunning: input.continuationRunning,
    activeWorkUnitId: input.activeWorkUnitId,
    campaignReviewDecisionByWorkUnitId: input.domainInput.campaignReviewDecisionByWorkUnitId,
    campaignReviewDecisionHistoryByWorkUnitId:
      input.domainInput.campaignReviewDecisionHistoryByWorkUnitId,
    campaignArtifactVersionByWorkUnitId: input.domainInput.campaignArtifactVersionByWorkUnitId,
  };
}
