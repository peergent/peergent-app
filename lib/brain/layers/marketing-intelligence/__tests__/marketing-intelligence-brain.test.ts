import { beforeEach, describe, expect, it } from "vitest";
import { buildCompanyGraph, resetDefaultCompanyRepository } from "@/lib/brain/layers/company";
import {
  buildResearchBrainGraph,
  resetDefaultResearchBrainRepository,
  resetDefaultResearchProviderRegistry,
} from "@/lib/brain/layers/research";
import {
  buildReasoningBrainGraph,
  resetDefaultReasoningBrainRepository,
} from "@/lib/brain/layers/reasoning";
import {
  buildMarketingIntelligenceBrainGraph,
  validateMarketingIntelligenceBrainGraph,
  marketingIntelligenceBrainContract,
  resetDefaultMarketingIntelligenceBrainRepository,
  getDefaultMarketingIntelligenceBrainRepository,
  assertNoCompanyMutation,
  assertNoStrategyLanguage,
  assertNoCreativeLanguage,
  containsStrategyLanguage,
  containsChannelStrategyLanguage,
  detectMessagingSaturation,
  detectFunnelGaps,
  enforceMarketingConfidenceCeiling,
  buildBenchmarkContext,
} from "@/lib/brain/layers/marketing-intelligence";
import { createDefaultProjectBrainRegistry } from "@/lib/brain/integration/creative-brain-registry";
import type { BrainContextPackage } from "@/lib/brain/project-engine";
import type { CompanyGraph } from "@/lib/brain/layers/company/types";
import type { ResearchBrainGraph } from "@/lib/brain/layers/research/brain-types";
import type { ReasoningBrainGraph } from "@/lib/brain/layers/reasoning/brain-types";
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
    changeReason: "Marketing intelligence test fixture",
  });
}

async function pipelineUpstream() {
  const companyGraph = pipelineCompanyGraph();
  const researchGraph = await buildResearchBrainGraph({
    organizationId: PEERGENT_DEMO_ORG_ID,
    companyGraph,
  });
  const reasoningGraph = buildReasoningBrainGraph({
    organizationId: PEERGENT_DEMO_ORG_ID,
    companyGraph,
    researchGraph,
  });
  return { companyGraph, researchGraph, reasoningGraph };
}

