import type { KnowledgeSectionId } from "@/lib/knowledge";
import type { RecommendedAction } from "@/lib/marketing-workspace";
import type { WorkspaceRegion } from "@/lib/marketing-workspace/experience/navigation";
import type { GeneratingActivity } from "@/lib/marketing-workspace/workflow-focus";
import type { TimelineNodeProgress } from "@/lib/marketing-workspace/timeline-nodes";

/** Customer-facing primary action for the Now panel — separate from recommendations. */
export type PrimaryAction = {
  kind: RecommendedAction["kind"];
  label: string;
  planActivityReference?: string;
  draftId?: string;
  knowledgeSection?: KnowledgeSectionId;
};

export type NowPresence = "live" | "working" | "waiting";

export type NowViewModel = {
  headline: string;
  detail?: string;
  presence: NowPresence;
  /** Human presence line for the Studio strip — not task metadata. */
  presenceLine: string;
  workingLabel?: string;
  primaryAction: PrimaryAction | null;
};

export type TimelineNodeViewModel = {
  id: string;
  label: string;
  progress: TimelineNodeProgress;
  region: WorkspaceRegion;
  draftId?: string;
  activityTitle?: string;
};

export type TimelineViewModel = {
  nodes: TimelineNodeViewModel[];
  currentNodeId: string | null;
  selectedNodeId: string | null;
};

export type DeliverableDocumentType = "understanding" | "strategy" | "plan";

export type DeliverableMetadataItem = {
  label: string;
  value: string;
};

export type DeliverableEmptyViewModel = {
  kind: "empty";
  title: string;
  message: string;
  detail?: string;
  working?: boolean;
};

export type DeliverableDocumentViewModel = {
  kind: "document";
  documentType: DeliverableDocumentType;
  title: string;
  summary: string;
  metadata: DeliverableMetadataItem[];
  inspectRegion: WorkspaceRegion;
};

export type DeliverableContentViewModel = {
  kind: "content";
  draftId: string;
  title: string;
  channel: string;
  body: string;
  reviewStatusLabel: string;
  reviewable: boolean;
  targetAudience?: string;
  callToAction?: string;
  rationale?: string;
};

export type DeliverablePublishPreviewViewModel = {
  kind: "publish-preview";
  draftId: string;
  title: string;
  channel: string;
  previewTitle: string;
  previewBody: string;
  copyText: string;
};

export type DeliverableCompleteViewModel = {
  kind: "complete";
  draftId: string;
  title: string;
  channel: string;
  message: string;
  completedAt?: string;
};

export type DeliverableViewModel =
  | DeliverableEmptyViewModel
  | DeliverableDocumentViewModel
  | DeliverableContentViewModel
  | DeliverablePublishPreviewViewModel
  | DeliverableCompleteViewModel;

export type DetailSlideOverKind =
  | "business-context"
  | "strategy"
  | "plan"
  | "explainability";

export type DetailSecondaryAction = {
  label: string;
  slideOverKind: DetailSlideOverKind;
};

export type DeliverableReviewContextAction = {
  label: string;
  kind: DetailSlideOverKind;
};

export type DetailsRowViewModel = {
  id: string;
  title: string;
  subtitle: string;
  status: string;
  summary: string;
  region: WorkspaceRegion | null;
  secondaryAction?: DetailSecondaryAction;
};

export type DetailsViewModel = {
  rows: DetailsRowViewModel[];
};

export type PeerViewModel = {
  now: NowViewModel;
  timeline: TimelineViewModel;
  deliverable: DeliverableViewModel;
  details: DetailsViewModel;
};

export type { GeneratingActivity, WorkspaceRegion };
