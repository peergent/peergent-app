import { afterEach, describe, expect, it } from "vitest";
import {
  evaluateCampaignContextReadiness,
  strategyContextReady,
  essentialFieldLabel,
} from "@/lib/office/campaign/campaign-context-readiness";
import {
  CampaignIntelligenceOrchestrator,
  orchestrationPrimaryActionToCta,
} from "@/lib/office/campaign/campaign-intelligence-orchestrator";
import {
  capabilitiesInvalidatedByChange,
  mergeStepApprovals,
} from "@/lib/office/campaign/campaign-context-invalidation";
import { isInformationalWorkflowStep } from "@/lib/office/campaign/campaign-orchestration-types";
import { buildCampaignContext } from "@/lib/office/campaign/campaign-context";
import { buildCampaignWorkflowViewModel } from "@/lib/office/campaign/build-campaign-workflow";
import { evidencePrimaryActionLabel } from "@/lib/office/campaign/campaign-workflow-status";
import { evidenceBlocksWorkflowAdvance } from "@/lib/office/campaign/evidence-readiness";
import { executeWebsiteUnderstanding } from "@/lib/brain/capabilities/website-understanding";
import { buildCustomerSuppliedWebsiteSnapshot } from "@/lib/brain/website/build-customer-supplied-snapshot";
import { buildCompanySnapshot } from "@/lib/brain/company/snapshot-builder";
import { buildPeergentCompanyProfile } from "@/lib/brain/demo/peergent-company-profile";
import { selectBrainProvider } from "@/lib/brain/runtime/provider-selector";
import { createBrainRepositories } from "@/lib/brain/persistence/repository-factory";
import { createBrainRepositoriesForServer } from "@/lib/brain/persistence/repository-factory-server";
import { isBrainUseOpenAIEnabled } from "@/lib/brain/config/brain-feature-flags";
import type { MarketingProject } from "@/lib/peer-experience/marketing/projects/types";

const PEER = "emma";
const PROJECT_ID = "orch-live-1";

function liveProject(overrides?: Partial<MarketingProject>): MarketingProject {
  return {
    id: PROJECT_ID,
    peerId: PEER,
    title: "You Charge Launch",
    goal: "Leads",
    campaignType: "product_launch",
    createdAt: "2026-08-01T00:00:00.000Z",
    updatedAt: "2026-08-01T00:00:00.000Z",
    ownerLabel: "Pilot",
    rawRequest: "Meer demo-aanvragen voor You Charge.",
    origin: "campaign_wizard",
    campaignSetup: {
      description: "Meer demo-aanvragen voor You Charge met duidelijke propositie.",
      primaryGoalId: "generate_leads",
      targetAudience: "Ondernemers",
      setupMode: "automatic",
      approvalMode: "approval_before_publication",
    },
    ...overrides,
  };
}

function domainInput(project: MarketingProject) {
  return {
    projects: [project],
    drafts: [],
    workUnits: [],
    understanding: null,
  };
}

function essentialContext(project: MarketingProject) {
  return buildCampaignContext({
    project: {
      ...project,
      campaignSetup: {
        ...project.campaignSetup!,
        campaignBrandContext: {
          brandName: "You Charge",
          industry: "EV charging",
          productsAndServices: ["Laadoplossingen voor ondernemers"],
          uniqueSellingPoints: ["Snelle installatie"],
          targetAudience: "Ondernemers",
        },
        websiteUrl: "https://you-charge.nl",
        websiteSkipped: false,
        campaignCompetitors: [{ name: "ChargePoint" }],
        competitorsSkipped: false,
      },
    },
    domainInput: domainInput(project),
    locale: "nl",
  });
}

