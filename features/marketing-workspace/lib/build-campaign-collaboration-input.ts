import type { CampaignReviewBuildInput } from "@/lib/peer-experience/marketing/campaign-review";
import type { CampaignReviewViewModel } from "@/lib/peer-experience/marketing/campaign-review";
import type { CampaignCollaborationBuildInput } from "@/lib/peer-experience/marketing/campaign-collaboration";

export function buildCampaignCollaborationBuildInput(input: {
  reviewBuildInput: CampaignReviewBuildInput;
  reviewVm: CampaignReviewViewModel;
}): CampaignCollaborationBuildInput {
  const { reviewBuildInput, reviewVm } = input;
  return {
    peerId: reviewBuildInput.peerId,
    peerName: reviewBuildInput.peerName,
    projectId: reviewBuildInput.projectId,
    project: reviewBuildInput.project,
    workUnits: reviewBuildInput.workUnits,
    reviewItems: reviewVm.allReviewItems,
    strategy: reviewBuildInput.strategy,
    creativeBriefByCampaignId: reviewBuildInput.creativeBriefByCampaignId,
    linkedinPostByWorkUnitId: reviewBuildInput.linkedinPostByWorkUnitId,
    emailByWorkUnitId: reviewBuildInput.emailByWorkUnitId,
    campaignReviewDecisionByWorkUnitId: reviewBuildInput.campaignReviewDecisionByWorkUnitId,
    campaignReviewDecisionHistoryByWorkUnitId:
      reviewBuildInput.campaignReviewDecisionHistoryByWorkUnitId,
    campaignArtifactVersionByWorkUnitId: reviewBuildInput.campaignArtifactVersionByWorkUnitId,
    approvalMode: reviewBuildInput.approvalMode,
    continuationRunning: reviewBuildInput.continuationRunning,
  };
}
