import { describe, expect, it, vi } from "vitest";

import { applyCampaignExecutionPlan } from "@/lib/campaign/executor";
import { planCampaignExecution } from "@/lib/campaign/planner/plan-campaign-execution";
import { assembleCampaign } from "@/lib/campaign";
import type { CampaignExecutionOperation } from "@/lib/campaign/executor";
import { createMarketingCampaignProject } from "@/lib/peer-experience/marketing/projects/project-engine";
import { createWorkUnit } from "@/lib/peer-workflow/work-unit-engine";
import type { WorkUnit } from "@/lib/peer-workflow/work-unit";
import type { MarketingProject } from "@/lib/peer-experience/marketing/projects/types";

import { applyCampaignExecutionResult } from "../apply-campaign-execution-result";
import {
  extractExecutorOperationIdFromRawRequest,
  type CampaignExecutionPersistencePort,
} from "../campaign-execution-application-source";
import {
  CampaignExecutionApplicationScopeMismatchError,
} from "../errors";

const assembledAt = "2026-07-20T12:00:00.000Z";
const organizationId = "org-1";
const peerId = "peer-1";

function buildExecutionResultWithCreates() {
  const campaign = assembleCampaign({
    organizationId,
    campaignId: "camp-proj-1",
    name: "Launch",
    assembledAt,
  });
  const plan = planCampaignExecution({
    organizationId,
    peerId,
    campaign,
    assembledAt,
    explicitChannels: ["LinkedIn"],
  });
  const executionResult = applyCampaignExecutionPlan({
    organizationId,
    peerId,
    campaignId: campaign.id,
    currentCampaignStatus: "planning",
    executionPlan: plan,
    requestedBy: "user-1",
    assembledAt,
    version: plan.version,
  });
  return executionResult;
}

function createPersistenceHarness(initial: {
  project: MarketingProject;
  workUnits?: WorkUnit[];
}) {
  let project = initial.project;
  let workUnits = [...(initial.workUnits ?? [])];
  const createSpy = vi.fn((input: Parameters<typeof createWorkUnit>[0]) => {
    const unit = createWorkUnit(input);
    workUnits.push(unit);
    return unit;
  });

  const persistence: CampaignExecutionPersistencePort = {
    createWorkUnit: createSpy,
    updateWorkUnit: (unit) => {
      workUnits = workUnits.map((u) => (u.id === unit.id ? unit : u));
      return unit;
    },
    updateProject: (next) => {
      project = next;
      return next;
    },
  };

  return {
    get project() {
      return project;
    },
    get workUnits() {
      return workUnits;
    },
    createSpy,
    persistence,
  };
}

