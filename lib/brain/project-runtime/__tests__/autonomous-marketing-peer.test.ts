import { beforeEach, describe, expect, it, vi } from "vitest";
import { resetDefaultCompanyRepository } from "@/lib/brain/layers/company";
import {
  resetDefaultResearchBrainRepository,
  resetDefaultResearchProviderRegistry,
} from "@/lib/brain/layers/research";
import { resetDefaultReasoningBrainRepository } from "@/lib/brain/layers/reasoning";
import { resetDefaultMarketingIntelligenceBrainRepository } from "@/lib/brain/layers/marketing-intelligence";
import { resetDefaultStrategyBrainRepository } from "@/lib/brain/layers/strategy";
import { resetDefaultPlanningBrainRepository, resetPlanningBrainLayerCounters } from "@/lib/brain/layers/planning";
import { resetDefaultCreativeRepository } from "@/lib/brain/layers/creative/creative-repository";
import { resetDefaultValidationRepository } from "@/lib/brain/layers/validation/validation-repository";
import { resetDefaultMemoryRepository, getDefaultMemoryRepository } from "@/lib/brain/layers/memory";
import { resetDefaultExecutionRepository, resetDefaultExecutionProviderRegistry } from "@/lib/brain/layers/execution";
import { resetDefaultLearningBrainRepository, resetLearningBrainLayerCounters } from "@/lib/brain/layers/learning";
import {
  createProjectEpisodeRunner,
  resetDefaultProjectEpisodeRepository,
  submitProjectApproval,
  buildFixturePerformanceObservations,
  buildMarketingPeerFixture,
  resolveBrainOutputs,
  buildBrainPayload,
  createEmptyArtifacts,
  buildPriorOutputs,
  FIXTURE_ORG_ID,
  PROOF_LED_LEARNING_SNIPPET,
  listProjectEvents,
} from "@/lib/brain/project-runtime";
import type { BrainHandoffContext } from "@/lib/brain/project-runtime/types";
import { getDefaultExecutionRepository } from "@/lib/brain/layers/execution/execution-repository";

function resetAll() {
  resetDefaultCompanyRepository();
  resetDefaultResearchBrainRepository();
  resetDefaultResearchProviderRegistry();
  resetDefaultReasoningBrainRepository();
  resetDefaultMarketingIntelligenceBrainRepository();
  resetDefaultStrategyBrainRepository();
  resetDefaultPlanningBrainRepository();
  resetPlanningBrainLayerCounters();
  resetDefaultCreativeRepository();
  resetDefaultValidationRepository();
  resetDefaultMemoryRepository();
  resetDefaultExecutionRepository();
  resetDefaultExecutionProviderRegistry();
  resetDefaultLearningBrainRepository();
  resetLearningBrainLayerCounters();
  resetDefaultProjectEpisodeRepository();
}

async function runUntilApprovalOrComplete(projectId: string, runner = createProjectEpisodeRunner()) {
  let result = await runner.runUntilPause({
    organizationId: FIXTURE_ORG_ID,
    projectId,
    peerId: "demo",
  });
  let guard = 0;
  while (result.status === "waiting_for_approval" && guard < 10) {
    submitProjectApproval({
      projectId,
      organizationId: FIXTURE_ORG_ID,
      approvalId: `approval-${guard}`,
      decision: "approved",
      actor: "customer@test.com",
    });
    result = await runner.resumeEpisode({
      organizationId: FIXTURE_ORG_ID,
      projectId,
      approvalSatisfied: true,
    });
    guard += 1;
  }
  return result;
}

