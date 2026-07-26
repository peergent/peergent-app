/**
 * Pure Campaign Executor — produces proposed operations only.
 * Side effects (Work Unit creation, persistence) are applied by a later adapter.
 */
import type { CampaignStatus } from "@/lib/campaign/types/campaign";
import type {
  CampaignExecutionPlan,
  CampaignWorkPackage,
} from "@/lib/campaign/planner/types/campaign-execution-plan";

import {
  CampaignExecutorContradictoryCampaignStatusError,
  CampaignExecutorDuplicateOperationIdError,
  CampaignExecutorInvalidCampaignIdError,
  CampaignExecutorInvalidExecutionOrderError,
  CampaignExecutorInvalidOrganizationIdError,
  CampaignExecutorInvalidPeerIdError,
  CampaignExecutorMissingDependencyPackageError,
  CampaignExecutorPlanCampaignMismatchError,
  CampaignExecutorPlanOrganizationMismatchError,
  CampaignExecutorUnsafeManualOnlyExecutionError,
} from "./errors";
import type { CampaignExecutorSource } from "./types/campaign-executor-source";
import type {
  CampaignExecutionOperation,
  CampaignExecutionOperationPrecondition,
} from "./types/campaign-execution-operation";
import type {
  CampaignExecutionNextAction,
  CampaignExecutionRestriction,
  CampaignExecutionResult,
  CampaignExecutionResultStatus,
} from "./types/campaign-execution-result";

const EXECUTABLE_PACKAGE_TYPES = new Set<CampaignWorkPackage["type"]>([
  "research",
  "positioning",
  "audience_definition",
  "campaign_strategy",
  "campaign_plan",
  "creative_direction",
  "content_creation",
  "design",
  "review",
  "publication",
  "performance_monitoring",
  "learning",
]);

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

function operationId(
  campaignId: string,
  planVersion: number,
  type: string,
  suffix: string,
  idempotencyKey: string
): string {
  return `ceo:${campaignId}:v${planVersion}:${type}:${suffix}:${idempotencyKey}`;
}

function opKey(
  campaignId: string,
  planVersion: number,
  type: string,
  suffix: string,
  idempotencyKey: string
): string {
  return `${campaignId}|v${planVersion}|${type}|${suffix}|${idempotencyKey}`;
}

function proposedWorkUnitRef(pkg: CampaignWorkPackage): string {
  return pkg.matchedWorkUnitId ?? `proposed-wu:${pkg.id}`;
}

function deliverableKindForPackage(pkg: CampaignWorkPackage): string {
  if (pkg.deliverableType?.trim()) {
    const d = pkg.deliverableType.trim().toLowerCase();
    if (
      [
        "instagram",
        "linkedin",
        "newsletter",
        "blog",
        "landing_page",
        "meta_ad",
        "google_ad",
        "email",
        "generic",
      ].includes(d)
    ) {
      return d;
    }
    return "generic";
  }
  return "generic";
}

function channelForPackage(pkg: CampaignWorkPackage): string {
  return pkg.channel?.trim() || "Campaign";
}

function planActivityRef(pkg: CampaignWorkPackage): string | undefined {
  const ref = pkg.sourceReferences.find((r) => r.kind === "plan_activity");
  return ref?.ref?.trim() || undefined;
}

function categoryMatchesPackage(
  category: string,
  pkg: CampaignWorkPackage
): boolean {
  const haystack = normalize(
    `${pkg.channel ?? ""} ${pkg.deliverableType ?? ""} ${pkg.type}`
  );
  const cat = normalize(category.replace(/_/g, " "));
  if (cat === "linkedin" && haystack.includes("linkedin")) return true;
  if (cat === "instagram" && haystack.includes("instagram")) return true;
  if (cat === "newsletter" && (haystack.includes("newsletter") || haystack.includes("email"))) {
    return true;
  }
  if (cat === "blog" && haystack.includes("blog")) return true;
  if (cat === "google_ads" && (haystack.includes("google") || haystack.includes("google_ad"))) {
    return true;
  }
  if (cat === "meta_ads" && (haystack.includes("meta") || haystack.includes("meta_ad"))) {
    return true;
  }
  return haystack.includes(cat);
}

