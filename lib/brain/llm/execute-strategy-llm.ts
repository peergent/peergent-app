import "server-only";

import type { BrainCapabilityId } from "../capabilities/registry";
import { getBrainCapability } from "../capabilities/registry";
import type { BrainStructuredOutput } from "../evidence/structured-output";
import type { BrainUsageMetadata } from "../runtime/run-lifecycle";
import type { BrainSnapshot } from "../context/snapshot";
import type { CompanySnapshot } from "../company/snapshot";
import type { CapabilityExecutionContext } from "../capabilities/execution-context";
import type { BrainContextProjection } from "../providers/token-strategy";
import { createBrainLlmClient } from "../llm/client";
import { createLlmRequest } from "../llm/request";
import { STRATEGY_LLM_JSON_SCHEMA } from "../llm/json-schema";
import {
  mapStrategyPayloadToBrainOutput,
  validateStrategyLlmPayload,
} from "../llm/response-validator";
import { buildPromptCacheKey, getCachedPromptContext, setCachedPromptContext } from "../llm/prompt-cache";
import { strategyPromptBuilder } from "../prompts/strategy-prompt-builder";
import { buildStrategyProjectedContext } from "../prompts/projected-context";
import { executeDeterministicCapability } from "../providers/deterministic-provider";
import type { BrainLlmProvider } from "../llm/provider";
import type { BrainRunContext } from "../context/run-context";
import { logBrainExecutionDev } from "../integration/brain-execution-logger";
import { markOfficeLlmTrace } from "../integration/office-llm-trace";
import {
  classifyBrainLlmError,
  type BrainLlmFailureCategory,
  type BrainLlmAttemptDiagnostics,
} from "../llm/failure-categories";
import { readBrainLlmEnvFlags } from "../llm/failure-categories";
import { getOpenAIModel } from "@/lib/ai-runtime/env";
import {
  BrainLlmBusinessValidationError,
  BrainLlmValidationRetryExhaustedError,
  BrainLlmTimeoutError,
} from "../llm/errors";
import type { BrainLlmUsage } from "../llm/types";

export type StrategyLlmExecutionInput = {
  context: BrainRunContext;
  snapshot: BrainSnapshot;
  companySnapshot: CompanySnapshot;
  executionContext: CapabilityExecutionContext;
  projection: BrainContextProjection;
  llmProvider?: BrainLlmProvider;
};

export type StrategyLlmExecutionResult = {
  output: BrainStructuredOutput;
  usage?: BrainUsageMetadata;
  usedLlm: boolean;
  fallbackReason?: BrainLlmFailureCategory;
  diagnostics?: BrainLlmAttemptDiagnostics;
};

type ProviderInput = {
  context: BrainRunContext;
  snapshot: BrainSnapshot;
  capabilityId: BrainCapabilityId;
  companySnapshot?: CompanySnapshot;
  executionContext?: CapabilityExecutionContext;
};

function fallbackUsage(
  category: BrainLlmFailureCategory,
  overrides?: Partial<BrainUsageMetadata>
): BrainUsageMetadata {
  return {
    providerId: "deterministic",
    initialProviderId: "llm",
    finalProviderId: "deterministic",
    fallbackReason: category,
    inputTokens: 0,
    outputTokens: 0,
    ...overrides,
  };
}

function extractValidationFailure(error: unknown): {
  category: BrainLlmFailureCategory;
  businessValidationSubreason?: string;
  validationAttempts?: number;
  validationRepairCount?: number;
  failedUsage?: BrainLlmUsage;
} {
  if (error instanceof BrainLlmValidationRetryExhaustedError) {
    const subreason =
      error.structuredIssues?.[0]?.code ??
      (error.failureCategory === "business_validation_failed" ? "business_validation_failed" : undefined);
    return {
      category: error.failureCategory,
      businessValidationSubreason: subreason,
      validationAttempts: error.attemptCount,
      validationRepairCount: error.validationRepairCount,
      failedUsage: error.lastUsage,
    };
  }
  if (error instanceof BrainLlmBusinessValidationError) {
    return {
      category: "business_validation_failed",
      businessValidationSubreason: error.structuredIssues[0]?.code,
    };
  }
  if (error instanceof BrainLlmTimeoutError) {
    return {
      category: "request_timeout",
      validationRepairCount: 0,
      validationAttempts: 1,
    };
  }
  if (error instanceof Error && error.message === "prompt_build_failed") {
    return { category: "prompt_build_failed" };
  }
  return { category: classifyBrainLlmError(error) };
}

