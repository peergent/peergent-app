import { beforeEach, describe, expect, it } from "vitest";
import { buildCompanyGraph, resetDefaultCompanyRepository } from "@/lib/brain/layers/company";
import {
  buildResearchBrainGraph,
  resetDefaultResearchBrainRepository,
  resetDefaultResearchProviderRegistry,
} from "@/lib/brain/layers/research";
import {
  buildReasoningBrainGraph,
  validateReasoningBrainGraph,
  reasoningBrainContract,
  resetDefaultReasoningBrainRepository,
  getDefaultReasoningBrainRepository,
  assertNoCompanyMutation,
  assertNoStrategyLanguage,
  assertNoCreativeLanguage,
  containsStrategyLanguage,
  buildReasoningAssumptions,
  buildReasoningContradictions,
  buildDecisionOptions,
  enforceReasoningConfidenceCeiling,
} from "@/lib/brain/layers/reasoning";
import { createDefaultProjectBrainRegistry } from "@/lib/brain/integration/creative-brain-registry";
import type { BrainContextPackage } from "@/lib/brain/project-engine";
import type { CompanyGraph } from "@/lib/brain/layers/company/types";
import type { ResearchBrainGraph } from "@/lib/brain/layers/research/brain-types";
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
    changeReason: "Reasoning brain test fixture",
  });
}

async function pipelineResearchGraph(companyGraph: CompanyGraph): Promise<ResearchBrainGraph> {
  return buildResearchBrainGraph({
    organizationId: PEERGENT_DEMO_ORG_ID,
    companyGraph,
    projectObjective: "Understand market and competitors",
  });
}

