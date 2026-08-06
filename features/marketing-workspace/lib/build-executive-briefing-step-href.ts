import type { CampaignWorkflowStepId } from "@/lib/office/campaign/workflow-types";
import type { CampaignReviewItem } from "@/lib/peer-experience/marketing/campaign-review";
import {
  getCampaignInspectorHref,
  getCampaignReviewItemHref,
} from "@/lib/peer-experience/marketing/navigation/marketing-peer-links";
import { isMarketingCampaignInspectorEnabled } from "@/lib/peer-experience/marketing/campaign-inspector-guard";

const STEP_TO_ARTIFACT: Partial<
  Record<CampaignWorkflowStepId, CampaignReviewItem["artifactType"]>
> = {
  strategy_determined: "campaign_strategy",
  deliverables_created: "creative_direction",
  channels_selected: "campaign_strategy",
};

export function buildExecutiveBriefingStepHref(input: {
  peerId: string;
  projectId: string;
  stepId: CampaignWorkflowStepId;
  allReviewItems: readonly CampaignReviewItem[];
}): string {
  if (isMarketingCampaignInspectorEnabled()) {
    return `${getCampaignInspectorHref(input.peerId, input.projectId)}?step=${encodeURIComponent(input.stepId)}`;
  }

  const artifactType = STEP_TO_ARTIFACT[input.stepId];
  if (artifactType) {
    const item = input.allReviewItems.find((i) => i.artifactType === artifactType && i.preview);
    if (item) {
      return getCampaignReviewItemHref(input.peerId, input.projectId, item.id);
    }
  }

  if (input.stepId === "deliverables_created") {
    const deliverable = input.allReviewItems.find(
      (i) =>
        (i.artifactType === "linkedin_post" || i.artifactType === "email_campaign") && i.preview
    );
    if (deliverable) {
      return getCampaignReviewItemHref(input.peerId, input.projectId, deliverable.id);
    }
  }

  return `#evidence-${input.stepId}`;
}
