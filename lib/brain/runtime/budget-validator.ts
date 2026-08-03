import type { BrainRunBudget } from "./run-lifecycle";
import type { BrainRuntimeBudgetLimits } from "./run-request";
import type { BrainContextProjection } from "../providers/token-strategy";
import { BrainRunBudgetExceededError } from "./errors";

export type BudgetValidationResult = {
  allowed: boolean;
  reasons: readonly string[];
};

export function validateRuntimeBudget(input: {
  limits?: BrainRuntimeBudgetLimits;
  budget: BrainRunBudget;
  projection: BrainContextProjection;
  orgRunCount: number;
  childRunCount: number;
  providerId: string;
}): BudgetValidationResult {
  const reasons: string[] = [];
  const { limits } = input;

  if (limits?.maxRuns != null && input.orgRunCount >= limits.maxRuns) {
    reasons.push(`Maximum runs (${limits.maxRuns}) reached for organization.`);
  }

  if (limits?.maxChildRuns != null && input.childRunCount >= limits.maxChildRuns) {
    reasons.push(`Maximum child runs (${limits.maxChildRuns}) reached.`);
  }

  if (
    limits?.maxInputTokens != null &&
    input.projection.estimatedTokens > limits.maxInputTokens
  ) {
    reasons.push(
      `Estimated input tokens (${input.projection.estimatedTokens}) exceed limit (${limits.maxInputTokens}).`
    );
  }

  if (
    limits?.maxEstimatedCostCents != null &&
    (input.budget.costCentsUsed ?? 0) > limits.maxEstimatedCostCents
  ) {
    reasons.push("Estimated cost exceeds budget limit.");
  }

  if (
    limits?.allowedProviderIds?.length &&
    !limits.allowedProviderIds.includes(input.providerId)
  ) {
    reasons.push(`Provider "${input.providerId}" is not allowed for this run.`);
  }

  return { allowed: reasons.length === 0, reasons };
}

export function assertBudgetAllowed(result: BudgetValidationResult): void {
  if (!result.allowed) {
    throw new BrainRunBudgetExceededError(result.reasons.join(" "));
  }
}

export function createRunBudget(limits?: BrainRuntimeBudgetLimits): BrainRunBudget {
  return {
    maxTokens: limits?.maxInputTokens,
    maxCostCents: limits?.maxEstimatedCostCents,
    tokensUsed: 0,
    costCentsUsed: 0,
  };
}

/** Deterministic providers record zero cost honestly. */
export function recordZeroProviderUsage(providerId: string): {
  providerId: string;
  inputTokens: number;
  outputTokens: number;
  estimatedCostCents: number;
  cacheHit: boolean;
} {
  return {
    providerId,
    inputTokens: 0,
    outputTokens: 0,
    estimatedCostCents: 0,
    cacheHit: false,
  };
}