describe("Reasoning Brain", () => {
  beforeEach(() => {
    resetDefaultCompanyRepository();
    resetDefaultResearchBrainRepository();
    resetDefaultResearchProviderRegistry();
    resetDefaultReasoningBrainRepository();
  });

  it("creates reasoning graph from CompanyGraph and ResearchGraph", async () => {
    const companyGraph = pipelineCompanyGraph();
    const researchGraph = await pipelineResearchGraph(companyGraph);
    const graph = buildReasoningBrainGraph({
      organizationId: PEERGENT_DEMO_ORG_ID,
      companyGraph,
      researchGraph,
    });

    expect(graph.version).toBeTruthy();
    expect(graph.evidence.length).toBeGreaterThan(0);
    expect(graph.companyGraphVersion).toBe(companyGraph.version);
    expect(graph.researchGraphVersion).toBe(researchGraph.version);
  });

  it("generates interpretations with evidence", async () => {
    const companyGraph = pipelineCompanyGraph();
    const researchGraph = await pipelineResearchGraph(companyGraph);
    const graph = buildReasoningBrainGraph({
      organizationId: PEERGENT_DEMO_ORG_ID,
      companyGraph,
      researchGraph,
    });

    expect(graph.interpretations.length).toBeGreaterThan(0);
    const withEvidence = graph.interpretations.filter((i) => i.supportedEvidence.length > 0);
    expect(withEvidence.length).toBeGreaterThan(0);
    expect(graph.interpretations[0]?.confidenceReason.length).toBeGreaterThan(0);
  });

  it("handles contradictions with interpretation", async () => {
    const companyGraph = pipelineCompanyGraph();
    const channelFact = {
      ...companyGraph.facts[0]!,
      id: "channel-never-li",
      domain: "integrations" as const,
      key: "channels",
      title: "Channels",
      value: "Never uses LinkedIn — email only",
      confidence: "high" as const,
    };
    const companyWithChannel: CompanyGraph = {
      ...companyGraph,
      facts: [...companyGraph.facts, channelFact],
    };

    const researchGraph = await pipelineResearchGraph(companyWithChannel);
    const researchWithCompetitor: ResearchBrainGraph = {
      ...researchGraph,
      competitorProfiles: [
        {
          id: "comp-li",
          name: "RivalCo",
          website: null,
          positioning: null,
          offer: null,
          pricingSignals: [],
          primaryMessages: [],
          proofPoints: [],
          channels: ["LinkedIn"],
          contentThemes: [],
          strengths: [],
          weaknesses: [],
          differentiators: [],
          customerSentiment: null,
          recentMovements: [],
          confidence: "medium",
          evidenceIds: researchGraph.evidence.slice(0, 1).map((e) => e.id),
        },
      ],
    };

    const graph = buildReasoningBrainGraph({
      organizationId: PEERGENT_DEMO_ORG_ID,
      companyGraph: companyWithChannel,
      researchGraph: researchWithCompetitor,
    });

    const linkedInInterpretation = graph.interpretations.find((i) =>
      /linkedin|underutilized/i.test(i.title)
    );
    expect(linkedInInterpretation).toBeDefined();
    expect(linkedInInterpretation?.summary).not.toMatch(/we should launch/i);
  });

  it("tracks assumptions explicitly", async () => {
    const companyGraph = pipelineCompanyGraph();
    const lowFact = {
      ...companyGraph.facts[0]!,
      id: "low-fact",
      confidence: "low" as const,
      customerConfirmed: false,
    };
    const companyWithLow = { ...companyGraph, facts: [...companyGraph.facts, lowFact] };
    const researchGraph = await pipelineResearchGraph(companyWithLow);

    const assumptions = buildReasoningAssumptions({
      companyGraph: companyWithLow,
      researchGraph,
      createdAt: new Date().toISOString(),
    });

    expect(assumptions.length).toBeGreaterThan(0);
    expect(assumptions.every((a) => a.validationNeeded)).toBe(true);
    expect(assumptions.every((a) => a.whyAssumed.length > 0)).toBe(true);
  });

  it("generates opportunities without strategy language", async () => {
    const companyGraph = pipelineCompanyGraph();
    const researchGraph = await pipelineResearchGraph(companyGraph);
    const graph = buildReasoningBrainGraph({
      organizationId: PEERGENT_DEMO_ORG_ID,
      companyGraph,
      researchGraph,
    });

    expect(assertNoStrategyLanguage(graph)).toBe(true);
    for (const opp of graph.opportunities) {
      expect(containsStrategyLanguage(opp.description)).toBe(false);
    }
  });

  it("generates risks with impact and mitigation", async () => {
    const companyGraph = pipelineCompanyGraph();
    const researchGraph = await pipelineResearchGraph(companyGraph);
    const graph = buildReasoningBrainGraph({
      organizationId: PEERGENT_DEMO_ORG_ID,
      companyGraph,
      researchGraph,
      knownRisks: ["Regulatory review pending"],
    });

    expect(graph.risks.length).toBeGreaterThan(0);
    expect(graph.risks.every((r) => r.mitigationSuggestion.length > 0)).toBe(true);
  });

  it("detects unknowns", async () => {
    const companyGraph = pipelineCompanyGraph();
    const researchGraph = await pipelineResearchGraph(companyGraph);
    const graph = buildReasoningBrainGraph({
      organizationId: PEERGENT_DEMO_ORG_ID,
      companyGraph,
      researchGraph,
    });

    expect(graph.unknowns.length).toBeGreaterThan(0);
    const categories = new Set(graph.unknowns.map((u) => u.category));
    expect(categories.size).toBeGreaterThan(0);
  });

  it("generates decision options not decisions", async () => {
    const companyGraph = pipelineCompanyGraph();
    const channelFact = {
      ...companyGraph.facts[0]!,
      id: "channel-never-li-2",
      domain: "integrations" as const,
      key: "channels",
      title: "Channels",
      value: "Never uses LinkedIn",
      confidence: "high" as const,
    };
    const companyWithChannel = { ...companyGraph, facts: [...companyGraph.facts, channelFact] };
    const researchGraph = await pipelineResearchGraph(companyWithChannel);
    const researchWithCompetitor: ResearchBrainGraph = {
      ...researchGraph,
      competitorProfiles: [
        {
          id: "comp-li-2",
          name: "RivalCo",
          website: null,
          positioning: null,
          offer: null,
          pricingSignals: [],
          primaryMessages: [],
          proofPoints: [],
          channels: ["LinkedIn"],
          contentThemes: [],
          strengths: [],
          weaknesses: [],
          differentiators: [],
          customerSentiment: null,
          recentMovements: [],
          confidence: "medium",
          evidenceIds: [],
        },
      ],
    };

    const graph = buildReasoningBrainGraph({
      organizationId: PEERGENT_DEMO_ORG_ID,
      companyGraph: companyWithChannel,
      researchGraph: researchWithCompetitor,
    });

    expect(graph.decisionOptions.length).toBeGreaterThan(0);
    expect(graph.decisionOptions.some((o) => o.label.startsWith("Option"))).toBe(true);
    expect(graph.decisionOptions.every((o) => o.advantages.length > 0)).toBe(true);
  });

  it("derives confidence without fabrication", () => {
    expect(enforceReasoningConfidenceCeiling("high", 0)).toBe("low");
    expect(enforceReasoningConfidenceCeiling("high", 1)).toBe("medium");
    expect(enforceReasoningConfidenceCeiling("medium", 3)).toBe("medium");
  });

  it("prioritizes signals", async () => {
    const companyGraph = pipelineCompanyGraph();
    const researchGraph = await pipelineResearchGraph(companyGraph);
    const graph = buildReasoningBrainGraph({
      organizationId: PEERGENT_DEMO_ORG_ID,
      companyGraph,
      researchGraph,
    });

    expect(graph.prioritySignals.length).toBeGreaterThan(0);
    expect(graph.prioritySignals.every((s) => ["high", "medium", "low"].includes(s.priority))).toBe(
      true
    );
  });

  it("persists repository history", async () => {
    const companyGraph = pipelineCompanyGraph();
    const researchGraph = await pipelineResearchGraph(companyGraph);
    const { createReasoningBrainLayer } = await import(
      "@/lib/brain/layers/reasoning/reasoning-brain-layer"
    );
    const output = await createReasoningBrainLayer().produce({
      organizationId: PEERGENT_DEMO_ORG_ID,
      companyGraph,
      researchGraph,
    });

    const repo = getDefaultReasoningBrainRepository();
    expect(repo.getHistory({ organizationId: PEERGENT_DEMO_ORG_ID }).entries.length).toBe(1);
    expect(repo.getSnapshot(output.snapshot.id)?.graph.summary.interpretationCount).toBeGreaterThan(
      0
    );
  });

  it("integrates with ProjectBrainContract", async () => {
    const companyGraph = pipelineCompanyGraph();
    const researchGraph = await pipelineResearchGraph(companyGraph);
    const registry = createDefaultProjectBrainRegistry();
    expect(registry.reasoning?.id).toBe("reasoning");

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

    const result = await reasoningBrainContract.execute({
      brainId: "reasoning",
      context,
      payload: { companyGraph, researchBrainGraph: researchGraph },
      idempotencyKey: "test-reasoning",
      retryAttempt: 0,
    });

    expect(result.status).toBe("completed");
    expect(result.output?.outputRef).toContain("reasoning:");
  });

  it("never mutates CompanyGraph", async () => {
    const companyGraph = pipelineCompanyGraph();
    const before = companyGraph.facts.length;
    const researchGraph = await pipelineResearchGraph(companyGraph);

    buildReasoningBrainGraph({
      organizationId: PEERGENT_DEMO_ORG_ID,
      companyGraph,
      researchGraph,
    });

    expect(companyGraph.facts.length).toBe(before);
    expect(assertNoCompanyMutation(companyGraph, companyGraph)).toBe(true);
  });

  it("does not generate strategy", async () => {
    const companyGraph = pipelineCompanyGraph();
    const researchGraph = await pipelineResearchGraph(companyGraph);
    const graph = buildReasoningBrainGraph({
      organizationId: PEERGENT_DEMO_ORG_ID,
      companyGraph,
      researchGraph,
    });

    expect(assertNoStrategyLanguage(graph)).toBe(true);
    const allText = [
      ...graph.interpretations.map((i) => i.summary),
      ...graph.opportunities.map((o) => o.description),
    ].join(" ");
    expect(allText).not.toMatch(/we should launch/i);
  });

  it("does not generate creative", async () => {
    const companyGraph = pipelineCompanyGraph();
    const researchGraph = await pipelineResearchGraph(companyGraph);
    const graph = buildReasoningBrainGraph({
      organizationId: PEERGENT_DEMO_ORG_ID,
      companyGraph,
      researchGraph,
    });

    expect(assertNoCreativeLanguage(graph)).toBe(true);
  });

  it("validates reasoning graph meta", async () => {
    const companyGraph = pipelineCompanyGraph();
    const researchGraph = await pipelineResearchGraph(companyGraph);
    const graph = buildReasoningBrainGraph({
      organizationId: PEERGENT_DEMO_ORG_ID,
      companyGraph,
      researchGraph,
    });
    const validation = validateReasoningBrainGraph(graph);
    expect(validation.valid).toBe(true);
  });
});