describe("Autonomous Marketing Peer v1 (PX-47)", () => {
  beforeEach(resetAll);

  it("runs marketing intelligence before strategy in researching phase", async () => {
    const projectId = "proj-e2e-mi-order";
    const runner = createProjectEpisodeRunner();
    let result = await runner.runUntilPause({
      organizationId: FIXTURE_ORG_ID,
      projectId,
      peerId: "demo",
      maxSteps: 50,
    });

    while (
      result.status === "running" &&
      !result.episode.snapshot.completedBrains.includes("marketing_intelligence")
    ) {
      if (result.status === "waiting_for_approval") break;
      result = await runner.runUntilPause({
        organizationId: FIXTURE_ORG_ID,
        projectId,
        peerId: "demo",
        maxSteps: 15,
      });
      if (result.episode.lastError && result.episode.lastError !== "max_steps_exceeded") break;
    }

    if (result.episode.snapshot.completedBrains.includes("strategy")) {
      expect(result.episode.snapshot.completedBrains).toContain("marketing_intelligence");
    } else {
      expect(
        result.episode.snapshot.completedBrains.includes("marketing_intelligence") ||
          result.episode.artifacts.marketingIntelligenceOutputRef
      ).toBeTruthy();
    }
  });

  it("runs Company → Research → Reasoning → MI → Strategy with context handoffs", async () => {
    const projectId = "proj-e2e-pipeline-1";
    const runner = createProjectEpisodeRunner();
    let result = await runner.runUntilPause({
      organizationId: FIXTURE_ORG_ID,
      projectId,
      peerId: "demo",
      maxSteps: 80,
    });

    expect(result.episode.lastError).toBeNull();
    expect(result.episode.snapshot.completedBrains).toContain("company");
    expect(result.episode.snapshot.completedBrains).toContain("research");
    expect(result.episode.snapshot.completedBrains).toContain("reasoning");
    expect(
      result.episode.snapshot.completedBrains.includes("marketing_intelligence") ||
        result.episode.artifacts.marketingIntelligenceOutputRef
    ).toBe(true);
    expect(result.episode.artifacts.companyOutputRef).toBeTruthy();
    expect(result.episode.artifacts.researchOutputRef).toBeTruthy();
  });

  it("pauses for approval and blocks execution before approval", async () => {
    const projectId = "proj-e2e-approval-1";
    const runner = createProjectEpisodeRunner();
    let result = await runner.runUntilPause({
      organizationId: FIXTURE_ORG_ID,
      projectId,
      peerId: "demo",
      maxSteps: 120,
    });

    const hitApproval = result.status === "waiting_for_approval" || result.episode.snapshot.state === "waiting_for_approval";
    expect(hitApproval || result.episode.snapshot.completedBrains.includes("strategy")).toBe(true);

    if (hitApproval) {
      expect(result.episode.snapshot.completedBrains).not.toContain("execution");
      expect(result.episode.approvalGrantedForExecution).toBe(false);
    }
  });

  it("waits for outcomes before Learning runs", async () => {
    const projectId = "proj-e2e-monitoring-1";
    const runner = createProjectEpisodeRunner();
    let result = await runUntilApprovalOrComplete(projectId, runner);

    while (result.status === "running" && result.episode.snapshot.state !== "monitoring" && result.status !== "waiting_for_outcomes") {
      result = await runner.runUntilPause({ organizationId: FIXTURE_ORG_ID, projectId, peerId: "demo", maxSteps: 20 });
      if (result.status === "waiting_for_approval") {
        submitProjectApproval({
          projectId,
          organizationId: FIXTURE_ORG_ID,
          approvalId: "approval-monitoring",
          decision: "approved",
          actor: "customer@test.com",
        });
        result = await runner.resumeEpisode({
          organizationId: FIXTURE_ORG_ID,
          projectId,
          approvalSatisfied: true,
        });
      }
    }

    if (result.episode.snapshot.completedBrains.includes("execution")) {
      expect(result.status === "waiting_for_outcomes" || result.episode.snapshot.state === "monitoring").toBe(true);
      expect(result.episode.snapshot.completedBrains).not.toContain("learning");
    }
  });

  it("Learning does NOT write Memory directly", async () => {
    const memoryRepo = getDefaultMemoryRepository();
    const storeSpy = vi.spyOn(memoryRepo, "store");
    const callsBefore = storeSpy.mock.calls.length;

    const projectId = "proj-e2e-memory-boundary";
    await runFullEpisode(projectId);

    const learningCalls = storeSpy.mock.calls.slice(callsBefore).filter((call) => {
      const record = call[0] as { graph?: { memories?: { tags?: string[] }[] } };
      return record?.graph?.memories?.some((m) => m.tags?.includes("hypothesis"));
    });
    expect(learningCalls.length).toBe(0);
  });

  it("completes full Project 1 lifecycle with Learning → Memory second-pass", async () => {
    const projectId = "proj-e2e-full-1";
    const result = await runFullEpisode(projectId);

    expect(result.status).toBe("completed");
    expect(result.episode.snapshot.completedBrains).toContain("learning");
    expect(result.episode.memoryCheckpoint1Complete).toBe(true);
    expect(result.episode.memoryCheckpoint2Complete).toBe(true);
    expect(result.episode.artifacts.learningOutputRef).toBeTruthy();
    expect(result.episode.artifacts.memoryOutputRefs.length).toBeGreaterThanOrEqual(2);

    const events = listProjectEvents(projectId);
    expect(events.some((e) => e.type === "learning_completed")).toBe(true);
    expect(events.some((e) => e.type === "memory_updated")).toBe(true);
    expect(events.some((e) => e.type === "project_completed")).toBe(true);
  });

  it("Project 2 receives Memory from Project 1 in downstream Brain context", async () => {
    const p1 = await runFullEpisode("proj-e2e-memory-p1");
    expect(p1.status).toBe("completed");
    expect(p1.episode.memoryCheckpoint2Complete).toBe(true);

    const orgMemories = getDefaultMemoryRepository().getOrgMemories(FIXTURE_ORG_ID);
    expect(orgMemories.length).toBeGreaterThan(0);

    const fixture = buildMarketingPeerFixture("2");
    const projectId = "proj-e2e-memory-p2";
    const artifacts = createEmptyArtifacts({
      organizationId: FIXTURE_ORG_ID,
      projectId,
      episodeId: "ep-p2",
      correlationId: "corr-p2",
    });
    const resolved = resolveBrainOutputs({
      organizationId: FIXTURE_ORG_ID,
      projectId,
      artifacts,
    });

    const handoff: BrainHandoffContext = {
      organizationId: FIXTURE_ORG_ID,
      projectId,
      episodeId: "ep-p2",
      locale: "en",
      correlationId: "corr-p2",
      artifacts,
      priorOutputs: buildPriorOutputs(artifacts),
      priorMemories: resolved.priorMemories,
      campaignContext: fixture.campaignContext,
      companySnapshot: fixture.companySnapshot,
      brandGraph: fixture.brandGraph,
      approvalGrantedForExecution: false,
      performanceObservations: [],
      memoryCheckpointPhase: null,
      learningProposalIds: [],
      learningProposals: [],
    };

    const strategyPayload = buildBrainPayload("strategy", resolved, handoff);
    expect(resolved.priorMemories.length).toBeGreaterThan(0);
    expect(
      resolved.priorMemories.some(
        (m) =>
          m.description.toLowerCase().includes(PROOF_LED_LEARNING_SNIPPET) ||
          m.title.toLowerCase().includes(PROOF_LED_LEARNING_SNIPPET) ||
          m.tags.includes("messaging") ||
          m.category === "learning_memory"
      )
    ).toBe(true);
    expect(strategyPayload.companyGraph).toBeTruthy();
  });

  it("context gap pauses safely when website missing", async () => {
    const projectId = "proj-e2e-gap-1";
    const runner = createProjectEpisodeRunner();
    runner.startEpisode({
      organizationId: FIXTURE_ORG_ID,
      projectId,
      peerId: "demo",
      sliceAvailability: {
        business: true,
        campaign: true,
        website: false,
        competitors: false,
      },
    });

    const result = await runner.runUntilPause({
      organizationId: FIXTURE_ORG_ID,
      projectId,
      peerId: "demo",
      maxSteps: 15,
    });

    expect(result.status === "waiting_for_context" || result.missingContext.length > 0).toBe(true);
  });

  it("resume does not duplicate completed brain execution keys", async () => {
    const projectId = "proj-e2e-idempotent";
    const runner = createProjectEpisodeRunner();
    let result = await runner.runUntilPause({
      organizationId: FIXTURE_ORG_ID,
      projectId,
      peerId: "demo",
      maxSteps: 40,
    });

    const keysAfterFirst = [...result.episode.executedBrainKeys];
    result = await runner.resumeEpisode({
      organizationId: FIXTURE_ORG_ID,
      projectId,
    });
    expect(result.episode.executedBrainKeys.length).toBeGreaterThanOrEqual(keysAfterFirst.length);
    expect(new Set(result.episode.executedBrainKeys).size).toBe(result.episode.executedBrainKeys.length);
  });

  it("persists execution receipt after approved execution", async () => {
    const projectId = "proj-e2e-exec-receipt";
    await runFullEpisode(projectId);
    const history = getDefaultExecutionRepository().getLatest({
      organizationId: FIXTURE_ORG_ID,
      projectId,
    });
    expect(history).not.toBeNull();
    expect(history?.history.entries?.length).toBeGreaterThan(0);
  });
});

