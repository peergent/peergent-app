import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { AppSupabaseClient } from "@/lib/intelligence/api/org-context";
import { createProjectEngineSnapshot } from "@/lib/brain/project-engine";
import { createEmptyArtifacts } from "@/lib/brain/project-runtime/project-artifact-store";
import {
  commitEpisodeCritical,
} from "@/lib/brain/project-runtime/episode-durable-persistence";
import { createProjectEpisodeRunner } from "@/lib/brain/project-runtime";
import { createSimulatedDurablePersistence } from "@/lib/brain/persistence/layer/simulated-durable-persistence";
import { simulatedDurableStore, resetSimulatedDurableStore } from "@/lib/brain/persistence/layer/simulated-durable-store";
import { SupabaseDurablePersistence } from "@/lib/brain/persistence/layer/supabase-durable-persistence";
import { createSupabaseLayerRepositories } from "@/lib/brain/persistence/layer/supabase-layer-repositories";
import { PersistenceConflictError } from "@/lib/brain/persistence/server/persistence-config";
import {
  configureLayerRepositories,
  resetConfiguredLayerRepositories,
} from "@/lib/brain/persistence/layer-repository-factory";
import { getDefaultProjectEpisodeRepository } from "@/lib/brain/project-runtime/project-episode-repository";
import { setActiveDurablePersistence } from "@/lib/brain/persistence/layer/active-durable-persistence";
import { createServerBrainRuntime, resetServerBrainRuntimeForTests } from "@/lib/brain/persistence/server/create-server-brain-runtime";
import type { ProjectEpisodeRecord } from "@/lib/brain/project-runtime/types";

const ORG = "00000000-0000-4000-8000-000000000001";

