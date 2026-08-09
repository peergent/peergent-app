import { describe, expect, it } from "vitest";
import { buildDemoCampaignBrainOutput, buildDemoWorkspaceBrainOutput } from "@/lib/brain/output/demo/demo-brain-output";
import { resolveBrainPresentationContext } from "@/lib/brain/output/presentation-context";
import { mapCampaignExperienceFromBrain } from "@/lib/office/brain-output/map-campaign-experience";
import { mapWorkspaceSlicesFromBrain } from "@/lib/office/brain-output/map-workspace-slices";
import { buildCampaignContext } from "@/lib/office/campaign/campaign-context";
import { buildDemoDomainInput } from "@/lib/office/demo/demo-company";

describe("Brain Output Layer", () => {
  it("demo campaign output includes executive discoveries not campaign field summaries", () => {
    const domainInput = buildDemoDomainInput({ locale: "en" });
    const project = domainInput.projects[0]!;
    const ctx = {
      ...resolveBrainPresentationContext({ peerId: "demo", locale: "en", isDemo: true }),
      project,
      domainInput,
      campaignContext: buildCampaignContext({ project, domainInput, locale: "en" }),
    };

    const brain = buildDemoCampaignBrainOutput({
      ctx,
      statusLabel: "In review",
      workflowSteps: [],
    });

    expect(brain.executiveSummary.whatWeDiscovered).toMatch(/8 competitors/i);
    expect(brain.progress.steps.some((s) => s.narrative.includes("competitors"))).toBe(true);
    expect(brain.recommendations[0]?.confidence.label).toBeTruthy();
    expect(brain.recommendations[0]?.whyNow).toBeTruthy();
  });

  it("maps campaign brain output to experience slices without UI schema leakage", () => {
    const domainInput = buildDemoDomainInput({ locale: "en" });
    const project = domainInput.projects[0]!;
    const ctx = {
      ...resolveBrainPresentationContext({ peerId: "demo", locale: "en", isDemo: true }),
      project,
      domainInput,
      campaignContext: buildCampaignContext({ project, domainInput, locale: "en" }),
    };

    const brain = buildDemoCampaignBrainOutput({
      ctx,
      statusLabel: "In review",
      workflowSteps: [],
    });

    const slices = mapCampaignExperienceFromBrain({ brain, nl: false });
    expect(slices.brief.narrative.length).toBeGreaterThan(40);
    expect(slices.brief.sections.executiveSummary).toMatch(/competitors/i);
    expect(slices.progress.steps.length).toBeGreaterThan(0);
    expect(slices.activity.length).toBeGreaterThan(0);
  });

  it("demo workspace output powers BI bullets and activity", () => {
    const ctx = resolveBrainPresentationContext({ peerId: "demo", locale: "en", isDemo: true });
    const brain = buildDemoWorkspaceBrainOutput(ctx);
    const slices = mapWorkspaceSlicesFromBrain({
      brain,
      nl: false,
      performanceHref: "/office/demo/performance",
    });

    expect(slices.defaultBiBullets.length).toBeGreaterThan(3);
    expect(slices.defaultBiBullets.some((b) => b.tone === "recommendation")).toBe(true);
    expect(slices.activity.items[0]?.title.length).toBeGreaterThan(0);
    expect(slices.recommendation?.headline).toBeTruthy();
  });

  it("never surfaces forbidden workflow vocabulary in customer copy", () => {
    const domainInput = buildDemoDomainInput({ locale: "en" });
    const project = domainInput.projects[0]!;
    const ctx = {
      ...resolveBrainPresentationContext({ peerId: "demo", locale: "en", isDemo: true }),
      project,
      domainInput,
      campaignContext: buildCampaignContext({ project, domainInput, locale: "en" }),
    };

    const brain = buildDemoCampaignBrainOutput({
      ctx,
      statusLabel: "In review",
      workflowSteps: [],
    });

    const corpus = JSON.stringify(brain);
    expect(corpus.toLowerCase()).not.toMatch(/\blanggraph\b|\bprompt\b|\bworkflow node\b/);
  });
});
