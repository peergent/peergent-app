/**
 * PX-53 — dependency reuse contract tests.
 */

import { describe, expect, it } from "vitest";
import { resolveCompletedDependency } from "@/lib/brain/integration/dependency-resolution";
import type { ProjectEpisodeRecord } from "@/lib/brain/project-runtime/types";
import { getBrainCapability } from "@/lib/brain/capabilities/registry";
import { emptyBrainStructuredOutput } from "@/lib/brain/evidence/structured-output";

function episodeWithStrategyComplete(): ProjectEpisodeRecord {
  return {
    episodeStatus: "running",
    lastError: null,
    campaignApprovalMode: "approval_before_publication",
    snapshot: {
      organizationId: "org-1",
      projectId: "proj-1",
      peerId: "demo",
      episodeId: "ep-1",
      state: "planning",
      completedBrains: ["strategy"],
      pendingBrains: ["planning", "creative", "validation"],
      approvalCheckpoint: null,
      activeBrain: null,
      brainHistory: [],
      decisionIds: [],
      eventLog: [],
      retryCount: {},
      waitingReason: null,
      updatedAt: new Date().toISOString(),
    },
    artifacts: {},
    resolvedGraphs: {},
    correlationId: "corr-1",
    executedBrainKeys: [],
    contextReady: true,
    contextGaps: [],
    sliceAvailability: {},
    memoryCheckpoint1Complete: false,
    memoryCheckpoint2Complete: false,
    validationApprovalPending: false,
    approvalSatisfied: false,
    approvalGrantedForExecution: false,
    performanceObservationsAvailable: false,
    durableVersion: 1,
    updatedAt: new Date().toISOString(),
  } as ProjectEpisodeRecord;
}

describe("PX-53 dependency resolution", () => {
  it("reuses completed strategy output for channel_planning dependency", () => {
    const def = getBrainCapability("strategy");
    const strategyOutput = emptyBrainStructuredOutput("strategy", def.version, new Date().toISOString());

    const plan = resolveCompletedDependency({
      dependencyId: "strategy",
      consumerCapabilityId: "channel_planning",
      episode: episodeWithStrategyComplete(),
      upstreamOutputs: { strategy: strategyOutput },
      contextVersion: 0,
    });

    expect(plan.action).toBe("reuse");
    expect(plan.resolution).toBe("reused_completed_output");
    expect(plan.output?.capabilityId).toBe("strategy");
  });

  it("blocks fresh execution when strategy never completed and output absent", () => {
    const plan = resolveCompletedDependency({
      dependencyId: "strategy",
      consumerCapabilityId: "channel_planning",
      episode: {
        ...episodeWithStrategyComplete(),
        snapshot: {
          ...episodeWithStrategyComplete().snapshot,
          completedBrains: [],
        },
      },
      upstreamOutputs: {},
      contextVersion: 0,
    });

    expect(plan.action).toBe("execute");
    expect(plan.resolution).toBe("unavailable");
  });

  it("re-executes when strategy brain completed but stored output invalidated", () => {
    const plan = resolveCompletedDependency({
      dependencyId: "strategy",
      consumerCapabilityId: "channel_planning",
      episode: episodeWithStrategyComplete(),
      upstreamOutputs: {},
      contextVersion: 0,
    });

    expect(plan.action).toBe("execute");
    expect(plan.resolution).toBe("invalidated_reexecute");
  });
});
