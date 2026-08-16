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
import { resetDefaultMemoryRepository } from "@/lib/brain/layers/memory";
import { resetDefaultExecutionRepository, resetDefaultExecutionProviderRegistry } from "@/lib/brain/layers/execution";
import { resetDefaultLearningBrainRepository, resetLearningBrainLayerCounters } from "@/lib/brain/layers/learning";
import {
  createProjectEpisodeRunner,
  resetDefaultProjectEpisodeRepository,
  submitProjectApproval,
  FIXTURE_ORG_ID,
} from "@/lib/brain/project-runtime";
import {
  resolveEpisodeStepBudget,
} from "@/lib/brain/project-runtime/episode-step-budget";
import * as projectEngine from "@/lib/brain/project-engine";

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

describe("PX-50.23 episode step budget", () => {
  beforeEach(resetAll);

  it("derives budget from pipeline topology — strategy target fits within budget", () => {
    const budget = resolveEpisodeStepBudget({
      campaignApprovalMode: "approval_before_publication",
      targetBrain: "strategy",
    });
    expect(budget).toBeGreaterThanOrEqual(20);
    expect(budget).toBeLessThan(80);
  });

  it("full approval_before_publication budget exceeds strategy-through-target needs", () => {
    const full = resolveEpisodeStepBudget({ campaignApprovalMode: "approval_before_publication" });
    const target = resolveEpisodeStepBudget({
      campaignApprovalMode: "approval_before_publication",
      targetBrain: "strategy",
    });
    expect(full).toBeGreaterThan(target);
  });

  it("no_approval_required budget >= approval_before_publication budget", () => {
    const fullAuto = resolveEpisodeStepBudget({ campaignApprovalMode: "no_approval_required" });
    const pubMode = resolveEpisodeStepBudget({ campaignApprovalMode: "approval_before_publication" });
    expect(fullAuto).toBeGreaterThanOrEqual(pubMode);
  });

  it("blocked_manual_only budget is minimal", () => {
    const blocked = resolveEpisodeStepBudget({ campaignApprovalMode: "blocked_manual_only" });
    const full = resolveEpisodeStepBudget({ campaignApprovalMode: "approval_before_publication" });
    expect(blocked).toBeLessThan(full);
  });
});

