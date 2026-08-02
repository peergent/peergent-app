import { beforeEach, describe, expect, it } from "vitest";
import {
  buildCampaignContextFromCreateInput,
  containsInstallerLeak,
  INSTALLER_LEAK_TERMS,
} from "@/lib/office/campaign/campaign-context";
import { buildCampaignStepEvidence, buildCompetitorMissingPrompt, buildWebsiteMissingPrompt } from "@/lib/office/campaign/build-campaign-workflow-evidence";
import { buildContentDetailViewModel } from "@/lib/office/content/build-content-detail";
import { buildCampaignWorkflowViewModel } from "@/lib/office/campaign/build-campaign-workflow";
import { optimizationBehaviorCopy } from "@/lib/office/campaign/campaign-optimization";
import { evidenceApprovalRequired } from "@/lib/office/deliverable/deliverable-cta-labels";
import { deliverablePreviewCtaLabel } from "@/lib/office/deliverable/deliverable-cta-labels";
import {
  addDemoCompetitors,
  addDemoWebsiteUrl,
  getDemoCampaignSnapshot,
  resetDemoCampaignStore,
  skipDemoCompetitorAnalysis,
  skipDemoWebsiteAnalysis,
  createDemoCampaign,
} from "@/lib/office/demo/demo-campaign-store";
import { simulateDemoCampaignWorkflow } from "@/lib/office/demo/demo-workflow-simulation";
import { createMarketingCampaignProject } from "@/lib/peer-experience/marketing/projects/project-engine";
import { buildDemoDomainInput } from "@/lib/office/demo/demo-company";
import { mergeDemoCampaignSnapshot } from "@/lib/office/demo/merge-demo-domain";

