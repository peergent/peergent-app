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
import { createCreativeGenerationLlmRequest, measureCreativeGenerationRequestSize, CREATIVE_GENERATION_CAPABILITY_TIMEOUT_MS } from "../llm/creative-generation-llm-config";
import { runWithBoundedTimeout } from "@/lib/office/campaign/strategy-run-timeout";
import { BrainLlmTimeoutError } from "../llm/errors";
import { CREATIVE_GENERATION_LLM_JSON_SCHEMA } from "../llm/json-schema";
import {
  mapCreativeGenerationPayloadToBrainOutput,
  validateCreativeGenerationLlmPayload,
} from "../llm/creative-generation-response-validator";
import { buildPromptCacheKey, getCachedPromptContext, setCachedPromptContext } from "../llm/prompt-cache";
import { creativeGenerationPromptBuilder } from "../prompts/creative-generation-prompt-builder";
import { buildCreativeGenerationProjectedContext } from "../prompts/projected-context";
import { executeDeterministicCapability } from "../providers/deterministic-provider";
import type { BrainLlmProvider } from "../llm/provider";
import type { BrainRunContext } from "../context/run-context";
import { logBrainExecutionDev } from "../integration/brain-execution-logger";
import { markOfficeLlmTrace } from "../integration/office-llm-trace";
import {
  classifyBrainLlmError,
  readBrainLlmEnvFlags,
  type BrainLlmFailureCategory,
  type BrainLlmAttemptDiagnostics,
} from "../llm/failure-categories";
import {
  extractApprovedChannelsForCreativePlanning,
  validateCreativeGenerationUpstream,
  type CreativeGenerationValidationCategory,
} from "./creative-planning-upstream";
import { BrainLlmValidationRetryExhaustedError, BrainLlmBusinessValidationError } from "../llm/errors";
import type { BrainLlmUsage } from "../llm/types";
import { getOpenAIModel } from "@/lib/ai-runtime/env";
import {
  canonicalizeApprovedChannels,
  collectGeneratedChannels,
  summarizeBusinessValidationIssues,
} from "./creative-generation-business-validation";
import { channelMatchesApprovedSelection, normalizeCreativeChannelId, type CreativeChannelId } from "./creative-generation-contract";

export type CreativeGenerationLlmExecutionInput = {
  context: BrainRunContext;
  snapshot: BrainSnapshot;
  companySnapshot: CompanySnapshot;
  executionContext: CapabilityExecutionContext;
  projection: BrainContextProjection;
  llmProvider?: BrainLlmProvider;
};

