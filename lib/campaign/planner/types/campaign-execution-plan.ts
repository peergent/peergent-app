import type { CampaignWorkerRole } from "@/lib/campaign/types/campaign";

export type CampaignExecutionPlanStatus =
  | "draft"
  | "ready"
  | "restricted"
  | "blocked";

export type CampaignWorkPackageType =
  | "research"
  | "positioning"
  | "audience_definition"
  | "campaign_strategy"
  | "campaign_plan"
  | "creative_direction"
  | "content_creation"
  | "design"
  | "review"
  | "publication"
  | "performance_monitoring"
  | "learning";

export type CampaignWorkPackageStatus =
  | "proposed"
  | "in_progress"
  | "satisfied"
  | "blocked"
  | "skipped";

export type CampaignWorkPackagePhase =
  | "research"
  | "strategy"
  | "planning"
  | "creative"
  | "production"
  | "review"
  | "publish"
  | "measure"
  | "learn";

export type CampaignWorkPackageEffort = "low" | "medium" | "high";

export type CampaignWorkPackageOwner = {
  readonly role: CampaignWorkerRole | "customer";
  readonly responsibilityId?: string;
  readonly peerId?: string;
  readonly label?: string;
};

export type CampaignWorkPackageApprovalRequirement = {
  readonly required: boolean;
  readonly mode?:
    | "no_approval_required"
    | "approval_before_generation"
    | "approval_before_publication"
    | "blocked_manual_only";
  readonly brandReviewRequired?: boolean;
  readonly legalReviewRequired?: boolean;
};

export type CampaignWorkPackageSourceReference = {
  readonly kind:
    | "campaign"
    | "strategy"
    | "plan_activity"
    | "decision"
    | "creative_brief"
    | "work_unit"
    | "responsibility"
    | "explicit_deliverable";
  readonly ref: string;
  readonly label?: string;
};

export type CampaignWorkPackage = {
  readonly id: string;
  readonly type: CampaignWorkPackageType;
  readonly title: string;
  readonly description: string;
  readonly status: CampaignWorkPackageStatus;
  readonly priority: number;
  readonly phase: CampaignWorkPackagePhase;
  readonly dependencies: readonly string[];
  readonly recommendedOwner: CampaignWorkPackageOwner;
  readonly estimatedEffort: CampaignWorkPackageEffort;
  readonly approvalRequirement: CampaignWorkPackageApprovalRequirement;
  readonly deliverableType?: string;
  readonly channel?: string;
  readonly sourceReferences: readonly CampaignWorkPackageSourceReference[];
  readonly blockers: readonly string[];
  readonly completionCriteria: string;
  readonly matchedWorkUnitId?: string;
};

export type CampaignExecutionPlanApproval = {
  readonly packageId: string;
  readonly gate: "before_generation" | "before_publication" | "manual_only";
  readonly description: string;
};

export type CampaignExecutionPlanGap = {
  readonly id: string;
  readonly message: string;
  readonly relatedPackageIds?: readonly string[];
};

export type CampaignExecutionPlanEvidence = {
  readonly kind: string;
  readonly ref: string;
  readonly label: string;
};

export type CampaignExecutionPlan = {
  readonly id: string;
  readonly campaignId: string;
  readonly organizationId: string;
  readonly version: number;
  readonly status: CampaignExecutionPlanStatus;
  readonly objective: string;
  readonly workPackages: readonly CampaignWorkPackage[];
  readonly executionOrder: readonly string[];
  readonly approvals: readonly CampaignExecutionPlanApproval[];
  readonly gaps: readonly CampaignExecutionPlanGap[];
  readonly evidence: readonly CampaignExecutionPlanEvidence[];
  readonly assembledAt: string;
};
