/** Evidence pointer — references inputs, never embeds dependency-owned payloads. */
export type MarketingDecisionEvidenceKind =
  | "context-slice"
  | "marketing-strategy"
  | "marketing-plan"
  | "plan-activity"
  | "responsibility-policy"
  | "brand-brain"
  | "user-request"
  | "domain-constraint";

export type MarketingDecisionEvidence = {
  readonly kind: MarketingDecisionEvidenceKind;
  readonly ref: string;
  readonly label: string;
};

export type MarketingDecisionRecommendationStatus =
  | "RECOMMENDED"
  | "ALLOWED"
  | "DISCOURAGED"
  | "BLOCKED";

export type MarketingDecisionChannelRecommendation = {
  readonly id: string;
  readonly label: string;
  readonly rank: number;
  readonly score: number;
  readonly status: MarketingDecisionRecommendationStatus;
  readonly evidence: readonly MarketingDecisionEvidence[];
  readonly constraints?: readonly string[];
};

export type MarketingDecisionContentTypeRecommendation = {
  readonly id: string;
  readonly label: string;
  readonly rank: number;
  readonly score: number;
  readonly status: MarketingDecisionRecommendationStatus;
  readonly evidence: readonly MarketingDecisionEvidence[];
  readonly constraints?: readonly string[];
};

export type MarketingDecisionApprovalMode =
  | "no_approval_required"
  | "approval_before_generation"
  | "approval_before_publication"
  | "blocked_manual_only";

export type MarketingDecisionApprovalPolicy = {
  readonly mode: MarketingDecisionApprovalMode;
  readonly brandReviewRequired: boolean;
  readonly legalReviewRequired: boolean;
  readonly reasons: readonly string[];
};

export type MarketingDecisionBudgetPolicy = {
  readonly maxMonthlySpend: number | null;
  readonly paidChannelsAllowed: boolean;
  readonly spendAutonomous: boolean;
  readonly reasons: readonly string[];
};

export type MarketingDecisionEligibility = {
  readonly canExecute: boolean;
  readonly canGenerateCreative: boolean;
  readonly canPublish: boolean;
  readonly blockedReasons: readonly string[];
};

export type MarketingDecisionReadiness = {
  readonly ready: boolean;
  readonly understandingCompleteness: number;
  readonly maxConfidence: "low" | "moderate" | "high";
  readonly warnings: readonly string[];
};

export type MarketingDecisionConstraints = {
  readonly peerRoleMustBeMarketing: boolean;
  readonly draftableContentTypesOnly: boolean;
  readonly requiresPlanActivityWhenPlanPresent: boolean;
  readonly hardBlocks: readonly string[];
};

export type MarketingDecisionCtaStrategy = {
  readonly primaryPattern?: string;
  readonly secondaryPattern?: string;
  readonly allowedUrlHosts?: readonly string[];
  readonly constraints: readonly string[];
};

export type MarketingDecisionCreativeVolume = {
  readonly recommendedCount: number;
  readonly minimumCount: number;
  readonly maximumCount: number;
  readonly rationale: string;
};

export type MarketingDecisionRequiredDisclaimer = {
  readonly id: string;
  readonly text: string;
  readonly sourceRef: string;
};

export type MarketingDecisionStatus = "ready" | "restricted" | "blocked";

/**
 * Deterministic marketing execution decision — evidence and policy, not generated copy.
 */
export type MarketingDecisionRecord = {
  readonly id: string;
  readonly organizationId: string;
  readonly peerId: string;
  readonly objective: string;
  readonly status: MarketingDecisionStatus;
  readonly eligibility: MarketingDecisionEligibility;
  readonly readiness: MarketingDecisionReadiness;
  readonly constraints: MarketingDecisionConstraints;
  readonly approvalPolicy: MarketingDecisionApprovalPolicy;
  readonly budgetPolicy: MarketingDecisionBudgetPolicy;
  readonly channelRecommendations: readonly MarketingDecisionChannelRecommendation[];
  readonly contentTypeRecommendations: readonly MarketingDecisionContentTypeRecommendation[];
  readonly ctaStrategy: MarketingDecisionCtaStrategy;
  readonly creativeVolume: MarketingDecisionCreativeVolume;
  readonly forbiddenClaims: readonly string[];
  readonly forbiddenWords: readonly string[];
  readonly requiredDisclaimers: readonly MarketingDecisionRequiredDisclaimer[];
  readonly evidence: readonly MarketingDecisionEvidence[];
  readonly gaps: readonly string[];
  readonly assembledAt: string;
};

export type MarketingDecisionContextSlices = {
  readonly companyDnaAvailable?: boolean;
  readonly businessBrainAvailable?: boolean;
  readonly businessBrainSparse?: boolean;
  readonly marketingUnderstandingAvailable?: boolean;
  readonly marketingUnderstandingCompleteness?: number;
  readonly marketingUnderstandingSparse?: boolean;
  readonly marketingUnderstandingGaps?: readonly string[];
  readonly brandBrainAvailable?: boolean;
  readonly brandForbiddenPhrases?: readonly string[];
  readonly brandPreferredCtaPatterns?: readonly string[];
  readonly customerSegmentCount?: number;
};

export type MarketingDecisionPlanActivityRef = {
  readonly title: string;
  readonly contentType: string;
  readonly channel?: string;
};

export type MarketingDecisionStrategyRef = {
  readonly summary: string;
  readonly confidence: "low" | "moderate" | "high";
  readonly channelLabels: readonly string[];
};

export type MarketingDecisionPlanRef = {
  readonly summary: string;
  readonly confidence: "low" | "moderate" | "high";
  readonly contentCalendarCount: number;
  readonly campaignChannelLabels: readonly string[];
};

export type MarketingDecisionResponsibilityPolicy = {
  readonly responsibilities: readonly {
    readonly category: string;
    readonly enabled: boolean;
    readonly approvalPolicy: string;
    readonly autonomyLevel: string;
    readonly maxMonthlySpend?: number;
    readonly approvalRequired?: boolean;
  }[];
};

export type MarketingDecisionBudgetConstraint = {
  readonly maxMonthlySpend?: number;
  readonly paidSpendBlocked?: boolean;
};

/** Readonly assembler input — no React, Supabase, or full ContextPackage. */
export type MarketingDecisionSource = {
  readonly organizationId: string;
  readonly peerId: string;
  readonly peerRole?: string;
  readonly objective?: string;
  readonly assembledAt: string;
  readonly context: MarketingDecisionContextSlices;
  readonly strategy?: MarketingDecisionStrategyRef;
  readonly plan?: MarketingDecisionPlanRef;
  readonly planActivity?: MarketingDecisionPlanActivityRef;
  readonly responsibilityPolicy?: MarketingDecisionResponsibilityPolicy;
  readonly budgetConstraint?: MarketingDecisionBudgetConstraint;
  readonly requestedChannel?: string;
  readonly requestedContentType?: string;
  readonly userForbiddenClaims?: readonly string[];
  readonly userForbiddenWords?: readonly string[];
};
