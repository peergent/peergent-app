/**
 * Research Brain — PX-41 canonical types.
 * External discovery layer — evidence-first, never owns company truth.
 */

import type { CompanyDomainId, CompanyGraph } from "../company/types";
import type { ResearchGraph } from "./types";

export const RESEARCH_BRAIN_VERSION = "1.0.0";

export type ResearchConfidenceLabel = "low" | "medium" | "high";

export type ResearchFreshnessStatus = "fresh" | "stale" | "expired" | "unknown";

export type ResearchImportance = "low" | "medium" | "high" | "critical";

/** Structured research domains — question-driven, not exhaustive collection. */
export type ResearchDomainId =
  | "company_website"
  | "competitor"
  | "market"
  | "audience"
  | "search_seo"
  | "content"
  | "offer"
  | "positioning"
  | "reputation_review"
  | "channel"
  | "paid_advertising"
  | "industry"
  | "trend"
  | "opportunity"
  | "risk";

export type ResearchFindingType =
  | "fact"
  | "signal"
  | "pattern"
  | "trend"
  | "gap"
  | "risk"
  | "opportunity"
  | "contradiction"
  | "benchmark"
  | "hypothesis";

export type ResearchSourceType =
  | "company_website"
  | "competitor_website"
  | "search_result"
  | "market_report"
  | "review_platform"
  | "social_platform"
  | "ad_library"
  | "knowledge_source"
  | "uploaded_document"
  | "analytics_snapshot"
  | "manual_source"
  | "future_connector"
  | "company_graph"
  | "memory_read";

export type ResearchStopReason =
  | "questions_answered"
  | "confidence_threshold_met"
  | "source_budget_reached"
  | "freshness_requirement_met"
  | "no_useful_evidence"
  | "provider_limit_reached"
  | "plan_complete";

export type ResearchBudget = {
  readonly maxSources: number;
  readonly maxRequests: number;
  readonly maxPages: number;
  readonly maxCompetitors: number;
  readonly maxDurationMs: number;
  readonly costBudget: number;
};

export type ResearchBudgetState = {
  readonly sourcesUsed: number;
  readonly requestsUsed: number;
  readonly pagesUsed: number;
  readonly competitorsUsed: number;
  readonly durationMs: number;
  readonly costUsed: number;
  readonly exhausted: boolean;
  readonly stopReason: ResearchStopReason | null;
};

export type ResearchObjective = {
  readonly id: string;
  readonly projectObjective: string;
  readonly scope: readonly ResearchDomainId[];
  readonly questions: readonly string[];
  readonly priority: ResearchImportance;
};

export type ResearchPlan = {
  readonly id: string;
  readonly objective: ResearchObjective;
  readonly domains: readonly ResearchDomainId[];
  readonly sourcesNeeded: readonly ResearchSourceType[];
  readonly knownFacts: readonly string[];
  readonly unknowns: readonly string[];
  readonly budget: ResearchBudget;
  readonly stopConditions: readonly ResearchStopReason[];
  readonly freshnessRequirements: readonly { domain: ResearchDomainId; maxAgeDays: number }[];
  readonly priority: ResearchImportance;
  readonly createdAt: string;
};

export type ResearchSourceRecord = {
  readonly id: string;
  readonly type: ResearchSourceType;
  readonly identity: string;
  readonly url: string | null;
  readonly label: string;
  readonly capturedAt: string;
  readonly freshness: ResearchFreshnessStatus;
  readonly lastVerified: string | null;
  readonly organizationScoped: true;
};

export type ResearchBrainEvidence = {
  readonly id: string;
  readonly sourceId: string;
  readonly sourceType: ResearchSourceType;
  readonly url: string | null;
  readonly capturedAt: string;
  readonly freshness: ResearchFreshnessStatus;
  readonly validUntil: string | null;
  readonly rawExcerpt: string;
  readonly normalizedSummary: string;
  readonly confidence: ResearchConfidenceLabel;
  readonly directEvidence: boolean;
};

