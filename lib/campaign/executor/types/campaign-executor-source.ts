import type { CampaignStatus } from "@/lib/campaign/types/campaign";
import type { CampaignExecutionPlan } from "@/lib/campaign/planner/types/campaign-execution-plan";
import type { CampaignPlannerResponsibilitySummary } from "@/lib/campaign/planner/types/campaign-planner-source";
import type { CampaignPlannerWorkUnitSummary } from "@/lib/campaign/planner/types/campaign-planner-source";

export type CampaignExecutorResponsibilitySummary = CampaignPlannerResponsibilitySummary & {
  readonly peerId?: string;
};

export type CampaignExecutorWorkUnitSummary = CampaignPlannerWorkUnitSummary;

/**
 * Readonly input for pure execution planning — no hooks, storage, or framework types.
 */
export type CampaignExecutorSource = {
  readonly organizationId: string;
  readonly peerId: string;
  readonly campaignId: string;
  readonly currentCampaignStatus: CampaignStatus;
  readonly executionPlan: CampaignExecutionPlan;
  readonly existingWorkUnits?: readonly CampaignExecutorWorkUnitSummary[];
  readonly responsibilities?: readonly CampaignExecutorResponsibilitySummary[];
  readonly requestedBy: string;
  readonly assembledAt: string;
  readonly version: number;
  readonly idempotencyKey?: string;
};
