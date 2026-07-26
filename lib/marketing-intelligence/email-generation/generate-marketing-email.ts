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
  buildMarketingEmailCampaignTaskAppendix,
  MARKETING_EMAIL_CAMPAIGN_DEFAULT_MAX_TOKENS,
} from "./build-email-task-prompt";
import { mapParsedEmailToMarketingEmailCampaign } from "./map-to-email";
import { parseMarketingEmailCampaignResponse } from "./parse-marketing-email-response";
import type { MarketingEmailCampaign } from "./types";

export type GenerateMarketingEmailCampaignInput = {
  contextPackage: ContextPackage;
  strategy: MarketingStrategy;
  creativeBrief: CreativeBrief;
  decision: MarketingDecisionRecord;
  project: MarketingProject;
  workUnitId: string;
  taskHint?: string;
  runtimeOptions?: AIRuntimeOptions;
};

export type GenerateMarketingEmailCampaignResult =
  | {
      success: true;
      email: MarketingEmailCampaign;
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

export async function generateMarketingEmailCampaign(
  input: GenerateMarketingEmailCampaignInput
): Promise<GenerateMarketingEmailCampaignResult> {
  const { contextPackage, strategy, creativeBrief, project, workUnitId } = input;
  const traceId = contextPackage.traceId;
  const taskHint =
    input.taskHint?.trim() ||
    `Write a marketing email for campaign "${project.title}" aligned with strategy and creative direction.`;

  if (contextPackage.scope.peer.role !== "Marketing") {
    return {
      success: false,
      error: "Email campaign generation requires a Marketing peer.",
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
      error: "Marketing Understanding is not available — cannot generate email campaign.",
      traceId,
      warnings,
    };
  }

  if (!strategy.summary?.trim()) {
    return {
      success: false,
      error: "Campaign strategy is required before email campaign generation.",
      traceId,
      warnings,
    };
  }

  if (!creativeBrief.campaignGoal.summary?.trim()) {
    return {
      success: false,
      error: "Creative direction is required before email campaign generation.",
      traceId,
      warnings,
    };
  }

  const promptPackage = buildPrompt(contextPackage, {
    taskHint,
    outputFormat: "marketing-email-campaign",
    marketingStrategy: strategy,
    marketingCreativeBrief: creativeBrief,
  });

  const maxTokens =
    input.runtimeOptions?.maxTokens ?? MARKETING_EMAIL_CAMPAIGN_DEFAULT_MAX_TOKENS;

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
    console.info("[generateMarketingEmailCampaign] raw LLM text", aiResponse.providerResult.text);
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

  const parsed = parseMarketingEmailCampaignResponse(aiResponse.text);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error,
      traceId,
      warnings: [...warnings, ...parsed.warnings],
      aiResponse,
    };
  }

  const email = mapParsedEmailToMarketingEmailCampaign({
    parsed: parsed.email,
    workUnitId,
    campaignId: project.id,
    assembledAt: contextPackage.scope.requestedAt,
  });

  return {
    success: true,
    email,
    traceId,
    warnings: [...warnings, ...parsed.warnings],
    aiResponse,
  };
}
