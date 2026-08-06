import { describe, expect, it, vi, beforeEach } from "vitest";
import { createWorkUnit, transitionWorkUnit } from "@/lib/peer-workflow/work-unit-engine";
import {
  CAMPAIGN_STRATEGY_WORK_UNIT_TITLE,
  CREATIVE_DIRECTION_WORK_UNIT_TITLE,
} from "@/lib/peer-experience/marketing/runtime/identify-work-unit";
import { CAMPAIGN_STRATEGY_EXECUTION_COMPLETE_NOTE } from "@/lib/peer-experience/marketing/runtime/execute-marketing-work-unit";
import { CREATIVE_DIRECTION_EXECUTION_COMPLETE_NOTE } from "@/lib/peer-experience/marketing/runtime/execute-creative-direction-work-unit";
import {
  applyCampaignApproval,
  approveCampaign,
  computeCampaignPackageVersion,
} from "@/lib/peer-experience/marketing/campaign-approval";
import type { BrainStructuredOutput } from "@/lib/brain/evidence/structured-output";
import type { MarketingProject } from "@/lib/peer-experience/marketing/projects/types";
import {
  acquireContinuationLock,
  cacheContinuationResult,
  clearContinuationLocksForTests,
  getCachedContinuationResult,
} from "@/lib/peer-experience/marketing/campaign-execution/idempotent-continuation";
import {
  continueCampaignWithExecution,
} from "@/lib/peer-experience/marketing/campaign-execution/continue-campaign-with-execution";
import {
  compareTimelineEvents,
  createCampaignExecutionTimelineEvent,
  buildCampaignExecutionCorrelation,
} from "@/lib/peer-experience/marketing/campaign-execution";
import {
  canTransitionPublicationStatus,
  initialCampaignPublicationStatus,
} from "@/lib/peer-experience/marketing/campaign-execution/publication-state-machine";
import {
  executeCampaignPublication,
  retryCampaignPublication,
} from "@/lib/peer-experience/marketing/campaign-execution/publication-executor";
import {
  detectRecoverableCampaignExecutions,
  recoverCampaignExecutions,
} from "@/lib/peer-experience/marketing/campaign-execution/campaign-execution-recovery";
import {
  loadDurableCampaignExecutionState,
  resetDurableCampaignExecutionStateForTests,
} from "@/lib/peer-experience/marketing/campaign-execution/durable-campaign-state-store";
import {
  persistCampaignApprovalDurably,
} from "@/lib/peer-experience/marketing/campaign-execution/persist-campaign-approval-durably";
import { runCampaignContinuation } from "@/lib/peer-experience/marketing/campaign-continuation/campaign-continuation-runner";

const projectId = "proj-sprint-95";
const peerId = "peer-sprint-95";
const orgId = "org-sprint-95";

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

