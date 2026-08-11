import type { ExecutionAttempt, ExecutionHistoryEntry, ExecutionReceipt } from "./types";
import type { ExecutionRepository } from "./execution-repository";

export type IdempotencyLookup = {
  readonly duplicate: boolean;
  readonly priorReceipt: ExecutionReceipt | null;
  readonly priorAttempt: ExecutionAttempt | null;
  readonly priorEntry: ExecutionHistoryEntry | null;
};

export function lookupIdempotentExecution(
  repository: ExecutionRepository,
  input: { organizationId: string; idempotencyKey: string }
): IdempotencyLookup {
  const prior = repository.getByIdempotencyKey(input);
  if (!prior) {
    return { duplicate: false, priorReceipt: null, priorAttempt: null, priorEntry: null };
  }

  const entry =
    prior.history.entries.find((e) => e.instruction.idempotencyKey === input.idempotencyKey) ??
    prior.history.entries[0] ??
    null;
  const lastAttempt = entry?.attempts[entry.attempts.length - 1] ?? null;
  const lastReceipt = entry?.receipts[entry.receipts.length - 1] ?? null;

  return {
    duplicate: true,
    priorReceipt: lastReceipt,
    priorAttempt: lastAttempt,
    priorEntry: entry ?? null,
  };
}

export function canRetryIdempotency(lookup: IdempotencyLookup): boolean {
  if (!lookup.duplicate || !lookup.priorAttempt) return true;
  return lookup.priorAttempt.status === "RETRYABLE" || lookup.priorAttempt.status === "FAILED";
}