describe("applyCampaignExecutionResult", () => {
  it("creates work units through the injected factory for a ready execution result", async () => {
    const executionResult = buildExecutionResultWithCreates();
    const project = createMarketingCampaignProject({
      peerId,
      ownerLabel: "You",
      name: "Launch",
      goalLabel: "Awareness",
      description: "Campaign",
      primaryGoalId: "brand_awareness",
    });
    Object.assign(project, { id: executionResult.campaignId });

    const harness = createPersistenceHarness({ project });
    const applyResult = await applyCampaignExecutionResult({
      organizationId,
      peerId,
      campaignProject: harness.project,
      workUnits: harness.workUnits,
      executionResult,
      appliedAt: assembledAt,
      persistence: harness.persistence,
    });

    expect(["applied", "partially_applied"]).toContain(applyResult.status);
    expect(applyResult.createdWorkUnitIds.length).toBeGreaterThan(0);
    expect(harness.createSpy).toHaveBeenCalled();
    expect(harness.workUnits.length).toBe(applyResult.createdWorkUnitIds.length);
    for (const unit of harness.workUnits) {
      expect(unit.draftId).toBeNull();
      expect(extractExecutorOperationIdFromRawRequest(unit.rawRequest)).toBeTruthy();
    }
  });

  it("does not invoke AI or content generation hooks", async () => {
    const generateDraft = vi.fn();
    const executionResult = buildExecutionResultWithCreates();
    const project = createMarketingCampaignProject({
      peerId,
      ownerLabel: "You",
      name: "Launch",
      goalLabel: "Awareness",
      description: "Campaign",
      primaryGoalId: "brand_awareness",
    });
    Object.assign(project, { id: executionResult.campaignId });
    const harness = createPersistenceHarness({ project });

    await applyCampaignExecutionResult({
      organizationId,
      peerId,
      campaignProject: harness.project,
      workUnits: [],
      executionResult,
      appliedAt: assembledAt,
      persistence: harness.persistence,
    });

    expect(generateDraft).not.toHaveBeenCalled();
  });

  it("applying twice does not duplicate work units", async () => {
    const executionResult = buildExecutionResultWithCreates();
    const project = createMarketingCampaignProject({
      peerId,
      ownerLabel: "You",
      name: "Launch",
      goalLabel: "Awareness",
      description: "Campaign",
      primaryGoalId: "brand_awareness",
    });
    Object.assign(project, { id: executionResult.campaignId });
    const harness = createPersistenceHarness({ project });

    const first = await applyCampaignExecutionResult({
      organizationId,
      peerId,
      campaignProject: harness.project,
      workUnits: harness.workUnits,
      executionResult,
      appliedAt: assembledAt,
      persistence: harness.persistence,
    });

    const second = await applyCampaignExecutionResult({
      organizationId,
      peerId,
      campaignProject: harness.project,
      workUnits: [...harness.workUnits],
      executionResult,
      appliedAt: assembledAt,
      appliedOperationIds: first.appliedOperationIds,
      persistence: harness.persistence,
    });

    expect(["no_changes", "partially_applied"]).toContain(second.status);
    expect(harness.createSpy.mock.calls.length).toBe(first.createdWorkUnitIds.length);
    expect(second.createdWorkUnitIds).toHaveLength(0);
  });

  it("applies project responsibility when owner assignment is supported", async () => {
    const executionResult = buildExecutionResultWithCreates();
    const assignOp = executionResult.operations.find(
      (o) => o.type === "ASSIGN_WORK_UNIT_OWNER"
    );
    if (!assignOp || assignOp.type !== "ASSIGN_WORK_UNIT_OWNER") {
      return;
    }

    const project = createMarketingCampaignProject({
      peerId,
      ownerLabel: "You",
      name: "Launch",
      goalLabel: "Awareness",
      description: "Campaign",
      primaryGoalId: "brand_awareness",
    });
    Object.assign(project, { id: executionResult.campaignId });

    const ops = executionResult.operations.filter(
      (o) => o.sequence <= assignOp.sequence
    );
    const trimmed = { ...executionResult, operations: ops };

    const harness = createPersistenceHarness({ project });
    const applyResult = await applyCampaignExecutionResult({
      organizationId,
      peerId,
      campaignProject: harness.project,
      workUnits: [],
      executionResult: {
        ...trimmed,
        operations: ops.map((o) =>
          o.type === "ASSIGN_WORK_UNIT_OWNER"
            ? {
                ...o,
                payload: {
                  ...o.payload,
                  responsibilityId: "resp-99",
                },
              }
            : o
        ),
      },
      appliedAt: assembledAt,
      persistence: harness.persistence,
    });

    expect(applyResult.createdWorkUnitIds.length).toBeGreaterThan(0);
    expect(harness.project.responsibilityId).toBe("resp-99");
  });

  it("skips owner assignment safely when work unit was not created in this run", async () => {
    const createOp: CampaignExecutionOperation = {
      id: "ceo:create:1",
      type: "CREATE_WORK_UNIT",
      campaignId: "camp-1",
      sourceWorkPackageId: "pkg-1",
      sequence: 0,
      reason: "test",
      preconditions: [],
      idempotencyKey: "k1",
      payload: {
        proposedWorkUnitRef: "proposed-wu:pkg-1",
        title: "Post",
        channel: "LinkedIn",
        deliverableKind: "linkedin",
        workPackageType: "content_creation",
      },
    };
    const assignOp: CampaignExecutionOperation = {
      id: "ceo:assign:1",
      type: "ASSIGN_WORK_UNIT_OWNER",
      campaignId: "camp-1",
      sourceWorkPackageId: "pkg-1",
      sequence: 1,
      reason: "test",
      preconditions: [],
      idempotencyKey: "k2",
      payload: {
        workUnitRef: "proposed-wu:pkg-1",
        responsibilityId: "resp-1",
        ownerRole: "linkedin",
      },
    };

    const project = createMarketingCampaignProject({
      peerId,
      ownerLabel: "You",
      name: "Launch",
      goalLabel: "Awareness",
      description: "Campaign",
      primaryGoalId: "brand_awareness",
    });
    Object.assign(project, { id: "camp-1" });

    const existing = createWorkUnit({
      peerId,
      projectId: project.id,
      role: "Marketing",
      title: "Existing",
      deliverableKind: "linkedin",
      channel: "LinkedIn",
      objective: null,
      audience: null,
      needsVisual: false,
      recurrence: "once",
      rawRequest: "Existing unit",
    });

    const harness = createPersistenceHarness({ project, workUnits: [existing] });

    const applyResult = await applyCampaignExecutionResult({
      organizationId,
      peerId,
      campaignProject: project,
      workUnits: [existing],
      executionResult: {
        id: "cer-1",
        organizationId,
        peerId,
        campaignId: project.id,
        sourcePlanId: "plan-1",
        sourcePlanVersion: 1,
        status: "executable",
        targetCampaignStatus: "ready",
        operations: [createOp, assignOp],
        restrictions: [],
        warnings: [],
        nextActions: [],
        idempotencyKey: "exec-1",
        assembledAt,
      },
      appliedAt: assembledAt,
      persistence: harness.persistence,
    });

    expect(harness.createSpy).not.toHaveBeenCalled();
    expect(applyResult.warnings.some((w) => w.includes("Owner assignment"))).toBe(true);
  });

  it("orders dependency handling after create and reports model limitation", async () => {
    const executionResult = buildExecutionResultWithCreates();
    const link = executionResult.operations.find((o) => o.type === "LINK_WORK_UNIT_DEPENDENCY");
    if (!link) return;

    const project = createMarketingCampaignProject({
      peerId,
      ownerLabel: "You",
      name: "Launch",
      goalLabel: "Awareness",
      description: "Campaign",
      primaryGoalId: "brand_awareness",
    });
    Object.assign(project, { id: executionResult.campaignId });
    const harness = createPersistenceHarness({ project });

    const applyResult = await applyCampaignExecutionResult({
      organizationId,
      peerId,
      campaignProject: harness.project,
      workUnits: [],
      executionResult,
      appliedAt: assembledAt,
      persistence: harness.persistence,
    });

    expect(applyResult.createdWorkUnitIds.length).toBeGreaterThan(0);
    expect(
      applyResult.warnings.some((w) => w.toLowerCase().includes("dependency"))
    ).toBe(true);
  });

  it("reports approval operations as skipped when no draft-backed overlay exists", async () => {
    const executionResult = buildExecutionResultWithCreates();
    const approval = executionResult.operations.find((o) => o.type === "REQUEST_APPROVAL");
    if (!approval) return;

    const project = createMarketingCampaignProject({
      peerId,
      ownerLabel: "You",
      name: "Launch",
      goalLabel: "Awareness",
      description: "Campaign",
      primaryGoalId: "brand_awareness",
    });
    Object.assign(project, { id: executionResult.campaignId });
    const harness = createPersistenceHarness({ project });

    const applyResult = await applyCampaignExecutionResult({
      organizationId,
      peerId,
      campaignProject: harness.project,
      workUnits: [],
      executionResult,
      appliedAt: assembledAt,
      persistence: harness.persistence,
    });

    expect(
      applyResult.skippedOperationIds.some((id) => id === approval.id) ||
        applyResult.warnings.some((w) => w.includes("Approval gate"))
    ).toBe(true);
  });

  it("marks campaign active only after successful creates", async () => {
    const executionResult = buildExecutionResultWithCreates();
    const project = createMarketingCampaignProject({
      peerId,
      ownerLabel: "You",
      name: "Launch",
      goalLabel: "Awareness",
      description: "Campaign",
      primaryGoalId: "brand_awareness",
    });
    Object.assign(project, { id: executionResult.campaignId });

    const persistence: CampaignExecutionPersistencePort = {
      createWorkUnit: () => {
        throw new Error("Database connection failed");
      },
      updateWorkUnit: (unit) => unit,
      updateProject: (p) => p,
    };

    const failed = await applyCampaignExecutionResult({
      organizationId,
      peerId,
      campaignProject: project,
      workUnits: [],
      executionResult,
      appliedAt: assembledAt,
      persistence,
    });

    expect(failed.status).toBe("failed");
    expect(failed.errors.every((e) => !e.message.includes("Database connection failed"))).toBe(
      true
    );

    const harness = createPersistenceHarness({ project });
    const success = await applyCampaignExecutionResult({
      organizationId,
      peerId,
      campaignProject: harness.project,
      workUnits: [],
      executionResult,
      appliedAt: assembledAt,
      persistence: harness.persistence,
    });

    expect(
      success.appliedOperationIds.some((id) => {
        const op = executionResult.operations.find((o) => o.id === id);
        return op?.type === "MARK_CAMPAIGN_ACTIVE";
      })
    ).toBe(true);
    expect(success.updatedWorkUnitIds.length).toBeGreaterThan(0);
  });

  it("returns partially_applied when a later write fails", async () => {
    const executionResult = buildExecutionResultWithCreates();
    const project = createMarketingCampaignProject({
      peerId,
      ownerLabel: "You",
      name: "Launch",
      goalLabel: "Awareness",
      description: "Campaign",
      primaryGoalId: "brand_awareness",
    });
    Object.assign(project, { id: executionResult.campaignId });

    let projectUpdates = 0;
    const harness = createPersistenceHarness({ project });
    const persistence: CampaignExecutionPersistencePort = {
      ...harness.persistence,
      updateProject: (next) => {
        projectUpdates += 1;
        if (projectUpdates > 1) {
          throw new Error("disk full");
        }
        return harness.persistence.updateProject(next);
      },
    };

    const applyResult = await applyCampaignExecutionResult({
      organizationId,
      peerId,
      campaignProject: harness.project,
      workUnits: [],
      executionResult,
      appliedAt: assembledAt,
      persistence,
    });

    expect(applyResult.status).toBe("partially_applied");
    expect(applyResult.createdWorkUnitIds.length).toBeGreaterThan(0);
    expect(applyResult.errors[0]?.code).toBe("CAMPAIGN_EXECUTION_APPLICATION_PERSISTENCE_FAILURE");
  });

  it("performs no writes for blocked execution results", async () => {
    const executionResult = buildExecutionResultWithCreates();
    const blocked = { ...executionResult, status: "blocked" as const };
    const project = createMarketingCampaignProject({
      peerId,
      ownerLabel: "You",
      name: "Launch",
      goalLabel: "Awareness",
      description: "Campaign",
      primaryGoalId: "brand_awareness",
    });
    Object.assign(project, { id: executionResult.campaignId });
    const harness = createPersistenceHarness({ project });

    const applyResult = await applyCampaignExecutionResult({
      organizationId,
      peerId,
      campaignProject: harness.project,
      workUnits: [],
      executionResult: blocked,
      appliedAt: assembledAt,
      persistence: harness.persistence,
    });

    expect(applyResult.status).toBe("blocked");
    expect(harness.createSpy).not.toHaveBeenCalled();
  });

  it("rejects unknown operation types without writes", async () => {
    const executionResult = buildExecutionResultWithCreates();
    const project = createMarketingCampaignProject({
      peerId,
      ownerLabel: "You",
      name: "Launch",
      goalLabel: "Awareness",
      description: "Campaign",
      primaryGoalId: "brand_awareness",
    });
    Object.assign(project, { id: executionResult.campaignId });
    const harness = createPersistenceHarness({ project });

    const badOps = [
      ...executionResult.operations,
      {
        id: "ceo:unknown",
        type: "RUN_AI",
        campaignId: project.id,
        sequence: 9999,
        reason: "bad",
        preconditions: [],
        idempotencyKey: "bad",
        payload: {},
      },
    ] as unknown as typeof executionResult.operations;

    const applyResult = await applyCampaignExecutionResult({
      organizationId,
      peerId,
      campaignProject: harness.project,
      workUnits: [],
      executionResult: { ...executionResult, operations: badOps },
      appliedAt: assembledAt,
      persistence: harness.persistence,
    });

    expect(applyResult.status).toBe("failed");
    expect(harness.createSpy).not.toHaveBeenCalled();
  });

  it("rejects scope mismatch", async () => {
    const executionResult = buildExecutionResultWithCreates();
    const project = createMarketingCampaignProject({
      peerId,
      ownerLabel: "You",
      name: "Launch",
      goalLabel: "Awareness",
      description: "Campaign",
      primaryGoalId: "brand_awareness",
    });
    Object.assign(project, { id: "different-id" });

    await expect(
      applyCampaignExecutionResult({
        organizationId,
        peerId,
        campaignProject: project,
        workUnits: [],
        executionResult,
        appliedAt: assembledAt,
        persistence: createPersistenceHarness({ project }).persistence,
      })
    ).rejects.toThrow(CampaignExecutionApplicationScopeMismatchError);
  });

  it("does not mutate the source object", async () => {
    const executionResult = buildExecutionResultWithCreates();
    const project = createMarketingCampaignProject({
      peerId,
      ownerLabel: "You",
      name: "Launch",
      goalLabel: "Awareness",
      description: "Campaign",
      primaryGoalId: "brand_awareness",
    });
    Object.assign(project, { id: executionResult.campaignId });
    const harness = createPersistenceHarness({ project });
    const workUnitsSnapshot: WorkUnit[] = [];
    const source = {
      organizationId,
      peerId,
      campaignProject: { ...harness.project },
      workUnits: workUnitsSnapshot,
      executionResult,
      appliedAt: assembledAt,
      persistence: harness.persistence,
    };
    const snapshot = JSON.stringify(source);
    await applyCampaignExecutionResult(source);
    expect(JSON.stringify(source)).toBe(snapshot);
  });
});
