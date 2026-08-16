/**
 * Advance project episode — pure state transitions after brain results or approvals.
 */

import {
  createApprovalCheckpoint,
  resolveApprovalGate,
  resolvePublicationConfirmGate,
  satisfyApprovalCheckpoint,
} from "./approval-model";
import { requiresPublicationApproval } from "../policy/campaign-approval-policy";
import { appendProjectEvent, createProjectEngineEvent } from "./event-model";
import { withProjectState } from "./create-snapshot";
import {
  evaluateProjectEpisode,
  markBrainCompleted,
  nextStateAfterBrainComplete,
  researchPhaseComplete,
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
    snapshot = applyBrainResult(snapshot, input.lastBrainResult, nl, now, input);
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
  now: Date,
  input: ProjectEngineInput
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

  if (result.status === "waiting_for_input") {
    return {
      ...next,
      activeBrain: result.brainId,
      waitingReason: "missing_context",
      updatedAt: now.toISOString(),
    };
  }

  const mode = input.campaignApprovalMode ?? "approval_before_publication";
  const gate = resolveApprovalGate(result.brainId, mode);
  const deferApprovalPause =
    result.brainId === "validation" && requiresPublicationApproval(mode);

  if (
    !deferApprovalPause &&
    (result.status === "waiting_approval" ||
      (result.status === "completed" && result.requiresApproval && gate))
  ) {
    if (!gate) {
      if (result.status === "waiting_approval" && result.brainId === "execution") {
        const pubGate = resolvePublicationConfirmGate();
        const checkpoint = createApprovalCheckpoint(pubGate, nl, now);
        return {
          ...next,
          state: "waiting_for_approval",
          activeBrain: result.brainId,
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
          updatedAt: now.toISOString(),
        };
      }

      if (result.status === "waiting_approval") {
        const cognitiveAutonomous =
          mode === "approval_before_publication" || mode === "no_approval_required";
        if (cognitiveAutonomous) {
          next = markBrainCompleted(next, result.brainId, now);
          const nextState = resolveNextStateAfterBrainComplete(snapshot.state, result, next, input);
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
          return next;
        }

        return {
          ...next,
          state: "waiting_for_approval",
          activeBrain: result.brainId,
          waitingReason: "approval_required",
          updatedAt: now.toISOString(),
        };
      }

      next = markBrainCompleted(next, result.brainId, now);
      const nextState = resolveNextStateAfterBrainComplete(snapshot.state, result, next, input);
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
      return next;
    }

    const checkpoint = createApprovalCheckpoint(gate, nl, now);

    const completed = markBrainCompleted(next, result.brainId, now);
    return {
      ...completed,
      state: "waiting_for_approval",
      waitingReason: "approval_required",
      approvalCheckpoint: checkpoint,
      eventLog: appendProjectEvent(
        completed,
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
    const nextState = resolveNextStateAfterBrainComplete(snapshot.state, result, next, input);
    next = withProjectState(next, nextState, now);

    if (
      nextState === "waiting_for_approval" &&
      input.validationApprovalPending &&
      !next.approvalCheckpoint
    ) {
      const gate = resolveApprovalGate("validation", mode);
      if (gate) {
        next = {
          ...next,
          waitingReason: "approval_required",
          approvalCheckpoint: createApprovalCheckpoint(gate, nl, now),
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
    }

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

function resolveNextStateAfterBrainComplete(
  current: ProjectEngineSnapshot["state"],
  result: NonNullable<ProjectEngineInput["lastBrainResult"]>,
  snapshot: ProjectEngineSnapshot,
  input: ProjectEngineInput
): ProjectEngineSnapshot["state"] {
  if (current === "researching") {
    return researchPhaseComplete(snapshot) ? "strategizing" : "researching";
  }
  if (current === "validating" && result.brainId === "validation") {
    return "validating";
  }
  if (current === "validating" && result.brainId === "memory") {
    return input.validationApprovalPending ? "waiting_for_approval" : "ready_to_publish";
  }
  if (current === "learning" && result.brainId === "learning") {
    return "learning";
  }
  if (current === "monitoring" && result.brainId === "learning") {
    return "learning";
  }
  if (current === "learning" && result.brainId === "memory") {
    return "complete";
  }
  if (current === "collecting_context" && result.brainId === "company") {
    return "collecting_context";
  }
  return nextStateAfterBrainComplete(current, false);
}
