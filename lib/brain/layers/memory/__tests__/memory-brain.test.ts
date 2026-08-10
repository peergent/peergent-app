import { beforeEach, describe, expect, it } from "vitest";
import {
  buildMemoryGraph,
  collectMemoryGraph,
  createFromBrainInputs,
  memoryBrainContract,
  resetDefaultMemoryRepository,
  validateMemoryGraph,
  MEMORY_LAYER_VERSION,
  MEMORY_MODULE_SPECS,
  publishMemoryOutput,
  retrieveRelevantMemories,
  memoryMergeKey,
  decideMemoryAction,
} from "@/lib/brain/layers/memory";
import {
  buildValidationGraph,
  resetDefaultValidationRepository,
} from "@/lib/brain/layers/validation";
import { buildCreativeGraph, resetDefaultCreativeRepository } from "@/lib/brain/layers/creative";
import { createDefaultProjectBrainRegistry } from "@/lib/brain/integration/creative-brain-registry";
import type { BrainContextPackage } from "@/lib/brain/project-engine";
import type { MemoryRecord } from "@/lib/brain/layers/memory/types";
import {
  buildPeergentCompanyProfile,
  buildDemoWebsiteSnapshotSync,
  assembleCompanyContextSync,
  executeCompanyUnderstanding,
  executeWebsiteUnderstanding,
  executeCompetitorUnderstanding,
  executeStrategy,
  buildResearchGraph,
  buildReasoningGraph,
  buildMarketingIntelligenceGraph,
  buildStrategyGraph,
  buildDecisionsFromStrategyGraph,
  buildPlanningGraph,
  collectBrandGraph,
  clearDemoWebsiteSnapshots,
  seedPeergentDemoWebsiteSnapshotSync,
  PEERGENT_DEMO_ORG_ID,
} from "@/lib/brain";
import { buildCampaignContextFromCreateInput } from "@/lib/office/campaign/campaign-context";
import { createMarketingCampaignProject } from "@/lib/peer-experience/marketing/projects/project-engine";
import { buildCapabilityExecutionContext } from "@/lib/brain/integration/build-capability-execution-context";
import { resolveStrategySources } from "@/lib/brain/strategy/strategy-sources";

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

function pipelineMemoryInput() {
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

  const companyOut = executeCompanyUnderstanding({ companySnapshot: assembly.companySnapshot, locale: "en" });
  const websiteOut = executeWebsiteUnderstanding({
    companySnapshot: assembly.companySnapshot,
    websiteSnapshot: website,
    locale: "en",
  });
  const competitorOut = executeCompetitorUnderstanding({
    companySnapshot: assembly.companySnapshot,
    locale: "en",
  });
  const upstreamOutputs = {
    company_understanding: companyOut,
    website_understanding: websiteOut,
    competitor_understanding: competitorOut,
  };

  const execCtx = buildCapabilityExecutionContext({
    assembly,
    request: {
      organizationId: PEERGENT_DEMO_ORG_ID,
      peerId: "demo",
      capabilityId: "strategy",
      actorId: "test",
      campaignContext,
      upstreamOutputs,
    },
    campaignContext,
    upstreamOutputs,
    locale: "en",
  });

  const researchGraph = buildResearchGraph({
    companySnapshot: assembly.companySnapshot,
    campaignContext,
    upstreamOutputs: execCtx.upstreamOutputs,
  });
  const reasoningGraph = buildReasoningGraph({ researchGraph, campaignContext });
  const miGraph = buildMarketingIntelligenceGraph({
    reasoningGraph,
    researchGraph,
    campaignContext,
    locale: "en",
  });
  const sources = resolveStrategySources({
    ...execCtx,
    researchGraph,
    reasoningGraph,
    marketingIntelligenceGraph: miGraph,
  });
  const strategyGraph = buildStrategyGraph({
    sources,
    companySnapshot: execCtx.companySnapshot,
    campaignContext,
    locale: "en",
  });
  const decisions = buildDecisionsFromStrategyGraph({
    graph: strategyGraph,
    campaignContext,
    locale: "en",
  });
  const brandGraph = collectBrandGraph({
    companySnapshot: assembly.companySnapshot,
    campaignContext,
    websiteSnapshot: website,
    upstreamOutputs: execCtx.upstreamOutputs,
  });
  const planningGraph = buildPlanningGraph({
    organizationId: PEERGENT_DEMO_ORG_ID,
    campaignId: project.id,
    campaignContext,
    strategyGraph,
    decisionCollection: decisions,
    brandGraph,
    marketingIntelligence: miGraph,
    researchGraph,
    reasoningGraph,
    locale: "en",
  });

  const creativeInput = {
    organizationId: PEERGENT_DEMO_ORG_ID,
    projectId: project.id,
    locale: "en" as const,
    campaignContext,
    strategyGraph,
    planningGraph,
    decisionCollection: decisions,
    brandGraph,
    marketingIntelligence: miGraph,
    researchGraph,
    reasoningGraph,
  };

  const creativeGraph = buildCreativeGraph(creativeInput);
  const validationGraph = buildValidationGraph({ ...creativeInput, creativeGraph });

  return {
    organizationId: PEERGENT_DEMO_ORG_ID,
    projectId: project.id,
    locale: "en" as const,
    campaignContext,
    strategyGraph,
    planningGraph,
    decisionCollection: decisions,
    brandGraph,
    marketingIntelligence: miGraph,
    researchGraph,
    reasoningGraph,
    creativeGraph,
    validationGraph,
    approvalGranted: true,
  };
}

