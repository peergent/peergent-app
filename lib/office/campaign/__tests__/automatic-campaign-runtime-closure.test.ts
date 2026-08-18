/**
 * PX-61 — full automatic campaign runtime closure (server + projection sync).
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
import { resetDefaultCreativeRepository } from "@/lib/brain/layers/creative/creative-repository";
import { resetDefaultValidationRepository } from "@/lib/brain/layers/validation/validation-repository";
import { resetDefaultMemoryRepository } from "@/lib/brain/layers/memory";
import { resetDefaultExecutionRepository, resetDefaultExecutionProviderRegistry } from "@/lib/brain/layers/execution";
import { resetDefaultLearningBrainRepository, resetLearningBrainLayerCounters } from "@/lib/brain/layers/learning";
import {
  createProjectEpisodeRunner,
  resetDefaultProjectEpisodeRepository,
  getDefaultProjectEpisodeRepository,
  resolveEpisodeStepBudget,
  detectAutomaticCampaignPipelineStall,
  isEpisodeAtHealthyRuntimeBoundary,
  FIXTURE_ORG_ID,
} from "@/lib/brain/project-runtime";
import { createMarketingCampaignProject } from "@/lib/peer-experience/marketing/projects/project-engine";
import type { MarketingProject } from "@/lib/peer-experience/marketing/projects/types";
import {
  submitLiveCampaignStepApprovalServer,
  resetApprovalBridgeInFlightForTests,
} from "@/lib/office/campaign/live-campaign-approval-bridge-server";
import {
  buildCampaignRuntimeProjectionFromEpisode,
  resolveEpisodeNextStepCopy,
  resolveEpisodePrimaryAction,
} from "@/lib/office/campaign/campaign-runtime-projection";

const PEER = "emma-px61";
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
  resetApprovalBridgeInFlightForTests();
}

function automaticProject(): MarketingProject {
  return createMarketingCampaignProject({
    peerId: PEER,
    ownerLabel: "Emma",
    name: "PX-61 Runtime Closure",
    goalLabel: "Leads",
    description: "Full runtime closure.",
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
  return runner.runEpisodeUntilBlocked({
    organizationId: ORG,
    projectId,
    peerId: PEER,
    maxSteps: resolveEpisodeStepBudget({ campaignApprovalMode: "approval_before_publication" }),
  });
}

describe("PX-61 automatic campaign runtime closure", () => {
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

  it("A — fresh campaign reaches waiting_for_approval in one server invocation", async () => {
    const project = automaticProject();
    const result = await runToApproval(project.id);
    expect(result.stopReason).toBe("waiting_for_human_approval");
    expect(detectAutomaticCampaignPipelineStall({ project, episode: result.episode })).toBeNull();
  });

  it("B — approval returns runtimeSync at monitoring boundary in same request", async () => {
    const project = automaticProject();
    await runToApproval(project.id);

    const bridge = await submitLiveCampaignStepApprovalServer({
      peerId: PEER,
      projectId: project.id,
      stepId: "waiting_for_approval",
      status: "approved",
      project,
      domainInput: domainInput(project),
      organizationId: ORG,
      actor: "user@test.com",
      supabase: {} as never,
    });

    expect(bridge.ok).toBe(true);
    if (!bridge.ok) return;

    expect(bridge.runtimeSync).toBeDefined();
    expect(bridge.runtimeSync!.runtimeProjection.completedBrains).toContain("execution");
    expect(bridge.runtimeSync!.stopReason).toBe("waiting_for_external_outcomes");
    expect(
      bridge.runtimeSync!.episodeStatus === "waiting_for_outcomes" ||
        bridge.runtimeSync!.lifecycleState === "monitoring"
    ).toBe(true);
    expect(bridge.runtimeSync!.runtimeProjection.lastError).toBeNull();
  });

  it("C — runtimeSync projection drives monitoring UI copy without legacy refresh", () => {
    const projection = {
      source: "episode" as const,
      projectId: "proj-test",
      durableVersion: 12,
      episodeStatus: "waiting_for_outcomes" as const,
      lifecycleState: "monitoring" as const,
      completedBrains: ["execution"] as const,
      pendingBrains: ["learning"] as const,
      approvalCheckpoint: {
        kind: "campaign_approval" as const,
        satisfied: true,
        customerSummary: "Approved",
      },
      lastError: null,
      memoryCheckpoint1Complete: true,
      validationApprovalPending: false,
      approvalGrantedForExecution: true,
      executionHandoff: null,
    };

    const copy = resolveEpisodeNextStepCopy(projection, "en");
    expect(copy).toContain("monitoring performance");

    const action = resolveEpisodePrimaryAction(projection, { isCampaignPublished: false });
    expect(action.label).toContain("monitoring performance");
    expect(action.kind).not.toBe("continue");
  });

  it("E — healthy monitoring boundary is not recovery-eligible", async () => {
    const project = automaticProject();
    await runToApproval(project.id);
    const bridge = await submitLiveCampaignStepApprovalServer({
      peerId: PEER,
      projectId: project.id,
      stepId: "waiting_for_approval",
      status: "approved",
      project,
      domainInput: domainInput(project),
      organizationId: ORG,
      actor: "user@test.com",
      supabase: {} as never,
    });
    expect(bridge.ok).toBe(true);
    const episode = getDefaultProjectEpisodeRepository().get({ organizationId: ORG, projectId: project.id })!;
    expect(isEpisodeAtHealthyRuntimeBoundary(episode)).toBe(true);
    expect(detectAutomaticCampaignPipelineStall({ project, episode })).toBeNull();
  });

  it("G — duplicate approval does not duplicate execution", async () => {
    const project = automaticProject();
    await runToApproval(project.id);
    await submitLiveCampaignStepApprovalServer({
      peerId: PEER,
      projectId: project.id,
      stepId: "waiting_for_approval",
      status: "approved",
      project,
      domainInput: domainInput(project),
      organizationId: ORG,
      actor: "user@test.com",
      supabase: {} as never,
    });
    const firstCount = getDefaultProjectEpisodeRepository()
      .get({ organizationId: ORG, projectId: project.id })!
      .snapshot.brainHistory.filter((h) => h.brainId === "execution").length;

    const second = await submitLiveCampaignStepApprovalServer({
      peerId: PEER,
      projectId: project.id,
      stepId: "waiting_for_approval",
      status: "approved",
      project,
      domainInput: domainInput(project),
      organizationId: ORG,
      actor: "user@test.com",
      supabase: {} as never,
    });
    expect(second.ok).toBe(true);
    const secondCount = getDefaultProjectEpisodeRepository()
      .get({ organizationId: ORG, projectId: project.id })!
      .snapshot.brainHistory.filter((h) => h.brainId === "execution").length;
    expect(secondCount).toBe(firstCount);
  });

  it("L — cold projection from durable episode matches monitoring state", async () => {
    const project = automaticProject();
    await runToApproval(project.id);
    await submitLiveCampaignStepApprovalServer({
      peerId: PEER,
      projectId: project.id,
      stepId: "waiting_for_approval",
      status: "approved",
      project,
      domainInput: domainInput(project),
      organizationId: ORG,
      actor: "user@test.com",
      supabase: {} as never,
    });
    const episode = getDefaultProjectEpisodeRepository().get({ organizationId: ORG, projectId: project.id })!;
    const projection = buildCampaignRuntimeProjectionFromEpisode(episode);
    expect(projection.completedBrains).toContain("execution");
    expect(projection.lifecycleState === "monitoring" || projection.episodeStatus === "waiting_for_outcomes").toBe(
      true
    );
  });

  it("M — no Preparing publication copy when monitoring persisted", async () => {
    const project = automaticProject();
    await runToApproval(project.id);
    await submitLiveCampaignStepApprovalServer({
      peerId: PEER,
      projectId: project.id,
      stepId: "waiting_for_approval",
      status: "approved",
      project,
      domainInput: domainInput(project),
      organizationId: ORG,
      actor: "user@test.com",
      supabase: {} as never,
    });
    const episode = getDefaultProjectEpisodeRepository().get({ organizationId: ORG, projectId: project.id })!;
    const projection = buildCampaignRuntimeProjectionFromEpisode(episode);
    const action = resolveEpisodePrimaryAction(projection, { isCampaignPublished: false });
    expect(action.label).not.toMatch(/Preparing publication/i);
  });

  it("O — regression: one approval advances all runnable states (not one per refresh)", async () => {
    const project = automaticProject();
    await runToApproval(project.id);
    const bridge = await submitLiveCampaignStepApprovalServer({
      peerId: PEER,
      projectId: project.id,
      stepId: "waiting_for_approval",
      status: "approved",
      project,
      domainInput: domainInput(project),
      organizationId: ORG,
      actor: "user@test.com",
      supabase: {} as never,
    });
    expect(bridge.ok).toBe(true);
    if (!bridge.ok) return;
    expect(bridge.runtimeSync!.runtimeProjection.lifecycleState).not.toBe("ready_to_publish");
    expect(bridge.runtimeSync!.runtimeProjection.lifecycleState).not.toBe("waiting_for_approval");
    expect(bridge.runtimeSync!.runtimeProjection.completedBrains).toContain("execution");
  });
});