function buildEpisode(projectId: string, durableVersion?: number): ProjectEpisodeRecord {
  const snapshot = createProjectEngineSnapshot({
    projectId,
    peerId: "demo",
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
    ...(durableVersion !== undefined ? { durableVersion } : {}),
  };
}

function parsePersistenceLines(infoSpy: ReturnType<typeof vi.spyOn>, errorSpy: ReturnType<typeof vi.spyOn>) {
  return [...infoSpy.mock.calls, ...errorSpy.mock.calls]
    .map((call) => call[0])
    .filter((line): line is string => typeof line === "string" && line.includes("brain_persistence"))
    .map((line) => JSON.parse(line) as Record<string, unknown>);
}

describe("PX-50.7 durable version lifecycle", () => {
  let infoSpy: ReturnType<typeof vi.spyOn>;
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    resetConfiguredLayerRepositories();
    resetServerBrainRuntimeForTests();
    resetSimulatedDurableStore();
    infoSpy = vi.spyOn(console, "info").mockImplementation(() => {});
    errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubEnv("BRAIN_PERSISTENCE_DIAGNOSTICS", "1");
    vi.stubEnv("BRAIN_ORCHESTRATION_DIAGNOSTICS", "1");
  });

  afterEach(() => {
    resetConfiguredLayerRepositories();
    resetServerBrainRuntimeForTests();
    resetSimulatedDurableStore();
    infoSpy.mockRestore();
    errorSpy.mockRestore();
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("A: DB v1 hydrate → next commit sends expectedVersion=1", async () => {
    const durable = createSimulatedDurablePersistence();
    setActiveDurablePersistence(durable);
    configureLayerRepositories({ mode: "persistent_in_memory" });

    const stored = buildEpisode("proj-hydrate-v1", 1);
    simulatedDurableStore.upsertEpisode(stored, 0);

    const loaded = await durable.loadProjectEpisode({
      organizationId: ORG,
      projectId: "proj-hydrate-v1",
    });
    expect(loaded?.durableVersion).toBe(1);

    const rpc = vi.fn().mockResolvedValue({
      data: [{ new_version: 2, conflict: false }],
      error: null,
    });
    const supabase = { rpc } as unknown as AppSupabaseClient;
    const persistence = new SupabaseDurablePersistence(supabase);

    await persistence.persistEpisodeCritical(loaded!, 1);
    expect(rpc).toHaveBeenCalledWith(
      "upsert_brain_project_episode_versioned",
      expect.objectContaining({ p_expected_version: 1 })
    );
  });

  it("B: successful commit v1→v2 sets episode.durableVersion=2", async () => {
    const durable = createSimulatedDurablePersistence();
    const stored = buildEpisode("proj-v1-to-v2");
    simulatedDurableStore.upsertEpisode(stored, 0);
    const episode = await durable.loadProjectEpisode({
      organizationId: ORG,
      projectId: "proj-v1-to-v2",
    });

    await durable.persistEpisodeCritical(episode!, 1);
    expect(episode!.durableVersion).toBe(2);
    expect(
      simulatedDurableStore.getEpisode(ORG, "proj-v1-to-v2")?.version
    ).toBe(2);
  });

  it("C: commit after v2 only sends expectedVersion=2 when DB is v2", async () => {
    const durable = createSimulatedDurablePersistence();
    const stored = buildEpisode("proj-v2-commit");
    simulatedDurableStore.upsertEpisode(stored, 0);
    const episode = await durable.loadProjectEpisode({
      organizationId: ORG,
      projectId: "proj-v2-commit",
    })!;

    await durable.persistEpisodeCritical(episode!, 1);
    expect(episode!.durableVersion).toBe(2);

    const row = simulatedDurableStore.getEpisode(ORG, "proj-v2-commit");
    expect(row?.version).toBe(2);

    await durable.persistEpisodeCritical(episode!, 2);
    expect(episode!.durableVersion).toBe(3);
    expect(
      simulatedDurableStore.getEpisode(ORG, "proj-v2-commit")?.version
    ).toBe(3);
  });

  it("D: failed commit does not increment durableVersion", async () => {
    const durable = createSimulatedDurablePersistence();
    const stored = buildEpisode("proj-failed-commit");
    simulatedDurableStore.upsertEpisode(stored, 0);
    const episode = await durable.loadProjectEpisode({
      organizationId: ORG,
      projectId: "proj-failed-commit",
    });

    const stale = { ...episode!, durableVersion: 0 };
    await expect(
      durable.persistEpisodeCritical(stale, 0)
    ).rejects.toBeInstanceOf(PersistenceConflictError);
    expect(stale.durableVersion).toBe(0);
    expect(
      simulatedDurableStore.getEpisode(ORG, "proj-failed-commit")?.version
    ).toBe(1);
  });

  it("E: first-create conflict reload returns durableVersion=actualVersion", async () => {
    const durable = createSimulatedDurablePersistence();
    setActiveDurablePersistence(durable);
    configureLayerRepositories({ mode: "in_memory" });

    const stored = buildEpisode("proj-conflict-reload-version", 1);
    simulatedDurableStore.upsertEpisode(stored, 0);
    createServerBrainRuntime({ mode: "in_memory" });

    const runner = createProjectEpisodeRunner(undefined, durable);
    const resumed = await runner.startEpisode({
      organizationId: ORG,
      projectId: "proj-conflict-reload-version",
      peerId: "demo",
    });

    expect(resumed.durableVersion).toBe(1);
    const lines = parsePersistenceLines(infoSpy, errorSpy);
    expect(lines.some((line) => line.event === "episode_version_conflict_reload_state")).toBe(true);
  });

  it("F: L1 cache preserves conflict-reloaded version", async () => {
    const durable = createSimulatedDurablePersistence();
    setActiveDurablePersistence(durable);
    configureLayerRepositories({ mode: "in_memory" });

    const stored = buildEpisode("proj-l1-reload-version", 1);
    simulatedDurableStore.upsertEpisode(stored, 0);
    createServerBrainRuntime({ mode: "in_memory" });

    const runner = createProjectEpisodeRunner(undefined, durable);
    await runner.startEpisode({
      organizationId: ORG,
      projectId: "proj-l1-reload-version",
      peerId: "demo",
    });

    const l1 = getDefaultProjectEpisodeRepository().get({
      organizationId: ORG,
      projectId: "proj-l1-reload-version",
    });
    expect(l1?.durableVersion).toBe(1);
  });

  it("G: L1 cache after successful commit holds persisted durableVersion (not pre-persist stale)", async () => {
    const durable = createSimulatedDurablePersistence();
    setActiveDurablePersistence(durable);
    configureLayerRepositories({ mode: "persistent_in_memory" });

    const episode = buildEpisode("proj-l1-post-commit");
    await commitEpisodeCritical(episode, durable, { syncBrainDocs: false });
    expect(episode.durableVersion).toBe(1);

    episode.executedBrainKeys = ["brain:research:created"];
    await commitEpisodeCritical(episode, durable, { syncBrainDocs: false });
    expect(episode.durableVersion).toBe(2);

    const l1 = getDefaultProjectEpisodeRepository().get({
      organizationId: ORG,
      projectId: "proj-l1-post-commit",
    });
    expect(l1?.durableVersion).toBe(2);
  });

  it("H: post-brain commit after conflict reload succeeds v1→v2", async () => {
    const durable = createSimulatedDurablePersistence();
    setActiveDurablePersistence(durable);
    configureLayerRepositories({ mode: "in_memory" });

    const stored = buildEpisode("proj-post-reload-commit", 1);
    simulatedDurableStore.upsertEpisode(stored, 0);
    createServerBrainRuntime({ mode: "in_memory" });

    const runner = createProjectEpisodeRunner(undefined, durable);
    const resumed = await runner.startEpisode({
      organizationId: ORG,
      projectId: "proj-post-reload-commit",
      peerId: "demo",
    });
    expect(resumed.durableVersion).toBe(1);

    resumed.executedBrainKeys = ["corr:research:researching"];
    const committed = await commitEpisodeCritical(resumed, durable, { syncBrainDocs: false });
    expect(committed.durableVersion).toBe(2);
    expect(
      simulatedDurableStore.getEpisode(ORG, "proj-post-reload-commit")?.version
    ).toBe(2);
  });

  it("I: genuine stale concurrent mutation still throws PersistenceConflictError", async () => {
    const durable = createSimulatedDurablePersistence();
    configureLayerRepositories({ mode: "persistent_in_memory" });

    const episode = buildEpisode("proj-stale-concurrent");
    await commitEpisodeCritical(episode, durable, { syncBrainDocs: false });
    expect(episode.durableVersion).toBe(1);

    const stale = { ...episode, durableVersion: 0, executedBrainKeys: ["stale-mutation"] };
    await expect(
      commitEpisodeCritical(stale, durable, { syncBrainDocs: false })
    ).rejects.toBeInstanceOf(PersistenceConflictError);

    expect(
      simulatedDurableStore.getEpisode(ORG, "proj-stale-concurrent")?.version
    ).toBe(1);
  });

  it("write-through episode save does not invoke non-versioned upsertProjectEpisode", async () => {
    const from = vi.fn();
    const supabase = { from } as unknown as AppSupabaseClient;
    configureLayerRepositories({ mode: "supabase", supabase });

    const repos = createSupabaseLayerRepositories(supabase);
    repos.projectEpisode.save(buildEpisode("proj-no-write-through"));

    expect(from).not.toHaveBeenCalled();
  });

  it("RPC episode payload excludes durableVersion from JSON blob", async () => {
    const episode = buildEpisode("proj-strip-version", 2);
    const rpc = vi.fn().mockResolvedValue({
      data: [{ new_version: 3, conflict: false }],
      error: null,
    });
    const supabase = { rpc } as unknown as AppSupabaseClient;
    const persistence = new SupabaseDurablePersistence(supabase);

    await persistence.persistEpisodeCritical(episode, 2);

    const call = rpc.mock.calls[0]?.[1] as { p_episode: Record<string, unknown> };
    expect(call.p_episode).not.toHaveProperty("durableVersion");
    expect(episode.durableVersion).toBe(3);
  });

  it("commit emits version state before/after diagnostics", async () => {
    const durable = createSimulatedDurablePersistence();
    const episode = buildEpisode("proj-version-diagnostics");

    await commitEpisodeCritical(episode, durable, { syncBrainDocs: false });

    const events = parsePersistenceLines(infoSpy, errorSpy).map((line) => String(line.event));
    expect(events).toContain("episode_version_state_before_commit");
    expect(events).toContain("episode_version_state_after_commit");
    expect(events).toContain("episode_version_cache_write");
    expect(events.indexOf("episode_version_state_before_commit")).toBeLessThan(
      events.indexOf("episode_version_state_after_commit")
    );
  });

  it("failed commit does not write stale version to L1 cache", async () => {
    const durable = createSimulatedDurablePersistence();
    configureLayerRepositories({ mode: "persistent_in_memory" });

    const episode = buildEpisode("proj-no-stale-l1");
    await commitEpisodeCritical(episode, durable, { syncBrainDocs: false });
    expect(episode.durableVersion).toBe(1);

    const stale = { ...episode, durableVersion: 0 };
    await expect(
      commitEpisodeCritical(stale, durable, { syncBrainDocs: false })
    ).rejects.toBeInstanceOf(PersistenceConflictError);

    const l1 = getDefaultProjectEpisodeRepository().get({
      organizationId: ORG,
      projectId: "proj-no-stale-l1",
    });
    expect(l1?.durableVersion).toBe(1);
  });
});
