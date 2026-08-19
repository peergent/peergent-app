export class IntelligenceLlmUnavailableError extends Error {
  readonly code = "intelligence_llm_unavailable" as const;

  constructor(
    readonly reason: string,
    message?: string
  ) {
    super(message ?? `Intelligence LLM unavailable: ${reason}`);
    this.name = "IntelligenceLlmUnavailableError";
  }
}

export class IntelligenceLlmExecutionError extends Error {
  readonly code = "intelligence_llm_failed" as const;

  constructor(
    readonly reason: string,
    message?: string
  ) {
    super(message ?? `Intelligence LLM execution failed: ${reason}`);
    this.name = "IntelligenceLlmExecutionError";
  }
}
