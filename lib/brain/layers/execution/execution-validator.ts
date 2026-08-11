import type { PublicationReadiness } from "../validation/types";
import type { ExecutionBrainInput, ExecutionInstruction } from "./types";

export type ExecutionGateResult =
  | { ok: true }
  | { ok: false; errorCode: string; reason: string };

const EXECUTABLE_READINESS: readonly PublicationReadiness[] = ["READY", "READY_WITH_SUGGESTIONS"];

export function isExecutableValidationState(state: PublicationReadiness): boolean {
  return EXECUTABLE_READINESS.includes(state);
}

export function validateExecutionInput(input: ExecutionBrainInput): ExecutionGateResult {
  if (!input.creativeGraph) {
    return { ok: false, errorCode: "missing_creative_graph", reason: "Creative graph required." };
  }
  if (!input.validationGraph) {
    return { ok: false, errorCode: "missing_validation_graph", reason: "Validation graph required." };
  }
  if (!input.idempotencyKey?.trim()) {
    return { ok: false, errorCode: "missing_idempotency_key", reason: "Idempotency key required." };
  }

  const readiness = input.validationGraph.report.publicationReadiness;
  if (!isExecutableValidationState(readiness)) {
    return {
      ok: false,
      errorCode: "validation_not_ready",
      reason: `Validation state ${readiness} cannot execute.`,
    };
  }

  if (!input.approvalGranted) {
    return {
      ok: false,
      errorCode: "approval_missing",
      reason: "Required approval not completed.",
    };
  }

  const approved = input.validationGraph.report.approvedDeliverables;
  if (approved.length === 0) {
    return {
      ok: false,
      errorCode: "no_approved_deliverables",
      reason: "No approved deliverables to execute.",
    };
  }

  return { ok: true };
}

export function validateInstruction(instruction: ExecutionInstruction): ExecutionGateResult {
  if (!instruction.target.provider) {
    return { ok: false, errorCode: "provider_missing", reason: "Provider missing." };
  }
  if (!instruction.target.destination?.trim()) {
    return { ok: false, errorCode: "destination_missing", reason: "Destination missing." };
  }
  if (!instruction.payload.payloadRef?.trim()) {
    return { ok: false, errorCode: "payload_invalid", reason: "Payload reference invalid." };
  }
  if (!instruction.idempotencyKey?.trim()) {
    return { ok: false, errorCode: "idempotency_missing", reason: "Idempotency key missing." };
  }
  if (!isExecutableValidationState(instruction.validationState)) {
    return {
      ok: false,
      errorCode: "validation_blocked",
      reason: `Validation state ${instruction.validationState} blocks execution.`,
    };
  }
  if (instruction.approvalState !== "granted") {
    return { ok: false, errorCode: "approval_blocked", reason: "Approval not granted." };
  }
  return { ok: true };
}

export function assertProviderEvidence(result: {
  status: string;
  receipt: { externalId: string; providerTimestamp: string; provider: string } | null;
}): ExecutionGateResult {
  if (result.status === "SUCCEEDED" && !result.receipt) {
    return {
      ok: false,
      errorCode: "missing_provider_evidence",
      reason: "Success requires provider receipt.",
    };
  }
  if (result.status === "SUCCEEDED" && result.receipt) {
    if (!result.receipt.externalId || !result.receipt.providerTimestamp) {
      return {
        ok: false,
        errorCode: "incomplete_provider_evidence",
        reason: "Provider receipt missing externalId or providerTimestamp.",
      };
    }
  }
  return { ok: true };
}

/** Reject secrets in persisted payloads — references only. */
export function containsForbiddenSecrets(value: unknown): boolean {
  const forbidden = ["api_key", "apiKey", "oauth", "token", "secret", "password", "authorization"];
  const json = JSON.stringify(value).toLowerCase();
  return forbidden.some((k) => json.includes(k) && !json.includes("configref"));
}
