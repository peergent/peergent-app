import type { BrainRunStatus } from "./run-lifecycle";
import { BrainRunTransitionError } from "./errors";

const TRANSITIONS: Readonly<Record<BrainRunStatus, readonly BrainRunStatus[]>> = {
  queued: ["gathering_context", "cancelled"],
  gathering_context: ["ready", "waiting_for_input", "blocked", "failed", "cancelled"],
  ready: ["running", "blocked", "cancelled"],
  running: ["completed", "partial", "waiting_for_approval", "failed", "cancelled"],
  waiting_for_input: ["gathering_context", "cancelled"],
  waiting_for_approval: ["running", "completed", "cancelled"],
  blocked: ["gathering_context", "cancelled"],
  completed: [],
  partial: [],
  failed: [],
  cancelled: [],
};

export function assertValidTransition(from: BrainRunStatus, to: BrainRunStatus): void {
  const allowed = TRANSITIONS[from] ?? [];
  if (!allowed.includes(to)) {
    throw new BrainRunTransitionError(from, to);
  }
}

export function canTransition(from: BrainRunStatus, to: BrainRunStatus): boolean {
  return (TRANSITIONS[from] ?? []).includes(to);
}

export function transitionStatus(from: BrainRunStatus, to: BrainRunStatus): BrainRunStatus {
  assertValidTransition(from, to);
  return to;
}
