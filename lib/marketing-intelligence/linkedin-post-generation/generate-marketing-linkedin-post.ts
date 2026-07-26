import type { AIResponse, AIRuntimeOptions } from "@/lib/ai-runtime";
import { defaultAIRuntime, structuredJsonMaxLength } from "@/lib/ai-runtime";
import type { ContextPackage } from "@/lib/intelligence";
import type { MarketingUnderstandingContextSlice } from "@/lib/intelligence/types/marketing-understanding-context-slice";
import { shouldLogPrompts } from "@/lib/ai-runtime/env";
import { buildPrompt } from "@/lib/prompt-builder";
import type { CreativeBrief } from "@/lib/creative-brief";
import type { MarketingDecisionRecord } from "@/lib/marketing-decision";
import type { MarketingProject } from "@/lib/peer-experience/marketing/projects/types";
import type { MarketingStrategy } from "../types/strategy";

import {
  buildMarketingLinkedInPostTaskAppendix,
  MARKETING_LINKEDIN_POST_DEFAULT_MAX_TOKENS,
} from "./build-linkedin-post-task-prompt";
import { mapParsedPostToMarketingLinkedInPost } from "./map-to-linkedin-post";
import { parseMarketingLinkedInPostResponse } from "./parse-marketing-linkedin-post-response";
import type { MarketingLinkedInPost } from "./types";

export type GenerateMarketingLinkedInPostInput = {
  contextPackage: ContextPackage;
  strategy: MarketingStrategy;
  creativeBrief: CreativeBrief;
  decision: MarketingDecisionRecord;
  project: MarketingProject;
  workUnitId: string;
  taskHint?: string;
  runtimeOptions?: AIRuntimeOptions;
};

export type GenerateMarketingLinkedInPostResult =
  | {
      success: true;
      post: MarketingLinkedInPost;
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

export async function generateMarketingLinkedInPost(
  input: GenerateMarketingLinkedInPostInput
): Promise<GenerateMarketingLinkedInPostResult> {
  const { contextPackage, strategy, creativeBrief, project, workUnitId } = input;
  const traceId = contextPackage.traceId;
  const taskHint =
    input.taskHint?.trim() ||
    `Write a LinkedIn post for campaign "${project.title}" aligned with strategy and creative direction.`;

  if (contextPackage.scope.peer.role !== "Marketing") {
    return {
      success: false,
      error: "LinkedIn post generation requires a Marketing peer.",
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
      error: "Marketing Understanding is not available — cannot generate LinkedIn post.",
      traceId,
      warnings,
    };
  }

  if (!strategy.summary?.trim()) {
    return {
      success: false,
      error: "Campaign strategy is required before LinkedIn post generation.",
      traceId,
      warnings,
    };
  }

  if (!creativeBrief.campaignGoal.summary?.trim()) {
    return {
      success: false,
      error: "Creative direction is required before LinkedIn post generation.",
      traceId,
      warnings,
    };
  }

  const promptPackage = buildPrompt(contextPackage, {
    taskHint,
    outputFormat: "marketing-linkedin-post",
    marketingStrategy: strategy,
    marketingCreativeBrief: creativeBrief,
  });

  const maxTokens =
    input.runtimeOptions?.maxTokens ?? MARKETING_LINKEDIN_POST_DEFAULT_MAX_TOKENS;

  const aiResponse = await defaultAIRuntime.execute(promptPackage, {
    temperature: input.runtimeOptions?.temperature ?? 0.4,
    maxTokens,
    model: input.runtimeOptions?.model,
    responseValidation: {
      maxLength: structuredJsonMaxLength(maxTokens),
      ...input.runtimeOptions?.responseValidation,
    },
  });

  if (shouldLogPrompts() && !aiResponse.validated.success) {
    console.info("[generateMarketingLinkedInPost] raw LLM text", aiResponse.providerResult.text);
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

  const parsed = parseMarketingLinkedInPostResponse(aiResponse.text);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error,
      traceId,
      warnings: [...warnings, ...parsed.warnings],
      aiResponse,
    };
  }

  const post = mapParsedPostToMarketingLinkedInPost({
    parsed: parsed.post,
    workUnitId,
    campaignId: project.id,
    assembledAt: contextPackage.scope.requestedAt,
  });

  return {
    success: true,
    post,
    traceId,
    warnings: [...warnings, ...parsed.warnings],
    aiResponse,
  };
}
