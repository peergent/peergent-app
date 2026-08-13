import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { AppSupabaseClient } from "@/lib/intelligence/api/org-context";
import { createProjectEpisodeRunner } from "@/lib/brain/project-runtime";
import { commitEpisodeCritical } from "@/lib/brain/project-runtime/episode-durable-persistence";
import { createSimulatedDurablePersistence } from "@/lib/brain/persistence/layer/simulated-durable-persistence";
import { simulatedDurableStore, resetSimulatedDurableStore } from "@/lib/brain/persistence/layer/simulated-durable-store";
import { PersistenceConflictError, PersistenceInfrastructureError } from "@/lib/brain/persistence/server/persistence-config";
import {
  configureLayerRepositories,
  getLayerRepositories,
  resetConfiguredLayerRepositories,
} from "@/lib/brain/persistence/layer-repository-factory";
import { getDefaultProjectEpisodeRepository } from "@/lib/brain/project-runtime/project-episode-repository";
import { createServerBrainRuntime, resetServerBrainRuntimeForTests } from "@/lib/brain/persistence/server/create-server-brain-runtime";
import { setActiveDurablePersistence } from "@/lib/brain/persistence/layer/active-durable-persistence";
import { loadProjectEpisode } from "@/lib/brain/persistence/layer/supabase-sync";
import { createEmptyArtifacts } from "@/lib/brain/project-runtime/project-artifact-store";
import type { ProjectEpisodeRecord } from "@/lib/brain/project-runtime/types";
import { createProjectEngineSnapshot } from "@/lib/brain/project-engine";

const ORG = "00000000-0000-4000-8000-000000000001";
const ORG_B = "00000000-0000-4000-8000-000000000099";

function buildStoredEpisode(projectId: string, peerId = "demo"): ProjectEpisodeRecord {
  const snapshot = createProjectEngineSnapshot({
    projectId,
    peerId,
    organizationId: ORG,
  });
  return {
    snapshot,
    artifacts: createEmptyArtifacts({
      organizationId: ORG,
      projectId,
      episodeId: snapshot.episodeId,
      correlationId: `corr-${projectId}`,
    }),
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
    correlationId: `corr-${projectId}`,
    startedAt: snapshot.startedAt,
    updatedAt: snapshot.updatedAt,
    completedAt: null,
    resolvedGraphs: {},
    durableVersion: 1,
  };
}