export type CreativeGenerationLlmExecutionResult = {
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

function buildUpstreamDiagnostics(
  executionContext: CapabilityExecutionContext,
  phase: "ready" | "blocked"
): BrainLlmAttemptDiagnostics {
  const channelsStepApproved =
    executionContext.campaignContext?.stepApprovals?.channels_selected === "approved";
  const validation = validateCreativeGenerationUpstream({
    executionContext,
    storedContextVersion: executionContext.campaignContext?.contextVersion,
    channelsStepApproved,
  });

  return {
    initialProvider: "llm",
    finalProvider: phase === "ready" ? "llm" : "deterministic",
    fallbackUsed: phase === "blocked",
    llmRegistered: true,
    providerInitiallySelected: "llm",
    ...readBrainLlmEnvFlags(),
    resolvedModel: getOpenAIModel(),
    upstreamStrategyFound: validation.diagnostics.upstreamStrategyFound,
    upstreamChannelsFound: validation.diagnostics.upstreamChannelsFound,
    strategyVersionCompatible: validation.diagnostics.strategyVersionCompatible,
    channelVersionCompatible: validation.diagnostics.channelVersionCompatible,
    selectedChannelCount: validation.diagnostics.selectedChannelCount,
    businessValidationCategory: validation.category,
  };
}

function validateUpstreamForCreativeGeneration(executionContext: CapabilityExecutionContext): {
  ok: boolean;
  category?: CreativeGenerationValidationCategory;
  approvedChannelIds: string[];
  diagnostics: BrainLlmAttemptDiagnostics;
} {
  const channelsStepApproved =
    executionContext.campaignContext?.stepApprovals?.channels_selected === "approved";
  const validation = validateCreativeGenerationUpstream({
    executionContext,
    storedContextVersion: executionContext.campaignContext?.contextVersion,
    channelsStepApproved,
  });

  const diagnostics = buildUpstreamDiagnostics(
    executionContext,
    validation.ok ? "ready" : "blocked"
  );

  return {
    ok: validation.ok,
    category: validation.category,
    approvedChannelIds: validation.approvedChannelIds,
    diagnostics,
  };
}

function usageFromFailedLlmAttempt(input: {
  category: BrainLlmFailureCategory;
  llmUsage?: BrainLlmUsage;
  upstream: BrainLlmAttemptDiagnostics;
  validationAttempts?: number;
  validationRepairCount?: number;
  businessValidationSubreason?: string;
  approvedCanonicalChannels?: string;
  generatedCanonicalChannels?: string;
  unmatchedChannels?: string;
  initialRequestDurationMs?: number;
  repairRequestDurationMs?: number;
  fallbackDurationMs?: number;
  timeoutOwner?: string;
  configuredTimeoutMs?: number;
  timeoutAttemptNumber?: number;
  responseHeadersReceived?: boolean;
  responseBodyStarted?: boolean;
}): BrainUsageMetadata {
  return fallbackUsage(input.category, {
    modelId: input.llmUsage?.model ?? getOpenAIModel(),
    inputTokens: input.llmUsage?.inputTokens ?? 0,
    outputTokens: input.llmUsage?.outputTokens ?? 0,
    estimatedCostCents: input.llmUsage?.estimatedCostCents,
    requestStarted: true,
    upstreamStrategyFound: input.upstream.upstreamStrategyFound,
    upstreamChannelsFound: input.upstream.upstreamChannelsFound,
    strategyVersionCompatible: input.upstream.strategyVersionCompatible,
    channelVersionCompatible: input.upstream.channelVersionCompatible,
    selectedChannelCount: input.upstream.selectedChannelCount,
    businessValidationCategory: input.category,
    businessValidationSubreason: input.businessValidationSubreason,
    approvedCanonicalChannels: input.approvedCanonicalChannels,
    generatedCanonicalChannels: input.generatedCanonicalChannels,
    unmatchedChannels: input.unmatchedChannels,
    validationAttempts: input.validationAttempts,
    validationRepairCount: input.validationRepairCount,
    initialRequestDurationMs: input.initialRequestDurationMs,
    repairRequestDurationMs: input.repairRequestDurationMs,
    fallbackDurationMs: input.fallbackDurationMs,
    timeoutOwner: input.timeoutOwner,
    configuredTimeoutMs: input.configuredTimeoutMs,
    timeoutAttemptNumber: input.timeoutAttemptNumber,
    responseHeadersReceived: input.responseHeadersReceived,
    responseBodyStarted: input.responseBodyStarted,
  });
}

function channelDiagnosticsForAttempt(approvedChannels: readonly string[], generatedChannels: readonly string[]) {
  const approvedCanonical = canonicalizeApprovedChannels(approvedChannels);
  const generatedCanonical = [
    ...new Set(
      generatedChannels
        .map((channel) => normalizeCreativeChannelId(channel))
        .filter(Boolean) as CreativeChannelId[]
    ),
  ];
  const unmatched = generatedCanonical.filter(
    (channel) => !channelMatchesApprovedSelection(channel, approvedCanonical)
  );
  return {
    approvedCanonicalChannels: approvedCanonical.join(", "),
    generatedCanonicalChannels: generatedCanonical.join(", "),
    unmatchedChannels: unmatched.join(", "),
  };
}

function extractTimeoutDiagnostics(error: unknown): Partial<BrainLlmAttemptDiagnostics> {
  if (!(error instanceof BrainLlmTimeoutError)) {
    if (error instanceof Error && error.message === "creative_generation_capability_timeout") {
      return {
        timeoutOwner: "creative_generation_capability_envelope",
        configuredTimeoutMs: CREATIVE_GENERATION_CAPABILITY_TIMEOUT_MS,
        timeoutAttemptNumber: 1,
        validationRepairCount: 0,
      };
    }
    return { validationRepairCount: 0 };
  }
  return {
    timeoutOwner: error.timeoutDiagnostics.timeoutOwner,
    configuredTimeoutMs: error.timeoutDiagnostics.configuredTimeoutMs,
    timeoutAttemptNumber: error.timeoutDiagnostics.attemptNumber,
    responseHeadersReceived: error.timeoutDiagnostics.responseHeadersReceived,
    responseBodyStarted: error.timeoutDiagnostics.responseBodyStarted,
    validationRepairCount: 0,
  };
}

function extractValidationFailure(error: unknown): {
  category: BrainLlmFailureCategory;
  businessValidationSubreason?: string;
  validationAttempts?: number;
  validationRepairCount?: number;
  failedUsage?: BrainLlmUsage;
  generatedChannelIds?: readonly string[];
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
      generatedChannelIds: error.generatedChannelIds,
    };
  }
  if (error instanceof BrainLlmBusinessValidationError) {
    return {
      category: "business_validation_failed",
      businessValidationSubreason: summarizeBusinessValidationIssues(error.structuredIssues),
      failedUsage: undefined,
    };
  }
  if (error instanceof BrainLlmTimeoutError) {
    return {
      category: "request_timeout",
      validationRepairCount: 0,
      validationAttempts: 1,
    };
  }
  if (error instanceof Error && error.message === "creative_generation_capability_timeout") {
    return {
      category: "request_timeout",
      validationRepairCount: 0,
      validationAttempts: 1,
    };
  }
  return {
    category: classifyCreativeGenerationFailure(error),
  };
}

