import { describe, expect, it } from "vitest";
import type { ProjectEpisodeRecord } from "@/lib/brain/project-runtime/types";
import type { MarketingProject } from "@/lib/peer-experience/marketing/projects/types";
import { buildCampaignDetailViewModel } from "@/lib/office/campaign/build-campaign-detail";
import { buildCampaignWorkflowViewModel } from "@/lib/office/campaign/build-campaign-workflow";
import { orchestrationPrimaryActionToCta } from "@/lib/office/campaign/campaign-intelligence-orchestrator";
import {
  buildCampaignRuntimeProjectionFromEpisode,
  resolveEpisodeApprovalBridgeStepId,
  resolveEpisodePrimaryAction,
  resolveEpisodeStatusLabel,
  resolveEpisodeWorkflowStepState,
} from "@/lib/office/campaign/campaign-runtime-projection";

const PEER = "emma";
const PROJECT_ID = "proj-1786880173521-o3gvmjq";

function liveProject(overrides?: Partial<MarketingProject>): MarketingProject {
  return {
    id: PROJECT_ID,
    peerId: PEER,
    title: "You Charge Launch",
    goal: "Leads",
    campaignType: "product_launch",
    createdAt: "2026-08-01T00:00:00.000Z",
    updatedAt: "2026-08-01T00:00:00.000Z",
    ownerLabel: "Pilot",
    rawRequest: "More demo requests for You Charge.",
    origin: "campaign_wizard",
    campaignSetup: {
      description: "Automatic campaign without strategyGeneratedAt (stale client).",
      primaryGoalId: "generate_leads",
      targetAudience: "Entrepreneurs",
      setupMode: "automatic",
      approvalMode: "approval_before_publication",
      strategyRun: { status: "running", runId: "stale-run" },
    },
    ...overrides,
  };
}

function domainInput(project: MarketingProject) {
  return {
    projects: [project],
    drafts: [],
    workUnits: [],
    understanding: null,
  };
}

function episodeForState(input: {
  state: ProjectEpisodeRecord["snapshot"]["state"];
  episodeStatus?: ProjectEpisodeRecord["episodeStatus"];
  completedBrains?: readonly string[];
  approvalCheckpoint?: ProjectEpisodeRecord["snapshot"]["approvalCheckpoint"];
  memoryCheckpoint1Complete?: boolean;
}): ProjectEpisodeRecord {
  return {
    snapshot: {
      episodeId: "ep-prod",
      organizationId: "38f6f543-fd88-4f9e-90fd-f3b206d9cb62",
      projectId: PROJECT_ID,
      peerId: PEER,
      state: input.state,
      previousState: null,
      activeBrain: null,
      completedBrains: (input.completedBrains ?? []) as never,
      pendingBrains: [],
      waitingReason: input.state === "waiting_for_approval" ? "approval_required" : null,
      approvalCheckpoint: input.approvalCheckpoint ?? null,
      brainHistory: [],
      decisionIds: [],
      eventLog: [],
      retryCount: {},
      contextVersion: 1,
      startedAt: "2026-08-01T00:00:00.000Z",
      updatedAt: "2026-08-01T00:00:00.000Z",
      completedAt: null,
      engineVersion: "1",
    },
    artifacts: {
      organizationId: "38f6f543-fd88-4f9e-90fd-f3b206d9cb62",
      projectId: PROJECT_ID,
      episodeId: "ep-prod",
      correlationId: "corr-prod",
      memoryOutputRefs: [],
      performanceObservationIds: [],
      approvalIds: [],
      learningProposalIds: [],
    },
    episodeStatus: input.episodeStatus ?? "running",
    contextReady: true,
    sliceAvailability: {},
    approvalSatisfied: false,
    validationApprovalPending: true,
    memoryCheckpoint1Complete: input.memoryCheckpoint1Complete ?? false,
    memoryCheckpoint2Complete: false,
    performanceObservationsAvailable: false,
    approvalGrantedForExecution: false,
    contextGaps: [],
    executedBrainKeys: [],
    lastError: null,
    correlationId: "corr-prod",
    startedAt: "2026-08-01T00:00:00.000Z",
    updatedAt: "2026-08-01T00:00:00.000Z",
    completedAt: null,
    resolvedGraphs: {},
    durableVersion: 12,
  } as ProjectEpisodeRecord;
}

const PRODUCTION_BRAINS = [
  "company",
  "research",
  "reasoning",
  "marketing_intelligence",
  "strategy",
  "planning",
  "creative",
  "validation",
  "memory",
] as const;

function workflow(project: MarketingProject, runtimeProjection: ReturnType<typeof buildCampaignRuntimeProjectionFromEpisode>) {
  return buildCampaignWorkflowViewModel({
    peerId: PEER,
    project,
    domainInput: domainInput(project),
    locale: "en",
    runtimeProjection,
  });
}

