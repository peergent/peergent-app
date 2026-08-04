import "server-only";

import { BrainLlmError, BrainLlmMissingKeyError, BrainLlmParseError, BrainLlmValidationError, BrainLlmBusinessValidationError, BrainLlmValidationRetryExhaustedError, BrainLlmTimeoutError } from "./errors";
import { isBrainUseOpenAIEnabled } from "../config/brain-feature-flags";
import { getOpenAIApiKey } from "@/lib/ai-runtime/env";

export type BrainLlmFailureCategory =
  | "feature_flag_disabled"
  | "missing_api_key"
  | "llm_not_registered"
  | "llm_not_selected"
  | "missing_projection"
  | "missing_execution_context"
  | "prompt_build_failed"
  | "request_not_started"
  | "authentication_failed"
  | "model_not_available"
  | "rate_limited"
  | "quota_exceeded"
  | "request_timeout"
  | "provider_http_error"
  | "json_parse_failed"
  | "malformed_response"
  | "schema_validation_failed"
  | "business_validation_failed"
  | "missing_strategy_output"
  | "missing_channel_output"
  | "no_selected_channels"
  | "stale_strategy_output"
  | "stale_channel_output"
  | "missing_campaign_goal"
  | "missing_target_audience"
  | "missing_offer_context"
  | "approved_without_output"
  | "persistence_failed"
  | "unknown_provider_error";

export type BrainLlmAttemptDiagnostics = {
  failureCategory?: BrainLlmFailureCategory;
  initialProvider: string;
  finalProvider: string;
  fallbackUsed: boolean;
  fallbackReason?: BrainLlmFailureCategory;
  llmRegistered?: boolean;
  featureFlagEnabled?: boolean;
  apiKeyPresent?: boolean;
  resolvedModel?: string;
  providerInitiallySelected?: string;
  requestStarted?: boolean;
  httpStatus?: number;
  validationAttempts?: number;
  upstreamStrategyFound?: boolean;
  upstreamChannelsFound?: boolean;
  strategyVersionCompatible?: boolean;
  channelVersionCompatible?: boolean;
  selectedChannelCount?: number;
  businessValidationCategory?: BrainLlmFailureCategory;
  businessValidationSubreason?: string;
  approvedCanonicalChannels?: string;
  generatedCanonicalChannels?: string;
  unmatchedChannels?: string;
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

export function classifyPreLlmSkip(input: {
  useOpenAI: boolean;
  hasProjection: boolean;
  hasExecutionContext: boolean;
  llmRegistered: boolean;
  hasCustomLlmProvider?: boolean;
  providerInitiallySelected: string;
}): BrainLlmFailureCategory | null {
  if (input.providerInitiallySelected !== "llm") {
    if (!input.llmRegistered) return "llm_not_registered";
    if (!input.useOpenAI) return "feature_flag_disabled";
    return "llm_not_selected";
  }
  if (!input.useOpenAI) return "feature_flag_disabled";
  if (!input.hasCustomLlmProvider && !getOpenAIApiKey()) return "missing_api_key";
  if (!input.hasProjection) return "missing_projection";
  if (!input.hasExecutionContext) return "missing_execution_context";
  return null;
}

export function classifyBrainLlmError(error: unknown): BrainLlmFailureCategory {
  if (error instanceof BrainLlmMissingKeyError) return "missing_api_key";
  if (error instanceof BrainLlmTimeoutError) return "request_timeout";
  if (error instanceof BrainLlmValidationRetryExhaustedError) return error.failureCategory;
  if (error instanceof BrainLlmBusinessValidationError) return "business_validation_failed";
  if (error instanceof BrainLlmValidationError) return "schema_validation_failed";
  if (error instanceof BrainLlmParseError) return "json_parse_failed";
  if (error instanceof BrainLlmError) {
    if (error.code === "timeout") return "request_timeout";
    if (error.code === "validation_failed") return "schema_validation_failed";
    if (error.statusCode === 401 || error.statusCode === 403) return "authentication_failed";
    if (error.statusCode === 404) return "model_not_available";
    if (error.statusCode === 429) return "rate_limited";
    if (error.statusCode === 402) return "quota_exceeded";
    if (error.statusCode !== undefined) return "provider_http_error";
    return "unknown_provider_error";
  }
  return "unknown_provider_error";
}

export function readBrainLlmEnvFlags(): Pick<
  BrainLlmAttemptDiagnostics,
  "featureFlagEnabled" | "apiKeyPresent"
> {
  return {
    featureFlagEnabled: isBrainUseOpenAIEnabled(),
    apiKeyPresent: Boolean(getOpenAIApiKey()),
  };
}