function classifyCreativeGenerationFailure(error: unknown): BrainLlmFailureCategory {
  if (
    error instanceof Error &&
    [
      "missing_strategy_output",
      "missing_channel_output",
      "no_selected_channels",
      "stale_strategy_output",
      "stale_channel_output",
      "missing_campaign_goal",
      "missing_target_audience",
      "missing_offer_context",
      "approved_without_output",
      "missing_upstream_plans",
      "prompt_build_failed",
    ].includes(error.message)
  ) {
    return error.message as BrainLlmFailureCategory;
  }
  return classifyBrainLlmError(error);
}

function llmAttemptStarted(category: BrainLlmFailureCategory): boolean {
  return (
    category !== "missing_api_key" &&
    category !== "feature_flag_disabled" &&
    category !== "missing_execution_context" &&
    category !== "request_not_started" &&
    ![
      "missing_strategy_output",
      "missing_channel_output",
      "no_selected_channels",
      "stale_strategy_output",
      "stale_channel_output",
      "missing_campaign_goal",
      "missing_target_audience",
      "missing_offer_context",
      "approved_without_output",
    ].includes(category)
  );
}

export async function executeCreativeGenerationViaLlm(
  input: CreativeGenerationLlmExecutionInput
): Promise<CreativeGenerationLlmExecutionResult> {
  markOfficeLlmTrace("LLM_EXECUTE_ENTER");
  const def = getBrainCapability("creative_generation");
  const upstream = validateUpstreamForCreativeGeneration(input.executionContext);

  if (!upstream.ok) {
    throw new Error(upstream.category ?? "missing_upstream_plans");
  }

  let projected;
  try {
    projected = buildCreativeGenerationProjectedContext({
      snapshot: input.snapshot,
      companySnapshot: input.companySnapshot,
      executionContext: input.executionContext,
      projection: input.projection,
    });
  } catch {
    throw new Error("prompt_build_failed");
  }

  const prompts = creativeGenerationPromptBuilder.build({
    context: projected,
    locale: input.executionContext.locale,
  });
  markOfficeLlmTrace("PROMPT_BUILT", { model: getOpenAIModel() });

  const cacheKey = buildPromptCacheKey({
    capabilityId: "creative_generation",
    capabilityVersion: def.version,
    contextHash: input.projection.contextHash,
  });

  const cached = getCachedPromptContext(cacheKey);
  const systemPrompt = cached?.systemPrompt ?? prompts.systemPrompt;
  const userPrompt = cached?.userPrompt ?? prompts.userPrompt;

  if (!cached) {
    setCachedPromptContext(cacheKey, { systemPrompt, userPrompt });
  }

  const approvedChannels = extractApprovedChannelsForCreativePlanning({
    channelOutput: input.executionContext.upstreamOutputs.channel_planning,
    campaignContext: input.executionContext.campaignContext,
    channelsStepApproved:
      input.executionContext.campaignContext?.stepApprovals?.channels_selected === "approved",
  });
  const client = createBrainLlmClient(input.llmProvider);
  const request = createCreativeGenerationLlmRequest({
    capabilityId: "creative_generation",
    capabilityVersion: def.version,
    systemPrompt,
    userPrompt,
    jsonSchema: CREATIVE_GENERATION_LLM_JSON_SCHEMA as unknown as Record<string, unknown>,
    contextHash: input.projection.contextHash,
  });
  const requestSizeMetrics = measureCreativeGenerationRequestSize({
    systemPrompt,
    userPrompt,
    schemaChars: JSON.stringify(CREATIVE_GENERATION_LLM_JSON_SCHEMA).length,
    approvedChannelCount: approvedChannels.length,
    model: getOpenAIModel(),
  });
  markOfficeLlmTrace("OPENAI_FETCH_STARTED", {
    promptChars: requestSizeMetrics.promptChars,
    schemaChars: requestSizeMetrics.schemaChars,
    approvedChannelCount: requestSizeMetrics.approvedChannelCount,
    maxOutputTokens: requestSizeMetrics.maxOutputTokens,
  });
  const llmStartedMs = Date.now();
  const validationRun = await runWithBoundedTimeout(
    client.completeWithValidationRetry(
      request,
      (parsed) => validateCreativeGenerationLlmPayload(parsed, { approvedChannels }),
      { maxRepairAttempts: 1 }
    ),
    CREATIVE_GENERATION_CAPABILITY_TIMEOUT_MS,
    "creative_generation_capability_timeout"
  );
  const initialRequestDurationMs = Date.now() - llmStartedMs;
  const validationAttempts = validationRun.attemptCount;
  const validationRepairCount = validationRun.validationRepairCount;
  const response = validationRun.response;
  const generatedChannelDiagnostics = channelDiagnosticsForAttempt(
    approvedChannels,
    collectGeneratedChannels(validationRun.result)
  );
  markOfficeLlmTrace("OPENAI_FETCH_COMPLETED", {
    httpStatus: 200,
    inputTokens: response.usage.inputTokens,
    outputTokens: response.usage.outputTokens,
  });
  markOfficeLlmTrace("RESPONSE_PARSED");
  markOfficeLlmTrace("VALIDATION_COMPLETED", {
    validationAttempts,
    validationRepairCount: validationRun.validationRepairCount,
  });

  const generatedAt = new Date().toISOString();
  const output = mapCreativeGenerationPayloadToBrainOutput(validationRun.result, {
    capabilityVersion: def.version,
    generatedAt,
    provenanceRef: `llm:creative_generation:${input.context.organizationId}`,
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
      upstreamStrategyFound: upstream.diagnostics.upstreamStrategyFound,
      upstreamChannelsFound: upstream.diagnostics.upstreamChannelsFound,
      strategyVersionCompatible: upstream.diagnostics.strategyVersionCompatible,
      channelVersionCompatible: upstream.diagnostics.channelVersionCompatible,
      selectedChannelCount: upstream.diagnostics.selectedChannelCount,
      requestStarted: true,
      validationAttempts,
      validationRepairCount,
      initialRequestDurationMs,
      businessValidationSubreason: "passed",
      ...generatedChannelDiagnostics,
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
      validationRepairCount,
      initialRequestDurationMs,
      businessValidationSubreason: "passed",
      ...generatedChannelDiagnostics,
      upstreamStrategyFound: upstream.diagnostics.upstreamStrategyFound,
      upstreamChannelsFound: upstream.diagnostics.upstreamChannelsFound,
      strategyVersionCompatible: upstream.diagnostics.strategyVersionCompatible,
      channelVersionCompatible: upstream.diagnostics.channelVersionCompatible,
      selectedChannelCount: upstream.diagnostics.selectedChannelCount,
    },
  };
}

