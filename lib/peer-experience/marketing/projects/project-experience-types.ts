/** Customer-facing project experience — Emma's voice, never WorkUnit internals. */

export type MarketingProjectPhase =
  | "planning"
  | "researching"
  | "creating"
  | "review"
  | "publishing"
  | "monitoring"
  | "learning"
  | "completed";

export const MARKETING_PROJECT_PHASE_LABELS: Record<MarketingProjectPhase, string> = {
  planning: "Planning",
  researching: "Researching",
  creating: "Creating",
  review: "Review",
  publishing: "Publishing",
  monitoring: "Monitoring",
  learning: "Learning",
  completed: "Completed",
};

export type ProjectActivityKind =
  | "thinking"
  | "working"
  | "waiting"
  | "delivering"
  | "learning"
  | "idle";

export type ProjectTimelineEntryKind =
  | "milestone"
  | "update"
  | "decision"
  | "question"
  | "review"
  | "publish"
  | "performance";

export type ProjectConversationEntry = {
  id: string;
  at: string;
  timeLabel: string;
  message: string;
  kind: "progress" | "update" | "waiting" | "question" | "decision" | "published";
};

export type ProjectTimelineEntry = {
  id: string;
  at: string;
  timeLabel: string;
  message: string;
  kind: ProjectTimelineEntryKind;
  isEmmaUpdate?: boolean;
};

export type ProjectQuestion = {
  id: string;
  prompt: string;
  context?: string;
};

export type ProjectDecision = {
  id: string;
  summary: string;
  reason: string;
  expectedImpact?: string;
  reversible: boolean;
};

export type ProjectPublishingInfo = {
  scheduledAt: string;
  scheduledDateLabel: string;
  scheduledTimeLabel: string;
  channel: string;
  message: string;
};

export type ProjectMonitoringInfo = {
  message: string;
  dataUnavailableReason?: string;
  hasLiveData: boolean;
};

export type ProjectLearningInfo = {
  summary: string;
  whatWorked?: string;
  whatToImprove?: string;
  hasSufficientData: boolean;
};

export type ProjectHeroViewModel = {
  title: string;
  goal: string;
  phase: MarketingProjectPhase;
  phaseLabel: string;
  progress: number;
  currentActivity: string;
  activityKind: ProjectActivityKind;
  isLive: boolean;
  estimatedCompletion?: string;
  priority: "normal" | "needs_you" | "scheduled" | "complete";
  statusLabel: string;
  primaryCta?: {
    label: string;
    href: string;
  };
  heroMessage: string;
};

export type ProjectNextStepViewModel = {
  label: string;
  blocked: boolean;
  blockerReason?: string;
};

export type ProjectSidebarViewModel = {
  goal: string;
  campaignTypeLabel: string;
  statusLabel: string;
  progress: number;
  phaseLabel: string;
  dueLabel?: string;
  reviewStatus: string;
  publishingStatus: string;
  performanceStatus: string;
  originLabel?: string;
  responsibilityTitle?: string;
  responsibilityHref?: string;
  relatedContent: Array<{ id: string; title: string; href: string }>;
};

export type ProjectExperienceViewModel = {
  hero: ProjectHeroViewModel;
  phases: Array<{ id: MarketingProjectPhase; label: string; complete: boolean; current: boolean }>;
  nextStep: ProjectNextStepViewModel;
  conversation: ProjectConversationEntry[];
  timeline: ProjectTimelineEntry[];
  questions: ProjectQuestion[];
  decisions: ProjectDecision[];
  publishing?: ProjectPublishingInfo;
  monitoring?: ProjectMonitoringInfo;
  learning?: ProjectLearningInfo;
  sidebar: ProjectSidebarViewModel;
  emptyStates: {
    content: string;
    timeline: string;
    performance: string;
  };
};
