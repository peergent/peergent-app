import type { BrainRunBudget, BrainUsageMetadata } from "./run-lifecycle";
import type { BrainRuntimeBudgetLimits } from "./run-request";
import type { BrainContextProjection } from "../providers/token-strategy";
import { BrainRunBudgetExceededError } from "./errors";

export type ProviderUsageRecord = {
  providerId: string;
  modelId?: string;
  inputTokens: number;
  outputTokens: number;
  estimatedCostCents: number;
  cacheHit: boolean;
  initialProviderId?: string;
  finalProviderId?: string;
  fallbackReason?: string;
  upstreamStrategyFound?: boolean;
  upstreamChannelsFound?: boolean;
  strategyVersionCompatible?: boolean;
  channelVersionCompatible?: boolean;
  selectedChannelCount?: number;
  businessValidationCategory?: string;
  businessValidationSubreason?: string;
  approvedCanonicalChannels?: string;
  generatedCanonicalChannels?: string;
  unmatchedChannels?: string;
  requestStarted?: boolean;
  validationAttempts?: number;
  validationRepairCount?: number;
  initialRequestDurationMs?: number;
  repairRequestDurationMs?: number;
  fallbackDurationMs?: number;
  timeoutOwner?: string;
  configuredTimeoutMs?: number;
  timeoutAttemptNumber?: number;
  responseHeadersReceived?: boolean;
  responseBodyStarted?: boolean;
};

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
export function recordZeroProviderUsage(providerId: string): ProviderUsageRecord {
  return {
    providerId,
    inputTokens: 0,
    outputTokens: 0,
    estimatedCostCents: 0,
    cacheHit: false,
  };
}

/** Records LLM provider usage from runtime metadata. */
export function recordProviderUsage(
  providerId: string,
  metadata: BrainUsageMetadata
): ProviderUsageRecord {
  return {
    providerId: metadata.finalProviderId ?? metadata.providerId ?? providerId,
    modelId: metadata.modelId,
    inputTokens: metadata.inputTokens ?? 0,
    outputTokens: metadata.outputTokens ?? 0,
    estimatedCostCents: metadata.estimatedCostCents ?? 0,
    cacheHit: metadata.cacheHit ?? false,
    initialProviderId: metadata.initialProviderId ?? providerId,
    finalProviderId: metadata.finalProviderId ?? metadata.providerId ?? providerId,
    fallbackReason: metadata.fallbackReason,
    upstreamStrategyFound: metadata.upstreamStrategyFound,
    upstreamChannelsFound: metadata.upstreamChannelsFound,
    strategyVersionCompatible: metadata.strategyVersionCompatible,
    channelVersionCompatible: metadata.channelVersionCompatible,
    selectedChannelCount: metadata.selectedChannelCount,
    businessValidationCategory: metadata.businessValidationCategory,
    businessValidationSubreason: metadata.businessValidationSubreason,
    approvedCanonicalChannels: metadata.approvedCanonicalChannels,
    generatedCanonicalChannels: metadata.generatedCanonicalChannels,
    unmatchedChannels: metadata.unmatchedChannels,
    requestStarted: metadata.requestStarted,
    validationAttempts: metadata.validationAttempts,
    validationRepairCount: metadata.validationRepairCount,
    initialRequestDurationMs: metadata.initialRequestDurationMs,
    repairRequestDurationMs: metadata.repairRequestDurationMs,
    fallbackDurationMs: metadata.fallbackDurationMs,
    timeoutOwner: metadata.timeoutOwner,
    configuredTimeoutMs: metadata.configuredTimeoutMs,
    timeoutAttemptNumber: metadata.timeoutAttemptNumber,
    responseHeadersReceived: metadata.responseHeadersReceived,
    responseBodyStarted: metadata.responseBodyStarted,
  };
}
