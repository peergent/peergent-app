import type { MarketingContentDraft } from "@/lib/marketing-intelligence";
import type { PrimaryAction } from "../types";
import type { ApprovalDeliverable, ApprovalConnectionState } from "./approval/types";

export type EmmaNarrativeLine = {
  id: string;
  text: string;
};

export type EmmaPipelineStage = {
  id: string;
  label: string;
  subtitle?: string;
  progress: number;
  status: "complete" | "active" | "pending";
  waitLabel?: string;
};

export type EmmaPreviewKind =
  | "instagram"
  | "linkedin"
  | "newsletter"
  | "blog"
  | "landing_page"
  | "meta_ad"
  | "google_ad"
  | "email"
  | "generic";

export type EmmaPreviewViewModel = {
  kind: EmmaPreviewKind;
  title: string;
  body: string;
  channel: string;
  callToAction?: string;
  authorName: string;
  hasContent: boolean;
};

/** Compact daily briefing — full width, horizontal. */
export type EmmaExecutiveBriefViewModel = {
  greeting: string;
  userName: string;
  intro: string;
  highlights: EmmaNarrativeLine[];
};

export type EmmaMissionKpi = {
  id: string;
  value: number;
  label: string;
};

export type EmmaMissionPerformanceMetric = {
  id: string;
  label: string;
  value: string;
  grounded: boolean;
};

export type EmmaMissionControlCtaKind =
  | "open_task"
  | "review_deliverable"
  | "assign_work"
  | "open_performance";

export type EmmaMissionControlCta = {
  kind: EmmaMissionControlCtaKind;
  label: string;
  workUnitId?: string;
  draftId?: string;
};

/** Mission Control card — KPI row, focus, impact, CTA. */
export type EmmaMissionOverviewViewModel = {
  peerName: string;
  roleLabel: string;
  sectionSubtitle: string;
  kpis: EmmaMissionKpi[];
  performanceMetrics: EmmaMissionPerformanceMetric[];
  performanceEmptyMessage: string | null;
  performanceLinkLabel: string;
  performanceLinkHref: string;
  currentFocus: string | null;
  inProgress: boolean;
  estimatedImpact: string | null;
  missionCta: EmmaMissionControlCta | null;
};

export type EmmaWorkTaskActionKind =
  | "open_draft"
  | "open_images"
  | "open_captions"
  | "pause"
  | "cancel"
  | "view_activity";

export type EmmaWorkTaskAction = {
  id: string;
  label: string;
  kind: EmmaWorkTaskActionKind;
  refId?: string;
};

export type EmmaWorkTaskViewModel = {
  id: string;
  title: string;
  lifecycleStage: string;
  lifecycleLabel: string;
  statusLabel: string;
  activeStageLabel: string | null;
  startedLabel: string;
  estimatedCompletionLabel: string | null;
  stages: EmmaPipelineStage[];
  artifacts: { id: string; label: string; refId: string }[];
  actions: EmmaWorkTaskAction[];
  isPaused: boolean;
  isActive: boolean;
  isSelected?: boolean;
  progressPercent: number;
  etaLabel: string | null;
};

export type EmmaResultsMetric = {
  id: string;
  label: string;
  value: string;
};

export type EmmaResultsViewModel = {
  metrics: EmmaResultsMetric[];
  emptyMessage: string | null;
  fullPerformanceHref: string;
  fullPerformanceLabel: string;
};

export type EmmaConnectedChannelViewModel = {
  id: string;
  label: string;
  status: "connected" | "needs_reconnect" | "not_connected";
  settingsHref: string;
  accountName: string | null;
  lastSyncedLabel: string | null;
  publishEnabled: boolean;
  analyticsEnabled: boolean;
};

export type EmmaConnectedChannelsViewModel = {
  channels: EmmaConnectedChannelViewModel[];
};

/** Main operational workspace — live project queue driven by universal lifecycle. */
export type EmmaCurrentWorkViewModel = {
  primaryTask: EmmaWorkTaskViewModel | null;
  queue: EmmaWorkTaskViewModel[];
  selectedWorkUnitId: string | null;
  campaignTitle: string | null;
  activeStageLabel: string | null;
  sectionSubtitle: string;
  isActive: boolean;
  statusLine: string;
  stages: EmmaPipelineStage[];
  etaMinutes: number | null;
};

export type EmmaDeskAction =
  | "approve"
  | "approve_publish"
  | "publish"
  | "schedule"
  | "view_live"
  | "feedback";

/** Hero approval — channel-aware live preview and editing. */
export type EmmaNeedsApprovalViewModel = {
  hasItem: boolean;
  emptyMessage: string;
  emptySupportingMessage: string;
  subtitle: string;
  draftId: string | null;
  title: string | null;
  channel: string | null;
  deliverable: ApprovalDeliverable | null;
  connection: ApprovalConnectionState | null;
  preview: EmmaPreviewViewModel;
  rationaleHeading: string;
  rationale: string[];
  rationalePreview: string;
  hasMoreRationale: boolean;
  primaryAction: EmmaDeskAction | null;
  primaryLabel: string | null;
  secondaryLabel: string | null;
  status: MarketingContentDraft["status"] | null;
  selectedTaskTitle: string | null;
};

export type EmmaFinishedItem = {
  id: string;
  draftId: string;
  title: string;
  platform: string;
  timeLabel: string;
  status: string;
  performanceLabel: string | null;
};

export type EmmaRecentlyFinishedViewModel = {
  hasItems: boolean;
  emptyMessage: string;
  viewAllLabel: string;
  items: EmmaFinishedItem[];
};

export type EmmaInsightItem = {
  id: string;
  voice: string;
  detail: string | null;
  savingsLabel: string | null;
  actionLabel: string;
  source?: string;
  impact?: string | null;
  estimatedValue?: string | null;
};

export type EmmaInsightsViewModel = {
  hasInsights: boolean;
  emptyMessage: string;
  viewAllLabel: string;
  insights: EmmaInsightItem[];
};

export type EmmaDelegationViewModel = {
  promptLabel: string;
  placeholder: string;
  emptyPrompt: string;
};

/** Universal employee workspace — same shape for every Peergent role. */
export type EmmaWorkspaceViewModel = {
  executiveBrief: EmmaExecutiveBriefViewModel;
  missionOverview: EmmaMissionOverviewViewModel;
  currentWork: EmmaCurrentWorkViewModel;
  needsApproval: EmmaNeedsApprovalViewModel;
  recentlyFinished: EmmaRecentlyFinishedViewModel;
  results: EmmaResultsViewModel;
  insights: EmmaInsightsViewModel;
  delegation: EmmaDelegationViewModel;
  connectedChannels: EmmaConnectedChannelsViewModel;
  primaryAction: PrimaryAction | null;
};
