import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  configureLayerRepositories,
  resetConfiguredLayerRepositories,
  resetLayerRepositoryStores,
} from "../layer-repository-factory";
import { createSimulatedDurablePersistence } from "../layer/simulated-durable-persistence";
import {
  resetSimulatedDurableStore,
  simulatedDurableStore,
} from "../layer/simulated-durable-store";
import {
  resetActiveDurablePersistence,
  setActiveDurablePersistence,
} from "../layer/active-durable-persistence";
import { resolveBrainOutputRef } from "../layer/resolve-brain-output-ref";
import {
  PersistenceConfigurationError,
  resolveBrainPersistenceMode,
} from "../server/persistence-config";
import { createServerBrainRuntime, resetServerBrainRuntimeForTests } from "../server/create-server-brain-runtime";
import { resetDefaultCompanyRepository } from "../../layers/company";
import { resetDefaultResearchBrainRepository, resetDefaultResearchProviderRegistry } from "../../layers/research";
import { resetDefaultReasoningBrainRepository } from "../../layers/reasoning";
import { resetDefaultMarketingIntelligenceBrainRepository } from "../../layers/marketing-intelligence";
import { resetDefaultStrategyBrainRepository } from "../../layers/strategy";
import { resetDefaultPlanningBrainRepository, resetPlanningBrainLayerCounters } from "../../layers/planning";
import { resetDefaultCreativeRepository } from "../../layers/creative/creative-repository";
import { resetDefaultValidationRepository } from "../../layers/validation/validation-repository";
import { resetDefaultMemoryRepository, getDefaultMemoryRepository } from "../../layers/memory";
import { resetDefaultExecutionRepository, getDefaultExecutionRepository } from "../../layers/execution";
import { resetDefaultLearningBrainRepository, resetLearningBrainLayerCounters } from "../../layers/learning";
import {
  createProjectEpisodeRunner,
  resetDefaultProjectEpisodeRepository,
  submitProjectApprovalDurable,
  buildFixturePerformanceObservations,
  resolveBrainOutputs,
  FIXTURE_ORG_ID,
  getDefaultProjectEpisodeRepository,
} from "../../project-runtime";
import { PersistenceConflictError } from "../server/persistence-config";

const ORG = FIXTURE_ORG_ID;

function resetProcessLocalState(): void {
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
  resetDefaultLearningBrainRepository();
  resetLearningBrainLayerCounters();
  resetDefaultProjectEpisodeRepository();
  resetLayerRepositoryStores();
  resetConfiguredLayerRepositories();
  configureLayerRepositories({ mode: "persistent_in_memory" });
  resetActiveDurablePersistence();
}

function setupProcessA(): ReturnType<typeof createSimulatedDurablePersistence> {
  resetSimulatedDurableStore();
  resetProcessLocalState();
  const durable = createSimulatedDurablePersistence();
  setActiveDurablePersistence(durable);
  return durable;
}

function coldStartProcess(organizationId: string, projectId: string): ReturnType<typeof createSimulatedDurablePersistence> {
  resetProcessLocalState();
  const durable = createSimulatedDurablePersistence();
  setActiveDurablePersistence(durable);
  durable.hydrateProject({ organizationId, projectId });
  return durable;
}

async function runUntilApproval(projectId: string, runner: ReturnType<typeof createProjectEpisodeRunner>) {
  let result = await runner.runUntilPause({ organizationId: ORG, projectId, peerId: "demo", maxSteps: 200 });
  let guard = 0;
  while (result.status === "running" && guard < 80) {
    guard += 1;
    result = await runner.runUntilPause({ organizationId: ORG, projectId, peerId: "demo", maxSteps: 40 });
    if (result.status !== "running") break;
  }
  return result;
}

async function runFullEpisodeDurable(
  projectId: string,
  runner: ReturnType<typeof createProjectEpisodeRunner>
) {
  let result = await runner.runUntilPause({ organizationId: ORG, projectId, peerId: "demo", maxSteps: 200 });
  let guard = 0;

  while (result.status !== "completed" && result.status !== "failed" && guard < 40) {
    guard += 1;
    if (result.status === "waiting_for_approval") {
      await submitProjectApprovalDurable({
        projectId,
        organizationId: ORG,
        approvalId: `approval-${Date.now()}-${guard}`,
        decision: "approved",
        actor: "customer@test.com",
      });
      result = await runner.resumeEpisode({ organizationId: ORG, projectId, approvalSatisfied: true });
      continue;
    }
    if (result.status === "waiting_for_outcomes" || result.episode.snapshot.state === "monitoring") {
      result = await runner.resumeEpisode({
        organizationId: ORG,
        projectId,
        performanceObservations: buildFixturePerformanceObservations(projectId),
      });
      continue;
    }
    if (result.status === "running") {
      result = await runner.runUntilPause({ organizationId: ORG, projectId, peerId: "demo", maxSteps: 120 });
    }
  }
  return result;
}