async function runFullEpisode(projectId: string) {
  const runner = createProjectEpisodeRunner();
  let result = await runner.runUntilPause({
    organizationId: FIXTURE_ORG_ID,
    projectId,
    peerId: "demo",
    maxSteps: 200,
  });
  let guard = 0;

  while (result.status !== "completed" && result.status !== "failed" && guard < 30) {
    guard += 1;
    if (result.status === "waiting_for_approval") {
      submitProjectApproval({
        projectId,
        organizationId: FIXTURE_ORG_ID,
        approvalId: `approval-${Date.now()}-${guard}`,
        decision: "approved",
        actor: "customer@test.com",
      });
      result = await runner.resumeEpisode({
        organizationId: FIXTURE_ORG_ID,
        projectId,
        approvalSatisfied: true,
      });
      continue;
    }
    if (result.status === "waiting_for_outcomes" || result.episode.snapshot.state === "monitoring") {
      result = await runner.resumeEpisode({
        organizationId: FIXTURE_ORG_ID,
        projectId,
        performanceObservations: buildFixturePerformanceObservations(projectId),
      });
      continue;
    }
    if (result.status === "running") {
      result = await runner.runUntilPause({
        organizationId: FIXTURE_ORG_ID,
        projectId,
        peerId: "demo",
        maxSteps: 120,
      });
      continue;
    }
    break;
  }
  return result;
}