describe("campaign execution production hardening (Sprint 9.5)", () => {
  beforeEach(() => {
    resetDurableCampaignExecutionStateForTests(peerId);
    clearContinuationLocksForTests();
  });

  it("persists campaign approval durably across reload", () => {
    const project = sampleProject();
    const packageVersion = computeCampaignPackageVersion({ project });
    const approvals: Record<string, import("@/lib/peer-experience/marketing/campaign-approval").CampaignApprovalRecord> =
      {};
    const history: Record<string, readonly import("@/lib/peer-experience/marketing/campaign-approval").CampaignApprovalRecord[]> =
      {};

    applyCampaignApproval(
      {
        organizationId: orgId,
        peerId,
        projectId,
        approvalMode: "approval_before_publication",
        packageVersion,
        approvedBy: "user-1",
        approvedAt: "2026-08-01T11:00:00.000Z",
      },
      { approvals, history },
      (next) => {
        Object.assign(approvals, next.approvals);
        Object.assign(history, next.history);
      }
    );

    persistCampaignApprovalDurably(peerId, {
      campaignApprovalByProjectId: approvals,
      campaignApprovalHistoryByProjectId: history,
    });

    const reloaded = loadDurableCampaignExecutionState(peerId);
    expect(reloaded.campaignApprovalByProjectId[projectId]?.id).toBeDefined();
    expect(reloaded.campaignApprovalHistoryByProjectId[projectId]).toHaveLength(1);
  });

  it("deduplicates duplicate continue requests via idempotency cache", async () => {
    const key = "campaign-continuation-peer-proj-run-approval";
    const result = {
      ok: true,
      projectId,
      completedWorkUnits: [],
      stopReason: "no_executable_work_units" as const,
      stopMessage: "Done",
      iterations: 1,
    };

    cacheContinuationResult(peerId, projectId, key, result);
    expect(getCachedContinuationResult(peerId, key)?.stopMessage).toBe("Done");

    let executions = 0;
    const [first, second] = await Promise.all([
      acquireContinuationLock(key, async () => {
        executions += 1;
        await new Promise((r) => setTimeout(r, 20));
        return result;
      }),
      acquireContinuationLock(key, async () => {
        executions += 1;
        return result;
      }),
    ]);

    expect(first).toEqual(result);
    expect(second).toEqual(result);
    expect(executions).toBe(1);
  });

  it("runs publication state machine transitions", () => {
    expect(canTransitionPublicationStatus("pending", "approved")).toBe(true);
    expect(canTransitionPublicationStatus("approved", "publishing")).toBe(true);
    expect(canTransitionPublicationStatus("publishing", "published")).toBe(true);
    expect(canTransitionPublicationStatus("publishing", "failed")).toBe(true);
    expect(canTransitionPublicationStatus("failed", "retrying")).toBe(true);
    expect(canTransitionPublicationStatus("retrying", "published")).toBe(true);
    expect(canTransitionPublicationStatus("published", "publishing")).toBe(false);
    expect(initialCampaignPublicationStatus({ hasApproval: true })).toBe("approved");
  });

  it("retries publication without rerunning continuation", async () => {
    const correlation = buildCampaignExecutionCorrelation({
      projectId,
      organizationId: orgId,
      campaignRunId: "crun_test",
      approvalId: "appr_test",
    });

    let publishAttempts = 0;
    const first = await executeCampaignPublication({
      peerId,
      projectId,
      campaignRunId: "crun_test",
      approvalId: "appr_test",
      hasApproval: true,
      publish: async () => {
        publishAttempts += 1;
        return { ok: false, message: "Network error", code: "network" };
      },
      appendTimeline: (events) => events,
    });

    expect(first.ok).toBe(false);
    expect(first.publication.status).toBe("failed");
    expect(publishAttempts).toBe(1);

    const retried = await retryCampaignPublication({
      peerId,
      projectId,
      campaignRunId: "crun_test",
      approvalId: "appr_test",
      hasApproval: true,
      publish: async () => {
        publishAttempts += 1;
        return { ok: true, message: "Published" };
      },
      appendTimeline: (events) => events,
    });

    expect(retried.ok).toBe(true);
    expect(retried.publication.status).toBe("published");
    expect(publishAttempts).toBe(2);
    expect(retried.publication.retryCount).toBeGreaterThanOrEqual(1);
    void correlation;
  });

  it("detects interrupted publication for recovery", () => {
    const project = sampleProject({
      campaignSetup: {
        ...sampleProject().campaignSetup!,
        campaignRun: {
          campaignRunId: "crun_recover",
          status: "publication_pending",
          currentStage: "publication",
          startedAt: "2026-08-01T10:00:00.000Z",
          idempotencyKey: "key",
          organizationId: orgId,
          peerId,
          projectId,
        },
        campaignPublication: {
          status: "publishing",
          campaignRunId: "crun_recover",
          updatedAt: "2026-08-01T10:05:00.000Z",
          retryCount: 0,
          idempotencyKey: "pub-key",
        },
      },
    });

    const recoverable = detectRecoverableCampaignExecutions(peerId, [project]);
    expect(recoverable).toHaveLength(1);
    expect(recoverable[0]?.reason).toBe("interrupted_publication");
  });

  it("recovers interrupted publication on restart", async () => {
    const project = sampleProject({
      campaignSetup: {
        ...sampleProject().campaignSetup!,
        campaignRun: {
          campaignRunId: "crun_recover2",
          status: "publication_pending",
          currentStage: "publication",
          startedAt: "2026-08-01T10:00:00.000Z",
          idempotencyKey: "key2",
          organizationId: orgId,
          peerId,
          projectId,
          continuationInFlight: true,
          continuationStartedAt: "2026-08-01T10:00:00.000Z",
        },
        campaignPublication: {
          status: "publishing",
          campaignRunId: "crun_recover2",
          updatedAt: "2026-08-01T10:05:00.000Z",
          retryCount: 0,
          idempotencyKey: "pub-key2",
        },
      },
    });

    const updatedProjects: MarketingProject[] = [];
    await recoverCampaignExecutions({
      peerId,
      organizationId: orgId,
      projects: [project],
      deps: {
        peerId,
        organizationId: orgId,
        getProject: () => project,
        getApproval: () => undefined,
        continuationDeps: {
          getOrchestratorInput: () => ({
            projectId,
            workUnits: [],
            strategy: null,
            creativeBriefByCampaignId: {},
          }),
          executeWorkUnit: async () => ({
            ok: false,
            message: "Should not execute brain during recovery",
            workUnit: reviewReadyStrategyUnit(),
          }),
        },
        updateProject: (p) => updatedProjects.push(p),
        logTimelineActivity: () => {},
        publishCampaign: async () => ({ ok: true, message: "Recovered publish" }),
      },
      logTimelineActivity: () => {},
    });

    expect(updatedProjects[0]?.campaignSetup?.campaignPublication?.status).toBe("published");
    expect(updatedProjects[0]?.campaignSetup?.campaignRun?.status).toBe("completed");
  });

  it("orders execution timeline events consistently", () => {
    const correlation = buildCampaignExecutionCorrelation({
      projectId,
      organizationId: orgId,
      campaignRunId: "crun_order",
    });
    const events = [
      createCampaignExecutionTimelineEvent({
        kind: "publication_started",
        correlation,
        at: "2026-08-01T12:00:00.000Z",
      }),
      createCampaignExecutionTimelineEvent({
        kind: "campaign_started",
        correlation,
        at: "2026-08-01T10:00:00.000Z",
      }),
      createCampaignExecutionTimelineEvent({
        kind: "strategy_complete",
        correlation,
        at: "2026-08-01T11:00:00.000Z",
      }),
    ].sort(compareTimelineEvents);

    expect(events[0]?.kind).toBe("campaign_started");
    expect(events[1]?.kind).toBe("strategy_complete");
    expect(events[2]?.kind).toBe("publication_started");
  });

  it("continueCampaignWithExecution is idempotent for duplicate calls", async () => {
    const project = sampleProject();
    const strategyUnit = reviewReadyStrategyUnit();
    const creativeUnit = reviewReadyCreativeUnit();
    let continuationCalls = 0;

    const stableApproval = applyCampaignApproval(
      {
        organizationId: orgId,
        peerId,
        projectId,
        approvalMode: "approval_before_publication",
        packageVersion: computeCampaignPackageVersion({ project }),
        approvedBy: "user-1",
        approvedAt: "2026-08-01T11:00:00.000Z",
      },
      { approvals: {}, history: {} },
      () => undefined
    ).approval!;

    const deps = {
      peerId,
      organizationId: orgId,
      getProject: () => project,
      getApproval: () => stableApproval,
      continuationDeps: {
        getOrchestratorInput: () => ({
          projectId,
          workUnits: [strategyUnit, creativeUnit],
          strategy: null,
          creativeBriefByCampaignId: {},
        }),
        executeWorkUnit: async () => {
          continuationCalls += 1;
          return {
            ok: true,
            workUnit: strategyUnit,
            message: "ok",
          };
        },
      },
      updateProject: () => {},
      logTimelineActivity: () => {},
      shouldPublish: () => true,
      publishCampaign: async () => ({ ok: true, message: "Published" }),
    };

    const first = await continueCampaignWithExecution(projectId, deps);
    const second = await continueCampaignWithExecution(projectId, deps);

    expect(first.ok).toBe(true);
    expect(second.ok).toBe(true);
    expect(continuationCalls).toBeLessThanOrEqual(2);
    expect(second.stopMessage).toMatch(/already completed|published successfully|already published/i);
  });

  it("handles concurrent approval attempts safely", async () => {
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

    const sampleStrategy = {
      summary: "Founder-led.",
      generatedAt: "2026-08-01T10:00:00.000Z",
      positioningRecommendations: [{ recommendation: "Premium peer OS" }],
      contentPillars: [{ name: "Trust" }],
      campaignIdeas: [],
      socialMediaStrategy: [{ platform: "LinkedIn" }],
    } as never;

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
        strategy: sampleStrategy,
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
        }
        if (patch.campaignApprovalHistoryByProjectId) {
          Object.assign(history, patch.campaignApprovalHistoryByProjectId);
        }
      },
      logActivity: vi.fn(),
      createActivity: (
        activityType: import("@/lib/marketing-workspace/experience/types").ActivityType,
        title: string,
        description: string,
        options?: { relatedObject?: string }
      ) => ({
        id: `act-${Math.random()}`,
        timestamp: "2026-08-01T11:00:00.000Z",
        activityType,
        title,
        description,
        relatedObject: options?.relatedObject,
      }),
      continueCampaign,
      approvalActionInFlight: inFlight,
    };

    const [first, second] = await Promise.all([
      approveCampaign(deps, { projectId }),
      (async () => {
        await new Promise((r) => setTimeout(r, 5));
        return approveCampaign(deps, { projectId });
      })(),
    ]);

    expect(first.ok || second.ok).toBe(true);
    expect(continueCampaign.mock.calls.length).toBeLessThanOrEqual(1);
  });

  it("does not duplicate work when runCampaignContinuation has no executable units", async () => {
    const result = await runCampaignContinuation(projectId, {
      getOrchestratorInput: () => ({
        projectId,
        workUnits: [reviewReadyStrategyUnit(), reviewReadyCreativeUnit()],
        strategy: null,
        creativeBriefByCampaignId: {},
      }),
      executeWorkUnit: vi.fn(),
    });

    expect(result.stopReason).toBe("no_executable_work_units");
    expect(result.iterations).toBe(0);
  });
});