describe("Emma experience UX regressions", () => {
  const peergentInput = {
    peerId: "demo" as const,
    ownerLabel: "Emma",
    name: "Peergent",
    goalLabel: "Demo-aanvragen",
    description:
      "Meer demo-aanvragen bij ondernemers met 1–20 medewerkers die tijd willen besparen met AI-collega's.",
    primaryGoalId: "generate_leads" as const,
    targetAudience: "Ondernemers met 1 tot 20 werknemers",
    setupMode: "automatic" as const,
    approvalMode: "approval_before_publication" as const,
  };

  beforeEach(() => {
    resetDemoCampaignStore();
  });

  it("persists website URL into CampaignContext with supplied_by_customer", () => {
    const project = createDemoCampaign("demo", peergentInput, "nl");
    addDemoWebsiteUrl("demo", project.id, "https://peergent.com");
    const ctx = getDemoCampaignSnapshot().campaignContexts[project.id]!;
    expect(ctx.websiteUrl).toBe("https://peergent.com");
    expect(ctx.websiteSource).toBe("supplied_by_customer");
    expect(ctx.websiteState).toBe("simulated_analysis_complete");
  });

  it("keeps website missing and skipped distinct", () => {
    const project = createDemoCampaign("demo", peergentInput, "nl");
    const missing = getDemoCampaignSnapshot().campaignContexts[project.id]!;
    expect(missing.websiteState).toBe("missing");
    skipDemoWebsiteAnalysis("demo", project.id);
    const skipped = getDemoCampaignSnapshot().campaignContexts[project.id]!;
    expect(skipped.websiteState).toBe("skipped");
    expect(skipped.websiteSource).toBe("skipped");
  });

  it("persists explicit competitors and never invents names", () => {
    const project = createDemoCampaign("demo", peergentInput, "nl");
    addDemoCompetitors("demo", project.id, [
      { name: "Concurrent A", url: "https://a.example" },
      { name: "Concurrent B" },
    ]);
    const ctx = getDemoCampaignSnapshot().campaignContexts[project.id]!;
    expect(ctx.competitors.map((c) => c.name)).toEqual(["Concurrent A", "Concurrent B"]);
    const domain = mergeDemoCampaignSnapshot(buildDemoDomainInput({ locale: "nl" }), getDemoCampaignSnapshot());
    const evidence = buildCampaignStepEvidence({
      stepId: "competitors_analyzed",
      project,
      domainInput: domain,
      locale: "nl",
    });
    const text = evidence?.sections.flatMap((s) => s.items).join(" ") ?? "";
    expect(text).toContain("Concurrent A");
    expect(text).not.toContain("Routeplan");
  });

  it("renders evidence intro on workflow steps", () => {
    const project = createMarketingCampaignProject(peergentInput);
    let domain = buildDemoDomainInput({ locale: "nl" });
    const ctx = buildCampaignContextFromCreateInput(project, peergentInput, "nl");
    domain = {
      ...domain,
      demoCampaignContexts: {
        [project.id]: {
          ...ctx,
          websiteUrl: "https://peergent.com",
          websiteSource: "supplied_by_customer",
          websiteState: "simulated_analysis_complete",
        },
      },
    };
    const evidence = buildCampaignStepEvidence({
      stepId: "website_analyzed",
      project,
      domainInput: domain,
      locale: "nl",
    });
    expect(evidence?.intro).toContain("peergent.com");
    expect(evidence?.intro?.toLowerCase()).toContain("geen echte websitecrawl");
    const workflow = buildCampaignWorkflowViewModel({
      peerId: "demo",
      project,
      domainInput: domain,
      locale: "nl",
      isDemo: true,
    });
    const websiteStep = workflow.steps.find((s) => s.id === "website_analyzed");
    expect(websiteStep?.evidenceIntro).toBeTruthy();
  });

  it("differs approval gates by execution mode", () => {
    expect(evidenceApprovalRequired("strategy_determined", "fully_automatic")).toBe(false);
    expect(evidenceApprovalRequired("strategy_determined", "manual")).toBe(true);
    expect(evidenceApprovalRequired("channels_selected", "semi_automatic")).toBe(false);
    expect(evidenceApprovalRequired("deliverables_created", "semi_automatic")).toBe(true);
  });

  it("fully automatic pre-approves strategy channels and deliverables", () => {
    const fullyAutoInput = { ...peergentInput, approvalMode: "no_approval_required" as const };
    const project = createMarketingCampaignProject(fullyAutoInput);
    const bundle = simulateDemoCampaignWorkflow(project, fullyAutoInput, "nl");
    expect(bundle.stepApprovals.strategy_determined).toBe("approved");
    expect(bundle.stepApprovals.channels_selected).toBe("approved");
    expect(bundle.stepApprovals.waiting_for_approval).toBe("approved");
    expect(bundle.drafts.every((d) => d.status === "approved")).toBe(true);
  });

  it("manual mode preserves selected channels in context", () => {
    const manualInput = {
      ...peergentInput,
      setupMode: "manual" as const,
      approvalMode: "approval_before_generation" as const,
      selectedChannels: ["linkedin", "email"] as const,
      selectedDeliverables: ["social_post", "email"] as const,
    };
    const project = createMarketingCampaignProject(manualInput);
    const ctx = buildCampaignContextFromCreateInput(project, manualInput, "nl");
    expect(ctx.selectedChannels).toEqual(["linkedin", "email"]);
    expect(ctx.executionMode).toBe("manual");
  });

  it("formats content dates without raw ISO in labels", () => {
    const project = createDemoCampaign("demo", peergentInput, "nl");
    const domain = mergeDemoCampaignSnapshot(buildDemoDomainInput({ locale: "nl" }), getDemoCampaignSnapshot());
    const draftId = domain.drafts.find((d) => d.planActivityReference?.includes(project.id.replace("camp-", "")))?.id;
    if (!draftId) return;
    const model = buildContentDetailViewModel({
      peerId: "demo",
      contentId: draftId,
      domainInput: domain,
      locale: "nl",
    });
    if (model?.approvalHistory.length) {
      expect(model.approvalHistory[0]?.atLabel).not.toMatch(/T\d{2}:\d{2}:\d{2}/);
    }
  });

  it("selects channel-specific preview CTA labels", () => {
    expect(deliverablePreviewCtaLabel("linkedin", true)).toBe("Bekijk LinkedIn-post");
    expect(deliverablePreviewCtaLabel("email", true)).toBe("Bekijk acquisitie-e-mail");
    expect(deliverablePreviewCtaLabel("website_landing", true)).toBe("Bekijk landingspagina");
  });

  it("optimization copy changes by execution mode", () => {
    expect(optimizationBehaviorCopy("manual", true)).toContain("zou aanpassen");
    expect(optimizationBehaviorCopy("semi_automatic", true)).toContain("akkoord");
    expect(optimizationBehaviorCopy("fully_automatic", true)).toContain("automatisch");
  });

  it("website and competitor prompts use customer-facing copy", () => {
    const project = createMarketingCampaignProject(peergentInput);
    const ctx = buildCampaignContextFromCreateInput(project, peergentInput, "nl");
    expect(buildWebsiteMissingPrompt(ctx, true).message).toContain("website begrijpen");
    expect(buildCompetitorMissingPrompt(ctx, true).message).toContain("concurrenten");
  });

  it("no installer fixture leakage after demo reset and custom campaign", () => {
    const project = createDemoCampaign("demo", peergentInput, "nl");
    addDemoWebsiteUrl("demo", project.id, "https://peergent.com");
    skipDemoCompetitorAnalysis("demo", project.id);
    const sim = getDemoCampaignSnapshot().simulations[project.id];
    const allDraftText = (sim?.drafts ?? []).map((d) => `${d.title} ${d.body}`).join(" ");
    for (const term of INSTALLER_LEAK_TERMS) {
      expect(allDraftText.toLowerCase()).not.toContain(term.toLowerCase());
    }
    expect(containsInstallerLeak(allDraftText)).toBe(false);
    expect(allDraftText.toLowerCase()).toContain("peergent");
  });
});
