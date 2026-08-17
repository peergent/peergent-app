/**
 * Project Engine evaluation — decides what should run next without executing Brains.
 */

import { getStateDefinition } from "./project-state";
import { brainForState, capabilitiesForBrain } from "./stage-router";
import { contextSatisfiedForBrain, isContextReadyForResearch } from "./context-model";
import type { BrainContextSlices } from "./brain-contract";
import type {
  ProjectBrainId,
  ProjectEngineAction,
  ProjectEngineEvaluation,
  ProjectEngineInput,
  ProjectEngineSnapshot,
  ProjectLifecycleState,
} from "./types";

export type EvaluateProjectOptions = {
  locale?: "nl" | "en";
  sliceAvailability?: Partial<BrainContextSlices>;
  /** PX-47 — episode runner coordination flags (not a second state machine) */
  companyBrainComplete?: boolean;
  memoryCheckpoint1Complete?: boolean;
  memoryCheckpoint2Complete?: boolean;
  performanceObservationsAvailable?: boolean;
  validationApprovalPending?: boolean;
};

/** Brains that must complete during the researching lifecycle phase. */
export const RESEARCH_PHASE_BRAINS: readonly ProjectBrainId[] = [
  "research",
  "reasoning",
  "marketing_intelligence",
] as const;

export function researchPhaseComplete(snapshot: ProjectEngineSnapshot): boolean {
  return RESEARCH_PHASE_BRAINS.every((b) => snapshot.completedBrains.includes(b));
}

