import { beforeEach, describe, expect, it } from "vitest";
import { buildCampaignDetailViewModel } from "@/lib/office/campaign/build-campaign-detail";
import { buildCampaignStepEvidence } from "@/lib/office/campaign/build-campaign-workflow-evidence";
import { buildCampaignWorkflowViewModel } from "@/lib/office/campaign/build-campaign-workflow";
import {
  EMMA_PLAN_STEPS_NL,
  buildStructuredStrategyEvidence,
} from "@/lib/office/campaign/build-structured-strategy-evidence";
import {
  evidencePrimaryActionLabel,
  workflowBasedStatusLabel,
} from "@/lib/office/campaign/campaign-workflow-status";
import { buildCampaignContextFromCreateInput } from "@/lib/office/campaign/campaign-context";
import { evidenceApprovalRequired } from "@/lib/office/deliverable/deliverable-cta-labels";
import {
  addDemoWebsiteUrl,
  createDemoCampaign,
  getDemoCampaignSnapshot,
  resetDemoCampaignStore,
  setDemoStepApproval,
  skipDemoCompetitorAnalysis,
  skipDemoWebsiteAnalysis,
} from "@/lib/office/demo/demo-campaign-store";
import { buildDemoDomainInput } from "@/lib/office/demo/demo-company";
import { mergeDemoCampaignSnapshot } from "@/lib/office/demo/merge-demo-domain";
import { createMarketingCampaignProject } from "@/lib/peer-experience/marketing/projects/project-engine";

