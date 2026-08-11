import type {
  ExecutionAuditRecord,
  ExecutionHistoryEntry,
  ExecutionResult,
  ExecutionStatus,
} from "./types";

export function createExecutionAuditRecord(input: {
  entry: ExecutionHistoryEntry;
  result: ExecutionResult;
  initiatedBy: string;
  dryRun: boolean;
  rollbackRef?: string | null;
}): ExecutionAuditRecord {
  const instruction = input.entry.instruction;
  return {
    id: `audit-${instruction.executionId}`,
    executionId: instruction.executionId,
    initiatedBy: input.initiatedBy,
    initiatedAt: instruction.createdAt,
    provider: instruction.target.provider,
    payloadRef: instruction.payload.payloadRef,
    approvalRef: instruction.approvalRef,
    validationRef: instruction.validationRef,
    resultStatus: input.result.status,
    receiptId: input.result.receipt?.id ?? null,
    failureId: input.result.failure?.id ?? null,
    rollbackRef: input.rollbackRef ?? null,
    correlationId: instruction.correlationId,
    idempotencyKey: instruction.idempotencyKey,
    dryRun: input.dryRun,
  };
}

/** Audit records are immutable — returns new array with appended record. */
export function appendAuditRecord(
  existing: readonly ExecutionAuditRecord[],
  record: ExecutionAuditRecord
): readonly ExecutionAuditRecord[] {
  if (existing.some((a) => a.id === record.id)) return existing;
  return Object.freeze([...existing, record]);
}

export function auditStatusLabel(status: ExecutionStatus): string {
  return status.replace(/_/g, " ").toLowerCase();
}
