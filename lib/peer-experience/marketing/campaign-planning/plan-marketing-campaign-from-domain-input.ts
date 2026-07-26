import type { CampaignExecutionPlan } from "@/lib/campaign/planner";
import { planCampaignExecution } from "@/lib/campaign/planner";

import {
  buildCampaignPlannerSourceFromDomainInput,
  type BuildCampaignPlannerSourceFromDomainInputArgs,
} from "./build-campaign-planner-source-from-domain-input";

export type PlanMarketingCampaignFromDomainInputArgs =
  BuildCampaignPlannerSourceFromDomainInputArgs;

/**
 * Read-only helper: domain input → CampaignExecutionPlan with no side effects.
 */
export function planMarketingCampaignFromDomainInput(
  args: PlanMarketingCampaignFromDomainInputArgs
): CampaignExecutionPlan {
  const source = buildCampaignPlannerSourceFromDomainInput(args);
  return planCampaignExecution(source);
}
