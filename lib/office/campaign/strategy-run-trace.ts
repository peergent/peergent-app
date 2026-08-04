/** Safe lifecycle stages for live strategy server-action execution (dev diagnostics). */

export type StrategyRunTraceStage =
  | "client_trigger"
  | "client_optimistic_queued"
  | "client_optimistic_gathering"
  | "client_request_pending"
  | "server_action_entered"
  | "server_auth_completed"
  | "server_domain_input_built"
  | "server_run_enqueued"
  | "server_context_gathering_started"
  | "server_context_gathering_completed"
  | "server_provider_selected"
  | "server_openai_request_started"
  | "server_openai_request_completed"
  | "server_validation_completed"
  | "server_project_patch_produced"
  | "server_action_returned"
  | "server_action_timeout"
  | "server_serialization_error"
  | "client_received_result"
  | "client_applied_project_update"
  | "client_reconciliation_error"
  | "client_request_timeout"
  | "client_stale_optimistic_recovered";

export type StrategyRunTraceEvent = {
  stage: StrategyRunTraceStage;
  at: string;
  detail?: string;
};

export type StrategyRunTrace = {
  events: StrategyRunTraceEvent[];
  lastStage?: StrategyRunTraceStage;
};

export function createStrategyRunTrace(): StrategyRunTrace {
  return { events: [] };
}

export function recordStrategyRunTrace(
  trace: StrategyRunTrace,
  stage: StrategyRunTraceStage,
  detail?: string
): void {
  trace.events.push({ stage, at: new Date().toISOString(), detail });
  trace.lastStage = stage;
  if (process.env.NODE_ENV === "development") {
    console.info("[strategy-run-trace]", stage, detail ?? "");
  }
}

export function strategyRunTraceSummary(trace: StrategyRunTrace): {
  lastStage?: StrategyRunTraceStage;
  lastAt?: string;
  eventCount: number;
} {
  const last = trace.events.at(-1);
  return {
    lastStage: trace.lastStage,
    lastAt: last?.at,
    eventCount: trace.events.length,
  };
}

/** Dev-safe trace payload — no secrets, no prompts, no raw domain objects. */
export function toDevTracePayload(trace: StrategyRunTrace): {
  lastStage?: StrategyRunTraceStage;
  lastAt?: string;
  stages: StrategyRunTraceStage[];
} {
  return {
    lastStage: trace.lastStage,
    lastAt: trace.events.at(-1)?.at,
    stages: trace.events.map((event) => event.stage),
  };
}
