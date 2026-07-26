import type {
  CampaignExecutionOperation,
  CampaignExecutionOperationType,
} from "@/lib/campaign/executor";
import { transitionWorkUnit } from "@/lib/peer-workflow/work-unit-engine";
import type { WorkDeliverableKind, WorkUnit, CreateWorkUnitInput } from "@/lib/peer-workflow/work-unit";

import type { CampaignExecutionApplicationSource } from "./campaign-execution-application-source";
import {
  extractExecutorOperationIdFromRawRequest,
  rawRequestWithExecutorOperationId,
} from "./campaign-execution-application-source";
import type { CampaignExecutionApplicationResult } from "./campaign-execution-application-result";
import type { CampaignExecutionApplicationErrorRecord } from "./campaign-execution-application-result";
import { CAMPAIGN_EXECUTION_APPLICATION_PARTIAL_WRITE_LIMITATION } from "./campaign-execution-application-result";
import {
  CampaignExecutionApplicationInvalidStatusTransitionError,
  CampaignExecutionApplicationNotFoundError,
  CampaignExecutionApplicationPersistenceFailureError,
  CampaignExecutionApplicationScopeMismatchError,
  CampaignExecutionApplicationUnsupportedOperationError,
} from "./errors";

const SUPPORTED_OPERATION_TYPES = new Set<CampaignExecutionOperationType>([
  "CREATE_WORK_UNIT",
  "ASSIGN_WORK_UNIT_OWNER",
  "LINK_WORK_UNIT_DEPENDENCY",
  "REQUEST_APPROVAL",
  "MARK_CAMPAIGN_READY",
  "MARK_CAMPAIGN_ACTIVE",
]);

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

function toDeliverableKind(value: string): WorkDeliverableKind {
  const v = normalize(value).replace(/-/g, "_");
  const direct: WorkDeliverableKind[] = [
    "instagram",
    "linkedin",
    "newsletter",
    "blog",
    "landing_page",
    "meta_ad",
    "google_ad",
    "email",
    "generic",
  ];
  if (direct.includes(v as WorkDeliverableKind)) {
    return v as WorkDeliverableKind;
  }
  if (v.includes("linkedin")) return "linkedin";
  if (v.includes("instagram")) return "instagram";
  if (v.includes("newsletter") || v.includes("email")) return "newsletter";
  if (v.includes("blog")) return "blog";
  if (v.includes("meta")) return "meta_ad";
  if (v.includes("google")) return "google_ad";
  return "generic";
}

function needsVisualForKind(kind: WorkDeliverableKind): boolean {
  return kind === "instagram" || kind === "meta_ad";
}

function equivalenceKey(unit: WorkUnit): string {
  return `${normalize(unit.channel)}|${normalize(unit.deliverableKind)}|${normalize(unit.planActivityReference ?? "")}`;
}

function payloadEquivalenceKey(payload: {
  channel: string;
  deliverableKind: string;
  planActivityReference?: string;
}): string {
  return `${normalize(payload.channel)}|${normalize(payload.deliverableKind)}|${normalize(payload.planActivityReference ?? "")}`;
}

function findUnitByRef(
  ref: string,
  workUnits: readonly WorkUnit[],
  refMap: ReadonlyMap<string, string>
): WorkUnit | null {
  const mappedId = refMap.get(ref);
  if (mappedId) {
    return workUnits.find((u) => u.id === mappedId) ?? null;
  }
  if (ref.startsWith("proposed-wu:")) {
    return null;
  }
  return workUnits.find((u) => u.id === ref) ?? null;
}

