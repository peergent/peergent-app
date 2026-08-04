import { describe, expect, it } from "vitest";
import { buildCompanySnapshot } from "@/lib/brain/company/snapshot-builder";
import { evaluateReadinessGate } from "@/lib/brain/runtime/readiness-gate";
import { buildCampaignContext } from "@/lib/office/campaign/campaign-context";
import {
  evaluateCampaignContextReadiness,
  strategyContextReady,
} from "@/lib/office/campaign/campaign-context-readiness";
import {
  evaluateStrategyContextReadiness,
  strategyContextReadyFromContract,
} from "@/lib/office/campaign/strategy-context-readiness";
import { isDevDiagnosticsVisible } from "@/features/office/campaign/CampaignStrategyDevDiagnostics";
import type { MarketingProject } from "@/lib/peer-experience/marketing/projects/types";

const PEER = "emma";
const PROJECT_ID = "strategy-readiness-live-1";

function youChargeProject(overrides?: Partial<MarketingProject>): MarketingProject {
  return {
    id: PROJECT_ID,
    peerId: PEER,
    title: "You Charge Launch",
    goal: "Leads",
    campaignType: "product_launch",
    createdAt: "2026-08-01T00:00:00.000Z",
    updatedAt: "2026-08-01T00:00:00.000Z",
    ownerLabel: "Pilot",
    rawRequest: "Meer demo-aanvragen voor You Charge met duidelijke propositie.",
    origin: "campaign_wizard",
    campaignSetup: {
      description: "Meer demo-aanvragen voor You Charge met duidelijke propositie.",
      primaryGoalId: "generate_leads",
      targetAudience: "Ondernemers",
      setupMode: "automatic",
      approvalMode: "approval_before_publication",
      websiteUrl: "https://you-charge.nl",
      campaignCompetitors: [{ name: "ChargePoint" }],
      campaignBrandContext: {
        brandName: "You Charge",
        industry: "EV charging",
        productsAndServices: ["Laadoplossingen voor ondernemers"],
        uniqueSellingPoints: ["Snelle installatie"],
        targetAudience: "Ondernemers",
      },
    },
    ...overrides,
  };
}

function domainInput(project: MarketingProject) {
  return {
    peerId: PEER,
    userName: "Pilot",
    peerName: "Emma",
    campaignTitle: project.title,
    projects: [project],
    drafts: [],
    workUnits: [],
    understanding: null,
    responsibilities: [],
    automations: [],
    profileCounts: { campaigns: 1, drafts: 0, workUnits: 0 },
    storedMetrics: null,
    insightRotation: null,
    approvalOverlays: {},
  };
}