describe("PX-56 campaign runtime projection", () => {
  it("A: strategizing in progress marks strategy step active", () => {
    const projection = buildCampaignRuntimeProjectionFromEpisode(
      episodeForState({
        state: "strategizing",
        completedBrains: ["company", "research", "reasoning", "marketing_intelligence"],
      })
    );
    expect(resolveEpisodeWorkflowStepState("strategy_determined", projection)).toBe("active");
    expect(resolveEpisodeWorkflowStepState("deliverables_created", projection)).toBe("upcoming");
  });

  it("B: planning in progress marks channels step active", () => {
    const projection = buildCampaignRuntimeProjectionFromEpisode(
      episodeForState({
        state: "planning",
        completedBrains: ["company", "research", "reasoning", "marketing_intelligence", "strategy"],
      })
    );
    expect(resolveEpisodeWorkflowStepState("strategy_determined", projection)).toBe("done");
    expect(resolveEpisodeWorkflowStepState("channels_selected", projection)).toBe("active");
  });

  it("C: generating marks content step active", () => {
    const projection = buildCampaignRuntimeProjectionFromEpisode(
      episodeForState({
        state: "generating",
        completedBrains: [
          "company",
          "research",
          "reasoning",
          "marketing_intelligence",
          "strategy",
          "planning",
        ],
      })
    );
    expect(resolveEpisodeWorkflowStepState("channels_selected", projection)).toBe("done");
    expect(resolveEpisodeWorkflowStepState("deliverables_created", projection)).toBe("active");
  });

  it("D: validating keeps content active until validation completes", () => {
    const projection = buildCampaignRuntimeProjectionFromEpisode(
      episodeForState({
        state: "validating",
        completedBrains: [
          "company",
          "research",
          "reasoning",
          "marketing_intelligence",
          "strategy",
          "planning",
          "creative",
        ],
      })
    );
    expect(resolveEpisodeWorkflowStepState("deliverables_created", projection)).toBe("active");
  });

  it("E: waiting_for_approval — production regression proj-1786880173521-o3gvmjq", () => {
    const projection = buildCampaignRuntimeProjectionFromEpisode(
      episodeForState({
        state: "waiting_for_approval",
        episodeStatus: "waiting_for_approval",
        completedBrains: [...PRODUCTION_BRAINS],
        memoryCheckpoint1Complete: true,
        approvalCheckpoint: {
          id: "approval-campaign-prod",
          kind: "campaign_approval",
          requiredAt: "validating",
          satisfied: false,
          satisfiedAt: null,
          unblocksState: "ready_to_publish",
          customerSummary: "Approve the full campaign package for publication.",
        },
      })
    );

    const project = liveProject();
    const vm = workflow(project, projection);
    const detail = buildCampaignDetailViewModel({
      peerId: PEER,
      projectId: PROJECT_ID,
      domainInput: domainInput(project),
      locale: "en",
      runtimeProjection: projection,
    });

    expect(vm.steps.find((s) => s.id === "strategy_determined")?.state).toBe("done");
    expect(vm.steps.find((s) => s.id === "deliverables_created")?.state).toBe("done");
    expect(vm.steps.find((s) => s.id === "waiting_for_approval")?.state).toBe("active");

    expect(detail?.statusLabel.toLowerCase()).toContain("waiting for your approval");
    expect(detail?.statusLabel.toLowerCase()).not.toContain("strategy being prepared");

    expect(vm.nextStepCta.action).toBe("approve_campaign");
    expect(vm.nextStepCta.label.toLowerCase()).toMatch(/review campaign|publication/);
    expect(vm.nextStepCta.action).not.toBe("add_context");
    expect(vm.approvalCenter.count).toBeGreaterThan(0);
  });

  it("F: ready_to_publish shows schedule CTA", () => {
    const projection = buildCampaignRuntimeProjectionFromEpisode(
      episodeForState({
        state: "ready_to_publish",
        episodeStatus: "running",
        completedBrains: [...PRODUCTION_BRAINS],
      })
    );
    const action = resolveEpisodePrimaryAction(projection, { locale: "en" });
    const cta = orchestrationPrimaryActionToCta(action);
    expect(cta.action).toBe("schedule");
  });

  it("G: monitoring marks optimizing active", () => {
    const projection = buildCampaignRuntimeProjectionFromEpisode(
      episodeForState({
        state: "monitoring",
        completedBrains: [...PRODUCTION_BRAINS, "execution"],
      })
    );
    expect(resolveEpisodeWorkflowStepState("optimizing", projection)).toBe("active");
    expect(resolveEpisodeWorkflowStepState("published", projection)).toBe("done");
  });

  it("H: failed episode surfaces retry action", () => {
    const projection = buildCampaignRuntimeProjectionFromEpisode(
      episodeForState({
        state: "failed",
        episodeStatus: "failed",
        completedBrains: ["company", "research"],
      })
    );
    const action = resolveEpisodePrimaryAction(projection, { locale: "en" });
    expect(action.kind).toBe("retry_strategy");
  });

  it("I: waiting_for_context shows complete context CTA", () => {
    const projection = buildCampaignRuntimeProjectionFromEpisode(
      episodeForState({
        state: "collecting_context",
        episodeStatus: "waiting_for_context",
        completedBrains: [],
      })
    );
    const action = resolveEpisodePrimaryAction(projection, { locale: "en" });
    expect(action.kind).toBe("view_context");
    expect(action.label.toLowerCase()).toContain("context");
  });

  it("J: legacy campaign without episode keeps orchestrator path", () => {
    const project = liveProject();
    const vm = buildCampaignWorkflowViewModel({
      peerId: PEER,
      project,
      domainInput: domainInput(project),
      locale: "en",
      runtimeProjection: null,
    });
    expect(vm.nextStepCta.action === "working" || vm.nextStepCta.action === "add_context").toBe(true);
  });

  it("K: cold refresh waiting_for_approval does not depend on strategyGeneratedAt", () => {
    const projection = buildCampaignRuntimeProjectionFromEpisode(
      episodeForState({
        state: "waiting_for_approval",
        episodeStatus: "waiting_for_approval",
        completedBrains: [...PRODUCTION_BRAINS],
        memoryCheckpoint1Complete: true,
        approvalCheckpoint: {
          id: "approval-campaign-cold",
          kind: "campaign_approval",
          requiredAt: "validating",
          satisfied: false,
          satisfiedAt: null,
          unblocksState: "ready_to_publish",
          customerSummary: "Approve the full campaign package for publication.",
        },
      })
    );

    const project = liveProject({
      campaignSetup: {
        ...liveProject().campaignSetup!,
        strategyGeneratedAt: undefined,
        strategyRun: { status: "running", runId: "orphaned" },
      },
    });

    const vm = workflow(project, projection);
    expect(resolveEpisodeStatusLabel(projection, "en").toLowerCase()).toContain("approval");
    expect(vm.nextStepCta.action).toBe("approve_campaign");
    expect(vm.steps.find((s) => s.id === "waiting_for_approval")?.state).toBe("active");
  });

  it("L: approval bridge uses waiting_for_approval at campaign checkpoint", () => {
    const projection = buildCampaignRuntimeProjectionFromEpisode(
      episodeForState({
        state: "waiting_for_approval",
        episodeStatus: "waiting_for_approval",
        completedBrains: [...PRODUCTION_BRAINS],
        approvalCheckpoint: {
          id: "approval-campaign-bridge",
          kind: "campaign_approval",
          requiredAt: "validating",
          satisfied: false,
          satisfiedAt: null,
          unblocksState: "ready_to_publish",
          customerSummary: "Approve the full campaign package for publication.",
        },
      })
    );

    expect(resolveEpisodeApprovalBridgeStepId(projection, "deliverables_created")).toBe(
      "waiting_for_approval"
    );
    const action = resolveEpisodePrimaryAction(projection, { locale: "en" });
    const cta = orchestrationPrimaryActionToCta(action);
    expect(cta.action).toBe("approve_campaign");
    expect(cta.stepId).toBe("waiting_for_approval");
  });
});

