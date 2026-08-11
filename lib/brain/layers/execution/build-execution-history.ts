import { buildInstructionFromDeliverable } from "./adapters/stub-adapters";
import { createExecutionAuditRecord } from "./execution-audit";
import { eventsForResult } from "./execution-events";
import { lookupIdempotentExecution } from "./execution-idempotency";
import type { ExecutionProviderRegistry } from "./execution-provider-registry";
import { getDefaultExecutionProviderRegistry } from "./execution-provider-registry";
import { aggregateOverallStatus } from "./execution-retry-policy";
import {
  assertProviderEvidence,
  containsForbiddenSecrets,
  validateExecutionInput,
  validateInstruction,
} from "./execution-validator";
import type {
  ExecutionBrainInput,
  ExecutionContext,
  ExecutionHistory,
  ExecutionHistoryEntry,
  ExecutionResult,
  ExecutionStatus,
} from "./types";
import { EXECUTION_LAYER_VERSION } from "./types";

async function executeInstruction(input: {
  instruction: import("./types").ExecutionInstruction;
  ctx: ExecutionContext;
  registry: ExecutionProviderRegistry;
}): Promise<ExecutionResult> {
  const { instruction, ctx, registry } = input;
  const gate = validateInstruction(instruction);
  if (!gate.ok) {
    const at = new Date().toISOString();
    return {
      executionId: instruction.executionId,
      status: "FAILED",
      receipt: null,
      failure: {
        id: `fail-gate-${instruction.executionId}`,
        executionId: instruction.executionId,
        provider: instruction.target.provider,
        failureClass: "VALIDATION",
        message: gate.reason,
        retryable: false,
        at,
      },
      attempt: {
        id: `att-gate-${instruction.executionId}`,
        executionId: instruction.executionId,
        attemptNumber: 1,
        status: "FAILED",
        provider: instruction.target.provider,
        startedAt: at,
        completedAt: at,
        receipt: null,
        failure: {
          id: `fail-gate-${instruction.executionId}`,
          executionId: instruction.executionId,
          provider: instruction.target.provider,
          failureClass: "VALIDATION",
          message: gate.reason,
          retryable: false,
          at,
        },
        idempotencyKey: instruction.idempotencyKey,
        correlationId: instruction.correlationId,
      },
    };
  }

  const entry = registry.get(instruction.target.provider);
  const adapter = registry.resolve(instruction.target.provider);
  const health = registry.health(
    instruction.target.provider,
    input.ctx.dryRun ? "healthy" : undefined
  );

  const adapterCtx = {
    ...ctx,
    health,
    configRef: ctx.dryRun ? "config:dry-run" : registry.configRef(instruction.target.provider),
  };

  if (!adapter.supports(instruction)) {
    const at = new Date().toISOString();
    return {
      executionId: instruction.executionId,
      status: "FAILED",
      receipt: null,
      failure: {
        id: `fail-support-${instruction.executionId}`,
        executionId: instruction.executionId,
        provider: instruction.target.provider,
        failureClass: "VALIDATION",
        message: `Provider ${instruction.target.provider} does not support this action.`,
        retryable: false,
        at,
      },
      attempt: {
        id: `att-support-${instruction.executionId}`,
        executionId: instruction.executionId,
        attemptNumber: 1,
        status: "FAILED",
        provider: instruction.target.provider,
        startedAt: at,
        completedAt: at,
        receipt: null,
        failure: {
          id: `fail-support-${instruction.executionId}`,
          executionId: instruction.executionId,
          provider: instruction.target.provider,
          failureClass: "VALIDATION",
          message: "Provider does not support action.",
          retryable: false,
          at,
        },
        idempotencyKey: instruction.idempotencyKey,
        correlationId: instruction.correlationId,
      },
    };
  }

  const validation = adapter.validate(instruction, adapterCtx);
  if (!validation.ok) {
    const at = new Date().toISOString();
    const retryable =
      validation.failureClass === "RETRYABLE" ||
      validation.failureClass === "RATE_LIMITED" ||
      validation.failureClass === "PROVIDER_UNAVAILABLE";
    const status: ExecutionStatus = retryable ? "RETRYABLE" : "FAILED";
    return {
      executionId: instruction.executionId,
      status,
      receipt: null,
      failure: {
        id: `fail-val-${instruction.executionId}`,
        executionId: instruction.executionId,
        provider: instruction.target.provider,
        failureClass: validation.failureClass,
        message: validation.reason,
        retryable,
        at,
      },
      attempt: {
        id: `att-val-${instruction.executionId}`,
        executionId: instruction.executionId,
        attemptNumber: 1,
        status,
        provider: instruction.target.provider,
        startedAt: at,
        completedAt: at,
        receipt: null,
        failure: {
          id: `fail-val-${instruction.executionId}`,
          executionId: instruction.executionId,
          provider: instruction.target.provider,
          failureClass: validation.failureClass,
          message: validation.reason,
          retryable,
          at,
        },
        idempotencyKey: instruction.idempotencyKey,
        correlationId: instruction.correlationId,
      },
    };
  }

  if (ctx.dryRun) {
    return adapter.execute(instruction, { ...adapterCtx, dryRun: true });
  }

  void entry;
  return adapter.execute(instruction, adapterCtx);
}

