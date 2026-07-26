import type { Campaign, CampaignStatus, CampaignWorkerRole, CampaignWorkerStatus } from "@/lib/campaign";
import type {
  MarketingContentDraft,
  MarketingPlan,
  MarketingStrategy,
} from "@/lib/marketing-intelligence";
import type { ContentCalendarEntry } from "@/lib/marketing-intelligence/types/plan";
import type { PublicationPackage } from "@/lib/peer-workflow";
import type { WorkUnit } from "@/lib/peer-workflow/work-unit";
import type { MarketingProject } from "@/lib/peer-experience/marketing/projects/types";
import type { MarketingResponsibility } from "@/lib/peer-experience/marketing/responsibilities/types";

/** Customer-safe campaign lifecycle label. */
export type MarketingCampaignStatusLabel =
  | "Draft"
  | "Planning"
  | "Ready"
  | "Active"
  | "Paused"
  | "Completed"
  | "Cancelled"
  | "Blocked"
  | "Archived";

export type MarketingCampaignWorkforceItem = {
  readonly roleLabel: string;
  readonly statusLabel: string;
  readonly responsibility: string;
  readonly completion: number;
  readonly completionKnown: boolean;
};

export type MarketingCampaignCardViewModel = {
  readonly id: string;
  readonly title: string;
  readonly description?: string;
  readonly status: CampaignStatus;
  readonly statusLabel: MarketingCampaignStatusLabel;
  readonly progress: number;
  readonly progressKnown: boolean;
  readonly goal: string;
  readonly audienceSummary: string;
  readonly channels: readonly string[];
  readonly timelineSummary: string;
  readonly approvalCount: number;
  readonly generatedContentCount: number;
  readonly creativeBriefCount: number;
  readonly blockedItemCount: number;
  readonly recommendationSummary?: string;
  readonly assignedWorkforce: readonly MarketingCampaignWorkforceItem[];
  readonly lastUpdated: string;
  /** When false, UI renders a read-only card (no project detail route yet). */
  readonly linkEnabled: boolean;
  readonly href: string;
  readonly nextAction: {
    readonly label: string;
    readonly href: string;
  };
};

export type MarketingCampaignsViewModel = {
  readonly items: readonly MarketingCampaignCardViewModel[];
  readonly emptyMessage: string;
};

export type MarketingCampaignLinkedContentItem = {
  readonly id: string;
  readonly title: string;
  readonly channelLabel: string;
  readonly statusLabel: string;
  readonly href: string;
};

export type MarketingCampaignBriefReference = {
  readonly id: string;
  readonly label: string;
};

export type MarketingCampaignApprovalQueueSummary = {
  readonly pendingCount: number;
  readonly summary: string;
  readonly reviewHref: string;
};

export type MarketingCampaignPerformanceSummary = {
  readonly summary: string;
  readonly kpiLabels: readonly string[];
  readonly performanceKnown: boolean;
  readonly performanceHref: string;
};

export type MarketingCampaignNextAction = {
  readonly label: string;
  readonly reason: string;
  readonly href: string;
};

export type MarketingCampaignActivitySummaryItem = {
  readonly id: string;
  readonly label: string;
  readonly at?: string;
};

export type MarketingCampaignDetailViewModel = {
  readonly id: string;
  readonly title: string;
  readonly description?: string;
  readonly goal: {
    readonly businessObjective: string;
    readonly marketingObjective: string;
    readonly successMetrics: readonly { label: string; target?: string }[];
  };
  readonly status: CampaignStatus;
  readonly statusLabel: MarketingCampaignStatusLabel;
  readonly progress: number;
  readonly progressKnown: boolean;
  readonly audience: {
    readonly targetAudience: string;
    readonly personas: readonly { name: string; description?: string }[];
    readonly segments: readonly string[];
  };
  readonly channels: readonly string[];
  readonly timeline: {
    readonly summary: string;
    readonly startDate?: string;
    readonly endDate?: string;
    readonly milestones: readonly { label: string; dueDate?: string }[];
  };
  readonly budgetSummary?: string;
  readonly approvalModeLabel: string;
  readonly workforce: readonly MarketingCampaignWorkforceItem[];
  readonly deliverableSummary: string;
  readonly approvalQueue: MarketingCampaignApprovalQueueSummary;
  readonly performance: MarketingCampaignPerformanceSummary;
  readonly recommendations: readonly { id: string; summary: string; priority?: string }[];
  readonly nextAction: MarketingCampaignNextAction;
  readonly activitySummary: readonly MarketingCampaignActivitySummaryItem[];
  readonly linkedContent: readonly MarketingCampaignLinkedContentItem[];
  readonly creativeBriefReferences: readonly MarketingCampaignBriefReference[];
  readonly warnings: readonly string[];
  readonly lastUpdated: string;
  readonly href: string;
};

export type MarketingCampaignExplicitPerformance = {
  readonly summary?: string;
  readonly kpiLabels?: readonly string[];
};

/** Inputs for campaign read models — no React, requests, or raw domain payloads on output. */
export type MarketingCampaignViewModelSource = {
  readonly peerId: string;
  readonly organizationId?: string;
  readonly peerName?: string;
  readonly campaigns?: readonly Campaign[];
  readonly strategy?: MarketingStrategy | null;
  readonly plan?: MarketingPlan | null;
  readonly selectedPlanActivities?: readonly ContentCalendarEntry[];
  readonly drafts?: readonly MarketingContentDraft[];
  readonly publicationPackages?: readonly PublicationPackage[];
  readonly workUnits?: readonly WorkUnit[];
  readonly projects?: readonly MarketingProject[];
  readonly responsibilities?: readonly MarketingResponsibility[];
  readonly creativeBriefIdsByCampaignId?: Readonly<Record<string, readonly string[]>>;
  readonly contentIdsByCampaignId?: Readonly<Record<string, readonly string[]>>;
  readonly briefLabelsById?: Readonly<Record<string, string>>;
  readonly warningsByCampaignId?: Readonly<Record<string, readonly string[]>>;
  readonly performanceByCampaignId?: Readonly<
    Record<string, MarketingCampaignExplicitPerformance>
  >;
};

export type MarketingCampaignDetailSource = MarketingCampaignViewModelSource & {
  readonly campaignId: string;
};

export const MARKETING_CAMPAIGN_STATUS_LABELS: Readonly<
  Record<CampaignStatus, MarketingCampaignStatusLabel>
> = {
  draft: "Draft",
  planning: "Planning",
  ready: "Ready",
  active: "Active",
  paused: "Paused",
  completed: "Completed",
  cancelled: "Cancelled",
  blocked: "Blocked",
  archived: "Archived",
};

export const MARKETING_CAMPAIGN_WORKER_STATUS_LABELS: Readonly<
  Record<CampaignWorkerStatus, string>
> = {
  idle: "Available",
  assigned: "Assigned",
  in_progress: "In progress",
  blocked: "Blocked",
  complete: "Complete",
};
