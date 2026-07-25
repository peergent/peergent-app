import type { AIResponse, AIRuntimeOptions } from "@/lib/ai-runtime";
import { defaultAIRuntime, structuredJsonMaxLength } from "@/lib/ai-runtime";
import type { ContextPackage } from "@/lib/intelligence";
import { buildPrompt } from "@/lib/prompt-builder";
import type { MarketingPlan } from "../types/plan";
import type { MarketingStrategyConfidence } from "../types/strategy";
import {
  assessContentDraftReadiness,
  extractKnownEntities,
} from "./assess-content-readiness";
import { MARKETING_CONTENT_DEFAULT_MAX_TOKENS } from "./build-content-task-prompt";
import { parseMarketingContentDraft } from "./parse-marketing-content-draft";

export type GenerateMarketingContentDraftInput = {
  contextPackage: ContextPackage;
  plan: MarketingPlan;
  planActivityReference: string;
  taskHint?: string;
  runtimeOptions?: AIRuntimeOptions;
};

export type GenerateMarketingContentDraftResult =
  | {
      success: true;
      draft: import("../types/content-draft").MarketingContentDraft;
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

const CONFIDENCE_ORDER: MarketingStrategyConfidence[] = ["low", "moderate", "high"];

function capConfidence(
  reported: MarketingStrategyConfidence,
  maxAllowed: MarketingStrategyConfidence
): MarketingStrategyConfidence {
  return CONFIDENCE_ORDER.indexOf(reported) <= CONFIDENCE_ORDER.indexOf(maxAllowed)
    ? reported
    : maxAllowed;
}

/**
 * Generates one Marketing Content Draft for a selected plan activity
 * using the approved execution pipeline (buildPrompt → execute → parse).
 */
export async function generateMarketingContentDraft(
  input: GenerateMarketingContentDraftInput
): Promise<GenerateMarketingContentDraftResult> {
  const { contextPackage, plan, planActivityReference, taskHint } = input;
  const traceId = contextPackage.traceId;

  if (contextPackage.scope.peer.role !== "Marketing") {
    return {
      success: false,
      error: "Marketing Content creation requires a Marketing peer.",
      traceId,
      warnings: [],
    };
  }

  const readiness = assessContentDraftReadiness(plan, planActivityReference, contextPackage);
  const warnings = [...contextPackage.meta.warnings, ...readiness.warnings];

  if (!readiness.ready || !readiness.activity || !readiness.normalizedContentType) {
    return {
      success: false,
      error: readiness.warnings[0] ?? "Content draft prerequisites not met.",
      traceId,
      warnings,
    };
  }

  const entities = extractKnownEntities(contextPackage);
  const defaultTask = `Create a draft ${readiness.normalizedContentType} for plan activity "${readiness.activity.title}".`;

  const promptPackage = buildPrompt(contextPackage, {
    taskHint: taskHint ?? defaultTask,
    outputFormat: "marketing-content-draft",
    marketingPlan: plan,
    planActivityReference,
  });

  const maxTokens = input.runtimeOptions?.maxTokens ?? MARKETING_CONTENT_DEFAULT_MAX_TOKENS;

  const aiResponse = await defaultAIRuntime.execute(promptPackage, {
    temperature: input.runtimeOptions?.temperature ?? 0.45,
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

  const parsed = parseMarketingContentDraft(aiResponse.text, {
    expectedPlanActivityReference: planActivityReference,
    normalizedContentType: readiness.normalizedContentType,
    strategyLinks: readiness.activity.linkedStrategyItems,
    validationContext: {
      expectedPlanActivityReference: planActivityReference,
      knownProductNames: entities.productNames,
      knownServiceNames: entities.serviceNames,
      knownAudienceNames: entities.audienceNames,
    },
  });

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error,
      traceId,
      warnings: [...warnings, ...parsed.warnings],
      aiResponse,
    };
  }

  const draft = {
    ...parsed.draft,
    confidence: capConfidence(parsed.draft.confidence, readiness.maxConfidence),
    status: "draft" as const,
  };

  if (draft.confidence !== parsed.draft.confidence) {
    warnings.push(
      `Draft confidence capped at ${draft.confidence} based on context completeness.`
    );
  }

  return {
    success: true,
    draft,
    traceId,
    warnings: [...warnings, ...parsed.warnings],
    aiResponse,
  };
}
