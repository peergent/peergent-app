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

export type BrainLlmTimeoutDiagnostics = {
  timeoutOwner: string;
  configuredTimeoutMs: number;
  attemptNumber: number;
  requestStartedAt: string;
  requestAbortedAt: string;
  responseHeadersReceived: boolean;
  responseBodyStarted: boolean;
  httpStatus?: number;
};

export class BrainLlmTimeoutError extends BrainLlmError {
  readonly timeoutDiagnostics: BrainLlmTimeoutDiagnostics;

  constructor(message: string, timeoutDiagnostics: BrainLlmTimeoutDiagnostics) {
    super("timeout", message, { retryable: false });
    this.name = "BrainLlmTimeoutError";
    this.timeoutDiagnostics = timeoutDiagnostics;
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

export type BrainLlmBusinessValidationIssue = {
  code: string;
  path: string;
  expected?: string;
  actual?: string;
  summary: string;
};

export class BrainLlmBusinessValidationError extends BrainLlmValidationError {
  readonly structuredIssues: readonly BrainLlmBusinessValidationIssue[];

  constructor(
    message: string,
    structuredIssues: readonly BrainLlmBusinessValidationIssue[],
    issueMessages?: readonly string[]
  ) {
    super(message, issueMessages ?? structuredIssues.map((issue) => issue.summary));
    this.name = "BrainLlmBusinessValidationError";
    this.structuredIssues = structuredIssues;
  }
}

export class BrainLlmValidationRetryExhaustedError extends BrainLlmValidationError {
  readonly attemptCount: number;
  readonly validationRepairCount: number;
  readonly lastUsage?: import("./types").BrainLlmUsage;
  readonly failureCategory: "schema_validation_failed" | "business_validation_failed";
  readonly structuredIssues?: readonly BrainLlmBusinessValidationIssue[];
  readonly generatedChannelIds?: readonly string[];

  constructor(
    message: string,
    input: {
      issues?: readonly string[];
      structuredIssues?: readonly BrainLlmBusinessValidationIssue[];
      generatedChannelIds?: readonly string[];
      attemptCount: number;
      validationRepairCount?: number;
      lastUsage?: import("./types").BrainLlmUsage;
      failureCategory: "schema_validation_failed" | "business_validation_failed";
    }
  ) {
    super(message, input.issues ?? input.structuredIssues?.map((issue) => issue.summary) ?? []);
    this.name = "BrainLlmValidationRetryExhaustedError";
    this.attemptCount = input.attemptCount;
    this.validationRepairCount = input.validationRepairCount ?? Math.max(0, input.attemptCount - 1);
    this.lastUsage = input.lastUsage;
    this.failureCategory = input.failureCategory;
    this.structuredIssues = input.structuredIssues;
    this.generatedChannelIds = input.generatedChannelIds;
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
