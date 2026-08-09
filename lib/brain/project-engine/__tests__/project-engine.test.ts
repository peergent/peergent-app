import { describe, expect, it } from "vitest";
import {
  advanceProjectEpisode,
  createProjectEngineSnapshot,
  evaluateProjectEpisode,
  projectSnapshotFromCampaignRun,
  canTransitionProjectState,
  capabilitiesForBrain,
} from "@/lib/brain/project-engine";
import type { CampaignRunState } from "@/lib/peer-experience/marketing/campaign-execution/campaign-run-types";

describe("Project Engine", () => {
  it("creates a project snapshot in created state", () => {
    const snapshot = createProjectEngineSnapshot({
      projectId: "proj-1",
      peerId: "demo",
      organizationId: "org-1",
      locale: "en",
    });

    expect(snapshot.state).toBe("created");
    expect(snapshot.pendingBrains.length).toBeGreaterThan(5);
    expect(snapshot.eventLog[0]?.type).toBe("project_created");
  });

  it("evaluates collect_context when context is missing", () => {
    const snapshot = createProjectEngineSnapshot({
      projectId: "proj-1",
      peerId: "demo",
      organizationId: "org-1",
    });

    const eval_ = evaluateProjectEpisode({
      snapshot: { ...snapshot, state: "collecting_context" },
      contextReady: false,
    });

    expect(eval_.blocked).toBe(true);
    expect(eval_.action.kind).toBe("collect_context");
  });

  it("schedules research when context is ready", () => {
    const snapshot = createProjectEngineSnapshot({
      projectId: "proj-1",
      peerId: "demo",
      organizationId: "org-1",
    });

    const eval_ = evaluateProjectEpisode({
      snapshot: { ...snapshot, state: "collecting_context" },
      contextReady: true,
    });

    expect(eval_.action.kind).toBe("run_brain");
    expect(eval_.action.brainId).toBe("research");
    expect(eval_.blocked).toBe(false);
  });

  it("advances to researching after context ready", () => {
    const snapshot = createProjectEngineSnapshot({
      projectId: "proj-1",
      peerId: "demo",
      organizationId: "org-1",
    });

    const result = advanceProjectEpisode({
      snapshot: { ...snapshot, state: "collecting_context" },
      contextReady: true,
    });

    expect(result.snapshot.state).toBe("researching");
    expect(result.snapshot.eventLog.some((e) => e.type === "context_ready")).toBe(true);
  });

  it("maps campaign run state to project engine snapshot", () => {
    const run: CampaignRunState = {
      campaignRunId: "run-1",
      status: "running",
      currentStage: "strategy",
      startedAt: new Date().toISOString(),
      idempotencyKey: "key-1",
      organizationId: "org-1",
      peerId: "demo",
      projectId: "proj-1",
    };

    const snapshot = projectSnapshotFromCampaignRun(run);
    expect(snapshot.state).toBe("strategizing");
    expect(snapshot.episodeId).toBe("run-1");
  });

  it("defines valid state transitions", () => {
    expect(canTransitionProjectState("created", "collecting_context")).toBe(true);
    expect(canTransitionProjectState("complete", "researching")).toBe(false);
  });

  it("maps creative brain to creative_generation capability (PX-35 hook)", () => {
    expect(capabilitiesForBrain("creative")).toContain("creative_generation");
  });

  it("blocks on waiting_for_approval until satisfied", () => {
    const snapshot = createProjectEngineSnapshot({
      projectId: "proj-1",
      peerId: "demo",
      organizationId: "org-1",
    });

    const eval_ = evaluateProjectEpisode({
      snapshot: {
        ...snapshot,
        state: "waiting_for_approval",
        waitingReason: "approval_required",
      },
      approvalSatisfied: false,
    });

    expect(eval_.blocked).toBe(true);
    expect(eval_.action.kind).toBe("wait");
  });
});
