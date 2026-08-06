import { describe, expect, it, vi } from "vitest";
import { createWorkUnit, transitionWorkUnit } from "@/lib/peer-workflow/work-unit-engine";
import {
  CAMPAIGN_STRATEGY_WORK_UNIT_TITLE,
  CREATIVE_DIRECTION_WORK_UNIT_TITLE,
} from "@/lib/peer-experience/marketing/runtime/identify-work-unit";
import { CAMPAIGN_STRATEGY_EXECUTION_COMPLETE_NOTE } from "@/lib/peer-experience/marketing/runtime/execute-marketing-work-unit";
import { CREATIVE_DIRECTION_EXECUTION_COMPLETE_NOTE } from "@/lib/peer-experience/marketing/runtime/execute-creative-direction-work-unit";
import { buildCampaignReviewViewModel } from "@/lib/peer-experience/marketing/campaign-review";
import { buildCampaignPublishReadinessViewModel } from "@/lib/peer-experience/marketing/campaign-collaboration/build-publish-readiness";
import {
  applyCampaignApproval,
  approveCampaign,
  computeCampaignPackageVersion,
  isCampaignApprovalPending,
  isCampaignApprovalValid,
} from "@/lib/peer-experience/marketing/campaign-approval";
import type { BrainStructuredOutput } from "@/lib/brain/evidence/structured-output";
import type { MarketingProject } from "@/lib/peer-experience/marketing/projects/types";

const projectId = "proj-campaign-approval";
const peerId = "peer-1";
const orgId = "org-1";

function strategyOutput(at = "2026-08-01T10:00:00.000Z"): BrainStructuredOutput {
  return {
    capabilityId: "strategy",
    capabilityVersion: 1,
    generatedAt: at,
    findings: [{ label: "Campaign objective", value: "Grow pipeline" }],
    decisions: [{ label: "Strategy", rationale: "Founder-led narrative." }],
    recommendations: [],
  };
}

function sampleProject(overrides: Partial<MarketingProject> = {}): MarketingProject {
  return {
    id: projectId,
    peerId,
    title: "Launch campaign",
    goal: "Grow",
    campaignType: "product_launch",
    createdAt: "2026-07-01T12:00:00.000Z",
    updatedAt: "2026-08-01T12:00:00.000Z",
    ownerLabel: "You",
    rawRequest: "Launch",
    campaignSetup: {
      description: "Launch",
      primaryGoalId: "generate_leads",
      approvalMode: "approval_before_publication",
      campaignContextVersion: 2,
      onboardingCompletedAt: "2026-07-02T12:00:00.000Z",
      campaignBrainOutputs: {
        contextVersion: 2,
        strategy: strategyOutput(),
        channel_planning: {
          capabilityId: "channel_planning",
          capabilityVersion: 1,
          generatedAt: "2026-08-01T10:05:00.000Z",
          findings: [{ label: "Channel: LinkedIn", value: "Primary" }],
          decisions: [],
          recommendations: [],
        },
      },
    },
    ...overrides,
  };
}

function sampleStrategy() {
  return {
    summary: "Founder-led.",
    generatedAt: "2026-08-01T10:00:00.000Z",
    positioningRecommendations: [{ recommendation: "Premium peer OS" }],
    contentPillars: [{ name: "Trust" }],
    campaignIdeas: [],
    socialMediaStrategy: [{ platform: "LinkedIn" }],
  } as never;
}

function reviewReadyStrategyUnit() {
  let unit = createWorkUnit({
    peerId,
    projectId,
    role: "Marketing",
    title: CAMPAIGN_STRATEGY_WORK_UNIT_TITLE,
    deliverableKind: "generic",
    channel: "Campaign",
    objective: "Strategy",
    audience: null,
    needsVisual: false,
    recurrence: "once",
    rawRequest: "Strategy",
  });
  return transitionWorkUnit(
    unit,
    "review_ready",
    "review_ready",
    CAMPAIGN_STRATEGY_EXECUTION_COMPLETE_NOTE
  );
}

function reviewReadyCreativeUnit() {
  let unit = createWorkUnit({
    peerId,
    projectId,
    role: "Marketing",
    title: CREATIVE_DIRECTION_WORK_UNIT_TITLE,
    deliverableKind: "generic",
    channel: "Campaign",
    objective: "Creative",
    audience: null,
    needsVisual: false,
    recurrence: "once",
    rawRequest: "Creative",
  });
  return transitionWorkUnit(
    unit,
    "review_ready",
    "review_ready",
    CREATIVE_DIRECTION_EXECUTION_COMPLETE_NOTE
  );
}

