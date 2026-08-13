import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createProjectEngineSnapshot } from "@/lib/brain/project-engine";
import { createEmptyArtifacts } from "@/lib/brain/project-runtime/project-artifact-store";
import { commitEpisodeCritical } from "@/lib/brain/project-runtime/episode-durable-persistence";
import { createSimulatedDurablePersistence } from "@/lib/brain/persistence/layer/simulated-durable-persistence";
import { createProjectEpisodeRunner } from "@/lib/brain/project-runtime";
import { PersistenceConflictError } from "@/lib/brain/persistence/server/persistence-config";
import type { ProjectEpisodeRecord } from "@/lib/brain/project-runtime/types";

const ORG = "org-px501-commit";

function parsePersistenceLines(infoSpy: ReturnType<typeof vi.spyOn>, errorSpy: ReturnType<typeof vi.spyOn>) {
  return [...infoSpy.mock.calls, ...errorSpy.mock.calls]
    .map((call) => call[0])
    .filter((line): line is string => typeof line === "string" && line.includes("brain_persistence"))
    .map((line) => JSON.parse(line) as Record<string, unknown>);
}

function buildEpisode(projectId: string): ProjectEpisodeRecord {
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
      correlationId: "corr-commit-test",
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
    correlationId: "corr-commit-test",
    startedAt: snapshot.startedAt,
    updatedAt: snapshot.updatedAt,
    completedAt: null,
    resolvedGraphs: {},
  };
}

describe("PX-50.1 episode commit persistence instrumentation", () => {
  let infoSpy: ReturnType<typeof vi.spyOn>;
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    infoSpy = vi.spyOn(console, "info").mockImplementation(() => {});
    errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubEnv("BRAIN_PERSISTENCE_DIAGNOSTICS", "1");
  });

  afterEach(() => {
    infoSpy.mockRestore();
    errorSpy.mockRestore();
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("successful critical commit emits entered → persist started → completed in order", async () => {
    const durable = createSimulatedDurablePersistence();
    const episode = buildEpisode("proj-commit-ok");

    await commitEpisodeCritical(episode, durable, { syncBrainDocs: false });

    const events = parsePersistenceLines(infoSpy, errorSpy).map((line) => String(line.event));
    expect(events.indexOf("episode_commit_critical_entered")).toBeLessThan(
      events.indexOf("episode_commit_persist_started")
    );
    expect(events.indexOf("episode_commit_persist_started")).toBeLessThan(
      events.indexOf("persistence_episode_upsert_started")
    );
    expect(events.indexOf("persistence_episode_upsert_started")).toBeLessThan(
      events.indexOf("persistence_episode_upsert_completed")
    );
    expect(events.indexOf("persistence_episode_upsert_completed")).toBeLessThan(
      events.indexOf("episode_commit_persist_completed")
    );
    expect(events).toContain("episode_commit_critical_completed");
    expect(episode.durableVersion).toBe(1);
  });

  it("persistence rejection emits *_failed and rethrows without a second successful commit", async () => {
    const durable = createSimulatedDurablePersistence();
    const episode = buildEpisode("proj-commit-fail");
    await commitEpisodeCritical(episode, durable, { syncBrainDocs: false });

    const stale = { ...episode, durableVersion: 0 };
    await expect(
      commitEpisodeCritical(stale, durable, { syncBrainDocs: false })
    ).rejects.toBeInstanceOf(PersistenceConflictError);

    const lines = parsePersistenceLines(infoSpy, errorSpy);
    expect(lines.some((line) => line.event === "episode_commit_persist_failed")).toBe(true);
    expect(lines.some((line) => line.event === "persistence_conflict")).toBe(true);
    expect(lines.some((line) => line.event === "episode_commit_critical_failed")).toBe(true);
    expect(
      lines.filter((line) => line.event === "episode_commit_critical_completed").length
    ).toBe(1);
  });

  it("Supabase RPC error propagates with operation diagnostics", async () => {
    const episode = buildEpisode("proj-supabase-fail");
    const rpc = vi.fn().mockRejectedValue(new TypeError("client.rpc is not a function"));
    const supabase = { rpc } as unknown as AppSupabaseClient;

    const module = await import("@/lib/brain/persistence/layer/supabase-durable-persistence");
    const persistence = new module.SupabaseDurablePersistence(supabase);

    await expect(persistence.persistEpisodeCritical(episode, 0)).rejects.toThrow(
      "client.rpc is not a function"
    );

    const failed = parsePersistenceLines(infoSpy, errorSpy).find(
      (line) => line.event === "persistence_episode_upsert_failed"
    );
    expect(failed).toBeDefined();
    expect(failed?.operation).toBe("rpc.upsert_brain_project_episode_versioned");
    expect(failed?.errorName).toBe("TypeError");
    expect(rpc).toHaveBeenCalledWith(
      "upsert_brain_project_episode_versioned",
      expect.objectContaining({ p_project_id: "proj-supabase-fail" })
    );
  });

  it("orchestration does not proceed when startEpisode critical commit fails", async () => {
    const acquireEpisodeContext = await import(
      "@/lib/brain/project-runtime/acquire-episode-context"
    );
    vi.spyOn(acquireEpisodeContext, "acquireEpisodeContext").mockResolvedValue({
      package: {} as never,
      sliceAvailability: { business: true, campaign: true },
      contextReady: true,
      contextGaps: [],
      handoff: {
        companySnapshot: { organizationId: ORG } as never,
        brandGraph: null,
        campaignContext: { projectId: "proj-runner-block" } as never,
        priorMemories: [],
      },
    });

    const durable = createSimulatedDurablePersistence();
    const episodeMod = await import("@/lib/brain/project-runtime/episode-durable-persistence");
    vi.spyOn(episodeMod, "commitEpisodeCritical").mockRejectedValueOnce(
      new Error("persist_episode_critical_failed")
    );

    const runner = createProjectEpisodeRunner(undefined, durable);

    await expect(
      runner.runUntilPause({
        organizationId: ORG,
        projectId: "proj-runner-block",
        peerId: "live-peer-not-demo",
        useRealContext: true,
        supabase: {} as never,
        campaignContext: { projectId: "proj-runner-block", goals: ["Leads"], description: "Test" } as never,
        maxSteps: 3,
      })
    ).rejects.toThrow("persist_episode_critical_failed");

    const orchEvents = infoSpy.mock.calls
      .map((call) => call[0])
      .filter((line): line is string => typeof line === "string" && line.includes("brain_orchestration"))
      .map((line) => String((JSON.parse(line) as { event: string }).event));

    expect(orchEvents).not.toContain("episode_loop_entering");
    expect(orchEvents).not.toContain("project_engine_evaluation_started");
  });

  it("diagnostic payloads exclude customer episode content", async () => {
    const durable = createSimulatedDurablePersistence();
    const episode = buildEpisode("proj-no-customer");
    episode.contextGaps = [
      {
        kind: "business",
        requiredBy: "project_engine",
        reason: "SECRET_GAP_REASON",
        blocking: true,
        resolutionType: "customer_input",
      },
    ];

    await commitEpisodeCritical(episode, durable, { syncBrainDocs: false });

    const serialized = [...infoSpy.mock.calls, ...errorSpy.mock.calls]
      .map((call) => String(call[0]))
      .join("\n");
    expect(serialized).not.toContain("SECRET_GAP_REASON");
    expect(serialized).not.toContain('"episode":');
    expect(serialized).not.toContain("pendingBrains");
  });
});
