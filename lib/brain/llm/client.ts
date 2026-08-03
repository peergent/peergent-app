import type { BrainLlmProvider } from "./provider";
import type { BrainLlmRequest, BrainLlmResponse } from "./types";
import { getDefaultBrainLlmProvider } from "./provider-registry";
import { withLlmRetry } from "./retry";
import { parseJsonResponse } from "./response";
import { BrainLlmValidationError } from "./errors";

export class BrainLlmClient {
  constructor(private readonly provider: BrainLlmProvider = getDefaultBrainLlmProvider()) {}

  async complete(request: BrainLlmRequest): Promise<BrainLlmResponse> {
    const raw = await withLlmRetry(() => this.provider.complete(request));
    const parsed = parseJsonResponse(raw.rawText);
    return { rawText: raw.rawText, parsed, usage: raw.usage };
  }

  async completeWithValidationRetry<T>(
    request: BrainLlmRequest,
    validate: (parsed: unknown) => T
  ): Promise<{ result: T; response: BrainLlmResponse }> {
    let lastValidationError: BrainLlmValidationError | null = null;

    for (let attempt = 0; attempt < 2; attempt++) {
      const response = await this.complete(request);
      try {
        return { result: validate(response.parsed), response };
      } catch (error) {
        if (error instanceof BrainLlmValidationError) {
          lastValidationError = error;
          continue;
        }
        throw error;
      }
    }

    throw lastValidationError ?? new BrainLlmValidationError("Validation failed after retry.");
  }
}

export function createBrainLlmClient(provider?: BrainLlmProvider): BrainLlmClient {
  return new BrainLlmClient(provider);
}
