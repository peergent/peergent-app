import type { MarketingPeerDomainInput } from "@/lib/peer-experience/marketing/view-models/marketing-peer-domain-input";
import type { DemoCampaignSnapshot } from "./demo-campaign-store";
import type { DemoCampaignDomainOverlay } from "./demo-campaign-domain-overlay";

export type { DemoCampaignDomainOverlay } from "./demo-campaign-domain-overlay";

/**
 * Applies in-memory demo campaign mutations onto the canonical Veldwerk fixture.
 * Live workspaces never pass through this path.
 */
export function mergeDemoCampaignSnapshot(
  input: MarketingPeerDomainInput,
  campaign: DemoCampaignSnapshot
): MarketingPeerDomainInput & DemoCampaignDomainOverlay {
  if (
    campaign.extraProjects.length === 0 &&
    campaign.extraDrafts.length === 0 &&
    Object.keys(campaign.draftStatus).length === 0 &&
    Object.keys(campaign.stepApprovals).length === 0 &&
    Object.keys(campaign.campaignSchedule).length === 0 &&
    Object.keys(campaign.campaignPublished).length === 0 &&
    campaign.activityEvents.length === 0
  ) {
    return input;
  }

  const projects = [...input.projects, ...campaign.extraProjects];

  const baseDraftIds = new Set(input.drafts.map((d) => d.id));
  const extraDrafts = campaign.extraDrafts.filter((d) => !baseDraftIds.has(d.id));
  const drafts = [
    ...input.drafts.map((draft) => {
      const status = campaign.draftStatus[draft.id];
      return status ? { ...draft, status } : draft;
    }),
    ...extraDrafts.map((draft) => {
      const status = campaign.draftStatus[draft.id];
      return status ? { ...draft, status } : draft;
    }),
  ];

  const baseUnitIds = new Set(input.workUnits.map((u) => u.id));
  const extraUnits = campaign.extraWorkUnits.filter((u) => !baseUnitIds.has(u.id));
  const workUnits = [...input.workUnits, ...extraUnits].map((unit) => {
    if (!unit.draftId) return unit;
    const status = campaign.draftStatus[unit.draftId];
    if (!status) return unit;
    if (status === "ready_for_review") return { ...unit, status: "review_ready" as const };
    if (status === "approved" || status === "ready_to_publish")
      return { ...unit, status: "scheduled" as const };
    if (status === "published") return { ...unit, status: "monitoring" as const };
    return unit;
  });

  return {
    ...input,
    projects,
    drafts,
    workUnits,
    demoCampaignStepApprovals: campaign.stepApprovals,
    demoCampaignSchedule: campaign.campaignSchedule,
    demoCampaignPublished: campaign.campaignPublished,
    demoCampaignActivity: campaign.activityEvents,
    demoCampaignContexts: campaign.campaignContexts,
  };
}

export function applyDemoCampaignOverlay(
  input: MarketingPeerDomainInput & DemoCampaignDomainOverlay,
  campaign: DemoCampaignSnapshot
): MarketingPeerDomainInput & DemoCampaignDomainOverlay {
  const drafts = input.drafts.map((draft) => {
    const status = campaign.draftStatus[draft.id];
    return status ? { ...draft, status } : draft;
  });

  const workUnits = input.workUnits.map((unit) => {
    if (!unit.draftId) return unit;
    const status = campaign.draftStatus[unit.draftId];
    if (!status) return unit;
    if (status === "ready_for_review") return { ...unit, status: "review_ready" as const };
    if (status === "approved" || status === "ready_to_publish")
      return { ...unit, status: "scheduled" as const };
    if (status === "published") return { ...unit, status: "monitoring" as const };
    return unit;
  });

  return {
    ...input,
    drafts,
    workUnits,
    demoCampaignStepApprovals: campaign.stepApprovals,
    demoCampaignSchedule: campaign.campaignSchedule,
    demoCampaignPublished: campaign.campaignPublished,
    demoCampaignActivity: campaign.activityEvents,
    demoCampaignContexts: campaign.campaignContexts,
  };
}
