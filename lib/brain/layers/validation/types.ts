/**
 * Validation Brain — canonical types.
 * PX-36. Senior Creative Director + Brand Manager + Marketing Director combined.
 * Never create, rewrite, or publish — only evaluate Creative Brain output.
 */

import type { CreativeGraph } from "../creative/types";

export const VALIDATION_LAYER_VERSION = "1.0.0";

export type ValidationConfidence = "low" | "medium" | "high";

/** Four publication outcomes — quality gate verdict. */
export type PublicationReadiness =
  | "READY"
  | "READY_WITH_SUGGESTIONS"
  | "CHANGES_REQUIRED"
  | "BLOCKED";

export type ValidationSeverity = "critical" | "high" | "medium" | "low";

export type ValidationCategoryStatus = "pass" | "warning" | "fail";

/** Independent validation domains — each evaluated separately. */
export type ValidationDomainId =
  | "business_fit"
  | "brand_consistency"
  | "tone_of_voice"
  | "audience_fit"
  | "positioning"
  | "competitive_differentiation"
  | "creative_quality"
  | "message_clarity"
  | "trust"
  | "objections"
  | "channel_linkedin"
  | "channel_google_ads"
  | "channel_email"
  | "channel_landing_page"
  | "channel_blog"
  | "cta_quality"
  | "conversion_potential"
  | "consistency"
  | "legal_claims";

export type ValidationCategory = {
  readonly id: ValidationDomainId;
  readonly label: string;
  readonly status: ValidationCategoryStatus;
  readonly score: ValidationScore;
  readonly summary: string;
  readonly evaluatedAt: string;
};

export type ValidationScore = {
  readonly value: number;
  readonly max: number;
  readonly label: "excellent" | "good" | "fair" | "poor";
};

/** Every issue carries category, severity, impact, resolution, and blocking flag. */
export type ValidationIssue = {
  readonly id: string;
  readonly category: ValidationDomainId;
  readonly severity: ValidationSeverity;
  readonly reason: string;
  readonly businessImpact: string;
  readonly suggestedResolution: string;
  readonly blocking: boolean;
  readonly deliverableId?: string;
  readonly channel?: string;
};

export type ValidationWarning = {
  readonly id: string;
  readonly category: ValidationDomainId;
  readonly reason: string;
  readonly businessImpact: string;
  readonly suggestedResolution: string;
  readonly deliverableId?: string;
};

export type ValidationPass = {
  readonly id: string;
  readonly category: ValidationDomainId;
  readonly reason: string;
  readonly deliverableId?: string;
};

export type RequiredFix = {
  readonly issueId: string;
  readonly category: ValidationDomainId;
  readonly summary: string;
  readonly blocking: boolean;
};

export type OptionalImprovement = {
  readonly warningId: string;
  readonly category: ValidationDomainId;
  readonly summary: string;
  readonly expectedImpact: string;
};

export type BusinessRisk = {
  readonly id: string;
  readonly category: ValidationDomainId;
  readonly risk: string;
  readonly severity: ValidationSeverity;
  readonly mitigation: string;
};

export type BrandRisk = {
  readonly id: string;
  readonly category: ValidationDomainId;
  readonly risk: string;
  readonly severity: ValidationSeverity;
  readonly mitigation: string;
};

export type ValidationDecision = {
  readonly id: string;
  readonly deliverableId: string;
  readonly deliverableType: string;
  readonly channel: string;
  readonly approved: boolean;
  readonly reason: string;
};

export type ValidationPhaseRecord = {
  readonly domain: ValidationDomainId;
  readonly completedAt: string;
  readonly summary: string;
  readonly status: ValidationCategoryStatus;
  readonly issueCount: number;
};

/** Complete validation report — primary output artifact. */
export type ValidationReport = {
  readonly version: string;
  readonly organizationId: string;
  readonly campaignId: string;
  readonly episodeId?: string;
  readonly createdAt: string;
  readonly overallScore: ValidationScore;
  readonly publicationReadiness: PublicationReadiness;
  readonly categories: readonly ValidationCategory[];
  readonly issues: readonly ValidationIssue[];
  readonly warnings: readonly ValidationWarning[];
  readonly passes: readonly ValidationPass[];
  readonly requiredFixes: readonly RequiredFix[];
  readonly optionalImprovements: readonly OptionalImprovement[];
  readonly businessRisks: readonly BusinessRisk[];
  readonly brandRisks: readonly BrandRisk[];
  readonly approvedDeliverables: readonly ValidationDecision[];
  readonly rejectedDeliverables: readonly ValidationDecision[];
  readonly reasoningSummary: string;
  readonly confidence: ValidationConfidence;
  readonly estimatedQuality: ValidationScore;
  readonly estimatedConversion: ValidationScore;
};

/** ValidationGraph — persisted brain output with audit trail. */
export type ValidationGraph = {
  readonly version: string;
  readonly organizationId: string;
  readonly campaignId: string;
  readonly episodeId?: string;
  readonly createdAt: string;
  readonly creativeGraphRef: string;
  readonly report: ValidationReport;
  readonly phases: readonly ValidationPhaseRecord[];
  readonly confidence: ValidationConfidence;
};

export type ValidationSummary = {
  readonly publicationReadiness: PublicationReadiness;
  readonly overallScore: number;
  readonly blockingIssueCount: number;
  readonly warningCount: number;
  readonly approvedDeliverableCount: number;
  readonly rejectedDeliverableCount: number;
  readonly confidence: ValidationConfidence;
};

/** Input — assembled from Project Engine context + upstream brains. */
export type ValidationBrainInput = {
  readonly organizationId: string;
  readonly projectId: string;
  readonly episodeId?: string;
  readonly locale?: "nl" | "en";
  readonly creativeGraph: CreativeGraph;
  readonly strategyGraph?: import("../../strategy/strategy-graph").StrategyGraph | null;
  readonly planningGraph?: import("../planning/types").PlanningGraph | null;
  readonly decisionCollection?: import("../../decision/decision-types").DecisionCollection | null;
  readonly brandGraph?: import("../brand/types").BrandGraph | null;
  readonly marketingIntelligence?: import("../marketing-intelligence/types").MarketingIntelligenceGraph | null;
  readonly researchGraph?: import("../research/types").ResearchGraph | null;
  readonly reasoningGraph?: import("../reasoning/types").ReasoningGraph | null;
  readonly campaignContext?: import("@/lib/office/campaign/campaign-context").CampaignContext | null;
  readonly priorDecisionIds?: readonly string[];
  readonly memoryRefs?: readonly string[];
  readonly correlationId?: string;
};

/** Full Validation Brain output — graph + structured brain output handle. */
export type ValidationBrainOutput = {
  readonly graph: ValidationGraph;
  readonly structuredOutput: import("../../evidence/structured-output").BrainStructuredOutput;
  readonly outputRef: string;
};

/** Contract payload type for ProjectBrainContract. */
export type ValidationBrainPayload = Omit<ValidationBrainInput, "organizationId" | "projectId" | "episodeId" | "locale"> & {
  readonly creativeGraph?: CreativeGraph | null;
};
