import type { BrainCapabilityId } from "../capabilities/registry";

export type BrainLlmProviderId = "openai";

export type BrainLlmUsage = {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  estimatedCostCents: number;
  provider: BrainLlmProviderId;
  model: string;
  latencyMs: number;
};

export type BrainLlmRequest = {
  capabilityId: BrainCapabilityId;
  capabilityVersion: string;
  systemPrompt: string;
  userPrompt: string;
  jsonSchema: Record<string, unknown>;
  contextHash: string;
  model?: string;
  maxOutputTokens?: number;
  temperature?: number;
};

export type BrainLlmResponse = {
  rawText: string;
  parsed: unknown;
  usage: BrainLlmUsage;
};

export type BrainLlmProviderConfig = {
  apiKey?: string | null;
  baseUrl?: string;
  defaultModel?: string;
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
};