describe("campaign context readiness", () => {
  it("website supplied with no crawler does not block strategy", () => {
    const ctx = essentialContext(liveProject());
    const readiness = evaluateCampaignContextReadiness(ctx);
    expect(readiness.websiteSnapshotState).toBe("url_only");
    expect(readiness.websiteAnalysisState).toBe("unavailable_without_scan");
    expect(strategyContextReady(readiness)).toBe(true);
  });

  it("website skipped does not reappear as missing", () => {
    const project = liveProject({
      campaignSetup: {
        ...liveProject().campaignSetup!,
        websiteSkipped: true,
        competitorsSkipped: true,
        campaignBrandContext: {
          brandName: "You Charge",
          industry: "EV",
          productsAndServices: ["Laadoplossingen"],
          uniqueSellingPoints: ["Snel"],
          targetAudience: "Ondernemers",
        },
      },
    });
    const ctx = buildCampaignContext({ project, domainInput: domainInput(project), locale: "nl" });
    const readiness = evaluateCampaignContextReadiness(ctx);
    expect(readiness.websiteDecision).toBe("skipped");
    expect(readiness.websiteDecision).not.toBe("missing");
    expect(strategyContextReady(readiness)).toBe(true);
  });

  it("competitors skipped do not block strategy", () => {
    const project = liveProject({
      campaignSetup: {
        ...liveProject().campaignSetup!,
        websiteUrl: "https://you-charge.nl",
        competitorsSkipped: true,
        campaignBrandContext: {
          brandName: "You Charge",
          industry: "EV",
          productsAndServices: ["Laadoplossingen"],
          uniqueSellingPoints: ["Snel"],
          targetAudience: "Ondernemers",
        },
      },
    });
    const ctx = buildCampaignContext({ project, domainInput: domainInput(project), locale: "nl" });
    expect(strategyContextReady(evaluateCampaignContextReadiness(ctx))).toBe(true);
  });

  it("strategy remains blocked when essential context is missing", () => {
    const project = liveProject();
    const ctx = buildCampaignContext({ project, domainInput: domainInput(project), locale: "nl" });
    const readiness = evaluateCampaignContextReadiness(ctx);
    expect(readiness.essentialReady).toBe(false);
    expect(readiness.missingEssentialFields.length).toBeGreaterThan(0);
    expect(strategyContextReady(readiness)).toBe(false);
    expect(essentialFieldLabel("industry", true)).toMatch(/Branche/);
  });
});

