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
import { resetDefaultResearchBrainRepository, resetDefaultResearchProviderRegistry } from "@/lib/brain/layers/research";
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
  FIXTURE_ORG_ID,
  startOrResumeDemoCampaignEpisode,
  emitOrchestrationDiagnostic,
} from "@/lib/brain/project-runtime";
import * as evaluateProjectModule from "@/lib/brain/project-engine/evaluate-project";
import { executeBrainForWorkflowStep } from "@/lib/brain/integration/execute-brain-for-workflow-step";
import { executeBrainForProjectBrain } from "@/lib/brain/integration/execute-brain-for-workflow-step";
import { createMarketingCampaignProject } from "@/lib/peer-experience/marketing/projects/project-engine";
import {
  assertLiveBrainServerContext,
  ContextAcquisitionInfrastructureError,
} from "@/lib/brain/context-acquisition/server/context-acquisition-config";
import { startOrResumeCampaignEpisode } from "@/lib/brain/project-runtime/campaign-episode-controller";

const ORG_A = FIXTURE_ORG_ID;
const ORG_B = "org-px50-isolation";

const mockSupabase = {} as import("@/lib/intelligence/api/org-context").AppSupabaseClient;

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
  configureLayerRepositories({ mode: "persistent_in_memory" });
  resetActiveDurablePersistence();
  resetSimulatedDurableStore();
}

function setupDurable() {
  const durable = createSimulatedDurablePersistence();
  setActiveDurablePersistence(durable);
  return durable;
}

