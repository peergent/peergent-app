import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createProjectEngineSnapshot } from "@/lib/brain/project-engine";
import { createEmptyArtifacts } from "@/lib/brain/project-runtime/project-artifact-store";
import { SupabaseDurablePersistence } from "@/lib/brain/persistence/layer/supabase-durable-persistence";
import { PersistenceConflictError, PersistenceInfrastructureError } from "@/lib/brain/persistence/server/persistence-config";
import type { ProjectEpisodeRecord } from "@/lib/brain/project-runtime/types";
import type { AppSupabaseClient } from "@/lib/intelligence/api/org-context";

const ORG = "00000000-0000-4000-8000-000000000001";

function buildEpisode(projectId: string): ProjectEpisodeRecord {
  const snapshot = createProjectEngineSnapshot({
    projectId,
    peerId: "peer-live",
    organizationId: ORG,
  });
  return {
    snapshot,
    artifacts: createEmptyArtifacts({
      organizationId: ORG,
      projectId,
      episodeId: snapshot.episodeId,
      correlationId: "corr-rpc-test",
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
    correlationId: "corr-rpc-test",
    startedAt: snapshot.startedAt,
    updatedAt: snapshot.updatedAt,
    completedAt: null,
    resolvedGraphs: {},
  };
}

function parsePersistenceLines(infoSpy: ReturnType<typeof vi.spyOn>, errorSpy: ReturnType<typeof vi.spyOn>) {
  return [...infoSpy.mock.calls, ...errorSpy.mock.calls]
    .map((call) => call[0])
    .filter((line): line is string => typeof line === "string" && line.includes("brain_persistence"))
    .map((line) => JSON.parse(line) as Record<string, unknown>);
}

describe("PX-50.2 Supabase episode RPC persistence", () => {
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
  });

  it("invokes upsert_brain_project_episode_versioned on the Supabase client rpc(), not from().rpc", async () => {
    const episode = buildEpisode("proj-rpc-client");
    const rpc = vi.fn().mockResolvedValue({
      data: [{ new_version: 1, conflict: false }],
      error: null,
    });
    const from = vi.fn();
    const supabase = { rpc, from } as unknown as AppSupabaseClient;
    const persistence = new SupabaseDurablePersistence(supabase);

    const result = await persistence.persistEpisodeCritical(episode, 0);

    expect(rpc).toHaveBeenCalledTimes(1);
    expect(rpc).toHaveBeenCalledWith(
      "upsert_brain_project_episode_versioned",
      expect.objectContaining({
        p_organization_id: ORG,
        p_project_id: "proj-rpc-client",
        p_expected_version: 0,
        p_episode_id: episode.snapshot.episodeId,
        p_peer_id: "peer-live",
        p_correlation_id: "corr-rpc-test",
        p_episode_status: "running",
        p_current_state: "created",
      })
    );
    expect(from).toHaveBeenCalledWith("brain_project_episodes");
    expect(result.newVersion).toBe(1);
    expect(episode.durableVersion).toBe(1);
  });

  it("returns version from RPC and emits persistence upsert completed diagnostics", async () => {
    const episode = buildEpisode("proj-rpc-success");
    const supabase = {
      rpc: vi.fn().mockResolvedValue({
        data: [{ new_version: 2, conflict: false }],
        error: null,
      }),
    } as unknown as AppSupabaseClient;
    const persistence = new SupabaseDurablePersistence(supabase);

    await persistence.persistEpisodeCritical(episode, 1);

    const events = parsePersistenceLines(infoSpy, errorSpy).map((line) => String(line.event));
    expect(events).toContain("persistence_episode_upsert_started");
    expect(events.indexOf("persistence_episode_upsert_started")).toBeLessThan(
      events.indexOf("persistence_episode_upsert_completed")
    );
    expect(episode.durableVersion).toBe(2);
  });

  it("propagates Supabase RPC errors as PersistenceInfrastructureError", async () => {
    const episode = buildEpisode("proj-rpc-error");
    const supabase = {
      rpc: vi.fn().mockResolvedValue({
        data: null,
        error: { message: "permission denied for function upsert_brain_project_episode_versioned" },
      }),
    } as unknown as AppSupabaseClient;
    const persistence = new SupabaseDurablePersistence(supabase);

    await expect(persistence.persistEpisodeCritical(episode, 0)).rejects.toBeInstanceOf(
      PersistenceInfrastructureError
    );

    const failed = parsePersistenceLines(infoSpy, errorSpy).find(
      (line) => line.event === "persistence_episode_upsert_failed"
    );
    expect(failed?.operation).toBe("rpc.upsert_brain_project_episode_versioned");
    expect(String(failed?.reason)).toContain("permission denied");
  });

  it("throws PersistenceConflictError when RPC reports version conflict", async () => {
    const episode = buildEpisode("proj-rpc-conflict");
    const supabase = {
      rpc: vi.fn().mockResolvedValue({
        data: [{ new_version: 3, conflict: true }],
        error: null,
      }),
    } as unknown as AppSupabaseClient;
    const persistence = new SupabaseDurablePersistence(supabase);

    await expect(persistence.persistEpisodeCritical(episode, 0)).rejects.toBeInstanceOf(
      PersistenceConflictError
    );

    expect(parsePersistenceLines(infoSpy, errorSpy).some((line) => line.event === "persistence_conflict")).toBe(
      true
    );
  });

  it("does not log episode json payloads in diagnostics", async () => {
    const episode = buildEpisode("proj-rpc-no-payload");
    episode.contextGaps = [
      {
        kind: "business",
        requiredBy: "project_engine",
        reason: "SECRET_CUSTOMER_GAP",
        blocking: true,
        resolutionType: "customer_input",
      },
    ];
    const supabase = {
      rpc: vi.fn().mockResolvedValue({
        data: [{ new_version: 1, conflict: false }],
        error: null,
      }),
    } as unknown as AppSupabaseClient;
    const persistence = new SupabaseDurablePersistence(supabase);

    await persistence.persistEpisodeCritical(episode, 0);

    const serialized = [...infoSpy.mock.calls, ...errorSpy.mock.calls]
      .map((call) => String(call[0]))
      .join("\n");
    expect(serialized).not.toContain("SECRET_CUSTOMER_GAP");
    expect(serialized).not.toContain("pendingBrains");
    expect(serialized).not.toContain('"episode":');
  });
});
