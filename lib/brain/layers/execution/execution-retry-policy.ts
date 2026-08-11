import type { ExecutionFailure, ExecutionFailureClass, ExecutionStatus } from "./types";

export type RetryDecision = {
  readonly retryable: boolean;
  readonly failureClass: ExecutionFailureClass;
  readonly maxAttemptsReached: boolean;
};

export const DEFAULT_MAX_ATTEMPTS = 3;

export function classifyFailure(input: {
  failureClass: ExecutionFailureClass;
  attemptNumber: number;
  maxAttempts?: number;
}): RetryDecision {
  const max = input.maxAttempts ?? DEFAULT_MAX_ATTEMPTS;
  const retryableClasses: ExecutionFailureClass[] = [
    "RETRYABLE",
    "RATE_LIMITED",
    "PROVIDER_UNAVAILABLE",
    "UNKNOWN",
  ];
  const retryable =
    retryableClasses.includes(input.failureClass) && input.attemptNumber < max;

  return {
    retryable,
    failureClass: input.failureClass,
    maxAttemptsReached: input.attemptNumber >= max,
  };
}

export function statusFromFailure(failure: ExecutionFailure, attemptNumber: number): ExecutionStatus {
  const decision = classifyFailure({
    failureClass: failure.failureClass,
    attemptNumber,
  });
  return decision.retryable ? "RETRYABLE" : "FAILED";
}

export function aggregateOverallStatus(statuses: readonly ExecutionStatus[]): ExecutionStatus {
  if (statuses.length === 0) return "FAILED";
  const succeeded = statuses.filter((s) => s === "SUCCEEDED").length;
  const failed = statuses.filter((s) => s === "FAILED" || s === "CANCELLED").length;
  const retryable = statuses.some((s) => s === "RETRYABLE");
  const partial = statuses.some((s) => s === "PARTIALLY_SUCCEEDED");

  if (succeeded === statuses.length) return "SUCCEEDED";
  if (retryable) return "RETRYABLE";
  if (partial || (succeeded > 0 && failed > 0)) return "PARTIALLY_SUCCEEDED";
  if (succeeded > 0 && failed > 0) return "PARTIALLY_SUCCEEDED";
  return "FAILED";
}