function validateSource(source: CampaignExecutionApplicationSource): void {
  if (!source.campaignProject) {
    throw new CampaignExecutionApplicationNotFoundError("project", source.executionResult.campaignId);
  }
  if (source.campaignProject.archivedAt) {
    throw new CampaignExecutionApplicationNotFoundError("project", source.campaignProject.id);
  }
  if (source.executionResult.organizationId !== source.organizationId) {
    throw new CampaignExecutionApplicationScopeMismatchError(
      "executionResult.organizationId must match source organizationId."
    );
  }
  if (source.executionResult.peerId !== source.peerId) {
    throw new CampaignExecutionApplicationScopeMismatchError(
      "executionResult.peerId must match source peerId."
    );
  }
  if (source.executionResult.campaignId !== source.campaignProject.id) {
    throw new CampaignExecutionApplicationScopeMismatchError(
      "executionResult.campaignId must match campaign project id."
    );
  }
  if (source.campaignProject.peerId !== source.peerId) {
    throw new CampaignExecutionApplicationScopeMismatchError(
      "campaignProject.peerId must match source peerId."
    );
  }
}

function validateOperations(operations: readonly CampaignExecutionOperation[]): void {
  for (const op of operations) {
    if (!SUPPORTED_OPERATION_TYPES.has(op.type)) {
      throw new CampaignExecutionApplicationUnsupportedOperationError(op.type);
    }
  }
}

async function persistCreate(
  source: CampaignExecutionApplicationSource,
  input: CreateWorkUnitInput
): Promise<WorkUnit> {
  try {
    const created = await source.persistence.createWorkUnit(input);
    return created;
  } catch (error) {
    const label = error instanceof Error ? error.name : "UnknownError";
    throw new CampaignExecutionApplicationPersistenceFailureError(label);
  }
}

async function persistUpdateUnit(
  source: CampaignExecutionApplicationSource,
  unit: WorkUnit
): Promise<WorkUnit> {
  try {
    return await source.persistence.updateWorkUnit(unit);
  } catch (error) {
    const label = error instanceof Error ? error.name : "UnknownError";
    throw new CampaignExecutionApplicationPersistenceFailureError(label);
  }
}

async function persistUpdateProject(
  source: CampaignExecutionApplicationSource,
  project: typeof source.campaignProject
): Promise<typeof source.campaignProject> {
  try {
    return await source.persistence.updateProject(project);
  } catch (error) {
    const label = error instanceof Error ? error.name : "UnknownError";
    throw new CampaignExecutionApplicationPersistenceFailureError(label);
  }
}

function alreadyAppliedOperation(
  operationId: string,
  ledger: ReadonlySet<string>,
  workUnits: readonly WorkUnit[]
): boolean {
  if (ledger.has(operationId)) return true;
  return workUnits.some(
    (u) => extractExecutorOperationIdFromRawRequest(u.rawRequest) === operationId
  );
}

function findEquivalentUnit(
  payload: { channel: string; deliverableKind: string; planActivityReference?: string },
  workUnits: readonly WorkUnit[],
  projectId: string
): WorkUnit | null {
  const key = payloadEquivalenceKey(payload);
  return (
    workUnits.find(
      (u) =>
        u.projectId === projectId &&
        !u.cancelled &&
        equivalenceKey(u) === key
    ) ?? null
  );
}

/**
 * Applies proposed Campaign Executor operations through injected workspace persistence.
 * Does not call AI, hooks, or sessionStorage directly.
 */
