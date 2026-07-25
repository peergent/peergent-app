import type { AIResponse, AIRuntimeOptions } from "@/lib/ai-runtime";
import { defaultAIRuntime, structuredJsonMaxLength } from "@/lib/ai-runtime";
import type { ContextPackage } from "@/lib/intelligence";
import { buildPrompt } from "@/lib/prompt-builder";
import type { MarketingPlan } from "../types/plan";
import type { MarketingStrategy } from "../types/strategy";
import { assessPlanReadiness, capPlanConfidence } from "./assess-plan-readiness";
import { MARKETING_PLAN_DEFAULT_MAX_TOKENS } from "./build-plan-task-prompt";
import { parseMarketingPlanResponse } from "./parse-marketing-plan-response";

export type GenerateMarketingPlanInput = {
  contextPackage: ContextPackage;
  strategy: MarketingStrategy;
  taskHint?: string;
  runtimeOptions?: AIRuntimeOptions;
};

export type GenerateMarketingPlanResult =
  | {
      success: true;
      plan: MarketingPlan;
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

const DEFAULT_PLAN_TASK =
  "Transform the provided Marketing Strategy into an actionable Marketing Plan with timeline, campaigns, and content calendar.";

/**
 * Transforms a Marketing Strategy into a structured Marketing Plan
 * using the approved execution pipeline (buildPrompt → execute → parse).
 */
export async function generateMarketingPlan(
  input: GenerateMarketingPlanInput
): Promise<GenerateMarketingPlanResult> {
  const { contextPackage, strategy, taskHint = DEFAULT_PLAN_TASK } = input;
  const traceId = contextPackage.traceId;

  if (contextPackage.scope.peer.role !== "Marketing") {
    return {
      success: false,
      error: "Marketing Plan generation requires a Marketing peer.",
      traceId,
      warnings: [],
    };
  }

  const readiness = assessPlanReadiness(strategy);
  const warnings = [...contextPackage.meta.warnings, ...readiness.warnings];

  if (!readiness.ready) {
    return {
      success: false,
      error: readiness.warnings[0] ?? "Marketing Strategy is not ready for planning.",
      traceId,
      warnings,
    };
  }

  const promptPackage = buildPrompt(contextPackage, {
    taskHint,
    outputFormat: "marketing-plan",
    marketingStrategy: strategy,
  });

  const maxTokens = input.runtimeOptions?.maxTokens ?? MARKETING_PLAN_DEFAULT_MAX_TOKENS;

  const aiResponse = await defaultAIRuntime.execute(promptPackage, {
    temperature: input.runtimeOptions?.temperature ?? 0.3,
    maxTokens,
    model: input.runtimeOptions?.model,
    responseValidation: {
      maxLength: structuredJsonMaxLength(maxTokens),
      ...input.runtimeOptions?.responseValidation,
    },
  });

  if (!aiResponse.validated.success) {
    return {
      success: false,
      error: aiResponse.validated.warnings.join(" ") || "AI response validation failed.",
      traceId,
      warnings: [...warnings, ...aiResponse.validated.warnings],
      aiResponse,
    };
  }

  const parsed = parseMarketingPlanResponse(aiResponse.text);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error,
      traceId,
      warnings: [...warnings, ...parsed.warnings],
      aiResponse,
    };
  }

  const plan: MarketingPlan = {
    ...parsed.plan,
    confidence: capPlanConfidence(parsed.plan.confidence, readiness.maxConfidence),
    basedOnStrategySummary: strategy.summary,
    knowledgeGaps: [...new Set([...parsed.plan.knowledgeGaps, ...readiness.knowledgeGaps])],
  };

  if (plan.confidence !== parsed.plan.confidence) {
    warnings.push(
      `Plan confidence capped at ${plan.confidence} based on strategy completeness.`
    );
  }

  return {
    success: true,
    plan,
    traceId,
    warnings: [...warnings, ...parsed.warnings],
    aiResponse,
  };
}
