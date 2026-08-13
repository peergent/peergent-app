import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createProjectEpisodeRunner } from "@/lib/brain/project-runtime";
import { createSimulatedDurablePersistence } from "@/lib/brain/persistence/layer/simulated-durable-persistence";
import { PersistenceConflictError } from "@/lib/brain/persistence/server/persistence-config";
import {
  configureLayerRepositories,
  getLayerRepositories,
  resetConfiguredLayerRepositories,
} from "@/lib/brain/persistence/layer-repository-factory";
import { getDefaultProjectEpisodeRepository } from "@/lib/brain/project-runtime/project-episode-repository";
import { createServerBrainRuntime, resetServerBrainRuntimeForTests } from "@/lib/brain/persistence/server/create-server-brain-runtime";
import { setActiveDurablePersistence } from "@/lib/brain/persistence/layer/active-durable-persistence";

const ORG = "00000000-0000-4000-8000-000000000001";

describe("PX-50.4 episode version conflict diagnosis", () => {
  beforeEach(() => {
    resetConfiguredLayerRepositories();
    resetServerBrainRuntimeForTests();
    vi.stubEnv("BRAIN_PERSISTENCE_DIAGNOSTICS", "1");
    vi.stubEnv("BRAIN_ORCHESTRATION_DIAGNOSTICS", "1");
  });

  afterEach(() => {
    resetConfiguredLayerRepositories();
    resetServerBrainRuntimeForTests();
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("startEpisode always commits with initial durableVersion 0 when episode object is new", async () => {
    const durable = createSimulatedDurablePersistence();
    const runner = createProjectEpisodeRunner(undefined, durable);

    await runner.startEpisode({
      organizationId: ORG,
      projectId: "proj-fresh-start",
      peerId: "demo",
    });

    const stored = getDefaultProjectEpisodeRepository().get({
      organizationId: ORG,
      projectId: "proj-fresh-start",
    });
    expect(stored?.durableVersion).toBe(1);
  });

  it("second startEpisode on same project conflicts when L1 was reset but durable store retained version 1", async () => {
    const durable = createSimulatedDurablePersistence();
    setActiveDurablePersistence(durable);
    configureLayerRepositories({ mode: "persistent_in_memory" });

    const runnerA = createProjectEpisodeRunner(undefined, durable);
    await runnerA.startEpisode({
      organizationId: ORG,
      projectId: "proj-l1-reset",
      peerId: "demo",
    });

    createServerBrainRuntime({ mode: "persistent_in_memory" });

    const runnerB = createProjectEpisodeRunner(undefined, durable);
    await expect(
      runnerB.startEpisode({
        organizationId: ORG,
        projectId: "proj-l1-reset",
        peerId: "demo",
      })
    ).rejects.toBeInstanceOf(PersistenceConflictError);
  });

  it("runUntilPause skips startEpisode when L1 cache hit preserves hydrated episode", async () => {
    const infoSpy = vi.spyOn(console, "info").mockImplementation(() => {});
    const durable = createSimulatedDurablePersistence();
    setActiveDurablePersistence(durable);
    configureLayerRepositories({ mode: "persistent_in_memory" });

    const runner = createProjectEpisodeRunner(undefined, durable);
    const _committed = await runner.startEpisode({
      organizationId: ORG,
      projectId: "proj-cache-hit",
      peerId: "demo",
    });

    await runner.runUntilPause({
      organizationId: ORG,
      projectId: "proj-cache-hit",
      peerId: "demo",
      maxSteps: 0,
    });

    const orchLines = infoSpy.mock.calls
      .map((call) => call[0])
      .filter((line): line is string => typeof line === "string" && line.includes("brain_orchestration"))
      .map((line) => JSON.parse(line) as { event: string; found?: boolean; initialDurableVersion?: number });

    const lookup = orchLines.find((line) => line.event === "runner_episode_lookup_completed");
    expect(lookup?.found).toBe(true);
    const startInvokedCount = orchLines.filter((line) => line.event === "episode_start_invoked").length;
    expect(startInvokedCount).toBe(1);

    const afterRun = getDefaultProjectEpisodeRepository().get({
      organizationId: ORG,
      projectId: "proj-cache-hit",
    });
    expect(afterRun?.durableVersion).toBeGreaterThanOrEqual(1);
    infoSpy.mockRestore();
  });

  it("hydration from simulated store preserves version column separately from episode json", async () => {
    const durable = createSimulatedDurablePersistence();
    setActiveDurablePersistence(durable);
    configureLayerRepositories({ mode: "persistent_in_memory" });

    const runner = createProjectEpisodeRunner(undefined, durable);
    await runner.startEpisode({
      organizationId: ORG,
      projectId: "proj-hydrate-version",
      peerId: "demo",
    });

    createServerBrainRuntime({ mode: "persistent_in_memory" });
    await durable.hydrateProject({ organizationId: ORG, projectId: "proj-hydrate-version" });

    const hydrated = getLayerRepositories().projectEpisode.get({
      organizationId: ORG,
      projectId: "proj-hydrate-version",
    });
    expect(hydrated).not.toBeNull();
    expect(hydrated?.durableVersion).toBe(1);
  });
});
