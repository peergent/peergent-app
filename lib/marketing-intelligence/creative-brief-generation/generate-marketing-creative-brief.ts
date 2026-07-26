import type { AIResponse, AIRuntimeOptions } from "@/lib/ai-runtime";
import { defaultAIRuntime, structuredJsonMaxLength } from "@/lib/ai-runtime";
import type { ContextPackage } from "@/lib/intelligence";
import type { MarketingUnderstandingContextSlice } from "@/lib/intelligence/types/marketing-understanding-context-slice";
import { shouldLogPrompts } from "@/lib/ai-runtime/env";
import { buildPrompt } from "@/lib/prompt-builder";
import type { CreativeBrief } from "@/lib/creative-brief";
import type { MarketingDecisionRecord } from "@/lib/marketing-decision";
import type { MarketingStrategy } from "../types/strategy";
import type { MarketingProject } from "@/lib/peer-experience/marketing/projects/types";

import {
  buildMarketingCreativeBriefTaskAppendix,
  MARKETING_CREATIVE_BRIEF_DEFAULT_MAX_TOKENS,
} from "./build-creative-brief-task-prompt";
import { mapParsedDirectionToCreativeBrief } from "./map-to-creative-brief";
import { parseMarketingCreativeBriefResponse } from "./parse-marketing-creative-brief-response";

export type GenerateMarketingCreativeBriefInput = {
  contextPackage: ContextPackage;
  strategy: MarketingStrategy;
  decision: MarketingDecisionRecord;
  project: MarketingProject;
  taskHint?: string;
  runtimeOptions?: AIRuntimeOptions;
};

export type GenerateMarketingCreativeBriefResult =
  | {
      success: true;
      brief: CreativeBrief;
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

export async function generateMarketingCreativeBrief(
  input: GenerateMarketingCreativeBriefInput
): Promise<GenerateMarketingCreativeBriefResult> {
  const { contextPackage, strategy, decision, project } = input;
  const traceId = contextPackage.traceId;
  const taskHint =
    input.taskHint?.trim() ||
    `Develop creative direction for campaign "${project.title}" aligned with the approved strategy.`;

  if (contextPackage.scope.peer.role !== "Marketing") {
    return {
      success: false,
      error: "Creative direction generation requires a Marketing peer.",
      traceId,
      warnings: [],
    };
  }

  const understanding = contextPackage.slices
    .marketingUnderstanding as MarketingUnderstandingContextSlice | undefined;

  const warnings = [...contextPackage.meta.warnings];
  if (!understanding?.available) {
    return {
      success: false,
      error: "Marketing Understanding is not available — cannot generate creative direction.",
      traceId,
      warnings,
    };
  }

  if (!strategy.summary?.trim()) {
    return {
      success: false,
      error: "Campaign strategy is required before creative direction can be generated.",
      traceId,
      warnings,
    };
  }

  const promptPackage = buildPrompt(contextPackage, {
    taskHint,
    outputFormat: "marketing-creative-brief",
    marketingStrategy: strategy,
  });

  const maxTokens =
    input.runtimeOptions?.maxTokens ?? MARKETING_CREATIVE_BRIEF_DEFAULT_MAX_TOKENS;

  const aiResponse = await defaultAIRuntime.execute(promptPackage, {
    temperature: input.runtimeOptions?.temperature ?? 0.35,
    maxTokens,
    model: input.runtimeOptions?.model,
    responseValidation: {
      maxLength: structuredJsonMaxLength(maxTokens),
      ...input.runtimeOptions?.responseValidation,
    },
  });

  if (shouldLogPrompts() && !aiResponse.validated.success) {
    console.info("[generateMarketingCreativeBrief] raw LLM text", aiResponse.providerResult.text);
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

  const parsed = parseMarketingCreativeBriefResponse(aiResponse.text);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error,
      traceId,
      warnings: [...warnings, ...parsed.warnings],
      aiResponse,
    };
  }

  const brief = mapParsedDirectionToCreativeBrief({
    direction: parsed.direction,
    decision,
    project,
    assembledAt: contextPackage.scope.requestedAt,
  });

  return {
    success: true,
    brief,
    traceId,
    warnings: [...warnings, ...parsed.warnings],
    aiResponse,
  };
}
