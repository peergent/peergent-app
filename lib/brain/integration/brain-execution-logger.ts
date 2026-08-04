import { logBrainOperation } from "../persistence/brain-logger";

export type BrainExecutionDevLog = {
  runId: string;
  capability: string;
  environment: string;
  providerSelected: string;
  model?: string;
  requestStartedAt: string;
  requestCompletedAt?: string;
  inputTokens?: number;
  outputTokens?: number;
  latencyMs?: number;
  validationResult?: "valid" | "invalid" | "skipped";
  fallbackUsed?: boolean;
  fallbackReason?: string;
};

function isDevLoggingEnabled(): boolean {
  return process.env.NODE_ENV === "development";
}

/** Development-only structured execution logs — never includes secrets or raw prompts. */
export function logBrainExecutionDev(input: BrainExecutionDevLog): void {
  if (!isDevLoggingEnabled()) return;
  logBrainOperation({
    level: "info",
    event: "brain_execution_dev",
    runId: input.runId,
    capability: input.capability,
    transition: input.environment,
    durationMs: input.latencyMs,
    repositoryOutcome: input.validationResult === "invalid" ? "error" : "ok",
    errorClassification: input.fallbackUsed ? input.fallbackReason : undefined,
  });
  console.info("[brain-dev]", {
    runId: input.runId,
    capability: input.capability,
    environment: input.environment,
    providerSelected: input.providerSelected,
    model: input.model ?? "—",
    inputTokens: input.inputTokens ?? 0,
    outputTokens: input.outputTokens ?? 0,
    latencyMs: input.latencyMs ?? null,
    validationResult: input.validationResult ?? "skipped",
    fallbackUsed: Boolean(input.fallbackUsed),
    fallbackReason: input.fallbackReason ?? null,
  });
}
