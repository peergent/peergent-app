import { describe, expect, it } from "vitest";
import { assembleCompanyContextSync } from "@/lib/brain/context/company-context-assembler";
import { executeCompetitorUnderstanding } from "@/lib/brain/capabilities/competitor-understanding";
import { fieldFromListValue, fieldFromValue } from "@/lib/brain/company/source-priority";
import { evaluateEffectiveStrategyContextReadiness } from "@/lib/brain/strategy-readiness";
import { buildCampaignContext, buildCampaignContextFromCreateInput } from "@/lib/office/campaign/campaign-context";
import {
  campaignUsesExternalBrand,
  inferCampaignBrandName,
  resolveCampaignBrandBoundary,
  resolveDurableOrganizationName,
  resolveExplicitCampaignBrandName,
  shouldUseOrganizationIntelligence,
} from "@/lib/office/campaign/campaign-brand-boundary";
import { createMarketingCampaignProject } from "@/lib/peer-experience/marketing/projects/project-engine";
import type { MarketingProject } from "@/lib/peer-experience/marketing/projects/types";
import type { MarketingUnderstanding } from "@/lib/marketing-intelligence";

const materializedRival = [{ name: "Rival One", source: "business_brain" as const }];

function peergentUnderstanding(): MarketingUnderstanding {
  return {
    available: true,
    sparse: false,
    completeness: 0.9,
    gaps: [],
    brand: {
      positioningStatement: "Peergent positioneert AI-collega's voor marketingteams.",
      toneOfVoice: { summary: "Peergent tone", traits: [], examples: [] },
      values: [],
      keyMessages: [],
    },
    products: [{ id: "p1", name: "Marketing Peer", description: "AI marketing colleague" }],
    services: [],
    customerSegments: [],
    competitors: [],
    goals: [],
    existingContent: [],
    assembledAt: new Date().toISOString(),
  };
}

function automaticProject(title: string, setup?: MarketingProject["campaignSetup"]): MarketingProject {
  return {
    id: "proj-px5020",
    peerId: "emma",
    title,
    goal: "Leads",
    campaignType: "product_launch",
    createdAt: "2026-08-15T00:00:00.000Z",
    updatedAt: "2026-08-15T00:00:00.000Z",
    ownerLabel: "Owner",
    rawRequest: "Grow pipeline",
    origin: "campaign_wizard",
    campaignSetup: setup ?? {
      description: "Grow pipeline",
      primaryGoalId: "generate_leads",
      setupMode: "automatic",
      approvalMode: "approval_before_publication",
    },
  };
}