describe("CampaignIntelligenceOrchestrator", () => {
  it("uses one central context CTA when essential fields missing", () => {
    const project = liveProject();
    const ctx = buildCampaignContext({ project, domainInput: domainInput(project), locale: "nl" });
    const state = CampaignIntelligenceOrchestrator.evaluate({
      project,
      campaignContext: ctx,
      locale: "nl",
    });
    expect(state.primaryAction.kind).toBe("add_context");
    expect(orchestrationPrimaryActionToCta(state.primaryAction).action).toBe("add_context");
  });

  it("business analysis is automatic — no manual gate in primary action", () => {
    const project = liveProject({
      campaignSetup: {
        ...liveProject().campaignSetup!,
        websiteUrl: "https://you-charge.nl",
        competitorsSkipped: true,
        campaignBrandContext: {
          brandName: "You Charge",
          industry: "EV",
          productsAndServices: ["Laadoplossingen voor ondernemers"],
          uniqueSellingPoints: ["Snelle installatie"],
          targetAudience: "Ondernemers",
        },
      },
    });
    const ctx = buildCampaignContext({ project, domainInput: domainInput(project), locale: "nl" });
    const state = CampaignIntelligenceOrchestrator.evaluate({
      project,
      campaignContext: ctx,
      locale: "nl",
    });
    expect(state.researchSteps.companyUnderstanding).toBe("completed");
    expect(state.primaryAction.kind).not.toBe("review_strategy");
  });

  it("strategy review cannot appear before successful output", () => {
    const project = liveProject({
      campaignSetup: {
        ...liveProject().campaignSetup!,
        websiteUrl: "https://you-charge.nl",
        competitorsSkipped: true,
        campaignBrandContext: {
          brandName: "You Charge",
          industry: "EV",
          productsAndServices: ["Laadoplossingen"],
          uniqueSellingPoints: ["Snel"],
          targetAudience: "Ondernemers",
        },
      },
    });
    const ctx = buildCampaignContext({ project, domainInput: domainInput(project), locale: "nl" });
    const state = CampaignIntelligenceOrchestrator.evaluate({
      project,
      campaignContext: ctx,
      locale: "nl",
      strategyOutputReady: false,
    });
    expect(state.primaryAction.kind).not.toBe("review_strategy");
  });

  it("shows non-button working status when context is ready but strategy output is missing", () => {
    const project = liveProject({
      campaignSetup: {
        ...liveProject().campaignSetup!,
        websiteUrl: "https://you-charge.nl",
        competitorsSkipped: true,
        campaignBrandContext: {
          brandName: "You Charge",
          industry: "EV",
          productsAndServices: ["Laadoplossingen"],
          uniqueSellingPoints: ["Snel"],
          targetAudience: "Ondernemers",
        },
      },
    });
    const ctx = buildCampaignContext({ project, domainInput: domainInput(project), locale: "nl" });
    const state = CampaignIntelligenceOrchestrator.evaluate({
      project,
      campaignContext: ctx,
      locale: "nl",
      strategyOutputReady: false,
    });
    expect(state.primaryAction.kind).toBe("strategy_working");
    expect(orchestrationPrimaryActionToCta(state.primaryAction).action).toBe("working");
  });

  it("shows review strategy when output exists", () => {
    const project = liveProject({
      campaignSetup: {
        ...liveProject().campaignSetup!,
        websiteUrl: "https://you-charge.nl",
        competitorsSkipped: true,
        strategyGeneratedAt: new Date().toISOString(),
        campaignBrandContext: {
          brandName: "You Charge",
          industry: "EV",
          productsAndServices: ["Laadoplossingen"],
          uniqueSellingPoints: ["Snel"],
          targetAudience: "Ondernemers",
        },
      },
    });
    const ctx = buildCampaignContext({ project, domainInput: domainInput(project), locale: "nl" });
    const state = CampaignIntelligenceOrchestrator.evaluate({
      project,
      campaignContext: ctx,
      locale: "nl",
      strategyOutputReady: true,
    });
    expect(state.primaryAction.kind).toBe("review_strategy");
  });

  it("channels remain locked until strategy approval", () => {
    const project = liveProject({
      campaignSetup: {
        ...liveProject().campaignSetup!,
        websiteUrl: "https://you-charge.nl",
        competitorsSkipped: true,
        strategyGeneratedAt: new Date().toISOString(),
        campaignBrandContext: {
          brandName: "You Charge",
          industry: "EV",
          productsAndServices: ["Laadoplossingen"],
          uniqueSellingPoints: ["Snel"],
          targetAudience: "Ondernemers",
        },
      },
    });
    const ctx = buildCampaignContext({ project, domainInput: domainInput(project), locale: "nl" });
    const state = CampaignIntelligenceOrchestrator.evaluate({
      project,
      campaignContext: ctx,
      locale: "nl",
      strategyOutputReady: true,
      stepApprovals: {},
    });
    const channelsState = CampaignIntelligenceOrchestrator.resolveWorkflowStepState(
      "channels_selected",
      state,
      {
        pendingDeliverableCount: 0,
        isCampaignScheduled: false,
        isCampaignPublished: false,
        hasDrafts: false,
      }
    );
    expect(channelsState).toBe("upcoming");
  });

  it("completed research steps do not reactivate without invalidation", () => {
    const project = liveProject({
      campaignSetup: {
        ...liveProject().campaignSetup!,
        websiteUrl: "https://you-charge.nl",
        competitorsSkipped: true,
        strategyGeneratedAt: new Date().toISOString(),
        campaignBrandContext: {
          brandName: "You Charge",
          industry: "EV",
          productsAndServices: ["Laadoplossingen"],
          uniqueSellingPoints: ["Snel"],
          targetAudience: "Ondernemers",
        },
      },
    });
    const ctx = buildCampaignContext({ project, domainInput: domainInput(project), locale: "nl" });
    const state = CampaignIntelligenceOrchestrator.evaluate({
      project,
      campaignContext: ctx,
      locale: "nl",
      strategyOutputReady: true,
      stepApprovals: { strategy_determined: "approved" },
    });
    expect(
      CampaignIntelligenceOrchestrator.resolveWorkflowStepState("website_analyzed", state, {
        pendingDeliverableCount: 0,
        isCampaignScheduled: false,
        isCampaignPublished: false,
        hasDrafts: false,
      })
    ).toBe("done");
    expect(state.activeCustomerStepId).not.toBe("website_analyzed");
  });
});

describe("context invalidation", () => {
  it("changed website invalidates strategy dependents", () => {
    const affected = capabilitiesInvalidatedByChange("website");
    expect(affected).toContain("website_understanding");
    expect(affected).toContain("strategy");
    expect(affected).toContain("channel_planning");
  });

  it("changed competitors invalidates strategy dependents", () => {
    const affected = capabilitiesInvalidatedByChange("competitors");
    expect(affected).toContain("competitor_understanding");
    expect(affected).toContain("strategy");
  });

  it("mergeStepApprovals clears pending approvals", () => {
    const merged = mergeStepApprovals(
      { strategy_determined: "approved" },
      { strategy_determined: "pending" }
    );
    expect(merged.strategy_determined).toBeUndefined();
  });
});

