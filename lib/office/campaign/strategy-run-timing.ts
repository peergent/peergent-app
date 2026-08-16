import type { StrategyRunStatus } from "./strategy-run-types";

const TERMINAL: ReadonlySet<StrategyRunStatus> = new Set([
  "completed",
  "waiting_for_input",
  "waiting_for_approval",
  "failed",
  "cancelled",
]);

export function isTerminalStrategyRunStatus(
  status: StrategyRunStatus | undefined
): boolean {
  if (!status) return false;
  return TERMINAL.has(status);
}

type TimingMark =
  | "ACTION_ENTER"
  | "ENQUEUE_ENTER"
  | "BRAIN_ENTER"
  | "PROVIDER_SELECTED"
  | "OPENAI_STARTED"
  | "OPENAI_FINISHED"
  | "BRAIN_RETURNED"
  | "ENQUEUE_RETURNED"
  | "ACTION_RETURNED";

const marks = new Map<string, Partial<Record<TimingMark, number>>>();

function runKey(runId: string): string {
  return runId;
}

export function startStrategyRunTiming(runId: string): void {
  if (process.env.NODE_ENV === "production") return;
  marks.set(runKey(runId), { ACTION_ENTER: Date.now() });
}

export function markStrategyRunTiming(
  runId: string,
  mark: TimingMark,
  detail?: string
): void {
  if (process.env.NODE_ENV === "production") return;
  const key = runKey(runId);
  const bucket = marks.get(key) ?? {};
  bucket[mark] = Date.now();
  marks.set(key, bucket);
  const start = bucket.ACTION_ENTER ?? bucket.ENQUEUE_ENTER;
  const elapsedMs = start ? Date.now() - start : 0;
  console.info("[strategy-run-timing]", mark, {
    runId,
    elapsedMs,
    detail: detail ?? null,
  });
}

export function finishStrategyRunTiming(runId: string, terminalStatus: StrategyRunStatus): void {
  if (process.env.NODE_ENV === "production") return;
  markStrategyRunTiming(runId, "ACTION_RETURNED", terminalStatus);
  marks.delete(runKey(runId));
}
