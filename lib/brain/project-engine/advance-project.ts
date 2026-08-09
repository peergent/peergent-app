/**
 * Advance project episode — pure state transitions after brain results or approvals.
 */

import {
  createApprovalCheckpoint,
  resolveApprovalGate,
  satisfyApprovalCheckpoint,
} from "./approval-model";
import { appendProjectEvent, createProjectEngineEvent } from "./event-model";
import { withProjectState } from "./create-snapshot";
import {
  evaluateProjectEpisode,
  markBrainCompleted,
  nextStateAfterBrainComplete,
} from "./evaluate-project";
import type {
  BrainExecutionRecord,
  ProjectEngineEvaluation,
  ProjectEngineInput,
  ProjectEngineSnapshot,
} from "./types";

/** Advance snapshot based on brain result or external signals. Returns evaluation for new state. */
export function advanceProjectEpisode(
  input: ProjectEngineInput,
  options: { locale?: "nl" | "en" } = {}
): ProjectEngineEvaluation {
  const now = input.now ?? new Date();
  const nl = options.locale === "nl";
  let snapshot = input.snapshot;

  if (input.approvalSatisfied && snapshot.approvalCheckpoint && !snapshot.approvalCheckpoint.satisfied) {
    const unblocks = snapshot.approvalCheckpoint.unblocksState;
    snapshot = {
      ...snapshot,
      approvalCheckpoint: satisfyApprovalCheckpoint(snapshot.approvalCheckpoint, now),
      waitingReason: null,
      state: unblocks,
      eventLog: appendProjectEvent(
        snapshot,
        createProjectEngineEvent({
          type: "approval_granted",
          brainId: null,
          state: unblocks,
          nl,
          at: now,
        })
      ),
      updatedAt: now.toISOString(),
    };
  }

  if (input.lastBrainResult) {
    snapshot = applyBrainResult(snapshot, input.lastBrainResult, nl, now);
  }

  if (input.published && snapshot.state === "publishing") {
    snapshot = withProjectState(snapshot, "monitoring", now);
    snapshot = {
      ...snapshot,
      eventLog: appendProjectEvent(
        snapshot,
        createProjectEngineEvent({
          type: "publish_completed",
          brainId: "execution",
          state: "monitoring",
          nl,
          at: now,
        })
      ),
    };
  }

  if (input.contextReady && snapshot.state === "created") {
    snapshot = withProjectState(snapshot, "collecting_context", now);
  }

  if (input.contextReady && snapshot.state === "collecting_context") {
    snapshot = withProjectState(snapshot, "researching", now);
    snapshot = {
      ...snapshot,
      eventLog: appendProjectEvent(
        snapshot,
        createProjectEngineEvent({
          type: "context_ready",
          brainId: null,
          state: "researching",
          nl,
          at: now,
        })
      ),
    };
  }

  return evaluateProjectEpisode({ ...input, snapshot }, options);
}

function applyBrainResult(
  snapshot: ProjectEngineSnapshot,
  result: NonNullable<ProjectEngineInput["lastBrainResult"]>,
  nl: boolean,
  now: Date
): ProjectEngineSnapshot {
  const record: BrainExecutionRecord = {
    id: `run-${result.brainId}-${now.getTime()}`,
    brainId: result.brainId,
    capabilityIds: [],
    status: result.status,
    startedAt: snapshot.updatedAt,
    completedAt: now.toISOString(),
    outputRef: result.outputRef,
    confidence: result.confidence,
    durationMs: result.durationMs,
    retryAttempt: snapshot.retryCount[result.brainId] ?? 0,
    errorCode: result.errorCode,
  };

  let next: ProjectEngineSnapshot = {
    ...snapshot,
    brainHistory: [...snapshot.brainHistory, record],
    decisionIds: result.decisionIds
      ? [...new Set([...snapshot.decisionIds, ...result.decisionIds])]
      : snapshot.decisionIds,
  };

  if (result.status === "failed") {
    const attempt = (next.retryCount[result.brainId] ?? 0) + 1;
    return {
      ...next,
      state: "failed",
      activeBrain: result.brainId,
      retryCount: { ...next.retryCount, [result.brainId]: attempt },
      waitingReason: "retry_backoff",
      eventLog: appendProjectEvent(
        next,
        createProjectEngineEvent({
          type: "brain_failed",
          brainId: result.brainId,
          state: "failed",
          nl,
          at: now,
        })
      ),
      updatedAt: now.toISOString(),
    };
  }

  if (result.status === "waiting_approval") {
    const gate = resolveApprovalGate(result.brainId);
    const checkpoint = gate
      ? createApprovalCheckpoint(gate, nl, now)
      : next.approvalCheckpoint;

    return {
      ...markBrainCompleted(next, result.brainId, now),
      state: "waiting_for_approval",
      waitingReason: "approval_required",
      approvalCheckpoint: checkpoint,
      eventLog: appendProjectEvent(
        next,
        createProjectEngineEvent({
          type: "approval_required",
          brainId: result.brainId,
          state: "waiting_for_approval",
          nl,
          at: now,
        })
      ),
    };
  }

  if (result.status === "completed") {
    next = markBrainCompleted(next, result.brainId, now);
    const nextState = nextStateAfterBrainComplete(snapshot.state, false);
    next = withProjectState(next, nextState, now);
    next = {
      ...next,
      eventLog: appendProjectEvent(
        next,
        createProjectEngineEvent({
          type: "brain_completed",
          brainId: result.brainId,
          state: nextState,
          nl,
          at: now,
        })
      ),
    };
  }

  return next;
}
