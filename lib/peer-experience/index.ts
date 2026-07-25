export type {
  DetailSecondaryAction,
  DetailSlideOverKind,
  DeliverableReviewContextAction,
  DetailsRowViewModel,
  DetailsViewModel,
  DeliverableCompleteViewModel,
  DeliverableContentViewModel,
  DeliverableDocumentType,
  DeliverableDocumentViewModel,
  DeliverableEmptyViewModel,
  DeliverablePublishPreviewViewModel,
  DeliverableViewModel,
  GeneratingActivity,
  NowPresence,
  NowViewModel,
  PeerViewModel,
  PrimaryAction,
  TimelineNodeViewModel,
  TimelineViewModel,
  WorkspaceRegion,
} from "./types";

export { buildMarketingViewModel } from "./marketing/build-marketing-view-model";
export type { BuildMarketingViewModelInput } from "./marketing/build-marketing-view-model";
export { buildMarketingTimelineViewModel } from "./marketing/build-marketing-timeline-view-model";
export {
  buildMarketingDeliverableViewModel,
  resolveSelectedTimelineNodeId,
} from "./marketing/build-marketing-deliverable-view-model";
export {
  buildMarketingDetailsViewModel,
  resolveExplainabilityPresentation,
  slideOverKindForDocumentType,
  slideOverKindForRegion,
  slideOverTitleForKind,
} from "./marketing/build-marketing-details-view-model";
export { presentExplainability } from "./marketing/details-explainability";
export { handleFocusTrapKeyDown, getFocusableElements } from "./focus-trap";
export {
  formatBlogPreview,
  formatDraftAsPublishPreview,
  formatGenericPreview,
  formatLinkedInPreview,
  formatNewsletterPreview,
  formatPublicationPackagePreview,
  humanChannelLabel,
} from "./marketing/publish-preview-formatters";
export {
  contentActivityLabel,
  milestoneLabel,
  resolveTimelineNodeLabel,
} from "./marketing/timeline-config";

export {
  resolveMarketingPrimaryActionIntent,
  type PrimaryActionIntent,
} from "./marketing/resolve-primary-action";

export {
  buildProgressRailViewModel,
  progressRailChapterToTimelineNodeId,
  type BuildProgressRailInput,
  type ProgressRailChapter,
  type ProgressRailChapterId,
  type ProgressRailChapterState,
  type ProgressRailViewModel,
} from "./marketing/build-progress-rail-view-model";

export { resolveCampaignTitle } from "./marketing/resolve-campaign-title";
export { resolvePresenceStatusLine } from "./marketing/resolve-presence-status-line";

export {
  detailPanelTitle,
  isDeliverableInReview,
  resolveDetailPanelTarget,
  shouldOpenDetailInInspector,
} from "./marketing/review-panel-routing";

export {
  ARTIFACT_PANEL_COPY,
  DRAFT_REVIEW_ACTION_LABELS,
  attachPrimaryActionLabel,
  buildMayaNowCopy,
  buildMayaPresenceLine,
  resolvePrimaryActionLabel,
} from "./marketing/maya-copy";

export {
  formatCampaignWeekPhrase,
  formatWriteNextActionLabel,
} from "./marketing/format-contextual-action-label";

export {
  resolveWorkPlaneState,
  type WorkPlaneState,
} from "./marketing/resolve-work-plane-state";

export type {
  MarketingWorkflowFocus,
  ResolveMarketingWorkflowFocusInput,
} from "@/lib/marketing-workspace/workflow-focus";

export { resolveMarketingWorkflowFocus } from "@/lib/marketing-workspace/workflow-focus";
