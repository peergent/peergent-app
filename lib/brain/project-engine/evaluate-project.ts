/**
 * Project Engine evaluation — decides what should run next without executing Brains.
 */

import { getStateDefinition } from "./project-state";
import { brainForState, capabilitiesForBrain } from "./stage-router";
import { contextSatisfiedForBrain, isContextReadyForResearch } from "./context-model";
import type { BrainContextSlices } from "./brain-contract";
import type {
  ProjectEngineAction,
  ProjectEngineEvaluation,
  ProjectEngineInput,
  ProjectEngineSnapshot,
  ProjectLifecycleState,
} from "./types";

export type EvaluateProjectOptions = {
  locale?: "nl" | "en";
  sliceAvailability?: Partial<BrainContextSlices>;
};

function action(
  kind: ProjectEngineAction["kind"],
  brainId: ProjectEngineAction["brainId"],
  reason: string,
  customerLabel: string
): ProjectEngineAction {
  return { kind, brainId, reason, customerLabel };
}

/** Pure evaluation — returns next action without side effects. */
export function evaluateProjectEpisode(
  input: ProjectEngineInput,
  options: EvaluateProjectOptions = {}
): ProjectEngineEvaluation {
  const nl = options.locale === "nl";
  const snapshot = input.snapshot;
  const stateDef = getStateDefinition(snapshot.state);

  if (snapshot.state === "complete") {
    return {
      snapshot,
      action: action("complete", null, "Project complete", nl ? "Project voltooid" : "Project complete"),
      pendingBrains: [],
      blocked: false,
    };
  }

  if (snapshot.state === "failed") {
    const retries = snapshot.activeBrain
      ? (snapshot.retryCount[snapshot.activeBrain] ?? 0)
      : 0;
    if (retries < 3 && snapshot.activeBrain) {
      return {
        snapshot,
        action: action(
          "retry",
          snapshot.activeBrain,
          "Retry after failure",
          nl ? "Opnieuw proberen" : "Retry"
        ),
        pendingBrains: snapshot.pendingBrains,
        blocked: false,
      };
    }
    return {
      snapshot,
      action: action("recover", null, "Manual recovery required", nl ? "Herstel vereist" : "Recovery required"),
      pendingBrains: snapshot.pendingBrains,
      blocked: true,
    };
  }

  if (snapshot.state === "waiting_for_approval") {
    if (input.approvalSatisfied) {
      return {
        snapshot,
        action: action(
          "publish",
          null,
          "Approval satisfied",
          nl ? "Doorgaan na goedkeuring" : "Continue after approval"
        ),
        pendingBrains: snapshot.pendingBrains,
        blocked: false,
      };
    }
    return {
      snapshot,
      action: action(
        "wait",
        null,
        "Approval required",
        snapshot.approvalCheckpoint?.customerSummary ??
          (nl ? "Wacht op goedkeuring" : "Waiting for approval")
      ),
      pendingBrains: snapshot.pendingBrains,
      blocked: true,
    };
  }

  if (snapshot.state === "collecting_context") {
    const slices = buildSlices(options.sliceAvailability);
    if (input.contextReady ?? isContextReadyForResearch(slices)) {
      return {
        snapshot,
        action: action(
          "run_brain",
          "research",
          "Context ready",
          nl ? "Research starten" : "Start research"
        ),
        pendingBrains: snapshot.pendingBrains,
        blocked: false,
      };
    }
    return {
      snapshot,
      action: action(
        "collect_context",
        null,
        "Missing context",
        nl ? "Context verzamelen" : "Collect context"
      ),
      pendingBrains: snapshot.pendingBrains,
      blocked: true,
    };
  }

  if (snapshot.state === "ready_to_publish") {
    return {
      snapshot,
      action: action(
        "publish",
        "execution",
        "Ready to publish",
        nl ? "Publiceren" : "Publish"
      ),
      pendingBrains: snapshot.pendingBrains,
      blocked: false,
    };
  }

  if (snapshot.state === "monitoring") {
    if (input.monitoringComplete) {
      return {
        snapshot,
        action: action(
          "learn",
          "learning",
          "Monitoring complete",
          nl ? "Learning starten" : "Start learning"
        ),
        pendingBrains: snapshot.pendingBrains,
        blocked: false,
      };
    }
    return {
      snapshot,
      action: action(
        "monitor",
        null,
        "Monitoring in progress",
        nl ? "Monitoring actief" : "Monitoring active"
      ),
      pendingBrains: snapshot.pendingBrains,
      blocked: false,
    };
  }

  const requiredBrain = stateDef?.requiredBrain ?? brainForState(snapshot.state);

  if (requiredBrain) {
    const slices = buildSlices(options.sliceAvailability);
    if (!contextSatisfiedForBrain(requiredBrain, slices)) {
      return {
        snapshot,
        action: action(
          "collect_context",
          null,
          `Missing context for ${requiredBrain}`,
          nl ? "Context aanvullen" : "Add context"
        ),
        pendingBrains: snapshot.pendingBrains,
        blocked: true,
      };
    }

    if (snapshot.activeBrain === requiredBrain) {
      return {
        snapshot,
        action: action(
          "run_brain",
          requiredBrain,
          "Brain in progress",
          nl ? `${requiredBrain} actief` : `${requiredBrain} active`
        ),
        pendingBrains: snapshot.pendingBrains,
        blocked: false,
      };
    }

    if (snapshot.completedBrains.includes(requiredBrain)) {
      return {
        snapshot,
        action: action(
          "idle",
          null,
          "Brain already completed for state",
          nl ? "Fase voltooid" : "Phase complete"
        ),
        pendingBrains: snapshot.pendingBrains.filter((b) => b !== requiredBrain),
        blocked: false,
      };
    }

    void capabilitiesForBrain(requiredBrain);

    return {
      snapshot,
      action: action(
        "run_brain",
        requiredBrain,
        `Schedule ${requiredBrain}`,
        nl ? `${requiredBrain} starten` : `Start ${requiredBrain}`
      ),
      pendingBrains: snapshot.pendingBrains,
      blocked: false,
    };
  }

  return {
    snapshot,
    action: action("idle", null, "No brain required", nl ? "Gecoördineerd" : "Coordinating"),
    pendingBrains: snapshot.pendingBrains,
    blocked: false,
  };
}

