import type { MarketingProject } from "./types";
import type { MarketingCampaignDetailViewModel } from "../view-models/marketing-campaign-types";

/** Customer-facing campaign records created via the native Create Campaign wizard. */
export function isCampaignWizardProject(
  project: Pick<MarketingProject, "origin"> | null | undefined
): boolean {
  return project?.origin === "campaign_wizard";
}

/**
 * When true, project detail renders the Campaign Experience only (no legacy project chrome).
 */
export function shouldRenderCampaignWizardDetailView(
  campaignsEnabled: boolean,
  project: Pick<MarketingProject, "origin"> | null | undefined,
  campaignDetail: MarketingCampaignDetailViewModel | null | undefined
): boolean {
  return (
    campaignsEnabled &&
    isCampaignWizardProject(project) &&
    campaignDetail != null
  );
}

/** Back navigation label on campaign-wizard detail (work tab lists campaigns). */
export function campaignWizardDetailBackLabel(): string {
  return "← Back to campaigns";
}