export type ResearchCitation = {
  readonly id: string;
  readonly evidenceId: string;
  readonly sourceId: string;
  readonly excerpt: string;
  readonly capturedAt: string;
};

export type ResearchEvidenceRef = {
  readonly evidenceId: string;
  readonly sourceId: string;
  readonly capturedAt: string;
};

export type ResearchFinding = {
  readonly id: string;
  readonly domain: ResearchDomainId;
  readonly title: string;
  readonly summary: string;
  readonly findingType: ResearchFindingType;
  readonly confidence: ResearchConfidenceLabel;
  readonly importance: ResearchImportance;
  readonly sourceIds: readonly string[];
  readonly evidenceIds: readonly string[];
  readonly relatedCompetitors: readonly string[];
  readonly relatedAudienceSegments: readonly string[];
  readonly relatedProducts: readonly string[];
  readonly relatedMarkets: readonly string[];
  readonly relatedCampaigns: readonly string[];
  readonly createdAt: string;
  readonly freshness: ResearchFreshnessStatus;
  readonly expiresAt: string | null;
};

export type ResearchComparison = {
  readonly id: string;
  readonly subject: string;
  readonly dimension: string;
  readonly companyValue: string;
  readonly externalValue: string;
  readonly evidenceIds: readonly string[];
  readonly confidence: ResearchConfidenceLabel;
};

export type ResearchPattern = {
  readonly id: string;
  readonly domain: ResearchDomainId;
  readonly label: string;
  readonly description: string;
  readonly evidenceIds: readonly string[];
  readonly confidence: ResearchConfidenceLabel;
};

export type ResearchContradiction = {
  readonly id: string;
  readonly companyClaim: string;
  readonly externalEvidence: string;
  readonly companyFactId: string | null;
  readonly evidenceIds: readonly string[];
  readonly confidence: ResearchConfidenceLabel;
  readonly unresolved: true;
};

export type ResearchOpportunity = {
  readonly id: string;
  readonly domain: ResearchDomainId;
  readonly title: string;
  readonly description: string;
  readonly evidenceIds: readonly string[];
  readonly confidence: ResearchConfidenceLabel;
};

export type ResearchRisk = {
  readonly id: string;
  readonly domain: ResearchDomainId;
  readonly title: string;
  readonly description: string;
  readonly evidenceIds: readonly string[];
  readonly confidence: ResearchConfidenceLabel;
};

export type CompanyUpdateProposal = {
  readonly id: string;
  readonly targetDomain: CompanyDomainId;
  readonly targetFact: string;
  readonly proposedValue: string;
  readonly reason: string;
  readonly confidence: ResearchConfidenceLabel;
  readonly evidenceIds: readonly string[];
  readonly breakingChange: boolean;
  readonly requiresCustomerConfirmation: boolean;
};

export type CompetitorProfile = {
  readonly id: string;
  readonly name: string;
  readonly website: string | null;
  readonly positioning: string | null;
  readonly offer: string | null;
  readonly pricingSignals: readonly string[];
  readonly primaryMessages: readonly string[];
  readonly proofPoints: readonly string[];
  readonly channels: readonly string[];
  readonly contentThemes: readonly string[];
  readonly strengths: readonly string[];
  readonly weaknesses: readonly string[];
  readonly differentiators: readonly string[];
  readonly customerSentiment: string | null;
  readonly recentMovements: readonly string[];
  readonly confidence: ResearchConfidenceLabel;
  readonly evidenceIds: readonly string[];
};

export type MarketSignal = {
  readonly id: string;
  readonly signalType: string;
  readonly description: string;
  readonly evidenceIds: readonly string[];
  readonly confidence: ResearchConfidenceLabel;
  readonly freshness: ResearchFreshnessStatus;
};