describe("PX-50.5 durable episode resume", () => {
  beforeEach(() => {
    resetConfiguredLayerRepositories();
    resetServerBrainRuntimeForTests();
    resetSimulatedDurableStore();
    vi.stubEnv("BRAIN_PERSISTENCE_DIAGNOSTICS", "1");
    vi.stubEnv("BRAIN_ORCHESTRATION_DIAGNOSTICS", "1");
  });

  afterEach(() => {
    resetConfiguredLayerRepositories();
    resetServerBrainRuntimeForTests();
    resetSimulatedDurableStore();
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("A: existing durable row v1 + empty L1 → runUntilPause loads durable row, startEpisode NOT called", async () => {
    const infoSpy = vi.spyOn(console, "info").mockImplementation(() => {});
    const durable = createSimulatedDurablePersistence();
    setActiveDurablePersistence(durable);
    configureLayerRepositories({ mode: "in_memory" });

    const stored = buildStoredEpisode("proj-durable-resume");
    simulatedDurableStore.upsertEpisode(stored, 0);

    const runner = createProjectEpisodeRunner(undefined, durable);
    await runner.runUntilPause({
      organizationId: ORG,
      projectId: "proj-durable-resume",
      peerId: "demo",
      maxSteps: 0,
    });

    const orchLines = infoSpy.mock.calls
      .map((call) => call[0])
      .filter((line): line is string => typeof line === "string" && line.includes("brain_orchestration"))
      .map((line) => JSON.parse(line) as { event: string; source?: string; found?: boolean; durableVersion?: number; episodeId?: string });

    const lookup = orchLines.find((line) => line.event === "runner_episode_lookup_completed");
    expect(lookup?.found).toBe(true);
    expect(lookup?.source).toBe("durable");
    expect(lookup?.durableVersion).toBe(1);
    expect(lookup?.episodeId).toBe(stored.snapshot.episodeId);
    expect(orchLines.some((line) => line.event === "episode_start_invoked")).toBe(false);

    const l1 = getDefaultProjectEpisodeRepository().get({
      organizationId: ORG,
      projectId: "proj-durable-resume",
    });
    expect(l1?.snapshot.episodeId).toBe(stored.snapshot.episodeId);
    expect(l1?.durableVersion).toBeGreaterThanOrEqual(1);
    infoSpy.mockRestore();
  });

  it("B: Supabase loadProjectEpisode preserves database version column", async () => {
    const episodeJson = buildStoredEpisode("proj-loader-version");
    const supabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({
                data: { episode: episodeJson, version: 3 },
                error: null,
              }),
            }),
          }),
        }),
      }),
    } as unknown as AppSupabaseClient;

    const loaded = await loadProjectEpisode(supabase, {
      organizationId: ORG,
      projectId: "proj-loader-version",
    });
    expect(loaded?.durableVersion).toBe(3);
    expect(loaded?.snapshot.episodeId).toBe(episodeJson.snapshot.episodeId);
  });

  it("C: concurrent first-create — second instance reloads v1 and resumes without failure", async () => {
    const infoSpy = vi.spyOn(console, "info").mockImplementation(() => {});
    const durable = createSimulatedDurablePersistence();
    setActiveDurablePersistence(durable);
    configureLayerRepositories({ mode: "in_memory" });

    const runnerA = createProjectEpisodeRunner(undefined, durable);
    const first = await runnerA.startEpisode({
      organizationId: ORG,
      projectId: "proj-concurrent-create",
      peerId: "demo",
    });
    expect(first.durableVersion).toBe(1);

    createServerBrainRuntime({ mode: "in_memory" });

    const runnerB = createProjectEpisodeRunner(undefined, durable);
    const result = await runnerB.runUntilPause({
      organizationId: ORG,
      projectId: "proj-concurrent-create",
      peerId: "demo",
      maxSteps: 0,
    });

    expect(result.episode.snapshot.episodeId).toBe(first.snapshot.episodeId);
    expect(result.episode.durableVersion).toBeGreaterThanOrEqual(1);

    const orchLines = infoSpy.mock.calls
      .map((call) => call[0])
      .filter((line): line is string => typeof line === "string" && line.includes("brain_orchestration"))
      .map((line) => JSON.parse(line) as { event: string; source?: string });

    const lookup = orchLines.find((line) => line.event === "runner_episode_lookup_completed");
    expect(lookup?.source).toBe("durable");
    expect(orchLines.some((line) => line.event === "episode_conflict_reload")).toBe(false);
    expect(orchLines.filter((line) => line.event === "episode_start_invoked").length).toBe(1);
    infoSpy.mockRestore();
  });

  it("C2: startEpisode first-create conflict reloads durable row instead of throwing", async () => {
    const infoSpy = vi.spyOn(console, "info").mockImplementation(() => {});
    const durable = createSimulatedDurablePersistence();
    setActiveDurablePersistence(durable);
    configureLayerRepositories({ mode: "in_memory" });

    const stored = buildStoredEpisode("proj-start-conflict-reload");
    simulatedDurableStore.upsertEpisode(stored, 0);

    createServerBrainRuntime({ mode: "in_memory" });

    const runner = createProjectEpisodeRunner(undefined, durable);
    const resumed = await runner.startEpisode({
      organizationId: ORG,
      projectId: "proj-start-conflict-reload",
      peerId: "demo",
    });

    expect(resumed.durableVersion).toBe(1);
    expect(resumed.snapshot.episodeId).toBe(stored.snapshot.episodeId);

    const orchLines = infoSpy.mock.calls
      .map((call) => call[0])
      .filter((line): line is string => typeof line === "string" && line.includes("brain_orchestration"))
      .map((line) => JSON.parse(line) as { event: string });
    expect(orchLines.some((line) => line.event === "episode_conflict_reload")).toBe(true);
    infoSpy.mockRestore();
  });

  it("D: stale update conflict during normal commit still fails", async () => {
    const durable = createSimulatedDurablePersistence();
    setActiveDurablePersistence(durable);
    configureLayerRepositories({ mode: "persistent_in_memory" });

    const runner = createProjectEpisodeRunner(undefined, durable);
    const episode = await runner.startEpisode({
      organizationId: ORG,
      projectId: "proj-stale-update",
      peerId: "demo",
    });
    expect(episode.durableVersion).toBe(1);

    const stale = { ...episode, durableVersion: 0 };
    await expect(
      commitEpisodeCritical(stale, durable, { syncBrainDocs: false })
    ).rejects.toBeInstanceOf(PersistenceConflictError);
  });

  it("E: cross-org durable lookup returns null", async () => {
    const durable = createSimulatedDurablePersistence();
    const stored = buildStoredEpisode("proj-cross-org");
    simulatedDurableStore.upsertEpisode(stored, 0);

    const foreign = await durable.loadProjectEpisode({
      organizationId: ORG_B,
      projectId: "proj-cross-org",
    });
    expect(foreign).toBeNull();
  });

  it("F: repository reconfiguration does not cause false new-episode when durable row exists", async () => {
    const infoSpy = vi.spyOn(console, "info").mockImplementation(() => {});
    const durable = createSimulatedDurablePersistence();
    setActiveDurablePersistence(durable);
    configureLayerRepositories({ mode: "in_memory" });

    const runnerA = createProjectEpisodeRunner(undefined, durable);
    const first = await runnerA.startEpisode({
      organizationId: ORG,
      projectId: "proj-reconfig-resume",
      peerId: "demo",
    });

    createServerBrainRuntime({ mode: "in_memory" });

    const runnerB = createProjectEpisodeRunner(undefined, durable);
    await runnerB.runUntilPause({
      organizationId: ORG,
      projectId: "proj-reconfig-resume",
      peerId: "demo",
      maxSteps: 0,
    });

    const orchLines = infoSpy.mock.calls
      .map((call) => call[0])
      .filter((line): line is string => typeof line === "string" && line.includes("brain_orchestration"))
      .map((line) => JSON.parse(line) as { event: string; source?: string });

    const lookup = orchLines.find((line) => line.event === "runner_episode_lookup_completed");
    expect(lookup?.source).toBe("durable");
    expect(orchLines.filter((line) => line.event === "episode_start_invoked").length).toBe(1);

    const l1 = getDefaultProjectEpisodeRepository().get({
      organizationId: ORG,
      projectId: "proj-reconfig-resume",
    });
    expect(l1?.snapshot.episodeId).toBe(first.snapshot.episodeId);
    infoSpy.mockRestore();
  });

  it("rejects durable episode with peer scope mismatch", async () => {
    const durable = createSimulatedDurablePersistence();
    setActiveDurablePersistence(durable);
    configureLayerRepositories({ mode: "persistent_in_memory" });

    const stored = buildStoredEpisode("proj-peer-mismatch", "other-peer");
    simulatedDurableStore.upsertEpisode(stored, 0);

    const runner = createProjectEpisodeRunner(undefined, durable);
    await expect(
      runner.runUntilPause({
        organizationId: ORG,
        projectId: "proj-peer-mismatch",
        peerId: "demo",
        maxSteps: 0,
      })
    ).rejects.toBeInstanceOf(PersistenceInfrastructureError);
  });
});

describe("PX-50.5 hydration version propagation", () => {
  beforeEach(() => {
    resetConfiguredLayerRepositories();
    resetSimulatedDurableStore();
  });

  afterEach(() => {
    resetConfiguredLayerRepositories();
    resetSimulatedDurableStore();
  });

  it("simulated hydration preserves version column separately from episode json", async () => {
    const durable = createSimulatedDurablePersistence();
    setActiveDurablePersistence(durable);
    configureLayerRepositories({ mode: "persistent_in_memory" });

    const stored = buildStoredEpisode("proj-hydrate-version");
    delete (stored as { durableVersion?: number }).durableVersion;
    simulatedDurableStore.upsertEpisode(stored, 0);

    await durable.hydrateProject({ organizationId: ORG, projectId: "proj-hydrate-version" });

    const hydrated = getLayerRepositories().projectEpisode.get({
      organizationId: ORG,
      projectId: "proj-hydrate-version",
    });
    expect(hydrated?.durableVersion).toBe(1);
  });
});