describe("informational evidence steps", () => {
  it("business, website and competitor evidence have no progression CTA labels", () => {
    expect(evidencePrimaryActionLabel("business_analyzed", "semi_automatic", true)).toBe("Sluiten");
    expect(evidencePrimaryActionLabel("website_analyzed", "semi_automatic", true)).toBe("Sluiten");
    expect(evidencePrimaryActionLabel("competitors_analyzed", "semi_automatic", true)).toBe("Sluiten");
  });

  it("informational steps are flagged correctly", () => {
    expect(isInformationalWorkflowStep("business_analyzed")).toBe(true);
    expect(isInformationalWorkflowStep("strategy_determined")).toBe(false);
  });
});

describe("website url_only understanding", () => {
  it("does not emit internal snapshot-unavailable copy", () => {
    const profile = buildPeergentCompanyProfile("nl");
    const built = buildCompanySnapshot({
      organizationId: "org-test",
      companyProfile: profile,
      websiteSnapshot: buildCustomerSuppliedWebsiteSnapshot({
        organizationId: "org-test",
        url: "https://you-charge.nl",
        companyName: "You Charge",
      }),
    });
    const output = executeWebsiteUnderstanding({
      companySnapshot: built.snapshot,
      locale: "nl",
    });
    expect(output.warnings.some((w) => w.code === "website_url_only")).toBe(true);
    expect(output.warnings[0]?.message).not.toMatch(/website-snapshot/i);
    expect(output.warnings[0]?.message).toMatch(/volledige websiteanalyse/i);
    expect(evidenceBlocksWorkflowAdvance([{ id: "source", title: "x", items: ["y"] }])).toBe(
      false
    );
  });
});

describe("LLM provider selection", () => {
  const original = process.env.BRAIN_USE_OPENAI;

  afterEach(() => {
    if (original === undefined) delete process.env.BRAIN_USE_OPENAI;
    else process.env.BRAIN_USE_OPENAI = original;
  });

  it("registers llm provider on server factory when flag enabled", () => {
    process.env.BRAIN_USE_OPENAI = "true";
    const bundle = createBrainRepositoriesForServer({ environment: "live" });
    expect(bundle.providers.some((p) => p.id === "llm")).toBe(true);
    const selected = selectBrainProvider({
      environment: "live",
      capabilityId: "strategy",
      providers: bundle.providers,
    });
    expect(selected.provider.id).toBe("llm");
  });

  it("uses deterministic path when flag disabled", () => {
    process.env.BRAIN_USE_OPENAI = "false";
    expect(isBrainUseOpenAIEnabled()).toBe(false);
    const bundle = createBrainRepositoriesForServer({ environment: "live" });
    const llm = bundle.providers.find((p) => p.id === "llm");
    expect(llm).toBeUndefined();
    const selected = selectBrainProvider({
      environment: "live",
      capabilityId: "strategy",
      providers: bundle.providers,
    });
    expect(selected.provider.id).not.toBe("llm");
  });

  it("client-safe factory never registers llm even when flag enabled", () => {
    process.env.BRAIN_USE_OPENAI = "true";
    const bundle = createBrainRepositories({ environment: "live" });
    expect(bundle.providers.some((p) => p.id === "llm")).toBe(false);
  });
});

describe("live workflow integration", () => {
  it("live campaign with full context resolves without website loop", () => {
    const project = liveProject({
      campaignSetup: {
        ...liveProject().campaignSetup!,
        websiteUrl: "https://you-charge.nl",
        campaignCompetitors: [{ name: "ChargePoint" }],
        campaignBrandContext: {
          brandName: "You Charge",
          industry: "EV",
          productsAndServices: ["Laadoplossingen voor ondernemers"],
          uniqueSellingPoints: ["Snelle installatie"],
          targetAudience: "Ondernemers",
        },
      },
    });
    const workflow = buildCampaignWorkflowViewModel({
      peerId: PEER,
      project,
      domainInput: domainInput(project),
      locale: "nl",
      isDemo: false,
    });
    const websiteStep = workflow.steps.find((s) => s.id === "website_analyzed");
    const businessStep = workflow.steps.find((s) => s.id === "business_analyzed");
    expect(websiteStep?.state).toBe("done");
    expect(businessStep?.state).toBe("done");
    expect(
      workflow.nextStepCta.label.toLowerCase().includes("strategie") ||
        workflow.nextStepCta.action === "add_context" ||
        workflow.nextStepCta.label.includes("Emma")
    ).toBe(true);
  });
});
