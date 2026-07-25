export type {
  ActivityLifecycleState,
  DeriveActivityLifecycleInput,
  PeerWorkflowPeerRole,
  WorkflowActivityRef,
  WorkflowArtifactRef,
  WorkflowPublicationRef,
} from "./types";
export { ACTIVITY_LIFECYCLE_LABELS } from "./types";

export {
  deriveActivityLifecycle,
  findNextScheduledActivity,
  sortActivitiesBySchedule,
} from "./lifecycle";

export type {
  PreparePublicationInput,
  PublicationChannelAdapter,
  PublicationChannelId,
  PublicationPackage,
  PublicationPackageStatus,
  ResolvePublicationChannelInput,
} from "./publisher/types";

export {
  DEFAULT_PUBLICATION_ADAPTERS,
  googleAdsChannelAdapter,
  linkedInChannelAdapter,
  metaAdsChannelAdapter,
  newsletterChannelAdapter,
  websiteCmsChannelAdapter,
} from "./publisher/channels";

export {
  PublicationOrchestrator,
  defaultPublicationOrchestrator,
} from "./publisher/orchestrator";

export type { WorkLifecycleStage, WorkLifecycleEvent } from "./work-lifecycle";
export {
  WORK_LIFECYCLE_STAGES,
  WORK_LIFECYCLE_LABELS,
  canAdvanceLifecycle,
  advanceLifecycleTo,
  isActiveLifecycleStage,
} from "./work-lifecycle";

export type {
  WorkUnit,
  WorkAutomation,
  WorkUnitArtifact,
  WorkUnitEvent,
  WorkDeliverableKind,
  CreateWorkUnitInput,
} from "./work-unit";

export {
  createWorkUnit,
  transitionWorkUnit,
  attachDraftToWorkUnit,
  syncWorkUnitFromMarketingState,
  createAutomationFromWorkUnit,
  pauseWorkUnit,
  resumeWorkUnit,
  cancelWorkUnit,
  recordWorkUnitNote,
  activeWorkUnits,
  sortWorkUnitsByRecency,
  deliverableKindFromChannel,
  mapRecurrenceToEngine,
  mapDraftStatusToLifecycleStage,
  mapGeneratingToLifecycleStage,
} from "./work-unit-engine";
