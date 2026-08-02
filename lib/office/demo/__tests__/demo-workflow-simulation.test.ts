import { describe, expect, it } from "vitest";
import { createMarketingCampaignProject } from "@/lib/peer-experience/marketing/projects/project-engine";
import {
  simulateDemoCampaignWorkflow,
  unlockDemoDeliverables,
} from "@/lib/office/demo/demo-workflow-simulation";
import { containsInstallerLeak } from "@/lib/office/campaign/campaign-context";

describe("demo workflow simulation", () => {
  it("generates context-aware deliverables without fixture leakage", () => {
    const project = createMarketingCampaignProject({
      peerId: "demo",
      ownerLabel: "Emma",
      name: "Peergent",
      goalLabel: "Leads genereren",
      description: "Meer demo-aanvragen bij ondernemers met 1–20 medewerkers",
      primaryGoalId: "generate_leads",
      targetAudience: "Ondernemers met 1 tot 20 werknemers",
      setupMode: "automatic",
    });

    const bundle = simulateDemoCampaignWorkflow(
      project,
      {
        peerId: "demo",
        ownerLabel: "Emma",
        name: "Peergent",
        goalLabel: "Leads genereren",
        description: "Meer demo-aanvragen bij ondernemers met 1–20 medewerkers",
        primaryGoalId: "generate_leads",
        targetAudience: "Ondernemers met 1 tot 20 werknemers",
        setupMode: "automatic",
      },
      "nl"
    );

    expect(bundle.drafts.length).toBeGreaterThanOrEqual(3);
    expect(bundle.drafts.every((d) => d.status === "draft")).toBe(true);
    expect(bundle.stepApprovals.business_analyzed).toBe("approved");
    expect(bundle.stepApprovals.website_analyzed).toBeUndefined();
    expect(bundle.stepApprovals.competitors_analyzed).toBeUndefined();
    expect(bundle.deliverablesUnlocked).toBe(false);

    const allText = bundle.drafts.map((d) => `${d.title} ${d.body}`).join(" ");
    expect(containsInstallerLeak(allText)).toBe(false);
    expect(allText.toLowerCase()).toContain("peergent");

    const channels = bundle.drafts.map((d) => d.channel);
    expect(channels).toContain("linkedin");
    expect(channels).toContain("email");
  });

  it("unlocks deliverables to ready_for_review after channels approval", () => {
    const project = createMarketingCampaignProject({
      peerId: "demo",
      ownerLabel: "Emma",
      name: "Test",
      goalLabel: "Leads",
      description: "Desc",
      primaryGoalId: "generate_leads",
    });
    const bundle = simulateDemoCampaignWorkflow(
      project,
      {
        peerId: "demo",
        ownerLabel: "Emma",
        name: "Test",
        goalLabel: "Leads",
        description: "Desc",
        primaryGoalId: "generate_leads",
      },
      "en"
    );

    const unlocked = unlockDemoDeliverables(bundle.drafts, bundle.workUnits);
    expect(unlocked.drafts.every((d) => d.status === "ready_for_review")).toBe(true);
    expect(unlocked.workUnits.every((u) => u.status === "review_ready")).toBe(true);
  });

  it("produces stable copy for the same goal category", () => {
    const input = {
      peerId: "demo" as const,
      ownerLabel: "Emma",
      name: "Brand push",
      goalLabel: "Brand awareness",
      description: "Grow visibility with entrepreneurs",
      primaryGoalId: "brand_awareness" as const,
    };
    const project = createMarketingCampaignProject(input);
    const a = simulateDemoCampaignWorkflow(project, input, "en");
    const b = simulateDemoCampaignWorkflow(project, input, "en");
    expect(a.drafts[0]?.title).toBe(b.drafts[0]?.title);
    expect(a.drafts[0]?.body).toBe(b.drafts[0]?.body);
  });
});
