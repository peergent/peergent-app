import { describe, expect, it } from "vitest";
import { buildCampaignContext } from "@/lib/office/campaign/campaign-context";
import { evaluateReadinessGate } from "@/lib/brain/runtime/readiness-gate";
import { emptyCompanyProfile } from "@/lib/brain/company/profile";
import { fieldFromListValue, fieldFromValue } from "@/lib/brain/company/source-priority";
import type { MarketingProject } from "@/lib/peer-experience/marketing/projects/types";
import type { ResearchBrainGraph } from "@/lib/brain/layers/research/brain-types";
import type { MarketingIntelligenceBrainGraph } from "@/lib/brain/layers/marketing-intelligence/brain-types";
import type { CompanyGraph } from "@/lib/brain/layers/company/types";
import {
  buildEffectiveCampaignContextForStrategyReadiness,
  evaluateEffectiveStrategyContextReadiness,
} from "../build-effective-campaign-context";
import { mapRunStatus } from "@/lib/brain/project-runtime/production-brain-adapter";

const ORG = "00000000-0000-4000-8000-000000000001";

function minimalAutomaticProject(overrides?: Partial<MarketingProject>): MarketingProject {
  return {
    id: "proj-auto-readiness",
    peerId: "emma",
    title: "Acme Launch",
    goal: "Leads",
    campaignType: "product_launch",
    createdAt: "2026-08-01T00:00:00.000Z",
    updatedAt: "2026-08-01T00:00:00.000Z",
    ownerLabel: "Pilot",
    rawRequest: "Launch campaign for professional services with clear differentiation in the market.",
    origin: "campaign_wizard",
    campaignSetup: {
      description: "Launch campaign for professional services with clear differentiation in the market.",
      primaryGoalId: "generate_leads",
      setupMode: "automatic",
      approvalMode: "approval_before_publication",
    },
    ...overrides,
  };
}

function domainInput(project: MarketingProject) {
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
  };
}

function enrichedProfile() {
  const base = emptyCompanyProfile(ORG);
  return {
    ...base,
    industry: fieldFromValue("Professional Services", "integration", {
      lastUpdatedAt: new Date().toISOString(),
    }),
    targetAudiences: fieldFromListValue(["Marketing leaders"], "integration", {
      lastUpdatedAt: new Date().toISOString(),
    }),
    uniqueSellingPoints: fieldFromListValue(["Faster onboarding"], "integration", {
      lastUpdatedAt: new Date().toISOString(),
    }),
    products: fieldFromListValue(["Advisory retainers"], "integration", {
      lastUpdatedAt: new Date().toISOString(),
    }),
    mainCompetitors: fieldFromListValue(["Legacy Agency Co"], "integration", {
      lastUpdatedAt: new Date().toISOString(),
    }),
    website: fieldFromValue("https://example.com", "integration", {
      lastUpdatedAt: new Date().toISOString(),
    }),
  };
}

function researchGraph(): ResearchBrainGraph {
  return {
    version: "1.0.0",
    organizationId: ORG,
    projectId: "proj-auto-readiness",
    createdAt: "2026-08-01T00:00:00.000Z",
    updatedAt: "2026-08-01T00:00:00.000Z",
    objective: {
      id: "obj-1",
      statement: "Understand market",
      domains: ["audience"],
      successCriteria: [],
      constraints: [],
      evidenceIds: [],
    },
    plan: {
      id: "plan-1",
      questions: [],
      domains: ["audience"],
      budget: {
        maxSources: 1,
        maxRequests: 1,
        maxPages: 1,
        maxCompetitors: 1,
        maxDurationMs: 1,
        costBudget: 1,
      },
      stopConditions: [],
    },
    sources: [{ id: "src-1", type: "company_website", label: "Site", url: null, capturedAt: "2026-08-01T00:00:00.000Z" }],
    findings: [],
    evidence: [],
    citations: [],
    comparisons: [],
    patterns: [],
    contradictions: [],
    opportunities: [],
    risks: [],
    proposedUpdates: [],
    competitorProfiles: [{ id: "comp-1", name: "Legacy Agency Co", website: null, positioning: null, offer: null, pricingSignals: [], primaryMessages: [], proofPoints: [], confidence: "medium" }],
    marketSignals: [],
    audienceInsights: [{ id: "aud-1", segment: "Marketing leaders", painPoints: [], motivations: [], objections: [], purchaseTriggers: [], languageUsed: [], trustDrivers: [], confidence: "medium" }],
    positioningInsights: [],
    searchInsights: [],
    unresolvedQuestions: [],
    summary: {
      headline: "Research complete",
      findingCount: 1,
      evidenceCount: 1,
      contradictionCount: 0,
      proposalCount: 0,
      unresolvedCount: 0,
    },
    confidence: "medium",
    budgetState: {
      sourcesUsed: 1,
      requestsUsed: 1,
      pagesUsed: 1,
      competitorsUsed: 1,
      durationMs: 1,
      costUsed: 0,
    },
  };
}

