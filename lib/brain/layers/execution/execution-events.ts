import type { ExecutionEvent, ExecutionEventType, ExecutionStatus } from "./types";

let eventCounter = 0;

export function resetExecutionEventCounter(): void {
  eventCounter = 0;
}

function nextEventId(prefix: string): string {
  eventCounter += 1;
  return `evt-exec-${prefix}-${eventCounter}`;
}

export function createExecutionEvent(input: {
  type: ExecutionEventType;
  executionId: string;
  status: ExecutionStatus;
  summary: string;
  correlationId: string;
  provider?: import("./types").ExecutionProviderId | null;
  at?: string;
}): ExecutionEvent {
  return {
    id: nextEventId(input.type),
    type: input.type,
    executionId: input.executionId,
    at: input.at ?? new Date().toISOString(),
    provider: input.provider ?? null,
    status: input.status,
    summary: input.summary,
    correlationId: input.correlationId,
  };
}

export function eventsForResult(input: {
  executionId: string;
  correlationId: string;
  provider: import("./types").ExecutionProviderId;
  resultStatus: ExecutionStatus;
  dryRun: boolean;
}): ExecutionEvent[] {
  const events: ExecutionEvent[] = [
    createExecutionEvent({
      type: "execution_requested",
      executionId: input.executionId,
      status: "READY",
      summary: input.dryRun ? "Dry run requested." : "Execution requested.",
      correlationId: input.correlationId,
      provider: input.provider,
    }),
    createExecutionEvent({
      type: "execution_started",
      executionId: input.executionId,
      status: "EXECUTING",
      summary: input.dryRun ? "Dry run started." : "Execution started.",
      correlationId: input.correlationId,
      provider: input.provider,
    }),
    createExecutionEvent({
      type: "provider_called",
      executionId: input.executionId,
      status: "EXECUTING",
      summary: input.dryRun
        ? "Provider validated without side effects."
        : "Provider adapter invoked.",
      correlationId: input.correlationId,
      provider: input.provider,
    }),
  ];

  if (input.resultStatus === "SUCCEEDED") {
    events.push(
      createExecutionEvent({
        type: "execution_succeeded",
        executionId: input.executionId,
        status: "SUCCEEDED",
        summary: input.dryRun ? "Dry run succeeded (simulated)." : "Provider confirmed success.",
        correlationId: input.correlationId,
        provider: input.provider,
      })
    );
  } else if (input.resultStatus === "RETRYABLE") {
    events.push(
      createExecutionEvent({
        type: "execution_retryable",
        executionId: input.executionId,
        status: "RETRYABLE",
        summary: "Provider failure classified as retryable.",
        correlationId: input.correlationId,
        provider: input.provider,
      })
    );
  } else if (input.resultStatus === "PARTIALLY_SUCCEEDED") {
    events.push(
      createExecutionEvent({
        type: "execution_partially_succeeded",
        executionId: input.executionId,
        status: "PARTIALLY_SUCCEEDED",
        summary: "Partial execution completed.",
        correlationId: input.correlationId,
        provider: input.provider,
      })
    );
  } else if (input.resultStatus === "CANCELLED") {
    events.push(
      createExecutionEvent({
        type: "execution_cancelled",
        executionId: input.executionId,
        status: "CANCELLED",
        summary: "Execution cancelled.",
        correlationId: input.correlationId,
        provider: input.provider,
      })
    );
  } else {
    events.push(
      createExecutionEvent({
        type: "execution_failed",
        executionId: input.executionId,
        status: input.resultStatus,
        summary: "Execution failed.",
        correlationId: input.correlationId,
        provider: input.provider,
      })
    );
  }

  return events;
}
