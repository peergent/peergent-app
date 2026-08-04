import type { BrainLlmRequest } from "./types";
import {
  CREATIVE_GENERATION_MAX_DELIVERABLES,
  CREATIVE_GENERATION_MIN_DELIVERABLES,
} from "./creative-generation-contract";

/** Single OpenAI attempt budget for creative_generation — primary timeout owner. */
export const CREATIVE_GENERATION_PROVIDER_TIMEOUT_MS = 75_000;

/** Bounded structured planning output — sufficient for 3–5 deliverables. */
export const CREATIVE_GENERATION_MAX_OUTPUT_TOKENS = 2_048;

/** Outer envelopes — must exceed provider timeout with small overhead only. */
export const CREATIVE_GENERATION_CAPABILITY_TIMEOUT_MS = 78_000;
export const CREATIVE_GENERATION_SERVER_ACTION_TIMEOUT_MS = 82_000;
export const CREATIVE_GENERATION_CLIENT_ACTION_TIMEOUT_MS = 88_000;

export type CreativeGenerationRequestSizeMetrics = {
  promptChars: number;
  systemPromptChars: number;
  userPromptChars: number;
  schemaChars: number;
  approvedChannelCount: number;
  requestedDeliverableMin: number;
  requestedDeliverableMax: number;
  maxOutputTokens: number;
  providerTimeoutMs: number;
  strictSchemaEnabled: boolean;
  model: string;
};

export function measureCreativeGenerationRequestSize(input: {
  systemPrompt: string;
  userPrompt: string;
  schemaChars: number;
  approvedChannelCount: number;
  model: string;
}): CreativeGenerationRequestSizeMetrics {
  return {
    promptChars: input.systemPrompt.length + input.userPrompt.length,
    systemPromptChars: input.systemPrompt.length,
    userPromptChars: input.userPrompt.length,
    schemaChars: input.schemaChars,
    approvedChannelCount: input.approvedChannelCount,
    requestedDeliverableMin: CREATIVE_GENERATION_MIN_DELIVERABLES,
    requestedDeliverableMax: CREATIVE_GENERATION_MAX_DELIVERABLES,
    maxOutputTokens: CREATIVE_GENERATION_MAX_OUTPUT_TOKENS,
    providerTimeoutMs: CREATIVE_GENERATION_PROVIDER_TIMEOUT_MS,
    strictSchemaEnabled: true,
    model: input.model,
  };
}

export function createCreativeGenerationLlmRequest(
  input: Omit<BrainLlmRequest, "temperature" | "maxOutputTokens" | "timeoutMs"> & {
    temperature?: number;
  }
): BrainLlmRequest {
  return {
    ...input,
    temperature: input.temperature ?? 0.3,
    maxOutputTokens: CREATIVE_GENERATION_MAX_OUTPUT_TOKENS,
    timeoutMs: CREATIVE_GENERATION_PROVIDER_TIMEOUT_MS,
  };
}
