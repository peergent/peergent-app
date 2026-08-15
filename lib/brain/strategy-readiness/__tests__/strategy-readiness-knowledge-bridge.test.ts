import { describe, expect, it } from "vitest";
import { buildCampaignContext } from "@/lib/office/campaign/campaign-context";
import { emptyBrainStructuredOutput } from "@/lib/brain/evidence/structured-output";
import { getBrainCapability } from "@/lib/brain/capabilities/registry";
import { emptyCompanyProfile } from "@/lib/brain/company/profile";
import { fieldFromListValue, fieldFromValue } from "@/lib/brain/company/source-priority";
import type { MarketingProject } from "@/lib/peer-experience/marketing/projects/types";
import type { BrainStructuredOutput } from "@/lib/brain/evidence/structured-output";
import type { ResearchGraph } from "@/lib/brain/layers/research/types";
import { emptyResearchGraph } from "@/lib/brain/layers/research/types";
import {
  evaluateEffectiveStrategyContextReadiness,
  extractCapabilityKnowledge,
  inferTargetAudienceFromDescription,
} from "../index";
import { executeBrainForWorkflowStepSync } from "@/lib/brain/integration/execute-brain-for-workflow-step";
import type { MarketingPeerDomainInput } from "@/lib/peer-experience/marketing/view-models/marketing-peer-domain-input";

const ORG = "00000000-0000-4000-8000-000000000001";

function capabilityOutput(
  capabilityId: Parameters<typeof emptyBrainStructuredOutput>[0],
  patch: Partial<BrainStructuredOutput>
): BrainStructuredOutput {
  const def = getBrainCapability(capabilityId);
  return {
    ...emptyBrainStructuredOutput(capabilityId, def.version, "2026-08-01T00:00:00.000Z"),
    ...patch,
  };
}

function minimalProject(overrides?: Partial<MarketingProject>): MarketingProject {
  return {
    id: "proj-px5013",
    peerId: "emma",
    title: "Peergent Launch",
    goal: "Leads",
    campaignType: "product_launch",
    createdAt: "2026-08-01T00:00:00.000Z",
    updatedAt: "2026-08-01T00:00:00.000Z",
    ownerLabel: "Pilot",
    rawRequest: "Create a marketing campaign for Peergent aimed at Dutch SMEs interested in AI employees.",
    origin: "campaign_wizard",
    campaignSetup: {
      description:
        "Create a marketing campaign for Peergent aimed at Dutch SMEs interested in AI employees.",
      primaryGoalId: "generate_leads",
      setupMode: "automatic",
      approvalMode: "approval_before_publication",
    },
    ...overrides,
  };
}

function domainInput(project: MarketingProject): MarketingPeerDomainInput {
  return {
    peerId: "emma",
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
    organizationId: ORG,
  };
}

function enrichedProfile() {
  const base = emptyCompanyProfile(ORG);
  return {
    ...base,
    companyName: fieldFromValue("Peergent", "integration", { lastUpdatedAt: new Date().toISOString() }),
    industry: fieldFromValue("AI Software", "integration", { lastUpdatedAt: new Date().toISOString() }),
    targetAudiences: fieldFromListValue(["Dutch SMEs"], "integration", {
      lastUpdatedAt: new Date().toISOString(),
    }),
    uniqueSellingPoints: fieldFromListValue(["AI employees for SMEs"], "integration", {
      lastUpdatedAt: new Date().toISOString(),
    }),
    products: fieldFromListValue(["AI workforce platform"], "integration", {
      lastUpdatedAt: new Date().toISOString(),
    }),
  };
}

function competitorOutputWithEvidence(): BrainStructuredOutput {
  return capabilityOutput("competitor_understanding", {
    findings: [
      {
        id: "competitor-1",
        label: "Competitor",
        value: "Legacy Agency Co",
        confidence: "medium",
        provenance: [{ kind: "company_profile", refId: `${ORG}:mainCompetitors` }],
      },
    ],
  });
}

function competitorOutputWarningsOnly(): BrainStructuredOutput {
  return capabilityOutput("competitor_understanding", {
    warnings: [
      {
        id: "warn-no-competitors",
        code: "competitors_missing",
        message: "No competitors",
        provenance: [{ kind: "company_profile", refId: ORG }],
      },
    ],
  });
}