describe("evaluateStrategyContextReadiness contract", () => {
  it("marks You Charge campaign ready with url_only website and supplied competitors", () => {
    const project = youChargeProject();
    const ctx = buildCampaignContext({ project, domainInput: domainInput(project), locale: "nl" });
    const readiness = evaluateStrategyContextReadiness(ctx);
    expect(readiness.ready).toBe(true);
    expect(readiness.missingEssentialFields).toEqual([]);
    expect(readiness.optionalContextStates.websiteDecision).toBe("supplied");
    expect(readiness.optionalContextStates.websiteSnapshotState).toBe("url_only");
    expect(readiness.optionalContextStates.competitorDecision).toBe("supplied");
  });

  it("orchestrator ready implies Brain strategy gate ready", () => {
    const project = youChargeProject();
    const ctx = buildCampaignContext({ project, domainInput: domainInput(project), locale: "nl" });
    const orchestratorReady = strategyContextReady(evaluateCampaignContextReadiness(ctx));
    const gate = evaluateReadinessGate({
      capabilityId: "strategy",
      overallScore: 20,
      dimensionScores: {
        company_profile: 60,
        website: 0,
        brand: 0,
        business: 0,
        corrections: 0,
      },
      missingCriticalFields: ["goals", "targetAudiences"],
      assemblyState: "needs_information",
      campaignContext: ctx,
    });
    expect(orchestratorReady).toBe(true);
    expect(gate.ok).toBe(true);
  });

  it("missing USP blocks both orchestrator and Brain gate", () => {
    const project = youChargeProject({
      campaignSetup: {
        ...youChargeProject().campaignSetup!,
        campaignBrandContext: {
          ...youChargeProject().campaignSetup!.campaignBrandContext!,
          uniqueSellingPoints: [],
        },
      },
    });
    const ctx = buildCampaignContext({ project, domainInput: domainInput(project), locale: "nl" });
    const readiness = evaluateStrategyContextReadiness(ctx);
    const gate = evaluateReadinessGate({
      capabilityId: "strategy",
      overallScore: 90,
      dimensionScores: {
        company_profile: 100,
        website: 100,
        brand: 100,
        business: 100,
        corrections: 0,
      },
      missingCriticalFields: [],
      assemblyState: "ready",
      campaignContext: ctx,
    });
    expect(readiness.ready).toBe(false);
    expect(strategyContextReadyFromContract(ctx)).toBe(false);
    expect(gate.ok).toBe(false);
    expect(readiness.missingEssentialFields).toContain("uniqueValueProposition");
  });

  it("missing industry blocks both orchestrator and Brain gate", () => {
    const project = youChargeProject({
      campaignSetup: {
        ...youChargeProject().campaignSetup!,
        campaignBrandContext: {
          ...youChargeProject().campaignSetup!.campaignBrandContext!,
          industry: "",
        },
      },
    });
    const ctx = buildCampaignContext({ project, domainInput: domainInput(project), locale: "nl" });
    expect(evaluateStrategyContextReadiness(ctx).ready).toBe(false);
    expect(
      evaluateReadinessGate({
        capabilityId: "strategy",
        overallScore: 90,
        dimensionScores: {
          company_profile: 100,
          website: 100,
          brand: 100,
          business: 100,
          corrections: 0,
        },
        missingCriticalFields: [],
        assemblyState: "ready",
        campaignContext: ctx,
      }).ok
    ).toBe(false);
  });

  it("website skipped does not block strategy readiness", () => {
    const project = youChargeProject({
      campaignSetup: {
        ...youChargeProject().campaignSetup!,
        websiteSkipped: true,
        websiteUrl: undefined,
      },
    });
    const ctx = buildCampaignContext({ project, domainInput: domainInput(project), locale: "nl" });
    const readiness = evaluateStrategyContextReadiness(ctx);
    expect(readiness.ready).toBe(true);
    expect(readiness.optionalContextStates.websiteDecision).toBe("skipped");
  });

  it("competitors skipped do not block strategy readiness", () => {
    const project = youChargeProject({
      campaignSetup: {
        ...youChargeProject().campaignSetup!,
        competitorsSkipped: true,
        campaignCompetitors: [],
      },
    });
    const ctx = buildCampaignContext({ project, domainInput: domainInput(project), locale: "nl" });
    const readiness = evaluateStrategyContextReadiness(ctx);
    expect(readiness.ready).toBe(true);
    expect(readiness.optionalContextStates.competitorDecision).toBe("skipped");
  });

  it("maps campaign goals and competitors into company snapshot for Brain", () => {
    const project = youChargeProject();
    const ctx = buildCampaignContext({ project, domainInput: domainInput(project), locale: "nl" });
    const { snapshot } = buildCompanySnapshot({
      organizationId: PEER,
      marketingUnderstanding: null,
      campaignContext: ctx,
    });
    expect(snapshot.profile.goals.value?.length).toBeGreaterThan(0);
    expect(snapshot.profile.goals.value?.some((g) => g.includes("Leads"))).toBe(true);
    expect(snapshot.profile.mainCompetitors.value).toContain("ChargePoint");
    expect(snapshot.profile.targetAudiences.value).toContain("Ondernemers");
    expect(snapshot.profile.products.value).toContain("Laadoplossingen voor ondernemers");
    expect(snapshot.profile.uniqueSellingPoints.value).toContain("Snelle installatie");
    expect(snapshot.profile.companyName.value).toBe("You Charge");
  });

  it("does not enqueue when canonical readiness is false", () => {
    const project = youChargeProject({
      campaignSetup: {
        ...youChargeProject().campaignSetup!,
        campaignBrandContext: {
          ...youChargeProject().campaignSetup!.campaignBrandContext!,
          industry: "",
        },
      },
    });
    const ctx = buildCampaignContext({ project, domainInput: domainInput(project), locale: "nl" });
    expect(strategyContextReadyFromContract(ctx)).toBe(false);
  });

  it("lists localized missing fields in customer-safe message", () => {
    const project = youChargeProject({
      campaignSetup: {
        ...youChargeProject().campaignSetup!,
        campaignBrandContext: {
          ...youChargeProject().campaignSetup!.campaignBrandContext!,
          industry: "",
          uniqueSellingPoints: [],
        },
      },
    });
    const ctx = buildCampaignContext({ project, domainInput: domainInput(project), locale: "nl" });
    const message = evaluateStrategyContextReadiness(ctx).customerSafeMessage;
    expect(message).toContain("Branche");
    expect(message).toContain("Unieke waardepropositie");
  });
});

describe("CampaignStrategyDevDiagnostics", () => {
  it("is hidden in production builds", () => {
    const original = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";
    expect(isDevDiagnosticsVisible()).toBe(false);
    process.env.NODE_ENV = original;
  });
});
