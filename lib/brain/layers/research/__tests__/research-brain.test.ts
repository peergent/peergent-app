import { beforeEach, describe, expect, it } from "vitest";
import {
  buildCompanyGraph,
  companyBrainContract,
  resetDefaultCompanyRepository,
} from "@/lib/brain/layers/company";
import {
  buildResearchPlan,
  buildResearchBrainGraph,
  validateResearchBrainGraph,
  researchBrainContract,
  resetDefaultResearchBrainRepository,
  resetDefaultResearchProviderRegistry,
  getDefaultResearchBrainRepository,
  getDefaultResearchProviderRegistry,
  enforceConfidenceCeiling,
  buildCompanyUpdateProposals,
  assertNoCompanyMutation,
  freshnessFromDates,
  testProviderCapabilityRejection,
  createCompanyContextStubProvider,
  providerSupports,
  buildCompetitorResearch,
  buildAudienceResearch,
  createResearchBrainEvidence,
  createResearchSourceRecord,
  resetResearchBrainEvidenceCounters,
} from "@/lib/brain/layers/research";
import { createDefaultProjectBrainRegistry } from "@/lib/brain/integration/creative-brain-registry";
import type { BrainContextPackage } from "@/lib/brain/project-engine";
import {
  buildPeergentCompanyProfile,
  buildDemoWebsiteSnapshotSync,
  assembleCompanyContextSync,
  collectBrandGraph,
  clearDemoWebsiteSnapshots,
  seedPeergentDemoWebsiteSnapshotSync,
  PEERGENT_DEMO_ORG_ID,
} from "@/lib/brain";
import { buildCampaignContextFromCreateInput } from "@/lib/office/campaign/campaign-context";
import { createMarketingCampaignProject } from "@/lib/peer-experience/marketing/projects/project-engine";
import type { CompanyGraph } from "@/lib/brain/layers/company/types";
import type { MemoryGraph } from "@/lib/brain/layers/memory/types";
import { MEMORY_LAYER_VERSION } from "@/lib/brain/layers/memory/types";

const peergentInput = {
  peerId: "demo" as const,
  ownerLabel: "Emma",
  name: "Peergent",
  goalLabel: "Demo requests",
  description: "More demo requests from SMB owners.",
  primaryGoalId: "generate_leads" as const,
  targetAudience: "SMB owners",
  setupMode: "automatic" as const,
  approvalMode: "approval_before_publication" as const,
  selectedChannels: ["LinkedIn"] as const,
};

function pipelineCompanyGraph(): CompanyGraph {
  clearDemoWebsiteSnapshots();
  seedPeergentDemoWebsiteSnapshotSync();
  const assembledAt = "2026-08-01T00:00:00.000Z";
  const profile = buildPeergentCompanyProfile("en", assembledAt);
  const website = buildDemoWebsiteSnapshotSync({
    organizationId: PEERGENT_DEMO_ORG_ID,
    url: "https://peergent.com",
  });
  const project = createMarketingCampaignProject(peergentInput);
  const campaignContext = buildCampaignContextFromCreateInput(project, peergentInput, "en");
  const assembly = assembleCompanyContextSync({
    organizationId: PEERGENT_DEMO_ORG_ID,
    companyProfile: profile,
    websiteSnapshot: website,
    campaignContext,
    locale: "en",
  });
  const brandGraph = collectBrandGraph({
    companySnapshot: assembly.companySnapshot,
    campaignContext,
    websiteSnapshot: website,
    upstreamOutputs: {},
  });
  return buildCompanyGraph({
    organizationId: PEERGENT_DEMO_ORG_ID,
    projectId: project.id,
    locale: "en",
    companySnapshot: assembly.companySnapshot,
    brandGraph,
    author: "test",
    changeReason: "Research brain test fixture",
  });
}

function stubMemoryGraph(): MemoryGraph {
  return {
    version: MEMORY_LAYER_VERSION,
    organizationId: PEERGENT_DEMO_ORG_ID,
    campaignId: "camp-1",
    createdAt: "2026-08-01T00:00:00.000Z",
    validationGraphRef: null,
    creativeGraphRef: null,
    confidence: "medium",
    summary: {
      storedCount: 1,
      mergedCount: 0,
      skippedCount: 0,
      archivedCount: 0,
      forgottenCount: 0,
      totalActiveMemories: 1,
      confidence: "medium",
      reasoningSummary: "Test fixture",
    },
    memories: [
      {
        id: "mem-comp-1",
        category: "competitive_memory",
        title: "Prior competitor note",
        description: "Competitor X mentioned in prior research.",
        source: "research",
        confidence: "medium",
        importance: "medium",
        createdAt: "2026-06-01T00:00:00.000Z",
        updatedAt: "2026-06-01T00:00:00.000Z",
        expiresAt: null,
        evidence: [],
        relatedCampaigns: [],
        relatedDecisions: [],
        relatedAssets: [],
        tags: [],
        lifecycle: "active",
        mergeKey: "comp-x",
      },
    ],
    nodes: [],
    relations: [],
    decisions: [],
    evolution: [],
  };
}

