import type { BrainLlmRequest, BrainLlmResponse, BrainLlmProviderId } from "./types";

/** Generic LLM provider contract — Brain Runtime never depends on OpenAI directly. */
export interface BrainLlmProvider {
  readonly id: BrainLlmProviderId;
  complete(request: BrainLlmRequest): Promise<Omit<BrainLlmResponse, "parsed">>;
}
