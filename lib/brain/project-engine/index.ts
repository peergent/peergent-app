/**
 * Project Engine — brain orchestrator for every Peergent project.
 *
 * Coordinates Brains. Never generates content.
 * @see docs/architecture/PROJECT_ENGINE.md
 */

export type {
  ProjectLifecycleState,
  ProjectBrainId,
  ProjectWaitingReason,
  ProjectEngineActionKind,
  ProjectEngineAction,
  ProjectEngineEvaluation,
  ProjectEngineSnapshot,
  ApprovalCheckpoint,
  ApprovalCheckpointKind,
  BrainExecutionRecord,
  BrainExecutionStatus,
  ProjectEngineEvent,
  ProjectEngineEventType,
  ProjectEngineInput,
  BrainResultSummary,
} from "./types";

export { PROJECT_ENGINE_VERSION, DEFAULT_BRAIN_PIPELINE } from "./types";

export type {
  BrainContextPackage,
  BrainContextSlices,
  BrainPriorOutput,
  BrainInput,
  BrainOutput,
  BrainEvent,
  BrainStatus,
  BrainResult,
  BrainConfidence as ProjectBrainConfidence,
  ProjectBrainContract,
  ProjectBrainRegistry,
} from "./brain-contract";

export {
  PROJECT_STATE_DEFINITIONS,
  PROJECT_STATE_TRANSITIONS,
  getStateDefinition,
  canTransitionProjectState,
  exitsForState,
} from "./project-state";

export type { StateDefinition, StateTransitionDefinition } from "./project-state";

export {
  assembleBrainContext,
  isContextReadyForResearch,
  contextSatisfiedForBrain,
  BRAIN_CONTEXT_REQUIREMENTS,
} from "./context-model";

export type { ProjectContextInput } from "./context-model";

export {
  createProjectEngineEvent,
  appendProjectEvent,
} from "./event-model";

export type { ProjectEventInput } from "./event-model";

export {
  APPROVAL_GATE_DEFINITIONS,
  resolveApprovalGate,
  createApprovalCheckpoint,
  satisfyApprovalCheckpoint,
} from "./approval-model";

export type { ApprovalGateDefinition } from "./approval-model";

export {
  createPersistenceRecord,
  trimEngineSnapshot,
  MAX_EVENT_LOG_ENTRIES,
  MAX_BRAIN_HISTORY_ENTRIES,
  DEFAULT_MAX_RETRIES,
} from "./persistence-model";

export type {
  PersistedProjectEngineRecord,
  ProjectEngineRepository,
  ProjectEnginePersistenceAdapter,
  ProjectEngineSetupFields,
} from "./persistence-model";

export {
  STATE_TO_BRAIN,
  BRAIN_TO_CAPABILITIES,
  PROJECT_STATE_TO_RUN_STAGE,
  RUN_STAGE_TO_PROJECT_STATE,
  brainForState,
  capabilitiesForBrain,
  projectStateFromRunStage,
  runStageFromProjectState,
} from "./stage-router";

export {
  createProjectEngineSnapshot,
  withProjectState,
} from "./create-snapshot";

export type { CreateProjectSnapshotInput } from "./create-snapshot";

export {
  evaluateProjectEpisode,
  nextStateAfterBrainComplete,
  markBrainActive,
  markBrainCompleted,
  researchPhaseComplete,
  RESEARCH_PHASE_BRAINS,
} from "./evaluate-project";

export type { EvaluateProjectOptions } from "./evaluate-project";

export { advanceProjectEpisode } from "./advance-project";

export {
  projectSnapshotFromCampaignRun,
  isEngineBlocked,
} from "./map-from-campaign-run";

/** Facade — evaluate project episode without advancing. */
export { evaluateProjectEpisode as projectEngineEvaluate } from "./evaluate-project";
