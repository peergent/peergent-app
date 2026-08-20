/**
 * PX-63 — production-real Research → Reasoning → Marketing Intelligence tests.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  configureLayerRepositories,
  resetConfiguredLayerRepositories,
  resetLayerRepositoryStores,
} from "@/lib/brain/persistence/layer-repository-factory";
import { createSimulatedDurablePersistence } from "@/lib/brain/persistence/layer/simulated-durable-persistence";
import { resetSimulatedDurableStore } from "@/lib/brain/persistence/layer/simulated-durable-store";
import {
  resetActiveDurablePersistence,
  setActiveDurablePersistence,
} from "@/lib/brain/persistence/layer/active-durable-persistence";
import { resetDefaultCompanyRepository } from "@/lib/brain/layers/company";
import {
  getDefaultResearchBrainRepository,
  resetDefaultResearchBrainRepository,
  resetDefaultResearchProviderRegistry,
} from "@/lib/brain/layers/research";
import {
  getDefaultReasoningBrainRepository,
  resetDefaultReasoningBrainRepository,
} from "@/lib/brain/layers/reasoning";
import {
  getDefaultMarketingIntelligenceBrainRepository,
  resetDefaultMarketingIntelligenceBrainRepository,
} from "@/lib/brain/layers/marketing-intelligence";
import { resetDefaultStrategyBrainRepository } from "@/lib/brain/layers/strategy";
import { resetDefaultPlanningBrainRepository } from "@/lib/brain/layers/planning";
import { resetDefaultCreativeRepository } from "@/lib/brain/layers/creative/creative-repository";
import { resetDefaultValidationRepository } from "@/lib/brain/layers/validation/validation-repository";
import { resetDefaultMemoryRepository } from "@/lib/brain/layers/memory";
import { resetDefaultExecutionRepository } from "@/lib/brain/layers/execution";
import { resetDefaultLearningBrainRepository } from "@/lib/brain/layers/learning";
import {
  createProjectEpisodeRunner,
  executeRegistryBrainForEpisode,
  FIXTURE_ORG_ID,
  getDefaultProjectEpisodeRepository,
  isPipelineGraphBrain,
  resetDefaultProjectEpisodeRepository,
  createProductionBrainExecutionAdapter,
  resolveEpisodeStepBudget,
  assertAutomaticCampaignReachedPublicationBoundary,
} from "@/lib/brain/project-runtime";
import {
  assertProductionIntelligencePipelineHealthy,
  detectIntelligencePipelinePlaceholderViolations,
  PLACEHOLDER_MARKET_UNDERSTANDING_VALUE,
} from "@/lib/brain/project-runtime/intelligence-pipeline-invariants";
import { resolveEpisodeIntelligenceGraphs } from "@/lib/brain/integration/resolve-episode-intelligence-graphs";
import { executeDeterministicCapability } from "@/lib/brain/providers/deterministic-provider";
import { createMarketingCampaignProject } from "@/lib/peer-experience/marketing/projects/project-engine";
import type { MarketingProject } from "@/lib/peer-experience/marketing/projects/types";
import { buildCampaignContextFromCreateInput } from "@/lib/office/campaign/campaign-context";
import {
  buildPeergentCompanyProfile,
  buildDemoWebsiteSnapshotSync,
  assembleCompanyContextSync,
  collectBrandGraph,
  clearDemoWebsiteSnapshots,
  seedPeergentDemoWebsiteSnapshotSync,
  PEERGENT_DEMO_ORG_ID,
} from "@/lib/brain";
import type { ProjectEpisodeRecord } from "@/lib/brain/project-runtime/types";
import { resetExternalWebResearchFetchCache } from "@/lib/brain/layers/research/providers/external-web-research-provider";

vi.mock("@/lib/brain/layers/research/providers/external-web-research-provider", async (importOriginal) => {
  const original = await importOriginal<
    typeof import("@/lib/brain/layers/research/providers/external-web-research-provider")
  >();
  return {
    ...original,
    fetchExternalResearchTargets: vi.fn(original.fetchExternalResearchTargets),
  };
});

import { fetchExternalResearchTargets } from "@/lib/brain/layers/research/providers/external-web-research-provider";

const fetchMock = vi.mocked(fetchExternalResearchTargets);

const PEER = "demo";

function resetAll() {
  resetDefaultCompanyRepository();
  resetDefaultResearchBrainRepository();
  resetDefaultResearchProviderRegistry();
  resetDefaultReasoningBrainRepository();
  resetDefaultMarketingIntelligenceBrainRepository();
  resetDefaultStrategyBrainRepository();
  resetDefaultPlanningBrainRepository();
  resetDefaultCreativeRepository();
  resetDefaultValidationRepository();
  resetDefaultMemoryRepository();
  resetDefaultExecutionRepository();
  resetDefaultLearningBrainRepository();
  resetDefaultProjectEpisodeRepository();
  resetLayerRepositoryStores();
  resetConfiguredLayerRepositories();
  resetActiveDurablePersistence();
  resetExternalWebResearchFetchCache();
}

function automaticProject(): MarketingProject {
  return createMarketingCampaignProject({
    peerId: PEER,
    ownerLabel: "Emma",
    name: "PX-63 Intelligence Campaign",
    goalLabel: "Leads",
    description: "Production-real intelligence pipeline verification.",
    primaryGoalId: "generate_leads",
    setupMode: "automatic",
    approvalMode: "approval_before_publication",
    selectedChannels: ["linkedin"],
    websiteUrl: "https://peergent.com",
    competitors: [
      { name: "Competitor Alpha", url: "https://competitor-alpha.example" },
      { name: "Competitor Beta", url: "https://competitor-beta.example" },
    ],
  });
}

function domainInput(project: MarketingProject) {
  return {
    peerId: PEER,
    organizationId: FIXTURE_ORG_ID,
    userName: "",
    peerName: "Emma",
    campaignTitle: project.title,
    generating: null,
    generatingActivity: null,
    understanding: null,
    strategy: null,
    plan: null,
    drafts: [],
    publicationPackages: [],
    activityFeed: [],
    workUnits: [],
    projects: [project],
    responsibilities: [],
    automations: [],
    connections: [],
  };
}

function minimalEpisode(projectId: string): ProjectEpisodeRecord {
  return {
    snapshot: {
      episodeId: "ep-px63",
      organizationId: FIXTURE_ORG_ID,
      projectId,
      peerId: PEER,
      state: "researching",
      completedBrains: ["company"],
      pendingBrains: ["research", "reasoning", "marketing_intelligence", "strategy"],
      retryCount: {},
      decisionIds: [],
    },
    artifacts: {
      organizationId: FIXTURE_ORG_ID,
      projectId,
      episodeId: "ep-px63",
      correlationId: "corr-px63",
      memoryOutputRefs: [],
      performanceObservationIds: [],
      approvalIds: [],
      learningProposalIds: [],
    },
    episodeStatus: "running",
    contextReady: true,
    sliceAvailability: {
      business: true,
      brand: true,
      website: true,
      products: true,
      competitors: true,
      goals: true,
      campaign: true,
    },
    approvalSatisfied: false,
    validationApprovalPending: false,
    memoryCheckpoint1Complete: false,
    memoryCheckpoint2Complete: false,
    performanceObservationsAvailable: false,
    approvalGrantedForExecution: false,
    contextGaps: [],
    executedBrainKeys: [],
    lastError: null,
    correlationId: "corr-px63",
    startedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    completedAt: null,
    resolvedGraphs: {},
  } as ProjectEpisodeRecord;
}

function campaignHandoff(project: MarketingProject) {
  const campaignContext = buildCampaignContextFromCreateInput(project, {
    peerId: PEER,
    ownerLabel: "Emma",
    name: project.title,
    goalLabel: "Leads",
    description: project.description ?? "",
    primaryGoalId: "generate_leads",
    setupMode: "automatic",
    approvalMode: "approval_before_publication",
    selectedChannels: ["linkedin"],
    websiteUrl: "https://peergent.com",
    competitors: [
      { name: "Competitor Alpha", url: "https://competitor-alpha.example" },
      { name: "Competitor Beta", url: "https://competitor-beta.example" },
    ],
  }, "en");

  clearDemoWebsiteSnapshots();
  seedPeergentDemoWebsiteSnapshotSync();
  const profile = buildPeergentCompanyProfile("en", "2026-08-01T00:00:00.000Z");
  const website = buildDemoWebsiteSnapshotSync({
    organizationId: PEERGENT_DEMO_ORG_ID,
    url: "https://peergent.com",
  });
  const assembly = assembleCompanyContextSync({
    organizationId: FIXTURE_ORG_ID,
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

describe("PX-63 intelligence pipeline", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    resetSimulatedDurableStore();
    resetAll();
    configureLayerRepositories({ mode: "persistent_in_memory" });
    setActiveDurablePersistence(createSimulatedDurablePersistence());
    fetchMock.mockReset();
  });

  afterEach(() => {
    resetSimulatedDurableStore();
    resetAll();
  });

  it("A — research/reasoning/MI route through registry pipeline graph brains", () => {
    expect(isPipelineGraphBrain("research")).toBe(true);
    expect(isPipelineGraphBrain("reasoning")).toBe(true);
    expect(isPipelineGraphBrain("marketing_intelligence")).toBe(true);
    expect(isPipelineGraphBrain("strategy")).toBe(true);
  });

  it("B — research returns evidence with provenance when external fetch succeeds", async () => {
    vi.stubEnv("NODE_ENV", "development");
    resetDefaultResearchProviderRegistry();
    fetchMock.mockResolvedValueOnce({
      items: [
        {
          sourceType: "competitor_website",
          identity: "https://competitor-alpha.example",
          url: "https://competitor-alpha.example",
          label: "Competitor Alpha",
          rawExcerpt: "Alpha offers logistics automation for SMBs.",
          normalizedSummary: "Competitor Alpha: logistics automation",
          directEvidence: true,
          capturedAt: "2026-08-01T00:00:00.000Z",
        },
      ],
      requestsUsed: 1,
      pagesUsed: 1,
      costUsed: 1,
      providerId: "external_web_fetch",
      fetchFailures: 0,
    });

    const project = automaticProject();
    const handoff = campaignHandoff(project);
    const episode = minimalEpisode(project.id);

    const result = await executeRegistryBrainForEpisode({
      brainId: "research",
      episode,
      contextHandoff: handoff,
      locale: "en",
      idempotencyKey: "px63-research",
    });

    expect(result.status).toBe("completed");
    const stored = getDefaultResearchBrainRepository().getLatestSnapshot({
      organizationId: FIXTURE_ORG_ID,
      projectId: project.id,
    })?.graph;
    expect(stored?.evidence.length).toBeGreaterThan(0);
    const external = stored!.evidence.find((e) => e.url?.includes("competitor-alpha"));
    expect(external).toBeTruthy();
    expect(external?.url).toBe("https://competitor-alpha.example");
    expect(external?.capturedAt).toBeTruthy();
    expect(external?.directEvidence).toBe(true);
    expect(external?.sourceType).toBe("competitor_website");
    expect(stored!.findings.length).toBeGreaterThan(0);
    expect(
      stored!.findings.some((f) =>
        ["fact", "observation", "inference", "unknown"].includes(f.findingType)
      )
    ).toBe(true);
  });

  it("C — competitor website evidence reaches ResearchBrainGraph", async () => {
    vi.stubEnv("NODE_ENV", "development");
    resetDefaultResearchProviderRegistry();
    fetchMock.mockResolvedValueOnce({
      items: [
        {
          sourceType: "competitor_website",
          identity: "https://competitor-beta.example",
          url: "https://competitor-beta.example",
          label: "Competitor Beta homepage",
          rawExcerpt: "Beta — enterprise marketing suite.",
          normalizedSummary: "Competitor Beta: enterprise marketing suite",
          directEvidence: true,
          capturedAt: "2026-08-01T00:00:00.000Z",
        },
      ],
      requestsUsed: 1,
      pagesUsed: 1,
      costUsed: 1,
      providerId: "external_web_fetch",
      fetchFailures: 0,
    });

    const project = automaticProject();
    const episode = minimalEpisode(project.id);
    const handoff = campaignHandoff(project);

    const researchResult = await executeRegistryBrainForEpisode({
      brainId: "research",
      episode,
      contextHandoff: handoff,
      locale: "en",
      idempotencyKey: "px63-registry-research",
    });

    expect(researchResult.status).toBe("completed");
    const graph = getDefaultResearchBrainRepository().getLatestSnapshot({
      organizationId: FIXTURE_ORG_ID,
      projectId: project.id,
    })?.graph;
    expect(graph?.evidence.some((e) => e.url === "https://competitor-beta.example")).toBe(true);
  });

  it("D/E — ReasoningBrainGraph consumes ResearchBrainGraph and retains evidence refs", async () => {
    fetchMock.mockResolvedValueOnce({
      items: [
        {
          sourceType: "company_website",
          identity: "https://peergent.com",
          url: "https://peergent.com",
          label: "Peergent",
          rawExcerpt: "AI workforce for marketing teams.",
          normalizedSummary: "Peergent: AI workforce",
          directEvidence: true,
          capturedAt: "2026-08-01T00:00:00.000Z",
        },
      ],
      requestsUsed: 1,
      pagesUsed: 1,
      costUsed: 1,
      providerId: "external_web_fetch",
      fetchFailures: 0,
    });

    const project = automaticProject();
    const episode = minimalEpisode(project.id);
    const handoff = campaignHandoff(project);

    await executeRegistryBrainForEpisode({
      brainId: "research",
      episode,
      contextHandoff: handoff,
      locale: "en",
      idempotencyKey: "px63-r",
    });

    const reasoningResult = await executeRegistryBrainForEpisode({
      brainId: "reasoning",
      episode,
      contextHandoff: handoff,
      locale: "en",
      idempotencyKey: "px63-reason",
    });

    expect(reasoningResult.status).toBe("completed");
    const reasoning = getDefaultReasoningBrainRepository().getLatestSnapshot({
      organizationId: FIXTURE_ORG_ID,
      projectId: project.id,
    })?.graph;
    expect(reasoning).toBeTruthy();
    expect(reasoning!.researchGraphVersion).toBeTruthy();
    const research = getDefaultResearchBrainRepository().getLatestSnapshot({
      organizationId: FIXTURE_ORG_ID,
      projectId: project.id,
    })?.graph;
    const evidenceIds = new Set(research!.evidence.map((e) => e.id));
    const hasRef = reasoning!.interpretations.some((i) =>
      i.supportedEvidence.some((ref) => evidenceIds.has(ref))
    );
    expect(hasRef || reasoning!.hypotheses.some((h) => h.supportingEvidence.length > 0)).toBe(true);
  });

  it("F — MarketingIntelligenceBrainGraph consumes Research + Reasoning", async () => {
    const project = automaticProject();
    const episode = minimalEpisode(project.id);
    const handoff = campaignHandoff(project);

    await executeRegistryBrainForEpisode({
      brainId: "research",
      episode,
      contextHandoff: handoff,
      locale: "en",
      idempotencyKey: "px63-r2",
    });
    await executeRegistryBrainForEpisode({
      brainId: "reasoning",
      episode,
      contextHandoff: handoff,
      locale: "en",
      idempotencyKey: "px63-reason2",
    });

    const miResult = await executeRegistryBrainForEpisode({
      brainId: "marketing_intelligence",
      episode,
      contextHandoff: handoff,
      locale: "en",
      idempotencyKey: "px63-mi",
    });

    expect(miResult.status).toBe("completed");
    const mi = getDefaultMarketingIntelligenceBrainRepository().getLatestSnapshot({
      organizationId: FIXTURE_ORG_ID,
      projectId: project.id,
    })?.graph;
    expect(mi).toBeTruthy();
    expect(mi!.researchGraphVersion).toBeTruthy();
    expect(mi!.reasoningGraphVersion).toBeTruthy();
  });

  it("G — Strategy receives upstream graphs via episode intelligence resolver", async () => {
    const project = automaticProject();
    const episode = minimalEpisode(project.id);
    const handoff = campaignHandoff(project);

    await executeRegistryBrainForEpisode({
      brainId: "research",
      episode,
      contextHandoff: handoff,
      locale: "en",
      idempotencyKey: "px63-r3",
    });
    await executeRegistryBrainForEpisode({
      brainId: "reasoning",
      episode,
      contextHandoff: handoff,
      locale: "en",
      idempotencyKey: "px63-reason3",
    });
    await executeRegistryBrainForEpisode({
      brainId: "marketing_intelligence",
      episode,
      contextHandoff: handoff,
      locale: "en",
      idempotencyKey: "px63-mi3",
    });

    const repo = getDefaultProjectEpisodeRepository();
    const stored = repo.get({ organizationId: FIXTURE_ORG_ID, projectId: project.id }) ?? episode;
    stored.resolvedGraphs = {
      researchBrainGraph: getDefaultResearchBrainRepository().getLatestSnapshot({
        organizationId: FIXTURE_ORG_ID,
        projectId: project.id,
      })?.graph,
      reasoningBrainGraph: getDefaultReasoningBrainRepository().getLatestSnapshot({
        organizationId: FIXTURE_ORG_ID,
        projectId: project.id,
      })?.graph,
      marketingIntelligenceBrainGraph:
        getDefaultMarketingIntelligenceBrainRepository().getLatestSnapshot({
          organizationId: FIXTURE_ORG_ID,
          projectId: project.id,
        })?.graph,
    };
    repo.save(stored);

    const bundle = resolveEpisodeIntelligenceGraphs(stored);
    expect(bundle.researchBrainGraph).toBeTruthy();
    expect(bundle.reasoningBrainGraph).toBeTruthy();
    expect(bundle.marketingIntelligenceBrainGraph).toBeTruthy();
    expect(bundle.researchGraph).toBeTruthy();
    expect(bundle.reasoningGraph).toBeTruthy();
    expect(bundle.marketingIntelligenceGraph).toBeTruthy();
  });

  it("H — live deterministic market_understanding is blocked (no placeholder success)", () => {
    const blocked = executeDeterministicCapability({
      context: {
        organizationId: FIXTURE_ORG_ID,
        locale: "en",
        environment: "live",
        peerId: PEER,
        actorId: "test",
        correlationId: "c1",
      },
      snapshot: { organizationId: FIXTURE_ORG_ID, slices: {}, assembledAt: new Date().toISOString() },
      capabilityId: "market_understanding",
      companySnapshot: {
        organizationId: FIXTURE_ORG_ID,
        assembledAt: new Date().toISOString(),
        profile: { name: "Test Co" },
      } as never,
    });

    expect(blocked.errors.some((e) => e.code === "placeholder_blocked")).toBe(true);
    expect(
      blocked.findings.some((f) => f.value === PLACEHOLDER_MARKET_UNDERSTANDING_VALUE)
    ).toBe(false);
  });

  it("I — external provider failure marks fallback honestly", async () => {
    vi.stubEnv("NODE_ENV", "development");
    resetDefaultResearchProviderRegistry();
    fetchMock.mockResolvedValueOnce({
      items: [],
      requestsUsed: 2,
      pagesUsed: 0,
      costUsed: 2,
      providerId: "external_web_fetch",
      fetchFailures: 2,
    });

    const project = automaticProject();
    const episode = minimalEpisode(project.id);
    const handoff = campaignHandoff(project);

    const result = await executeRegistryBrainForEpisode({
      brainId: "research",
      episode,
      contextHandoff: handoff,
      locale: "en",
      idempotencyKey: "px63-fallback",
    });

    expect(result.status).toBe("completed");
    const graph = getDefaultResearchBrainRepository().getLatestSnapshot({
      organizationId: FIXTURE_ORG_ID,
      projectId: project.id,
    })?.graph;
    expect(graph?.summary.fallbackUsed).toBe(true);
  });

  it("K — graphs survive cold-start hydration via episode resolvedGraphs", async () => {
    const project = automaticProject();
    const episode = minimalEpisode(project.id);
    const handoff = campaignHandoff(project);

    await executeRegistryBrainForEpisode({
      brainId: "research",
      episode,
      contextHandoff: handoff,
      locale: "en",
      idempotencyKey: "px63-cold-r",
    });
    await executeRegistryBrainForEpisode({
      brainId: "reasoning",
      episode,
      contextHandoff: handoff,
      locale: "en",
      idempotencyKey: "px63-cold-reason",
    });

    const researchGraph = getDefaultResearchBrainRepository().getLatestSnapshot({
      organizationId: FIXTURE_ORG_ID,
      projectId: project.id,
    })!.graph;
    const reasoningGraph = getDefaultReasoningBrainRepository().getLatestSnapshot({
      organizationId: FIXTURE_ORG_ID,
      projectId: project.id,
    })!.graph;

    resetDefaultResearchBrainRepository();
    resetDefaultReasoningBrainRepository();

    const coldEpisode: ProjectEpisodeRecord = {
      ...episode,
      resolvedGraphs: { researchBrainGraph: researchGraph, reasoningBrainGraph: reasoningGraph },
    };

    const bundle = resolveEpisodeIntelligenceGraphs(coldEpisode);
    expect(bundle.researchBrainGraph?.evidence.length).toBeGreaterThan(0);
    expect(bundle.reasoningBrainGraph?.interpretations.length).toBeGreaterThan(0);
  });

  it("L — duplicate continuation does not re-run expensive research", async () => {
    const project = automaticProject();
    const episode = minimalEpisode(project.id);
    const handoff = campaignHandoff(project);

    await executeRegistryBrainForEpisode({
      brainId: "research",
      episode,
      contextHandoff: handoff,
      locale: "en",
      idempotencyKey: "px63-dup",
    });

    fetchMock.mockClear();
    const reuse = await executeRegistryBrainForEpisode({
      brainId: "research",
      episode,
      contextHandoff: handoff,
      locale: "en",
      idempotencyKey: "px63-dup-2",
    });

    expect(reuse.status).toBe("completed");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("M — cross-tenant graph access remains isolated", async () => {
    const project = automaticProject();
    const otherOrg = "org-other-tenant";
    const episode = minimalEpisode(project.id);
    const handoff = campaignHandoff(project);

    await executeRegistryBrainForEpisode({
      brainId: "research",
      episode,
      contextHandoff: handoff,
      locale: "en",
      idempotencyKey: "px63-tenant",
    });

    const foreign = getDefaultResearchBrainRepository().getLatestSnapshot({
      organizationId: otherOrg,
      projectId: project.id,
    });
    expect(foreign).toBeNull();
  });

  it("N — production adapter full pipeline reaches waiting_for_approval with healthy intelligence", async () => {
    const project = automaticProject();
    const projectId = project.id;
    const adapter = createProductionBrainExecutionAdapter({
      peerId: PEER,
      project,
      domainInput: domainInput(project),
    });
    const runner = createProjectEpisodeRunner(undefined, undefined, adapter);

    await runner.startEpisode({
      organizationId: FIXTURE_ORG_ID,
      projectId,
      peerId: PEER,
      sliceAvailability: {
        business: true,
        brand: true,
        website: true,
        products: true,
        competitors: true,
        goals: true,
        campaign: true,
      },
    });

    getDefaultProjectEpisodeRepository().save({
      ...getDefaultProjectEpisodeRepository().get({ organizationId: FIXTURE_ORG_ID, projectId })!,
      campaignApprovalMode: "approval_before_publication",
    });

    const result = await runner.runUntilPause({
      organizationId: FIXTURE_ORG_ID,
      projectId,
      peerId: PEER,
      maxSteps: resolveEpisodeStepBudget({ campaignApprovalMode: "approval_before_publication" }),
    });

    expect(result.episode.snapshot.completedBrains).toContain("research");
    expect(result.episode.snapshot.completedBrains).toContain("reasoning");
    expect(result.episode.snapshot.completedBrains).toContain("marketing_intelligence");
    expect(result.episode.snapshot.completedBrains).toContain("strategy");
    expect(result.episode.snapshot.completedBrains).toContain("validation");
    expect(
      result.status === "waiting_for_approval" ||
        result.episode.snapshot.state === "waiting_for_approval"
    ).toBe(true);

    const violations = detectIntelligencePipelinePlaceholderViolations(result.episode);
    expect(violations.filter((v) => v.code.startsWith("placeholder"))).toHaveLength(0);
    assertProductionIntelligencePipelineHealthy({
      ...result.episode,
      snapshot: {
        ...result.episode.snapshot,
        completedBrains: [
          ...result.episode.snapshot.completedBrains.filter(
            (b) => !["research", "reasoning", "marketing_intelligence"].includes(b)
          ),
          "research",
          "reasoning",
          "marketing_intelligence",
        ],
      },
    });

    assertAutomaticCampaignReachedPublicationBoundary({ project, episode: result.episode });
  });
});
