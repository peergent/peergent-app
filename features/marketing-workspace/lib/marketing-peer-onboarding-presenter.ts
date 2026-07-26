import type { CampaignStatus } from "@/lib/campaign/types/campaign";
import type { MarketingProjectOrigin } from "@/lib/peer-experience/marketing/responsibilities/types";
import type { WorkUnit } from "@/lib/peer-workflow/work-unit";
import { projectHasCampaignExecutionWork } from "./campaign-start-action-presenter";

export const MARKETING_PEER_ONBOARDING_PREP_ITEMS = [
  "campaign strategy",
  "positioning",
  "campaign plan",
  "content calendar",
  "first content ideas",
] as const;

export const MARKETING_PEER_ONBOARDING_TASK_LABELS = [
  "Understand your business",
  "Define audience",
  "Build campaign strategy",
  "Build campaign plan",
  "Prepare content calendar",
] as const;

export type MarketingPeerOnboardingVisibilityInput = {
  readonly campaignsEnabled: boolean;
  readonly projectOrigin?: MarketingProjectOrigin;
  readonly projectId: string;
  readonly workUnits: readonly WorkUnit[];
  readonly campaignStatus: CampaignStatus;
  /** Session-only dismiss (Skip for now / Continue until persistence in a later sprint). */
  readonly onboardingDismissed?: boolean;
};

/**
 * Customer onboarding replaces the empty planning state before execution starts.
 * Planner/executor unchanged — UI only.
 */
export function shouldShowMarketingPeerOnboarding(
  input: MarketingPeerOnboardingVisibilityInput
): boolean {
  if (!input.campaignsEnabled) return false;
  if (input.projectOrigin !== "campaign_wizard") return false;
  if (input.onboardingDismissed) return false;
  if (input.campaignStatus !== "planning") return false;
  if (projectHasCampaignExecutionWork(input.projectId, input.workUnits)) return false;
  return true;
}

export function shouldHideCampaignExecutionPlanWhileOnboarding(
  onboardingActive: boolean
): boolean {
  return onboardingActive;
}
