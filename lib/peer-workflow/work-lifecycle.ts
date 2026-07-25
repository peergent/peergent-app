/**
 * Universal employee work lifecycle — same stages for every Peergent role.
 * Never skip states. Never invent role-specific alternatives.
 */
export const WORK_LIFECYCLE_STAGES = [
  "requested",
  "understanding",
  "planning",
  "creating",
  "review_ready",
  "approved",
  "scheduled",
  "published",
  "monitoring",
  "optimizing",
] as const;

export type WorkLifecycleStage = (typeof WORK_LIFECYCLE_STAGES)[number];

export const WORK_LIFECYCLE_LABELS: Record<WorkLifecycleStage, string> = {
  requested: "Requested",
  understanding: "Understanding",
  planning: "Planning",
  creating: "Creating",
  review_ready: "Review ready",
  approved: "Approved",
  scheduled: "Scheduled",
  published: "Published",
  monitoring: "Monitoring",
  optimizing: "Optimizing",
};

export function lifecycleStageIndex(stage: WorkLifecycleStage): number {
  return WORK_LIFECYCLE_STAGES.indexOf(stage);
}

/** Forward-only transition by exactly one stage, or no-op if same stage. */
export function canAdvanceLifecycle(
  from: WorkLifecycleStage,
  to: WorkLifecycleStage
): boolean {
  if (from === to) return true;
  return lifecycleStageIndex(to) === lifecycleStageIndex(from) + 1;
}

/** Advance through intermediate stages when catching up (e.g. sync from draft status). */
export function advanceLifecycleTo(
  from: WorkLifecycleStage,
  target: WorkLifecycleStage
): WorkLifecycleStage[] {
  const fromIdx = lifecycleStageIndex(from);
  const targetIdx = lifecycleStageIndex(target);
  if (targetIdx <= fromIdx) return [];
  return WORK_LIFECYCLE_STAGES.slice(fromIdx + 1, targetIdx + 1);
}

export function isTerminalLifecycleStage(stage: WorkLifecycleStage): boolean {
  return stage === "optimizing";
}

export function isActiveLifecycleStage(stage: WorkLifecycleStage): boolean {
  return stage !== "published" && stage !== "monitoring" && stage !== "optimizing";
}

export type WorkLifecycleEvent =
  | "task_requested"
  | "understanding_started"
  | "planning_started"
  | "creation_started"
  | "review_ready"
  | "approved"
  | "scheduled"
  | "published"
  | "monitoring_started"
  | "optimization_started"
  | "paused"
  | "resumed"
  | "cancelled";

export const EVENT_TO_STAGE: Partial<Record<WorkLifecycleEvent, WorkLifecycleStage>> = {
  task_requested: "requested",
  understanding_started: "understanding",
  planning_started: "planning",
  creation_started: "creating",
  review_ready: "review_ready",
  approved: "approved",
  scheduled: "scheduled",
  published: "published",
  monitoring_started: "monitoring",
  optimization_started: "optimizing",
};