export async function executeCreativeGenerationWithLlmFallback(
  providerInput: ProviderInput & {
    projection: BrainContextProjection;
    llmProvider?: BrainLlmProvider;
  }
): Promise<CreativeGenerationLlmExecutionResult> {
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

  const upstream = validateUpstreamForCreativeGeneration(providerInput.executionContext);
  if (!upstream.ok) {
    const category = (upstream.category ?? "missing_strategy_output") as BrainLlmFailureCategory;
    markOfficeLlmTrace("FALLBACK_STARTED", { category });
    markOfficeLlmTrace("FALLBACK_COMPLETED", { category });
    return {
      output: executeDeterministicCapability(providerInput),
      usedLlm: false,
      fallbackReason: category,
      usage: fallbackUsage(category, {
        upstreamStrategyFound: upstream.diagnostics.upstreamStrategyFound,
        upstreamChannelsFound: upstream.diagnostics.upstreamChannelsFound,
        strategyVersionCompatible: upstream.diagnostics.strategyVersionCompatible,
        channelVersionCompatible: upstream.diagnostics.channelVersionCompatible,
        selectedChannelCount: upstream.diagnostics.selectedChannelCount,
        businessValidationCategory: category,
      }),
      diagnostics: {
        ...upstream.diagnostics,
        fallbackReason: category,
        requestStarted: false,
      },
    };
  }

  const startedAt = new Date().toISOString();
  const startedMs = Date.now();

  try {
    const llmResult = await executeCreativeGenerationViaLlm({
      context: providerInput.context,
      snapshot: providerInput.snapshot,
      companySnapshot: providerInput.companySnapshot,
      executionContext: providerInput.executionContext,
      projection: providerInput.projection,
      llmProvider: providerInput.llmProvider,
    });
    logBrainExecutionDev({
      runId: providerInput.context.requestId,
      capability: "creative_generation",
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
    const timeoutDiagnostics = extractTimeoutDiagnostics(error);
    const fallbackStartedMs = Date.now();
    const totalDurationMs = Date.now() - startedMs;
    const httpStatus = error instanceof Error && "statusCode" in error ? (error as { statusCode?: number }).statusCode : undefined;
    const requestStarted = llmAttemptStarted(category);
    const approvedChannels = extractApprovedChannelsForCreativePlanning({
      channelOutput: providerInput.executionContext!.upstreamOutputs.channel_planning,
      campaignContext: providerInput.executionContext!.campaignContext,
      channelsStepApproved:
        providerInput.executionContext!.campaignContext?.stepApprovals?.channels_selected === "approved",
    });
    const emptyChannelDiagnostics = channelDiagnosticsForAttempt(
      approvedChannels,
      failure.generatedChannelIds ?? []
    );
    markOfficeLlmTrace("FALLBACK_STARTED", { category, httpStatus: httpStatus ?? null });
    markOfficeLlmTrace("FALLBACK_COMPLETED", { category, httpStatus: httpStatus ?? null });
    logBrainExecutionDev({
      runId: providerInput.context.requestId,
      capability: "creative_generation",
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
            upstream: upstream.diagnostics,
            validationAttempts: failure.validationAttempts,
            validationRepairCount:
              category === "request_timeout" ? 0 : failure.validationRepairCount,
            businessValidationSubreason: failure.businessValidationSubreason,
            initialRequestDurationMs: totalDurationMs,
            fallbackDurationMs,
            ...emptyChannelDiagnostics,
            ...timeoutDiagnostics,
          })
        : fallbackUsage(category, {
            upstreamStrategyFound: upstream.diagnostics.upstreamStrategyFound,
            upstreamChannelsFound: upstream.diagnostics.upstreamChannelsFound,
            strategyVersionCompatible: upstream.diagnostics.strategyVersionCompatible,
            channelVersionCompatible: upstream.diagnostics.channelVersionCompatible,
            selectedChannelCount: upstream.diagnostics.selectedChannelCount,
            businessValidationCategory: category,
            businessValidationSubreason: failure.businessValidationSubreason,
            ...emptyChannelDiagnostics,
          }),
      diagnostics: {
        ...upstream.diagnostics,
        finalProvider: "deterministic",
        fallbackUsed: true,
        fallbackReason: category,
        requestStarted,
        httpStatus,
        validationAttempts: failure.validationAttempts,
        validationRepairCount:
          category === "request_timeout" ? 0 : failure.validationRepairCount,
        initialRequestDurationMs: totalDurationMs,
        fallbackDurationMs,
        businessValidationCategory: category,
        businessValidationSubreason: failure.businessValidationSubreason,
        ...emptyChannelDiagnostics,
        ...timeoutDiagnostics,
      },
    };
  }
}