describe("PX-50 Production Orchestration Unification", () => {
  beforeEach(resetAll);
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it("TEST A — live strategy path evaluates Project Engine before brain execution", async () => {
    setupDurable();
    const evaluateSpy = vi.spyOn(evaluateProjectModule, "evaluateProjectEpisode");

    const projectId = "proj-px50-engine-authority";
    const result = await startOrResumeDemoCampaignEpisode({
      organizationId: ORG_A,
      projectId,
      peerId: "demo",
      target: { targetBrain: "strategy" },
    });

    expect(evaluateSpy.mock.calls.length).toBeGreaterThan(0);
    expect(result.orchestrationAuthority).toBe("project_engine");
    expect(
      result.episode.snapshot.completedBrains.includes("strategy") ||
        result.status === "waiting_for_approval"
    ).toBe(true);
  });

  it("TEST B — durable resume reuses same episode for org/project", async () => {
    const durable = setupDurable();
    const projectId = "proj-px50-durable-resume";

    const runner = createProjectEpisodeRunner(undefined, durable);
    const first = await runner.runUntilPause({
      organizationId: ORG_A,
      projectId,
      peerId: "demo",
      maxSteps: 8,
    });
    const episodeId = first.episode.snapshot.episodeId;

    resetDefaultProjectEpisodeRepository();
    resetDefaultCompanyRepository();
    resetDefaultResearchBrainRepository();
    resetDefaultReasoningBrainRepository();
    resetDefaultMarketingIntelligenceBrainRepository();
    resetDefaultStrategyBrainRepository();

    durable.hydrateProject({ organizationId: ORG_A, projectId });
    const reloaded = getDefaultProjectEpisodeRepository().get({
      organizationId: ORG_A,
      projectId,
    });

    expect(reloaded?.snapshot.episodeId).toBe(episodeId);
    expect(reloaded?.snapshot.completedBrains).toEqual(first.episode.snapshot.completedBrains);
  });

  it("TEST C — blocking context gaps pause episode before strategy", async () => {
    setupDurable();
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
        companySnapshot: { organizationId: ORG_A } as never,
        brandGraph: null,
        campaignContext: { projectId: "proj-gap" } as never,
        priorMemories: [],
      },
    });

    const runner = createProjectEpisodeRunner();
    const result = await runner.runUntilPause({
      organizationId: ORG_A,
      projectId: "proj-px50-context-gap",
      peerId: "live-peer-not-demo",
      useRealContext: true,
      supabase: mockSupabase,
      campaignContext: { projectId: "proj-gap", goals: ["Leads"], description: "Test" } as never,
      target: { targetBrain: "strategy" },
    });

    expect(result.status).toBe("waiting_for_context");
    expect(result.episode.snapshot.completedBrains).not.toContain("strategy");
    expect(result.missingContext.some((g) => g.blocking)).toBe(true);
  });

  it("TEST D — org B cannot resume org A episode", async () => {
    setupDurable();
    const projectId = "proj-px50-org-isolation";
    const runner = createProjectEpisodeRunner();

    await runner.runUntilPause({
      organizationId: ORG_A,
      projectId,
      peerId: "demo",
      maxSteps: 5,
    });

    const crossOrg = getDefaultProjectEpisodeRepository().get({
      organizationId: ORG_B,
      projectId,
    });
    expect(crossOrg).toBeNull();

    const ownOrg = getDefaultProjectEpisodeRepository().get({
      organizationId: ORG_A,
      projectId,
    });
    expect(ownOrg).not.toBeNull();
  });

  it("TEST E — demo episode run preserves project_engine authority metadata", async () => {
    setupDurable();
    const result = await startOrResumeDemoCampaignEpisode({
      organizationId: ORG_A,
      projectId: "proj-px50-metadata",
      peerId: "demo",
      target: { targetBrain: "company" },
    });

    expect(result.orchestrationAuthority).toBe("project_engine");
    expect(result.episode.snapshot.organizationId).toBe(ORG_A);
  });

  it("TEST F — executeBrainForWorkflowStep remains functional as adapter", async () => {
    const project = createMarketingCampaignProject({
      peerId: "demo",
      ownerLabel: "Demo",
      name: "Adapter test",
      goalLabel: "Leads",
      description: "Test campaign",
      primaryGoalId: "generate_leads",
      targetAudience: "SMB",
      setupMode: "automatic",
      approvalMode: "approval_before_publication",
      selectedChannels: ["linkedin"],
    });

    const domainInput = {
      peerId: "demo" as const,
      organizationId: ORG_A,
      userName: "Test",
      peerName: "Demo",
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

    const workflow = await executeBrainForWorkflowStep({
      stepId: "strategy_determined",
      peerId: "demo",
      project,
      domainInput,
      locale: "en",
    });

    expect(workflow?.result).toBeTruthy();
    expect(workflow?.result.run.capabilityId).toBe("strategy");
  });

  it("TEST F — executeBrainForProjectBrain maps brain id to capability", async () => {
    const project = createMarketingCampaignProject({
      peerId: "demo",
      ownerLabel: "Demo",
      name: "Brain adapter",
      goalLabel: "Leads",
      description: "Test",
      primaryGoalId: "generate_leads",
      targetAudience: "SMB",
      setupMode: "automatic",
      approvalMode: "approval_before_publication",
      selectedChannels: ["linkedin"],
    });

    const domainInput = {
      peerId: "demo" as const,
      organizationId: ORG_A,
      userName: "Test",
      peerName: "Demo",
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

    const result = await executeBrainForProjectBrain(
      { brainId: "strategy", peerId: "demo", project, domainInput, locale: "en" },
      undefined
    );

    expect(result?.result.run.capabilityId).toBe("strategy");
  });

  it("TEST G — production fail-closed without supabase", () => {
    vi.stubEnv("NODE_ENV", "production");
    expect(() =>
      assertLiveBrainServerContext({ peerId: "emma", supabase: null })
    ).toThrow(ContextAcquisitionInfrastructureError);
  });

  it("TEST G — production campaign episode requires supabase", async () => {
    vi.stubEnv("NODE_ENV", "production");
    await expect(
      startOrResumeCampaignEpisode({
        supabase: mockSupabase,
        organizationId: ORG_A,
        projectId: "proj-fail",
        peerId: "emma",
        peerRole: "Marketing",
        campaignContext: { projectId: "proj-fail", goals: ["Leads"], description: "x" } as never,
        project: createMarketingCampaignProject({
          peerId: "emma",
          ownerLabel: "Emma",
          name: "Fail",
          goalLabel: "Leads",
          description: "x",
          primaryGoalId: "generate_leads",
          targetAudience: "SMB",
          setupMode: "automatic",
          approvalMode: "approval_before_publication",
          selectedChannels: ["linkedin"],
        }),
        domainInput: {
          peerId: "emma",
          organizationId: ORG_A,
          userName: "",
          peerName: "",
          campaignTitle: "Fail",
          generating: null,
          generatingActivity: null,
          understanding: null,
          strategy: null,
          plan: null,
          drafts: [],
          publicationPackages: [],
          activityFeed: [],
          workUnits: [],
          projects: [],
          responsibilities: [],
          automations: [],
          connections: [],
        },
        target: { targetBrain: "strategy" },
      })
    ).rejects.toThrow();
  });

  it("emits orchestration diagnostics without customer context payloads", () => {
    const infoSpy = vi.spyOn(console, "info").mockImplementation(() => {});
    emitOrchestrationDiagnostic({
      event: "project_engine_evaluated",
      organizationId: ORG_A,
      projectId: "proj-diag",
      peerId: "demo",
      actionKind: "run_brain",
      brainId: "strategy",
    });
    const line = infoSpy.mock.calls[0]?.[0];
    expect(String(line)).not.toMatch(/SECRET|password|token/i);
    expect(String(line)).toContain("project_engine_evaluated");
  });
});
