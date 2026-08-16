/**
 * Project Runtime — PX-47 public exports.
 */

export type {
  EpisodeStatus,
  ContextGap,
  ContextGapKind,
  ProjectBrainArtifacts,
  ProjectApprovalRecord,
  ProjectEpisodeRecord,
  ProjectRuntimeEvent,
  EpisodeRunInput,
  EpisodeRunResult,
  EpisodeObservability,
  ResumeEpisodeInput,
  SubmitApprovalInput,
  StoredPerformanceObservation,
} from "./types";

export {
  ProjectEpisodeRunner,
  createProjectEpisodeRunner,
} from "./project-episode-runner";

export {
  getDefaultProjectEpisodeRepository,
  resetDefaultProjectEpisodeRepository,
} from "./project-episode-repository";

export { submitProjectApproval, submitProjectApprovalDurable } from "./approval-service";
export {
  ingestPerformanceObservations,
  validatePerformanceObservation,
  getPerformanceObservations,
} from "./performance-observation-service";

export { resolveBrainOutputs } from "./brain-output-resolver";
export { buildBrainPayload, buildPriorOutputs, contextGapsFromEvaluation } from "./brain-context-handoff";
export { proposalsFromLearningGraph, learningProposalIds } from "./learning-memory-handoff";
export { recordBrainOutputRef, createEmptyArtifacts, brainOutputRefMap } from "./project-artifact-store";
export { appendRuntimeEvent, listProjectEvents, brainCompletedEventType } from "./project-event-stream";

export {
  buildMarketingPeerFixture,
  buildFixturePerformanceObservations,
  FIXTURE_ORG_ID,
  FIXTURE_PEER_INPUT,
  PROOF_LED_LEARNING_SNIPPET,
} from "./fixtures/marketing-peer-fixture";

export { acquireEpisodeContext, type EpisodeAcquiredContext, type AcquireEpisodeContextInput } from "./acquire-episode-context";

export {
  startOrResumeCampaignEpisode,
  startOrResumeDemoCampaignEpisode,
  episodeAuthorityNote,
  type StartOrResumeCampaignEpisodeInput,
  type CampaignEpisodeResult,
} from "./campaign-episode-controller";

export {
  continueCampaignEpisode,
  shouldAutoContinueCampaignEpisode,
  evaluateCampaignEpisodeContinuation,
  resetCampaignEpisodeContinuationInFlightForTests,
  type ContinueCampaignEpisodeInput,
  type EpisodeContinuationTrigger,
} from "./campaign-episode-continuation";
export { emitOrchestrationDiagnostic } from "./orchestration-diagnostics";
export {
  resolveEpisodeStepBudget,
  snapshotProgressSignature,
  MAX_STALE_LOOP_ITERATIONS,
} from "./episode-step-budget";
export type { EpisodeLoopExit, EpisodeLoopExitKind } from "./episode-step-budget";
export type { EpisodeRunTarget, ProjectBrainExecutionAdapter } from "./types";