async function runUntilExecution(
  projectId: string,
  runner: ReturnType<typeof createProjectEpisodeRunner>
) {
  let result = await runUntilApproval(projectId, runner);
  let guard = 0;
  while (!result.episode.snapshot.completedBrains.includes("execution") && guard < 20) {
    guard += 1;
    if (result.status === "waiting_for_approval") {
      await submitProjectApprovalDurable({
        projectId,
        organizationId: ORG,
        approvalId: `approval-exec-${guard}`,
        decision: "approved",
        actor: "customer@test.com",
      });
      result = await runner.resumeEpisode({ organizationId: ORG, projectId, approvalSatisfied: true });
      continue;
    }
    if (result.status === "running") {
      result = await runner.runUntilPause({ organizationId: ORG, projectId, peerId: "demo", maxSteps: 80 });
    }
  }
  return result;
}

describe("PX-48.1 Production Persistence Activation", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    resetServerBrainRuntimeForTests();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    resetSimulatedDurableStore();
    resetProcessLocalState();
    resetServerBrainRuntimeForTests();
  });

  it("production composition root selects supabase when client provided", () => {
    const mockSupabase = {} as import("@/lib/intelligence/api/org-context").AppSupabaseClient;
    vi.stubEnv("NODE_ENV", "production");
    const runtime = createServerBrainRuntime({ supabase: mockSupabase, mode: "supabase" });
    expect(runtime.mode).toBe("supabase");
    expect(runtime.durable?.mode).toBe("supabase");
  });

  it("production cannot silently fall back to memory-only mode", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("BRAIN_PERSISTENCE_MODE", "in_memory");
    expect(() => resolveBrainPersistenceMode()).toThrow(PersistenceConfigurationError);
  });

  it("test mode remains in-memory without durable port", () => {
    resetProcessLocalState();
    configureLayerRepositories({ mode: "in_memory" });
    const runner = createProjectEpisodeRunner(undefined, null);
    expect(runner).toBeDefined();
  });

  it("cold-start restores episode and brain graphs from simulated durable store", async () => {
    setupProcessA();
    const projectId = "proj-cold-start-1";
    const runnerA = createProjectEpisodeRunner();
    const resultA = await runUntilApproval(projectId, runnerA);
    expect(resultA.status).toBe("waiting_for_approval");
    expect(resultA.episode.artifacts.strategyOutputRef).toBeTruthy();

    coldStartProcess(ORG, projectId);
    const episodeB = getDefaultProjectEpisodeRepository().get({ organizationId: ORG, projectId });
    expect(episodeB?.episodeStatus).toBe("waiting_for_approval");
    expect(episodeB?.executedBrainKeys.length).toBeGreaterThan(0);

    const resolved = resolveBrainOutputs({
      organizationId: ORG,
      projectId,
      artifacts: episodeB!.artifacts,
    });
    expect(resolved.strategyBrainGraph).toBeTruthy();
    expect(resolved.companyGraph).toBeTruthy();
  });

  it("cold-start outputRef resolution is repository-backed", async () => {
    setupProcessA();
    const projectId = "proj-output-ref-1";
    await runUntilApproval(projectId, createProjectEpisodeRunner());
    const episode = getDefaultProjectEpisodeRepository().get({ organizationId: ORG, projectId })!;
    const strategyRef = episode.artifacts.strategyOutputRef;
    expect(strategyRef).toBeTruthy();

    coldStartProcess(ORG, projectId);
    const resolved = await resolveBrainOutputRef({
      organizationId: ORG,
      outputRef: strategyRef!,
      projectId,
    });
    expect(resolved.found).toBe(true);
    expect(resolved.source).toBe("durable");
  });

  it("cold-start approval restoration and resume execution", async () => {
    setupProcessA();
    const projectId = "proj-cold-exec-1";
    const runnerA = createProjectEpisodeRunner();
    const resultA = await runUntilExecution(projectId, runnerA);
    expect(resultA.episode.snapshot.completedBrains).toContain("execution");

    coldStartProcess(ORG, projectId);
    const episodeC = getDefaultProjectEpisodeRepository().get({ organizationId: ORG, projectId })!;
    expect(episodeC.snapshot.completedBrains).toContain("execution");
    const approvals = getDefaultProjectEpisodeRepository().getApprovals(projectId);
    expect(approvals.some((a) => a.decision === "approved")).toBe(true);
  });

  it("execution idempotency prevents duplicate external execution after restart", async () => {
    setupProcessA();
    const projectId = "proj-idem-1";
    const runnerA = createProjectEpisodeRunner();
    const execResult = await runUntilExecution(projectId, runnerA);
    expect(execResult.episode.snapshot.completedBrains).toContain("execution");

    const executionBefore = getDefaultExecutionRepository().getLatest({ organizationId: ORG, projectId });
    expect(executionBefore).toBeTruthy();
    const batchKey = executionBefore!.batchIdempotencyKey;

    coldStartProcess(ORG, projectId);
    const durable = createSimulatedDurablePersistence();
    setActiveDurablePersistence(durable);
    const prior = await durable.lookupExecutionIdempotency({ organizationId: ORG, idempotencyKey: batchKey });
    expect(prior?.status).toBe("succeeded");

    const { createExecutionLayer } = await import("../../layers/execution/execution-layer");
    const layer = createExecutionLayer(undefined, undefined, durable);
    const duplicate = await layer.produceAndStore({
      organizationId: ORG,
      projectId,
      episodeId: "ep-1",
      correlationId: "corr-1",
      locale: "en",
      idempotencyKey: batchKey,
      validationState: "READY",
      approvalGranted: true,
      deliverables: [],
      dryRun: false,
    });
    expect(duplicate.outputRef).toBe(executionBefore!.outputRef);
  });

  it("optimistic concurrency rejects stale episode writes", async () => {
    setupProcessA();
    const durable = createSimulatedDurablePersistence();
    const projectId = "proj-concurrency-1";
    const runner = createProjectEpisodeRunner(undefined, durable);
    const episode = await runner.startEpisode({ organizationId: ORG, projectId, peerId: "demo" });
    expect(episode.durableVersion).toBe(1);

    await expect(
      durable.persistEpisodeCritical(episode, 0)
    ).rejects.toBeInstanceOf(PersistenceConflictError);
  });

  it("org isolation on outputRef resolution", async () => {
    setupProcessA();
    const projectId = "proj-org-iso-1";
    await runUntilApproval(projectId, createProjectEpisodeRunner());
    const episode = getDefaultProjectEpisodeRepository().get({ organizationId: ORG, projectId })!;
    const ref = episode.artifacts.companyOutputRef!;
    coldStartProcess(ORG, projectId);

    const foreign = await resolveBrainOutputRef({
      organizationId: "org-foreign-00000000-0000-0000-0000-000000000099",
      outputRef: ref,
      projectId,
    });
    expect(foreign.found).toBe(false);
  });

  it("project 2 consumes project 1 memory after full cold start", async () => {
    setupProcessA();
    const project1 = "proj-mem-p1";
    const runner = createProjectEpisodeRunner();
    const result = await runFullEpisodeDurable(project1, runner);
    expect(result.status).toBe("completed");
    const memoriesP1 = getDefaultMemoryRepository().getOrgMemories(ORG);
    expect(memoriesP1.length).toBeGreaterThan(0);

    coldStartProcess(ORG, project1);
    const memoriesHydrated = getDefaultMemoryRepository().getOrgMemories(ORG);
    expect(memoriesHydrated.length).toBe(memoriesP1.length);

    const project2 = "proj-mem-p2";
    coldStartProcess(ORG, project2);
    await createProjectEpisodeRunner().startEpisode({ organizationId: ORG, projectId: project2, peerId: "demo" });
    const memoriesForP2 = getDefaultMemoryRepository().getOrgMemories(ORG);
    expect(memoriesForP2.length).toBeGreaterThan(0);
  });

  it("gold-standard cold start: process A → B → C lifecycle", async () => {
    setupProcessA();
    const projectId = "proj-gold-standard";
    const runnerA = createProjectEpisodeRunner();

    const phaseA = await runUntilApproval(projectId, runnerA);
    expect(phaseA.status).toBe("waiting_for_approval");

    coldStartProcess(ORG, projectId);
    const runnerB = createProjectEpisodeRunner();
    const phaseB = await runUntilExecution(projectId, runnerB);
    expect(phaseB.episode.snapshot.completedBrains).toContain("execution");

    coldStartProcess(ORG, projectId);
    const runnerC = createProjectEpisodeRunner();
    let result = await runnerC.resumeEpisode({
      organizationId: ORG,
      projectId,
      performanceObservations: buildFixturePerformanceObservations(projectId),
    });
    result = await runFullEpisodeDurable(projectId, runnerC);
    expect(result.status).toBe("completed");
    expect(result.episode.snapshot.completedBrains).toContain("learning");
    expect(getDefaultMemoryRepository().getOrgMemories(ORG).length).toBeGreaterThan(0);
  });

  it("partial failure: stale episode version conflict is recoverable via reload", async () => {
    setupProcessA();
    const durable = createSimulatedDurablePersistence();
    const projectId = "proj-partial-1";
    const runner = createProjectEpisodeRunner(undefined, durable);
    const episode = await runner.startEpisode({ organizationId: ORG, projectId, peerId: "demo" });

    const stale = { ...episode, durableVersion: 0 };
    await expect(durable.persistEpisodeCritical(stale, 0)).rejects.toBeInstanceOf(PersistenceConflictError);

    const reloaded = simulatedDurableStore.getEpisode(ORG, projectId);
    expect(reloaded?.version).toBe(1);
    expect(reloaded?.episode.durableVersion).toBe(1);
  });
});