describe("PX-56 waiting_for_approval UI assertions", () => {
  it("hides strategy being prepared and complete campaign context when episode authoritative", () => {
    const projection = buildCampaignRuntimeProjectionFromEpisode(
      episodeForState({
        state: "waiting_for_approval",
        episodeStatus: "waiting_for_approval",
        completedBrains: [...PRODUCTION_BRAINS],
        memoryCheckpoint1Complete: true,
        approvalCheckpoint: {
          id: "approval-campaign-ui",
          kind: "campaign_approval",
          requiredAt: "validating",
          satisfied: false,
          satisfiedAt: null,
          unblocksState: "ready_to_publish",
          customerSummary: "Approve the full campaign package for publication.",
        },
      })
    );

    const project = liveProject();
    const vm = workflow(project, projection);

    expect(vm.nextStepCta.label.toLowerCase()).not.toContain("strategy being prepared");
    expect(vm.nextStepCta.action).not.toBe("add_context");
    expect(vm.nextStepCta.action).not.toBe("view_context");
    expect(vm.steps.find((s) => s.id === "deliverables_created")?.state).toBe("done");
    expect(vm.steps.find((s) => s.id === "waiting_for_approval")?.state).toBe("active");
    expect(vm.nextStepCta.action).toBe("approve_campaign");
  });
});
