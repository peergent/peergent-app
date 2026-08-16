/**
 * PX-51 — production-like automatic campaign pipeline E2E.
 *
 * Uses simulated durable persistence + ProjectEpisodeRunner (registry brains).
 * Mirrors Start Campaign → strategy target → continuation → publication approval → resume → execution.
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
  submitProjectApprovalDurable,
  FIXTURE_ORG_ID,
  getDefaultProjectEpisodeRepository,
  resolveEpisodeStepBudget,
  assertAutomaticCampaignReachedPublicationBoundary,
  detectAutomaticCampaignPipelineStall,
  resetCampaignEpisodeContinuationInFlightForTests,
  createProductionBrainExecutionAdapter,
  resolveEpisodeStepBudgetForEpisode,
} from "@/lib/brain/project-runtime";
import { getDefaultCreativeRepository } from "@/lib/brain/layers/creative/creative-repository";
import { createMarketingCampaignProject } from "@/lib/peer-experience/marketing/projects/project-engine";
import type { MarketingProject } from "@/lib/peer-experience/marketing/projects/types";

const PEER = "emma";

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
  resetCampaignEpisodeContinuationInFlightForTests();
}

function automaticProject(approvalMode: "approval_before_publication" | "approval_before_generation" | "no_approval_required" = "approval_before_publication"): MarketingProject {
  return createMarketingCampaignProject({
    peerId: PEER,
    ownerLabel: "Emma",
    name: "PX-51 E2E Campaign",
    goalLabel: "Leads",
    description: "End-to-end automatic pipeline verification.",
    primaryGoalId: "generate_leads",
    setupMode: "automatic",
    approvalMode,
    selectedChannels: ["linkedin"],
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

describe("PX-51 automatic campaign pipeline E2E", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    resetSimulatedDurableStore();
    resetAll();
    configureLayerRepositories({ mode: "persistent_in_memory" });
    setActiveDurablePersistence(createSimulatedDurablePersistence());
  });

  afterEach(() => {
    resetSimulatedDurableStore();
    resetAll();
  });

  it("A — strategy target then continuation reaches publication approval (approval_before_publication)", async () => {
    const project = automaticProject();
    const projectId = project.id;
    const runner = createProjectEpisodeRunner();

    await runner.startEpisode({
      organizationId: FIXTURE_ORG_ID,
      projectId,
      peerId: "demo",
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

    const repo = getDefaultProjectEpisodeRepository();
    repo.save({
      ...repo.get({ organizationId: FIXTURE_ORG_ID, projectId })!,
      campaignApprovalMode: "approval_before_publication",
    });

    const strategyResult = await runner.runUntilPause({
      organizationId: FIXTURE_ORG_ID,
      projectId,
      peerId: "demo",
      target: { targetBrain: "strategy" },
    });

    expect(strategyResult.status).toBe("running");
    expect(strategyResult.episode.snapshot.completedBrains).toContain("strategy");
    expect(detectAutomaticCampaignPipelineStall({ project, episode: strategyResult.episode })).not.toBeNull();

    const continuation = await runner.runUntilPause({
      organizationId: FIXTURE_ORG_ID,
      projectId,
      peerId: "demo",
      maxSteps: resolveEpisodeStepBudget({ campaignApprovalMode: "approval_before_publication" }),
    });

    expect(continuation.episode.snapshot.completedBrains).toContain("planning");
    expect(continuation.episode.snapshot.completedBrains).toContain("creative");
    expect(continuation.episode.snapshot.completedBrains).toContain("validation");
    expect(
      continuation.status === "waiting_for_approval" ||
        continuation.episode.snapshot.state === "waiting_for_approval"
    ).toBe(true);

    assertAutomaticCampaignReachedPublicationBoundary({
      project,
      episode: continuation.episode,
    });
  });

  it("B — approval resume executes once (fake external boundary via registry executor)", async () => {
    const project = automaticProject();
    const projectId = project.id;
    const runner = createProjectEpisodeRunner();

    await runner.startEpisode({
      organizationId: FIXTURE_ORG_ID,
      projectId,
      peerId: "demo",
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

    let result = await runner.runUntilPause({
      organizationId: FIXTURE_ORG_ID,
      projectId,
      peerId: "demo",
      maxSteps: resolveEpisodeStepBudget({ campaignApprovalMode: "approval_before_publication" }),
    });

    expect(result.status).toBe("waiting_for_approval");

    await submitProjectApprovalDurable({
      organizationId: FIXTURE_ORG_ID,
      projectId,
      approvalId: "approval-px51-e2e",
      decision: "approved",
      actor: "customer@test.com",
    });

    result = await runner.resumeEpisode({
      organizationId: FIXTURE_ORG_ID,
      projectId,
      approvalSatisfied: true,
    });

    expect(result.episode.snapshot.completedBrains).toContain("execution");
    expect(result.episode.lastError).not.toBe("max_steps_exceeded");
  });

  it("C — guided approval_before_generation stops before planning auto-continuation", async () => {
    const project = automaticProject("approval_before_generation");
    const projectId = project.id;
    const runner = createProjectEpisodeRunner();

    await runner.startEpisode({
      organizationId: FIXTURE_ORG_ID,
      projectId,
      peerId: "demo",
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
      campaignApprovalMode: "approval_before_generation",
    });

    const strategyResult = await runner.runUntilPause({
      organizationId: FIXTURE_ORG_ID,
      projectId,
      peerId: "demo",
      target: { targetBrain: "strategy" },
    });

    expect(strategyResult.episode.snapshot.completedBrains).toContain("strategy");
    expect(detectAutomaticCampaignPipelineStall({ project, episode: strategyResult.episode })).toBeNull();
  });

  it("D — stall invariant detects production-like planning stall", () => {
    const project = automaticProject();
    const stall = detectAutomaticCampaignPipelineStall({
      project,
      episode: {
        episodeStatus: "running",
        lastError: null,
        campaignApprovalMode: "approval_before_publication",
        snapshot: {
          state: "planning",
          completedBrains: ["company", "research", "reasoning", "marketing_intelligence", "strategy"],
          pendingBrains: ["planning", "creative", "validation", "execution", "memory", "learning"],
          approvalCheckpoint: null,
        },
      } as never,
    });

    expect(stall?.stalled).toBe(true);
    expect(stall?.phase).toBe("planning");
    expect(stall?.reason).toContain("planning");
  });

  it("D2 — stall invariant detects production validation-not-started stall", () => {
    const project = automaticProject();
    const stall = detectAutomaticCampaignPipelineStall({
      project,
      episode: {
        episodeStatus: "running",
        lastError: null,
        campaignApprovalMode: "approval_before_publication",
        snapshot: {
          state: "validating",
          activeBrain: null,
          completedBrains: [
            "company",
            "research",
            "reasoning",
            "marketing_intelligence",
            "strategy",
            "planning",
            "creative",
          ],
          pendingBrains: ["validation", "execution", "memory", "learning"],
          approvalCheckpoint: null,
          waitingReason: null,
        },
      } as never,
    });

    expect(stall?.stalled).toBe(true);
    expect(stall?.phase).toBe("validation");
    expect(stall?.reason).toBe("ORCHESTRATION_STALL_VALIDATION_NOT_STARTED");
  });

  it("E — durable episode persists cognitive pipeline progress across cold start", async () => {
    const project = automaticProject();
    const projectId = project.id;
    const runner = createProjectEpisodeRunner();

    await runner.startEpisode({
      organizationId: FIXTURE_ORG_ID,
      projectId,
      peerId: "demo",
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

    await runner.runUntilPause({
      organizationId: FIXTURE_ORG_ID,
      projectId,
      peerId: "demo",
      target: { targetBrain: "strategy" },
    });

    await runner.runUntilPause({
      organizationId: FIXTURE_ORG_ID,
      projectId,
      peerId: "demo",
      maxSteps: resolveEpisodeStepBudget({ campaignApprovalMode: "approval_before_publication" }),
    });

    const durable = createSimulatedDurablePersistence();
    durable.hydrateProject({ organizationId: FIXTURE_ORG_ID, projectId });

    const reloaded = getDefaultProjectEpisodeRepository().get({
      organizationId: FIXTURE_ORG_ID,
      projectId,
    })!;

    expect(reloaded.episodeStatus).toBe("waiting_for_approval");
    expect(reloaded.snapshot.completedBrains).toContain("validation");
    expect(reloaded.artifacts.planningOutputRef).toBeTruthy();
    expect(reloaded.artifacts.creativeOutputRef).toBeTruthy();
    expect(reloaded.artifacts.validationOutputRef).toBeTruthy();
  });

  it("F — production adapter validates after registry pipeline reaches creative", async () => {
    const project = automaticProject();
    const projectId = project.id;
    const registryRunner = createProjectEpisodeRunner();

    await registryRunner.startEpisode({
      organizationId: FIXTURE_ORG_ID,
      projectId,
      peerId: "demo",
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

    await registryRunner.runUntilPause({
      organizationId: FIXTURE_ORG_ID,
      projectId,
      peerId: "demo",
      target: { targetBrain: "creative" },
    });

    const preValidation = getDefaultProjectEpisodeRepository().get({
      organizationId: FIXTURE_ORG_ID,
      projectId,
    })!;
    expect(preValidation.snapshot.completedBrains).toContain("creative");

    const adapter = createProductionBrainExecutionAdapter({
      peerId: "demo",
      project,
      domainInput: domainInput(project),
    });
    const productionRunner = createProjectEpisodeRunner(undefined, undefined, adapter);

    const continuation = await productionRunner.runUntilPause({
      organizationId: FIXTURE_ORG_ID,
      projectId,
      peerId: "demo",
      maxSteps: resolveEpisodeStepBudget({ campaignApprovalMode: "approval_before_publication" }),
    });

    expect(continuation.episode.snapshot.completedBrains).toContain("validation");
    expect(String(continuation.episode.lastError ?? "")).not.toMatch(
      /Readiness score 30 below minimum 50/
    );
    expect(detectAutomaticCampaignPipelineStall({ project, episode: continuation.episode })?.phase).not.toBe(
      "validation"
    );
  });

  it("G — production adapter full pipeline: strategy once, planning reuses, reaches publication approval", async () => {
    const project = automaticProject();
    const projectId = project.id;
    const adapter = createProductionBrainExecutionAdapter({
      peerId: "demo",
      project,
      domainInput: domainInput(project),
    });
    const runner = createProjectEpisodeRunner(undefined, undefined, adapter);

    await runner.startEpisode({
      organizationId: FIXTURE_ORG_ID,
      projectId,
      peerId: "demo",
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

    const strategyResult = await runner.runUntilPause({
      organizationId: FIXTURE_ORG_ID,
      projectId,
      peerId: "demo",
      target: { targetBrain: "strategy" },
    });

    expect(strategyResult.episode.snapshot.completedBrains).toContain("strategy");

    const continuation = await runner.runUntilPause({
      organizationId: FIXTURE_ORG_ID,
      projectId,
      peerId: "demo",
      maxSteps: resolveEpisodeStepBudget({ campaignApprovalMode: "approval_before_publication" }),
    });

    expect(continuation.episode.snapshot.completedBrains).toContain("planning");
    expect(continuation.episode.snapshot.completedBrains).toContain("creative");
    expect(continuation.episode.snapshot.completedBrains).toContain("validation");
    expect(continuation.episode.lastError).toBeNull();
    expect(
      continuation.status === "waiting_for_approval" ||
        continuation.episode.snapshot.state === "waiting_for_approval"
    ).toBe(true);
    expect(continuation.episode.snapshot.completedBrains).not.toContain("execution");

    assertAutomaticCampaignReachedPublicationBoundary({
      project,
      episode: continuation.episode,
    });
  });

  it("H — production validation stall: cold-start recovery reaches publication approval", async () => {
    const project = automaticProject();
    const projectId = project.id;
    const adapter = createProductionBrainExecutionAdapter({
      peerId: "demo",
      project,
      domainInput: domainInput(project),
    });
    const runner = createProjectEpisodeRunner(undefined, undefined, adapter);
    const repo = getDefaultProjectEpisodeRepository();

    await runner.startEpisode({
      organizationId: FIXTURE_ORG_ID,
      projectId,
      peerId: "demo",
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

    repo.save({
      ...repo.get({ organizationId: FIXTURE_ORG_ID, projectId })!,
      campaignApprovalMode: "approval_before_publication",
    });

    const creativeResult = await runner.runUntilPause({
      organizationId: FIXTURE_ORG_ID,
      projectId,
      peerId: "demo",
      target: { targetBrain: "creative" },
    });

    expect(creativeResult.episode.snapshot.completedBrains).toContain("creative");
    expect(creativeResult.episode.snapshot.state).toBe("validating");

    const stalledEpisode = repo.get({ organizationId: FIXTURE_ORG_ID, projectId })!;
    const stall = detectAutomaticCampaignPipelineStall({ project, episode: stalledEpisode });
    expect(stall?.reason).toBe("ORCHESTRATION_STALL_VALIDATION_NOT_STARTED");

    const creativeGraph = stalledEpisode.resolvedGraphs.creativeGraph;
    expect(creativeGraph).toBeTruthy();

    const validationKey = `${stalledEpisode.correlationId}:validation:validating`;
    repo.save({
      ...stalledEpisode,
      executedBrainKeys: [...stalledEpisode.executedBrainKeys, validationKey],
      snapshot: {
        ...stalledEpisode.snapshot,
        activeBrain: null,
      },
    });

    resetDefaultProjectEpisodeRepository();

    const durable = createSimulatedDurablePersistence();
    await durable.hydrateProject({ organizationId: FIXTURE_ORG_ID, projectId });

    getDefaultCreativeRepository().clear();

    expect(
      getDefaultCreativeRepository().getLatest({
        organizationId: FIXTURE_ORG_ID,
        campaignId: projectId,
      })
    ).toBeNull();

    const reloaded = repo.get({ organizationId: FIXTURE_ORG_ID, projectId })!;
    expect(reloaded.resolvedGraphs.creativeGraph).toBeTruthy();
    expect(reloaded.snapshot.state).toBe("validating");
    expect(reloaded.snapshot.completedBrains).toContain("creative");
    expect(reloaded.snapshot.completedBrains).not.toContain("validation");

    const recoveryRunner = createProjectEpisodeRunner(undefined, durable, adapter);
    const continuation = await recoveryRunner.runUntilPause({
      organizationId: FIXTURE_ORG_ID,
      projectId,
      peerId: "demo",
      maxSteps: resolveEpisodeStepBudgetForEpisode(reloaded),
    });

    expect(continuation.episode.snapshot.completedBrains).toContain("validation");
    expect(continuation.episode.lastError).toBeNull();
    expect(
      continuation.status === "waiting_for_approval" ||
        continuation.episode.snapshot.state === "waiting_for_approval"
    ).toBe(true);
    expect(continuation.episode.snapshot.completedBrains).not.toContain("execution");

    assertAutomaticCampaignReachedPublicationBoundary({
      project,
      episode: continuation.episode,
    });
  });

  it("I — validation stall recovery then approval resumes execution once", async () => {
    const project = automaticProject();
    const projectId = project.id;
    const adapter = createProductionBrainExecutionAdapter({
      peerId: "demo",
      project,
      domainInput: domainInput(project),
    });
    const runner = createProjectEpisodeRunner(undefined, undefined, adapter);
    const repo = getDefaultProjectEpisodeRepository();

    await runner.startEpisode({
      organizationId: FIXTURE_ORG_ID,
      projectId,
      peerId: "demo",
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

    repo.save({
      ...repo.get({ organizationId: FIXTURE_ORG_ID, projectId })!,
      campaignApprovalMode: "approval_before_publication",
    });

    await runner.runUntilPause({
      organizationId: FIXTURE_ORG_ID,
      projectId,
      peerId: "demo",
      target: { targetBrain: "creative" },
    });

    const stalled = repo.get({ organizationId: FIXTURE_ORG_ID, projectId })!;
    resetDefaultProjectEpisodeRepository();

    const durable = createSimulatedDurablePersistence();
    await durable.hydrateProject({ organizationId: FIXTURE_ORG_ID, projectId });
    getDefaultCreativeRepository().clear();
    const recoveryRunner = createProjectEpisodeRunner(undefined, durable, adapter);
    const afterRecovery = await recoveryRunner.runUntilPause({
      organizationId: FIXTURE_ORG_ID,
      projectId,
      peerId: "demo",
      maxSteps: resolveEpisodeStepBudgetForEpisode(stalled),
    });

    expect(afterRecovery.status).toBe("waiting_for_approval");

    await submitProjectApprovalDurable({
      organizationId: FIXTURE_ORG_ID,
      projectId,
      approvalId: "approval-px54-e2e",
      decision: "approved",
      actor: "customer@test.com",
    });

    const result = await recoveryRunner.resumeEpisode({
      organizationId: FIXTURE_ORG_ID,
      projectId,
      approvalSatisfied: true,
    });

    expect(result.episode.snapshot.completedBrains).toContain("execution");
    expect(result.episode.lastError).toBeNull();
  });

  it("J — page-mount recovery: no strategyGeneratedAt + in-flight run resumes validation stall", async () => {
    const baseProject = automaticProject();
    const projectId = baseProject.id;
    const projectWithoutStrategyTimestamp = {
      ...baseProject,
      campaignSetup: {
        ...baseProject.campaignSetup!,
        strategyGeneratedAt: undefined,
        strategyRun: {
          status: "running" as const,
          startedAt: new Date().toISOString(),
        },
      },
    };

    const adapter = createProductionBrainExecutionAdapter({
      peerId: "demo",
      project: projectWithoutStrategyTimestamp,
      domainInput: domainInput(projectWithoutStrategyTimestamp),
    });
    const runner = createProjectEpisodeRunner(undefined, undefined, adapter);
    const repo = getDefaultProjectEpisodeRepository();

    await runner.startEpisode({
      organizationId: FIXTURE_ORG_ID,
      projectId,
      peerId: "demo",
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

    repo.save({
      ...repo.get({ organizationId: FIXTURE_ORG_ID, projectId })!,
      campaignApprovalMode: "approval_before_publication",
    });

    await runner.runUntilPause({
      organizationId: FIXTURE_ORG_ID,
      projectId,
      peerId: "demo",
      target: { targetBrain: "creative" },
    });

    const stalled = repo.get({ organizationId: FIXTURE_ORG_ID, projectId })!;
    expect(detectAutomaticCampaignPipelineStall({
      project: projectWithoutStrategyTimestamp,
      episode: stalled,
    })?.reason).toBe("ORCHESTRATION_STALL_VALIDATION_NOT_STARTED");

    resetDefaultProjectEpisodeRepository();

    const durable = createSimulatedDurablePersistence();
    await durable.hydrateProject({ organizationId: FIXTURE_ORG_ID, projectId });
    getDefaultCreativeRepository().clear();

    const recoveryRunner = createProjectEpisodeRunner(undefined, durable, adapter);

    const firstMount = await recoveryRunner.runUntilPause({
      organizationId: FIXTURE_ORG_ID,
      projectId,
      peerId: "demo",
      maxSteps: resolveEpisodeStepBudgetForEpisode(stalled),
    });

    expect(firstMount.episode.snapshot.completedBrains).toContain("validation");
    expect(
      firstMount.status === "waiting_for_approval" ||
        firstMount.episode.snapshot.state === "waiting_for_approval"
    ).toBe(true);

    const validationKeys = firstMount.episode.executedBrainKeys.filter((key) =>
      key.includes(":validation:")
    );

    const secondMount = await recoveryRunner.runUntilPause({
      organizationId: FIXTURE_ORG_ID,
      projectId,
      peerId: "demo",
      maxSteps: resolveEpisodeStepBudgetForEpisode(firstMount.episode),
    });

    expect(secondMount.episode.executedBrainKeys.filter((key) => key.includes(":validation:"))).toEqual(
      validationKeys
    );
    expect(secondMount.episode.snapshot.completedBrains).toContain("validation");
  });
});