describe("PX-50.23 ProjectEpisodeRunner step budget", () => {
  beforeEach(resetAll);

  it("A — strategy target run does NOT produce max_steps_exceeded (production scenario)", async () => {
    const projectId = "proj-px5023-strategy-target";
    const runner = createProjectEpisodeRunner();

    const result = await runner.runUntilPause({
      organizationId: FIXTURE_ORG_ID,
      projectId,
      peerId: "demo",
      target: { targetBrain: "strategy" },
    });

    expect(result.episode.lastError).not.toBe("max_steps_exceeded");
    expect(result.episode.episodeStatus).not.toBe("failed");
    expect(result.episode.snapshot.completedBrains).toContain("strategy");
    expect(result.episode.snapshot.completedBrains).toContain("company");
    expect(result.episode.snapshot.completedBrains).toContain("research");
    expect(result.episode.snapshot.completedBrains).toContain("reasoning");
    expect(result.episode.snapshot.completedBrains).toContain("marketing_intelligence");
    expect(result.episode.snapshot.state).toBe("planning");
    expect(result.status).toBe("running");
  });

  it("B — full automatic pipeline reaches publication approval without max_steps_exceeded", async () => {
    const projectId = "proj-px5023-publication-boundary";
    const runner = createProjectEpisodeRunner();
    let result = await runner.runUntilPause({
      organizationId: FIXTURE_ORG_ID,
      projectId,
      peerId: "demo",
      maxSteps: resolveEpisodeStepBudget({ campaignApprovalMode: "approval_before_publication" }),
    });

    let guard = 0;
    while (result.status !== "completed" && result.status !== "failed" && guard < 15) {
      guard += 1;
      if (result.status === "waiting_for_approval") break;
      if (result.status === "running") {
        result = await runner.runUntilPause({
          organizationId: FIXTURE_ORG_ID,
          projectId,
          peerId: "demo",
          maxSteps: resolveEpisodeStepBudget({ campaignApprovalMode: "approval_before_publication" }),
        });
      }
    }

    expect(result.episode.lastError).not.toBe("max_steps_exceeded");
    expect(
      result.status === "waiting_for_approval" ||
        result.episode.snapshot.state === "waiting_for_approval" ||
        result.episode.snapshot.completedBrains.includes("validation")
    ).toBe(true);
  });

  it("C — approval_before_generation guided path does not exhaust budget before checkpoint", async () => {
    const projectId = "proj-px5023-guided";
    const runner = createProjectEpisodeRunner();
    await runner.startEpisode({
      organizationId: FIXTURE_ORG_ID,
      projectId,
      peerId: "demo",
      sliceAvailability: {
        business: true,
        brand: true,
        website: true,
        products: true,
        competitors: true,
        goals: true,
        campaign: true,
      },
    });

    const { getDefaultProjectEpisodeRepository } = await import(
      "@/lib/brain/project-runtime/project-episode-repository"
    );
    const stored = getDefaultProjectEpisodeRepository().get({
      organizationId: FIXTURE_ORG_ID,
      projectId,
    })!;
    getDefaultProjectEpisodeRepository().save({
      ...stored,
      campaignApprovalMode: "approval_before_generation",
    });

    const result = await runner.runUntilPause({
      organizationId: FIXTURE_ORG_ID,
      projectId,
      peerId: "demo",
      maxSteps: resolveEpisodeStepBudget({ campaignApprovalMode: "approval_before_generation" }),
    });

    expect(result.episode.lastError).not.toBe("max_steps_exceeded");
    expect(
      result.status === "waiting_for_approval" ||
        result.episode.snapshot.completedBrains.includes("strategy") ||
        result.status === "running"
    ).toBe(true);
  });

  it("D — no_approval_required traverses without max_steps_exceeded", async () => {
    const projectId = "proj-px5023-full-auto";
    const runner = createProjectEpisodeRunner();
    await runner.startEpisode({
      organizationId: FIXTURE_ORG_ID,
      projectId,
      peerId: "demo",
      sliceAvailability: {
        business: true,
        brand: true,
        website: true,
        products: true,
        competitors: true,
        goals: true,
        campaign: true,
      },
    });

    const { getDefaultProjectEpisodeRepository } = await import(
      "@/lib/brain/project-runtime/project-episode-repository"
    );
    const stored = getDefaultProjectEpisodeRepository().get({
      organizationId: FIXTURE_ORG_ID,
      projectId,
    })!;
    getDefaultProjectEpisodeRepository().save({
      ...stored,
      campaignApprovalMode: "no_approval_required",
    });

    let result = await runner.runUntilPause({
      organizationId: FIXTURE_ORG_ID,
      projectId,
      peerId: "demo",
      maxSteps: resolveEpisodeStepBudget({ campaignApprovalMode: "no_approval_required" }),
    });

    let guard = 0;
    while (result.status === "running" && guard < 20) {
      guard += 1;
      result = await runner.runUntilPause({
        organizationId: FIXTURE_ORG_ID,
        projectId,
        peerId: "demo",
        maxSteps: resolveEpisodeStepBudget({ campaignApprovalMode: "no_approval_required" }),
      });
      if (result.episode.lastError === "max_steps_exceeded") break;
    }

    expect(result.episode.lastError).not.toBe("max_steps_exceeded");
  });

  it("F — stale loop without progress triggers stale_loop_detected", async () => {
    const projectId = "proj-px5023-stale-loop";
    const runner = createProjectEpisodeRunner();
    await runner.startEpisode({
      organizationId: FIXTURE_ORG_ID,
      projectId,
      peerId: "demo",
      sliceAvailability: {
        business: true,
        brand: true,
        website: true,
        products: true,
        competitors: true,
        goals: true,
        campaign: true,
      },
    });

    const { getDefaultProjectEpisodeRepository } = await import(
      "@/lib/brain/project-runtime/project-episode-repository"
    );
    const frozen = getDefaultProjectEpisodeRepository().get({
      organizationId: FIXTURE_ORG_ID,
      projectId,
    })!.snapshot;

    vi.spyOn(projectEngine, "evaluateProjectEpisode").mockReturnValue({
      snapshot: frozen,
      action: {
        kind: "idle",
        brainId: null,
        reason: "stuck",
        customerLabel: "stuck",
      },
      pendingBrains: [],
      blocked: false,
    });

    const result = await runner.runUntilPause({
      organizationId: FIXTURE_ORG_ID,
      projectId,
      peerId: "demo",
      maxSteps: 100,
    });

    vi.restoreAllMocks();
    expect(result.episode.lastError).toBe("stale_loop_detected");
    expect(result.episode.episodeStatus).toBe("failed");
  });

  it("G — resume after approval receives fresh step budget and continues", async () => {
    const projectId = "proj-px5023-resume-budget";
    const runner = createProjectEpisodeRunner();
    let result = await runner.runUntilPause({
      organizationId: FIXTURE_ORG_ID,
      projectId,
      peerId: "demo",
      maxSteps: resolveEpisodeStepBudget({ campaignApprovalMode: "approval_before_publication" }),
    });

    while (result.status === "running" && !result.episode.snapshot.completedBrains.includes("validation")) {
      if (result.status === "waiting_for_approval") break;
      result = await runner.runUntilPause({
        organizationId: FIXTURE_ORG_ID,
        projectId,
        peerId: "demo",
        maxSteps: 3,
      });
      if (result.episode.lastError === "max_steps_exceeded") break;
    }

    if (result.status === "waiting_for_approval") {
      submitProjectApproval({
        projectId,
        organizationId: FIXTURE_ORG_ID,
        approvalId: "approval-resume-budget",
        decision: "approved",
        actor: "customer@test.com",
      });
      result = await runner.resumeEpisode({
        organizationId: FIXTURE_ORG_ID,
        projectId,
        approvalSatisfied: true,
        maxSteps: resolveEpisodeStepBudget({ campaignApprovalMode: "approval_before_publication" }),
      });
      expect(result.episode.lastError).not.toBe("max_steps_exceeded");
      expect(result.episode.episodeStatus).not.toBe("failed");
    }
  });
});
