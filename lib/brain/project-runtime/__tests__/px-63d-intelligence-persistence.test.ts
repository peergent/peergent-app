/**
 * PX-63D — production intelligence persistence + routing proof.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { BrainLlmProvider } from "@/lib/brain/llm/provider";
import type { BrainLlmRequest } from "@/lib/brain/llm/types";
import { buildLlmUsage } from "@/lib/brain/llm/usage";
import { produceReasoningBrainGraph } from "@/lib/brain/layers/reasoning/produce-reasoning-brain-graph";
import { produceMarketingIntelligenceBrainGraph } from "@/lib/brain/layers/marketing-intelligence/produce-marketing-intelligence-brain-graph";
import { produceStrategyBrainGraph } from "@/lib/brain/layers/strategy/produce-strategy-brain-graph";
import {
  configureLayerRepositories,
  resetConfiguredLayerRepositories,
  resetLayerRepositoryStores,
} from "@/lib/brain/persistence/layer-repository-factory";
import { createSimulatedDurablePersistence } from "@/lib/brain/persistence/layer/simulated-durable-persistence";
import { resetSimulatedDurableStore, simulatedDurableStore } from "@/lib/brain/persistence/layer/simulated-durable-store";
import {
  resetActiveDurablePersistence,
  setActiveDurablePersistence,
} from "@/lib/brain/persistence/layer/active-durable-persistence";
import { hydrateProjectFromSimulatedStore } from "@/lib/brain/persistence/layer/hydration";
import { resetDefaultCompanyRepository, buildCompanyGraph, getDefaultCompanyRepository } from "@/lib/brain/layers/company";
import {
  getDefaultResearchBrainRepository,
  resetDefaultResearchBrainRepository,
  emptyResearchBrainGraph,
} from "@/lib/brain/layers/research";
import {
  getDefaultReasoningBrainRepository,
  resetDefaultReasoningBrainRepository,
  buildReasoningBrainGraph,
} from "@/lib/brain/layers/reasoning";
import {
  getDefaultMarketingIntelligenceBrainRepository,
  resetDefaultMarketingIntelligenceBrainRepository,
  buildMarketingIntelligenceBrainGraph,
} from "@/lib/brain/layers/marketing-intelligence";
import {
  getDefaultStrategyBrainRepository,
  resetDefaultStrategyBrainRepository,
  buildStrategyBrainGraph,
} from "@/lib/brain/layers/strategy";
import { getDefaultPlanningBrainRepository, resetDefaultPlanningBrainRepository } from "@/lib/brain/layers/planning";
import { executeRegistryBrainForEpisode, FIXTURE_ORG_ID } from "@/lib/brain/project-runtime";
import { createProductionBrainExecutionAdapter } from "@/lib/brain/project-runtime/production-brain-adapter";
import { INTELLIGENCE_LAYER_DOCUMENT_KIND } from "@/lib/brain/project-runtime/intelligence-persistence-contract";
import { PX63D_INTELLIGENCE_VERIFICATION_SQL } from "@/lib/brain/project-runtime/intelligence-verification-sql";
import { createReasoningBrainExecutor } from "@/lib/brain/layers/reasoning/reasoning-brain-executor";
import type { ProjectEpisodeRecord } from "@/lib/brain/project-runtime/types";
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

const ORG = FIXTURE_ORG_ID;
const ORG_B = "org-tenant-b";
const PROJECT = "proj-px63d";

function mockLlm(
  handler: (request: BrainLlmRequest) => Promise<{ rawText: string; usage: ReturnType<typeof buildLlmUsage> }>
): BrainLlmProvider {
  return {
    id: "openai",
    complete: async (request) => handler(request),
  };
}

function validReasoningPayload(evidenceIds: string[]) {
  return {
    interpretations: [
      {
        id: "int-1",
        title: "Positioning gap between speed and price",
        summary: "Competitors split on speed vs price.",
        confidence: "medium",
        importance: "high",
        supportedEvidenceIds: evidenceIds,
        claimType: "INFERENCE",
      },
    ],
    opportunities: [],
    risks: [],
    hypotheses: [],
    contradictions: [],
    unknowns: [],
    strategicImplications: [],
  };
}

function validMiPayload(evidenceIds: string[]) {
  return {
    audienceIntelligence: [],
    competitorIntelligence: [
      {
        id: "ci-1",
        summary: "Polarized competitor positioning.",
        classification: "DERIVED",
        supportedEvidenceIds: evidenceIds,
      },
    ],
    positioningIntelligence: {
      summary: "Reliability white space.",
      classification: "DERIVED",
      supportedEvidenceIds: evidenceIds,
    },
    messagingIntelligence: {
      dominantThemes: ["speed"],
      differentiationAngles: ["reliability"],
      classification: "DERIVED",
      supportedEvidenceIds: evidenceIds,
    },
    channelImplications: [],
    opportunities: [],
    risks: [],
    campaignRecommendations: [],
  };
}

function validStrategyPayload() {
  return {
    findings: [
      {
        id: "strategy-1",
        title: "Lead with reliability proof",
        summary: "Differentiate between speed and price extremes.",
        confidence: "medium",
        importance: "high",
        classification: "DERIVED",
      },
    ],
    strategicDecisions: [
      {
        id: "sd-1",
        title: "Reliability-led LinkedIn campaign",
        decisionType: "channel_focus",
        confidence: "medium",
        rationale: "White space between competitor extremes.",
      },
    ],
    tradeoffs: [],
    constraints: [],
    risks: [],
    approval: { requiresApproval: false, approvalKind: null },
  };
}

function fixtureCompanyGraph(): CompanyGraph {
  clearDemoWebsiteSnapshots();
  seedPeergentDemoWebsiteSnapshotSync();
  const profile = buildPeergentCompanyProfile("en", "2026-08-01T00:00:00.000Z");
  const website = buildDemoWebsiteSnapshotSync({
    organizationId: PEERGENT_DEMO_ORG_ID,
    url: "https://peergent.com",
  });
  const project = createMarketingCampaignProject({
    peerId: "production-peer",
    ownerLabel: "Emma",
    name: "PX-63D",
    goalLabel: "Leads",
    description: "Persistence proof",
    primaryGoalId: "generate_leads",
    setupMode: "automatic",
    approvalMode: "approval_before_publication",
    selectedChannels: ["linkedin"],
    websiteUrl: "https://peergent.com",
  });
  const campaignContext = buildCampaignContextFromCreateInput(project, {
    peerId: "production-peer",
    ownerLabel: "Emma",
    name: "PX-63D",
    goalLabel: "Leads",
    description: "Persistence proof",
    primaryGoalId: "generate_leads",
    setupMode: "automatic",
    approvalMode: "approval_before_publication",
    selectedChannels: ["linkedin"],
    websiteUrl: "https://peergent.com",
  }, "en");
  const assembly = assembleCompanyContextSync({
    organizationId: ORG,
    companyProfile: profile,
    websiteSnapshot: website,
    campaignContext,
    locale: "en",
  });
  return buildCompanyGraph({
    organizationId: ORG,
    companySnapshot: assembly.companySnapshot,
    brandGraph: collectBrandGraph({
      companySnapshot: assembly.companySnapshot,
      campaignContext,
      websiteSnapshot: website,
      upstreamOutputs: {},
    }),
    websiteSnapshot: website,
    locale: "en",
  });
}

function lineageResearchGraph(companyGraph: CompanyGraph): ResearchBrainGraph {
  const capturedAt = "2026-08-01T00:00:00.000Z";
  const base = emptyResearchBrainGraph({
    organizationId: ORG,
    projectId: PROJECT,
    companyVersion: companyGraph.version,
  });
  const evidence = [
    {
      id: "ev-e1",
      sourceType: "competitor_website" as const,
      sourceId: "competitor-a",
      url: "https://competitor-a.example",
      rawExcerpt: "Competitor A positions on speed.",
      normalizedSummary: "Competitor A positions on speed.",
      directEvidence: true,
      confidence: "high" as const,
      capturedAt,
      validationStatus: "validated" as const,
    },
    {
      id: "ev-e2",
      sourceType: "competitor_website" as const,
      sourceId: "competitor-b",
      url: "https://competitor-b.example",
      rawExcerpt: "Competitor B positions on lowest price.",
      normalizedSummary: "Competitor B positions on lowest price.",
      directEvidence: true,
      confidence: "high" as const,
      capturedAt,
      validationStatus: "validated" as const,
    },
  ];
  return {
    ...base,
    version: companyGraph.version,
    evidence,
    findings: evidence.map((ev, i) => ({
      id: `finding-${i + 1}`,
      title: ev.normalizedSummary.slice(0, 60),
      summary: ev.normalizedSummary,
      findingType: "observation" as const,
      confidence: "medium" as const,
      evidenceIds: [ev.id],
      sourceRefs: [ev.sourceId],
      createdAt: capturedAt,
    })),
    summary: { ...base.summary, evidenceCount: evidence.length, findingCount: evidence.length },
    confidence: "medium",
  };
}

function minimalEpisode(overrides?: Partial<ProjectEpisodeRecord>): ProjectEpisodeRecord {
  return {
    snapshot: {
      episodeId: "ep-px63d",
      organizationId: ORG,
      projectId: PROJECT,
      peerId: "production-peer",
      state: "reasoning",
      completedBrains: ["company", "research"],
      pendingBrains: ["reasoning"],
      retryCount: {},
      decisionIds: [],
    },
    artifacts: {
      organizationId: ORG,
      projectId: PROJECT,
      episodeId: "ep-px63d",
      correlationId: "corr-px63d",
      memoryOutputRefs: [],
      performanceObservationIds: [],
      approvalIds: [],
      learningProposalIds: [],
    },
    episodeStatus: "running",
    contextReady: true,
    sliceAvailability: { business: true, campaign: true },
    approvalSatisfied: false,
    validationApprovalPending: false,
    memoryCheckpoint1Complete: false,
    memoryCheckpoint2Complete: false,
    performanceObservationsAvailable: false,
    approvalGrantedForExecution: false,
    contextGaps: [],
    executedBrainKeys: [],
    lastError: null,
    correlationId: "corr-px63d",
    startedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    completedAt: null,
    resolvedGraphs: {},
    ...overrides,
  } as ProjectEpisodeRecord;
}

function seedUpstreamGraphs(companyGraph: CompanyGraph, researchGraph: ResearchBrainGraph) {
  getDefaultResearchBrainRepository().storeSnapshot({
    id: "rs-upstream",
    organizationId: ORG,
    projectId: PROJECT,
    campaignId: PROJECT,
    graph: researchGraph,
    outputRef: `research:${ORG}:rs-upstream`,
    storedAt: new Date().toISOString(),
  });
  getDefaultCompanyRepository().store({
    organizationId: ORG,
    outputRef: `company:${ORG}:v1`,
    graph: companyGraph,
    snapshot: {
      id: "co-1",
      organizationId: ORG,
      version: companyGraph.versionMeta.version,
      capturedAt: new Date().toISOString(),
    },
    storedAt: new Date().toISOString(),
    history: { organizationId: ORG, entries: [] },
  });
}

function handoffFromCompany(companyGraph: CompanyGraph) {
  const project = createMarketingCampaignProject({
    peerId: "production-peer",
    ownerLabel: "Emma",
    name: "PX-63D",
    goalLabel: "Leads",
    description: "Persistence proof",
    primaryGoalId: "generate_leads",
    setupMode: "automatic",
    approvalMode: "approval_before_publication",
    selectedChannels: ["linkedin"],
    websiteUrl: "https://peergent.com",
  });
  const campaignContext = buildCampaignContextFromCreateInput(project, {
    peerId: "production-peer",
    ownerLabel: "Emma",
    name: "PX-63D",
    goalLabel: "Leads",
    description: "Persistence proof",
    primaryGoalId: "generate_leads",
    setupMode: "automatic",
    approvalMode: "approval_before_publication",
    selectedChannels: ["linkedin"],
    websiteUrl: "https://peergent.com",
  }, "en");
  const profile = buildPeergentCompanyProfile("en", "2026-08-01T00:00:00.000Z");
  const website = buildDemoWebsiteSnapshotSync({
    organizationId: PEERGENT_DEMO_ORG_ID,
    url: "https://peergent.com",
  });
  const assembly = assembleCompanyContextSync({
    organizationId: ORG,
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
  return {
    companySnapshot: assembly.companySnapshot,
    brandGraph,
    campaignContext,
    priorMemories: [],
  };
}

describe("PX-63D intelligence persistence proof", () => {
  beforeEach(() => {
    resetDefaultCompanyRepository();
    resetDefaultResearchBrainRepository();
    resetDefaultReasoningBrainRepository();
    resetDefaultMarketingIntelligenceBrainRepository();
    resetDefaultStrategyBrainRepository();
    resetDefaultPlanningBrainRepository();
    resetLayerRepositoryStores();
    resetConfiguredLayerRepositories();
    resetSimulatedDurableStore();
    resetActiveDurablePersistence();
    configureLayerRepositories({ mode: "persistent_in_memory" });
    setActiveDurablePersistence(createSimulatedDurablePersistence());
    vi.stubEnv("NODE_ENV", "test");
    process.env.OPENAI_API_KEY = "test-key";
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    delete process.env.OPENAI_API_KEY;
  });

  it("A — registry Reasoning executes and persists durable layer document", async () => {
    const companyGraph = fixtureCompanyGraph();
    const researchGraph = lineageResearchGraph(companyGraph);
    seedUpstreamGraphs(companyGraph, researchGraph);

    const episode = minimalEpisode();
    const result = await executeRegistryBrainForEpisode({
      brainId: "reasoning",
      episode,
      contextHandoff: handoffFromCompany(companyGraph),
      locale: "en",
      idempotencyKey: "rsn-px63d-a",
    });

    expect(result.status).toBe("completed");
    const docs = simulatedDurableStore.listDocuments(ORG, PROJECT);
    const reasoningDoc = docs.find(
      (d) => d.brain_id === "reasoning" && d.document_kind === INTELLIGENCE_LAYER_DOCUMENT_KIND.reasoning
    );
    expect(reasoningDoc).toBeTruthy();
    expect(reasoningDoc!.project_id).toBe(PROJECT);
    expect(reasoningDoc!.organization_id).toBe(ORG);
    expect(
      (reasoningDoc!.payload as { graph: { providerMeta?: { providerMode?: string } } }).graph.providerMeta?.providerMode
    ).toBe("deterministic_fallback");
    expect(episode.resolvedGraphs.reasoningBrainGraph?.providerMeta?.providerMode).toBe("deterministic_fallback");

    const audit = simulatedDurableStore
      .listEvents(PROJECT)
      .find((e) => e.type === "intelligence_llm_execution" && e.brainId === "reasoning");
    expect(audit?.metadata?.providerMode).toBe("deterministic_fallback");
  });

  it("B/C — MI and Strategy registry execution persist providerMeta", async () => {
    const companyGraph = fixtureCompanyGraph();
    const researchGraph = lineageResearchGraph(companyGraph);
    seedUpstreamGraphs(companyGraph, researchGraph);

    const reasoningGraph = await produceReasoningBrainGraph({
      organizationId: ORG,
      projectId: PROJECT,
      companyGraph,
      researchGraph,
      projectObjective: "Win positioning",
      peerId: "production-peer",
      llmProvider: mockLlm(async () => ({
        rawText: JSON.stringify(validReasoningPayload(["ev-e1", "ev-e2"])),
        usage: buildLlmUsage({ provider: "openai", model: "gpt-test", inputTokens: 50, outputTokens: 80, latencyMs: 20 }),
      })),
    });
    getDefaultReasoningBrainRepository().storeSnapshot({
      id: "rsn-seed",
      organizationId: ORG,
      projectId: PROJECT,
      campaignId: PROJECT,
      graph: reasoningGraph,
      outputRef: `reasoning:${ORG}:rsn-seed`,
      storedAt: new Date().toISOString(),
    });

    const miEpisode = minimalEpisode({
      snapshot: {
        ...minimalEpisode().snapshot,
        state: "marketing_intelligence",
        completedBrains: ["company", "research", "reasoning"],
        pendingBrains: ["marketing_intelligence"],
      },
      resolvedGraphs: { reasoningBrainGraph: reasoningGraph, researchBrainGraph: researchGraph },
    });

    const miResult = await executeRegistryBrainForEpisode({
      brainId: "marketing_intelligence",
      episode: miEpisode,
      contextHandoff: handoffFromCompany(companyGraph),
      locale: "en",
      idempotencyKey: "mi-px63d-b",
    });
    expect(miResult.status).toBe("completed");

    const miDoc = simulatedDurableStore
      .listDocuments(ORG, PROJECT)
      .find((d) => d.brain_id === "marketing_intelligence");
    expect(miDoc?.payload).toBeTruthy();
    expect(
      (miDoc!.payload as { graph: { providerMeta?: { providerMode?: string } } }).graph.providerMeta?.providerMode
    ).toBe("deterministic_fallback");

    const miGraph =
      getDefaultMarketingIntelligenceBrainRepository().getLatestSnapshot({
        organizationId: ORG,
        projectId: PROJECT,
      })!.graph;

    getDefaultMarketingIntelligenceBrainRepository().storeSnapshot({
      id: "mi-seed",
      organizationId: ORG,
      projectId: PROJECT,
      campaignId: PROJECT,
      graph: miGraph,
      outputRef: `mi:${ORG}:mi-seed`,
      storedAt: new Date().toISOString(),
    });

    const strategyEpisode = minimalEpisode({
      snapshot: {
        ...minimalEpisode().snapshot,
        state: "strategy",
        completedBrains: ["company", "research", "reasoning", "marketing_intelligence"],
        pendingBrains: ["strategy"],
      },
      resolvedGraphs: {
        reasoningBrainGraph: reasoningGraph,
        researchBrainGraph: researchGraph,
        marketingIntelligenceBrainGraph: miGraph,
      },
    });

    const strategyResult = await executeRegistryBrainForEpisode({
      brainId: "strategy",
      episode: strategyEpisode,
      contextHandoff: handoffFromCompany(companyGraph),
      locale: "en",
      idempotencyKey: "str-px63d-c",
    });
    expect(["completed", "waiting_approval"]).toContain(strategyResult.status);

    const strategyDoc = simulatedDurableStore.listDocuments(ORG, PROJECT).find((d) => d.brain_id === "strategy");
    expect(strategyDoc?.project_id).toBe(PROJECT);
    expect(
      (strategyDoc!.payload as { graph: { providerMeta?: { providerMode?: string } } }).graph.providerMeta?.providerMode
    ).toBe("deterministic_fallback");
    expect(strategyEpisode.resolvedGraphs.strategyBrainGraph?.providerMeta?.providerMode).toBe(
      "deterministic_fallback"
    );
  });

  it("G — cold reload restores intelligence graphs with providerMeta", async () => {
    const companyGraph = fixtureCompanyGraph();
    const researchGraph = lineageResearchGraph(companyGraph);
    const reasoningGraph = buildReasoningBrainGraph({
      organizationId: ORG,
      projectId: PROJECT,
      companyGraph,
      researchGraph,
      projectObjective: "Cold start",
      peerId: "production-peer",
    });
    reasoningGraph.providerMeta = {
      providerMode: "live_llm",
      fallbackUsed: false,
      providerId: "openai",
      modelId: "gpt-test",
      generatedAt: reasoningGraph.updatedAt,
    };

    getDefaultReasoningBrainRepository().storeSnapshot({
      id: "rsn-cold",
      organizationId: ORG,
      projectId: PROJECT,
      campaignId: PROJECT,
      graph: reasoningGraph,
      outputRef: `reasoning:${ORG}:rsn-cold`,
      storedAt: new Date().toISOString(),
    });

    const episode = minimalEpisode();
    await executeRegistryBrainForEpisode({
      brainId: "reasoning",
      episode,
      contextHandoff: handoffFromCompany(companyGraph),
      locale: "en",
      idempotencyKey: "reuse-cold",
    });

    resetLayerRepositoryStores();
    resetConfiguredLayerRepositories();
    configureLayerRepositories({ mode: "persistent_in_memory" });

    expect(
      getDefaultReasoningBrainRepository().getLatestSnapshot({ organizationId: ORG, projectId: PROJECT })
    ).toBeNull();

    hydrateProjectFromSimulatedStore({ organizationId: ORG, projectId: PROJECT });

    const restored = getDefaultReasoningBrainRepository().getLatestSnapshot({
      organizationId: ORG,
      projectId: PROJECT,
    });
    expect(restored?.graph.providerMeta?.providerMode).toBe("live_llm");
    expect(restored?.outputRef).toBe(`reasoning:${ORG}:rsn-cold`);
  });

  it("H — Planning receives restored Strategy graph after cold reload", async () => {
    const companyGraph = fixtureCompanyGraph();
    const researchGraph = lineageResearchGraph(companyGraph);
    const reasoningGraph = buildReasoningBrainGraph({
      organizationId: ORG,
      projectId: PROJECT,
      companyGraph,
      researchGraph,
      projectObjective: "Planning handoff",
      peerId: "production-peer",
    });
    reasoningGraph.providerMeta = {
      providerMode: "live_llm",
      fallbackUsed: false,
      providerId: "openai",
      modelId: "gpt-test",
      generatedAt: reasoningGraph.updatedAt,
    };
    const miGraph = buildMarketingIntelligenceBrainGraph({
      organizationId: ORG,
      projectId: PROJECT,
      companyGraph,
      researchGraph,
      reasoningGraph,
      projectObjective: "Planning handoff",
      peerId: "production-peer",
    });
    miGraph.providerMeta = {
      providerMode: "live_llm",
      fallbackUsed: false,
      providerId: "openai",
      modelId: "gpt-test",
      generatedAt: miGraph.updatedAt,
    };
    const strategyGraph = buildStrategyBrainGraph({
      organizationId: ORG,
      projectId: PROJECT,
      companyGraph,
      researchGraph,
      reasoningGraph,
      marketingIntelligenceGraph: miGraph,
      projectObjective: "Planning handoff",
      peerId: "production-peer",
    });
    strategyGraph.providerMeta = {
      providerMode: "live_llm",
      fallbackUsed: false,
      providerId: "openai",
      modelId: "gpt-test",
      generatedAt: strategyGraph.updatedAt,
    };

    getDefaultStrategyBrainRepository().storeSnapshot({
      id: "str-plan",
      organizationId: ORG,
      projectId: PROJECT,
      campaignId: PROJECT,
      graph: strategyGraph,
      outputRef: `strategy:${ORG}:str-plan`,
      storedAt: new Date().toISOString(),
    });

    const episode = minimalEpisode({
      snapshot: {
        ...minimalEpisode().snapshot,
        state: "strategy",
        completedBrains: ["company", "research", "reasoning", "marketing_intelligence"],
        pendingBrains: ["strategy"],
      },
    });

    await executeRegistryBrainForEpisode({
      brainId: "strategy",
      episode,
      contextHandoff: handoffFromCompany(companyGraph),
      locale: "en",
      idempotencyKey: "str-plan-handoff",
    });

    resetLayerRepositoryStores();
    resetConfiguredLayerRepositories();
    configureLayerRepositories({ mode: "persistent_in_memory" });
    hydrateProjectFromSimulatedStore({ organizationId: ORG, projectId: PROJECT });

    const restoredStrategy = getDefaultStrategyBrainRepository().getLatestSnapshot({
      organizationId: ORG,
      projectId: PROJECT,
    });
    expect(restoredStrategy?.graph.providerMeta?.providerMode).toBe("live_llm");
    expect(restoredStrategy?.outputRef).toBe(`strategy:${ORG}:str-plan`);

    seedUpstreamGraphs(companyGraph, researchGraph);
    getDefaultReasoningBrainRepository().storeSnapshot({
      id: "rsn-plan",
      organizationId: ORG,
      projectId: PROJECT,
      campaignId: PROJECT,
      graph: reasoningGraph,
      outputRef: `reasoning:${ORG}:rsn-plan`,
      storedAt: new Date().toISOString(),
    });
    getDefaultMarketingIntelligenceBrainRepository().storeSnapshot({
      id: "mi-plan",
      organizationId: ORG,
      projectId: PROJECT,
      campaignId: PROJECT,
      graph: miGraph,
      outputRef: `mi:${ORG}:mi-plan`,
      storedAt: new Date().toISOString(),
    });

    const planningEpisode = minimalEpisode({
      snapshot: {
        ...minimalEpisode().snapshot,
        state: "planning",
        completedBrains: ["company", "research", "reasoning", "marketing_intelligence", "strategy"],
        pendingBrains: ["planning"],
      },
      resolvedGraphs: {},
    });

    const resolved = (
      await import("@/lib/brain/project-runtime/brain-output-resolver")
    ).resolveBrainOutputs({
      organizationId: ORG,
      projectId: PROJECT,
      artifacts: planningEpisode.artifacts,
      episodeResolvedGraphs: planningEpisode.resolvedGraphs,
    });

    expect(resolved.strategyBrainGraph?.providerMeta?.providerMode).toBe("live_llm");
    expect(resolved.companyGraph).toBeTruthy();
  });

  it("I — graph without providerMeta cannot complete in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const companyGraph = fixtureCompanyGraph();
    const researchGraph = lineageResearchGraph(companyGraph);
    const badGraph = buildReasoningBrainGraph({
      organizationId: ORG,
      projectId: PROJECT,
      companyGraph,
      researchGraph,
      projectObjective: "Bad graph",
      peerId: "production-peer",
    });
    delete (badGraph as { providerMeta?: unknown }).providerMeta;

    getDefaultReasoningBrainRepository().storeSnapshot({
      id: "rsn-bad",
      organizationId: ORG,
      projectId: PROJECT,
      campaignId: PROJECT,
      graph: badGraph,
      outputRef: `reasoning:${ORG}:rsn-bad`,
      storedAt: new Date().toISOString(),
    });

    const episode = minimalEpisode({
      resolvedGraphs: { reasoningBrainGraph: badGraph },
    });

    const result = await executeRegistryBrainForEpisode({
      brainId: "reasoning",
      episode,
      contextHandoff: handoffFromCompany(companyGraph),
      locale: "en",
      idempotencyKey: "bad-graph",
    });

    expect(result.status).toBe("failed");
    expect(result.errorCode).toBe("intelligence_persistence_contract_violation");
  });

  it("J — missing OpenAI config fails explicitly", async () => {
    vi.stubEnv("NODE_ENV", "production");
    delete process.env.OPENAI_API_KEY;
    const companyGraph = fixtureCompanyGraph();
    const researchGraph = lineageResearchGraph(companyGraph);
    const executor = createReasoningBrainExecutor();
    const result = await executor.executeFromContract({
      brainId: "reasoning",
      context: {
        organizationId: ORG,
        projectId: PROJECT,
        episodeId: "ep-1",
        locale: "en",
        sliceAvailability: { business: true, campaign: true },
        priorOutputs: {},
      },
      payload: {
        companyGraph,
        researchBrainGraph: researchGraph,
        projectObjective: "Win positioning",
        peerId: "production-peer",
      },
    });
    expect(result.status).toBe("failed");
    expect(result.errorCode).toBe("intelligence_llm_unavailable");
  });

  it("K — graph reuse persists audit with graphReused and does not require second LLM snapshot version", async () => {
    const companyGraph = fixtureCompanyGraph();
    const researchGraph = lineageResearchGraph(companyGraph);
    const reasoningGraph = buildReasoningBrainGraph({
      organizationId: ORG,
      projectId: PROJECT,
      companyGraph,
      researchGraph,
      projectObjective: "Reuse",
      peerId: "production-peer",
    });
    reasoningGraph.providerMeta = {
      providerMode: "live_llm",
      fallbackUsed: false,
      providerId: "openai",
      modelId: "gpt-test",
      generatedAt: reasoningGraph.updatedAt,
    };

    getDefaultReasoningBrainRepository().storeSnapshot({
      id: "rsn-reuse",
      organizationId: ORG,
      projectId: PROJECT,
      campaignId: PROJECT,
      graph: reasoningGraph,
      outputRef: `reasoning:${ORG}:rsn-reuse`,
      storedAt: new Date().toISOString(),
    });

    const episode = minimalEpisode({
      resolvedGraphs: { reasoningBrainGraph: reasoningGraph },
    });

    await executeRegistryBrainForEpisode({
      brainId: "reasoning",
      episode,
      contextHandoff: handoffFromCompany(companyGraph),
      locale: "en",
      idempotencyKey: "reuse-k",
    });

    const audit = simulatedDurableStore
      .listEvents(PROJECT)
      .filter((e) => e.type === "intelligence_llm_execution" && e.brainId === "reasoning");
    expect(audit.some((e) => e.metadata?.graphReused === true)).toBe(true);
    expect(getDefaultReasoningBrainRepository().getLatestSnapshot({ organizationId: ORG, projectId: PROJECT })?.id).toBe(
      "rsn-reuse"
    );
  });

  it("L — multi-tenant isolation on durable layer documents", async () => {
    const companyGraph = fixtureCompanyGraph();
    const researchGraph = lineageResearchGraph(companyGraph);
    seedUpstreamGraphs(companyGraph, researchGraph);

    const reasoningGraph = buildReasoningBrainGraph({
      organizationId: ORG_B,
      projectId: "proj-foreign",
      companyGraph,
      researchGraph,
      projectObjective: "Foreign",
      peerId: "production-peer",
    });
    reasoningGraph.providerMeta = {
      providerMode: "live_llm",
      fallbackUsed: false,
      providerId: "openai",
      modelId: "gpt-test",
      generatedAt: reasoningGraph.updatedAt,
    };
    getDefaultReasoningBrainRepository().storeSnapshot({
      id: "rsn-foreign",
      organizationId: ORG_B,
      projectId: "proj-foreign",
      campaignId: "proj-foreign",
      graph: reasoningGraph,
      outputRef: `reasoning:${ORG_B}:rsn-foreign`,
      storedAt: new Date().toISOString(),
    });

    const episode = minimalEpisode();
    await executeRegistryBrainForEpisode({
      brainId: "reasoning",
      episode,
      contextHandoff: handoffFromCompany(companyGraph),
      locale: "en",
      idempotencyKey: "tenant-l",
    });

    const localDoc = simulatedDurableStore.listDocuments(ORG, PROJECT).find((d) => d.brain_id === "reasoning");
    expect(localDoc?.organization_id).toBe(ORG);
    expect(localDoc?.project_id).toBe(PROJECT);
    expect(simulatedDurableStore.listDocuments(ORG_B, PROJECT)).toHaveLength(0);
    expect(simulatedDurableStore.listDocuments(ORG, "proj-foreign")).toHaveLength(0);
  });

  it("N — SQL verification fixture documents all three intelligence brains", () => {
    expect(PX63D_INTELLIGENCE_VERIFICATION_SQL).toContain("reasoning");
    expect(PX63D_INTELLIGENCE_VERIFICATION_SQL).toContain("marketing_intelligence");
    expect(PX63D_INTELLIGENCE_VERIFICATION_SQL).toContain("strategy");
    expect(PX63D_INTELLIGENCE_VERIFICATION_SQL).toContain("provider_mode");
    expect(PX63D_INTELLIGENCE_VERIFICATION_SQL).toContain("intelligence_llm_execution");
  });

  it("production adapter routes strategy through registry path", async () => {
    const adapter = createProductionBrainExecutionAdapter({
      peerId: "production-peer",
      project: { id: PROJECT } as never,
      domainInput: { peerId: "production-peer", organizationId: ORG } as never,
    });

    const companyGraph = fixtureCompanyGraph();
    const researchGraph = lineageResearchGraph(companyGraph);
    seedUpstreamGraphs(companyGraph, researchGraph);

    const reasoningGraph = buildReasoningBrainGraph({
      organizationId: ORG,
      projectId: PROJECT,
      companyGraph,
      researchGraph,
      projectObjective: "Adapter routing",
      peerId: "production-peer",
    });
    reasoningGraph.providerMeta = {
      providerMode: "live_llm",
      fallbackUsed: false,
      providerId: "openai",
      modelId: "gpt-test",
      generatedAt: reasoningGraph.updatedAt,
    };
    getDefaultReasoningBrainRepository().storeSnapshot({
      id: "rsn-adapt",
      organizationId: ORG,
      projectId: PROJECT,
      campaignId: PROJECT,
      graph: reasoningGraph,
      outputRef: `reasoning:${ORG}:rsn-adapt`,
      storedAt: new Date().toISOString(),
    });

    const miGraph = buildMarketingIntelligenceBrainGraph({
      organizationId: ORG,
      projectId: PROJECT,
      companyGraph,
      researchGraph,
      reasoningGraph,
      projectObjective: "Adapter routing",
      peerId: "production-peer",
    });
    miGraph.providerMeta = {
      providerMode: "live_llm",
      fallbackUsed: false,
      providerId: "openai",
      modelId: "gpt-test",
      generatedAt: miGraph.updatedAt,
    };
    getDefaultMarketingIntelligenceBrainRepository().storeSnapshot({
      id: "mi-adapt",
      organizationId: ORG,
      projectId: PROJECT,
      campaignId: PROJECT,
      graph: miGraph,
      outputRef: `mi:${ORG}:mi-adapt`,
      storedAt: new Date().toISOString(),
    });

    const episode = minimalEpisode({
      snapshot: {
        ...minimalEpisode().snapshot,
        state: "strategy",
        completedBrains: ["company", "research", "reasoning", "marketing_intelligence"],
        pendingBrains: ["strategy"],
      },
      resolvedGraphs: {
        reasoningBrainGraph: reasoningGraph,
        researchBrainGraph: researchGraph,
        marketingIntelligenceBrainGraph: miGraph,
      },
    });

    const result = await adapter.execute({
      brainId: "strategy",
      episode,
      contextHandoff: handoffFromCompany(companyGraph),
      locale: "en",
      idempotencyKey: "adapter-strategy",
    });

    expect(["completed", "waiting_approval"]).toContain(result.status);
    expect(simulatedDurableStore.listDocuments(ORG, PROJECT).some((d) => d.brain_id === "strategy")).toBe(true);
  });
});
