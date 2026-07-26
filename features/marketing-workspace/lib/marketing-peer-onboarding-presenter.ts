import type { CampaignStatus } from "@/lib/campaign/types/campaign";
import { isCampaignOnboardingComplete } from "@/lib/peer-experience/marketing/campaign-onboarding";
import type { MarketingProjectCampaignSetup } from "@/lib/peer-experience/marketing/projects/types";
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

export type CampaignOnboardingUiContext = {
  readonly campaignsEnabled: boolean;
  readonly projectOrigin?: MarketingProjectOrigin;
  readonly projectId: string;
  readonly workUnits: readonly WorkUnit[];
  readonly campaignStatus: CampaignStatus;
  readonly campaignSetup?: MarketingProjectCampaignSetup;
  /** Welcome card dismissed for this session (Skip for now on welcome). */
  readonly welcomeDismissed?: boolean;
};

function isCampaignWizardPreExecution(ctx: CampaignOnboardingUiContext): boolean {
  if (!ctx.campaignsEnabled) return false;
  if (ctx.projectOrigin !== "campaign_wizard") return false;
  if (ctx.campaignStatus !== "planning") return false;
  if (projectHasCampaignExecutionWork(ctx.projectId, ctx.workUnits)) return false;
  return true;
}

/** Welcome card before conversational setup begins. */
export function shouldShowMarketingPeerWelcomeCard(ctx: CampaignOnboardingUiContext): boolean {
  if (!isCampaignWizardPreExecution(ctx)) return false;
  if (isCampaignOnboardingComplete(ctx.campaignSetup)) return false;
  if (ctx.welcomeDismissed) return false;
  return true;
}

/** Calm incomplete state after Skip for now on the welcome card. */
export function shouldShowMarketingPeerIncompleteSetup(ctx: CampaignOnboardingUiContext): boolean {
  if (!isCampaignWizardPreExecution(ctx)) return false;
  if (isCampaignOnboardingComplete(ctx.campaignSetup)) return false;
  return Boolean(ctx.welcomeDismissed);
}

export function shouldShowCampaignExecutionPlan(ctx: CampaignOnboardingUiContext): boolean {
  if (!ctx.campaignsEnabled) return true;
  if (ctx.projectOrigin !== "campaign_wizard") return true;
  if (projectHasCampaignExecutionWork(ctx.projectId, ctx.workUnits)) return true;
  return isCampaignOnboardingComplete(ctx.campaignSetup);
}

export function shouldHideStartCampaignDuringSetup(ctx: CampaignOnboardingUiContext): boolean {
  if (!ctx.campaignsEnabled || ctx.projectOrigin !== "campaign_wizard") return false;
  if (projectHasCampaignExecutionWork(ctx.projectId, ctx.workUnits)) return false;
  return !isCampaignOnboardingComplete(ctx.campaignSetup);
}

export function isPlannerOrientedNextActionLabel(label: string): boolean {
  const lower = label.trim().toLowerCase();
  return (
    lower.includes("continue planning") ||
    lower.includes("plan campaign") ||
    lower.includes("generate missing creative")
  );
}

export function shouldShowHeroNextAction(
  ctx: CampaignOnboardingUiContext,
  nextActionLabel: string
): boolean {
  if (!isCampaignWizardPreExecution(ctx)) return true;
  if (!isCampaignOnboardingComplete(ctx.campaignSetup)) return false;
  return !isPlannerOrientedNextActionLabel(nextActionLabel);
}

/** @deprecated Use shouldShowMarketingPeerWelcomeCard */
export function shouldShowMarketingPeerOnboarding(input: {
  campaignsEnabled: boolean;
  projectOrigin?: MarketingProjectOrigin;
  projectId: string;
  workUnits: readonly WorkUnit[];
  campaignStatus: CampaignStatus;
  onboardingDismissed?: boolean;
}): boolean {
  return shouldShowMarketingPeerWelcomeCard({
    ...input,
    welcomeDismissed: input.onboardingDismissed,
  });
}

export function shouldHideCampaignExecutionPlanWhileOnboarding(onboardingActive: boolean): boolean {
  return onboardingActive;
}
