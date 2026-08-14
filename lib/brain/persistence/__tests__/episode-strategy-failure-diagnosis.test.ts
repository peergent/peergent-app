import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createProjectEngineSnapshot } from "@/lib/brain/project-engine";
import { createEmptyArtifacts } from "@/lib/brain/project-runtime/project-artifact-store";
import { createProjectEpisodeRunner } from "@/lib/brain/project-runtime";
import { createSimulatedDurablePersistence } from "@/lib/brain/persistence/layer/simulated-durable-persistence";
import { simulatedDurableStore, resetSimulatedDurableStore } from "@/lib/brain/persistence/layer/simulated-durable-store";
import {
  configureLayerRepositories,
  resetConfiguredLayerRepositories,
} from "@/lib/brain/persistence/layer-repository-factory";
import { setActiveDurablePersistence } from "@/lib/brain/persistence/layer/active-durable-persistence";
import type { ProjectBrainExecutionAdapter } from "@/lib/brain/project-runtime/types";
import type { BrainResult, BrainOutput } from "@/lib/brain/project-engine/brain-contract";
import type { ProjectEpisodeRecord } from "@/lib/brain/project-runtime/types";

const ORG = "00000000-0000-4000-8000-000000000001";

function buildEpisodePostMiAtVersion5(projectId: string): ProjectEpisodeRecord {
  const snapshot = createProjectEngineSnapshot({
    projectId,
    peerId: "demo",
    organizationId: ORG,
  });
  return {
    snapshot: {
      ...snapshot,
      state: "strategizing",
      completedBrains: ["company", "research", "reasoning", "marketing_intelligence"],
      activeBrain: null,
    },
    artifacts: {
      ...createEmptyArtifacts({
        organizationId: ORG,
        projectId,
        episodeId: snapshot.episodeId,
        correlationId: `corr-${projectId}`,
      }),
      companyOutputRef: "company:1",
      researchOutputRef: "research:1",
      reasoningOutputRef: "reasoning:1",
      marketingIntelligenceOutputRef: "mi:1",
    },
    episodeStatus: "running",
    contextReady: true,
    sliceAvailability: { business: true, campaign: true, goals: true },
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
    durableVersion: 5,
  };
}

describe("PX-50.9 strategy failure terminal persistence", () => {
  beforeEach(() => {
    resetConfiguredLayerRepositories();
    resetSimulatedDurableStore();
    vi.stubEnv("BRAIN_ORCHESTRATION_DIAGNOSTICS", "1");
    vi.stubEnv("BRAIN_PERSISTENCE_DIAGNOSTICS", "1");
  });

  afterEach(() => {
    resetConfiguredLayerRepositories();
    resetSimulatedDurableStore();
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("post-MI at v5 → strategy fails → terminal failed episode at v7", async () => {
    const infoSpy = vi.spyOn(console, "info").mockImplementation(() => {});
    const durable = createSimulatedDurablePersistence();
    setActiveDurablePersistence(durable);
    configureLayerRepositories({ mode: "persistent_in_memory" });

    const stored = buildEpisodePostMiAtVersion5("proj-strategy-fail-v7");
    let seeded = { ...stored, durableVersion: undefined as number | undefined };
    for (let expected = 0; expected < 5; expected += 1) {
      const { newVersion } = simulatedDurableStore.upsertEpisode(
        { ...seeded, durableVersion: expected === 0 ? undefined : expected },
        expected
      );
      seeded = { ...seeded, durableVersion: newVersion };
    }
    expect(seeded.durableVersion).toBe(5);

    const adapter: ProjectBrainExecutionAdapter = {
      async execute(input) {
        if (input.brainId === "strategy") {
          return {
            brainId: "strategy",
            status: "failed",
            output: null,
            events: [],
            confidence: null,
            durationMs: 12,
            errorCode: "capability_failed",
            requiresApproval: false,
            approvalKind: null,
          } satisfies BrainResult<BrainOutput>;
        }
        return {
          brainId: input.brainId,
          status: "completed",
          output: {
            outputRef: `${input.brainId}:ref`,
            capabilityIds: ["test"],
            decisionIds: [],
            generatedAt: new Date().toISOString(),
          },
          events: [],
          confidence: null,
          durationMs: 1,
          errorCode: null,
          requiresApproval: false,
          approvalKind: null,
        };
      },
    };

    const runner = createProjectEpisodeRunner(undefined, durable, adapter);
    const result = await runner.runUntilPause({
      organizationId: ORG,
      projectId: "proj-strategy-fail-v7",
      peerId: "demo",
      maxSteps: 5,
    });

    expect(result.status).toBe("failed");
    expect(result.episode.episodeStatus).toBe("failed");
    expect(result.episode.snapshot.state).toBe("failed");
    expect(result.episode.snapshot.activeBrain).toBe("strategy");
    expect(result.episode.lastError).toBe("capability_failed");
    expect(result.episode.durableVersion).toBe(7);
    expect(simulatedDurableStore.getEpisode(ORG, "proj-strategy-fail-v7")?.version).toBe(7);

    const orchLines = infoSpy.mock.calls
      .map((call) => call[0])
      .filter((line): line is string => typeof line === "string" && line.includes("brain_orchestration"))
      .map((line) => JSON.parse(line) as { event: string; brainId?: string; errorCode?: string });

    expect(orchLines.some((line) => line.event === "episode_runner_brain_failure_persisted")).toBe(true);
    const failureEvt = orchLines.find((line) => line.event === "episode_runner_brain_failure_persisted");
    expect(failureEvt?.brainId).toBe("strategy");
    expect(failureEvt?.errorCode).toBe("capability_failed");
    infoSpy.mockRestore();
  });
});