describe("campaign approval (Sprint 9.4)", () => {
  it("computes a stable package version fingerprint", () => {
    const project = sampleProject();
    const v1 = computeCampaignPackageVersion({ project });
    const v2 = computeCampaignPackageVersion({ project });
    expect(v1.campaignPackageVersion).toBe(v2.campaignPackageVersion);
    expect(v1.campaignContextVersion).toBe(2);
    expect(v1.brainOutputVersion).toContain("strategy:");
  });

  it("invalidates approval when brain output changes", () => {
    const project = sampleProject();
    const versionA = computeCampaignPackageVersion({ project });
    const approval = applyCampaignApproval(
      {
        organizationId: orgId,
        peerId,
        projectId,
        approvalMode: "approval_before_publication",
        packageVersion: versionA,
        approvedBy: "user-1",
        approvedAt: "2026-08-01T11:00:00.000Z",
      },
      { approvals: {}, history: {} },
      () => undefined
    ).approval!;

    const changedProject = sampleProject({
      campaignSetup: {
        ...sampleProject().campaignSetup!,
        campaignContextVersion: 3,
        campaignBrainOutputs: undefined,
      },
    });
    const versionB = computeCampaignPackageVersion({ project: changedProject });
    expect(isCampaignApprovalValid(approval, versionB)).toBe(false);
  });

  it("builds executive briefing pending from campaign approval state", () => {
    const project = sampleProject();
    const strategyUnit = reviewReadyStrategyUnit();
    const vm = buildCampaignReviewViewModel({
      peerId,
      peerName: "Emma",
      projectId,
      project,
      campaignDetail: {
        id: projectId,
        title: project.title,
        status: "planning",
        statusLabel: "Planning",
        goal: { businessObjective: "Grow" },
        audience: { targetAudience: "" },
        channels: [],
        timeline: { summary: "" },
        approvalModeLabel: "Approve before publication",
        approvalQueue: { pendingCount: 0 },
        deliverableSummary: "",
        progress: 0,
        progressKnown: true,
        linkedContent: [],
        activitySummary: [],
      } as never,
      workUnits: [strategyUnit],
      strategy: sampleStrategy(),
      approvalMode: "approval_before_publication",
      campaignsEnabled: true,
      onboardingComplete: true,
      hasExecutionWork: true,
      campaignApprovalByProjectId: {},
    });

    expect(vm.executiveBriefing).not.toBeNull();
    expect(vm.executiveBriefingPendingApproval).toBe(true);
    expect(vm.campaignPublicationUnlocked).toBe(false);
    expect(vm.reviewQueue).toHaveLength(0);
  });

  it("unlocks publication after campaign approval on current package version", () => {
    const project = sampleProject();
    const strategyUnit = reviewReadyStrategyUnit();
    const packageVersion = computeCampaignPackageVersion({ project });
    const approval = applyCampaignApproval(
      {
        organizationId: orgId,
        peerId,
        projectId,
        approvalMode: "approval_before_publication",
        packageVersion,
        approvedBy: "user-1",
        approvedAt: "2026-08-01T11:00:00.000Z",
      },
      { approvals: {}, history: {} },
      () => undefined
    ).approval!;

    const vm = buildCampaignReviewViewModel({
      peerId,
      peerName: "Emma",
      projectId,
      project,
      campaignDetail: {
        id: projectId,
        title: project.title,
        status: "planning",
        statusLabel: "Planning",
        goal: { businessObjective: "Grow" },
        audience: { targetAudience: "" },
        channels: [],
        timeline: { summary: "" },
        approvalModeLabel: "Approve before publication",
        approvalQueue: { pendingCount: 0 },
        deliverableSummary: "",
        progress: 0,
        progressKnown: true,
        linkedContent: [],
        activitySummary: [],
      } as never,
      workUnits: [strategyUnit],
      strategy: sampleStrategy(),
      approvalMode: "approval_before_publication",
      campaignsEnabled: true,
      onboardingComplete: true,
      hasExecutionWork: true,
      campaignApprovalByProjectId: { [projectId]: approval },
    });

    expect(vm.executiveBriefingPendingApproval).toBe(false);
    expect(vm.campaignPublicationUnlocked).toBe(true);

    const publish = buildCampaignPublishReadinessViewModel({
      reviewItems: vm.allReviewItems,
      buildInput: {
        peerId,
        peerName: "Emma",
        projectId,
        project,
        workUnits: [strategyUnit],
        reviewItems: vm.allReviewItems,
        strategy: sampleStrategy(),
        approvalMode: "approval_before_publication",
        campaignApprovalByProjectId: { [projectId]: approval },
      },
    });

    expect(publish.status).toBe("ready");
  });

  it("approveCampaign records audit metadata and triggers continuation once", async () => {
    const project = sampleProject();
    const strategyUnit = reviewReadyStrategyUnit();
    const continueCampaign = vi.fn().mockResolvedValue({
      ok: true,
      projectId,
      completedWorkUnits: [],
      stopReason: "no_executable_work_units",
      stopMessage: "Done",
      iterations: 0,
    });

    const approvals: Record<string, import("@/lib/peer-experience/marketing/campaign-approval").CampaignApprovalRecord> =
      {};
    const history: Record<string, readonly import("@/lib/peer-experience/marketing/campaign-approval").CampaignApprovalRecord[]> =
      {};
    const activities: import("@/lib/marketing-workspace").ActivityFeedItem[] = [];

    const snap = {
      peerId,
      organizationId: orgId,
      userId: "user-1",
      projects: [project],
      domainInput: {
        peerId,
        organizationId: orgId,
        userName: "You",
        peerName: "Emma",
        campaignTitle: project.title,
        generating: null,
        generatingActivity: null,
        understanding: null,
        strategy: sampleStrategy(),
        plan: null,
        drafts: [],
        publicationPackages: [],
        activityFeed: [],
        workUnits: [strategyUnit],
        projects: [project],
        responsibilities: [],
        automations: [],
        connections: [],
        campaignApprovalByProjectId: approvals,
        campaignApprovalHistoryByProjectId: history,
      },
    };

    const inFlight = { current: null as string | null };
    const deps = {
      getSnapshot: () => snap,
      commit: (patch: {
        campaignApprovalByProjectId?: typeof approvals;
        campaignApprovalHistoryByProjectId?: typeof history;
      }) => {
        if (patch.campaignApprovalByProjectId) {
          Object.assign(approvals, patch.campaignApprovalByProjectId);
          snap.domainInput.campaignApprovalByProjectId = patch.campaignApprovalByProjectId;
        }
        if (patch.campaignApprovalHistoryByProjectId) {
          Object.assign(history, patch.campaignApprovalHistoryByProjectId);
          snap.domainInput.campaignApprovalHistoryByProjectId =
            patch.campaignApprovalHistoryByProjectId;
        }
      },
      logActivity: (item: import("@/lib/marketing-workspace").ActivityFeedItem) => {
        activities.push(item);
      },
      createActivity: (
        activityType: import("@/lib/marketing-workspace/experience/types").ActivityType,
        title: string,
        description: string,
        options?: { relatedObject?: string }
      ) => ({
        id: `act-${activities.length}`,
        timestamp: "2026-08-01T11:00:00.000Z",
        activityType,
        title,
        description,
        relatedObject: options?.relatedObject,
      }),
      continueCampaign,
      approvalActionInFlight: inFlight,
    };

    const first = await approveCampaign(deps, { projectId });
    expect(first.ok).toBe(true);
    expect(first.status).toBe("approved");
    expect(first.publicationUnlocked).toBe(true);
    expect(first.continuationStarted).toBe(true);
    expect(continueCampaign).toHaveBeenCalledTimes(1);
    expect(approvals[projectId]?.campaignContextVersion).toBe(2);
    expect(activities[0]?.activityType).toBe("campaign_approved");
    expect(activities[0]?.description).toContain("packageVersion=");

    expect(isCampaignApprovalValid(approvals[projectId], computeCampaignPackageVersion({ project }))).toBe(true);

    const second = await approveCampaign(deps, { projectId });
    expect(second.ok).toBe(true);
    expect(second.status).toBe("already_approved");
    expect(continueCampaign).toHaveBeenCalledTimes(1);
  });

  it("does not treat stale approval as pending", () => {
    const project = sampleProject();
    const strategyUnit = reviewReadyStrategyUnit();
    const staleVersion = computeCampaignPackageVersion({ project, briefing: null });
    const staleApproval = applyCampaignApproval(
      {
        organizationId: orgId,
        peerId,
        projectId,
        approvalMode: "approval_before_publication",
        packageVersion: staleVersion,
        approvedBy: "user-1",
        approvedAt: "2026-08-01T11:00:00.000Z",
      },
      { approvals: {}, history: {} },
      () => undefined
    ).approval!;

    const changedProject = sampleProject({
      campaignSetup: {
        ...sampleProject().campaignSetup!,
        campaignContextVersion: 3,
        campaignBrainOutputs: undefined,
      },
    });

    const pending = isCampaignApprovalPending({
      project: changedProject,
      allReviewItems: [],
      approvalMode: "approval_before_publication",
      campaignApproval: staleApproval,
      executiveBriefing: {
        title: "Briefing",
        preparedAt: "2026-08-01T10:00:00.000Z",
        companyName: "Acme",
        sections: [],
        recommendationSummary: "Go",
        requiredDecisions: [],
      },
    });

    expect(isCampaignApprovalValid(staleApproval, computeCampaignPackageVersion({ project: changedProject }))).toBe(false);
    expect(pending).toBe(false);
  });
});