function selectResponsibilityOwner(
  source: CampaignExecutorSource,
  pkg: CampaignWorkPackage
): { responsibilityId: string; ownerRole: string; ownerLabel?: string } | null {
  for (const resp of source.responsibilities ?? []) {
    if (!resp.enabled) continue;
    if (resp.peerId && resp.peerId !== source.peerId) continue;
    if (resp.approvalPolicy === "fully_automatic" && resp.autonomyLevel === "manual") {
      continue;
    }
    if (!categoryMatchesPackage(resp.category, pkg)) continue;
    return {
      responsibilityId: resp.id,
      ownerRole: resp.category,
      ownerLabel: resp.category,
    };
  }
  return null;
}

function hasManualOnlyBlock(plan: CampaignExecutionPlan): boolean {
  return plan.workPackages.some(
    (p) => p.approvalRequirement.mode === "blocked_manual_only" && p.status !== "satisfied"
  );
}

function validateSource(source: CampaignExecutorSource): void {
  if (!source.organizationId?.trim()) throw new CampaignExecutorInvalidOrganizationIdError();
  if (!source.peerId?.trim()) throw new CampaignExecutorInvalidPeerIdError();
  if (!source.campaignId?.trim()) throw new CampaignExecutorInvalidCampaignIdError();
  if (!source.assembledAt?.trim()) {
    throw new CampaignExecutorContradictoryCampaignStatusError("assembledAt is required.");
  }
  const plan = source.executionPlan;
  if (plan.campaignId !== source.campaignId) {
    throw new CampaignExecutorPlanCampaignMismatchError();
  }
  if (plan.organizationId !== source.organizationId) {
    throw new CampaignExecutorPlanOrganizationMismatchError();
  }
  validateExecutionOrder(plan);
  if (hasManualOnlyBlock(plan) && plan.status === "ready") {
    throw new CampaignExecutorUnsafeManualOnlyExecutionError();
  }
}

function validateExecutionOrder(plan: CampaignExecutionPlan): void {
  const ids = new Set(plan.workPackages.map((p) => p.id));
  if (plan.executionOrder.length !== plan.workPackages.length) {
    throw new CampaignExecutorInvalidExecutionOrderError(
      "executionOrder length must match workPackages length."
    );
  }
  for (const id of plan.executionOrder) {
    if (!ids.has(id)) {
      throw new CampaignExecutorInvalidExecutionOrderError(
        `executionOrder references unknown package "${id}".`
      );
    }
  }
  for (const pkg of plan.workPackages) {
    for (const dep of pkg.dependencies) {
      if (!ids.has(dep)) {
        throw new CampaignExecutorMissingDependencyPackageError(pkg.id, dep);
      }
    }
  }
}

function resolveResultStatus(
  plan: CampaignExecutionPlan,
  operationCount: number,
  hasExistingWork: boolean
): CampaignExecutionResultStatus {
  if (plan.status === "blocked") return "blocked";
  if (operationCount === 0 && hasExistingWork) return "no_changes";
  if (plan.status === "draft") return "restricted";
  if (plan.status === "restricted") return "restricted";
  if (plan.status === "ready" && operationCount > 0) return "executable";
  if (plan.status === "ready" && operationCount === 0) return "no_changes";
  return "restricted";
}

function resolveTargetCampaignStatus(
  planStatus: CampaignExecutionPlan["status"],
  resultStatus: CampaignExecutionResultStatus
): CampaignStatus {
  if (resultStatus === "blocked") return "blocked";
  if (planStatus === "draft") return "planning";
  if (resultStatus === "no_changes") return "planning";
  if (resultStatus === "restricted") return "ready";
  if (resultStatus === "executable") return "ready";
  return "planning";
}

function packageNeedsCreate(
  pkg: CampaignWorkPackage,
  existingKeys: Set<string>
): boolean {
  if (pkg.status === "satisfied" || pkg.status === "skipped") return false;
  if (pkg.matchedWorkUnitId) return false;
  if (pkg.status === "blocked") return false;
  if (!EXECUTABLE_PACKAGE_TYPES.has(pkg.type)) return false;

  const key = `${normalize(channelForPackage(pkg))}|${normalize(deliverableKindForPackage(pkg))}|${normalize(planActivityRef(pkg) ?? "")}`;
  if (existingKeys.has(key)) return false;
  return true;
}