function marketingIntelligenceGraph(): MarketingIntelligenceBrainGraph {
  return {
    version: "1.0.0",
    organizationId: ORG,
    projectId: "proj-auto-readiness",
    createdAt: "2026-08-01T00:00:00.000Z",
    updatedAt: "2026-08-01T00:00:00.000Z",
    companyGraphVersion: "1",
    researchGraphVersion: "1",
    reasoningGraphVersion: "1",
    evidence: [],
    businessContext: {
      organizationSummary: "Acme",
      goals: ["Generate leads"],
      constraints: [],
      projectObjective: "Launch",
      evidenceIds: [],
    },
    audienceIntelligence: [{ segment: "Marketing leaders", importance: "high", intentLevel: "high", coreProblem: "Growth", primaryMotivation: "Pipeline", keyObjections: [], trustBuilders: [], preferredChannels: [], messageSensitivity: "medium", evidenceIds: [], confidence: "medium" }],
    marketIntelligence: [],
    competitiveMarketing: [{ competitorId: "comp-1", name: "Legacy Agency Co", channelPresence: [], messagingShare: null, campaignThemes: [], positioningCluster: null, offerPatterns: [], ctaPatterns: [], contentThemes: [], creativePatterns: [], proofUsage: [], marketSaturation: "medium", visibleWeaknesses: [], visibleWhitespace: [], confidence: "medium", evidenceIds: [] }],
    channelIntelligence: [],
    messagingIntelligence: {
      dominantMarketMessages: [],
      saturatedClaims: [],
      underusedMessages: [],
      trustThemes: [],
      proofRequirements: [],
      objectionThemes: [],
      emotionalDrivers: [],
      rationalDrivers: [],
      messageDifferentiation: ["Faster onboarding"],
      messageRisks: [],
      confidence: "medium",
      evidenceIds: [],
    },
    offerIntelligence: {
      clarity: "high",
      differentiation: "high",
      proof: "medium",
      riskReversal: "medium",
      urgency: "low",
      pricingTransparency: "medium",
      valueCommunication: "high",
      entryOffer: null,
      primaryConversionAction: null,
      strengths: ["Advisory retainers"],
      weaknesses: [],
      opportunities: [],
      risks: [],
      confidence: "medium",
      evidenceIds: [],
    },
    funnelIntelligence: [],
    contentIntelligence: {
      contentThemes: [],
      coverageGaps: [],
      formatOpportunities: [],
      authorityGaps: [],
      educationGaps: [],
      objectionContentGaps: [],
      proofGaps: [],
      comparisonContentOpportunities: [],
      searchIntentContentGaps: [],
      confidence: "medium",
      evidenceIds: [],
    },
    searchIntelligence: {
      commercialIntentClusters: [],
      informationalClusters: [],
      searchOpportunityThemes: [],
      contentGaps: [],
      competitiveSearchPressure: "medium",
      brandDemand: "medium",
      nonBrandDemand: "medium",
      questionThemes: [],
      conversionIntentTopics: [],
      confidence: "medium",
      evidenceIds: [],
    },
    paidMediaIntelligence: {
      channelSaturation: [],
      cpcSignals: [],
      creativePatterns: [],
      audienceAvailability: "medium",
      budgetEfficiency: "medium",
      confidence: "medium",
      evidenceIds: [],
    },
    organicIntelligence: {
      contentAuthority: "medium",
      searchVisibility: "medium",
      communityPresence: "medium",
      shareability: "medium",
      confidence: "medium",
      evidenceIds: [],
    },
    opportunitySignals: [],
    riskSignals: [],
    benchmarkContext: [],
    marketingPriorities: [],
    strategyInputs: {
      topAudienceSignals: [],
      topChannelSignals: [],
      topMessagingSignals: [],
      topMarketSignals: [],
      topCompetitiveSignals: [],
      topFunnelGaps: [],
      topOpportunities: [],
      topRisks: [],
      benchmarkContext: [],
      constraints: [],
      unknowns: [],
      confidence: "medium",
    },
    summary: {
      headline: "MI complete",
      opportunityCount: 1,
      riskCount: 0,
      priorityCount: 1,
      insufficientDataFlags: [],
    },
    confidence: "medium",
  };
}

