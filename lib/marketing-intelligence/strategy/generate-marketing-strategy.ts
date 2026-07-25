import type { AIResponse, AIRuntimeOptions } from "@/lib/ai-runtime";
import { defaultAIRuntime, structuredJsonMaxLength } from "@/lib/ai-runtime";
import type { ContextPackage } from "@/lib/intelligence";
import type { MarketingUnderstandingContextSlice } from "@/lib/intelligence/types/marketing-understanding-context-slice";
import { shouldLogPrompts } from "@/lib/ai-runtime/env";
import { buildPrompt } from "@/lib/prompt-builder";
import type { MarketingStrategy } from "../types/strategy";
import {
  assessStrategyReadiness,
  capStrategyConfidence,
} from "./assess-strategy-readiness";
import { MARKETING_STRATEGY_DEFAULT_MAX_TOKENS } from "./build-strategy-task-prompt";
import { parseMarketingStrategyResponse } from "./parse-marketing-strategy-response";

export type GenerateMarketingStrategyInput = {
  contextPackage: ContextPackage;
  taskHint?: string;
  runtimeOptions?: AIRuntimeOptions;
};

export type GenerateMarketingStrategyResult =
  | {
      success: true;
      strategy: MarketingStrategy;
      traceId: string;
      warnings: string[];
      aiResponse: AIResponse;
    }
  | {
      success: false;
      error: string;
      traceId: string;
      warnings: string[];
      aiResponse?: AIResponse;
    };

const DEFAULT_STRATEGY_TASK =
  "Develop a comprehensive marketing strategy based on the verified Marketing Understanding.";

/**
 * Transforms Marketing Understanding into a structured Marketing Strategy
 * using the approved execution pipeline (buildPrompt → execute → parse).
 */
export async function generateMarketingStrategy(
  input: GenerateMarketingStrategyInput
): Promise<GenerateMarketingStrategyResult> {
  const { contextPackage, taskHint = DEFAULT_STRATEGY_TASK } = input;
  const traceId = contextPackage.traceId;

  if (contextPackage.scope.peer.role !== "Marketing") {
    return {
      success: false,
      error: "Marketing Strategy generation requires a Marketing peer.",
      traceId,
      warnings: [],
    };
  }

  const understanding = contextPackage.slices
    .marketingUnderstanding as MarketingUnderstandingContextSlice | undefined;

  const readiness = assessStrategyReadiness(understanding);
  const warnings = [...contextPackage.meta.warnings, ...readiness.warnings];

  if (!readiness.ready) {
    return {
      success: false,
      error: "Marketing Understanding is not available — cannot generate strategy.",
      traceId,
      warnings,
    };
  }

  const promptPackage = buildPrompt(contextPackage, {
    taskHint,
    outputFormat: "marketing-strategy",
  });

  const maxTokens = input.runtimeOptions?.maxTokens ?? MARKETING_STRATEGY_DEFAULT_MAX_TOKENS;

  const aiResponse = await defaultAIRuntime.execute(promptPackage, {
    temperature: input.runtimeOptions?.temperature ?? 0.35,
    maxTokens,
    model: input.runtimeOptions?.model,
    responseValidation: {
      maxLength: structuredJsonMaxLength(maxTokens),
      ...input.runtimeOptions?.responseValidation,
    },
  });

  if (shouldLogPrompts()) {
    console.info("[generateMarketingStrategy] LLM response", {
      traceId,
      finishReason: aiResponse.metadata.finishReason,
      rawLength: aiResponse.providerResult.text.length,
      validatedLength: aiResponse.text.length,
      validatedWarnings: aiResponse.validated.warnings,
      usage: aiResponse.metadata.usage,
    });
    if (!aiResponse.validated.success) {
      console.info("[generateMarketingStrategy] raw LLM text", aiResponse.providerResult.text);
    }
  }

  if (!aiResponse.validated.success) {
    return {
      success: false,
      error: aiResponse.validated.warnings.join(" ") || "AI response validation failed.",
      traceId,
      warnings: [...warnings, ...aiResponse.validated.warnings],
      aiResponse,
    };
  }

  const parsed = parseMarketingStrategyResponse(aiResponse.text);

  if (shouldLogPrompts()) {
    console.info("[generateMarketingStrategy] parse result", {
      traceId,
      success: parsed.success,
      error: parsed.success ? undefined : parsed.error,
      warnings: parsed.warnings,
    });
    if (!parsed.success) {
      console.info("[generateMarketingStrategy] raw LLM text", aiResponse.providerResult.text);
      console.info("[generateMarketingStrategy] text passed to parser", aiResponse.text);
    }
  }

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error,
      traceId,
      warnings: [...warnings, ...parsed.warnings],
      aiResponse,
    };
  }

  const strategy: MarketingStrategy = {
    ...parsed.strategy,
    confidence: capStrategyConfidence(parsed.strategy.confidence, readiness.maxConfidence),
    knowledgeGaps: [
      ...new Set([...parsed.strategy.knowledgeGaps, ...readiness.knowledgeGaps]),
    ],
  };

  if (strategy.confidence !== parsed.strategy.confidence) {
    warnings.push(
      `Strategy confidence capped at ${strategy.confidence} based on understanding completeness.`
    );
  }

  return {
    success: true,
    strategy,
    traceId,
    warnings: [...warnings, ...parsed.warnings],
    aiResponse,
  };
}