export type AudienceInsight = {
  readonly id: string;
  readonly segment: string;
  readonly painPoints: readonly string[];
  readonly motivations: readonly string[];
  readonly objections: readonly string[];
  readonly purchaseTriggers: readonly string[];
  readonly languageUsed: readonly string[];
  readonly trustDrivers: readonly string[];
  readonly decisionCriteria: readonly string[];
  readonly frequentQuestions: readonly string[];
  readonly channelBehavior: readonly string[];
  readonly confidence: ResearchConfidenceLabel;
  readonly evidenceIds: readonly string[];
  readonly enrichmentOnly: true;
};

export type PositioningInsight = {
  readonly id: string;
  readonly positioningGaps: readonly string[];
  readonly differentiationOpportunities: readonly string[];
  readonly messageSaturation: readonly string[];
  readonly proofGaps: readonly string[];
  readonly trustGaps: readonly string[];
  readonly evidenceIds: readonly string[];
  readonly confidence: ResearchConfidenceLabel;
};

export type SearchInsight = {
  readonly id: string;
  readonly searchIntent: readonly string[];
  readonly keywordThemes: readonly string[];
  readonly contentGaps: readonly string[];
  readonly competitorTopics: readonly string[];
  readonly rankingOpportunities: readonly string[];
  readonly searchQuestions: readonly string[];
  readonly commercialIntent: readonly string[];
  readonly informationalIntent: readonly string[];
  readonly evidenceIds: readonly string[];
  readonly confidence: ResearchConfidenceLabel;
};

export type UnresolvedQuestion = {
  readonly id: string;
  readonly question: string;
  readonly reason: string;
  readonly domain: ResearchDomainId | null;
};

export type ResearchSummary = {
  readonly headline: string;
  readonly findingCount: number;
  readonly evidenceCount: number;
  readonly contradictionCount: number;
  readonly proposalCount: number;
  readonly unresolvedCount: number;
  /** PX-63 — pipeline metadata for truthful runtime / Office surfacing */
  readonly providerId?: string;
  readonly fallbackUsed?: boolean;
  readonly externalFetchCount?: number;
  readonly fetchFailures?: number;
};

/** Layered Research Graph — every conclusion references evidence. */
export type ResearchBrainGraph = {
  readonly version: string;
  readonly organizationId: string;
  readonly projectId?: string;
  readonly campaignId?: string;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly objective: ResearchObjective;
  readonly plan: ResearchPlan;
  readonly sources: readonly ResearchSourceRecord[];
  readonly findings: readonly ResearchFinding[];
  readonly evidence: readonly ResearchBrainEvidence[];
  readonly citations: readonly ResearchCitation[];
  readonly comparisons: readonly ResearchComparison[];
  readonly patterns: readonly ResearchPattern[];
  readonly contradictions: readonly ResearchContradiction[];
  readonly opportunities: readonly ResearchOpportunity[];
  readonly risks: readonly ResearchRisk[];
  readonly proposedUpdates: readonly CompanyUpdateProposal[];
  readonly competitorProfiles: readonly CompetitorProfile[];
  readonly marketSignals: readonly MarketSignal[];
  readonly audienceInsights: readonly AudienceInsight[];
  readonly positioningInsights: readonly PositioningInsight[];
  readonly searchInsights: readonly SearchInsight[];
  readonly unresolvedQuestions: readonly UnresolvedQuestion[];
  readonly summary: ResearchSummary;
  readonly confidence: ResearchConfidenceLabel;
  readonly budgetState: ResearchBudgetState;
  /** Strangler — legacy module graph when built from snapshot/capabilities. */
  readonly legacyGraph?: ResearchGraph;
};

export type ResearchSnapshot = {
  readonly id: string;
  readonly organizationId: string;
  readonly projectId?: string;
  readonly campaignId?: string;
  readonly graph: ResearchBrainGraph;
  readonly outputRef: string;
  readonly storedAt: string;
};

