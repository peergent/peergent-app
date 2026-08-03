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
  fallbackReason?: string;
};

type ProviderInput = {
  context: BrainRunContext;
  snapshot: BrainSnapshot;
  capabilityId: BrainCapabilityId;
  companySnapshot?: CompanySnapshot;
  executionContext?: CapabilityExecutionContext;
};

export async function executeStrategyViaLlm(
  input: StrategyLlmExecutionInput
): Promise<StrategyLlmExecutionResult> {
  const def = getBrainCapability("strategy");
  const projected = buildStrategyProjectedContext({
    snapshot: input.snapshot,
    companySnapshot: input.companySnapshot,
    executionContext: input.executionContext,
    projection: input.projection,
  });

  const prompts = strategyPromptBuilder.build({
    context: projected,
    locale: input.executionContext.locale,
  });

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

  const { result, response } = await client.completeWithValidationRetry(request, (parsed) =>
    validateStrategyLlmPayload(parsed, {
      capabilityVersion: def.version,
      knownCompetitors,
    })
  );

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
      modelId: response.usage.model,
      inputTokens: response.usage.inputTokens,
      outputTokens: response.usage.outputTokens,
      estimatedCostCents: response.usage.estimatedCostCents,
      cacheHit: Boolean(cached),
    },
  };
}

export async function executeStrategyWithLlmFallback(
  providerInput: ProviderInput & {
    projection: BrainContextProjection;
    llmProvider?: BrainLlmProvider;
  }
): Promise<StrategyLlmExecutionResult> {
  if (!providerInput.executionContext || !providerInput.companySnapshot) {
    return {
      output: executeDeterministicCapability(providerInput),
      usedLlm: false,
      fallbackReason: "missing_execution_context",
    };
  }

  try {
    return await executeStrategyViaLlm({
      context: providerInput.context,
      snapshot: providerInput.snapshot,
      companySnapshot: providerInput.companySnapshot,
      executionContext: providerInput.executionContext,
      projection: providerInput.projection,
      llmProvider: providerInput.llmProvider,
    });
  } catch {
    return {
      output: executeDeterministicCapability(providerInput),
      usedLlm: false,
      fallbackReason: "llm_failed_validation_or_provider",
    };
  }
}