function inflightResearchGraph(): ResearchGraph {
  return {
    ...emptyResearchGraph({
      organizationId: ORG,
      campaignId: "proj-px5013",
      collectedAt: "2026-08-01T00:00:00.000Z",
    }),
    audience: [
      {
        id: "aud-1",
        title: "Target audience",
        description: "Dutch SMEs",
        source: { kind: "capability_output", refId: "market" },
        confidence: 0.9,
        collectedAt: "2026-08-01T00:00:00.000Z",
        version: "1",
        validationStatus: "pending",
      },
    ],
    company: [
      {
        id: "ind-1",
        title: "Industry",
        description: "AI Software",
        source: { kind: "capability_output", refId: "company" },
        confidence: 0.9,
        collectedAt: "2026-08-01T00:00:00.000Z",
        version: "1",
        validationStatus: "pending",
      },
    ],
    competitors: [
      {
        id: "comp-1",
        title: "Competitor",
        description: "Legacy Agency Co",
        source: { kind: "capability_output", refId: "competitor" },
        confidence: 0.8,
        collectedAt: "2026-08-01T00:00:00.000Z",
        version: "1",
        validationStatus: "pending",
      },
    ],
    website: [
      {
        id: "web-1",
        title: "Supplied URL",
        description: "https://peergent.com",
        source: { kind: "website", refId: "https://peergent.com" },
        confidence: 0.95,
        collectedAt: "2026-08-01T00:00:00.000Z",
        version: "1",
        validationStatus: "pending",
      },
    ],
    brand: [
      {
        id: "brand-1",
        title: "Positioning",
        description: "AI employees for SMEs",
        source: { kind: "capability_output", refId: "brand" },
        confidence: 0.85,
        collectedAt: "2026-08-01T00:00:00.000Z",
        version: "1",
        validationStatus: "pending",
      },
    ],
    products: [
      {
        id: "prod-1",
        title: "Product",
        description: "AI workforce platform",
        source: { kind: "company_profile", refId: "products" },
        confidence: 0.9,
        collectedAt: "2026-08-01T00:00:00.000Z",
        version: "1",
        validationStatus: "pending",
      },
    ],
  };
}