function companyGraph(): CompanyGraph {
  return {
    version: "1.0.0",
    organizationId: ORG,
    createdAt: "2026-08-01T00:00:00.000Z",
    updatedAt: "2026-08-01T00:00:00.000Z",
    versionMeta: {
      version: 1,
      createdAt: "2026-08-01T00:00:00.000Z",
      updatedAt: "2026-08-01T00:00:00.000Z",
      author: "test",
      source: "test",
      changeReason: "test",
    },
    sources: [],
    facts: [
      {
        id: "fact-industry",
        domain: "industry",
        key: "industry",
        title: "Industry",
        value: "Professional Services",
        confidence: "medium",
        sourceIds: [],
        evidence: [],
        freshness: "fresh",
        lastValidated: null,
        customerConfirmed: false,
        createdAt: "2026-08-01T00:00:00.000Z",
        updatedAt: "2026-08-01T00:00:00.000Z",
      },
    ],
    nodes: [],
    relations: [],
    confidence: "medium",
    unknownDomains: [],
  };
}

describe("PX-50.11 effective strategy readiness", () => {
  it("A: minimal automatic campaign passes after Peergent enriches missing context", () => {
    const project = minimalAutomaticProject();
    const ctx = buildCampaignContext({ project, domainInput: domainInput(project), locale: "en" });
    expect(evaluateEffectiveStrategyContextReadiness({ campaignContext: ctx }).ready).toBe(false);

    const evaluation = evaluateEffectiveStrategyContextReadiness({
      campaignContext: ctx,
      companyProfile: enrichedProfile(),
      resolvedGraphs: {
        companyGraph: companyGraph(),
        researchBrainGraph: researchGraph(),
        marketingIntelligenceBrainGraph: marketingIntelligenceGraph(),
      },
    });

    expect(evaluation.ready).toBe(true);
    expect(evaluation.build.derivedFieldCount).toBeGreaterThan(0);
    expect(evaluation.readiness.missingEssentialFields).toEqual([]);
  });

  it("B: explicit campaign values win over brain-derived values", () => {
    const project = minimalAutomaticProject({
      campaignSetup: {
        ...minimalAutomaticProject().campaignSetup!,
        targetAudience: "Explicit buyers",
        campaignBrandContext: {
          brandName: "Acme Launch",
          industry: "Explicit Industry",
          uniqueSellingPoints: ["Explicit USP"],
          productsAndServices: ["Explicit product"],
          targetAudience: "Explicit buyers",
        },
      },
    });
    const ctx = buildCampaignContext({ project, domainInput: domainInput(project), locale: "en" });
    const built = buildEffectiveCampaignContextForStrategyReadiness({
      campaignContext: ctx,
      companyProfile: enrichedProfile(),
      resolvedGraphs: {
        researchBrainGraph: researchGraph(),
        marketingIntelligenceBrainGraph: marketingIntelligenceGraph(),
      },
    });

    expect(built.effectiveContext.brandContext?.industry).toBe("Explicit Industry");
    expect(built.effectiveContext.audience).toBe("Explicit buyers");
    expect(built.effectiveContext.brandContext?.uniqueSellingPoints).toEqual(["Explicit USP"]);
  });

  it("C: partial enrichment still blocks with exact remaining machine codes", () => {
    const project = minimalAutomaticProject({
      campaignSetup: {
        ...minimalAutomaticProject().campaignSetup!,
        description: "Too short",
      },
    });
    const ctx = buildCampaignContext({ project, domainInput: domainInput(project), locale: "en" });
    const evaluation = evaluateEffectiveStrategyContextReadiness({
      campaignContext: ctx,
      companyProfile: {
        ...enrichedProfile(),
        uniqueSellingPoints: fieldFromListValue([], "integration", { lastUpdatedAt: new Date().toISOString() }),
        products: fieldFromListValue([], "integration", { lastUpdatedAt: new Date().toISOString() }),
        services: fieldFromListValue([], "integration", { lastUpdatedAt: new Date().toISOString() }),
      },
      resolvedGraphs: {
        researchBrainGraph: {
          ...researchGraph(),
          competitorProfiles: [],
          audienceInsights: [{ ...researchGraph().audienceInsights[0]!, segment: "Leaders" }],
        },
      },
    });

    expect(evaluation.ready).toBe(false);
    expect(evaluation.machineReasonCodes).toContain("missing_uniqueValueProposition");
    expect(evaluation.machineReasonCodes).toContain("missing_productOrService");
  });

  it("D: website intelligence satisfies readiness without wizard websiteUrl", () => {
    const project = minimalAutomaticProject();
    const ctx = buildCampaignContext({ project, domainInput: domainInput(project), locale: "en" });
    const evaluation = evaluateEffectiveStrategyContextReadiness({
      campaignContext: ctx,
      companyProfile: enrichedProfile(),
      resolvedGraphs: {
        researchBrainGraph: researchGraph(),
        marketingIntelligenceBrainGraph: marketingIntelligenceGraph(),
      },
    });

    expect(evaluation.readiness.optionalContextStates.websiteDecision).not.toBe("missing");
    expect(evaluation.machineReasonCodes).not.toContain("website_decision_missing");
  });

  it("E: competitor intelligence satisfies readiness without wizard competitors", () => {
    const project = minimalAutomaticProject();
    const ctx = buildCampaignContext({ project, domainInput: domainInput(project), locale: "en" });
    const evaluation = evaluateEffectiveStrategyContextReadiness({
      campaignContext: ctx,
      companyProfile: enrichedProfile(),
      resolvedGraphs: {
        researchBrainGraph: researchGraph(),
        marketingIntelligenceBrainGraph: marketingIntelligenceGraph(),
      },
    });

    expect(evaluation.readiness.optionalContextStates.competitorDecision).toBe("supplied");
    expect(evaluation.machineReasonCodes).not.toContain("competitor_decision_missing");
  });

  it("F: BrainRuntime gate uses merged readiness and preserves waiting_for_input semantics", () => {
    const project = minimalAutomaticProject();
    const ctx = buildCampaignContext({ project, domainInput: domainInput(project), locale: "en" });
    const blockedGate = evaluateReadinessGate({
      capabilityId: "strategy",
      overallScore: 10,
      dimensionScores: {
        company_profile: 0,
        website: 0,
        brand: 0,
        business: 0,
        corrections: 0,
      },
      missingCriticalFields: ["targetAudiences", "goals"],
      assemblyState: "needs_information",
      campaignContext: ctx,
      strategyReadinessEnrichment: {
        companyProfile: enrichedProfile(),
        resolvedGraphs: {
          researchBrainGraph: researchGraph(),
          marketingIntelligenceBrainGraph: marketingIntelligenceGraph(),
        },
      },
    });
    expect(blockedGate.ok).toBe(true);

    const waitingGate = evaluateReadinessGate({
      capabilityId: "strategy",
      overallScore: 10,
      dimensionScores: {
        company_profile: 0,
        website: 0,
        brand: 0,
        business: 0,
        corrections: 0,
      },
      missingCriticalFields: ["targetAudiences", "goals"],
      assemblyState: "needs_information",
      campaignContext: ctx,
    });
    expect(waitingGate.ok).toBe(false);
    if (!waitingGate.ok) {
      expect(waitingGate.status).toBe("waiting_for_input");
      expect(waitingGate.reasons.length).toBeGreaterThan(0);
    }
  });
});

