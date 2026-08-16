import { beforeEach, describe, expect, it } from "vitest";
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
  FIXTURE_ORG_ID,
  resolveEpisodeStepBudget,
} from "@/lib/brain/project-runtime";
import {
  evaluateCampaignEpisodeContinuation,
  resetCampaignEpisodeContinuationInFlightForTests,
  shouldAutoContinueCampaignEpisode,
} from "@/lib/brain/project-runtime/campaign-episode-continuation";
import { createMarketingCampaignProject } from "@/lib/peer-experience/marketing/projects/project-engine";
import type { MarketingProject } from "@/lib/peer-experience/marketing/projects/types";

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
  resetCampaignEpisodeContinuationInFlightForTests();
}

function automaticProject(
  approvalMode: "approval_before_publication" | "approval_before_generation" | "no_approval_required" = "approval_before_publication"
): MarketingProject {
  return createMarketingCampaignProject({
    peerId: "emma",
    ownerLabel: "Emma",
    name: "Continuation Test",
    goalLabel: "Leads",
    description: "Test automatic continuation after strategy target.",
    primaryGoalId: "generate_leads",
    setupMode: "automatic",
    approvalMode,
    selectedChannels: ["linkedin"],
  });
}


describe("PX-50.24 campaign episode continuation", () => {
  beforeEach(resetAll);

  it("A — strategy target run ends running+planning, then continuation executes planning", async () => {
    const projectId = "proj-px5024-strategy-then-continue";
    const project = automaticProject();
    const runner = createProjectEpisodeRunner();

    const strategyResult = await runner.runUntilPause({
      organizationId: FIXTURE_ORG_ID,
      projectId,
      peerId: "demo",
      target: { targetBrain: "strategy" },
    });

    expect(strategyResult.episode.lastError).not.toBe("max_steps_exceeded");
    expect(strategyResult.status).toBe("running");
    expect(strategyResult.episode.snapshot.state).toBe("planning");
    expect(strategyResult.episode.snapshot.completedBrains).toContain("strategy");
    expect(shouldAutoContinueCampaignEpisode({ project, episodeResult: strategyResult })).toBe(true);

    const continuationResult = await runner.runUntilPause({
      organizationId: FIXTURE_ORG_ID,
      projectId,
      peerId: "demo",
      maxSteps: resolveEpisodeStepBudget({ campaignApprovalMode: "approval_before_publication" }),
    });

    expect(continuationResult.episode.snapshot.completedBrains).toContain("planning");
  });

  it("B — approval_before_publication continues through validation to publication boundary", async () => {
    const projectId = "proj-px5024-publication-boundary";
    const project = automaticProject("approval_before_publication");
    const runner = createProjectEpisodeRunner();

    await runner.runUntilPause({
      organizationId: FIXTURE_ORG_ID,
      projectId,
      peerId: "demo",
      target: { targetBrain: "strategy" },
    });

    const result = await runner.runUntilPause({
      organizationId: FIXTURE_ORG_ID,
      projectId,
      peerId: "demo",
      maxSteps: resolveEpisodeStepBudget({ campaignApprovalMode: "approval_before_publication" }),
    });

    expect(result.episode.lastError).not.toBe("max_steps_exceeded");
    expect(result.episode.snapshot.completedBrains).toContain("planning");
    expect(result.episode.snapshot.completedBrains).toContain("creative");
    expect(result.episode.snapshot.completedBrains).toContain("validation");
    expect(
      result.status === "waiting_for_approval" ||
        result.episode.snapshot.state === "waiting_for_approval"
    ).toBe(true);
  });

  it("C — duplicate continuation invocation does not duplicate planning runs", async () => {
    const projectId = "proj-px5024-dedup-planning";
    const runner = createProjectEpisodeRunner();

    await runner.runUntilPause({
      organizationId: FIXTURE_ORG_ID,
      projectId,
      peerId: "demo",
      target: { targetBrain: "strategy" },
    });

    const budget = resolveEpisodeStepBudget({ campaignApprovalMode: "approval_before_publication" });
    const first = await runner.runUntilPause({
      organizationId: FIXTURE_ORG_ID,
      projectId,
      peerId: "demo",
      maxSteps: budget,
    });

    const planningKeysAfterFirst = first.episode.executedBrainKeys.filter((key) =>
      key.includes(":planning:")
    );

    const second = await runner.runUntilPause({
      organizationId: FIXTURE_ORG_ID,
      projectId,
      peerId: "demo",
      maxSteps: budget,
    });

    const planningKeysAfterSecond = second.episode.executedBrainKeys.filter((key) =>
      key.includes(":planning:")
    );

    expect(first.episode.snapshot.completedBrains).toContain("planning");
    expect(planningKeysAfterFirst.length).toBe(1);
    expect(planningKeysAfterSecond.length).toBe(1);
  });

  it("D — continuation skips when episode is waiting_for_context", async () => {
    const projectId = "proj-px5024-waiting-context";
    const project = automaticProject();
    const runner = createProjectEpisodeRunner();

    await runner.startEpisode({
      organizationId: FIXTURE_ORG_ID,
      projectId,
      peerId: "demo",
      contextReady: false,
      sliceAvailability: { business: false },
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
      episodeStatus: "waiting_for_context",
    });

    const episode = getDefaultProjectEpisodeRepository().get({
      organizationId: FIXTURE_ORG_ID,
      projectId,
    })!;

    const eligibility = evaluateCampaignEpisodeContinuation({ project, episode });
    expect(eligibility.eligible).toBe(false);
    if (!eligibility.eligible) {
      expect(eligibility.reason).toBe("waiting_for_context");
    }
  });

  it("E — guided approval_before_generation does not auto-continue after strategy", async () => {
    const projectId = "proj-px5024-guided";
    const project = automaticProject("approval_before_generation");
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
    getDefaultProjectEpisodeRepository().save({
      ...getDefaultProjectEpisodeRepository().get({
        organizationId: FIXTURE_ORG_ID,
        projectId,
      })!,
      campaignApprovalMode: "approval_before_generation",
    });

    const strategyResult = await runner.runUntilPause({
      organizationId: FIXTURE_ORG_ID,
      projectId,
      peerId: "demo",
      target: { targetBrain: "strategy" },
    });

    expect(shouldAutoContinueCampaignEpisode({ project, episodeResult: strategyResult })).toBe(false);
    const eligibility = evaluateCampaignEpisodeContinuation({
      project,
      episode: strategyResult.episode,
    });
    expect(eligibility).toEqual({ eligible: false, reason: "guided_checkpoint_mode" });
  });

  it("F — no_approval_required can continue beyond publication into execution", async () => {
    const projectId = "proj-px5024-full-auto";
    const project = automaticProject("no_approval_required");
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
    getDefaultProjectEpisodeRepository().save({
      ...getDefaultProjectEpisodeRepository().get({
        organizationId: FIXTURE_ORG_ID,
        projectId,
      })!,
      campaignApprovalMode: "no_approval_required",
    });

    await runner.runUntilPause({
      organizationId: FIXTURE_ORG_ID,
      projectId,
      peerId: "demo",
      target: { targetBrain: "strategy" },
    });

    const result = await runner.runUntilPause({
      organizationId: FIXTURE_ORG_ID,
      projectId,
      peerId: "demo",
      maxSteps: resolveEpisodeStepBudget({ campaignApprovalMode: "no_approval_required" }),
    });

    expect(result.episode.snapshot.completedBrains).toContain("planning");
    expect(result.episode.snapshot.completedBrains).toContain("creative");
    expect(result.episode.snapshot.completedBrains).toContain("validation");
    expect(result.episode.snapshot.state).not.toBe("planning");
    expect(result.episode.lastError).not.toBe("max_steps_exceeded");
  });

  it("G — executedBrainKeys prevent duplicate brain execution on version-stable episode", async () => {
    const projectId = "proj-px5024-idempotency";
    const runner = createProjectEpisodeRunner();

    const strategyResult = await runner.runUntilPause({
      organizationId: FIXTURE_ORG_ID,
      projectId,
      peerId: "demo",
      target: { targetBrain: "strategy" },
    });

    const keysAfterStrategy = [...strategyResult.episode.executedBrainKeys];
    const continued = await runner.runUntilPause({
      organizationId: FIXTURE_ORG_ID,
      projectId,
      peerId: "demo",
      maxSteps: resolveEpisodeStepBudget({ campaignApprovalMode: "approval_before_publication" }),
    });

    expect(continued.episode.executedBrainKeys.length).toBeGreaterThan(keysAfterStrategy.length);
    expect(new Set(continued.episode.executedBrainKeys).size).toBe(
      continued.episode.executedBrainKeys.length
    );
  });

  it("H — PX-50.23 strategy target exit remains running without max_steps_exceeded", async () => {
    const projectId = "proj-px5024-regression-5023";
    const runner = createProjectEpisodeRunner();

    const result = await runner.runUntilPause({
      organizationId: FIXTURE_ORG_ID,
      projectId,
      peerId: "demo",
      target: { targetBrain: "strategy" },
    });

    expect(result.status).toBe("running");
    expect(result.episode.episodeStatus).toBe("running");
    expect(result.episode.lastError).toBeNull();
    expect(result.episode.snapshot.state).toBe("planning");
  });

  it("I — PX-50.22 cognitive strategy work does not require guided approval in publication mode", async () => {
    const { evaluateCampaignBrainPolicy } = await import("@/lib/brain/policy/campaign-approval-policy");
    const policy = evaluateCampaignBrainPolicy({
      campaignApprovalMode: "approval_before_publication",
      capabilityId: "strategy",
    });
    expect(policy.decision).toBe("allow");
    expect(policy.willPause).toBe(false);
  });
});