function existingWorkUnitKeys(
  units: CampaignExecutorSource["existingWorkUnits"]
): Set<string> {
  const keys = new Set<string>();
  for (const unit of units ?? []) {
    if (unit.cancelled) continue;
    keys.add(
      `${normalize(unit.channel)}|${normalize(unit.deliverableKind)}|${normalize(unit.planActivityReference ?? "")}`
    );
  }
  return keys;
}

function pushOperation(
  operations: CampaignExecutionOperation[],
  op: CampaignExecutionOperation,
  seenIds: Set<string>
): void {
  if (seenIds.has(op.id)) {
    throw new CampaignExecutorDuplicateOperationIdError(op.id);
  }
  seenIds.add(op.id);
  operations.push(op);
}

/**
 * Translates a CampaignExecutionPlan into proposed execution operations (no side effects).
 */
export function applyCampaignExecutionPlan(
  source: CampaignExecutorSource
): CampaignExecutionResult {
  validateSource(source);

  const plan = source.executionPlan;
  const idempotencyKey =
    source.idempotencyKey ??
    `exec-${source.campaignId}-v${source.version}-${normalize(source.assembledAt)}`;

  const packageById = new Map(plan.workPackages.map((p) => [p.id, p]));
  const ordered = plan.executionOrder
    .map((id) => packageById.get(id))
    .filter((p): p is CampaignWorkPackage => Boolean(p));

  const existingKeys = existingWorkUnitKeys(source.existingWorkUnits);
  const operations: CampaignExecutionOperation[] = [];
  const seenOpIds = new Set<string>();
  const warnings: string[] = [];
  const restrictions: CampaignExecutionRestriction[] = [];
  const nextActions: CampaignExecutionNextAction[] = [];

  let sequence = 0;

  const planBlocked = plan.status === "blocked";
  const planDraft = plan.status === "draft";
  const manualOnly = hasManualOnlyBlock(plan);

  if (manualOnly && !planBlocked) {
    restrictions.push({
      code: "manual_only_policy",
      message: "Manual-only approval policy prevents autonomous execution.",
    });
  }

  for (const pkg of ordered) {
    if (pkg.blockers.length) {
      for (const blocker of pkg.blockers) {
        restrictions.push({
          code: "package_blocked",
          message: blocker,
          relatedWorkPackageId: pkg.id,
        });
      }
    }
  }

  const packagesNeedingCreate: CampaignWorkPackage[] = [];

  for (const pkg of ordered) {
    if (planBlocked || planDraft || manualOnly) continue;
    if (pkg.approvalRequirement.mode === "blocked_manual_only") continue;
    if (packageNeedsCreate(pkg, existingKeys)) {
      packagesNeedingCreate.push(pkg);
    }
  }

  for (const pkg of packagesNeedingCreate) {
    const suffix = pkg.id;
    const wuRef = proposedWorkUnitRef(pkg);
    const preconditions: CampaignExecutionOperationPrecondition[] = [
      {
        code: "plan_executable",
        message: "Campaign execution plan must be in an executable state.",
      },
    ];

    if (pkg.approvalRequirement.required && pkg.approvalRequirement.mode === "approval_before_generation") {
      const approvalId = operationId(source.campaignId, plan.version, "REQUEST_APPROVAL", suffix, idempotencyKey);
      pushOperation(
        operations,
        {
          id: approvalId,
          type: "REQUEST_APPROVAL",
          campaignId: source.campaignId,
          sourceWorkPackageId: pkg.id,
          sequence: sequence++,
          reason: "Approval required before work unit creation for this package.",
          preconditions,
          idempotencyKey: opKey(source.campaignId, plan.version, "REQUEST_APPROVAL", suffix, idempotencyKey),
          payload: {
            approvalGate: "before_generation",
            sourceWorkPackageId: pkg.id,
            workUnitRef: wuRef,
            brandReviewRequired: pkg.approvalRequirement.brandReviewRequired,
            legalReviewRequired: pkg.approvalRequirement.legalReviewRequired,
          },
        },
        seenOpIds
      );
    }

    const createId = operationId(source.campaignId, plan.version, "CREATE_WORK_UNIT", suffix, idempotencyKey);
    pushOperation(
      operations,
      {
        id: createId,
        type: "CREATE_WORK_UNIT",
        campaignId: source.campaignId,
        sourceWorkPackageId: pkg.id,
        sequence: sequence++,
        reason: `Create work for planned step: ${pkg.title}`,
        preconditions,
        idempotencyKey: opKey(source.campaignId, plan.version, "CREATE_WORK_UNIT", suffix, idempotencyKey),
        payload: {
          proposedWorkUnitRef: wuRef,
          title: pkg.title,
          channel: channelForPackage(pkg),
          deliverableKind: deliverableKindForPackage(pkg),
          workPackageType: pkg.type,
          ...(planActivityRef(pkg) ? { planActivityReference: planActivityRef(pkg) } : {}),
          objective: pkg.description.slice(0, 240),
        },
      },
      seenOpIds
    );

    existingKeys.add(
      `${normalize(channelForPackage(pkg))}|${normalize(deliverableKindForPackage(pkg))}|${normalize(planActivityRef(pkg) ?? "")}`
    );

    const owner = selectResponsibilityOwner(source, pkg);
    if (owner) {
      const assignId = operationId(
        source.campaignId,
        plan.version,
        "ASSIGN_WORK_UNIT_OWNER",
        suffix,
        idempotencyKey
      );
      pushOperation(
        operations,
        {
          id: assignId,
          type: "ASSIGN_WORK_UNIT_OWNER",
          campaignId: source.campaignId,
          sourceWorkPackageId: pkg.id,
          sequence: sequence++,
          reason: "Assign responsibility owner for planned work.",
          preconditions: [
            {
              code: "work_unit_exists",
              message: "Target work unit must exist before owner assignment.",
            },
          ],
          idempotencyKey: opKey(
            source.campaignId,
            plan.version,
            "ASSIGN_WORK_UNIT_OWNER",
            suffix,
            idempotencyKey
          ),
          payload: {
            workUnitRef: wuRef,
            responsibilityId: owner.responsibilityId,
            ownerRole: owner.ownerRole,
            ...(owner.ownerLabel ? { ownerLabel: owner.ownerLabel } : {}),
          },
        },
        seenOpIds
      );
    } else if (pkg.recommendedOwner.role !== "customer") {
      warnings.push(`No matching enabled responsibility for "${pkg.title}" — owner not assigned.`);
      nextActions.push({
        label: "Configure responsibility",
        reason: `Enable a matching responsibility before delegating "${pkg.title}".`,
      });
    }

    if (pkg.approvalRequirement.required && pkg.approvalRequirement.mode === "approval_before_publication") {
      const approvalId = operationId(
        source.campaignId,
        plan.version,
        "REQUEST_APPROVAL_PUB",
        suffix,
        idempotencyKey
      );
      pushOperation(
        operations,
        {
          id: approvalId,
          type: "REQUEST_APPROVAL",
          campaignId: source.campaignId,
          sourceWorkPackageId: pkg.id,
          sequence: sequence++,
          reason: "Approval required before publication-related work proceeds.",
          preconditions: [],
          idempotencyKey: opKey(
            source.campaignId,
            plan.version,
            "REQUEST_APPROVAL_PUB",
            suffix,
            idempotencyKey
          ),
          payload: {
            approvalGate: "before_publication",
            sourceWorkPackageId: pkg.id,
            workUnitRef: wuRef,
            brandReviewRequired: pkg.approvalRequirement.brandReviewRequired,
            legalReviewRequired: pkg.approvalRequirement.legalReviewRequired,
          },
        },
        seenOpIds
      );
    }
  }

  for (const pkg of packagesNeedingCreate) {
    for (const depId of pkg.dependencies) {
      const depPkg = packageById.get(depId);
      if (!depPkg) continue;
      const suffix = `${pkg.id}->${depId}`;
      const linkId = operationId(
        source.campaignId,
        plan.version,
        "LINK_WORK_UNIT_DEPENDENCY",
        suffix,
        idempotencyKey
      );
      pushOperation(
        operations,
        {
          id: linkId,
          type: "LINK_WORK_UNIT_DEPENDENCY",
          campaignId: source.campaignId,
          sourceWorkPackageId: pkg.id,
          sequence: sequence++,
          reason: "Link planned work unit dependency.",
          preconditions: [
            {
              code: "both_work_units_exist",
              message: "Dependent and prerequisite work units must exist.",
            },
          ],
          idempotencyKey: opKey(
            source.campaignId,
            plan.version,
            "LINK_WORK_UNIT_DEPENDENCY",
            suffix,
            idempotencyKey
          ),
          payload: {
            dependentWorkUnitRef: proposedWorkUnitRef(pkg),
            dependsOnWorkUnitRef: proposedWorkUnitRef(depPkg),
            sourceWorkPackageId: pkg.id,
            dependsOnWorkPackageId: depId,
          },
        },
        seenOpIds
      );
    }
  }

  for (const approval of plan.approvals) {
    const pkg = packageById.get(approval.packageId);
    if (!pkg || planBlocked || planDraft) continue;
    if (approval.gate === "manual_only") {
      restrictions.push({
        code: "manual_only_gate",
        message: approval.description,
        relatedWorkPackageId: pkg.id,
      });
      continue;
    }
    const suffix = `plan-approval-${approval.packageId}`;
    const gate =
      approval.gate === "before_generation" ? "before_generation" : "before_publication";
    pushOperation(
      operations,
      {
        id: operationId(source.campaignId, plan.version, "REQUEST_APPROVAL", suffix, idempotencyKey),
        type: "REQUEST_APPROVAL",
        campaignId: source.campaignId,
        sourceWorkPackageId: pkg.id,
        sequence: sequence++,
        reason: approval.description,
        preconditions: [],
        idempotencyKey: opKey(source.campaignId, plan.version, "REQUEST_APPROVAL", suffix, idempotencyKey),
        payload: {
          approvalGate: gate,
          sourceWorkPackageId: pkg.id,
          workUnitRef: proposedWorkUnitRef(pkg),
        },
      },
      seenOpIds
    );
  }

  const hasExistingWork = (source.existingWorkUnits ?? []).some((u) => !u.cancelled);
  const executableWorkOps = operations.filter((o) => o.type === "CREATE_WORK_UNIT").length;
  const resultStatus = resolveResultStatus(plan, operations.length, hasExistingWork);

  if (resultStatus === "executable" && plan.status === "ready") {
    pushOperation(
      operations,
      {
        id: operationId(source.campaignId, plan.version, "MARK_CAMPAIGN_READY", "0", idempotencyKey),
        type: "MARK_CAMPAIGN_READY",
        campaignId: source.campaignId,
        sequence: sequence++,
        reason: "Campaign plan is ready for execution.",
        preconditions: [],
        idempotencyKey: opKey(source.campaignId, plan.version, "MARK_CAMPAIGN_READY", "0", idempotencyKey),
        payload: {
          fromStatus: source.currentCampaignStatus,
          toStatus: "ready",
        },
      },
      seenOpIds
    );
  }

  if (resultStatus === "executable" && executableWorkOps > 0) {
    pushOperation(
      operations,
      {
        id: operationId(source.campaignId, plan.version, "MARK_CAMPAIGN_ACTIVE", "0", idempotencyKey),
        type: "MARK_CAMPAIGN_ACTIVE",
        campaignId: source.campaignId,
        sequence: sequence++,
        reason: "Campaign has executable work operations.",
        preconditions: [
          {
            code: "executable_work_present",
            message: "At least one work unit creation operation must be present.",
          },
        ],
        idempotencyKey: opKey(source.campaignId, plan.version, "MARK_CAMPAIGN_ACTIVE", "0", idempotencyKey),
        payload: {
          fromStatus: source.currentCampaignStatus,
          toStatus: "active",
        },
      },
      seenOpIds
    );
  }

  if (planDraft) {
    nextActions.push({
      label: "Complete campaign plan",
      reason: "Finish planning inputs before execution can start.",
    });
  }

  const targetCampaignStatus = resolveTargetCampaignStatus(plan.status, resultStatus);

  return {
    id: `cer-${source.campaignId}-v${plan.version}-${idempotencyKey}`,
    organizationId: source.organizationId,
    peerId: source.peerId,
    campaignId: source.campaignId,
    sourcePlanId: plan.id,
    sourcePlanVersion: plan.version,
    status: resultStatus,
    targetCampaignStatus,
    operations: Object.freeze([...operations]) as readonly CampaignExecutionOperation[],
    restrictions: Object.freeze([...restrictions]),
    warnings: Object.freeze([...warnings]),
    nextActions: Object.freeze([...nextActions]),
    idempotencyKey,
    assembledAt: source.assembledAt,
  };
}
