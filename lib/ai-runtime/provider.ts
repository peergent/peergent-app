import type { LLMGenerateRequest, LLMGenerateResult } from "./types";

export interface LLMProvider {
  readonly name: string;
  generateResponse(request: LLMGenerateRequest): Promise<LLMGenerateResult>;
}
