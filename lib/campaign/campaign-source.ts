import type { MarketingDecisionRecord } from "@/lib/marketing-decision";
import type { ContentCalendarEntry, MarketingPlan } from "@/lib/marketing-intelligence/types/plan";
import type { MarketingStrategy } from "@/lib/marketing-intelligence/types/strategy";
import type {
  CampaignApprovalMode,
  CampaignKpiPlaceholder,
  CampaignMilestone,
  CampaignPersona,
  CampaignRecommendation,
  CampaignSegmentRef,
  CampaignStatus,
  CampaignWorkerRole,
  CampaignWorkerStatus,
} from "./types";

export type CampaignAudienceInput = {
  readonly targetAudience?: string;
  readonly personas?: readonly CampaignPersona[];
  readonly segments?: readonly CampaignSegmentRef[];
};

export type CampaignTimelineInput = {
  readonly startDate?: string;
  readonly endDate?: string;
  readonly milestones?: readonly CampaignMilestone[];
};

export type CampaignBudgetInput = {
  readonly currency?: string;
  readonly allocated?: number;
  readonly spent?: number;
  readonly notes?: string;
};

export type CampaignWorkforceAssignment = {
  readonly role: CampaignWorkerRole;
  readonly displayName?: string;
  readonly status?: CampaignWorkerStatus;
  readonly responsibility: string;
  readonly completion?: number;
  readonly peerId?: string;
};

export type CampaignProgressInput = {
  readonly percentComplete?: number;
  readonly summary?: string;
};

/**
 * Explicit lifecycle hints — never infer `active` from plan/strategy presence alone.
 * Precedence is resolved in assemble-campaign (see deriveCampaignStatus).
 */
export type CampaignStatusFlags = {
  readonly blocked?: boolean;
  readonly cancelled?: boolean;
  readonly completed?: boolean;
  readonly paused?: boolean;
  readonly ready?: boolean;
  readonly active?: boolean;
};

/** Readonly assembler input — no React, Supabase, or framework request types. */
export type CampaignSource = {
  readonly organizationId: string;
  readonly campaignId: string;
  readonly name: string;
  readonly description?: string;
  readonly strategy?: MarketingStrategy;
  readonly plan?: MarketingPlan;
  readonly selectedPlanActivities?: readonly ContentCalendarEntry[];
  readonly decisions?: readonly MarketingDecisionRecord[];
  readonly creativeBriefIds?: readonly string[];
  readonly generatedContentIds?: readonly string[];
  readonly assetIds?: readonly string[];
  readonly audience?: CampaignAudienceInput;
  readonly timeline?: CampaignTimelineInput;
  readonly budget?: CampaignBudgetInput;
  readonly approvalMode?: CampaignApprovalMode;
  readonly workforce?: readonly CampaignWorkforceAssignment[];
  /** When true, seeds all six canonical roles; explicit workforce entries override by role. */
  readonly seedCanonicalWorkforce?: boolean;
  readonly progress?: CampaignProgressInput;
  readonly kpiPlaceholders?: readonly CampaignKpiPlaceholder[];
  readonly recommendations?: readonly CampaignRecommendation[];
  readonly status?: CampaignStatus;
  readonly statusFlags?: CampaignStatusFlags;
  readonly version?: number;
  readonly assembledAt: string;
  readonly createdAt?: string;
  readonly updatedAt?: string;
};