/** Build execution history from validated input — no reasoning, only operations. */
export async function buildExecutionHistory(
  input: ExecutionBrainInput,
  registry: ExecutionProviderRegistry = getDefaultExecutionProviderRegistry()
): Promise<ExecutionHistory> {
  const gate = validateExecutionInput(input);
  if (!gate.ok) {
    throw new Error(`${gate.errorCode}:${gate.reason}`);
  }

  if (containsForbiddenSecrets(input)) {
    throw new Error("forbidden_secrets:Payload must not contain credentials.");
  }

  const at = new Date().toISOString();
  const creative = input.creativeGraph;
  const validation = input.validationGraph;
  const correlationId = input.correlationId ?? `corr-${input.projectId}-${at}`;
  const initiatedBy = input.initiatedBy ?? "system";
  const dryRun = input.dryRun ?? false;

  const ctx: ExecutionContext = {
    organizationId: input.organizationId,
    projectId: input.projectId,
    campaignId: input.projectId,
    peerId: input.peerId,
    episodeId: input.episodeId,
    locale: input.locale ?? "en",
    correlationId,
    initiatedBy,
    dryRun,
  };

  const validationRef = `validation:${input.organizationId}:${input.projectId}:${validation.createdAt}`;
  const approvalRef = input.approvalRef ?? (input.approvalGranted ? `approval:${input.projectId}` : null);
  const approvalState = input.approvalGranted ? "granted" : "pending";
  const validationState = validation.report.publicationReadiness;

  const approvedIds = new Set(
    validation.report.approvedDeliverables.map((d) => d.deliverableId)
  );

  const deliverables = creative.deliverables.filter((d) => approvedIds.has(d.id));

  const entries: ExecutionHistoryEntry[] = [];
  const allEvents: import("./types").ExecutionEvent[] = [];
  const auditRecords: import("./types").ExecutionAuditRecord[] = [];
  const statuses: ExecutionStatus[] = [];

  for (const deliverable of deliverables) {
    const providerOverride = input.providerOverrides?.[deliverable.id];
    const executionId = `exec-${deliverable.id}-${input.projectId}`;
    const instruction = buildInstructionFromDeliverable({
      deliverable,
      validationRef,
      approvalRef,
      approvalState,
      validationState,
      context: input,
      executionId,
      provider: providerOverride,
    });

    const result = await executeInstruction({ instruction, ctx, registry });
    let finalResult = result;
    const evidenceGate = assertProviderEvidence(finalResult);
    if (!evidenceGate.ok && finalResult.status === "SUCCEEDED") {
      finalResult = {
        ...finalResult,
        status: "FAILED",
        receipt: null,
        failure: {
          id: `fail-evidence-${instruction.executionId}`,
          executionId: instruction.executionId,
          provider: instruction.target.provider,
          failureClass: "VALIDATION",
          message: evidenceGate.reason,
          retryable: false,
          at: new Date().toISOString(),
        },
      };
    }

    const entryEvents = eventsForResult({
      executionId,
      correlationId,
      provider: instruction.target.provider,
      resultStatus: finalResult.status,
      dryRun,
    });

    const entryBase: Omit<ExecutionHistoryEntry, "audit"> = {
      instruction,
      status: finalResult.status,
      attempts: [finalResult.attempt],
      receipts: finalResult.receipt ? [finalResult.receipt] : [],
      failures: finalResult.failure ? [finalResult.failure] : [],
      events: entryEvents,
    };

    const audit = createExecutionAuditRecord({
      entry: { ...entryBase, audit: {} as import("./types").ExecutionAuditRecord },
      result: finalResult,
      initiatedBy,
      dryRun,
    });

    const entry: ExecutionHistoryEntry = { ...entryBase, audit };
    entries.push(entry);
    allEvents.push(...entryEvents);
    auditRecords.push(audit);
    statuses.push(finalResult.status);
  }

  return {
    version: EXECUTION_LAYER_VERSION,
    organizationId: input.organizationId,
    campaignId: input.projectId,
    projectId: input.projectId,
    episodeId: input.episodeId,
    createdAt: at,
    validationGraphRef: validationRef,
    creativeGraphRef: `creative:${input.organizationId}:${input.projectId}:${creative.createdAt}`,
    overallStatus: aggregateOverallStatus(statuses),
    entries,
    events: allEvents,
    auditRecords,
    dryRun,
  };
}

export type RollbackClassification = {
  readonly executionId: string;
  readonly provider: import("./types").ExecutionProviderId;
  readonly supportsRollback: boolean;
  readonly rolledBack: boolean;
  readonly reason: string;
};

export async function classifyRollback(input: {
  history: ExecutionHistory;
  registry?: ExecutionProviderRegistry;
}): Promise<readonly RollbackClassification[]> {
  const registry = input.registry ?? getDefaultExecutionProviderRegistry();
  const results: RollbackClassification[] = [];

  for (const entry of input.history.entries) {
    const receipt = entry.receipts[0];
    const adapter = registry.resolve(entry.instruction.target.provider);
    if (!receipt) {
      results.push({
        executionId: entry.instruction.executionId,
        provider: entry.instruction.target.provider,
        supportsRollback: adapter.capabilities.supportsRollback,
        rolledBack: false,
        reason: "No receipt to rollback.",
      });
      continue;
    }
    const rollback = await adapter.rollback(receipt, {
      organizationId: input.history.organizationId,
      projectId: input.history.projectId,
      campaignId: input.history.campaignId,
      peerId: entry.instruction.peerId,
      locale: "en",
      correlationId: entry.instruction.correlationId,
      initiatedBy: "system",
      dryRun: input.history.dryRun,
      health: registry.health(entry.instruction.target.provider),
      configRef: registry.configRef(entry.instruction.target.provider),
    });
    results.push({
      executionId: entry.instruction.executionId,
      provider: entry.instruction.target.provider,
      supportsRollback: rollback.supported,
      rolledBack: rollback.rolledBack,
      reason: rollback.reason,
    });
  }

  return results;
}
