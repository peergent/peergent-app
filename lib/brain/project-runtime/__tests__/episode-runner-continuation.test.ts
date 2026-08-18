/**
 * PX-60 — autonomous episode continuation (no page refresh required).
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  configureLayerRepositories,
  resetConfiguredLayerRepositories,
  resetLayerRepositoryStores,
} from "@/lib/brain/persistence/layer-repository-factory";
import { createSimulatedDurablePersistence } from "@/lib/brain/persistence/layer/simulated-durable-persistence";
import { resetSimulatedDurableStore } from "@/lib/brain/persistence/layer/simulated-durable-store";
import {
  resetActiveDurablePersistence,
  setActiveDurablePersistence,
} from "@/lib/brain/persistence/layer/active-durable-persistence";
import { resetDefaultCompanyRepository } from "@/lib/brain/layers/company";
import {
  resetDefaultResearchBrainRepository,
  resetDefaultResearchProviderRegistry,
} from "@/lib/brain/layers/research";
import { resetDefaultReasoningBrainRepository } from "@/lib/brain/layers/reasoning";
import { resetDefaultMarketingIntelligenceBrainRepository } from "@/lib/brain/layers/marketing-intelligence";
import { resetDefaultStrategyBrainRepository } from "@/lib/brain/layers/strategy";
import { resetDefaultPlanningBrainRepository, resetPlanningBrainLayerCounters } from "@/lib/brain/layers/planning";
import { resetDefaultCreativeRepository, getDefaultCreativeRepository } from "@/lib/brain/layers/creative/creative-repository";
import { resetDefaultValidationRepository } from "@/lib/brain/layers/validation/validation-repository";
import { resetDefaultMemoryRepository } from "@/lib/brain/layers/memory";
import { resetDefaultExecutionRepository, resetDefaultExecutionProviderRegistry } from "@/lib/brain/layers/execution";
import { resetDefaultLearningBrainRepository, resetLearningBrainLayerCounters } from "@/lib/brain/layers/learning";
import {
  createProjectEpisodeRunner,
  resetCampaignEpisodeContinuationInFlightForTests,
  resetDefaultProjectEpisodeRepository,
  submitProjectApprovalDurable,
  FIXTURE_ORG_ID,
  getDefaultProjectEpisodeRepository,
  resolveEpisodeStepBudget,
  detectAutomaticCampaignPipelineStall,
} from "@/lib/brain/project-runtime";
import { createMarketingCampaignProject } from "@/lib/peer-experience/marketing/projects/project-engine";
import type { MarketingProject } from "@/lib/peer-experience/marketing/projects/types";
import { freezeApprovedExecutionHandoff } from "@/lib/brain/approval/approved-execution-handoff";
import { submitLiveCampaignStepApprovalServer } from "@/lib/office/campaign/live-campaign-approval-bridge-server";
import { mergeCampaignStepApprovalIntoProject } from "@/lib/office/campaign/live-campaign-context-store";

const PEER = "emma-px60";
const ORG = FIXTURE_ORG_ID;

vi.mock("@/lib/brain/persistence/server/prepare-brain-server-persistence", () => ({
  prepareBrainServerPersistence: vi.fn().mockResolvedValue({}),
}));

vi.mock("@/lib/office/campaign/resolve-organization-name-server", () => ({
  resolveDurableOrganizationNameServer: vi.fn().mockResolvedValue("Test Org"),
}));

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
  resetLayerRepositoryStores();
  resetConfiguredLayerRepositories();
  resetActiveDurablePersistence();
  resetCampaignEpisodeContinuationInFlightForTests();
}

function automaticProject(name = "PX-60 Continuation"): MarketingProject {
  return createMarketingCampaignProject({
    peerId: PEER,
    ownerLabel: "Emma",
    name,
    goalLabel: "Leads",
    description: "PX-60 runtime continuation regression.",
    primaryGoalId: "generate_leads",
    setupMode: "automatic",
    approvalMode: "approval_before_publication",
    selectedChannels: ["linkedin"],
  });
}

function domainInput(project: MarketingProject) {
  return {
    peerId: PEER,
    organizationId: ORG,
    userName: "",
    peerName: "Emma",
    campaignTitle: project.title,
    generating: null,
    generatingActivity: null,
    understanding: null,
    strategy: null,
    plan: null,
    drafts: [],
    publicationPackages: [],
    activityFeed: [],
    workUnits: [],
    projects: [project],
    responsibilities: [],
    automations: [],
    connections: [],
  };
}

const SLICES = {
  business: true,
  brand: true,
  website: true,
  products: true,
  competitors: true,
  goals: true,
  campaign: true,
};

async function runPreApprovalPipeline(projectId: string) {
  const runner = createProjectEpisodeRunner();
  await runner.startEpisode({
    organizationId: ORG,
    projectId,
    peerId: PEER,
    sliceAvailability: SLICES,
  });
  return runner.runEpisodeUntilBlocked({
    organizationId: ORG,
    projectId,
    peerId: PEER,
    maxSteps: resolveEpisodeStepBudget({ campaignApprovalMode: "approval_before_publication" }),
  });
}

describe("PX-60 episode runner continuation", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    resetSimulatedDurableStore();
    resetAll();
    configureLayerRepositories({ mode: "persistent_in_memory" });
    setActiveDurablePersistence(createSimulatedDurablePersistence());
  });

  afterEach(() => {
    resetSimulatedDurableStore();
    resetAll();
  });

  it("A — one invocation runs cognitive pipeline and stops at waiting_for_approval", async () => {
    const project = automaticProject();
    const result = await runPreApprovalPipeline(project.id);

    expect(result.stopReason).toBe("waiting_for_human_approval");
    expect(result.status).toBe("waiting_for_approval");
    expect(result.episode.snapshot.completedBrains).toContain("validation");
    expect(result.episode.snapshot.completedBrains).toContain("memory");
    expect(result.episode.snapshot.completedBrains).not.toContain("execution");
  });

  it("B — single approval continues through execution to monitoring/outcomes boundary", async () => {
    const project = automaticProject();
    const projectId = project.id;
    await runPreApprovalPipeline(projectId);

    const bridge = await submitLiveCampaignStepApprovalServer({
      peerId: PEER,
      projectId,
      stepId: "waiting_for_approval",
      status: "approved",
      project,
      domainInput: domainInput(project),
      organizationId: ORG,
      actor: "user@test.com",
      supabase: {} as never,
    });

    expect(bridge.ok).toBe(true);
    expect(bridge.episodeResumed).toBe(true);

    const episode = getDefaultProjectEpisodeRepository().get({ organizationId: ORG, projectId })!;
    expect(episode.snapshot.completedBrains).toContain("execution");
    expect(["monitoring", "waiting_for_outcomes"]).toContain(
      episode.episodeStatus === "waiting_for_outcomes" ? "waiting_for_outcomes" : episode.snapshot.state
    );
    expect(detectAutomaticCampaignPipelineStall({ project, episode })).toBeNull();
  });

  it("C — ready_to_publish transition continues to execution in same invocation", async () => {
    const project = automaticProject();
    const projectId = project.id;
    await runPreApprovalPipeline(projectId);

    await submitProjectApprovalDurable({
      organizationId: ORG,
      projectId,
      approvalId: "px60-transition",
      decision: "approved",
      actor: "test@example.com",
    });

    const repo = getDefaultProjectEpisodeRepository();
    let episode = repo.get({ organizationId: ORG, projectId })!;
    episode = freezeApprovedExecutionHandoff({
      episode: {
        ...episode,
        snapshot: {
          ...episode.snapshot,
          state: "ready_to_publish",
          approvalCheckpoint: episode.snapshot.approvalCheckpoint
            ? { ...episode.snapshot.approvalCheckpoint, satisfied: true }
            : episode.snapshot.approvalCheckpoint,
        },
        approvalGrantedForExecution: true,
        episodeStatus: "running",
      },
      approvalId: "px60-transition",
      campaignName: project.title,
    });
    repo.save(episode);

    const runner = createProjectEpisodeRunner();
    const result = await runner.runEpisodeUntilBlocked({
      organizationId: ORG,
      projectId,
      peerId: PEER,
      maxSteps: resolveEpisodeStepBudget({ campaignApprovalMode: "approval_before_publication" }),
    });

    expect(result.episode.snapshot.completedBrains).toContain("execution");
    expect(result.episode.snapshot.state).not.toBe("ready_to_publish");
  });

  it("D — execution completion re-evaluates into monitoring without second resume", async () => {
    const project = automaticProject();
    const projectId = project.id;
    await runPreApprovalPipeline(projectId);

    const runner = createProjectEpisodeRunner();
    await runner.resumeEpisode({
      organizationId: ORG,
      projectId,
      approvalSatisfied: true,
    });

    const episode = getDefaultProjectEpisodeRepository().get({ organizationId: ORG, projectId })!;
    expect(episode.snapshot.completedBrains).toContain("execution");
    expect(
      episode.snapshot.state === "monitoring" || episode.episodeStatus === "waiting_for_outcomes"
    ).toBe(true);
  });

  it("E — monitoring stops with waiting_for_external_outcomes", async () => {
    const project = automaticProject();
    const projectId = project.id;
    await runPreApprovalPipeline(projectId);

    const runner = createProjectEpisodeRunner();
    const result = await runner.resumeEpisode({
      organizationId: ORG,
      projectId,
      approvalSatisfied: true,
    });

    expect(result.stopReason).toBe("waiting_for_external_outcomes");
    expect(result.status).toBe("waiting_for_outcomes");
  });

  it("F — cold-load recovery resumes stalled ready_to_publish episode", async () => {
    const project = automaticProject();
    const projectId = project.id;
    await runPreApprovalPipeline(projectId);

    const repo = getDefaultProjectEpisodeRepository();
    let episode = repo.get({ organizationId: ORG, projectId })!;
    episode = {
      ...freezeApprovedExecutionHandoff({
        episode,
        approvalId: "px60-recovery",
        campaignName: project.title,
      }),
      snapshot: {
        ...episode.snapshot,
        state: "ready_to_publish",
        approvalCheckpoint: episode.snapshot.approvalCheckpoint
          ? { ...episode.snapshot.approvalCheckpoint, satisfied: true }
          : episode.snapshot.approvalCheckpoint,
      },
      approvalGrantedForExecution: true,
      episodeStatus: "running",
    };
    repo.save(episode);

    expect(detectAutomaticCampaignPipelineStall({ project, episode })?.reason).toBe(
      "ORCHESTRATION_STALL_EXECUTION_NOT_STARTED"
    );

    const recoveryRunner = createProjectEpisodeRunner();
    const result = await recoveryRunner.runEpisodeUntilBlocked({
      organizationId: ORG,
      projectId,
      peerId: PEER,
      maxSteps: resolveEpisodeStepBudget({ campaignApprovalMode: "approval_before_publication" }),
    });

    expect(result.episode.snapshot.completedBrains).toContain("execution");
  });

  it("G — happy-path approval reaches monitoring without pipeline recovery stall", async () => {
    const project = automaticProject();
    const projectId = project.id;
    await runPreApprovalPipeline(projectId);

    await submitLiveCampaignStepApprovalServer({
      peerId: PEER,
      projectId,
      stepId: "waiting_for_approval",
      status: "approved",
      project,
      domainInput: domainInput(project),
      organizationId: ORG,
      actor: "user@test.com",
      supabase: {} as never,
    });

    const episode = getDefaultProjectEpisodeRepository().get({ organizationId: ORG, projectId })!;
    expect(episode.snapshot.completedBrains).toContain("execution");
    expect(detectAutomaticCampaignPipelineStall({ project, episode })).toBeNull();
    expect(
      episode.snapshot.state === "monitoring" || episode.episodeStatus === "waiting_for_outcomes"
    ).toBe(true);
  });

  it("H — duplicate continuation does not execute twice", async () => {
    const project = automaticProject();
    const projectId = project.id;
    await runPreApprovalPipeline(projectId);

    await submitProjectApprovalDurable({
      organizationId: ORG,
      projectId,
      approvalId: "px60-dup-cont",
      decision: "approved",
      actor: "test@example.com",
    });

    const repo = getDefaultProjectEpisodeRepository();
    let episode = repo.get({ organizationId: ORG, projectId })!;
    episode = freezeApprovedExecutionHandoff({
      episode: {
        ...episode,
        snapshot: {
          ...episode.snapshot,
          state: "ready_to_publish",
          approvalCheckpoint: episode.snapshot.approvalCheckpoint
            ? { ...episode.snapshot.approvalCheckpoint, satisfied: true }
            : episode.snapshot.approvalCheckpoint,
        },
        approvalGrantedForExecution: true,
        episodeStatus: "running",
      },
      approvalId: "px60-dup-cont",
      campaignName: project.title,
    });
    repo.save(episode);

    const runner = createProjectEpisodeRunner();
    await runner.runEpisodeUntilBlocked({
      organizationId: ORG,
      projectId,
      peerId: PEER,
      maxSteps: resolveEpisodeStepBudget({ campaignApprovalMode: "approval_before_publication" }),
    });

    const execRuns = repo.get({ organizationId: ORG, projectId })!.snapshot.brainHistory.filter(
      (h) => h.brainId === "execution"
    ).length;

    await runner.runEpisodeUntilBlocked({
      organizationId: ORG,
      projectId,
      peerId: PEER,
      maxSteps: resolveEpisodeStepBudget({ campaignApprovalMode: "approval_before_publication" }),
    });

    const execRunsAfter = repo.get({ organizationId: ORG, projectId })!.snapshot.brainHistory.filter(
      (h) => h.brainId === "execution"
    ).length;

    expect(execRunsAfter).toBe(execRuns);
  });

  it("I — duplicate approval remains idempotent", async () => {
    const project = automaticProject();
    const projectId = project.id;
    await runPreApprovalPipeline(projectId);

    const first = await submitLiveCampaignStepApprovalServer({
      peerId: PEER,
      projectId,
      stepId: "waiting_for_approval",
      status: "approved",
      project,
      domainInput: domainInput(project),
      organizationId: ORG,
      actor: "user@test.com",
      supabase: {} as never,
    });
    expect(first.ok).toBe(true);

    const execAfterFirst = getDefaultProjectEpisodeRepository()
      .get({ organizationId: ORG, projectId })!
      .snapshot.brainHistory.filter((h) => h.brainId === "execution").length;

    const merged = mergeCampaignStepApprovalIntoProject(project, "waiting_for_approval", "approved")!;
    const second = await submitLiveCampaignStepApprovalServer({
      peerId: PEER,
      projectId,
      stepId: "waiting_for_approval",
      status: "approved",
      project: merged,
      domainInput: domainInput(merged),
      organizationId: ORG,
      actor: "user@test.com",
      supabase: {} as never,
    });

    expect(second.ok).toBe(true);
    if (second.ok) expect(second.episodeResumed).toBe(false);

    const execAfterSecond = getDefaultProjectEpisodeRepository()
      .get({ organizationId: ORG, projectId })!
      .snapshot.brainHistory.filter((h) => h.brainId === "execution").length;

    expect(execAfterSecond).toBe(execAfterFirst);
  });

  it("J — browser-independent full lifecycle via server/runtime APIs only", async () => {
    const project = automaticProject("PX-60 Browser-Independent");
    const projectId = project.id;

    const preApproval = await runPreApprovalPipeline(projectId);
    expect(preApproval.stopReason).toBe("waiting_for_human_approval");

    const bridge = await submitLiveCampaignStepApprovalServer({
      peerId: PEER,
      projectId,
      stepId: "waiting_for_approval",
      status: "approved",
      project,
      domainInput: domainInput(project),
      organizationId: ORG,
      actor: "user@test.com",
      supabase: {} as never,
    });
    expect(bridge.ok).toBe(true);

    const episode = getDefaultProjectEpisodeRepository().get({ organizationId: ORG, projectId })!;
    expect(episode.snapshot.completedBrains).toEqual(
      expect.arrayContaining(["strategy", "creative", "validation", "memory", "execution"])
    );
    expect(episode.snapshot.state === "monitoring" || episode.episodeStatus === "waiting_for_outcomes").toBe(
      true
    );
    expect(detectAutomaticCampaignPipelineStall({ project, episode })).toBeNull();
  });

  it("regression — proj-1786998906973 one invocation advances all runnable post-approval states", async () => {
    const project = automaticProject("proj-1786998906973-rh1czrf regression");
    const projectId = project.id;

    await runPreApprovalPipeline(projectId);

    const beforeStates: string[] = [];
    const runner = createProjectEpisodeRunner();

    await submitLiveCampaignStepApprovalServer({
      peerId: PEER,
      projectId,
      stepId: "waiting_for_approval",
      status: "approved",
      project,
      domainInput: domainInput(project),
      organizationId: ORG,
      actor: "user@test.com",
      supabase: {} as never,
    });

    const after = getDefaultProjectEpisodeRepository().get({ organizationId: ORG, projectId })!;
    beforeStates.push(after.snapshot.state);

    expect(beforeStates).not.toContain("waiting_for_approval");
    expect(after.snapshot.completedBrains).toContain("execution");

    const secondPass = await runner.runEpisodeUntilBlocked({
      organizationId: ORG,
      projectId,
      peerId: PEER,
      maxSteps: 4,
    });
    expect(secondPass.episode.snapshot.completedBrains.filter((b) => b === "execution").length).toBeLessThanOrEqual(
      after.snapshot.completedBrains.filter((b) => b === "execution").length + 0
    );
  });
});