function llmAttemptStarted(category: BrainLlmFailureCategory): boolean {
  return (
    category !== "missing_api_key" &&
    category !== "feature_flag_disabled" &&
    category !== "missing_execution_context" &&
    category !== "request_not_started" &&
    category !== "prompt_build_failed"
  );
}

function usageFromFailedLlmAttempt(input: {
  category: BrainLlmFailureCategory;
  llmUsage?: BrainLlmUsage;
  validationAttempts?: number;
  validationRepairCount?: number;
  businessValidationSubreason?: string;
  initialRequestDurationMs?: number;
  fallbackDurationMs?: number;
}): BrainUsageMetadata {
  return fallbackUsage(input.category, {
    modelId: input.llmUsage?.model ?? getOpenAIModel(),
    inputTokens: input.llmUsage?.inputTokens ?? 0,
    outputTokens: input.llmUsage?.outputTokens ?? 0,
    estimatedCostCents: input.llmUsage?.estimatedCostCents,
    requestStarted: true,
    businessValidationCategory: input.category,
    businessValidationSubreason: input.businessValidationSubreason,
    validationAttempts: input.validationAttempts,
    validationRepairCount: input.validationRepairCount,
    initialRequestDurationMs: input.initialRequestDurationMs,
    fallbackDurationMs: input.fallbackDurationMs,
  });
}

export async function executeStrategyViaLlm(
  input: StrategyLlmExecutionInput
): Promise<StrategyLlmExecutionResult> {
  markOfficeLlmTrace("LLM_EXECUTE_ENTER");
  const def = getBrainCapability("strategy");
  let projected;
  try {
    projected = buildStrategyProjectedContext({
      snapshot: input.snapshot,
      companySnapshot: input.companySnapshot,
      executionContext: input.executionContext,
      projection: input.projection,
    });
  } catch {
    throw new Error("prompt_build_failed");
  }

  const prompts = strategyPromptBuilder.build({
    context: projected,
    locale: input.executionContext.locale,
  });
  markOfficeLlmTrace("PROMPT_BUILT", { model: getOpenAIModel() });

  const cacheKey = buildPromptCacheKey({
    capabilityId: "strategy",
    capabilityVersion: def.version,
    contextHash: input.projection.contextHash,
  });

  const cached = getCachedPromptContext(cacheKey);
  const systemPrompt = cached?.systemPrompt ?? prompts.systemPrompt;
  const userPrompt = cached?.userPrompt ?? prompts.userPrompt;

  if (!cached) {
    setCachedPromptContext(cacheKey, { systemPrompt, userPrompt });
  }

  const client = createBrainLlmClient(input.llmProvider);
  const request = createLlmRequest({
    capabilityId: "strategy",
    capabilityVersion: def.version,
    systemPrompt,
    userPrompt,
    jsonSchema: STRATEGY_LLM_JSON_SCHEMA as unknown as Record<string, unknown>,
    contextHash: input.projection.contextHash,
  });

  const knownCompetitors = input.companySnapshot.profile.mainCompetitors.value ?? [];

  markOfficeLlmTrace("OPENAI_FETCH_STARTED");
  let validationAttempts = 0;
  const { result, response } = await client.completeWithValidationRetry(request, (parsed) => {
    validationAttempts += 1;
    return validateStrategyLlmPayload(parsed, {
      capabilityVersion: def.version,
      knownCompetitors,
      companyName: input.companySnapshot.profile.companyName.value ?? input.executionContext.campaignContext?.companyName,
      organizationId: input.context.organizationId,
      campaignId: input.executionContext.campaignContext?.projectId,
      requireQualityCheck: Boolean(input.executionContext.reasoningGraph),
    });
  });
  markOfficeLlmTrace("OPENAI_FETCH_COMPLETED", {
    httpStatus: 200,
    inputTokens: response.usage.inputTokens,
    outputTokens: response.usage.outputTokens,
  });
  markOfficeLlmTrace("RESPONSE_PARSED");
  markOfficeLlmTrace("VALIDATION_COMPLETED", { validationAttempts });

  const generatedAt = new Date().toISOString();
  const output = mapStrategyPayloadToBrainOutput(result, {
    capabilityVersion: def.version,
    generatedAt,
    provenanceRef: `llm:strategy:${input.context.organizationId}`,
  });

  return {
    output,
    usedLlm: true,
    usage: {
      providerId: "llm",
      initialProviderId: "llm",
      finalProviderId: "llm",
      modelId: response.usage.model,
      inputTokens: response.usage.inputTokens,
      outputTokens: response.usage.outputTokens,
      estimatedCostCents: response.usage.estimatedCostCents,
      cacheHit: Boolean(cached),
      fallbackReason: undefined,
    },
    diagnostics: {
      initialProvider: "llm",
      finalProvider: "llm",
      fallbackUsed: false,
      featureFlagEnabled: readBrainLlmEnvFlags().featureFlagEnabled,
      apiKeyPresent: readBrainLlmEnvFlags().apiKeyPresent,
      resolvedModel: response.usage.model,
      providerInitiallySelected: "llm",
      requestStarted: true,
      validationAttempts,
    },
  };
}