export type ResearchRun = {
  readonly id: string;
  readonly organizationId: string;
  readonly projectId?: string;
  readonly campaignId?: string;
  readonly planId: string;
  readonly startedAt: string;
  readonly completedAt: string | null;
  readonly status: "running" | "completed" | "budget_exhausted" | "failed";
  readonly snapshotId: string | null;
};

export type ResearchHistoryEntry = {
  readonly runId: string;
  readonly snapshotId: string;
  readonly version: number;
  readonly storedAt: string;
  readonly changeReason: string;
};

export type ResearchHistory = {
  readonly organizationId: string;
  readonly projectId?: string;
  readonly entries: readonly ResearchHistoryEntry[];
};

export type ResearchBrainInput = {
  readonly organizationId: string;
  readonly projectId?: string;
  readonly episodeId?: string;
  readonly campaignId?: string;
  readonly locale?: "nl" | "en";
  readonly companyGraph: CompanyGraph;
  readonly memoryRefs?: readonly string[];
  readonly priorResearchSnapshotId?: string;
  readonly researchQuestions?: readonly string[];
  readonly researchScope?: readonly ResearchDomainId[];
  readonly budget?: Partial<ResearchBudget>;
  readonly projectObjective?: string;
  readonly correlationId?: string;
  readonly author?: string;
  readonly websiteUrl?: string | null;
  readonly competitors?: readonly { readonly name: string; readonly url?: string | null }[];
};

export type ResearchBrainOutput = {
  readonly graph: ResearchBrainGraph;
  readonly structuredOutput: import("../../evidence/structured-output").BrainStructuredOutput;
  readonly outputRef: string;
  readonly snapshot: ResearchSnapshot;
  readonly run: ResearchRun;
};

export type ResearchBrainPayload = {
  readonly companyGraph?: CompanyGraph | null;
  readonly memoryRefs?: readonly string[];
  readonly researchQuestions?: readonly string[];
  readonly researchScope?: readonly ResearchDomainId[];
  readonly budget?: Partial<ResearchBudget>;
  readonly projectObjective?: string;
  readonly priorResearchSnapshotId?: string;
  readonly websiteUrl?: string | null;
  readonly competitors?: readonly { readonly name: string; readonly url?: string | null }[];
};

export const DEFAULT_RESEARCH_BUDGET: ResearchBudget = {
  maxSources: 20,
  maxRequests: 10,
  maxPages: 5,
  maxCompetitors: 5,
  maxDurationMs: 60_000,
  costBudget: 100,
};

export function emptyResearchBrainGraph(input: {
  organizationId: string;
  projectId?: string;
  campaignId?: string;
  objective: ResearchObjective;
  plan: ResearchPlan;
  createdAt?: string;
}): ResearchBrainGraph {
  const now = input.createdAt ?? new Date().toISOString();
  return {
    version: RESEARCH_BRAIN_VERSION,
    organizationId: input.organizationId,
    projectId: input.projectId,
    campaignId: input.campaignId,
    createdAt: now,
    updatedAt: now,
    objective: input.objective,
    plan: input.plan,
    sources: [],
    findings: [],
    evidence: [],
    citations: [],
    comparisons: [],
    patterns: [],
    contradictions: [],
    opportunities: [],
    risks: [],
    proposedUpdates: [],
    competitorProfiles: [],
    marketSignals: [],
    audienceInsights: [],
    positioningInsights: [],
    searchInsights: [],
    unresolvedQuestions: [],
    summary: {
      headline: "Research not yet executed",
      findingCount: 0,
      evidenceCount: 0,
      contradictionCount: 0,
      proposalCount: 0,
      unresolvedCount: 0,
    },
    confidence: "low",
    budgetState: {
      sourcesUsed: 0,
      requestsUsed: 0,
      pagesUsed: 0,
      competitorsUsed: 0,
      durationMs: 0,
      costUsed: 0,
      exhausted: false,
      stopReason: null,
    },
  };
}
