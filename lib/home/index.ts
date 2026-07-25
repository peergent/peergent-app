export type {
  BuildHomeViewModelInput,
  HomeContextHealth,
  HomeMorningNarrative,
  HomeMovementItem,
  HomeNeedsYouItem,
  HomePeerWorkspaceSnapshot,
  HomeSuggestedStart,
  HomeTeamPulseItem,
  HomeViewModel,
  HomeWorkstreamItem,
} from "./types";

export { buildHomeViewModel } from "./build-home-view-model";
export {
  activitySourcesFromMarketingSnapshots,
  buildWorkforceSummary,
  emptyWorkforceSummary,
  WORKFORCE_ACCOMPLISHMENT_ACTIVITY_TYPES,
} from "./build-workforce-summary";
export {
  DEFAULT_WORKFORCE_SUMMARY_CONFIG,
  resolveWorkforceSummaryConfig,
} from "./workforce-summary-types";
export type {
  BuildWorkforceSummaryInput,
  WorkforceActivitySource,
  WorkforceSummary,
  WorkforceSummaryConfig,
} from "./workforce-summary-types";
export { adaptHandoffState } from "./adapt-handoff-state";
export {
  enrichHandoffVisual,
  HANDOFF_REFERENCE_DEMO,
  buildHeadline,
  buildPersonalGreeting,
} from "./handoff-visual";
export { handoffPreviewState, HANDOFF_PREVIEW_SCENES } from "./handoff-demo";
export type {
  AdaptHandoffInput,
  HandoffCompanyActivity,
  HandoffPrimaryWork,
  HandoffScene,
  HandoffSecondaryItem,
  HandoffState,
  HandoffUrgency,
} from "./handoff-types";
export {
  companyNameFromPeers,
  getTimeGreeting,
  HOME_LAST_VISIT_KEY,
  loadMarketingPeerSnapshots,
  marketingWorkspaceHref,
  peerWorkspaceHref,
  readLastHomeVisit,
  snapshotHasPersistedWork,
  writeLastHomeVisit,
} from "./load-home-data";
