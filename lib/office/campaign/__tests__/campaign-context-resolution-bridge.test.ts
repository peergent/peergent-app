/**
 * PX-61B — unified human context resolution bridge tests.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  configureLayerRepositories,
  resetConfiguredLayerRepositories,
  resetLayerRepositoryStores,
} from "@/lib/brain/persistence/layer-repository-factory";
import { createSimulatedDurablePersistence } from "@/lib/brain/persistence/layer/simulated-durable-persistence";
import {
  resetSimulatedDurableStore,
  simulatedDurableStore,
} from "@/lib/brain/persistence/layer/simulated-durable-store";
import {
  resetActiveDurablePersistence,
  setActiveDurablePersistence,
} from "@/lib/brain/persistence/layer/active-durable-persistence";
import { resetDefaultCompanyRepository } from "@/lib/brain/layers/company";
import {
  resetDefaultResearchBrainRepository,
  resetDefaultResearchProviderRegistry,
} from "@/lib/brain/layers/research";
import { resetDefaultReasoningBrainRepository } from "@/lib/brain/layers/reasoning";
import { resetDefaultMarketingIntelligenceBrainRepository } from "@/lib/brain/layers/marketing-intelligence";
import { resetDefaultStrategyBrainRepository } from "@/lib/brain/layers/strategy";
import { resetDefaultPlanningBrainRepository, resetPlanningBrainLayerCounters } from "@/lib/brain/layers/planning";
import { resetDefaultCreativeRepository } from "@/lib/brain/layers/creative/creative-repository";
import { resetDefaultValidationRepository } from "@/lib/brain/layers/validation/validation-repository";
import { resetDefaultMemoryRepository } from "@/lib/brain/layers/memory";
import { resetDefaultExecutionRepository, resetDefaultExecutionProviderRegistry } from "@/lib/brain/layers/execution";
import { resetDefaultLearningBrainRepository, resetLearningBrainLayerCounters } from "@/lib/brain/layers/learning";
import {
  createProjectEpisodeRunner,
  resetDefaultProjectEpisodeRepository,
  FIXTURE_ORG_ID,
  getDefaultProjectEpisodeRepository,
} from "@/lib/brain/project-runtime";
import { createMarketingCampaignProject } from "@/lib/peer-experience/marketing/projects/project-engine";
import type { MarketingProject } from "@/lib/peer-experience/marketing/projects/types";
import {
  submitCampaignContextResolutionServer,
  resetContextBridgeInFlightForTests,
} from "@/lib/office/campaign/campaign-context-resolution-bridge-server";
import {
  mergeCampaignBrandContextIntoProject,
  mergeCampaignCompetitorSkipIntoProject,
  mergeCampaignCompetitorsIntoProject,
  mergeCampaignWebsiteSkipIntoProject,
  mergeCampaignWebsiteUrlIntoProject,
  mergeSuppliedContextFromEpisode,
} from "@/lib/office/campaign/live-campaign-context-store";
import { evaluateStrategyContextReadiness } from "@/lib/office/campaign/strategy-context-readiness";
import { buildCampaignContext } from "@/lib/office/campaign/campaign-context";
import * as projectEpisodeRunnerModule from "@/lib/brain/project-runtime/project-episode-runner";

const PEER = "emma-px61b";
const ORG = FIXTURE_ORG_ID;

const preparePersistenceMock = vi.hoisted(() => vi.fn().mockResolvedValue({}));

vi.mock("@/lib/brain/persistence/server/prepare-brain-server-persistence", () => ({
  prepareBrainServerPersistence: preparePersistenceMock,
}));

vi.mock("@/lib/office/campaign/resolve-organization-name-server", () => ({
  resolveDurableOrganizationNameServer: vi.fn().mockResolvedValue("Test Org"),
}));

function resetAll() {
  resetDefaultCompanyRepository();
  resetDefaultResearchBrainRepository();
  resetDefaultResearchProviderRegistry();
  resetDefaultReasoningBrainRepository();
  resetDefaultMarketingIntelligenceBrainRepository();
  resetDefaultStrategyBrainRepository();
  resetDefaultPlanningBrainRepository();
  resetPlanningBrainLayerCounters();
  resetDefaultCreativeRepository();
  resetDefaultValidationRepository();
  resetDefaultMemoryRepository();
  resetDefaultExecutionRepository();
  resetDefaultExecutionProviderRegistry();
  resetDefaultLearningBrainRepository();
  resetLearningBrainLayerCounters();
  resetDefaultProjectEpisodeRepository();
  resetLayerRepositoryStores();
  resetConfiguredLayerRepositories();
  resetActiveDurablePersistence();
  resetContextBridgeInFlightForTests();
}

function automaticProject(): MarketingProject {
  return createMarketingCampaignProject({
    peerId: PEER,
    ownerLabel: "Emma",
    name: "PX-61B Unified Context",
    goalLabel: "Leads",
    description: "Unified context bridge verification.",
    primaryGoalId: "generate_leads",
    setupMode: "automatic",
    approvalMode: "approval_before_publication",
    selectedChannels: ["linkedin"],
  });
}

function domainInput(project: MarketingProject) {
  return {
    peerId: PEER,
    organizationId: ORG,
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

function supabaseStub() {
  return {} as never;
}

function fullCompanyContext() {
  return {
    brandName: "You Charge",
    industry: "Energy",
    mission: "Sustainable charging",
    targetAudience: "Fleet owners",
    productsAndServices: ["EV chargers"],
    uniqueSellingPoints: ["Fast install"],
  };
}

async function seedWaitingForContext(projectId: string) {
  const runner = createProjectEpisodeRunner();
  await runner.startEpisode({
    organizationId: ORG,
    projectId,
    peerId: PEER,
    sliceAvailability: { campaign: true, goals: true },
  });
  getDefaultProjectEpisodeRepository().save({
    ...getDefaultProjectEpisodeRepository().get({ organizationId: ORG, projectId })!,
    episodeStatus: "waiting_for_context",
    contextReady: false,
    lastError: "Required context missing",
  });
}

function mockResumeSpy() {
  const originalFactory = projectEpisodeRunnerModule.createProjectEpisodeRunner;
  const resumeSpy = vi.fn().mockResolvedValue({
    status: "running",
    episode: { episodeStatus: "running" },
    missingContext: [],
    reason: null,
    stopReason: null,
  });
  vi.spyOn(projectEpisodeRunnerModule, "createProjectEpisodeRunner").mockImplementationOnce(
    (durable, registry, adapter) => {
      const realRunner = originalFactory(durable, registry, adapter);
      vi.spyOn(realRunner, "resumeEpisode").mockImplementation(resumeSpy);
      return realRunner;
    }
  );
  return resumeSpy;
}

function baseInput(project: MarketingProject) {
  return {
    peerId: PEER,
    projectId: project.id,
    project,
    domainInput: domainInput(project),
    organizationId: ORG,
    supabase: supabaseStub(),
    locale: "en" as const,
  };
}

describe("PX-61B unified context resolution bridge", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    resetSimulatedDurableStore();
    resetAll();
    configureLayerRepositories({ mode: "persistent_in_memory" });
    setActiveDurablePersistence(createSimulatedDurablePersistence());
    preparePersistenceMock.mockClear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    resetSimulatedDurableStore();
    resetAll();
  });

  it("A — company context submit persists and resumes episode", async () => {
    const project = automaticProject();
    await seedWaitingForContext(project.id);
    const resumeSpy = mockResumeSpy();
    const merged = mergeCampaignBrandContextIntoProject(project, fullCompanyContext())!;

    const result = await submitCampaignContextResolutionServer({
      ...baseInput(merged),
      resolution: { kind: "company", decision: "supplied", brandContext: fullCompanyContext() },
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.resolutionKind).toBe("company");
      expect(result.episodeResumed).toBe(true);
    }
    expect(simulatedDurableStore.getEpisode(ORG, project.id)?.episode.suppliedCampaignBrandContext?.brandName).toBe(
      "You Charge"
    );
    expect(resumeSpy).toHaveBeenCalledTimes(1);
  });

  it("B — website URL submit persists skip=false and resumes", async () => {
    const project = automaticProject();
    await seedWaitingForContext(project.id);
    const resumeSpy = mockResumeSpy();

    const result = await submitCampaignContextResolutionServer({
      ...baseInput(project),
      resolution: { kind: "website", decision: "supplied", url: "https://youcharge.nl" },
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.project.campaignSetup?.websiteSkipped).toBe(false);
      expect(result.project.campaignSetup?.websiteUrl).toContain("youcharge.nl");
    }
    const durable = simulatedDurableStore.getEpisode(ORG, project.id)?.episode;
    expect(durable?.suppliedCampaignWebsiteDecision?.decision).toBe("supplied");
    expect(durable?.suppliedCampaignWebsiteDecision?.source).toBe("customer_supplied");
    expect(resumeSpy).toHaveBeenCalledTimes(1);
  });

  it("C — website skip persists explicit skip semantics", async () => {
    const project = automaticProject();
    await seedWaitingForContext(project.id);
    mockResumeSpy();

    const result = await submitCampaignContextResolutionServer({
      ...baseInput(project),
      resolution: { kind: "website", decision: "skipped" },
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.project.campaignSetup?.websiteSkipped).toBe(true);
      expect(result.project.campaignSetup?.websiteDecisionSource).toBe("customer_skipped");
      const ctx = buildCampaignContext({ project: result.project, domainInput: domainInput(result.project) });
      expect(evaluateStrategyContextReadiness(ctx).optionalContextStates.websiteDecision).toBe("skipped");
    }
    expect(
      simulatedDurableStore.getEpisode(ORG, project.id)?.episode.suppliedCampaignWebsiteDecision?.decision
    ).toBe("skipped");
  });

  it("D — competitors submit persists list and resumes", async () => {
    const project = automaticProject();
    await seedWaitingForContext(project.id);
    const resumeSpy = mockResumeSpy();

    const result = await submitCampaignContextResolutionServer({
      ...baseInput(project),
      resolution: {
        kind: "competitors",
        decision: "supplied",
        competitors: [{ name: "Competitor A", url: "https://competitor-a.com" }],
      },
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.project.campaignSetup?.competitorsSkipped).toBe(false);
      expect(result.project.campaignSetup?.campaignCompetitors?.[0]?.name).toBe("Competitor A");
    }
    expect(resumeSpy).toHaveBeenCalledTimes(1);
  });

  it("E — competitors skip persists explicit skip semantics", async () => {
    const project = automaticProject();
    await seedWaitingForContext(project.id);
    mockResumeSpy();

    const result = await submitCampaignContextResolutionServer({
      ...baseInput(project),
      resolution: { kind: "competitors", decision: "skipped" },
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.project.campaignSetup?.competitorsSkipped).toBe(true);
      expect(result.project.campaignSetup?.competitorsDecisionSource).toBe("customer_skipped");
      const ctx = buildCampaignContext({ project: result.project, domainInput: domainInput(result.project) });
      expect(evaluateStrategyContextReadiness(ctx).optionalContextStates.competitorDecision).toBe("skipped");
    }
  });

  it("F — duplicate company submit is idempotent (single in-flight)", async () => {
    const project = automaticProject();
    await seedWaitingForContext(project.id);
    mockResumeSpy();
    const merged = mergeCampaignBrandContextIntoProject(project, fullCompanyContext())!;
    const input = {
      ...baseInput(merged),
      resolution: { kind: "company" as const, decision: "supplied" as const, brandContext: fullCompanyContext() },
    };
    const [a, b] = await Promise.all([
      submitCampaignContextResolutionServer(input),
      submitCampaignContextResolutionServer(input),
    ]);
    expect(a.ok).toBe(true);
    expect(b.ok).toBe(true);
  });

  it("G — duplicate website skip is idempotent", async () => {
    const project = automaticProject();
    await seedWaitingForContext(project.id);
    mockResumeSpy();
    const input = {
      ...baseInput(project),
      resolution: { kind: "website" as const, decision: "skipped" as const },
    };
    const [a, b] = await Promise.all([
      submitCampaignContextResolutionServer(input),
      submitCampaignContextResolutionServer(input),
    ]);
    expect(a.ok).toBe(true);
    expect(b.ok).toBe(true);
  });

  it("H — wrong organization cannot resolve episode (tenant isolation)", async () => {
    const project = automaticProject();
    await seedWaitingForContext(project.id);

    const result = await submitCampaignContextResolutionServer({
      ...baseInput(project),
      organizationId: "org-other-tenant",
      resolution: { kind: "website", decision: "skipped" },
    });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe("episode_not_found");
  });

  it("I — pure merges work without sessionStorage", () => {
    const project = automaticProject();
    expect(mergeCampaignWebsiteUrlIntoProject(project, "https://example.com")?.campaignSetup?.websiteUrl).toBeTruthy();
    expect(mergeCampaignWebsiteSkipIntoProject(project)?.campaignSetup?.websiteSkipped).toBe(true);
    expect(
      mergeCampaignCompetitorsIntoProject(project, [{ name: "Rival" }])?.campaignSetup?.campaignCompetitors?.length
    ).toBe(1);
    expect(mergeCampaignCompetitorSkipIntoProject(project)?.campaignSetup?.competitorsSkipped).toBe(true);
  });

  it("J — sequential context resolutions hydrate project from episode without sessionStorage", async () => {
    const project = automaticProject();
    await seedWaitingForContext(project.id);
    mockResumeSpy();

    let working = project;
    const steps = [
      { kind: "company" as const, decision: "supplied" as const, brandContext: fullCompanyContext() },
      { kind: "website" as const, decision: "skipped" as const },
      { kind: "competitors" as const, decision: "skipped" as const },
    ];

    for (const resolution of steps) {
      const result = await submitCampaignContextResolutionServer({
        ...baseInput(working),
        resolution,
      });
      expect(result.ok).toBe(true);
      if (result.ok) working = result.project;
      getDefaultProjectEpisodeRepository().save({
        ...getDefaultProjectEpisodeRepository().get({ organizationId: ORG, projectId: project.id })!,
        episodeStatus: "waiting_for_context",
      });
    }

    const episode = getDefaultProjectEpisodeRepository().get({ organizationId: ORG, projectId: project.id })!;
    const hydrated = mergeSuppliedContextFromEpisode(automaticProject(), episode);
    expect(hydrated.campaignSetup?.campaignBrandContext?.brandName).toBe("You Charge");
    expect(hydrated.campaignSetup?.websiteSkipped).toBe(true);
    expect(hydrated.campaignSetup?.competitorsSkipped).toBe(true);

    const ctx = buildCampaignContext({ project: hydrated, domainInput: domainInput(hydrated) });
    expect(evaluateStrategyContextReadiness(ctx).essentialReady).toBe(true);
    expect(evaluateStrategyContextReadiness(ctx).optionalContextStates.websiteDecision).toBe("skipped");
    expect(evaluateStrategyContextReadiness(ctx).optionalContextStates.competitorDecision).toBe("skipped");
  });
});
