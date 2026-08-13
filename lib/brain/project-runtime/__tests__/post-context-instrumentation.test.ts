import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createProjectEpisodeRunner,
  getDefaultProjectEpisodeRepository,
  resetDefaultProjectEpisodeRepository,
  FIXTURE_ORG_ID,
} from "@/lib/brain/project-runtime";
import { createProjectEngineSnapshot } from "@/lib/brain/project-engine";
import { createEmptyArtifacts } from "@/lib/brain/project-runtime/project-artifact-store";

const ORG = FIXTURE_ORG_ID;
const mockSupabase = {} as import("@/lib/intelligence/api/org-context").AppSupabaseClient;

function parseDiagnosticLines(infoSpy: ReturnType<typeof vi.spyOn>): Record<string, unknown>[] {
  return infoSpy.mock.calls
    .map((call) => call[0])
    .filter((line): line is string => typeof line === "string" && line.includes("brain_orchestration"))
    .map((line) => JSON.parse(line) as Record<string, unknown>);
}

function eventsFromLines(lines: Record<string, unknown>[]): string[] {
  return lines.map((line) => String(line.event));
}

describe("PX-50.1 post-context instrumentation", () => {
  let infoSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    resetDefaultProjectEpisodeRepository();
    infoSpy = vi.spyOn(console, "info").mockImplementation(() => {});
    vi.stubEnv("BRAIN_ORCHESTRATION_DIAGNOSTICS", "1");
  });

  afterEach(() => {
    infoSpy.mockRestore();
    vi.unstubAllEnvs();
    resetDefaultProjectEpisodeRepository();
  });

  it("emits loop and evaluation diagnostics on demo run without altering outcome", async () => {
    const runner = createProjectEpisodeRunner();
    const projectId = "proj-px501-instrument-demo";

    const result = await runner.runUntilPause({
      organizationId: ORG,
      projectId,
      peerId: "demo",
      maxSteps: 3,
    });

    const events = eventsFromLines(parseDiagnosticLines(infoSpy));
    expect(events).toContain("episode_loop_entering");
    expect(events).toContain("project_engine_evaluation_started");
    expect(events).toContain("project_engine_evaluated");
    expect(events).not.toContain("episode_context_acquired");

    expect(result.episode.snapshot.state).not.toBe("created");
    expect(result.status).toBeDefined();
  });

  it("emits episode_context_acquired after real-context acquisition", async () => {
    const acquireEpisodeContext = await import(
      "@/lib/brain/project-runtime/acquire-episode-context"
    );

    vi.spyOn(acquireEpisodeContext, "acquireEpisodeContext").mockResolvedValue({
      package: {} as never,
      sliceAvailability: { business: true, brand: false, website: false, campaign: true },
      contextReady: true,
      contextGaps: [],
      handoff: {
        companySnapshot: { organizationId: ORG } as never,
        brandGraph: null,
        campaignContext: { projectId: "proj-acquired" } as never,
        priorMemories: [],
      },
    });

    const runner = createProjectEpisodeRunner();
    const result = await runner.runUntilPause({
      organizationId: ORG,
      projectId: "proj-px501-acquired",
      peerId: "live-peer-not-demo",
      useRealContext: true,
      supabase: mockSupabase,
      campaignContext: {
        projectId: "proj-acquired",
        goals: ["Leads"],
        description: "Test objective",
      } as never,
      maxSteps: 4,
    });

    const lines = parseDiagnosticLines(infoSpy);
    const acquired = lines.find((line) => line.event === "episode_context_acquired");
    expect(acquired).toBeDefined();
    expect(acquired?.contextReady).toBe(true);
    expect(acquired?.contextGapCount).toBe(0);
    expect(acquired?.blockingContextGapCount).toBe(0);
    expect(acquired?.maxSteps).toBe(4);
    expect(acquired?.episodeStatus).toBe("running");
    expect(acquired?.sliceAvailability).toEqual({
      business: true,
      brand: false,
      website: false,
      campaign: true,
    });

    const events = eventsFromLines(lines);
    expect(events.indexOf("episode_context_acquired")).toBeLessThan(events.indexOf("episode_loop_entering"));
    expect(events).toContain("episode_loop_entering");
    expect(result.status).toBeDefined();
  });

  it("does not enter loop when acquisition gate blocks — behavior unchanged", async () => {
    const acquireEpisodeContext = await import(
      "@/lib/brain/project-runtime/acquire-episode-context"
    );

    vi.spyOn(acquireEpisodeContext, "acquireEpisodeContext").mockResolvedValue({
      package: {} as never,
      sliceAvailability: { business: false, website: false, campaign: true },
      contextReady: false,
      contextGaps: [
        {
          kind: "business",
          requiredBy: "project_engine",
          reason: "Business profile is incomplete.",
          blocking: true,
          resolutionType: "customer_input",
        },
      ],
      handoff: {
        companySnapshot: { organizationId: ORG } as never,
        brandGraph: null,
        campaignContext: { projectId: "proj-blocked" } as never,
        priorMemories: [],
      },
    });

    const runner = createProjectEpisodeRunner();
    const result = await runner.runUntilPause({
      organizationId: ORG,
      projectId: "proj-px501-gate-block",
      peerId: "live-peer-not-demo",
      useRealContext: true,
      supabase: mockSupabase,
      campaignContext: { projectId: "proj-blocked", goals: ["Leads"], description: "Test" } as never,
      maxSteps: 5,
    });

    const events = eventsFromLines(parseDiagnosticLines(infoSpy));
    expect(events).toContain("episode_context_acquired");
    expect(events).toContain("context_gap_blocked");
    expect(events).not.toContain("episode_loop_entering");
    expect(events).not.toContain("project_engine_evaluation_started");

    expect(result.status).toBe("waiting_for_context");
    expect(result.episode.snapshot.completedBrains).not.toContain("strategy");
  });

  it("emits episode_loop_terminal_break without evaluating when episode is terminal", async () => {
    const runner = createProjectEpisodeRunner();
    const projectId = "proj-px501-terminal";
    const snapshot = createProjectEngineSnapshot({
      projectId,
      peerId: "demo",
      organizationId: ORG,
    });

    getDefaultProjectEpisodeRepository().save({
      snapshot,
      artifacts: createEmptyArtifacts({
        organizationId: ORG,
        projectId,
        episodeId: snapshot.episodeId,
        correlationId: "corr-terminal",
      }),
      episodeStatus: "failed",
      contextReady: true,
      sliceAvailability: { business: true, brand: true, website: true, campaign: true },
      approvalSatisfied: false,
      validationApprovalPending: false,
      memoryCheckpoint1Complete: false,
      memoryCheckpoint2Complete: false,
      performanceObservationsAvailable: false,
      approvalGrantedForExecution: false,
      contextGaps: [],
      executedBrainKeys: [],
      lastError: "prior_failure",
      correlationId: "corr-terminal",
      startedAt: snapshot.startedAt,
      updatedAt: snapshot.updatedAt,
      completedAt: null,
      resolvedGraphs: {},
    });

    const result = await runner.runUntilPause({
      organizationId: ORG,
      projectId,
      peerId: "demo",
      maxSteps: 5,
    });

    const lines = parseDiagnosticLines(infoSpy);
    const terminal = lines.find((line) => line.event === "episode_loop_terminal_break");
    expect(terminal).toBeDefined();
    expect(terminal?.episodeStatus).toBe("failed");
    expect(terminal?.snapshotState).toBe("created");
    expect(terminal?.step).toBe(0);

    const events = eventsFromLines(lines);
    expect(events).toContain("episode_loop_entering");
    expect(events).not.toContain("project_engine_evaluation_started");
    expect(result.status).toBe("failed");
    expect(result.episode.lastError).toBe("prior_failure");
  });

  it("emits project_engine_context_blocked when engine blocks on slices", async () => {
    const runner = createProjectEpisodeRunner();
    const projectId = "proj-px501-slice-block";

    await runner.startEpisode({
      organizationId: ORG,
      projectId,
      peerId: "demo",
      contextReady: true,
      sliceAvailability: {
        business: true,
        brand: false,
        website: false,
        campaign: true,
        competitors: false,
      },
    });

    const result = await runner.runUntilPause({
      organizationId: ORG,
      projectId,
      peerId: "demo",
      maxSteps: 6,
    });

    const lines = parseDiagnosticLines(infoSpy);
    const blocked = lines.find((line) => line.event === "project_engine_context_blocked");
    expect(blocked).toBeDefined();
    expect(blocked?.contextReady).toBe(true);
    expect(blocked?.reason).toBeTruthy();
    expect(typeof blocked?.step).toBe("number");

    const events = eventsFromLines(lines);
    const evalStartedIdx = events.indexOf("project_engine_evaluation_started");
    const evalDoneIdx = events.indexOf("project_engine_evaluated");
    const blockedIdx = events.indexOf("project_engine_context_blocked");
    expect(evalStartedIdx).toBeGreaterThanOrEqual(0);
    expect(evalDoneIdx).toBeGreaterThan(evalStartedIdx);
    expect(blockedIdx).toBeGreaterThan(evalDoneIdx);

    expect(result.status === "waiting_for_context" || result.missingContext.length > 0).toBe(true);
  });

  it("diagnostic payloads exclude customer content fields", async () => {
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
        campaignContext: {
          projectId: "proj-secret",
          description: "SECRET_CUSTOMER_OBJECTIVE",
          goals: ["SECRET_GOAL"],
        } as never,
        priorMemories: [],
      },
    });

    const runner = createProjectEpisodeRunner();
    await runner.runUntilPause({
      organizationId: ORG,
      projectId: "proj-px501-no-payload",
      peerId: "live-peer-not-demo",
      useRealContext: true,
      supabase: mockSupabase,
      campaignContext: {
        projectId: "proj-secret",
        description: "SECRET_CUSTOMER_OBJECTIVE",
        goals: ["SECRET_GOAL"],
      } as never,
      maxSteps: 2,
    });

    const serialized = infoSpy.mock.calls.map((call) => String(call[0])).join("\n");
    expect(serialized).not.toContain("SECRET_CUSTOMER_OBJECTIVE");
    expect(serialized).not.toContain("SECRET_GOAL");
    expect(serialized).not.toContain("description");
  });
});
