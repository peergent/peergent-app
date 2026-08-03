import type { BrainRunRecord } from "../runtime/repositories/contracts";
import { isTerminalBrainRunStatus } from "../runtime/run-lifecycle";
import type { BrainRecoveryAssessment, BrainRecoveryClassification } from "./types";

const STALE_MS = 15 * 60 * 1000;

export function classifyBrainRunRecovery(run: BrainRunRecord, now = Date.now()): BrainRecoveryAssessment {
  const classification = classifyStatus(run, now);
  return {
    runId: run.id,
    status: run.status,
    classification,
    reason: reasonForClassification(run, classification, now),
  };
}

function classifyStatus(run: BrainRunRecord, now: number): BrainRecoveryClassification {
  if (run.status === "waiting_for_input") return "requires_customer_input";
  if (run.status === "waiting_for_approval") return "requires_approval";
  if (run.status === "failed") return "retryable";
  if (run.status === "cancelled" || run.status === "blocked") return "terminal";
  if (isTerminalBrainRunStatus(run.status)) return "terminal";

  const age = now - Date.parse(run.updatedAt);
  if ((run.status === "queued" || run.status === "running") && age > STALE_MS) {
    return "operator_review_required";
  }

  if (run.status === "queued" || run.status === "gathering_context" || run.status === "ready") {
    return "safe_to_resume";
  }

  if (run.status === "running") return "operator_review_required";
  return "terminal";
}

function reasonForClassification(
  run: BrainRunRecord,
  classification: BrainRecoveryClassification,
  now: number
): string {
  switch (classification) {
    case "requires_customer_input":
      return run.errorMessage ?? "Run is waiting for customer input.";
    case "requires_approval":
      return "Run is waiting for approval.";
    case "retryable":
      return run.errorMessage ?? "Run failed and may be retried.";
    case "safe_to_resume":
      return "Run may be resumed safely.";
    case "operator_review_required":
      return `Run appears stale (last update ${Math.round((now - Date.parse(run.updatedAt)) / 1000)}s ago).`;
    case "terminal":
    default:
      return "Run is in a terminal state.";
  }
}
