import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { assembleCampaign } from "@/lib/campaign";
import { planCampaignExecution } from "@/lib/campaign/planner/plan-campaign-execution";
import type {
  CampaignExecutionPlan,
  CampaignPlannerSource,
  CampaignWorkPackage,
} from "@/lib/campaign/planner/types";

import { applyCampaignExecutionPlan } from "../apply-campaign-execution-plan";
import {
  CampaignExecutorInvalidCampaignIdError,
  CampaignExecutorInvalidOrganizationIdError,
  CampaignExecutorInvalidPeerIdError,
  CampaignExecutorPlanCampaignMismatchError,
  CampaignExecutorPlanOrganizationMismatchError,
  CampaignExecutorUnsafeManualOnlyExecutionError,
} from "../errors";
import { CAMPAIGN_EXECUTOR_EXCLUDED_CONCERNS } from "../ownership";
import type { CampaignExecutorSource } from "../types";

const assembledAt = "2026-07-20T12:00:00.000Z";
const __dirname = dirname(fileURLToPath(import.meta.url));

function plannerSource(overrides: Partial<CampaignPlannerSource> = {}): CampaignPlannerSource {
  const campaign = assembleCampaign({
    organizationId: "org-1",
    campaignId: "camp-1",
    name: "Test campaign",
    assembledAt,
  });
  return {
    organizationId: "org-1",
    peerId: "peer-1",
    campaign,
    assembledAt,
    ...overrides,
  };
}

function executorSource(
  plannerOverrides: Partial<CampaignPlannerSource> = {},
  executorOverrides: Partial<CampaignExecutorSource> = {}
): CampaignExecutorSource {
  const ps = plannerSource(plannerOverrides);
  const plan = planCampaignExecution(ps);
  return {
    organizationId: ps.organizationId,
    peerId: ps.peerId,
    campaignId: plan.campaignId,
    currentCampaignStatus: "planning",
    executionPlan: plan,
    existingWorkUnits: ps.existingWorkUnits,
    responsibilities: ps.responsibilities,
    requestedBy: "user-1",
    assembledAt,
    version: plan.version,
    ...executorOverrides,
  };
}

function basePackage(overrides: Partial<CampaignWorkPackage> & Pick<CampaignWorkPackage, "id">): CampaignWorkPackage {
  return {
    type: "content_creation",
    title: "Content",
    description: "Desc",
    status: "proposed",
    priority: 1,
    phase: "production",
    dependencies: [],
    recommendedOwner: { role: "content_creator" },
    estimatedEffort: "medium",
    approvalRequirement: { required: false },
    sourceReferences: [],
    blockers: [],
    completionCriteria: "Done",
    channel: "LinkedIn",
    deliverableType: "linkedin_post",
    ...overrides,
  };
}

function minimalPlan(
  status: CampaignExecutionPlan["status"],
  packages: CampaignWorkPackage[],
  extra: Partial<CampaignExecutionPlan> = {}
): CampaignExecutionPlan {
  const ids = packages.map((p) => p.id);
  return {
    id: "cep-camp-1-v1",
    campaignId: "camp-1",
    organizationId: "org-1",
    version: 1,
    status,
    objective: "Objective",
    workPackages: packages,
    executionOrder: ids,
    approvals: [],
    gaps: [],
    evidence: [],
    assembledAt,
    ...extra,
  };
}