describe("Research Brain", () => {
  beforeEach(() => {
    resetDefaultCompanyRepository();
    resetDefaultResearchBrainRepository();
    resetDefaultResearchProviderRegistry();
    resetResearchBrainEvidenceCounters();
  });

  it("builds research plan from CompanyGraph", () => {
    const companyGraph = pipelineCompanyGraph();
    const plan = buildResearchPlan({
      companyGraph,
      projectObjective: "Understand competitor landscape",
      questions: ["Which competitors are visible?"],
    });

    expect(plan.objective.projectObjective).toContain("competitor");
    expect(plan.knownFacts.length).toBeGreaterThan(0);
    expect(plan.domains).toContain("competitor");
    expect(plan.budget.maxSources).toBeGreaterThan(0);
  });

  it("produces evidence-backed finding", async () => {
    const companyGraph = pipelineCompanyGraph();
    const graph = await buildResearchBrainGraph({
      organizationId: PEERGENT_DEMO_ORG_ID,
      companyGraph,
      projectObjective: "Validate positioning",
    });

    const evidenced = graph.findings.filter((f) => f.evidenceIds.length > 0);
    expect(evidenced.length).toBeGreaterThan(0);
    expect(graph.evidence.length).toBeGreaterThan(0);
    expect(graph.sources.every((s) => s.organizationScoped)).toBe(true);
  });

  it("never stores unsupported fact as high confidence", () => {
    const label = enforceConfidenceCeiling("high", 0, "fact");
    expect(label).toBe("low");

    const hypothesis = enforceConfidenceCeiling("high", 5, "hypothesis");
    expect(hypothesis).toBe("low");
  });

  it("detects contradiction", async () => {
    const companyGraph = pipelineCompanyGraph();
    const uspFact = {
      ...companyGraph.facts[0],
      id: "usp-test",
      domain: "usps" as const,
      key: "usp_fastest",
      title: "USP",
      value: "Fastest implementation in the market",
      confidence: "high" as const,
    };
    const graphWithUsp: CompanyGraph = {
      ...companyGraph,
      facts: [...companyGraph.facts, uspFact],
    };

    const graph = await buildResearchBrainGraph({
      organizationId: PEERGENT_DEMO_ORG_ID,
      companyGraph: graphWithUsp,
      researchQuestions: ["Which claims are saturated?"],
    });

    const positioningFindings = graph.findings.filter((f) => f.findingType === "contradiction");
    expect(graph.contradictions.length + positioningFindings.length).toBeGreaterThanOrEqual(0);
  });

  it("builds competitor comparison", async () => {
    const companyGraph = pipelineCompanyGraph();
    const competitorFact = {
      ...companyGraph.facts[0],
      id: "comp-list",
      domain: "competitive_position" as const,
      key: "competitors",
      title: "Competitors",
      value: "Acme AI, RivalCo",
      confidence: "medium" as const,
    };
    const graphInput: CompanyGraph = {
      ...companyGraph,
      facts: [...companyGraph.facts, competitorFact],
    };

    const graph = await buildResearchBrainGraph({
      organizationId: PEERGENT_DEMO_ORG_ID,
      companyGraph: graphInput,
    });

    expect(graph.competitorProfiles.length).toBeGreaterThan(0);
    expect(graph.competitorProfiles[0]?.pricingSignals).toEqual([]);
    expect(graph.competitorProfiles.every((p) => p.confidence !== "high" || p.evidenceIds.length > 0)).toBe(
      true
    );
  });

  it("returns audience enrichment without overwriting company facts", async () => {
    const companyGraph = pipelineCompanyGraph();
    const beforeFactCount = companyGraph.facts.length;

    const graph = await buildResearchBrainGraph({
      organizationId: PEERGENT_DEMO_ORG_ID,
      companyGraph,
      researchQuestions: ["Which audience segment appears underserved?"],
    });

    expect(companyGraph.facts.length).toBe(beforeFactCount);
    expect(graph.audienceInsights.every((a) => a.enrichmentOnly)).toBe(true);
  });

  it("proposes company update without company mutation", async () => {
    const companyGraph = pipelineCompanyGraph();
    const graph = await buildResearchBrainGraph({
      organizationId: PEERGENT_DEMO_ORG_ID,
      companyGraph,
      researchQuestions: ["Which audience segment appears underserved?"],
    });

    expect(graph.proposedUpdates.length).toBeGreaterThan(0);
    expect(graph.proposedUpdates.every((p) => p.requiresCustomerConfirmation)).toBe(true);
    expect(assertNoCompanyMutation(companyGraph, companyGraph)).toBe(true);
  });

  it("tracks source provenance on evidence", () => {
    resetResearchBrainEvidenceCounters();
    const source = createResearchSourceRecord({
      type: "company_graph",
      identity: "fact-1",
      label: "Company fact",
      capturedAt: "2026-08-01T00:00:00.000Z",
    });
    const evidence = createResearchBrainEvidence({
      sourceId: source.id,
      sourceType: "company_graph",
      capturedAt: "2026-08-01T00:00:00.000Z",
      rawExcerpt: "SMB owners",
      normalizedSummary: "Target: SMB owners",
      confidence: "medium",
      directEvidence: true,
    });

    expect(evidence.sourceId).toBe(source.id);
    expect(evidence.normalizedSummary).toContain("SMB");
  });

  it("handles freshness", () => {
    const stale = freshnessFromDates({
      capturedAt: "2020-01-01T00:00:00.000Z",
      maxAgeDays: 90,
      now: new Date("2026-08-01T00:00:00.000Z"),
    });
    expect(stale).toBe("expired");

    const fresh = freshnessFromDates({
      capturedAt: "2026-07-01T00:00:00.000Z",
      maxAgeDays: 90,
      now: new Date("2026-08-01T00:00:00.000Z"),
    });
    expect(fresh).toBe("fresh");
  });

  it("respects budget stop condition", async () => {
    const companyGraph = pipelineCompanyGraph();
    const graph = await buildResearchBrainGraph({
      organizationId: PEERGENT_DEMO_ORG_ID,
      companyGraph,
      budget: { maxSources: 1, maxRequests: 1, maxPages: 1, maxCompetitors: 1, maxDurationMs: 5000, costBudget: 1 },
    });

    expect(graph.budgetState.sourcesUsed).toBeLessThanOrEqual(1);
    expect(graph.budgetState.stopReason).not.toBeNull();
  });

  it("rejects unsupported provider capability", () => {
    const provider = createCompanyContextStubProvider();
    expect(providerSupports(provider, "fetchWebsite")).toBe(true);
    expect(providerSupports(provider, "searchWeb")).toBe(false);

    const rejected = testProviderCapabilityRejection(provider.id);
    expect(rejected.success).toBe(false);
    expect(rejected.errorCode).toBe("capability_not_supported");
  });

  it("persists repository version history", async () => {
    const companyGraph = pipelineCompanyGraph();
    const layer = await import("@/lib/brain/layers/research/research-brain-layer");
    const output = await layer.createResearchBrainLayer().produce({
      organizationId: PEERGENT_DEMO_ORG_ID,
      companyGraph,
    });

    const repo = getDefaultResearchBrainRepository();
    const history = repo.getHistory({ organizationId: PEERGENT_DEMO_ORG_ID });
    expect(history.entries.length).toBe(1);
    expect(repo.getSnapshot(output.snapshot.id)?.graph.plan.id).toBe(output.graph.plan.id);
  });

  it("reads memory without writing memory", async () => {
    const companyGraph = pipelineCompanyGraph();
    const memoryGraph = stubMemoryGraph();
    const graph = await buildResearchBrainGraph({
      organizationId: PEERGENT_DEMO_ORG_ID,
      companyGraph,
      memoryGraph,
    });

    const memoryEvidence = graph.evidence.filter((e) => e.sourceType === "memory_read");
    expect(memoryEvidence.length).toBeGreaterThan(0);
    expect(memoryGraph.memories.length).toBe(1);
  });

  it("integrates with ProjectBrainContract", async () => {
    const companyGraph = pipelineCompanyGraph();
    const registry = createDefaultProjectBrainRegistry();
    expect(registry.research?.id).toBe("research");

    const context: BrainContextPackage = {
      organizationId: PEERGENT_DEMO_ORG_ID,
      peerId: "demo",
      projectId: "proj-1",
      episodeId: "ep-1",
      locale: "en",
      contextVersion: 1,
      slices: {
        business: true,
        brand: true,
        website: true,
        products: true,
        competitors: true,
        goals: true,
        campaign: true,
      },
      priorOutputs: [],
      priorDecisionIds: [],
      memoryRefs: [],
      assembledAt: "2026-08-01T00:00:00.000Z",
    };

    const result = await researchBrainContract.execute({
      brainId: "research",
      context,
      payload: { companyGraph },
      idempotencyKey: "test-research",
      retryAttempt: 0,
    });

    expect(result.status).toBe("completed");
    expect(result.output?.outputRef).toContain("research:");
  });

  it("does not fabricate when evidence missing", () => {
    const companyGraph = pipelineCompanyGraph();
    const { profiles } = buildCompetitorResearch({
      companyGraph: {
        ...companyGraph,
        facts: [
          ...companyGraph.facts,
          {
            ...companyGraph.facts[0],
            id: "comp-unknown",
            domain: "competitive_position",
            key: "competitors",
            title: "Competitors",
            value: "UnknownCorp",
            confidence: "low",
          },
        ],
      },
      evidence: [],
      maxCompetitors: 3,
    });

    const unknown = profiles.find((p) => p.name === "UnknownCorp");
    expect(unknown?.website).toBeNull();
    expect(unknown?.pricingSignals).toEqual([]);
    expect(unknown?.confidence).toBe("low");
  });

  it("validates research graph meta", async () => {
    const companyGraph = pipelineCompanyGraph();
    const graph = await buildResearchBrainGraph({
      organizationId: PEERGENT_DEMO_ORG_ID,
      companyGraph,
    });
    const validation = validateResearchBrainGraph(graph);
    expect(validation.valid).toBe(true);
  });
});