export async function applyCampaignExecutionResult(
  source: CampaignExecutionApplicationSource
): Promise<CampaignExecutionApplicationResult> {
  validateSource(source);

  const result = source.executionResult;
  const appliedLedger = new Set(source.appliedOperationIds ?? []);
  const operations = [...result.operations].sort((a, b) => a.sequence - b.sequence);

  const appliedOperationIds: string[] = [];
  const skippedOperationIds: string[] = [];
  const createdWorkUnitIds: string[] = [];
  const updatedWorkUnitIds: string[] = [];
  const warnings: string[] = [];
  const errors: CampaignExecutionApplicationErrorRecord[] = [];

  if (result.status === "blocked") {
    return {
      status: "blocked",
      campaignId: result.campaignId,
      executionResultId: result.id,
      appliedOperationIds,
      skippedOperationIds,
      createdWorkUnitIds,
      updatedWorkUnitIds,
      campaignUpdated: false,
      warnings,
      errors: [
        {
          code: "CAMPAIGN_EXECUTION_APPLICATION_BLOCKED_RESULT",
          message: "Execution result is blocked; no workspace writes were performed.",
        },
      ],
      appliedAt: source.appliedAt,
    };
  }

  if (result.status === "no_changes" || operations.length === 0) {
    return {
      status: "no_changes",
      campaignId: result.campaignId,
      executionResultId: result.id,
      appliedOperationIds,
      skippedOperationIds,
      createdWorkUnitIds,
      updatedWorkUnitIds,
      campaignUpdated: false,
      warnings,
      errors,
      appliedAt: source.appliedAt,
    };
  }

  try {
    validateOperations(operations);
  } catch (error) {
    if (error instanceof CampaignExecutionApplicationUnsupportedOperationError) {
      return {
        status: "failed",
        campaignId: result.campaignId,
        executionResultId: result.id,
        appliedOperationIds,
        skippedOperationIds,
        createdWorkUnitIds,
        updatedWorkUnitIds,
        campaignUpdated: false,
        warnings,
        errors: [{ code: error.code, message: error.message }],
        appliedAt: source.appliedAt,
      };
    }
    throw error;
  }

  let workUnits = [...source.workUnits];
  let project = source.campaignProject;
  let campaignUpdated = false;
  const refMap = new Map<string, string>();
  let criticalFailure = false;
  let createOperationsSucceeded = 0;
  const expectedCreates = operations.filter((o) => o.type === "CREATE_WORK_UNIT").length;
  const preExistingEquivalenceKeys = new Set<string>();
  for (const unit of source.workUnits) {
    if (unit.projectId !== project.id || unit.cancelled) continue;
    preExistingEquivalenceKeys.add(equivalenceKey(unit));
  }

  for (const op of operations) {
    if (criticalFailure) {
      skippedOperationIds.push(op.id);
      continue;
    }

    if (alreadyAppliedOperation(op.id, appliedLedger, workUnits)) {
      skippedOperationIds.push(op.id);
      if (op.type === "CREATE_WORK_UNIT") {
        const existing =
          workUnits.find(
            (u) => extractExecutorOperationIdFromRawRequest(u.rawRequest) === op.id
          ) ?? findEquivalentUnit(op.payload, workUnits, project.id);
        if (existing) {
          refMap.set(op.payload.proposedWorkUnitRef, existing.id);
        }
      }
      continue;
    }

    switch (op.type) {
      case "CREATE_WORK_UNIT": {
        const duplicate = preExistingEquivalenceKeys.has(payloadEquivalenceKey(op.payload))
          ? findEquivalentUnit(op.payload, source.workUnits, project.id)
          : null;
        if (duplicate) {
          skippedOperationIds.push(op.id);
          refMap.set(op.payload.proposedWorkUnitRef, duplicate.id);
          appliedLedger.add(op.id);
          warnings.push(
            `Skipped create for operation ${op.id}; equivalent work unit "${duplicate.id}" already exists.`
          );
          break;
        }

        const deliverableKind = toDeliverableKind(op.payload.deliverableKind);
        const rawBody = op.payload.objective?.trim() || op.payload.title;
        const rawRequest = rawRequestWithExecutorOperationId(op.id, rawBody);

        let created: WorkUnit;
        try {
          created = await persistCreate(source, {
            peerId: source.peerId,
            projectId: project.id,
            role: "Marketing",
            title: op.payload.title,
            deliverableKind,
            channel: op.payload.channel,
            objective: op.payload.objective ?? null,
            audience: null,
            needsVisual: needsVisualForKind(deliverableKind),
            recurrence: "once",
            rawRequest,
            planActivityReference: op.payload.planActivityReference ?? null,
          });
        } catch (error) {
          criticalFailure = true;
          if (error instanceof CampaignExecutionApplicationPersistenceFailureError) {
            errors.push({ code: error.code, message: error.message });
          } else {
            errors.push({
              code: "CAMPAIGN_EXECUTION_APPLICATION_PERSISTENCE_FAILURE",
              message: "Campaign execution could not be persisted safely.",
            });
          }
          skippedOperationIds.push(op.id);
          break;
        }

        workUnits = [...workUnits, created];
        refMap.set(op.payload.proposedWorkUnitRef, created.id);
        createdWorkUnitIds.push(created.id);
        appliedOperationIds.push(op.id);
        appliedLedger.add(op.id);
        createOperationsSucceeded += 1;
        break;
      }

      case "ASSIGN_WORK_UNIT_OWNER": {
        const unit = findUnitByRef(op.payload.workUnitRef, workUnits, refMap);
        if (!unit) {
          warnings.push(
            `Skipped owner assignment for operation ${op.id}; work unit reference could not be resolved.`
          );
          skippedOperationIds.push(op.id);
          break;
        }
        if (!op.payload.responsibilityId?.trim()) {
          warnings.push(`Skipped owner assignment for operation ${op.id}; missing responsibility id.`);
          skippedOperationIds.push(op.id);
          break;
        }

        warnings.push(
          `Owner assignment for work unit "${unit.id}" is not persisted on WorkUnit records; responsibility "${op.payload.responsibilityId}" was recorded only in the execution plan.`
        );
        if (
          project.responsibilityId !== op.payload.responsibilityId &&
          createdWorkUnitIds.includes(unit.id)
        ) {
          project = {
            ...project,
            responsibilityId: op.payload.responsibilityId,
            updatedAt: source.appliedAt,
          };
          try {
            project = await persistUpdateProject(source, project);
            campaignUpdated = true;
            appliedOperationIds.push(op.id);
          } catch {
            criticalFailure = true;
            errors.push({
              code: "CAMPAIGN_EXECUTION_APPLICATION_PERSISTENCE_FAILURE",
              message: "Campaign execution could not be persisted safely.",
            });
            skippedOperationIds.push(op.id);
            break;
          }
        } else {
          skippedOperationIds.push(op.id);
        }
        break;
      }

      case "LINK_WORK_UNIT_DEPENDENCY": {
        const dependent = findUnitByRef(op.payload.dependentWorkUnitRef, workUnits, refMap);
        const prerequisite = findUnitByRef(op.payload.dependsOnWorkUnitRef, workUnits, refMap);
        if (!dependent || !prerequisite) {
          warnings.push(
            `Skipped dependency link for operation ${op.id}; work unit dependency storage is not available in the current WorkUnit model.`
          );
          skippedOperationIds.push(op.id);
          break;
        }
        if (dependent.id === prerequisite.id) {
          warnings.push(`Skipped self-dependency for operation ${op.id}.`);
          skippedOperationIds.push(op.id);
          break;
        }
        warnings.push(
          `Dependency link ${prerequisite.id} → ${dependent.id} is not persisted; the WorkUnit engine has no dependency field yet.`
        );
        skippedOperationIds.push(op.id);
        break;
      }

      case "REQUEST_APPROVAL": {
        const unit = op.payload.workUnitRef
          ? findUnitByRef(op.payload.workUnitRef, workUnits, refMap)
          : null;
        if (unit?.draftId) {
          warnings.push(
            `Approval gate "${op.payload.approvalGate}" for draft "${unit.draftId}" must be handled through the existing draft review flow; no automatic approval was created.`
          );
        } else {
          warnings.push(
            `Approval gate "${op.payload.approvalGate}" for operation ${op.id} was not persisted — no draft-backed approval overlay exists yet.`
          );
        }
        skippedOperationIds.push(op.id);
        break;
      }

      case "MARK_CAMPAIGN_READY": {
        if (op.payload.toStatus !== "ready") {
          throw new CampaignExecutionApplicationInvalidStatusTransitionError(
            `Unsupported MARK_CAMPAIGN_READY target status "${op.payload.toStatus}".`
          );
        }
        project = {
          ...project,
          updatedAt: source.appliedAt,
        };
        try {
          project = await persistUpdateProject(source, project);
          campaignUpdated = true;
          appliedOperationIds.push(op.id);
        } catch (error) {
          criticalFailure = true;
          errors.push({
            code: "CAMPAIGN_EXECUTION_APPLICATION_PERSISTENCE_FAILURE",
            message: "Campaign execution could not be persisted safely.",
          });
          skippedOperationIds.push(op.id);
        }
        break;
      }

      case "MARK_CAMPAIGN_ACTIVE": {
        if (createOperationsSucceeded === 0 && expectedCreates > 0) {
          warnings.push(
            "Skipped MARK_CAMPAIGN_ACTIVE because required work unit creation did not succeed."
          );
          skippedOperationIds.push(op.id);
          break;
        }
        if (criticalFailure) {
          skippedOperationIds.push(op.id);
          break;
        }

        const projectUnitIds = new Set(
          workUnits.filter((u) => u.projectId === project.id && !u.cancelled).map((u) => u.id)
        );
        for (const unitId of createdWorkUnitIds) {
          if (!projectUnitIds.has(unitId)) continue;
          const unit = workUnits.find((u) => u.id === unitId);
          if (!unit || unit.status !== "requested") continue;
          let next = transitionWorkUnit(
            unit,
            "planning",
            "planning_started",
            "Campaign execution started"
          );
          try {
            next = await persistUpdateUnit(source, next);
            workUnits = workUnits.map((u) => (u.id === next.id ? next : u));
            updatedWorkUnitIds.push(next.id);
          } catch {
            criticalFailure = true;
            errors.push({
              code: "CAMPAIGN_EXECUTION_APPLICATION_PERSISTENCE_FAILURE",
              message: "Campaign execution could not be persisted safely.",
            });
            break;
          }
        }

        if (!criticalFailure) {
          project = {
            ...project,
            updatedAt: source.appliedAt,
          };
          try {
            project = await persistUpdateProject(source, project);
            campaignUpdated = true;
            appliedOperationIds.push(op.id);
          } catch {
            criticalFailure = true;
            errors.push({
              code: "CAMPAIGN_EXECUTION_APPLICATION_PERSISTENCE_FAILURE",
              message: "Campaign execution could not be persisted safely.",
            });
            skippedOperationIds.push(op.id);
          }
        } else {
          skippedOperationIds.push(op.id);
        }
        break;
      }

      default: {
        const exhaustive: never = op;
        throw new CampaignExecutionApplicationUnsupportedOperationError(
          (exhaustive as CampaignExecutionOperation).type
        );
      }
    }
  }

  let status: CampaignExecutionApplicationResult["status"] = "applied";
  if (criticalFailure) {
    status = appliedOperationIds.length > 0 ? "partially_applied" : "failed";
  } else if (appliedOperationIds.length === 0 && skippedOperationIds.length > 0) {
    status = "no_changes";
  }

  if (status === "partially_applied") {
    warnings.push(CAMPAIGN_EXECUTION_APPLICATION_PARTIAL_WRITE_LIMITATION);
  }

  return {
    status,
    campaignId: result.campaignId,
    executionResultId: result.id,
    appliedOperationIds: Object.freeze([...appliedOperationIds]),
    skippedOperationIds: Object.freeze([...skippedOperationIds]),
    createdWorkUnitIds: Object.freeze([...createdWorkUnitIds]),
    updatedWorkUnitIds: Object.freeze([...updatedWorkUnitIds]),
    campaignUpdated,
    warnings: Object.freeze([...warnings]),
    errors: Object.freeze([...errors]),
    appliedAt: source.appliedAt,
  };
}