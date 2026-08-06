import { buildCampaignReviewBuildInput } from "@/features/marketing-workspace/lib/build-campaign-review-input";
import {
  buildCampaignReviewViewModel,
  type CampaignReviewViewModel,
} from "@/lib/peer-experience/marketing/campaign-review";
import { buildMarketingCampaignDetailViewModel } from "@/lib/peer-experience/marketing/view-models/build-marketing-campaign-detail-view-model";
import { buildMarketingCampaignDetailSourceFromDomainInput } from "@/lib/peer-experience/marketing/view-models/build-project-campaign-projection";
import type { MarketingPeerDomainInput } from "@/lib/peer-experience/marketing/view-models/marketing-peer-domain-input";

export function buildOfficeCampaignReviewViewModel(input: {
  peerId: string;
  projectId: string;
  domainInput: MarketingPeerDomainInput;
  localePreference?: string | null;
  continuationRunning?: boolean;
}): CampaignReviewViewModel | null {
  const project = input.domainInput.projects.find((p) => p.id === input.projectId);
  if (!project) return null;

  const source = buildMarketingCampaignDetailSourceFromDomainInput(
    input.domainInput,
    input.projectId
  );
  const campaignDetail = buildMarketingCampaignDetailViewModel(source);
  if (!campaignDetail) return null;

  return buildCampaignReviewViewModel(
    buildCampaignReviewBuildInput({
      peerId: input.peerId,
      projectId: input.projectId,
      domainInput: input.domainInput,
      campaignDetail,
      project,
      campaignsEnabled: true,
      continuationRunning: input.continuationRunning,
      localePreference: input.localePreference,
    })
  );
}
