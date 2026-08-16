import { beforeEach, describe, expect, it, vi } from "vitest";
import { createProductionBrainExecutionAdapter } from "../production-brain-adapter";
import { executeRegistryBrainForEpisode } from "../execute-registry-brain-for-episode";
import { executeBrainForProjectBrain } from "@/lib/brain/integration/execute-brain-for-workflow-step";
import type { ProjectEpisodeRecord } from "../types";

vi.mock("../execute-registry-brain-for-episode", () => ({
  executeRegistryBrainForEpisode: vi.fn(),
}));

vi.mock("@/lib/brain/integration/execute-brain-for-workflow-step", () => ({
  executeBrainForProjectBrain: vi.fn(),
}));

const registryMock = vi.mocked(executeRegistryBrainForEpisode);
const capabilityMock = vi.mocked(executeBrainForProjectBrain);

function minimalEpisode(): ProjectEpisodeRecord {
  return {
    snapshot: {
      episodeId: "ep-1",
      organizationId: "org-1",
      projectId: "proj-1",
      peerId: "emma",
      state: "validating",
      completedBrains: ["creative"],
      pendingBrains: ["validation"],
      retryCount: {},
    },
    artifacts: {
      organizationId: "org-1",
      projectId: "proj-1",
      episodeId: "ep-1",
      correlationId: "c1",
      memoryOutputRefs: [],
      performanceObservationIds: [],
      approvalIds: [],
      learningProposalIds: [],
    },
    episodeStatus: "running",
    contextReady: true,
    sliceAvailability: {},
    approvalSatisfied: false,
    validationApprovalPending: false,
    memoryCheckpoint1Complete: false,
    memoryCheckpoint2Complete: false,
    performanceObservationsAvailable: false,
    approvalGrantedForExecution: false,
    contextGaps: [],
    executedBrainKeys: [],
    lastError: null,
    correlationId: "c1",
    startedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    completedAt: null,
    resolvedGraphs: {},
  } as ProjectEpisodeRecord;
}

describe("PX-52 production brain adapter pipeline graph routing", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    registryMock.mockResolvedValue({
      brainId: "validation",
      status: "completed",
      output: {
        outputRef: "validation:org-1:proj-1:1",
        capabilityIds: ["validation"],
        decisionIds: [],
        generatedAt: new Date().toISOString(),
      },
      events: [],
      confidence: { value: 0.8, label: "high" },
      durationMs: 1,
      errorCode: null,
      requiresApproval: true,
      approvalKind: "campaign_approval",
    });
    capabilityMock.mockResolvedValue({
      result: {
        run: { capabilityId: "strategy", status: "completed", usage: {} },
        output: null,
        assembly: { state: "complete", gaps: [] },
        policy: { decision: "allow" },
        presentation: null,
        cacheHit: false,
      },
      resolvedUpstreamOutputs: {},
    } as never);
  });

  it("routes validation through registry executor, not BrainRuntime readiness gate", async () => {
    const adapter = createProductionBrainExecutionAdapter({
      peerId: "emma",
      project: { id: "proj-1", campaignSetup: { setupMode: "automatic" } } as never,
      domainInput: { peerId: "emma", organizationId: "org-1" } as never,
    });

    await adapter.execute({
      brainId: "validation",
      episode: minimalEpisode(),
      contextHandoff: {
        companySnapshot: { organizationId: "org-1", profile: {} } as never,
        brandGraph: null,
        campaignContext: { projectId: "proj-1", goals: ["Leads"], description: "x" } as never,
        priorMemories: [],
      },
      locale: "en",
      idempotencyKey: "val-1",
    });

    expect(registryMock).toHaveBeenCalledWith(
      expect.objectContaining({ brainId: "validation" })
    );
    expect(capabilityMock).not.toHaveBeenCalled();
  });

  it("routes strategy through BrainRuntime capability path", async () => {
    const adapter = createProductionBrainExecutionAdapter({
      peerId: "emma",
      project: { id: "proj-1" } as never,
      domainInput: { peerId: "emma", organizationId: "org-1" } as never,
    });

    await adapter.execute({
      brainId: "strategy",
      episode: minimalEpisode(),
      contextHandoff: {
        companySnapshot: { organizationId: "org-1", profile: {} } as never,
        brandGraph: null,
        campaignContext: { projectId: "proj-1", goals: ["Leads"], description: "x" } as never,
        priorMemories: [],
      },
      locale: "en",
      idempotencyKey: "str-1",
    });

    expect(capabilityMock).toHaveBeenCalled();
    expect(registryMock).not.toHaveBeenCalled();
  });
});
