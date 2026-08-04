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
import { CHANNEL_PLANNING_LLM_JSON_SCHEMA } from "../llm/json-schema";
import {
  mapChannelPlanningPayloadToBrainOutput,
  validateChannelPlanningLlmPayload,
} from "../llm/channel-response-validator";
import { buildPromptCacheKey, getCachedPromptContext, setCachedPromptContext } from "../llm/prompt-cache";
import { channelPromptBuilder } from "../prompts/channel-prompt-builder";
import { buildChannelPlanningProjectedContext } from "../prompts/projected-context";
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

export type ChannelPlanningLlmExecutionInput = {
  context: BrainRunContext;
  snapshot: BrainSnapshot;
  companySnapshot: CompanySnapshot;
  executionContext: CapabilityExecutionContext;
  projection: BrainContextProjection;
  llmProvider?: BrainLlmProvider;
};

export type ChannelPlanningLlmExecutionResult = {
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

export async function executeChannelPlanningViaLlm(
  input: ChannelPlanningLlmExecutionInput
): Promise<ChannelPlanningLlmExecutionResult> {
  markOfficeLlmTrace("LLM_EXECUTE_ENTER");
  const def = getBrainCapability("channel_planning");
  let projected;
  try {
    projected = buildChannelPlanningProjectedContext({
      snapshot: input.snapshot,
      companySnapshot: input.companySnapshot,
      executionContext: input.executionContext,
      projection: input.projection,
    });
  } catch {
    throw new Error("prompt_build_failed");
  }

  const prompts = channelPromptBuilder.build({
    context: projected,
    locale: input.executionContext.locale,
  });
  markOfficeLlmTrace("PROMPT_BUILT", { model: getOpenAIModel() });

  const cacheKey = buildPromptCacheKey({
    capabilityId: "channel_planning",
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
    capabilityId: "channel_planning",
    capabilityVersion: def.version,
    systemPrompt,
    userPrompt,
    jsonSchema: CHANNEL_PLANNING_LLM_JSON_SCHEMA as unknown as Record<string, unknown>,
    contextHash: input.projection.contextHash,
  });

  markOfficeLlmTrace("OPENAI_FETCH_STARTED");
  let validationAttempts = 0;
  const { result, response } = await client.completeWithValidationRetry(request, (parsed) => {
    validationAttempts += 1;
    return validateChannelPlanningLlmPayload(parsed);
  });
  markOfficeLlmTrace("OPENAI_FETCH_COMPLETED", {
    httpStatus: 200,
    inputTokens: response.usage.inputTokens,
    outputTokens: response.usage.outputTokens,
  });
  markOfficeLlmTrace("RESPONSE_PARSED");
  markOfficeLlmTrace("VALIDATION_COMPLETED", { validationAttempts });

  const generatedAt = new Date().toISOString();
  const output = mapChannelPlanningPayloadToBrainOutput(result, {
    capabilityVersion: def.version,
    generatedAt,
    provenanceRef: `llm:channel_planning:${input.context.organizationId}`,
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

export async function executeChannelPlanningWithLlmFallback(
  providerInput: ProviderInput & {
    projection: BrainContextProjection;
    llmProvider?: BrainLlmProvider;
  }
): Promise<ChannelPlanningLlmExecutionResult> {
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
    const llmResult = await executeChannelPlanningViaLlm({
      context: providerInput.context,
      snapshot: providerInput.snapshot,
      companySnapshot: providerInput.companySnapshot,
      executionContext: providerInput.executionContext,
      projection: providerInput.projection,
      llmProvider: providerInput.llmProvider,
    });
    logBrainExecutionDev({
      runId: providerInput.context.requestId,
      capability: "channel_planning",
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
    const category = classifyBrainLlmError(error);
    const httpStatus = error instanceof Error && "statusCode" in error ? (error as { statusCode?: number }).statusCode : undefined;
    markOfficeLlmTrace("FALLBACK_STARTED", { category, httpStatus: httpStatus ?? null });
    markOfficeLlmTrace("FALLBACK_COMPLETED", { category, httpStatus: httpStatus ?? null });
    logBrainExecutionDev({
      runId: providerInput.context.requestId,
      capability: "channel_planning",
      environment: providerInput.context.environment,
      providerSelected: "llm",
      requestStartedAt: startedAt,
      requestCompletedAt: new Date().toISOString(),
      latencyMs: Date.now() - startedMs,
      validationResult: "invalid",
      fallbackUsed: true,
      fallbackReason: category,
    });
    return {
      output: executeDeterministicCapability(providerInput),
      usedLlm: false,
      fallbackReason: category,
      usage: fallbackUsage(category, {
        modelId: getOpenAIModel(),
      }),
      diagnostics: {
        ...baseDiagnostics,
        fallbackReason: category,
        requestStarted: category !== "missing_api_key" && category !== "feature_flag_disabled",
        httpStatus,
      },
    };
  }
}
