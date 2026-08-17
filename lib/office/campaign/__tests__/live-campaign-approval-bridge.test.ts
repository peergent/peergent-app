/**
 * PX-58 — production approval bridge regression (server path, no sessionStorage).
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  configureLayerRepositories,
  resetConfiguredLayerRepositories,
  resetLayerRepositoryStores,
} from "@/lib/brain/persistence/layer-repository-factory";
import { createSimulatedDurablePersistence } from "@/lib/brain/persistence/layer/simulated-durable-persistence";
import {
  resetSimulatedDurableStore,
  simulatedDurableStore,
} from "@/lib/brain/persistence/layer/simulated-durable-store";
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
import { resetDefaultCreativeRepository } from "@/lib/brain/layers/creative/creative-repository";
import { resetDefaultValidationRepository } from "@/lib/brain/layers/validation/validation-repository";
import { resetDefaultMemoryRepository } from "@/lib/brain/layers/memory";
import { resetDefaultExecutionRepository, resetDefaultExecutionProviderRegistry } from "@/lib/brain/layers/execution";
import { resetDefaultLearningBrainRepository, resetLearningBrainLayerCounters } from "@/lib/brain/layers/learning";
import {
  createProjectEpisodeRunner,
  resetDefaultProjectEpisodeRepository,
  FIXTURE_ORG_ID,
  getDefaultProjectEpisodeRepository,
  resolveEpisodeStepBudget,
  createProductionBrainExecutionAdapter,
} from "@/lib/brain/project-runtime";
import { createMarketingCampaignProject } from "@/lib/peer-experience/marketing/projects/project-engine";
import type { MarketingProject } from "@/lib/peer-experience/marketing/projects/types";
import { submitLiveCampaignStepApprovalServer } from "@/lib/office/campaign/live-campaign-approval-bridge-server";
import { mergeCampaignStepApprovalIntoProject } from "@/lib/office/campaign/live-campaign-context-store";
import * as projectEpisodeRunnerModule from "@/lib/brain/project-runtime/project-episode-runner";

const PEER = "emma-live";
const ORG = FIXTURE_ORG_ID;

const preparePersistenceMock = vi.hoisted(() => vi.fn().mockResolvedValue({}));

vi.mock("@/lib/brain/persistence/server/prepare-brain-server-persistence", () => ({
  prepareBrainServerPersistence: preparePersistenceMock,
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
    name: "PX-58 Approval Bridge",
    goalLabel: "Leads",
    description: "Approval bridge production regression.",
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

function supabaseStub() {
  return {} as never;
}

describe("PX-58 live campaign approval bridge", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    resetSimulatedDurableStore();
    resetAll();
    configureLayerRepositories({ mode: "persistent_in_memory" });
    setActiveDurablePersistence(createSimulatedDurablePersistence());
    preparePersistenceMock.mockClear();
  });

  afterEach(() => {
    resetSimulatedDurableStore();
    resetAll();
  });

  it("A — mergeCampaignStepApprovalIntoProject works without sessionStorage (server path)", () => {
    const project = automaticProject();
    const updated = mergeCampaignStepApprovalIntoProject(project, "waiting_for_approval", "approved");
    expect(updated).not.toBeNull();
    expect(updated?.campaignSetup?.stepApprovals?.waiting_for_approval).toBe("approved");
  });

  it("B — submitLiveCampaignStepApprovalServer succeeds at waiting_for_approval without sessionStorage", async () => {
    const project = automaticProject();
    const projectId = project.id;
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

    const pause = await runner.runUntilPause({
      organizationId: ORG,
      projectId,
      peerId: PEER,
      maxSteps: resolveEpisodeStepBudget({ campaignApprovalMode: "approval_before_publication" }),
    });

    expect(pause.status).toBe("waiting_for_approval");
    expect(pause.episode.snapshot.approvalCheckpoint?.kind).toBe("campaign_approval");

    const bridge = await submitLiveCampaignStepApprovalServer({
      peerId: PEER,
      projectId,
      stepId: "waiting_for_approval",
      status: "approved",
      project,
      domainInput: domainInput(project),
      organizationId: ORG,
      actor: "user@test.com",
      supabase: supabaseStub(),
      locale: "en",
    });

    expect(bridge.ok).toBe(true);
    if (!bridge.ok) return;

    expect(bridge.approvalPersisted).toBe(true);
    expect(bridge.project.campaignSetup?.stepApprovals?.waiting_for_approval).toBe("approved");

    const approvals = simulatedDurableStore.getApprovals(projectId);
    expect(approvals.some((a) => a.decision === "approved")).toBe(true);

    const episode = getDefaultProjectEpisodeRepository().get({ organizationId: ORG, projectId })!;
    expect(episode.snapshot.approvalCheckpoint?.satisfied).toBe(true);
    expect(episode.snapshot.completedBrains).toContain("execution");
    expect(bridge.episodeResumed).toBe(true);
  });

  it("C — duplicate approval is idempotent (no second execution)", async () => {
    const project = automaticProject();
    const projectId = project.id;
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

    await runner.runUntilPause({
      organizationId: ORG,
      projectId,
      peerId: PEER,
      maxSteps: resolveEpisodeStepBudget({ campaignApprovalMode: "approval_before_publication" }),
    });

    const adapter = createProductionBrainExecutionAdapter({
      peerId: PEER,
      project,
      domainInput: domainInput(project),
    });

    const bridgeRunner = createProjectEpisodeRunner(undefined, undefined, adapter);

    const first = await submitLiveCampaignStepApprovalServer({
      peerId: PEER,
      projectId,
      stepId: "waiting_for_approval",
      status: "approved",
      project,
      domainInput: domainInput(project),
      organizationId: ORG,
      actor: "user@test.com",
      supabase: supabaseStub(),
    });

    expect(first.ok).toBe(true);
    const execCountAfterFirst = getDefaultProjectEpisodeRepository().get({
      organizationId: ORG,
      projectId,
    })!.snapshot.brainHistory.filter((h) => h.brainId === "execution").length;

    const mergedProject = mergeCampaignStepApprovalIntoProject(project, "waiting_for_approval", "approved")!;

    const second = await submitLiveCampaignStepApprovalServer({
      peerId: PEER,
      projectId,
      stepId: "waiting_for_approval",
      status: "approved",
      project: mergedProject,
      domainInput: domainInput(mergedProject),
      organizationId: ORG,
      actor: "user@test.com",
      supabase: supabaseStub(),
    });

    expect(second.ok).toBe(true);
    if (second.ok) {
      expect(second.approvalPersisted).toBe(true);
      expect(second.episodeResumed).toBe(false);
    }

    const execCountAfterSecond = getDefaultProjectEpisodeRepository().get({
      organizationId: ORG,
      projectId,
    })!.snapshot.brainHistory.filter((h) => h.brainId === "execution").length;

    expect(execCountAfterSecond).toBe(execCountAfterFirst);
    expect(bridgeRunner).toBeDefined();
  });

  it("D — resume failure after durable approval still returns ok (approval boundary separate)", async () => {
    const project = automaticProject();
    const projectId = project.id;
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

    await runner.runUntilPause({
      organizationId: ORG,
      projectId,
      peerId: PEER,
      maxSteps: resolveEpisodeStepBudget({ campaignApprovalMode: "approval_before_publication" }),
    });

    const originalFactory = projectEpisodeRunnerModule.createProjectEpisodeRunner;
    const factorySpy = vi
      .spyOn(projectEpisodeRunnerModule, "createProjectEpisodeRunner")
      .mockImplementationOnce((durable, registry, adapter) => {
        const realRunner = originalFactory(durable, registry, adapter);
        vi.spyOn(realRunner, "resumeEpisode").mockRejectedValueOnce(
          new Error("execution_channel_unavailable")
        );
        return realRunner;
      });

    const bridge = await submitLiveCampaignStepApprovalServer({
      peerId: PEER,
      projectId,
      stepId: "waiting_for_approval",
      status: "approved",
      project,
      domainInput: domainInput(project),
      organizationId: ORG,
      actor: "user@test.com",
      supabase: supabaseStub(),
    });

    factorySpy.mockRestore();

    expect(bridge.ok).toBe(true);
    if (!bridge.ok) return;

    expect(bridge.approvalPersisted).toBe(true);
    expect(bridge.episodeResumed).toBe(false);
    expect(bridge.resumeError).toContain("execution_channel_unavailable");

    const approvals = simulatedDurableStore.getApprovals(projectId);
    expect(approvals.some((a) => a.decision === "approved")).toBe(true);
  });
});
