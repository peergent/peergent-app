/** Persisted live strategy execution state on campaign projects. */

export type StrategyRunStatus =
  | "idle"
  | "queued"
  | "gathering_context"
  | "running"
  | "validating"
  | "completed"
  | "waiting_for_input"
  | "failed"
  | "cancelled";

export type StrategyRunState = {
  status: StrategyRunStatus;
  runId?: string;
  startedAt?: string;
  completedAt?: string;
  failureCode?: string;
  failureMessageSafe?: string;
  provider?: string;
  fallbackUsed?: boolean;
  contextVersion?: number;
  idempotencyKey?: string;
  stageLabel?: string;
  /** Dev-safe last lifecycle stage for server-action diagnostics. */
  traceLastStage?: string;
  /** Dev-only — stable trigger key for this run. */
  devTriggerKey?: string;
  /** Dev-only — client action invocation count. */
  devActionInvocationCount?: number;
  /** Dev-only — last server action round-trip duration (ms). */
  devActionDurationMs?: number;
  /** Dev-only — concurrent request reused in-flight promise. */
  devInFlightReused?: boolean;
  /** Dev-only — terminal status from last server response. */
  devTerminalState?: StrategyRunStatus;
  /** Dev-only — model id from last Brain run. */
  devModel?: string;
  /** Dev-only — token counts from last Brain run. */
  devInputTokens?: number;
  devOutputTokens?: number;
  initialProvider?: string;
  finalProvider?: string;
  fallbackReason?: string;
};

export const ACTIVE_STRATEGY_RUN_STATUSES: readonly StrategyRunStatus[] = [
  "queued",
  "gathering_context",
  "running",
  "validating",
];

export function isActiveStrategyRunStatus(status: StrategyRunStatus | undefined): boolean {
  if (!status || status === "idle") return false;
  return ACTIVE_STRATEGY_RUN_STATUSES.includes(status);
}

export function buildStrategyIdempotencyKey(input: {
  peerId: string;
  projectId: string;
  contextVersion: number;
  capabilityVersion?: string;
}): string {
  const cap = input.capabilityVersion ?? "v1";
  return `strategy-${input.peerId}-${input.projectId}-ctx${input.contextVersion}-${cap}`;
}

export function strategyRunStageLabel(
  status: StrategyRunStatus,
  locale?: string | null
): string {
  const nl = locale === "nl";
  switch (status) {
    case "queued":
    case "gathering_context":
      return nl ? "Campagnecontext verzamelen" : "Gathering campaign context";
    case "running":
      return nl ? "Strategie ontwikkelen" : "Developing strategy";
    case "validating":
      return nl ? "Strategie controleren" : "Validating strategy";
    default:
      return nl ? "Bedrijf en aanbod begrijpen" : "Understanding business and offer";
  }
}

export function mapProgressLabelToRunStatus(label: string): StrategyRunStatus {
  const lower = label.toLowerCase();
  if (lower.includes("strategie") || lower.includes("strategy")) {
    if (lower.includes("controleert") || lower.includes("checking") || lower.includes("kwaliteit")) {
      return "validating";
    }
    return "running";
  }
  return "gathering_context";
}

export const STRATEGY_RUN_TIMEOUT_MS = 120_000;
/** Slightly above provider/runtime timeout — entire server action must resolve. */
export const STRATEGY_SERVER_ACTION_TIMEOUT_MS = 135_000;
/** Client wait budget — must exceed server action timeout. */
export const STRATEGY_CLIENT_ACTION_TIMEOUT_MS = 140_000;
/** Per upstream dependency cap inside a strategy run. */
export const STRATEGY_DEPENDENCY_TIMEOUT_MS = 45_000;
export const STRATEGY_RUN_STALE_MS = 130_000;

export function isStrategyRunStale(run: StrategyRunState | undefined, now = Date.now()): boolean {
  if (!run?.startedAt || !isActiveStrategyRunStatus(run.status)) return false;
  return now - Date.parse(run.startedAt) > STRATEGY_RUN_STALE_MS;
}

export function customerSafeStrategyFailureMessage(
  code: string | undefined,
  locale?: string | null
): string {
  const nl = locale === "nl";
  if (code === "timeout" || code === "server_action_timeout") {
    return nl
      ? "Het maken van de strategie duurde te lang. Probeer het opnieuw."
      : "Strategy generation took too long. Please try again.";
  }
  if (code === "client_request_timeout") {
    return nl
      ? "De strategie-aanvraag duurde te lang. Probeer het opnieuw."
      : "The strategy request took too long. Please try again.";
  }
  if (code === "serialization_error") {
    return nl
      ? "De strategie kon niet worden verwerkt. Probeer het opnieuw."
      : "The strategy result could not be processed. Please try again.";
  }
  if (code === "waiting_for_input" || code === "needs_info") {
    return nl
      ? "Er ontbreekt nog campagnecontext om een strategie te maken."
      : "Campaign context is still missing to generate a strategy.";
  }
  return nl
    ? "De strategie kon niet worden gemaakt."
    : "The strategy could not be generated.";
}
