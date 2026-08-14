import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { AppSupabaseClient } from "@/lib/intelligence/api/org-context";
import { createProjectEngineSnapshot } from "@/lib/brain/project-engine";
import { createEmptyArtifacts } from "@/lib/brain/project-runtime/project-artifact-store";
import { commitEpisodeCritical } from "@/lib/brain/project-runtime/episode-durable-persistence";
import { computeEpisodeCommitPayloadMetrics } from "@/lib/brain/project-runtime/episode-commit-payload-metrics";
import { createSimulatedDurablePersistence } from "@/lib/brain/persistence/layer/simulated-durable-persistence";
import { simulatedDurableStore, resetSimulatedDurableStore } from "@/lib/brain/persistence/layer/simulated-durable-store";
import { SupabaseDurablePersistence } from "@/lib/brain/persistence/layer/supabase-durable-persistence";
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

describe("PX-50.8 final episode commit hang diagnosis", () => {
  let infoSpy: ReturnType<typeof vi.spyOn>;
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    resetSimulatedDurableStore();
    infoSpy = vi.spyOn(console, "info").mockImplementation(() => {});
    errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubEnv("BRAIN_PERSISTENCE_DIAGNOSTICS", "1");
  });

  afterEach(() => {
    resetSimulatedDurableStore();
    infoSpy.mockRestore();
    errorSpy.mockRestore();
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("payload metrics grow when resolvedGraphs include marketing_intelligence graph", () => {
    const base = buildEpisode("proj-payload-growth", 4);
    const baseMetrics = computeEpisodeCommitPayloadMetrics(base, 4);

    const withMi = {
      ...base,
      artifacts: {
        ...base.artifacts,
        companyOutputRef: "company:1",
        researchOutputRef: "research:1",
        reasoningOutputRef: "reasoning:1",
        marketingIntelligenceOutputRef: "mi:1",
      },
      resolvedGraphs: {
        companyGraph: { versionMeta: { version: 1 }, snapshot: { id: "c1" } },
        researchBrainGraph: { versionMeta: { version: 1 }, findings: [{ id: "f1", summary: "x".repeat(500) }] },
        reasoningBrainGraph: { versionMeta: { version: 1 }, conclusions: [{ id: "r1", text: "y".repeat(500) }] },
        marketingIntelligenceBrainGraph: {
          versionMeta: { version: 1 },
          audienceSegments: [{ segment: "s1", coreProblem: "z".repeat(800) }],
          channelIntelligence: [{ channel: "linkedin", funnelRole: "awareness".repeat(40) }],
        },
      },
    } as ProjectEpisodeRecord;

    const miMetrics = computeEpisodeCommitPayloadMetrics(withMi, 4);
    expect(miMetrics.resolvedGraphCount).toBe(4);
    expect(miMetrics.artifactCount).toBe(4);
    expect(miMetrics.payloadBytes).toBeGreaterThan(baseMetrics.payloadBytes);
    expect(miMetrics.resolvedGraphsJsonBytes).toBeGreaterThan(0);
  });

  it("simulated store succeeds v1→v2→v3→v4→v5 post-marketing_intelligence mutation", async () => {
    const durable = createSimulatedDurablePersistence();
    const stored = buildEpisode("proj-mi-commit-chain");
    simulatedDurableStore.upsertEpisode(stored, 0);

    let episode = (await durable.loadProjectEpisode({
      organizationId: ORG,
      projectId: "proj-mi-commit-chain",
    }))!;

    for (let expected = 1; expected <= 3; expected += 1) {
      episode = {
        ...episode,
        executedBrainKeys: [...episode.executedBrainKeys, `key-${expected}`],
      };
      await durable.persistEpisodeCritical(episode, expected);
      expect(episode.durableVersion).toBe(expected + 1);
    }
    expect(episode.durableVersion).toBe(4);

    episode = {
      ...episode,
      artifacts: {
        ...episode.artifacts,
        marketingIntelligenceOutputRef: "mi:output:1",
      },
      resolvedGraphs: {
        ...episode.resolvedGraphs,
        marketingIntelligenceBrainGraph: {
          versionMeta: { version: 1 },
          audienceSegments: [{ segment: "enterprise", coreProblem: "pipeline" }],
        },
      },
    };

    await commitEpisodeCritical(episode, durable, { syncBrainDocs: false });
    expect(episode.durableVersion).toBe(5);
    expect(simulatedDurableStore.getEpisode(ORG, "proj-mi-commit-chain")?.version).toBe(5);
  });

  it("Supabase RPC adapter emits request started/returned and lock probe before rpc()", async () => {
    const episode = buildEpisode("proj-rpc-instrumentation", 4);
    episode.resolvedGraphs = {
      marketingIntelligenceBrainGraph: { versionMeta: { version: 1 }, segments: [{ id: "s1" }] },
    };

    const rpc = vi.fn().mockResolvedValue({
      data: [{ new_version: 5, conflict: false }],
      error: null,
    });
    const maybeSingle = vi.fn().mockResolvedValue({ data: { version: 4 }, error: null });
    const eqProject = vi.fn().mockReturnValue({ maybeSingle });
    const eqOrg = vi.fn().mockReturnValue({ eq: eqProject });
    const select = vi.fn().mockReturnValue({ eq: eqOrg });
    const from = vi.fn().mockReturnValue({ select });
    const supabase = { rpc, from } as unknown as AppSupabaseClient;
    const persistence = new SupabaseDurablePersistence(supabase);

    await persistence.persistEpisodeCritical(episode, 4);

    expect(from).toHaveBeenCalledWith("brain_project_episodes");
    expect(rpc).toHaveBeenCalledTimes(1);

    const events = parsePersistenceLines(infoSpy, errorSpy).map((line) => String(line.event));
    expect(events).toContain("final_commit_payload_metrics");
    expect(events).toContain("persistence_episode_rpc_lock_probe_started");
    expect(events).toContain("persistence_episode_rpc_lock_probe_completed");
    expect(events).toContain("persistence_episode_rpc_request_started");
    expect(events).toContain("persistence_episode_rpc_request_returned");
    expect(events).toContain("persistence_episode_upsert_completed");
    expect(events.indexOf("persistence_episode_rpc_lock_probe_completed")).toBeLessThan(
      events.indexOf("persistence_episode_rpc_request_started")
    );
    expect(events.indexOf("persistence_episode_rpc_request_started")).toBeLessThan(
      events.indexOf("persistence_episode_rpc_request_returned")
    );
  });

  it("hanging rpc emits slow threshold timeout diagnostic without aborting early in test", async () => {
    vi.useFakeTimers();
    const episode = buildEpisode("proj-rpc-slow", 4);
    const rpc = vi.fn(
      () =>
        new Promise<{ data: unknown; error: null }>((resolve) => {
          setTimeout(
            () => resolve({ data: [{ new_version: 5, conflict: false }], error: null }),
            35_000
          );
        })
    );
    const maybeSingle = vi.fn().mockResolvedValue({ data: { version: 4 }, error: null });
    const eqProject = vi.fn().mockReturnValue({ maybeSingle });
    const eqOrg = vi.fn().mockReturnValue({ eq: eqProject });
    const select = vi.fn().mockReturnValue({ eq: eqOrg });
    const from = vi.fn().mockReturnValue({ select });
    const supabase = { rpc, from } as unknown as AppSupabaseClient;
    const persistence = new SupabaseDurablePersistence(supabase);

    const promise = persistence.persistEpisodeCritical(episode, 4);
    await vi.advanceTimersByTimeAsync(30_000);

    const events = parsePersistenceLines(infoSpy, errorSpy).map((line) => String(line.event));
    expect(events).toContain("persistence_episode_rpc_request_timeout");

    await vi.advanceTimersByTimeAsync(5_000);
    await promise;
    expect(episode.durableVersion).toBe(5);
    vi.useRealTimers();
  });
});
