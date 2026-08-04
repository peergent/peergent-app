import "server-only";

import type { BrainLlmProvider } from "./provider";
import type { BrainLlmRequest, BrainLlmResponse } from "./types";
import { getDefaultBrainLlmProvider } from "./provider-registry";
import { withLlmRetry } from "./retry";
import { parseJsonResponse } from "./response";
import { BrainLlmValidationError, BrainLlmValidationRetryExhaustedError, BrainLlmBusinessValidationError, BrainLlmTimeoutError } from "./errors";
import { normalizeCreativeGenerationLlmPayload } from "./creative-generation-contract";
import { collectGeneratedChannels, type CreativeGenerationLlmPayload } from "./creative-generation-business-validation";

function extractGeneratedChannelIds(parsed: unknown): string[] {
  const normalized = normalizeCreativeGenerationLlmPayload(parsed);
  if (!normalized || typeof normalized !== "object") return [];
  return collectGeneratedChannels(normalized as CreativeGenerationLlmPayload);
}

export type BrainLlmValidationRetryResult<T> = {
  result: T;
  response: BrainLlmResponse;
  attemptCount: number;
  validationRepairCount: number;
};

function buildRepairPrompt(request: BrainLlmRequest, issues: readonly string[]): BrainLlmRequest {
  const repairNotes = issues.slice(0, 12).join("\n- ");
  return {
    ...request,
    userPrompt: [
      request.userPrompt,
      "",
      "The previous JSON response failed validation. Fix only the listed issues and return strict JSON matching the schema.",
      "Validation issues:",
      `- ${repairNotes}`,
    ].join("\n"),
  };
}

export class BrainLlmClient {
  constructor(private readonly provider: BrainLlmProvider = getDefaultBrainLlmProvider()) {}

  async complete(
    request: BrainLlmRequest,
    options?: { maxHttpRetries?: number; attemptNumber?: number }
  ): Promise<BrainLlmResponse> {
    const raw = await withLlmRetry(
      () => this.provider.complete(request, { attemptNumber: options?.attemptNumber ?? 1 }),
      {
        maxAttempts: options?.maxHttpRetries ?? 3,
      }
    );
    const parsed = parseJsonResponse(raw.rawText);
    return { rawText: raw.rawText, parsed, usage: raw.usage };
  }

  async completeWithValidationRetry<T>(
    request: BrainLlmRequest,
    validate: (parsed: unknown) => T,
    options?: { maxRepairAttempts?: number }
  ): Promise<BrainLlmValidationRetryResult<T>> {
    const maxRepairAttempts = options?.maxRepairAttempts ?? 1;
    const maxAttempts = 1 + maxRepairAttempts;
    let lastValidationError: BrainLlmValidationError | null = null;
    let lastResponse: BrainLlmResponse | undefined;
    let validationRepairCount = 0;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const attemptRequest =
        attempt === 0 || !lastValidationError ? request : buildRepairPrompt(request, lastValidationError.issues);

      if (attempt > 0) validationRepairCount += 1;

      const response = await this.complete(attemptRequest, {
        maxHttpRetries: 1,
        attemptNumber: attempt + 1,
      });
      lastResponse = response;

      try {
        return {
          result: validate(response.parsed),
          response,
          attemptCount: attempt + 1,
          validationRepairCount,
        };
      } catch (error) {
        if (error instanceof BrainLlmTimeoutError) {
          throw error;
        }
        if (error instanceof BrainLlmValidationError) {
          lastValidationError = error;
          continue;
        }
        throw error;
      }
    }

    throw new BrainLlmValidationRetryExhaustedError(
      lastValidationError?.message ?? "Validation failed after retry.",
      {
        issues: lastValidationError?.issues ?? [],
        structuredIssues:
          lastValidationError instanceof BrainLlmBusinessValidationError
            ? lastValidationError.structuredIssues
            : undefined,
        generatedChannelIds: extractGeneratedChannelIds(lastResponse?.parsed),
        attemptCount: maxAttempts,
        validationRepairCount,
        lastUsage: lastResponse?.usage,
        failureCategory:
          lastValidationError instanceof BrainLlmBusinessValidationError
            ? "business_validation_failed"
            : "schema_validation_failed",
      }
    );
  }
}

export function createBrainLlmClient(provider?: BrainLlmProvider): BrainLlmClient {
  return new BrainLlmClient(provider);
}
