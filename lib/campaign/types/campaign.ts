/**
 * Canonical Campaign — primary unit of the Marketing Department platform.
 * Read-only domain types only; persistence, assembly, and UI are separate actions.
 */

import type { CampaignOwnedModule } from "../ownership";

export type CampaignStatus =
  | "draft"
  | "planning"
  | "ready"
  | "active"
  | "paused"
  | "completed"
  | "cancelled"
  | "blocked"
  | "archived";

export type CampaignApprovalMode =
  | "approval_before_publication"
  | "approval_before_generation"
  | "no_approval_required"
  | "blocked_manual_only";

export type CampaignSuccessMetric = {
  readonly id: string;
  readonly label: string;
  readonly target?: string;
  readonly unit?: string;
};

export type CampaignGoal = {
  readonly businessObjective: string;
  readonly marketingObjective: string;
  readonly successMetrics: readonly CampaignSuccessMetric[];
};

export type CampaignPersona = {
  readonly id: string;
  readonly name: string;
  readonly description?: string;
};

export type CampaignSegmentRef = {
  readonly id: string;
  readonly label: string;
};

export type CampaignAudience = {
  readonly targetAudience: string;
  readonly personas: readonly CampaignPersona[];
  readonly segments: readonly CampaignSegmentRef[];
};

export type CampaignChannelPlan = {
  readonly channelId: string;
  readonly label?: string;
  readonly notes?: string;
};

export type CampaignMilestone = {
  readonly id: string;
  readonly label: string;
  readonly dueDate?: string;
};

export type CampaignTimeline = {
  readonly startDate?: string;
  readonly endDate?: string;
  readonly milestones: readonly CampaignMilestone[];
};

export type CampaignBudget = {
  readonly currency?: string;
  readonly allocated?: number;
  readonly spent?: number;
  readonly notes?: string;
};

export type CampaignExecution = {
  readonly channels: readonly CampaignChannelPlan[];
  readonly timeline: CampaignTimeline;
  readonly status: CampaignStatus;
  readonly budget: CampaignBudget;
  readonly approvalMode: CampaignApprovalMode;
};

export type CampaignReferences = {
  readonly marketingDecisionIds: readonly string[];
  readonly creativeBriefIds: readonly string[];
  readonly generatedContentIds: readonly string[];
  readonly assetIds: readonly string[];
};

export type CampaignKpiPlaceholder = {
  readonly id: string;
  readonly name: string;
  readonly description?: string;
  readonly targetValue?: string;
};

export type CampaignProgress = {
  readonly percentComplete: number;
  readonly summary?: string;
  readonly updatedAt?: string;
};

export type CampaignRecommendation = {
  readonly id: string;
  readonly summary: string;
  readonly priority?: "low" | "medium" | "high";
};

export type CampaignPerformance = {
  readonly kpiPlaceholders: readonly CampaignKpiPlaceholder[];
  readonly progress: CampaignProgress;
  readonly recommendations: readonly CampaignRecommendation[];
};

export type CampaignWorkerRole =
  | "campaign_planner"
  | "copywriter"
  | "designer"
  | "ads_specialist"
  | "email_specialist"
  | "analyst";

/** Fixed roster for Marketing Department AI workforce on a campaign. */
export const CAMPAIGN_WORKFORCE_ROLES: readonly CampaignWorkerRole[] = [
  "campaign_planner",
  "copywriter",
  "designer",
  "ads_specialist",
  "email_specialist",
  "analyst",
] as const;

export const CAMPAIGN_WORKFORCE_ROLE_LABELS: Readonly<
  Record<CampaignWorkerRole, string>
> = {
  campaign_planner: "Campaign Planner",
  copywriter: "Copywriter",
  designer: "Designer",
  ads_specialist: "Ads Specialist",
  email_specialist: "Email Specialist",
  analyst: "Analyst",
};

export type CampaignWorkerStatus =
  | "idle"
  | "assigned"
  | "in_progress"
  | "blocked"
  | "complete";

export type CampaignWorker = {
  readonly role: CampaignWorkerRole;
  readonly displayName: string;
  readonly status: CampaignWorkerStatus;
  readonly responsibility: string;
  /** Completion ratio 0–100 for this worker's campaign scope. */
  readonly completion: number;
  readonly peerId?: string;
};

export type CampaignWorkforce = {
  readonly workers: readonly CampaignWorker[];
};

export type CampaignOwnedSections = {
  readonly goal: CampaignGoal;
  readonly audience: CampaignAudience;
  readonly execution: CampaignExecution;
  readonly references: CampaignReferences;
  readonly performance: CampaignPerformance;
  readonly workforce: CampaignWorkforce;
};

export type Campaign = {
  readonly id: string;
  readonly organizationId: string;
  readonly name: string;
  readonly description?: string;
  readonly version: number;
  readonly createdAt: string;
  readonly updatedAt: string;
} & CampaignOwnedSections;

export type CampaignSectionKey = keyof CampaignOwnedSections;

export type CampaignGap = CampaignOwnedModule;
