import { describe, expect, it, beforeEach } from "vitest";
import { buildDemoDomainInput } from "@/lib/office/demo/demo-company";
import {
  createDemoCampaign,
  getDemoCampaignSnapshot,
  resetDemoCampaignStore,
  setDemoStepApproval,
} from "@/lib/office/demo/demo-campaign-store";
import { mergeDemoCampaignSnapshot } from "@/lib/office/demo/merge-demo-domain";
import { buildDeliverableReviewModel } from "@/lib/office/deliverable/build-deliverable-review";

beforeEach(() => {
  resetDemoCampaignStore();
});

describe("buildDeliverableReviewModel", () => {
  it("parses LinkedIn hashtags and CTA from simulated draft body", () => {
    createDemoCampaign("demo", {
      peerId: "demo",
      ownerLabel: "Emma",
      name: "LinkedIn test",
      goalLabel: "Leads",
      description: "Test",
      primaryGoalId: "generate_leads",
    });
    setDemoStepApproval("demo", getDemoCampaignSnapshot().extraProjects[0]!.id, "channels_selected", "approved");

    const domain = mergeDemoCampaignSnapshot(buildDemoDomainInput(), getDemoCampaignSnapshot());
    const projectId = getDemoCampaignSnapshot().extraProjects[0]!.id;
    const linkedInDraft = domain.drafts.find((d) => d.channel === "linkedin" && d.id.startsWith(projectId));
    expect(linkedInDraft).toBeDefined();

    const model = buildDeliverableReviewModel({
      draftId: linkedInDraft!.id,
      domainInput: domain,
      locale: "nl",
    });
    expect(model?.linkedInPostCopy).toBeTruthy();
    expect(model?.linkedInCta).toBeTruthy();
  });

  it("parses Google Ads structured fields", () => {
    createDemoCampaign("demo", {
      peerId: "demo",
      ownerLabel: "Emma",
      name: "Ads test",
      goalLabel: "Leads",
      description: "Test",
      primaryGoalId: "generate_leads",
    });
    setDemoStepApproval("demo", getDemoCampaignSnapshot().extraProjects[0]!.id, "channels_selected", "approved");

    const domain = mergeDemoCampaignSnapshot(buildDemoDomainInput(), getDemoCampaignSnapshot());
    const projectId = getDemoCampaignSnapshot().extraProjects[0]!.id;
    const adsDraft = domain.drafts.find((d) => d.channel === "google_ads" && d.id.startsWith(projectId));
    const model = buildDeliverableReviewModel({
      draftId: adsDraft!.id,
      domainInput: domain,
      locale: "en",
    });
    expect(model?.googleAdsHeadlines?.length).toBeGreaterThan(0);
    expect(model?.googleAdsKeywords).toBeTruthy();
    expect(model?.googleAdsPreview).toBeTruthy();
  });
});