describe("PX-50.20 canonical organization identity + external brand boundary", () => {
  it("A: automatic own-org arbitrary campaign title → usesExternalBrand false", () => {
    const ctx = buildCampaignContext({
      project: automaticProject("You Charge Launch"),
      domainInput: { projects: [], understanding: peergentUnderstanding() } as never,
      organizationName: "PeerGent",
      organizationId: "38f6f543-fd88-4f9e-90fd-f3b206d9cb62",
    });

    expect(ctx.accountOrganizationName).toBe("PeerGent");
    expect(ctx.usesExternalBrand).toBe(false);
    expect(ctx.brandName).toBe("PeerGent");
    expect(ctx.campaignName).toBe("You Charge Launch");
    expect(shouldUseOrganizationIntelligence({ usesExternalBrand: ctx.usesExternalBrand, isSeedCampaign: false })).toBe(
      true
    );
  });

  it("B: product-style title without explicit external brand → usesExternalBrand false", () => {
    const ctx = buildCampaignContext({
      project: automaticProject("Samsung Summer Campaign"),
      domainInput: { projects: [] } as never,
      organizationName: "Coolblue",
    });

    expect(ctx.usesExternalBrand).toBe(false);
    expect(ctx.brandName).toBe("Coolblue");
    expect(inferCampaignBrandName("Samsung Summer Campaign")).toBe("Samsung Summer");
  });

  it("C: explicit campaignBrandName different from organization → usesExternalBrand true", () => {
    const project = automaticProject("Nike Summer", {
      description: "Summer push",
      primaryGoalId: "brand_awareness",
      setupMode: "automatic",
      approvalMode: "approval_before_publication",
      campaignBrandName: "Nike",
    });

    const ctx = buildCampaignContext({
      project,
      domainInput: { projects: [project] } as never,
      organizationName: "Peergent",
    });

    expect(ctx.usesExternalBrand).toBe(true);
    expect(ctx.brandName).toBe("Nike");
    expect(resolveExplicitCampaignBrandName(project.campaignSetup)).toBe("Nike");
  });

  it("D: explicit brand matching organization → usesExternalBrand false", () => {
    const project = automaticProject("Nike Launch", {
      description: "Launch",
      primaryGoalId: "product_launch",
      setupMode: "automatic",
      approvalMode: "approval_before_publication",
      campaignBrandName: "Nike",
    });

    const ctx = buildCampaignContext({
      project,
      domainInput: { projects: [project] } as never,
      organizationName: "Nike",
    });

    expect(ctx.usesExternalBrand).toBe(false);
    expect(ctx.brandName).toBe("Nike");
  });

  it("E: durable org identity wins over Marketing Peer heuristics", () => {
    const resolved = resolveDurableOrganizationName({
      durableOrganizationName: "You Charge",
      understanding: peergentUnderstanding(),
    });

    expect(resolved.name).toBe("You Charge");
    expect(resolved.source).toBe("durable_organization");
  });

  it("F: legacy heuristic fallback when durable org identity unavailable", () => {
    const resolved = resolveDurableOrganizationName({
      understanding: peergentUnderstanding(),
    });

    expect(resolved.name).toBe("Peergent");
    expect(resolved.source).toBe("legacy_marketing_understanding_heuristic");

    const boundary = resolveCampaignBrandBoundary({
      campaignTitle: "Installer Lead Generation",
      setup: { setupMode: "automatic", primaryGoalId: "generate_leads", approvalMode: "approval_before_publication" },
      isSeedCampaign: false,
      understanding: peergentUnderstanding(),
    });

    expect(boundary.usesExternalBrand).toBe(false);
    expect(boundary.externalBrandDecisionSource).toBe("own_org_default");
  });

  it("G: PX-50.18 competitor integration for own-org automatic campaign", () => {
    const ctx = buildCampaignContext({
      project: automaticProject("You Charge Launch"),
      domainInput: { projects: [], understanding: peergentUnderstanding() } as never,
      organizationName: "PeerGent",
    });

    const assembly = assembleCompanyContextSync({
      organizationId: "org-a",
      marketingUnderstanding: peergentUnderstanding(),
      materializedOrganizationCompetitors: materializedRival,
      websiteSnapshot: null,
      campaignContext: ctx,
      locale: "en",
    });

    expect(assembly.companySnapshot.profile.mainCompetitors.value).toEqual(["Rival One"]);

    const output = executeCompetitorUnderstanding({
      companySnapshot: assembly.companySnapshot,
      campaignContext: ctx,
      locale: "en",
    });

    expect(output.findings.length).toBeGreaterThan(0);
    expect(output.warnings.some((w) => w.code === "competitors_missing")).toBe(false);
  });

  it("H: true external brand isolation blocks Peergent BB competitors", () => {
    const project = automaticProject("Nike Summer", {
      description: "Summer",
      primaryGoalId: "brand_awareness",
      setupMode: "automatic",
      approvalMode: "approval_before_publication",
      campaignBrandName: "Nike",
    });

    const ctx = buildCampaignContext({
      project,
      domainInput: { projects: [project], understanding: peergentUnderstanding() } as never,
      organizationName: "Peergent",
    });

    expect(ctx.usesExternalBrand).toBe(true);

    const assembly = assembleCompanyContextSync({
      organizationId: "org-peergent",
      marketingUnderstanding: peergentUnderstanding(),
      materializedOrganizationCompetitors: materializedRival,
      websiteSnapshot: null,
      campaignContext: ctx,
      locale: "en",
    });

    expect(assembly.companySnapshot.profile.mainCompetitors.value ?? []).toEqual([]);
  });

  it("I: multi-tenant isolation — org identity scoped per organization", () => {
    const boundaryA = resolveCampaignBrandBoundary({
      campaignTitle: "Implant Campaign September",
      setup: {
        setupMode: "automatic",
        primaryGoalId: "generate_leads",
        approvalMode: "approval_before_publication",
      },
      isSeedCampaign: false,
      durableOrganizationName: "Dental Practice Smile",
    });

    const boundaryB = resolveCampaignBrandBoundary({
      campaignTitle: "Heat Pump Leads",
      setup: {
        setupMode: "automatic",
        primaryGoalId: "generate_leads",
        approvalMode: "approval_before_publication",
      },
      isSeedCampaign: false,
      durableOrganizationName: "Installation Company X",
    });

    expect(boundaryA.accountOrganizationName).toBe("Dental Practice Smile");
    expect(boundaryB.accountOrganizationName).toBe("Installation Company X");
    expect(boundaryA.usesExternalBrand).toBe(false);
    expect(boundaryB.usesExternalBrand).toBe(false);
    expect(boundaryA.brandName).not.toBe(boundaryB.brandName);
  });

  it("J: Strategy readiness — own-org automatic with BB competitor satisfies competitor decision", () => {
    const orgId = "38f6f543-fd88-4f9e-90fd-f3b206d9cb62";
    const project = createMarketingCampaignProject({
      peerId: "emma",
      ownerLabel: "Owner",
      name: "You Charge Launch",
      goalLabel: "Leads",
      description: "Grow pipeline",
      primaryGoalId: "generate_leads",
      setupMode: "automatic",
      approvalMode: "approval_before_publication",
    });

    const ctx = buildCampaignContextFromCreateInput(
      project,
      {
        peerId: "emma",
        ownerLabel: "Owner",
        name: "You Charge Launch",
        goalLabel: "Leads",
        description: "Grow pipeline",
        primaryGoalId: "generate_leads",
        setupMode: "automatic",
        approvalMode: "approval_before_publication",
      },
      "en",
      { organizationName: "PeerGent", organizationId: orgId }
    );

    expect(ctx.usesExternalBrand).toBe(false);

    const assembly = assembleCompanyContextSync({
      organizationId: orgId,
      marketingUnderstanding: peergentUnderstanding(),
      materializedOrganizationCompetitors: materializedRival,
      websiteSnapshot: null,
      campaignContext: ctx,
      locale: "en",
    });

    const profile = {
      ...assembly.companySnapshot.profile,
      industry: fieldFromValue("Software", "integration", { lastUpdatedAt: new Date().toISOString() }),
      targetAudiences: fieldFromListValue(["Marketing leaders"], "integration", {
        lastUpdatedAt: new Date().toISOString(),
      }),
      uniqueSellingPoints: fieldFromListValue(["AI workforce"], "integration", {
        lastUpdatedAt: new Date().toISOString(),
      }),
      products: fieldFromListValue(["Marketing Peer"], "integration", {
        lastUpdatedAt: new Date().toISOString(),
      }),
      website: fieldFromValue("https://peergent.example", "integration", {
        lastUpdatedAt: new Date().toISOString(),
      }),
    };

    const competitorOutput = executeCompetitorUnderstanding({
      companySnapshot: { ...assembly.companySnapshot, profile },
      campaignContext: ctx,
      locale: "en",
    });

    expect(competitorOutput.findings.length).toBeGreaterThan(0);

    const evaluation = evaluateEffectiveStrategyContextReadiness({
      campaignContext: ctx,
      companyProfile: profile,
      upstreamCapabilityOutputs: {
        competitor_understanding: competitorOutput,
      },
    });

    expect(evaluation.machineReasonCodes).not.toContain("competitor_decision_missing");
    expect(evaluation.readiness.optionalContextStates.competitorDecision).toBe("supplied");
  });

  it("campaignUsesExternalBrand still compares explicit brands only", () => {
    expect(
      campaignUsesExternalBrand({
        brandName: "You Charge",
        accountOrganizationName: "Peergent",
        isSeedCampaign: false,
      })
    ).toBe(true);

    expect(
      campaignUsesExternalBrand({
        brandName: "You Charge Launch",
        accountOrganizationName: "Peergent",
        isSeedCampaign: false,
      })
    ).toBe(true);
  });
});