describe("PX-50.11 adapter status mapping", () => {
  it("G: waiting_for_input maps to non-terminal BrainResult with readiness_insufficient", () => {
    const status = mapRunStatus({
      run: {
        id: "run-1",
        traceId: "trace-1",
        childRunIds: [],
        organizationId: ORG,
        peerId: "emma",
        capabilityId: "strategy",
        status: "waiting_for_input",
        errorCode: "readiness_insufficient",
        errorMessage: "missing_industry; missing_targetAudience",
        usage: { providerId: "deterministic", inputTokens: 0, outputTokens: 0, costCentsUsed: 0 },
        budget: { maxRuns: 1, maxChildRuns: 0, maxEstimatedCostCents: 0, runsUsed: 0, childRunsUsed: 0, costCentsUsed: 0 },
        startedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      assembly: {} as never,
      output: null,
      policy: { decision: "allow", reason: "test" },
      presentation: null,
      cacheHit: false,
    });
    expect(status).toBe("waiting_for_input");
  });

  it("H: genuine failed status remains failed", () => {
    const status = mapRunStatus({
      run: {
        id: "run-2",
        traceId: "trace-2",
        childRunIds: [],
        organizationId: ORG,
        peerId: "emma",
        capabilityId: "strategy",
        status: "failed",
        usage: { providerId: "deterministic", inputTokens: 0, outputTokens: 0, costCentsUsed: 0 },
        budget: { maxRuns: 1, maxChildRuns: 0, maxEstimatedCostCents: 0, runsUsed: 0, childRunsUsed: 0, costCentsUsed: 0 },
        startedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      assembly: {} as never,
      output: null,
      policy: { decision: "allow", reason: "test" },
      presentation: null,
      cacheHit: false,
    });
    expect(status).toBe("failed");
  });
});
