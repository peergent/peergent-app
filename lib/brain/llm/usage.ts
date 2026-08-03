import type { BrainLlmProviderId, BrainLlmUsage } from "./types";

/** Rough cost estimate — gpt-4.1-mini class pricing (cents per 1M tokens). */
const INPUT_CENTS_PER_M = 15;
const OUTPUT_CENTS_PER_M = 60;

export function estimateLlmCostCents(input: {
  inputTokens: number;
  outputTokens: number;
}): number {
  const inputCost = (input.inputTokens / 1_000_000) * INPUT_CENTS_PER_M;
  const outputCost = (input.outputTokens / 1_000_000) * OUTPUT_CENTS_PER_M;
  return Math.ceil(inputCost + outputCost);
}

export function buildLlmUsage(input: {
  provider: BrainLlmProviderId;
  model: string;
  inputTokens: number;
  outputTokens: number;
  latencyMs: number;
}): BrainLlmUsage {
  const totalTokens = input.inputTokens + input.outputTokens;
  return {
    provider: input.provider,
    model: input.model,
    inputTokens: input.inputTokens,
    outputTokens: input.outputTokens,
    totalTokens,
    estimatedCostCents: estimateLlmCostCents({
      inputTokens: input.inputTokens,
      outputTokens: input.outputTokens,
    }),
    latencyMs: input.latencyMs,
  };
}
