export type {
  MarketingWorkspacePersistedState,
  MarketingWorkspacePhase,
  MarketingWorkspaceSnapshot,
  RecommendedAction,
} from "./types";

export { createReloadGuard } from "./reload-guard";

export {
  loadMarketingWorkspaceState,
  saveMarketingWorkspaceState,
  patchMarketingWorkspaceState,
  upsertDraft,
  persistWorkspaceActivityFeed,
  applyUnderstandingToWorkspace,
} from "./storage";

export {
  fetchMarketingUnderstanding,
  fetchMarketingProfile,
  generateMarketingStrategy,
  generateMarketingPlan,
  generateContentDraft,
} from "./api";

export {
  buildRecommendedActions,
  collectWorkspaceWarnings,
  deriveWorkspacePhase,
} from "./recommendations";

export {
  ACTIVITY_LIFECYCLE_LABELS,
  buildMarketingActivityLifecycleMap,
  findNextMarketingPlanActivity,
  getActivityLifecycleForTitle,
  isPlanExecutionComplete,
} from "./activity-lifecycle";

export {
  resolveMarketingWorkflowFocus,
  type GeneratingActivity,
  type MarketingWorkflowFocus,
  type ResolveMarketingWorkflowFocusInput,
} from "./workflow-focus";

export {
  buildMarketingTimelineNodes,
  contentTimelineNodeId,
  findDraftIdForTimelineNode,
  milestoneTimelineNodeId,
  resolveCurrentTimelineNodeId,
  resolveEffectiveTimelineSelection,
  type MarketingTimelineNodeData,
  type MarketingTimelineSnapshot,
  type TimelineNodeProgress,
} from "./timeline-nodes";

export {
  findPublicationPackageForDraft,
  markPublicationPackagePublished,
  prepareDraftForPublication,
} from "./publication-service";

export * from "./experience";
