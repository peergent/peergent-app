import type { BrainLlmRequest } from "./types";

export function createLlmRequest(input: Omit<BrainLlmRequest, "temperature"> & { temperature?: number }): BrainLlmRequest {
  return {
    ...input,
    temperature: input.temperature ?? 0.3,
    maxOutputTokens: input.maxOutputTokens ?? 4096,
  };
}