describe("Emma interaction pass", () => {
  const peergentInput = {
    peerId: "demo" as const,
    ownerLabel: "Emma",
    name: "peergent launch",
    goalLabel: "Demo-aanvragen",
    description:
      "Meer demo-aanvragen bij ondernemers met 1–20 medewerkers die tijd willen besparen met digitale AI-collega's.",
    primaryGoalId: "generate_leads" as const,
    targetAudience: "Ondernemers met 1 tot 20 werknemers",
    setupMode: "automatic" as const,
    approvalMode: "approval_before_publication" as const,
  };

  beforeEach(() => {
    resetDemoCampaignStore();
  });

  it("exposes Emma plan steps in correct order", () => {
    expect(EMMA_PLAN_STEPS_NL).toEqual([
      "Je bedrijf begrijpen",
      "Website bekijken",
      "Markt en concurrenten onderzoeken",
      "Strategie voorstellen",
      "Kanalen kiezen",
      "Campagneonderdelen maken",
      "Alles klaarzetten",
    ]);
    const project = createDemoCampaign("demo", peergentInput, "nl");
    const domain = mergeDemoCampaignSnapshot(buildDemoDomainInput({ locale: "nl" }), getDemoCampaignSnapshot());
    const model = buildCampaignDetailViewModel({
      peerId: "demo",
      projectId: project.id,
      domainInput: domain,
      locale: "nl",
      isDemo: true,
    });
    expect(model?.emmaPlanSteps).toEqual(EMMA_PLAN_STEPS_NL);
    expect(model?.emmaOpeningLine).toBe("Ik ga deze campagne voor je opbouwen.");
  });

  it("strategy evidence sections are semantically distinct without duplicate goal strings", () => {
    const project = createMarketingCampaignProject(peergentInput);
    const ctx = buildCampaignContextFromCreateInput(project, peergentInput, "nl");
    const evidence = buildStructuredStrategyEvidence(ctx, true);
    const allItems = evidence.sections.flatMap((s) => s.items);
    const normalized = allItems.map((t) => t.toLowerCase().trim());
    const unique = new Set(normalized);
    expect(unique.size).toBe(normalized.length);
    expect(allItems.join(" ").toLowerCase()).not.toContain("aangepast doel");
    const goalSection = evidence.sections.find((s) => s.id === "campaign_goals");
    const approachSection = evidence.sections.find((s) => s.id === "approach");
    const messageSection = evidence.sections.find((s) => s.id === "core_message");
    expect(goalSection?.items[0]).not.toEqual(approachSection?.items[0]);
    expect(messageSection?.items[0]).not.toEqual(approachSection?.items[0]);
    expect(allItems.some((t) => t.includes("demo-aanvr"))).toBe(true);
    expect(allItems.some((t) => t.includes("1 tot 20") || t.includes("1–20"))).toBe(true);
  });

  it("supplied URL is not represented as a real crawl", () => {
    const project = createDemoCampaign("demo", peergentInput, "nl");
    addDemoWebsiteUrl("demo", project.id, "https://you-charge.nl");
    skipDemoCompetitorAnalysis("demo", project.id);
    const domain = mergeDemoCampaignSnapshot(buildDemoDomainInput({ locale: "nl" }), getDemoCampaignSnapshot());
    const websiteEvidence = buildCampaignStepEvidence({
      stepId: "website_analyzed",
      project,
      domainInput: domain,
      locale: "nl",
    });
    const text = `${websiteEvidence?.intro ?? ""} ${websiteEvidence?.sections.flatMap((s) => s.items).join(" ")}`;
    expect(text).toContain("https://you-charge.nl");
    expect(text.toLowerCase()).not.toContain("homepage benadrukt");
  });

  it("approval marks strategy approved and activates channels step", () => {
    const project = createDemoCampaign("demo", peergentInput, "nl");
    addDemoWebsiteUrl("demo", project.id, "https://you-charge.nl");
    skipDemoCompetitorAnalysis("demo", project.id);

    let domain = mergeDemoCampaignSnapshot(buildDemoDomainInput({ locale: "nl" }), getDemoCampaignSnapshot());
    let workflow = buildCampaignWorkflowViewModel({
      peerId: "demo",
      project,
      domainInput: domain,
      locale: "nl",
      isDemo: true,
    });
    expect(workflow.steps.find((s) => s.id === "strategy_determined")?.state).toBe("active");

    setDemoStepApproval("demo", project.id, "strategy_determined", "approved");
    domain = mergeDemoCampaignSnapshot(buildDemoDomainInput({ locale: "nl" }), getDemoCampaignSnapshot());
    workflow = buildCampaignWorkflowViewModel({
      peerId: "demo",
      project,
      domainInput: domain,
      locale: "nl",
      isDemo: true,
    });
    expect(workflow.steps.find((s) => s.id === "strategy_determined")?.state).toBe("done");
    expect(workflow.steps.find((s) => s.id === "channels_selected")?.state).toBe("active");
    expect(workflow.steps.find((s) => s.id === "channels_selected")?.hasEvidence).toBe(true);
  });

  it("campaign status matches active workflow step instead of in_production", () => {
    const project = createDemoCampaign("demo", peergentInput, "nl");
    addDemoWebsiteUrl("demo", project.id, "https://you-charge.nl");
    skipDemoCompetitorAnalysis("demo", project.id);
    const domain = mergeDemoCampaignSnapshot(buildDemoDomainInput({ locale: "nl" }), getDemoCampaignSnapshot());
    const model = buildCampaignDetailViewModel({
      peerId: "demo",
      projectId: project.id,
      domainInput: domain,
      locale: "nl",
      isDemo: true,
    });
    expect(model?.statusLabel).not.toBe("In productie");
    expect(model?.statusLabel).toMatch(/strategie|context|kanaal/i);
  });

  it("manual mode requires strategy approval; fully automatic does not", () => {
    expect(evidenceApprovalRequired("strategy_determined", "manual")).toBe(true);
    expect(evidenceApprovalRequired("strategy_determined", "fully_automatic")).toBe(false);
    expect(evidencePrimaryActionLabel("strategy_determined", "manual", true)).toBe(
      "Strategie goedkeuren"
    );
    expect(evidencePrimaryActionLabel("strategy_determined", "semi_automatic", true)).toBe(
      "Verder naar kanaalkeuze"
    );
  });

  it("workflow status label reflects strategy approval gate in manual mode", () => {
    const manualInput = {
      ...peergentInput,
      setupMode: "manual" as const,
      approvalMode: "approval_before_generation" as const,
    };
    const project = createDemoCampaign("demo", manualInput, "nl");
    addDemoWebsiteUrl("demo", project.id, "https://you-charge.nl");
    skipDemoCompetitorAnalysis("demo", project.id);
    const ctx = getDemoCampaignSnapshot().campaignContexts[project.id]!;
    const label = workflowBasedStatusLabel({
      activeStepId: "strategy_determined",
      campaignContext: ctx,
      executionMode: "manual",
      pendingApprovalCount: 0,
      locale: "nl",
    });
    expect(label).toBe("Wacht op jouw strategie-akkoord");
  });

  it("skipped website step shows Overgeslagen state", () => {
    const project = createDemoCampaign("demo", peergentInput, "nl");
    skipDemoWebsiteAnalysis("demo", project.id);
    const domain = mergeDemoCampaignSnapshot(buildDemoDomainInput({ locale: "nl" }), getDemoCampaignSnapshot());
    const workflow = buildCampaignWorkflowViewModel({
      peerId: "demo",
      project,
      domainInput: domain,
      locale: "nl",
      isDemo: true,
    });
    const websiteStep = workflow.steps.find((s) => s.id === "website_analyzed");
    expect(websiteStep?.state).toBe("skipped");
    expect(websiteStep?.statusHint).toBe("Overgeslagen");
  });
});
