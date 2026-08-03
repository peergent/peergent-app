export class BrainLlmError extends Error {
  readonly code: string;
  readonly retryable: boolean;
  readonly statusCode?: number;

  constructor(code: string, message: string, options?: { retryable?: boolean; statusCode?: number }) {
    super(message);
    this.name = "BrainLlmError";
    this.code = code;
    this.retryable = options?.retryable ?? false;
    this.statusCode = options?.statusCode;
  }
}

export class BrainLlmValidationError extends BrainLlmError {
  readonly issues: readonly string[];

  constructor(message: string, issues: readonly string[] = []) {
    super("validation_failed", message, { retryable: false });
    this.name = "BrainLlmValidationError";
    this.issues = issues;
  }
}

export class BrainLlmParseError extends BrainLlmError {
  constructor(message: string) {
    super("json_parse_failed", message, { retryable: true });
    this.name = "BrainLlmParseError";
  }
}

export class BrainLlmMissingKeyError extends BrainLlmError {
  constructor(provider: string) {
    super("missing_api_key", `Missing API key for ${provider}.`, { retryable: false });
    this.name = "BrainLlmMissingKeyError";
  }
}