describe("applyCampaignExecutionPlan", () => {
  it("ready plan produces ordered create operations following execution order", () => {
    const source = executorSource({ explicitChannels: ["LinkedIn"] });
    const result = applyCampaignExecutionPlan(source);
    expect(result.status).toBe("executable");
    const creates = result.operations.filter((o) => o.type === "CREATE_WORK_UNIT");
    expect(creates.length).toBeGreaterThan(0);
    const sequences = creates.map((o) => o.sequence);
    expect(sequences).toEqual([...sequences].sort((a, b) => a - b));
    const orderIndex = new Map(source.executionPlan.executionOrder.map((id, i) => [id, i]));
    for (let i = 1; i < creates.length; i++) {
      const prev = orderIndex.get(creates[i - 1]!.sourceWorkPackageId!) ?? 0;
      const curr = orderIndex.get(creates[i]!.sourceWorkPackageId!) ?? 0;
      expect(curr).toBeGreaterThanOrEqual(prev);
    }
  });

  it("draft plan remains restricted with no executable work operations", () => {
    const source = executorSource();
    expect(source.executionPlan.status).toBe("draft");
    const result = applyCampaignExecutionPlan(source);
    expect(result.status).toBe("restricted");
    expect(result.targetCampaignStatus).toBe("planning");
    expect(result.operations.some((o) => o.type === "CREATE_WORK_UNIT")).toBe(false);
    expect(result.operations.some((o) => o.type === "MARK_CAMPAIGN_ACTIVE")).toBe(false);
  });

  it("blocked plan produces no executable work operations", () => {
    const source = executorSource({
      explicitChannels: ["LinkedIn"],
      decisionSummary: {
        id: "dec-block",
        status: "blocked",
        canExecute: false,
        canGenerateCreative: false,
        blockedReasons: ["Paid spend disabled."],
      },
    });
    const result = applyCampaignExecutionPlan(source);
    expect(result.status).toBe("blocked");
    expect(result.targetCampaignStatus).toBe("blocked");
    expect(result.operations.filter((o) => o.type === "CREATE_WORK_UNIT")).toHaveLength(0);
  });

  it("restricted plan preserves approval operations", () => {
    const source = executorSource({
      explicitDeliverables: [{ channel: "LinkedIn", deliverableType: "linkedin_post" }],
      decisionSummary: {
        id: "dec-restrict",
        status: "restricted",
        canExecute: true,
        canGenerateCreative: false,
        approvalMode: "approval_before_generation",
        brandReviewRequired: true,
      },
    });
    const result = applyCampaignExecutionPlan(source);
    expect(result.status).toBe("restricted");
    const approvals = result.operations.filter((o) => o.type === "REQUEST_APPROVAL");
    expect(approvals.length).toBeGreaterThan(0);
    expect(
      approvals.some((o) => o.payload.approvalGate === "before_generation")
    ).toBe(true);
  });

  it("skips satisfied packages", () => {
    const plan = minimalPlan("ready", [
      basePackage({ id: "pkg-satisfied", status: "satisfied", matchedWorkUnitId: "wu-done" }),
    ]);
    const result = applyCampaignExecutionPlan({
      organizationId: "org-1",
      peerId: "peer-1",
      campaignId: "camp-1",
      currentCampaignStatus: "planning",
      executionPlan: plan,
      requestedBy: "user-1",
      assembledAt,
      version: 1,
    });
    expect(result.operations.filter((o) => o.type === "CREATE_WORK_UNIT")).toHaveLength(0);
  });

  it("does not recreate work units matched on existing packages", () => {
    const source = executorSource({
      explicitDeliverables: [{ channel: "LinkedIn", deliverableType: "linkedin_post", title: "Post A" }],
      existingWorkUnits: [
        {
          id: "wu-1",
          projectId: "camp-1",
          title: "Post A",
          channel: "LinkedIn",
          deliverableKind: "linkedin_post",
          lifecycleStage: "creating",
        },
      ],
    });
    const contentPkg = source.executionPlan.workPackages.find((p) => p.type === "content_creation")!;
    expect(contentPkg.matchedWorkUnitId).toBe("wu-1");
    const result = applyCampaignExecutionPlan(source);
    const contentCreates = result.operations.filter(
      (o) => o.type === "CREATE_WORK_UNIT" && o.sourceWorkPackageId === contentPkg.id
    );
    expect(contentCreates).toHaveLength(0);
  });

  it("emits one CREATE_WORK_UNIT per concrete deliverable without generic channel duplicates", () => {
    const source = executorSource({
      explicitChannels: ["LinkedIn", "Email"],
      explicitDeliverables: [
        { channel: "LinkedIn", deliverableType: "social_post", title: "Social post — LinkedIn" },
        { channel: "Email", deliverableType: "email", title: "Email — Email" },
      ],
    });
    const contentPkgIds = new Set(
      source.executionPlan.workPackages
        .filter((p) => p.type === "content_creation")
        .map((p) => p.id)
    );
    expect(contentPkgIds.size).toBe(2);
    const result = applyCampaignExecutionPlan(source);
    const creates = result.operations.filter(
      (o) =>
        o.type === "CREATE_WORK_UNIT" &&
        o.sourceWorkPackageId != null &&
        contentPkgIds.has(o.sourceWorkPackageId)
    );
    expect(creates).toHaveLength(2);
    const titles = creates.map((o) => (o.type === "CREATE_WORK_UNIT" ? o.payload.title : ""));
    expect(titles).not.toContain("LinkedIn deliverable");
    expect(titles).not.toContain("Email deliverable");
  });

  it("rerun stays idempotent without duplicate creates for concrete deliverables", () => {
    const base = executorSource({
      explicitChannels: ["LinkedIn", "Email"],
      explicitDeliverables: [
        { channel: "LinkedIn", deliverableType: "social_post", title: "Social post — LinkedIn" },
        { channel: "Email", deliverableType: "email", title: "Email — Email" },
      ],
    });
    const first = applyCampaignExecutionPlan(base);
    const second = applyCampaignExecutionPlan(base);
    const contentPkgIds = new Set(
      base.executionPlan.workPackages
        .filter((p) => p.type === "content_creation")
        .map((p) => p.id)
    );
    const contentCreates = (ops: typeof first.operations) =>
      ops.filter(
        (o) =>
          o.type === "CREATE_WORK_UNIT" &&
          o.sourceWorkPackageId != null &&
          contentPkgIds.has(o.sourceWorkPackageId)
      );
    expect(contentCreates(first.operations)).toHaveLength(2);
    expect(contentCreates(second.operations)).toHaveLength(2);
    expect(first.operations.map((o) => o.id)).toEqual(second.operations.map((o) => o.id));
  });

  it("preserves in-progress matched work units without recreate", () => {
    const source = executorSource({
      explicitDeliverables: [{ channel: "LinkedIn", deliverableType: "linkedin_post" }],
      existingWorkUnits: [
        {
          id: "wu-progress",
          title: "In progress",
          channel: "LinkedIn",
          deliverableKind: "linkedin_post",
          lifecycleStage: "creating",
        },
      ],
    });
    const pkg = source.executionPlan.workPackages.find((p) => p.type === "content_creation")!;
    expect(pkg.status).toBe("in_progress");
    const result = applyCampaignExecutionPlan(source);
    expect(
      result.operations.some(
        (o) => o.type === "CREATE_WORK_UNIT" && o.sourceWorkPackageId === pkg.id
      )
    ).toBe(false);
  });

  it("links dependencies after create operations", () => {
    const source = executorSource({
      explicitChannels: ["LinkedIn"],
      planSummary: {
        summary: "Plan",
        confidence: "high",
        contentCalendar: [
          { title: "LinkedIn post", contentType: "linkedin_post", channel: "LinkedIn" },
        ],
      },
    });
    const result = applyCampaignExecutionPlan(source);
    const links = result.operations.filter((o) => o.type === "LINK_WORK_UNIT_DEPENDENCY");
    if (links.length === 0) return;
    const maxCreateSeq = Math.max(
      ...result.operations.filter((o) => o.type === "CREATE_WORK_UNIT").map((o) => o.sequence),
      -1
    );
    for (const link of links) {
      expect(link.sequence).toBeGreaterThan(maxCreateSeq);
    }
  });

  it("does not fabricate peer ids in owner assignment", () => {
    const source = executorSource({
      explicitDeliverables: [{ channel: "LinkedIn", deliverableType: "linkedin_post" }],
      responsibilities: [
        {
          id: "resp-1",
          category: "linkedin",
          enabled: true,
          approvalPolicy: "approval_before_publication",
          autonomyLevel: "supervised",
        },
      ],
    });
    const result = applyCampaignExecutionPlan(source);
    const assigns = result.operations.filter((o) => o.type === "ASSIGN_WORK_UNIT_OWNER");
    expect(assigns.length).toBeGreaterThan(0);
    for (const op of assigns) {
      expect(op.payload.responsibilityId).toBe("resp-1");
      expect(JSON.stringify(op.payload)).not.toMatch(/peer-/);
    }
  });

  it("enabled matching responsibility creates owner assignment", () => {
    const source = executorSource({
      explicitDeliverables: [{ channel: "LinkedIn", deliverableType: "linkedin_post" }],
      responsibilities: [
        { id: "resp-li", category: "linkedin", enabled: true, autonomyLevel: "supervised" },
      ],
    });
    const result = applyCampaignExecutionPlan(source);
    expect(
      result.operations.some(
        (o) =>
          o.type === "ASSIGN_WORK_UNIT_OWNER" &&
          o.payload.responsibilityId === "resp-li"
      )
    ).toBe(true);
  });

  it("disabled responsibility does not create owner assignment", () => {
    const source = executorSource({
      explicitDeliverables: [{ channel: "LinkedIn", deliverableType: "linkedin_post" }],
      responsibilities: [{ id: "resp-off", category: "linkedin", enabled: false }],
    });
    const result = applyCampaignExecutionPlan(source);
    expect(result.operations.some((o) => o.type === "ASSIGN_WORK_UNIT_OWNER")).toBe(false);
    expect(result.warnings.some((w) => w.includes("owner not assigned"))).toBe(true);
  });

  it("manual-only policy blocks autonomous execution", () => {
    const source = executorSource({
      explicitDeliverables: [{ channel: "LinkedIn", deliverableType: "linkedin_post" }],
      decisionSummary: {
        id: "dec-manual",
        status: "restricted",
        canExecute: true,
        canGenerateCreative: true,
        approvalMode: "blocked_manual_only",
      },
    });
    const result = applyCampaignExecutionPlan(source);
    expect(result.status).toBe("restricted");
    expect(result.operations.filter((o) => o.type === "CREATE_WORK_UNIT")).toHaveLength(0);
    expect(result.restrictions.some((r) => r.code === "manual_only_policy")).toBe(true);
  });

  it("throws when ready plan contradicts manual-only packages", () => {
    const badPlan = minimalPlan(
      "ready",
      [
        basePackage({
          id: "pkg-manual",
          approvalRequirement: { required: true, mode: "blocked_manual_only" },
        }),
      ],
      {
        approvals: [
          {
            packageId: "pkg-manual",
            gate: "manual_only",
            description: "Manual only",
          },
        ],
      }
    );
    expect(() =>
      applyCampaignExecutionPlan({
        organizationId: "org-1",
        peerId: "peer-1",
        campaignId: "camp-1",
        currentCampaignStatus: "planning",
        executionPlan: badPlan,
        requestedBy: "user-1",
        assembledAt,
        version: 1,
      })
    ).toThrow(CampaignExecutorUnsafeManualOnlyExecutionError);
  });

  it("proposes campaign active only when executable work exists", () => {
    const withWork = applyCampaignExecutionPlan(
      executorSource({ explicitChannels: ["LinkedIn"] })
    );
    expect(withWork.operations.some((o) => o.type === "MARK_CAMPAIGN_ACTIVE")).toBe(true);

    const noWork = applyCampaignExecutionPlan({
      organizationId: "org-1",
      peerId: "peer-1",
      campaignId: "camp-1",
      currentCampaignStatus: "planning",
      executionPlan: minimalPlan("ready", [
        basePackage({
          id: "pkg-done",
          status: "satisfied",
          matchedWorkUnitId: "wu-1",
        }),
      ]),
      existingWorkUnits: [
        {
          id: "wu-1",
          title: "Post",
          channel: "LinkedIn",
          deliverableKind: "linkedin_post",
          lifecycleStage: "published",
        },
      ],
      requestedBy: "user-1",
      assembledAt,
      version: 1,
    });
    expect(noWork.operations.some((o) => o.type === "MARK_CAMPAIGN_ACTIVE")).toBe(false);
    expect(noWork.operations.some((o) => o.type === "CREATE_WORK_UNIT")).toBe(false);
  });

  it("returns no_changes when all planned work already exists", () => {
    const plan = minimalPlan("ready", [
      basePackage({
        id: "pkg-done",
        status: "satisfied",
        matchedWorkUnitId: "wu-existing",
      }),
    ]);
    const result = applyCampaignExecutionPlan({
      organizationId: "org-1",
      peerId: "peer-1",
      campaignId: "camp-1",
      currentCampaignStatus: "planning",
      executionPlan: plan,
      existingWorkUnits: [
        {
          id: "wu-existing",
          title: "Post",
          channel: "LinkedIn",
          deliverableKind: "linkedin_post",
          lifecycleStage: "published",
        },
      ],
      requestedBy: "user-1",
      assembledAt,
      version: 1,
    });
    expect(result.status).toBe("no_changes");
    expect(result.operations).toHaveLength(0);
  });

  it("is deterministic and idempotent for identical input", () => {
    const source = executorSource({ explicitChannels: ["LinkedIn"] });
    const a = applyCampaignExecutionPlan(source);
    const b = applyCampaignExecutionPlan(source);
    expect(a).toEqual(b);
  });

  it("does not mutate the source object", () => {
    const source = executorSource({ explicitChannels: ["LinkedIn"] });
    const snapshot = JSON.stringify(source);
    applyCampaignExecutionPlan(source);
    expect(JSON.stringify(source)).toBe(snapshot);
  });

  it("throws typed errors on scope mismatch", () => {
    const base = executorSource({ explicitChannels: ["LinkedIn"] });
    expect(() =>
      applyCampaignExecutionPlan({ ...base, organizationId: "" })
    ).toThrow(CampaignExecutorInvalidOrganizationIdError);
    expect(() => applyCampaignExecutionPlan({ ...base, peerId: "" })).toThrow(
      CampaignExecutorInvalidPeerIdError
    );
    expect(() => applyCampaignExecutionPlan({ ...base, campaignId: "" })).toThrow(
      CampaignExecutorInvalidCampaignIdError
    );
    expect(() =>
      applyCampaignExecutionPlan({ ...base, campaignId: "other-campaign" })
    ).toThrow(CampaignExecutorPlanCampaignMismatchError);
    expect(() =>
      applyCampaignExecutionPlan({
        ...base,
        organizationId: "org-other",
        executionPlan: {
          ...base.executionPlan,
          organizationId: "org-1",
        },
      })
    ).toThrow(CampaignExecutorPlanOrganizationMismatchError);
  });

  it("assigns unique operation ids", () => {
    const result = applyCampaignExecutionPlan(executorSource({ explicitChannels: ["LinkedIn"] }));
    const ids = result.operations.map((o) => o.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("module stays free of persistence, AI, hooks, and framework coupling", () => {
    const root = join(__dirname, "..");
    const executorCore = readFileSync(join(root, "apply-campaign-execution-plan.ts"), "utf8");
    expect(executorCore).not.toMatch(/from ["']@\/lib\/supabase/);
    expect(executorCore).not.toMatch(/from ["']react/);
    expect(executorCore).not.toMatch(/\bcreateWorkUnit\b|\buseEffect\b|openai|prompt-builder/i);
    expect(CAMPAIGN_EXECUTOR_EXCLUDED_CONCERNS).toContain("sessionStorage");
  });
});
