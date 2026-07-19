export class AIRuntimeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AIRuntimeError";
  }
}

export class MissingApiKeyError extends AIRuntimeError {
  constructor(providerName: string) {
    super(
      `Missing API key for ${providerName}. Set OPENAI_API_KEY in your environment.`
    );
    this.name = "MissingApiKeyError";
  }
}

export class LLMProviderError extends AIRuntimeError {
  readonly statusCode?: number;
  readonly providerName: string;

  constructor(providerName: string, message: string, statusCode?: number) {
    super(message);
    this.name = "LLMProviderError";
    this.providerName = providerName;
    this.statusCode = statusCode;
  }
}

export function toDeveloperErrorMessage(error: unknown): string {
  if (error instanceof MissingApiKeyError) {
    return error.message;
  }

  if (error instanceof LLMProviderError) {
    if (error.statusCode === 429) {
      return "OpenAI rate limit reached. Wait a moment and try again.";
    }

    if (error.statusCode && error.statusCode >= 500) {
      return "OpenAI is temporarily unavailable. Try again shortly.";
    }

    return error.message;
  }

  if (error instanceof AIRuntimeError) {
    return error.message;
  }

  if (error instanceof Error) {
    if (/fetch failed|network/i.test(error.message)) {
      return "Network failure while contacting the AI provider.";
    }

    return error.message;
  }

  return "Unexpected AI runtime error.";
}