describe("Memory Brain", () => {
  beforeEach(() => {
    resetDefaultMemoryRepository();
    resetDefaultValidationRepository();
    resetDefaultCreativeRepository();
  });

  it("defines nine memory domain specs", () => {
    expect(MEMORY_MODULE_SPECS).toHaveLength(9);
    expect(MEMORY_LAYER_VERSION).toBe("1.0.0");
  });

  it("builds a memory graph across organizational domains", () => {
    const input = pipelineMemoryInput();
    const graph = buildMemoryGraph(input);

    expect(graph.memories.length).toBeGreaterThan(5);
    expect(graph.nodes.length).toBeGreaterThan(3);
    expect(graph.decisions.length).toBeGreaterThan(0);
    expect(graph.creativeGraphRef).toMatch(/^creative:/);
    expect(graph.validationGraphRef).toMatch(/^validation:/);
    expect(graph.summary.storedCount).toBeGreaterThan(0);
  });

  it("validates a complete memory graph", () => {
    const graph = buildMemoryGraph(pipelineMemoryInput());
    const validation = validateMemoryGraph(graph);
    expect(validation.valid).toBe(true);
    expect(validation.score).toBeGreaterThan(70);
  });

  it("produces structured brain output with memoryGraph", () => {
    const output = createFromBrainInputs(pipelineMemoryInput());
    expect(output.outputRef).toMatch(/^memory:/);
    expect(output.structuredOutput.memoryGraph).toBeDefined();
    expect(output.structuredOutput.findings.length).toBeGreaterThan(0);
    expect(output.structuredOutput.capabilityId).toBe("memory");
  });

  it("implements ProjectBrainContract", async () => {
    const input = pipelineMemoryInput();
    const context: BrainContextPackage = {
      organizationId: input.organizationId,
      peerId: "demo",
      projectId: input.projectId,
      episodeId: "ep-test",
      locale: "en",
      contextVersion: 1,
      slices: {
        business: true,
        brand: true,
        website: true,
        products: false,
        competitors: true,
        goals: true,
        campaign: true,
      },
      priorOutputs: [],
      priorDecisionIds: [],
      memoryRefs: [],
      assembledAt: new Date().toISOString(),
    };

    const result = await memoryBrainContract.execute({
      brainId: "memory",
      context,
      payload: input,
      idempotencyKey: "test-key",
      retryAttempt: 0,
    });

    expect(result.brainId).toBe("memory");
    expect(result.status).toBe("completed");
    expect(result.output?.capabilityIds).toContain("memory");
    expect(result.events.length).toBeGreaterThan(0);
  });

  it("registers in default project brain registry", () => {
    const registry = createDefaultProjectBrainRegistry();
    expect(registry.memory?.id).toBe("memory");
    expect(registry.memory?.requiredContextSlices).toContain("business");
    expect(registry.validation?.id).toBe("validation");
    expect(registry.creative?.id).toBe("creative");
  });

  it("never fabricates memories — every record has evidence and source", () => {
    const graph = collectMemoryGraph(pipelineMemoryInput());
    for (const mem of graph.memories) {
      expect(mem.id).toBeTruthy();
      expect(mem.category).toBeDefined();
      expect(mem.title.length).toBeGreaterThan(0);
      expect(mem.description.length).toBeGreaterThan(0);
      expect(mem.source).toBeDefined();
      expect(mem.confidence).toBeDefined();
      expect(mem.importance).toBeDefined();
      expect(mem.evidence.length).toBeGreaterThan(0);
      expect(mem.mergeKey).toBe(memoryMergeKey(mem.category, mem.title));
    }
  });

  it("merges duplicate memories instead of duplicating", () => {
    const input = pipelineMemoryInput();
    const first = buildMemoryGraph(input);
    const second = buildMemoryGraph({
      ...input,
      priorMemories: first.memories,
    });

    const goalMemories = second.memories.filter((m) => m.title === "Primary business goal");
    expect(goalMemories.length).toBeLessThanOrEqual(1);
    expect(second.summary.mergedCount).toBeGreaterThan(0);
  });

  it("retrieves memories by relevance", () => {
    const graph = buildMemoryGraph(pipelineMemoryInput());
    const result = retrieveRelevantMemories({
      memories: graph.memories,
      organizationId: PEERGENT_DEMO_ORG_ID,
      campaignId: graph.campaignId,
      limit: 5,
    });
    expect(result.memories.length).toBeGreaterThan(0);
    expect(result.memories.length).toBeLessThanOrEqual(5);
  });

  it("skips low-confidence low-importance candidates", () => {
    const existing: MemoryRecord[] = [];
    const candidate: MemoryRecord = {
      id: "mem-test",
      category: "creative_memory",
      title: "Weak idea",
      description: "Not important",
      source: "creative",
      confidence: "low",
      importance: "low",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      expiresAt: null,
      evidence: [
        {
          id: "ev-1",
          source: "creative",
          refId: "x",
          summary: "test",
          capturedAt: new Date().toISOString(),
        },
      ],
      relatedCampaigns: [],
      relatedDecisions: [],
      relatedAssets: [],
      tags: [],
      lifecycle: "active",
      mergeKey: memoryMergeKey("creative_memory", "Weak idea"),
    };

    const { action } = decideMemoryAction({
      candidate,
      existing,
      approvalGranted: false,
    });
    expect(action).toBe("skip");
  });

  it("publishes structured payload for downstream consumers", () => {
    const graph = buildMemoryGraph(pipelineMemoryInput());
    const published = publishMemoryOutput({ graph, locale: "en" });
    expect(published.summary.totalActiveMemories).toBeGreaterThan(0);
    expect(Object.keys(published.domainCounts).length).toBeGreaterThan(0);
  });

  it("fails when no memory source is available", async () => {
    const input = pipelineMemoryInput();
    const context: BrainContextPackage = {
      organizationId: input.organizationId,
      peerId: "demo",
      projectId: input.projectId,
      episodeId: "ep-test",
      locale: "en",
      contextVersion: 1,
      slices: { business: true, brand: true, website: true, products: false, competitors: true, goals: true, campaign: true },
      priorOutputs: [],
      priorDecisionIds: [],
      memoryRefs: [],
      assembledAt: new Date().toISOString(),
    };

    const {
      creativeGraph: _c,
      validationGraph: _v,
      strategyGraph: _s,
      approvalGranted: _a,
      ...emptyPayload
    } = input;

    const result = await memoryBrainContract.execute({
      brainId: "memory",
      context,
      payload: emptyPayload,
      idempotencyKey: "test-key",
      retryAttempt: 0,
    });

    expect(result.status).toBe("failed");
    expect(result.errorCode).toBe("missing_memory_source");
  });
});
