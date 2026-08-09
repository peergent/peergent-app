/**
 * Project Engine — core types.
 *
 * The Project Engine coordinates Brains. It never generates content.
 * Architecture authority: docs/architecture/PROJECT_ENGINE.md
 */

/** Canonical project lifecycle states. */
export type ProjectLifecycleState =
  | "created"
  | "collecting_context"
  | "researching"
  | "strategizing"
  | "planning"
  | "generating"
  | "validating"
  | "waiting_for_approval"
  | "ready_to_publish"
  | "publishing"
  | "monitoring"
  | "learning"
  | "complete"
  | "failed";

/** Specialist brains the engine may schedule — implementation-agnostic. */
export type ProjectBrainId =
  | "research"
  | "reasoning"
  | "marketing_intelligence"
  | "strategy"
  | "planning"
  | "creative"
  | "validation"
  | "memory"
  | "execution"
  | "learning";

/** Why the engine is paused. */
export type ProjectWaitingReason =
  | "missing_context"
  | "approval_required"
  | "user_input_required"
  | "dependency_blocked"
  | "retry_backoff"
  | "publication_pending";

/** What the engine should do next — never content generation. */
export type ProjectEngineActionKind =
  | "idle"
  | "collect_context"
  | "run_brain"
  | "wait"
  | "schedule_approval"
  | "publish"
  | "monitor"
  | "learn"
  | "complete"
  | "retry"
  | "recover";

export type ProjectEngineAction = {
  kind: ProjectEngineActionKind;
  brainId: ProjectBrainId | null;
  reason: string;
  /** Customer-safe explanation for activity/progress projections */
  customerLabel: string;
};

export type ProjectEngineEvaluation = {
  snapshot: ProjectEngineSnapshot;
  action: ProjectEngineAction;
  /** Brains the engine may schedule after current action completes */
  pendingBrains: readonly ProjectBrainId[];
  blocked: boolean;
};

/** Full persisted engine state for one project episode. */
export type ProjectEngineSnapshot = {
  projectId: string;
  peerId: string;
  organizationId: string;
  episodeId: string;
  state: ProjectLifecycleState;
  previousState: ProjectLifecycleState | null;
  activeBrain: ProjectBrainId | null;
  completedBrains: readonly ProjectBrainId[];
  pendingBrains: readonly ProjectBrainId[];
  waitingReason: ProjectWaitingReason | null;
  approvalCheckpoint: ApprovalCheckpoint | null;
  brainHistory: readonly BrainExecutionRecord[];
  decisionIds: readonly string[];
  eventLog: readonly ProjectEngineEvent[];
  retryCount: Partial<Record<ProjectBrainId, number>>;
  contextVersion: number;
  startedAt: string;
  updatedAt: string;
  completedAt: string | null;
  engineVersion: string;
};

export type ApprovalCheckpoint = {
  id: string;
  kind: ApprovalCheckpointKind;
  requiredAt: ProjectLifecycleState;
  satisfied: boolean;
  satisfiedAt: string | null;
  unblocksState: ProjectLifecycleState;
  customerSummary: string;
};

export type ApprovalCheckpointKind =
  | "strategy_review"
  | "channel_review"
  | "deliverable_review"
  | "campaign_approval"
  | "publication_confirm";

export type BrainExecutionRecord = {
  id: string;
  brainId: ProjectBrainId;
  capabilityIds: readonly string[];
  status: BrainExecutionStatus;
  startedAt: string;
  completedAt: string | null;
  outputRef: string | null;
  confidence: number | null;
  durationMs: number | null;
  retryAttempt: number;
  errorCode: string | null;
};

export type BrainExecutionStatus =
  | "queued"
  | "running"
  | "completed"
  | "failed"
  | "skipped"
  | "waiting_approval";

export type ProjectEngineEvent = {
  id: string;
  at: string;
  type: ProjectEngineEventType;
  brainId: ProjectBrainId | null;
  state: ProjectLifecycleState;
  title: string;
  subtitle: string;
  whyItMatters: string;
  /** Maps to Brain Output Layer LiveActivityEvent tone */
  tone: "success" | "insight" | "attention" | "neutral";
};

export type ProjectEngineEventType =
  | "project_created"
  | "context_collection_started"
  | "context_ready"
  | "brain_started"
  | "brain_completed"
  | "brain_failed"
  | "approval_required"
  | "approval_granted"
  | "waiting"
  | "state_changed"
  | "publish_started"
  | "publish_completed"
  | "monitoring_started"
  | "learning_updated"
  | "project_completed"
  | "retry_scheduled"
  | "recovery_started";

/** Input to evaluate or advance a project episode. */
export type ProjectEngineInput = {
  snapshot: ProjectEngineSnapshot;
  now?: Date;
  /** Context readiness — engine stops if false during collecting_context */
  contextReady?: boolean;
  /** Whether required approval at current checkpoint is satisfied */
  approvalSatisfied?: boolean;
  /** Brain execution result when advancing after a run */
  lastBrainResult?: BrainResultSummary | null;
  /** Publication completed */
  published?: boolean;
  /** Monitoring period ended → learning */
  monitoringComplete?: boolean;
};

export type BrainResultSummary = {
  brainId: ProjectBrainId;
  status: BrainExecutionStatus;
  outputRef: string | null;
  confidence: number | null;
  durationMs: number | null;
  errorCode: string | null;
  decisionIds?: readonly string[];
};

export const PROJECT_ENGINE_VERSION = "1.0.0";

/** Default brain pipeline order for marketing projects. */
export const DEFAULT_BRAIN_PIPELINE: readonly ProjectBrainId[] = [
  "research",
  "reasoning",
  "marketing_intelligence",
  "strategy",
  "planning",
  "creative",
  "validation",
  "execution",
  "memory",
  "learning",
] as const;
