import type { Campaign } from "@/lib/campaign/types/campaign";

/** Summary refs — no full MarketingStrategy payload. */
export type CampaignPlannerStrategySummary = {
  readonly summary: string;
  readonly confidence: "low" | "moderate" | "high";
  readonly channelLabels?: readonly string[];
  readonly audienceLabels?: readonly string[];
};

export type CampaignPlannerPlanActivitySummary = {
  readonly title: string;
  readonly contentType: string;
  readonly channel?: string;
  readonly scheduledWeek?: number;
  readonly estimatedEffort?: "low" | "medium" | "high";
};

export type CampaignPlannerPlanDependencySummary = {
  readonly dependent: string;
  readonly dependsOn: string;
};

/** Summary refs — no full MarketingPlan payload. */
export type CampaignPlannerPlanSummary = {
  readonly summary: string;
  readonly confidence: "low" | "moderate" | "high";
  readonly contentCalendar?: readonly CampaignPlannerPlanActivitySummary[];
  readonly dependencies?: readonly CampaignPlannerPlanDependencySummary[];
};

/** Policy snapshot — no full MarketingDecisionRecord payload. */
export type CampaignPlannerDecisionSummary = {
  readonly id: string;
  readonly status: "ready" | "restricted" | "blocked";
  readonly canExecute: boolean;
  readonly canGenerateCreative: boolean;
  readonly blockedReasons?: readonly string[];
  readonly approvalMode?:
    | "no_approval_required"
    | "approval_before_generation"
    | "approval_before_publication"
    | "blocked_manual_only";
  readonly brandReviewRequired?: boolean;
  readonly legalReviewRequired?: boolean;
};

export type CampaignPlannerCreativeBriefRef = {
  readonly id: string;
  readonly contentType?: string;
  readonly channel?: string;
  readonly status?: "draft" | "ready" | "locked";
};

export type CampaignPlannerResponsibilitySummary = {
  readonly id: string;
  readonly category: string;
  readonly enabled: boolean;
  readonly approvalPolicy?: string;
  readonly autonomyLevel?: string;
};

export type CampaignPlannerWorkUnitSummary = {
  readonly id: string;
  readonly projectId?: string | null;
  readonly title: string;
  readonly channel: string;
  readonly deliverableKind: string;
  readonly planActivityReference?: string | null;
  readonly lifecycleStage: string;
  readonly cancelled?: boolean;
  readonly paused?: boolean;
  readonly draftId?: string | null;
  readonly blockers?: readonly string[];
};

export type CampaignPlannerExplicitDeliverable = {
  readonly channel: string;
  readonly deliverableType: string;
  readonly title?: string;
  readonly planActivityReference?: string;
};

/**
 * Readonly planner input — structured summaries only where possible.
 * Campaign is included as the coordination anchor; dependency domains stay summarized.
 */
export type CampaignPlannerSource = {
  readonly organizationId: string;
  readonly peerId: string;
  readonly campaign: Campaign;
  readonly strategySummary?: CampaignPlannerStrategySummary;
  readonly planSummary?: CampaignPlannerPlanSummary;
  readonly decisionSummary?: CampaignPlannerDecisionSummary;
  readonly creativeBriefRefs?: readonly CampaignPlannerCreativeBriefRef[];
  readonly responsibilities?: readonly CampaignPlannerResponsibilitySummary[];
  readonly existingWorkUnits?: readonly CampaignPlannerWorkUnitSummary[];
  readonly explicitChannels?: readonly string[];
  readonly explicitDeliverables?: readonly CampaignPlannerExplicitDeliverable[];
  readonly assembledAt: string;
  readonly version?: number;
};
