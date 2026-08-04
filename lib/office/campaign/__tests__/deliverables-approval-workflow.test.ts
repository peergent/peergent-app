import { beforeEach, describe, expect, it, vi } from "vitest";
import type { MarketingProject } from "@/lib/peer-experience/marketing/projects/types";
import {
  CampaignIntelligenceOrchestrator,
  orchestrationPrimaryActionToCta,
} from "@/lib/office/campaign/campaign-intelligence-orchestrator";
import { buildCampaignWorkflowViewModel } from "@/lib/office/campaign/build-campaign-workflow";
import { buildCampaignContext } from "@/lib/office/campaign/campaign-context";
import {
  persistLiveCampaignStepApproval,
} from "@/lib/office/campaign/live-campaign-context-store";
import { saveMarketingWorkspaceState } from "@/lib/marketing-workspace/storage";

const PEER = "emma";
const PROJECT_ID = "deliverables-approval-proj";

function installSessionStorageMock() {
  const store = new Map<string, string>();
  vi.stubGlobal("window", {});
  vi.stubGlobal("sessionStorage", {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => store.set(key, value),
    removeItem: (key: string) => store.delete(key),
    clear: () => store.clear(),
  });
}

function readyProject(overrides?: Partial<MarketingProject>): MarketingProject {
  return {
    id: PROJECT_ID,
    peerId: PEER,
    title: "Launch Campaign",
    goal: "Leads",
    campaignType: "product_launch",
    createdAt: "2026-08-01T00:00:00.000Z",
    updatedAt: "2026-08-01T00:00:00.000Z",
    ownerLabel: "Pilot",
    rawRequest: "Grow leads",
    origin: "campaign_wizard",
    campaignSetup: {
      description: "Grow qualified demo requests",
      primaryGoalId: "generate_leads",
      targetAudience: "SMB owners",
      setupMode: "automatic",
      approvalMode: "approval_before_publication",
      websiteUrl: "https://example.com",
      campaignCompetitors: [{ name: "Rival Co" }],
      campaignContextVersion: 3,
      strategyGeneratedAt: "2026-08-02T00:00:00.000Z",
      campaignBrandContext: {
        brandName: "Example Co",
        industry: "B2B software",
        productsAndServices: ["AI workforce platform"],
        uniqueSellingPoints: ["Premium AI workspace"],
        targetAudience: "SMB owners",
      },
      stepApprovals: {
        strategy_determined: "approved",
        channels_selected: "approved",
      },
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

describe("deliverables approval workflow", () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
    installSessionStorageMock();
    saveMarketingWorkspaceState(PEER, { projects: [readyProject()] });
  });

  it("persistLiveCampaignStepApproval writes deliverables_created on campaignSetup", () => {
    const updated = persistLiveCampaignStepApproval(
      PEER,
      PROJECT_ID,
      "deliverables_created",
      "approved"
    );
    expect(updated).not.toBeNull();
    expect(updated?.campaignSetup?.stepApprovals?.deliverables_created).toBe("approved");
  });

  it("repeated deliverables approval is idempotent", () => {
    persistLiveCampaignStepApproval(PEER, PROJECT_ID, "deliverables_created", "approved");
    const again = persistLiveCampaignStepApproval(PEER, PROJECT_ID, "deliverables_created", "approved");
    expect(again?.campaignSetup?.stepApprovals?.deliverables_created).toBe("approved");
  });

  it("orchestrator marks deliverables_created done after approval without drafts", () => {
    const project = readyProject({
      campaignSetup: {
        ...readyProject().campaignSetup!,
        stepApprovals: {
          strategy_determined: "approved",
          channels_selected: "approved",
          deliverables_created: "approved",
        },
      },
    });
    const ctx = buildCampaignContext({ project, domainInput: domainInput(project), locale: "nl" });
    const state = CampaignIntelligenceOrchestrator.evaluate({
      project,
      campaignContext: ctx,
      locale: "nl",
      stepApprovals: project.campaignSetup?.stepApprovals,
      strategyOutputReady: true,
      pendingDeliverableCount: 0,
      approvedDeliverableCount: 0,
    });

    expect(
      CampaignIntelligenceOrchestrator.resolveWorkflowStepState("deliverables_created", state, {
        pendingDeliverableCount: 0,
        isCampaignScheduled: false,
        isCampaignPublished: false,
        hasDrafts: false,
        stepApprovals: project.campaignSetup?.stepApprovals,
      })
    ).toBe("done");
  });

  it("waiting_for_approval is not locked after deliverables approval without pending drafts", () => {
    const project = readyProject({
      campaignSetup: {
        ...readyProject().campaignSetup!,
        stepApprovals: {
          strategy_determined: "approved",
          channels_selected: "approved",
          deliverables_created: "approved",
        },
      },
    });
    const ctx = buildCampaignContext({ project, domainInput: domainInput(project), locale: "nl" });
    const state = CampaignIntelligenceOrchestrator.evaluate({
      project,
      campaignContext: ctx,
      locale: "nl",
      stepApprovals: project.campaignSetup?.stepApprovals,
      strategyOutputReady: true,
      pendingDeliverableCount: 0,
    });

    expect(
      CampaignIntelligenceOrchestrator.resolveWorkflowStepState("waiting_for_approval", state, {
        pendingDeliverableCount: 0,
        isCampaignScheduled: false,
        isCampaignPublished: false,
        hasDrafts: false,
        stepApprovals: project.campaignSetup?.stepApprovals,
      })
    ).toBe("done");
  });

  it("scheduled becomes active after deliverables approval", () => {
    const project = readyProject({
      campaignSetup: {
        ...readyProject().campaignSetup!,
        stepApprovals: {
          strategy_determined: "approved",
          channels_selected: "approved",
          deliverables_created: "approved",
        },
      },
    });
    const ctx = buildCampaignContext({ project, domainInput: domainInput(project), locale: "nl" });
    const state = CampaignIntelligenceOrchestrator.evaluate({
      project,
      campaignContext: ctx,
      locale: "nl",
      stepApprovals: project.campaignSetup?.stepApprovals,
      strategyOutputReady: true,
      pendingDeliverableCount: 0,
    });

    expect(state.activeCustomerStepId).toBe("scheduled");
    expect(state.primaryAction.kind).toBe("schedule");
    const cta = orchestrationPrimaryActionToCta(state.primaryAction);
    expect(cta.action).toBe("schedule");
    expect(cta.stepId).toBe("scheduled");
    expect(cta.label).toMatch(/inplannen|Schedule/i);
  });

  it("live workflow VM advances after deliverables approval", () => {
    const project = readyProject({
      campaignSetup: {
        ...readyProject().campaignSetup!,
        stepApprovals: {
          strategy_determined: "approved",
          channels_selected: "approved",
          deliverables_created: "approved",
        },
      },
    });
    const workflow = buildCampaignWorkflowViewModel({
      peerId: PEER,
      project,
      domainInput: domainInput(project),
      locale: "nl",
      isDemo: false,
    });

    const deliverablesStep = workflow.steps.find((s) => s.id === "deliverables_created");
    const waitingStep = workflow.steps.find((s) => s.id === "waiting_for_approval");
    const scheduledStep = workflow.steps.find((s) => s.id === "scheduled");

    expect(deliverablesStep?.state).toBe("done");
    expect(waitingStep?.state).toBe("done");
    expect(scheduledStep?.state).toBe("active");
    expect(workflow.nextStepCta.action).toBe("schedule");
    expect(workflow.nextStepCta.action).not.toBe("continue");
  });

  it("before approval deliverables_created stays active with review CTA", () => {
    const project = readyProject();
    const workflow = buildCampaignWorkflowViewModel({
      peerId: PEER,
      project,
      domainInput: domainInput(project),
      locale: "nl",
      isDemo: false,
    });

    const deliverablesStep = workflow.steps.find((s) => s.id === "deliverables_created");
    expect(deliverablesStep?.state).toBe("active");
    expect(workflow.nextStepCta.stepId).toBe("deliverables_created");
    expect(workflow.nextStepCta.label).toMatch(/onderdelen|deliverables/i);
  });

  it("orchestration never maps post-approval state to dead continue CTA", () => {
    const project = readyProject({
      campaignSetup: {
        ...readyProject().campaignSetup!,
        stepApprovals: {
          strategy_determined: "approved",
          channels_selected: "approved",
          deliverables_created: "approved",
        },
      },
    });
    const ctx = buildCampaignContext({ project, domainInput: domainInput(project), locale: "nl" });
    const state = CampaignIntelligenceOrchestrator.evaluate({
      project,
      campaignContext: ctx,
      locale: "nl",
      stepApprovals: project.campaignSetup?.stepApprovals,
      strategyOutputReady: true,
    });
    const cta = orchestrationPrimaryActionToCta(state.primaryAction);
    expect(cta.action).not.toBe("continue");
    expect(state.primaryAction.kind).not.toBe("continue");
  });

  it("strategy and channel approvals still resolve correctly", () => {
    const strategyPending = readyProject({
      campaignSetup: {
        ...readyProject().campaignSetup!,
        stepApprovals: {},
      },
    });
    const ctx = buildCampaignContext({
      project: strategyPending,
      domainInput: domainInput(strategyPending),
      locale: "nl",
    });
    const strategyState = CampaignIntelligenceOrchestrator.evaluate({
      project: strategyPending,
      campaignContext: ctx,
      locale: "nl",
      stepApprovals: {},
      strategyOutputReady: true,
    });
    expect(strategyState.primaryAction.kind).toBe("review_strategy");

    const channelsPending = readyProject({
      campaignSetup: {
        ...readyProject().campaignSetup!,
        stepApprovals: { strategy_determined: "approved" },
      },
    });
    const channelsState = CampaignIntelligenceOrchestrator.evaluate({
      project: channelsPending,
      campaignContext: ctx,
      locale: "nl",
      stepApprovals: { strategy_determined: "approved" },
      strategyOutputReady: true,
    });
    expect(channelsState.primaryAction.kind).toBe("review_channels");
  });
});
