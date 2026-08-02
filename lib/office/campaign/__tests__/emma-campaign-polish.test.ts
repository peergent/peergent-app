import { beforeEach, describe, expect, it } from "vitest";
import { buildStructuredStrategyEvidence } from "@/lib/office/campaign/build-structured-strategy-evidence";
import { buildCampaignResultsViewModel } from "@/lib/office/campaign/build-campaign-results";
import { buildCampaignContextFromCreateInput } from "@/lib/office/campaign/campaign-context";
import { buildDeskCampaignOverview } from "@/lib/office/desk/build-desk-campaign-overview";
import { createDemoCampaign, getDemoCampaignSnapshot, resetDemoCampaignStore } from "@/lib/office/demo/demo-campaign-store";
import { buildDemoDomainInput } from "@/lib/office/demo/demo-company";
import { mergeDemoCampaignSnapshot } from "@/lib/office/demo/merge-demo-domain";
import { createMarketingCampaignProject } from "@/lib/peer-experience/marketing/projects/project-engine";

describe("Emma campaign polish", () => {
  const input = {
    peerId: "demo" as const,
    ownerLabel: "Emma",
    name: "Peergent",
    goalLabel: "Demo-aanvragen",
    description: "Meer demo-aanvragen bij ondernemers met digitale AI-collega's.",
    primaryGoalId: "generate_leads" as const,
    targetAudience: "Ondernemers met 1–20 medewerkers",
    setupMode: "automatic" as const,
    approvalMode: "approval_before_publication" as const,
  };

  beforeEach(() => resetDemoCampaignStore());

  it("strategy has distinct senior-marketer sections", () => {
    const project = createMarketingCampaignProject(input);
    const ctx = buildCampaignContextFromCreateInput(project, input, "nl");
    const evidence = buildStructuredStrategyEvidence(ctx, true);
    const ids = evidence.sections.map((s) => s.id);
    expect(ids).toContain("business_summary");
    expect(ids).toContain("value_proposition");
    expect(ids).toContain("customer_journey");
    expect(ids).toContain("content_direction");
    expect(ids).toContain("risks");
    expect(ids).toContain("next_recommendation");
    const allText = evidence.sections.flatMap((s) => s.items).join(" ").toLowerCase();
    expect(allText).not.toContain("aangepast doel");
  });

  it("results view model expands after publish", () => {
    const results = buildCampaignResultsViewModel({
      channels: ["linkedin", "email"],
      locale: "nl",
      isPublished: true,
      campaignName: "Peergent",
    });
    expect(results.hasSufficientData).toBe(true);
    expect(results.metrics.some((m) => m.id === "impressions")).toBe(true);
    expect(results.suggestedActions.length).toBeGreaterThan(3);
    expect(results.emmaRecommendations.length).toBeGreaterThan(0);
  });

  it("desk overview surfaces needs approval campaigns", () => {
    const project = createDemoCampaign("demo", input, "nl");
    const domain = mergeDemoCampaignSnapshot(buildDemoDomainInput({ locale: "nl" }), getDemoCampaignSnapshot());
    const overview = buildDeskCampaignOverview({ domainInput: domain, locale: "nl", isDemo: true });
    expect(overview.needsApproval.some((r) => r.id === project.id)).toBe(true);
  });
});
