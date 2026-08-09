/**
 * Project lifecycle state machine — entry/exit conditions and brain mapping.
 */

import type { ProjectBrainId, ProjectLifecycleState } from "./types";

export type StateTransitionDefinition = {
  from: ProjectLifecycleState;
  to: ProjectLifecycleState;
  /** Condition id evaluated by engine — see evaluateTransitionCondition */
  condition:
    | "always"
    | "context_ready"
    | "brain_completed"
    | "brain_failed"
    | "approval_required"
    | "approval_satisfied"
    | "publish_ready"
    | "published"
    | "monitoring_complete";
};

export type StateDefinition = {
  state: ProjectLifecycleState;
  /** Primary brain responsible while in this state (null = coordination only) */
  requiredBrain: ProjectBrainId | null;
  /** Brains that must complete before entering this state */
  entryRequires: readonly ProjectBrainId[];
  /** Valid next states */
  exits: readonly ProjectLifecycleState[];
  /** Customer-facing state label key */
  customerPhase: string;
};

export const PROJECT_STATE_DEFINITIONS: readonly StateDefinition[] = [
  {
    state: "created",
    requiredBrain: null,
    entryRequires: [],
    exits: ["collecting_context"],
    customerPhase: "Project created",
  },
  {
    state: "collecting_context",
    requiredBrain: null,
    entryRequires: [],
    exits: ["researching"],
    customerPhase: "Collecting context",
  },
  {
    state: "researching",
    requiredBrain: "research",
    entryRequires: [],
    exits: ["strategizing", "failed"],
    customerPhase: "Researching",
  },
  {
    state: "strategizing",
    requiredBrain: "strategy",
    entryRequires: ["research", "reasoning", "marketing_intelligence"],
    exits: ["planning", "waiting_for_approval", "failed"],
    customerPhase: "Strategizing",
  },
  {
    state: "planning",
    requiredBrain: "planning",
    entryRequires: ["strategy"],
    exits: ["generating", "waiting_for_approval", "failed"],
    customerPhase: "Planning",
  },
  {
    state: "generating",
    requiredBrain: "creative",
    entryRequires: ["planning"],
    exits: ["validating", "waiting_for_approval", "failed"],
    customerPhase: "Generating content",
  },
  {
    state: "validating",
    requiredBrain: "validation",
    entryRequires: ["creative"],
    exits: ["waiting_for_approval", "ready_to_publish", "failed"],
    customerPhase: "Validating",
  },
  {
    state: "waiting_for_approval",
    requiredBrain: null,
    entryRequires: [],
    exits: ["ready_to_publish", "generating", "strategizing"],
    customerPhase: "Waiting for approval",
  },
  {
    state: "ready_to_publish",
    requiredBrain: null,
    entryRequires: ["validation"],
    exits: ["publishing"],
    customerPhase: "Ready to publish",
  },
  {
    state: "publishing",
    requiredBrain: "execution",
    entryRequires: [],
    exits: ["monitoring", "failed"],
    customerPhase: "Publishing",
  },
  {
    state: "monitoring",
    requiredBrain: null,
    entryRequires: ["execution"],
    exits: ["learning", "complete"],
    customerPhase: "Monitoring",
  },
  {
    state: "learning",
    requiredBrain: "learning",
    entryRequires: ["execution"],
    exits: ["complete"],
    customerPhase: "Learning",
  },
  {
    state: "complete",
    requiredBrain: null,
    entryRequires: [],
    exits: [],
    customerPhase: "Complete",
  },
  {
    state: "failed",
    requiredBrain: null,
    entryRequires: [],
    exits: ["collecting_context", "researching", "strategizing", "planning", "generating"],
    customerPhase: "Needs attention",
  },
];

export const PROJECT_STATE_TRANSITIONS: readonly StateTransitionDefinition[] = [
  { from: "created", to: "collecting_context", condition: "always" },
  { from: "collecting_context", to: "researching", condition: "context_ready" },
  { from: "researching", to: "strategizing", condition: "brain_completed" },
  { from: "strategizing", to: "planning", condition: "brain_completed" },
  { from: "strategizing", to: "waiting_for_approval", condition: "approval_required" },
  { from: "planning", to: "generating", condition: "brain_completed" },
  { from: "planning", to: "waiting_for_approval", condition: "approval_required" },
  { from: "generating", to: "validating", condition: "brain_completed" },
  { from: "generating", to: "waiting_for_approval", condition: "approval_required" },
  { from: "validating", to: "ready_to_publish", condition: "brain_completed" },
  { from: "validating", to: "waiting_for_approval", condition: "approval_required" },
  { from: "waiting_for_approval", to: "ready_to_publish", condition: "approval_satisfied" },
  { from: "ready_to_publish", to: "publishing", condition: "publish_ready" },
  { from: "publishing", to: "monitoring", condition: "published" },
  { from: "monitoring", to: "learning", condition: "monitoring_complete" },
  { from: "learning", to: "complete", condition: "brain_completed" },
  { from: "monitoring", to: "complete", condition: "always" },
];

export function getStateDefinition(
  state: ProjectLifecycleState
): StateDefinition | undefined {
  return PROJECT_STATE_DEFINITIONS.find((d) => d.state === state);
}

export function canTransitionProjectState(
  from: ProjectLifecycleState,
  to: ProjectLifecycleState
): boolean {
  return PROJECT_STATE_TRANSITIONS.some((t) => t.from === from && t.to === to);
}

export function exitsForState(state: ProjectLifecycleState): readonly ProjectLifecycleState[] {
  return getStateDefinition(state)?.exits ?? [];
}