export async function executeStrategyWithLlmFallback(
  providerInput: ProviderInput & {
    projection: BrainContextProjection;
    llmProvider?: BrainLlmProvider;
  }
): Promise<StrategyLlmExecutionResult> {
  const envFlags = readBrainLlmEnvFlags();
  const baseDiagnostics: BrainLlmAttemptDiagnostics = {
    initialProvider: "llm",
    finalProvider: "deterministic",
    fallbackUsed: true,
    llmRegistered: true,
    providerInitiallySelected: "llm",
    ...envFlags,
    resolvedModel: getOpenAIModel(),
  };

  if (!providerInput.executionContext || !providerInput.companySnapshot) {
    const category: BrainLlmFailureCategory = "missing_execution_context";
    markOfficeLlmTrace("FALLBACK_STARTED", { category });
    markOfficeLlmTrace("FALLBACK_COMPLETED", { category });
    return {
      output: executeDeterministicCapability(providerInput),
      usedLlm: false,
      fallbackReason: category,
      usage: fallbackUsage(category),
      diagnostics: { ...baseDiagnostics, fallbackReason: category, requestStarted: false },
    };
  }

  const startedAt = new Date().toISOString();
  const startedMs = Date.now();

  try {
    const llmResult = await executeStrategyViaLlm({
      context: providerInput.context,
      snapshot: providerInput.snapshot,
      companySnapshot: providerInput.companySnapshot,
      executionContext: providerInput.executionContext,
      projection: providerInput.projection,
      llmProvider: providerInput.llmProvider,
    });
    logBrainExecutionDev({
      runId: providerInput.context.requestId,
      capability: "strategy",
      environment: providerInput.context.environment,
      providerSelected: "llm",
      model: llmResult.usage?.modelId,
      requestStartedAt: startedAt,
      requestCompletedAt: new Date().toISOString(),
      inputTokens: llmResult.usage?.inputTokens,
      outputTokens: llmResult.usage?.outputTokens,
      latencyMs: Date.now() - startedMs,
      validationResult: "valid",
      fallbackUsed: false,
    });
    return llmResult;
  } catch (error) {
    const failure = extractValidationFailure(error);
    const category = failure.category;
    const httpStatus = error instanceof Error && "statusCode" in error ? (error as { statusCode?: number }).statusCode : undefined;
    const fallbackStartedMs = Date.now();
    const totalDurationMs = Date.now() - startedMs;
    const requestStarted = llmAttemptStarted(category);
    markOfficeLlmTrace("FALLBACK_STARTED", { category, httpStatus: httpStatus ?? null });
    markOfficeLlmTrace("FALLBACK_COMPLETED", { category, httpStatus: httpStatus ?? null });
    logBrainExecutionDev({
      runId: providerInput.context.requestId,
      capability: "strategy",
      environment: providerInput.context.environment,
      providerSelected: "llm",
      requestStartedAt: startedAt,
      requestCompletedAt: new Date().toISOString(),
      latencyMs: totalDurationMs,
      validationResult: "invalid",
      fallbackUsed: true,
      fallbackReason: category,
    });
    const fallbackDurationMs = Date.now() - fallbackStartedMs;
    return {
      output: executeDeterministicCapability(providerInput),
      usedLlm: false,
      fallbackReason: category,
      usage: requestStarted
        ? usageFromFailedLlmAttempt({
            category,
            llmUsage: failure.failedUsage,
            validationAttempts: failure.validationAttempts,
            validationRepairCount: failure.validationRepairCount,
            businessValidationSubreason: failure.businessValidationSubreason,
            initialRequestDurationMs: totalDurationMs,
            fallbackDurationMs,
          })
        : fallbackUsage(category, {
            modelId: getOpenAIModel(),
            businessValidationCategory: category,
            businessValidationSubreason: failure.businessValidationSubreason,
          }),
      diagnostics: {
        ...baseDiagnostics,
        fallbackReason: category,
        requestStarted,
        httpStatus,
        validationAttempts: failure.validationAttempts,
        validationRepairCount: failure.validationRepairCount,
        initialRequestDurationMs: totalDurationMs,
        fallbackDurationMs,
        businessValidationCategory: category,
        businessValidationSubreason: failure.businessValidationSubreason,
      },
    };
  }
}
