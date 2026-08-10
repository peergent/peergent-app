import type { MarketingPeerDomainInput } from "@/lib/peer-experience/marketing/view-models/marketing-peer-domain-input";
import type { MarketingProject } from "@/lib/peer-experience/marketing/projects/types";
import { readCampaignBrainOutputs } from "@/lib/office/campaign/campaign-brain-outputs";
import { buildCampaignContext } from "@/lib/office/campaign/campaign-context";
import { buildCampaignExecutiveBriefing } from "@/lib/peer-experience/marketing/campaign-review/build-campaign-executive-briefing";
import { readPlanningGraphFromOutputs } from "@/lib/brain/integration/ensure-campaign-planning";
import type { CampaignWorkflowStep } from "@/lib/office/campaign/workflow-types";
import type { CampaignReviewItem } from "@/lib/peer-experience/marketing/campaign-review/campaign-review-types";
import type { CampaignApprovalMode } from "@/lib/campaign/types/campaign";
import { buildCampaignBrainOutput } from "./aggregate/build-campaign-brain-output";
import { buildDemoCampaignBrainOutput } from "./demo/demo-brain-output";
import {
  resolveBrainPresentationContext,
  type CampaignBrainPresentationContext,
} from "./presentation-context";
import type { CampaignBrainOutput } from "./types";

export function resolveCampaignBrainOutput(input: {
  project: MarketingProject;
  domainInput: MarketingPeerDomainInput;
  locale?: string | null;
  isDemo?: boolean;
  workflowSteps: readonly CampaignWorkflowStep[];
  statusLabel: string;
  allReviewItems?: readonly CampaignReviewItem[];
  approvalMode?: CampaignApprovalMode;
  deliverableCount?: number;
  recommendationHref?: string | null;
  now?: Date;
}): CampaignBrainOutput | null {
  const ctx: CampaignBrainPresentationContext = {
    ...resolveBrainPresentationContext({
      peerId: input.project.peerId,
      locale: input.locale,
      isDemo: input.isDemo,
      now: input.now,
    }),
    project: input.project,
    domainInput: input.domainInput,
    campaignContext: buildCampaignContext({
      project: input.project,
      domainInput: input.domainInput,
      locale: input.locale,
    }),
  };

  if (ctx.isDemo) {
    return buildDemoCampaignBrainOutput({
      ctx,
      statusLabel: input.statusLabel,
      workflowSteps: [...input.workflowSteps],
      recommendationHref: input.recommendationHref,
    });
  }

  const outputs = readCampaignBrainOutputs(input.project);
  const hasBrainData = Boolean(
    outputs.strategy ||
      outputs.channel_planning ||
      outputs.campaign_planning ||
      outputs.creative_generation ||
      outputs.validation
  );

  if (!hasBrainData) return null;

  const briefing = buildCampaignExecutiveBriefing({
    project: input.project,
    domainInput: input.domainInput,
    allReviewItems: input.allReviewItems ?? [],
    approvalMode: input.approvalMode,
    locale: input.locale,
  });

  void readPlanningGraphFromOutputs(outputs);

  return buildCampaignBrainOutput({
    ctx,
    outputs,
    briefing,
    workflowSteps: input.workflowSteps,
    statusLabel: input.statusLabel,
    deliverableCount: input.deliverableCount,
    recommendationHref: input.recommendationHref,
  });
}
