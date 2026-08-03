import { BrainLlmError } from "./errors";

const RETRYABLE_STATUS = new Set([429, 500, 502, 503, 504]);

export function isRetryableLlmError(error: unknown): boolean {
  if (error instanceof BrainLlmError) return error.retryable;
  if (error instanceof Error && error.name === "AbortError") return true;
  return false;
}

export function isRetryableHttpStatus(status: number): boolean {
  return RETRYABLE_STATUS.has(status);
}

export async function withLlmRetry<T>(
  fn: () => Promise<T>,
  options?: { maxAttempts?: number; baseDelayMs?: number }
): Promise<T> {
  const maxAttempts = options?.maxAttempts ?? 3;
  const baseDelayMs = options?.baseDelayMs ?? 400;
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt >= maxAttempts || !isRetryableLlmError(error)) {
        throw error;
      }
      const delay = baseDelayMs * Math.pow(2, attempt - 1);
      await new Promise((r) => setTimeout(r, delay));
    }
  }

  throw lastError;
}