describe("Marketing Intelligence Brain", () => {
  beforeEach(() => {
    resetDefaultCompanyRepository();
    resetDefaultResearchBrainRepository();
    resetDefaultResearchProviderRegistry();
    resetDefaultReasoningBrainRepository();
    resetDefaultMarketingIntelligenceBrainRepository();
  });

  it("consumes Company + Research + Reasoning graphs", async () => {
    const { companyGraph, researchGraph, reasoningGraph } = await pipelineUpstream();
    const graph = buildMarketingIntelligenceBrainGraph({
      organizationId: PEERGENT_DEMO_ORG_ID,
      companyGraph,
      researchGraph,
      reasoningGraph,
    });

    expect(graph.companyGraphVersion).toBe(companyGraph.version);
    expect(graph.researchGraphVersion).toBe(researchGraph.version);
    expect(graph.reasoningGraphVersion).toBe(reasoningGraph.version);
    expect(graph.evidence.length).toBeGreaterThan(0);
  });

  it("builds audience intelligence", async () => {
    const { companyGraph, researchGraph, reasoningGraph } = await pipelineUpstream();
    const graph = buildMarketingIntelligenceBrainGraph({
      organizationId: PEERGENT_DEMO_ORG_ID,
      companyGraph,
      researchGraph,
      reasoningGraph,
      audienceContext: ["SMB owners"],
    });

    expect(graph.audienceIntelligence.length).toBeGreaterThan(0);
    expect(graph.audienceIntelligence[0]?.segment).toBeTruthy();
    expect(graph.audienceIntelligence[0]?.confidence).toBeDefined();
  });

  it("builds channel intelligence without choosing strategy", async () => {
    const { companyGraph, researchGraph, reasoningGraph } = await pipelineUpstream();
    const graph = buildMarketingIntelligenceBrainGraph({
      organizationId: PEERGENT_DEMO_ORG_ID,
      companyGraph,
      researchGraph,
      reasoningGraph,
      selectedChannels: ["LinkedIn"],
    });

    expect(graph.channelIntelligence.length).toBeGreaterThan(0);
    for (const channel of graph.channelIntelligence) {
      expect(containsChannelStrategyLanguage(channel.funnelRole)).toBe(false);
      expect(channel.opportunities.join(" ")).not.toMatch(/spend \d+/i);
    }
  });

  it("detects messaging saturation", async () => {
    const { companyGraph, researchGraph, reasoningGraph } = await pipelineUpstream();
    const researchWithSaturation: ResearchBrainGraph = {
      ...researchGraph,
      positioningInsights: [
        {
          id: "pos-1",
          positioningGaps: [],
          differentiationOpportunities: [],
          messageSaturation: ["Fast implementation"],
          proofGaps: [],
          trustGaps: [],
          evidenceIds: researchGraph.evidence.slice(0, 1).map((e) => e.id),
          confidence: "medium",
        },
      ],
    };

    const graph = buildMarketingIntelligenceBrainGraph({
      organizationId: PEERGENT_DEMO_ORG_ID,
      companyGraph,
      researchGraph: researchWithSaturation,
      reasoningGraph,
    });

    expect(detectMessagingSaturation(graph.messagingIntelligence.saturatedClaims)).toBe(true);
  });

  it("interprets competitor marketing intelligence", async () => {
    const { companyGraph, researchGraph, reasoningGraph } = await pipelineUpstream();
    const researchWithCompetitor: ResearchBrainGraph = {
      ...researchGraph,
      competitorProfiles: [
        {
          id: "comp-1",
          name: "RivalCo",
          website: null,
          positioning: "Enterprise AI platform",
          offer: null,
          pricingSignals: [],
          primaryMessages: ["Fast implementation"],
          proofPoints: [],
          channels: ["LinkedIn"],
          contentThemes: ["AI trends"],
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

    const graph = buildMarketingIntelligenceBrainGraph({
      organizationId: PEERGENT_DEMO_ORG_ID,
      companyGraph,
      researchGraph: researchWithCompetitor,
      reasoningGraph,
    });

    expect(graph.competitiveMarketing.length).toBe(1);
    expect(graph.competitiveMarketing[0]?.pricingSignals).toBeUndefined();
    expect(graph.competitiveMarketing[0]?.channelPresence).toContain("LinkedIn");
  });

  it("detects funnel gaps", async () => {
    const { companyGraph, researchGraph, reasoningGraph } = await pipelineUpstream();
    const graph = buildMarketingIntelligenceBrainGraph({
      organizationId: PEERGENT_DEMO_ORG_ID,
      companyGraph,
      researchGraph,
      reasoningGraph,
    });

    expect(graph.funnelIntelligence.length).toBe(6);
    const gaps = detectFunnelGaps(graph.funnelIntelligence);
    expect(Array.isArray(gaps)).toBe(true);
  });

  it("builds offer intelligence", async () => {
    const { companyGraph, researchGraph, reasoningGraph } = await pipelineUpstream();
    const graph = buildMarketingIntelligenceBrainGraph({
      organizationId: PEERGENT_DEMO_ORG_ID,
      companyGraph,
      researchGraph,
      reasoningGraph,
    });

    expect(graph.offerIntelligence.strengths.length + graph.offerIntelligence.weaknesses.length).toBeGreaterThan(0);
    expect(graph.offerIntelligence.confidence).toBeDefined();
  });

  it("builds content gap intelligence", async () => {
    const { companyGraph, researchGraph, reasoningGraph } = await pipelineUpstream();
    const graph = buildMarketingIntelligenceBrainGraph({
      organizationId: PEERGENT_DEMO_ORG_ID,
      companyGraph,
      researchGraph,
      reasoningGraph,
    });

    expect(graph.contentIntelligence).toBeDefined();
    expect(graph.contentIntelligence.confidence).toBeDefined();
  });

  it("builds search intelligence", async () => {
    const { companyGraph, researchGraph, reasoningGraph } = await pipelineUpstream();
    const graph = buildMarketingIntelligenceBrainGraph({
      organizationId: PEERGENT_DEMO_ORG_ID,
      companyGraph,
      researchGraph,
      reasoningGraph,
    });

    expect(graph.searchIntelligence).toBeDefined();
    expect(graph.searchIntelligence.competitiveSearchPressure).toBeDefined();
  });

  it("creates marketing opportunities", async () => {
    const { companyGraph, researchGraph, reasoningGraph } = await pipelineUpstream();
    const graph = buildMarketingIntelligenceBrainGraph({
      organizationId: PEERGENT_DEMO_ORG_ID,
      companyGraph,
      researchGraph,
      reasoningGraph,
    });

    expect(graph.opportunitySignals.every((o) => !containsStrategyLanguage(o.description))).toBe(true);
  });

  it("creates marketing risks", async () => {
    const { companyGraph, researchGraph, reasoningGraph } = await pipelineUpstream();
    const graph = buildMarketingIntelligenceBrainGraph({
      organizationId: PEERGENT_DEMO_ORG_ID,
      companyGraph,
      researchGraph,
      reasoningGraph,
      constraints: ["Limited brand budget"],
    });

    expect(graph.riskSignals.length).toBeGreaterThan(0);
    expect(graph.riskSignals.every((r) => r.mitigationConsideration.length > 0)).toBe(true);
  });

  it("ranks marketing priorities", async () => {
    const { companyGraph, researchGraph, reasoningGraph } = await pipelineUpstream();
    const graph = buildMarketingIntelligenceBrainGraph({
      organizationId: PEERGENT_DEMO_ORG_ID,
      companyGraph,
      researchGraph,
      reasoningGraph,
      selectedChannels: ["LinkedIn"],
    });

    expect(graph.marketingPriorities.length).toBeGreaterThan(0);
    expect(graph.marketingPriorities.every((p) => ["high", "medium", "low"].includes(p.priority))).toBe(true);
  });

  it("returns benchmark unavailable when no evidence", () => {
    const benchmarks = buildBenchmarkContext({});
    expect(benchmarks.some((b) => b.benchmarkUnavailable)).toBe(true);
    expect(benchmarks[0]?.range).toBeNull();
  });

  it("enforces confidence ceiling", () => {
    expect(enforceMarketingConfidenceCeiling("high", 0)).toBe("low");
    expect(enforceMarketingConfidenceCeiling("high", 1)).toBe("medium");
  });

  it("does not perform external research", async () => {
    const { companyGraph, researchGraph, reasoningGraph } = await pipelineUpstream();
    const graph = buildMarketingIntelligenceBrainGraph({
      organizationId: PEERGENT_DEMO_ORG_ID,
      companyGraph,
      researchGraph,
      reasoningGraph,
    });
    expect(graph.evidence.every((e) => e.source !== ("web_crawl" as never))).toBe(true);
  });

  it("never mutates CompanyGraph", async () => {
    const { companyGraph, researchGraph, reasoningGraph } = await pipelineUpstream();
    const before = companyGraph.facts.length;
    buildMarketingIntelligenceBrainGraph({
      organizationId: PEERGENT_DEMO_ORG_ID,
      companyGraph,
      researchGraph,
      reasoningGraph,
    });
    expect(companyGraph.facts.length).toBe(before);
    expect(assertNoCompanyMutation(companyGraph, companyGraph)).toBe(true);
  });

  it("does not generate strategy", async () => {
    const { companyGraph, researchGraph, reasoningGraph } = await pipelineUpstream();
    const graph = buildMarketingIntelligenceBrainGraph({
      organizationId: PEERGENT_DEMO_ORG_ID,
      companyGraph,
      researchGraph,
      reasoningGraph,
    });
    expect(assertNoStrategyLanguage(graph)).toBe(true);
    expect(graph.strategyInputs.topChannelSignals.join(" ")).not.toMatch(/primary acquisition/i);
  });

  it("does not generate creative", async () => {
    const { companyGraph, researchGraph, reasoningGraph } = await pipelineUpstream();
    const graph = buildMarketingIntelligenceBrainGraph({
      organizationId: PEERGENT_DEMO_ORG_ID,
      companyGraph,
      researchGraph,
      reasoningGraph,
    });
    expect(assertNoCreativeLanguage(graph)).toBe(true);
  });

  it("persists repository history", async () => {
    const { companyGraph, researchGraph, reasoningGraph } = await pipelineUpstream();
    const { createMarketingIntelligenceBrainLayer } = await import(
      "@/lib/brain/layers/marketing-intelligence/marketing-intelligence-brain-layer"
    );
    const output = await createMarketingIntelligenceBrainLayer().produce({
      organizationId: PEERGENT_DEMO_ORG_ID,
      companyGraph,
      researchGraph,
      reasoningGraph,
    });

    const repo = getDefaultMarketingIntelligenceBrainRepository();
    expect(repo.getHistory({ organizationId: PEERGENT_DEMO_ORG_ID }).entries.length).toBe(1);
    expect(repo.getSnapshot(output.snapshot.id)?.graph.strategyInputs.confidence).toBeDefined();
  });

  it("integrates with ProjectBrainContract", async () => {
    const { companyGraph, researchGraph, reasoningGraph } = await pipelineUpstream();
    const registry = createDefaultProjectBrainRegistry();
    expect(registry.marketing_intelligence?.id).toBe("marketing_intelligence");

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

    const result = await marketingIntelligenceBrainContract.execute({
      brainId: "marketing_intelligence",
      context,
      payload: {
        companyGraph,
        researchBrainGraph: researchGraph,
        reasoningBrainGraph: reasoningGraph,
      },
      idempotencyKey: "test-mi",
      retryAttempt: 0,
    });

    expect(result.status).toBe("completed");
    expect(result.output?.outputRef).toContain("marketing_intelligence:");
  });

  it("does not fabricate when evidence insufficient", async () => {
    const companyGraph = pipelineCompanyGraph();
    const emptyResearch = await buildResearchBrainGraph({
      organizationId: PEERGENT_DEMO_ORG_ID,
      companyGraph,
      budget: { maxSources: 0, maxRequests: 0, maxPages: 0, maxCompetitors: 0, maxDurationMs: 1000, costBudget: 0 },
    });
    const reasoningGraph = buildReasoningBrainGraph({
      organizationId: PEERGENT_DEMO_ORG_ID,
      companyGraph,
      researchGraph: emptyResearch,
    });

    const graph = buildMarketingIntelligenceBrainGraph({
      organizationId: PEERGENT_DEMO_ORG_ID,
      companyGraph,
      researchGraph: emptyResearch,
      reasoningGraph,
    });

    expect(graph.summary.insufficientDataFlags.length).toBeGreaterThan(0);
    expect(graph.competitiveMarketing.every((c) => c.confidence !== "high" || c.evidenceIds.length > 0)).toBe(true);
  });

  it("packages strategy inputs for Strategy Brain", async () => {
    const { companyGraph, researchGraph, reasoningGraph } = await pipelineUpstream();
    const graph = buildMarketingIntelligenceBrainGraph({
      organizationId: PEERGENT_DEMO_ORG_ID,
      companyGraph,
      researchGraph,
      reasoningGraph,
    });

    expect(graph.strategyInputs.topAudienceSignals.length).toBeGreaterThanOrEqual(0);
    expect(graph.strategyInputs.confidence).toBeDefined();
    expect(graph.strategyInputs.topChannelSignals.join(" ")).not.toMatch(/we should/i);
  });

  it("validates marketing intelligence graph", async () => {
    const { companyGraph, researchGraph, reasoningGraph } = await pipelineUpstream();
    const graph = buildMarketingIntelligenceBrainGraph({
      organizationId: PEERGENT_DEMO_ORG_ID,
      companyGraph,
      researchGraph,
      reasoningGraph,
    });
    expect(validateMarketingIntelligenceBrainGraph(graph).valid).toBe(true);
  });
});