describe("PX-50.13 strategy readiness knowledge bridge", () => {
  it("1: capability competitor output satisfies competitor decision without persisted graphs", () => {
    const ctx = buildCampaignContext({
      project: minimalProject(),
      domainInput: domainInput(minimalProject()),
      locale: "en",
    });
    const evaluation = evaluateEffectiveStrategyContextReadiness({
      campaignContext: ctx,
      companyProfile: enrichedProfile(),
      resolvedGraphs: {},
      upstreamCapabilityOutputs: {
        competitor_understanding: competitorOutputWithEvidence(),
        company_understanding: capabilityOutput("company_understanding", {
          findings: [{ id: "industry", label: "Industry", value: "AI Software", confidence: "medium", provenance: [] }],
        }),
        brand_understanding: capabilityOutput("brand_understanding", {
          findings: [
            {
              id: "brand-value-prop",
              label: "Value proposition",
              value: "AI employees for SMEs",
              confidence: "medium",
              provenance: [],
            },
          ],
        }),
      },
    });

    expect(evaluation.readiness.optionalContextStates.competitorDecision).toBe("supplied");
    expect(evaluation.build.knowledgeSources.competitors.source).toBe("upstream_capability");
  });

  it("2: partial competitor capability with warnings only keeps competitor_decision_missing", () => {
    const ctx = buildCampaignContext({
      project: minimalProject(),
      domainInput: domainInput(minimalProject()),
      locale: "en",
    });
    const evaluation = evaluateEffectiveStrategyContextReadiness({
      campaignContext: ctx,
      companyProfile: {
        ...enrichedProfile(),
        mainCompetitors: fieldFromListValue([], "integration", { lastUpdatedAt: new Date().toISOString() }),
      },
      resolvedGraphs: {},
      upstreamCapabilityOutputs: {
        competitor_understanding: competitorOutputWarningsOnly(),
      },
    });

    expect(evaluation.machineReasonCodes).toContain("competitor_decision_missing");
    expect(extractCapabilityKnowledge({ competitor_understanding: competitorOutputWarningsOnly() }).competitorsHasEvidence).toBe(false);
  });

  it("3: market/company capability enrichment fills industry, USP, and audience gaps", () => {
    const ctx = buildCampaignContext({
      project: minimalProject(),
      domainInput: domainInput(minimalProject()),
      locale: "en",
    });
    const evaluation = evaluateEffectiveStrategyContextReadiness({
      campaignContext: ctx,
      companyProfile: emptyCompanyProfile(ORG),
      resolvedGraphs: {},
      upstreamCapabilityOutputs: {
        company_understanding: capabilityOutput("company_understanding", {
          findings: [
            { id: "1", label: "Industry", value: "AI Software", confidence: "high", provenance: [] },
            { id: "2", label: "Products", value: "AI workforce platform", confidence: "high", provenance: [] },
          ],
        }),
        market_understanding: capabilityOutput("market_understanding", {
          findings: [
            { id: "1", label: "Target audience", value: "Dutch SMEs", confidence: "medium", provenance: [] },
            { id: "2", label: "Value proposition", value: "AI employees for SMEs", confidence: "medium", provenance: [] },
          ],
        }),
      },
    });

    expect(evaluation.readiness.missingEssentialFields).not.toContain("industry");
    expect(evaluation.readiness.missingEssentialFields).not.toContain("targetAudience");
    expect(evaluation.readiness.missingEssentialFields).not.toContain("uniqueValueProposition");
    expect(evaluation.build.knowledgeSources.industry.source).toBe("upstream_capability");
  });

  it("4: explicit campaign audience wins over capability-inferred audience", () => {
    const project = minimalProject({
      campaignSetup: {
        ...minimalProject().campaignSetup!,
        targetAudience: "Explicit buyers",
        campaignBrandContext: {
          brandName: "Peergent",
          targetAudience: "Explicit buyers",
          industry: "Explicit Industry",
          uniqueSellingPoints: ["Explicit USP"],
          productsAndServices: ["Explicit product"],
        },
      },
    });
    const ctx = buildCampaignContext({ project, domainInput: domainInput(project), locale: "en" });
    const evaluation = evaluateEffectiveStrategyContextReadiness({
      campaignContext: ctx,
      upstreamCapabilityOutputs: {
        market_understanding: capabilityOutput("market_understanding", {
          findings: [{ id: "1", label: "Target audience", value: "Capability audience", confidence: "medium", provenance: [] }],
        }),
      },
    });

    expect(evaluation.build.effectiveContext.audience).toBe("Explicit buyers");
    expect(evaluation.build.knowledgeSources.targetAudience.source).toBe("explicit_campaign");
  });

  it("5: in-flight research graph satisfies readiness when persisted graphs are empty", () => {
    const ctx = buildCampaignContext({
      project: minimalProject(),
      domainInput: domainInput(minimalProject()),
      locale: "en",
    });
    const evaluation = evaluateEffectiveStrategyContextReadiness({
      campaignContext: ctx,
      companyProfile: {
        ...enrichedProfile(),
        targetAudiences: fieldFromListValue([], "integration", { lastUpdatedAt: new Date().toISOString() }),
        mainCompetitors: fieldFromListValue([], "integration", { lastUpdatedAt: new Date().toISOString() }),
        website: fieldFromValue(null, "integration", { lastUpdatedAt: new Date().toISOString() }),
      },
      resolvedGraphs: {},
      inflightGraphs: { researchGraph: inflightResearchGraph() },
    });

    expect(evaluation.readiness.optionalContextStates.competitorDecision).toBe("supplied");
    expect(evaluation.readiness.optionalContextStates.websiteDecision).not.toBe("missing");
    expect(evaluation.build.knowledgeSources.targetAudience.source).toBe("inflight_graph");
  });

  it("6: explicit website skip satisfies website decision", () => {
    const project = minimalProject({
      campaignSetup: {
        ...minimalProject().campaignSetup!,
        websiteSkipped: true,
      },
    });
    const ctx = buildCampaignContext({ project, domainInput: domainInput(project), locale: "en" });
    const evaluation = evaluateEffectiveStrategyContextReadiness({
      campaignContext: ctx,
      companyProfile: emptyCompanyProfile(ORG),
      resolvedGraphs: {},
    });

    expect(evaluation.readiness.optionalContextStates.websiteDecision).toBe("skipped");
    expect(evaluation.machineReasonCodes).not.toContain("website_decision_missing");
  });

  it("7: discovered website from capability output satisfies website decision", () => {
    const ctx = buildCampaignContext({
      project: minimalProject(),
      domainInput: domainInput(minimalProject()),
      locale: "en",
    });
    const evaluation = evaluateEffectiveStrategyContextReadiness({
      campaignContext: ctx,
      companyProfile: enrichedProfile(),
      resolvedGraphs: {},
      upstreamCapabilityOutputs: {
        website_understanding: capabilityOutput("website_understanding", {
          findings: [
            {
              id: "finding-url-supplied",
              label: "Supplied URL",
              value: "https://peergent.com",
              confidence: "high",
              provenance: [{ kind: "website", refId: "https://peergent.com" }],
            },
          ],
        }),
        company_understanding: capabilityOutput("company_understanding", {
          findings: [{ id: "1", label: "Industry", value: "AI Software", confidence: "high", provenance: [] }],
        }),
        brand_understanding: capabilityOutput("brand_understanding", {
          findings: [
            { id: "brand-value-prop", label: "Value proposition", value: "AI employees", confidence: "medium", provenance: [] },
          ],
        }),
        competitor_understanding: competitorOutputWithEvidence(),
      },
    });

    expect(evaluation.readiness.optionalContextStates.websiteDecision).toBe("supplied");
    expect(evaluation.build.knowledgeSources.website.source).toBe("upstream_capability");
  });

  it("8: genuinely unknown website keeps website_decision_missing", () => {
    const ctx = buildCampaignContext({
      project: minimalProject({ campaignSetup: { ...minimalProject().campaignSetup!, description: "Short" } }),
      domainInput: domainInput(minimalProject()),
      locale: "en",
    });
    const evaluation = evaluateEffectiveStrategyContextReadiness({
      campaignContext: ctx,
      companyProfile: emptyCompanyProfile(ORG),
      resolvedGraphs: {},
      upstreamCapabilityOutputs: {
        website_understanding: capabilityOutput("website_understanding", {
          warnings: [
            {
              id: "warn-no-website",
              code: "website_unavailable",
              message: "No website",
              provenance: [{ kind: "website", refId: ORG }],
            },
          ],
        }),
      },
    });

    expect(evaluation.machineReasonCodes).toContain("website_decision_missing");
  });

  it("9: production-path integration uses upstream knowledge without pre-populated layer repos", () => {
    const project = minimalProject();
    const input = domainInput(project);
    input.understanding = null;

    const workflow = executeBrainForWorkflowStepSync({
      stepId: "strategy_determined",
      peerId: "emma",
      project,
      domainInput: input,
      locale: "en",
    });

    expect(workflow).not.toBeNull();
    const status = workflow!.result.run.status;
    expect(["completed", "waiting_for_input", "partial"]).toContain(status);
    if (status === "waiting_for_input") {
      expect(workflow!.result.run.errorMessage).toBeTruthy();
    }
  });

  it("10: manual campaign with no enrichable knowledge still pauses for missing essentials", () => {
    const project = minimalProject({
      campaignSetup: {
        description: "Short",
        primaryGoalId: "generate_leads",
        setupMode: "manual",
        approvalMode: "approval_before_publication",
      },
    });
    const ctx = buildCampaignContext({ project, domainInput: domainInput(project), locale: "en" });
    const evaluation = evaluateEffectiveStrategyContextReadiness({
      campaignContext: ctx,
      companyProfile: emptyCompanyProfile(ORG),
      resolvedGraphs: {},
      upstreamCapabilityOutputs: {
        competitor_understanding: competitorOutputWarningsOnly(),
        website_understanding: capabilityOutput("website_understanding", {
          warnings: [
            {
              id: "warn-no-website",
              code: "website_unavailable",
              message: "No website",
              provenance: [{ kind: "website", refId: ORG }],
            },
          ],
        }),
      },
    });

    expect(evaluation.ready).toBe(false);
    expect(evaluation.machineReasonCodes.length).toBeGreaterThan(0);
  });

  it("infers audience from campaign description when explicit audience is absent", () => {
    const inferred = inferTargetAudienceFromDescription(
      "Create a marketing campaign for Peergent aimed at Dutch SMEs interested in AI employees."
    );
    expect(inferred).toContain("Dutch SMEs");
  });
});