function buildSlices(partial?: Partial<BrainContextSlices>): BrainContextSlices {
  return {
    business: partial?.business ?? false,
    brand: partial?.brand ?? false,
    website: partial?.website ?? false,
    products: partial?.products ?? false,
    competitors: partial?.competitors ?? false,
    goals: partial?.goals ?? false,
    campaign: partial?.campaign ?? true,
  };
}

/** Compute next lifecycle state after a brain completes (pure). */
export function nextStateAfterBrainComplete(
  current: ProjectLifecycleState,
  requiresApproval: boolean
): ProjectLifecycleState {
  const transitions: Partial<Record<ProjectLifecycleState, ProjectLifecycleState>> = {
    researching: "strategizing",
    strategizing: requiresApproval ? "waiting_for_approval" : "planning",
    planning: requiresApproval ? "waiting_for_approval" : "generating",
    generating: requiresApproval ? "waiting_for_approval" : "validating",
    validating: requiresApproval ? "waiting_for_approval" : "ready_to_publish",
    publishing: "monitoring",
    learning: "complete",
  };
  return transitions[current] ?? current;
}

export function markBrainActive(
  snapshot: ProjectEngineSnapshot,
  brainId: NonNullable<ProjectEngineSnapshot["activeBrain"]>,
  now: Date
): ProjectEngineSnapshot {
  return {
    ...snapshot,
    activeBrain: brainId,
    updatedAt: now.toISOString(),
  };
}

export function markBrainCompleted(
  snapshot: ProjectEngineSnapshot,
  brainId: NonNullable<ProjectEngineSnapshot["activeBrain"]>,
  now: Date
): ProjectEngineSnapshot {
  const completed = snapshot.completedBrains.includes(brainId)
    ? snapshot.completedBrains
    : [...snapshot.completedBrains, brainId];

  return {
    ...snapshot,
    activeBrain: null,
    completedBrains: completed,
    pendingBrains: snapshot.pendingBrains.filter((b) => b !== brainId),
    updatedAt: now.toISOString(),
  };
}