function nextResearchPhaseBrain(snapshot: ProjectEngineSnapshot): ProjectBrainId | null {
  for (const brainId of RESEARCH_PHASE_BRAINS) {
    if (!snapshot.completedBrains.includes(brainId)) return brainId;
  }
  return null;
}

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
    const companyDone = options.companyBrainComplete ?? snapshot.completedBrains.includes("company");

    if (!companyDone) {
      if (!contextSatisfiedForBrain("company", slices)) {
        return {
          snapshot,
          action: action(
            "collect_context",
            null,
            "Missing context for company",
            nl ? "Context aanvullen" : "Add context"
          ),
          pendingBrains: snapshot.pendingBrains,
          blocked: true,
        };
      }
      return {
        snapshot,
        action: action(
          "run_brain",
          "company",
          "Company understanding required",
          nl ? "Bedrijfscontext vastleggen" : "Capture company context"
        ),
        pendingBrains: snapshot.pendingBrains,
        blocked: false,
      };
    }

    if (!(input.contextReady ?? isContextReadyForResearch(slices))) {
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

    return {
      snapshot,
      action: action(
        "idle",
        null,
        "Company context ready — advance to research phase",
        nl ? "Researchfase starten" : "Begin research phase"
      ),
      pendingBrains: snapshot.pendingBrains,
      blocked: false,
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

  if (snapshot.state === "publishing") {
    if (!snapshot.completedBrains.includes("execution")) {
      return {
        snapshot,
        action: action(
          "run_brain",
          "execution",
          "Execute approved campaign package",
          nl ? "Goedgekeurd pakket uitvoeren" : "Execute approved package"
        ),
        pendingBrains: snapshot.pendingBrains,
        blocked: false,
      };
    }
    return {
      snapshot,
      action: action(
        "idle",
        null,
        "Execution complete — advance to monitoring",
        nl ? "Publicatie voltooid" : "Publication complete"
      ),
      pendingBrains: snapshot.pendingBrains,
      blocked: false,
    };
  }

  if (snapshot.state === "monitoring") {
    if (!input.monitoringComplete && !options.performanceObservationsAvailable) {
      return {
        snapshot,
        action: action(
          "monitor",
          null,
          "Awaiting performance observations",
          nl ? "Wachten op resultaten" : "Waiting for outcomes"
        ),
        pendingBrains: snapshot.pendingBrains,
        blocked: false,
      };
    }
    if (input.monitoringComplete ?? options.performanceObservationsAvailable) {
      return {
        snapshot,
        action: action(
          "learn",
          "learning",
          "Observations available",
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

  if (snapshot.state === "researching") {
    const slices = buildSlices(options.sliceAvailability);
    const nextBrain = nextResearchPhaseBrain(snapshot);
    if (nextBrain) {
      if (!contextSatisfiedForBrain(nextBrain, slices)) {
        return {
          snapshot,
          action: action(
            "collect_context",
            null,
            `Missing context for ${nextBrain}`,
            nl ? "Context aanvullen" : "Add context"
          ),
          pendingBrains: snapshot.pendingBrains,
          blocked: true,
        };
      }
      return {
        snapshot,
        action: action(
          "run_brain",
          nextBrain,
          `Schedule ${nextBrain}`,
          nl ? `${nextBrain} starten` : `Start ${nextBrain}`
        ),
        pendingBrains: snapshot.pendingBrains,
        blocked: false,
      };
    }
    if (researchPhaseComplete(snapshot)) {
      return {
        snapshot,
        action: action(
          "idle",
          null,
          "Research phase complete",
          nl ? "Research afgerond" : "Research complete"
        ),
        pendingBrains: snapshot.pendingBrains,
        blocked: false,
      };
    }
  }

  if (
    !researchPhaseComplete(snapshot) &&
    (snapshot.state === "strategizing" ||
      snapshot.state === "planning" ||
      snapshot.state === "generating" ||
      snapshot.state === "validating")
  ) {
    const missing = nextResearchPhaseBrain({
      ...snapshot,
      state: "researching",
    });
    if (missing) {
      const slices = buildSlices(options.sliceAvailability);
      if (!contextSatisfiedForBrain(missing, slices)) {
        return {
          snapshot,
          action: action(
            "collect_context",
            null,
            `Missing context for ${missing}`,
            nl ? "Context aanvullen" : "Add context"
          ),
          pendingBrains: snapshot.pendingBrains,
          blocked: true,
        };
      }
      return {
        snapshot,
        action: action(
          "run_brain",
          missing,
          `Research phase prerequisite: ${missing}`,
          nl ? `${missing} starten` : `Start ${missing}`
        ),
        pendingBrains: snapshot.pendingBrains,
        blocked: false,
      };
    }
  }

  if (snapshot.state === "validating") {
    const memoryDone = options.memoryCheckpoint1Complete ?? false;
    if (!snapshot.completedBrains.includes("validation")) {
      const slices = buildSlices(options.sliceAvailability);
      if (!contextSatisfiedForBrain("validation", slices)) {
        return {
          snapshot,
          action: action("collect_context", null, "Missing validation context", nl ? "Context aanvullen" : "Add context"),
          pendingBrains: snapshot.pendingBrains,
          blocked: true,
        };
      }
      return {
        snapshot,
        action: action("run_brain", "validation", "Schedule validation", nl ? "Validatie starten" : "Start validation"),
        pendingBrains: snapshot.pendingBrains,
        blocked: false,
      };
    }
    if (!memoryDone) {
      return {
        snapshot,
        action: action(
          "run_brain",
          "memory",
          "Memory checkpoint after validation",
          nl ? "Geheugen checkpoint" : "Memory checkpoint"
        ),
        pendingBrains: snapshot.pendingBrains,
        blocked: false,
      };
    }
    if (options.validationApprovalPending) {
      return {
        snapshot,
        action: action(
          "wait",
          null,
          "Campaign approval required",
          nl ? "Wacht op campagnegoedkeuring" : "Waiting for campaign approval"
        ),
        pendingBrains: snapshot.pendingBrains,
        blocked: true,
      };
    }
    return {
      snapshot,
      action: action("idle", null, "Validation and memory checkpoint complete", nl ? "Validatie voltooid" : "Validation complete"),
      pendingBrains: snapshot.pendingBrains,
      blocked: false,
    };
  }

  if (snapshot.state === "learning") {
    const memoryDone = options.memoryCheckpoint2Complete ?? false;
    if (!snapshot.completedBrains.includes("learning")) {
      return {
        snapshot,
        action: action("run_brain", "learning", "Schedule learning", nl ? "Learning starten" : "Start learning"),
        pendingBrains: snapshot.pendingBrains,
        blocked: false,
      };
    }
    if (!memoryDone) {
      return {
        snapshot,
        action: action(
          "run_brain",
          "memory",
          "Memory second-pass after learning",
          nl ? "Geheugen bijwerken" : "Update memory"
        ),
        pendingBrains: snapshot.pendingBrains,
        blocked: false,
      };
    }
    return {
      snapshot,
      action: action("complete", null, "Learning and memory complete", nl ? "Project voltooid" : "Project complete"),
      pendingBrains: [],
      blocked: false,
    };
  }

  const requiredBrain = stateDef?.requiredBrain ?? brainForState(snapshot.state);

  if (stateDef?.entryRequires.length) {
    const missingEntry = stateDef.entryRequires.find((b) => !snapshot.completedBrains.includes(b));
    if (missingEntry) {
      const slices = buildSlices(options.sliceAvailability);
      if (!contextSatisfiedForBrain(missingEntry, slices)) {
        return {
          snapshot,
          action: action(
            "collect_context",
            null,
            `Missing context for ${missingEntry}`,
            nl ? "Context aanvullen" : "Add context"
          ),
          pendingBrains: snapshot.pendingBrains,
          blocked: true,
        };
      }
      return {
        snapshot,
        action: action(
          "run_brain",
          missingEntry,
          `Entry requirement: ${missingEntry}`,
          nl ? `${missingEntry} starten` : `Start ${missingEntry}`
        ),
        pendingBrains: snapshot.pendingBrains,
        blocked: false,
      };
    }
  }

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
