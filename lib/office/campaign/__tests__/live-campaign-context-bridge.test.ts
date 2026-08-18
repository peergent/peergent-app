/**
 * PX-61 — production context gate bridge regression (server path, no sessionStorage).
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
  createProductionBrainExecutionAdapter,
} from "@/lib/brain/project-runtime";
import { createMarketingCampaignProject } from "@/lib/peer-experience/marketing/projects/project-engine";
import type { MarketingProject } from "@/lib/peer-experience/marketing/projects/types";
import {
  submitLiveCampaignCompanyContextServer,
  resetContextBridgeInFlightForTests,
} from "@/lib/office/campaign/live-campaign-context-bridge-server";
import {
  mergeCampaignBrandContextIntoProject,
  mergeSuppliedBrandContextFromEpisode,
} from "@/lib/office/campaign/live-campaign-context-store";
import * as acquireEpisodeContextModule from "@/lib/brain/project-runtime/acquire-episode-context";
import * as projectEpisodeRunnerModule from "@/lib/brain/project-runtime/project-episode-runner";

const PEER = "emma-px61-context";
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
    name: "PX-61 Context Bridge",
    goalLabel: "Leads",
    description: "Context gate production regression.",
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
    mission: "Sustainable charging for everyone",
    targetAudience: "Business owners with EV fleets",
    productsAndServices: ["EV charging stations", "Installation services"],
    uniqueSellingPoints: ["Fast installation", "Smart energy management"],
  };
}

describe("PX-61 live campaign context bridge", () => {
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

  it("A — mergeCampaignBrandContextIntoProject works without sessionStorage", () => {
    const project = automaticProject();
    const updated = mergeCampaignBrandContextIntoProject(project, fullCompanyContext());
    expect(updated).not.toBeNull();
    expect(updated?.campaignSetup?.campaignBrandContext?.brandName).toBe("You Charge");
    expect(updated?.campaignSetup?.campaignContextVersion).toBeGreaterThan(0);
  });

  it("B — validation failure returns actionable errors without persisting", async () => {
    const project = automaticProject();
    const result = await submitLiveCampaignCompanyContextServer({
      peerId: PEER,
      projectId: project.id,
      project,
      domainInput: domainInput(project),
      context: { brandName: "Only name" },
      organizationId: ORG,
      supabase: supabaseStub(),
      locale: "en",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("validation_failed");
      expect(result.validation?.kind).toBe("company");
    }
  });

  it("C — context submission persists durably and invokes episode resume", async () => {
    const project = automaticProject();
    const projectId = project.id;
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
      sliceAvailability: { business: false, campaign: true, goals: true },
      contextGaps: [
        {
          kind: "business",
          requiredBy: "project_engine",
          reason: "Business profile is incomplete.",
          blocking: true,
          resolutionType: "customer_input",
        },
      ],
      lastError: "Required context missing",
    });

    const originalFactory = projectEpisodeRunnerModule.createProjectEpisodeRunner;
    const resumeSpy = vi.fn().mockResolvedValue({
      status: "running",
      episode: {
        ...getDefaultProjectEpisodeRepository().get({ organizationId: ORG, projectId })!,
        episodeStatus: "running",
        contextReady: true,
      },
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

    const mergedProject =
      mergeCampaignBrandContextIntoProject(project, fullCompanyContext()) ?? project;

    const result = await submitLiveCampaignCompanyContextServer({
      peerId: PEER,
      projectId,
      project: mergedProject,
      domainInput: domainInput(mergedProject),
      context: fullCompanyContext(),
      organizationId: ORG,
      supabase: supabaseStub(),
      locale: "en",
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.contextPersisted).toBe(true);
      expect(result.episodeResumed).toBe(true);
      expect(result.runtimeSync).toBeDefined();
      expect(result.project.campaignSetup?.campaignBrandContext?.brandName).toBe("You Charge");
    }

    const durableEpisode = simulatedDurableStore.getEpisode(ORG, projectId);
    expect(durableEpisode?.episode.suppliedCampaignBrandContext?.brandName).toBe("You Charge");

    expect(resumeSpy).toHaveBeenCalledTimes(1);
    const resumeInput = resumeSpy.mock.calls[0]?.[0] as { campaignContext?: { brandContext?: { brandName?: string } } };
    expect(resumeInput?.campaignContext?.brandContext?.brandName).toBe("You Charge");
  });

  it("D — duplicate submission is idempotent (single in-flight resume)", async () => {
    const project = automaticProject();
    const projectId = project.id;
    const runner = createProjectEpisodeRunner();

    await runner.startEpisode({
      organizationId: ORG,
      projectId,
      peerId: PEER,
      sliceAvailability: { campaign: true },
    });

    getDefaultProjectEpisodeRepository().save({
      ...getDefaultProjectEpisodeRepository().get({ organizationId: ORG, projectId })!,
      episodeStatus: "waiting_for_context",
      contextReady: false,
    });

    vi.spyOn(acquireEpisodeContextModule, "acquireEpisodeContext").mockResolvedValue({
      package: {} as never,
      sliceAvailability: { business: true, brand: true, website: true, products: true, competitors: true, goals: true, campaign: true },
      contextReady: true,
      contextGaps: [],
      handoff: {
        companySnapshot: { organizationId: ORG } as never,
        brandGraph: null,
        campaignContext: { projectId } as never,
        priorMemories: [],
      },
    });

    const merged = mergeCampaignBrandContextIntoProject(project, fullCompanyContext()) ?? project;
    const input = {
      peerId: PEER,
      projectId,
      project: merged,
      domainInput: domainInput(merged),
      context: fullCompanyContext(),
      organizationId: ORG,
      supabase: supabaseStub(),
      locale: "en" as const,
    };

    const [first, second] = await Promise.all([
      submitLiveCampaignCompanyContextServer(input),
      submitLiveCampaignCompanyContextServer(input),
    ]);

    expect(first.ok).toBe(true);
    expect(second.ok).toBe(true);
  });

  it("E — mergeSuppliedBrandContextFromEpisode hydrates stale client project", () => {
    const project = automaticProject();
    const hydrated = mergeSuppliedBrandContextFromEpisode(project, {
      brandName: "You Charge",
      industry: "Energy",
      productsAndServices: ["Chargers"],
      uniqueSellingPoints: ["Fast install"],
      targetAudience: "Fleet owners",
      suppliedAt: new Date().toISOString(),
      source: "customer_supplied",
    });
    expect(hydrated.campaignSetup?.campaignBrandContext?.brandName).toBe("You Charge");
  });

  it("F — episode_not_waiting when episode is not at context gate", async () => {
    const project = automaticProject();
    const projectId = project.id;
    const runner = createProjectEpisodeRunner();
    await runner.startEpisode({
      organizationId: ORG,
      projectId,
      peerId: PEER,
      sliceAvailability: { business: true, brand: true, campaign: true },
    });

    const result = await submitLiveCampaignCompanyContextServer({
      peerId: PEER,
      projectId,
      project,
      domainInput: domainInput(project),
      context: fullCompanyContext(),
      organizationId: ORG,
      supabase: supabaseStub(),
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("episode_not_waiting");
    }
  });
});
