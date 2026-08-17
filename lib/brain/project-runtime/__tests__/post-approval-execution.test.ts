/**
 * PX-59 — post-approval execution regression tests.
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
  resetDefaultProjectEpisodeRepository,
  submitProjectApprovalDurable,
  FIXTURE_ORG_ID,
  getDefaultProjectEpisodeRepository,
  resolveEpisodeStepBudget,
  detectAutomaticCampaignPipelineStall,
} from "@/lib/brain/project-runtime";
import { createMarketingCampaignProject } from "@/lib/peer-experience/marketing/projects/project-engine";
import type { MarketingProject } from "@/lib/peer-experience/marketing/projects/types";
import {
  freezeApprovedExecutionHandoff,
  needsPostApprovalExecution,
} from "@/lib/brain/approval/approved-execution-handoff";
import { submitLiveCampaignStepApprovalServer } from "@/lib/office/campaign/live-campaign-approval-bridge-server";
import { mergeCampaignStepApprovalIntoProject } from "@/lib/office/campaign/live-campaign-context-store";

const PEER = "emma-px59";
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
}

function automaticProject(): MarketingProject {
  return createMarketingCampaignProject({
    peerId: PEER,
    ownerLabel: "Emma",
    name: "PX-59 Post-Approval Execution",
    goalLabel: "Leads",
    description: "Post-approval execution regression.",
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

async function runToApproval(projectId: string) {
  const runner = createProjectEpisodeRunner();
  await runner.startEpisode({
    organizationId: ORG,
    projectId,
    peerId: PEER,
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

  return runner.runUntilPause({
    organizationId: ORG,
    projectId,
    peerId: PEER,
    maxSteps: resolveEpisodeStepBudget({ campaignApprovalMode: "approval_before_publication" }),
  });
}

describe("PX-59 post-approval execution", () => {
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

  it("A — approval bridge reaches execution after ready_to_publish", async () => {
    const project = automaticProject();
    const projectId = project.id;

    const pause = await runToApproval(projectId);
    expect(pause.status).toBe("waiting_for_approval");

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
    expect(episode.approvedExecutionHandoff?.packageId).toBeTruthy();
    expect(episode.snapshot.completedBrains).toContain("execution");
    expect(episode.snapshot.state).not.toBe("waiting_for_approval");
  });

  it("B — resume from ready_to_publish executes without regenerating creative", async () => {
    const project = automaticProject();
    const projectId = project.id;

    await runToApproval(projectId);
    const beforeCreative = getDefaultCreativeRepository().getLatest({
      organizationId: ORG,
      campaignId: projectId,
    })?.createdAt;

    await submitProjectApprovalDurable({
      organizationId: ORG,
      projectId,
      approvalId: "approval-px59-handoff",
      decision: "approved",
      actor: "test@example.com",
    });

    const repo = getDefaultProjectEpisodeRepository();
    let episode = repo.get({ organizationId: ORG, projectId })!;
    episode = freezeApprovedExecutionHandoff({
      episode,
      approvalId: "approval-px59-handoff",
      campaignName: project.title,
    });
    repo.save(episode);
    const packageId = episode.approvedExecutionHandoff!.packageId;

    const runner = createProjectEpisodeRunner();
    await runner.resumeEpisode({
      organizationId: ORG,
      projectId,
      approvalSatisfied: true,
    });

    const after = repo.get({ organizationId: ORG, projectId })!;
    expect(after.approvedExecutionHandoff?.packageId).toBe(packageId);
    expect(after.snapshot.completedBrains).toContain("execution");

    const afterCreative = getDefaultCreativeRepository().getLatest({
      organizationId: ORG,
      campaignId: projectId,
    })?.createdAt;
    expect(afterCreative).toBe(beforeCreative);
  });

  it("C — cold-start resume from ready_to_publish triggers execution", async () => {
    const project = automaticProject();
    const projectId = project.id;

    await runToApproval(projectId);
    await submitProjectApprovalDurable({
      organizationId: ORG,
      projectId,
      approvalId: "approval-px59-cold",
      decision: "approved",
      actor: "test@example.com",
    });

    const repo = getDefaultProjectEpisodeRepository();
    let episode = repo.get({ organizationId: ORG, projectId })!;
    episode = {
      ...freezeApprovedExecutionHandoff({
        episode,
        approvalId: "approval-px59-cold",
        campaignName: project.title,
      }),
      snapshot: {
        ...episode.snapshot,
        state: "ready_to_publish",
        approvalCheckpoint: episode.snapshot.approvalCheckpoint
          ? { ...episode.snapshot.approvalCheckpoint, satisfied: true }
          : {
              id: "approval-campaign-test",
              kind: "campaign_approval",
              requiredAt: "validating",
              satisfied: true,
              satisfiedAt: new Date().toISOString(),
              unblocksState: "ready_to_publish",
              customerSummary: "Approved",
            },
      },
      approvalGrantedForExecution: true,
      episodeStatus: "running",
    };
    repo.save(episode);

    const runner = createProjectEpisodeRunner();
    const result = await runner.runUntilPause({
      organizationId: ORG,
      projectId,
      peerId: PEER,
      maxSteps: resolveEpisodeStepBudget({ campaignApprovalMode: "approval_before_publication" }),
    });

    expect(result.episode.snapshot.completedBrains).toContain("execution");
  });

  it("D — duplicate bridge approval is idempotent", async () => {
    const project = automaticProject();
    const projectId = project.id;
    await runToApproval(projectId);

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

    const execCountFirst = getDefaultProjectEpisodeRepository().get({
      organizationId: ORG,
      projectId,
    })!.snapshot.brainHistory.filter((h) => h.brainId === "execution").length;

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

    const execCountSecond = getDefaultProjectEpisodeRepository().get({
      organizationId: ORG,
      projectId,
    })!.snapshot.brainHistory.filter((h) => h.brainId === "execution").length;

    expect(execCountSecond).toBe(execCountFirst);
  });

  it("E — stall invariant flags production-like ready_to_publish execution gap", () => {
    const project = automaticProject();
    const episode = {
      episodeStatus: "running",
      lastError: null,
      approvalGrantedForExecution: true,
      memoryCheckpoint1Complete: true,
      campaignApprovalMode: "approval_before_publication",
      snapshot: {
        state: "ready_to_publish",
        completedBrains: [
          "company",
          "research",
          "reasoning",
          "marketing_intelligence",
          "strategy",
          "planning",
          "creative",
          "validation",
          "memory",
        ],
        pendingBrains: ["execution", "learning"],
        activeBrain: null,
        approvalCheckpoint: { kind: "campaign_approval", satisfied: true },
      },
    } as never;

    expect(needsPostApprovalExecution(episode)).toBe(true);

    const stall = detectAutomaticCampaignPipelineStall({ project, episode });
    expect(stall?.reason).toBe("ORCHESTRATION_STALL_EXECUTION_NOT_STARTED");
  });
});
