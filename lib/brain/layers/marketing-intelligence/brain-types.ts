/**
 * Marketing Intelligence Brain — PX-43 canonical types.
 * Marketing-domain interpretation — never strategy, creative, or research.
 */

import type { CompanyGraph } from "../company/types";
import type { ResearchBrainGraph } from "../research/brain-types";
import type { ReasoningBrainGraph } from "../reasoning/brain-types";

export const MARKETING_INTELLIGENCE_BRAIN_VERSION = "1.0.0";

export type MarketingIntelligenceConfidence = "low" | "medium" | "high";

export type MarketingPriority = "high" | "medium" | "low";

export type MarketingImportance = "low" | "medium" | "high" | "critical";

export type InsufficientDataReason =
  | "insufficient_data"
  | "benchmark_unavailable"
  | "channel_data_missing"
  | "audience_evidence_weak"
  | "measurement_not_ready";

export type MarketingEvidenceRef = {
  readonly id: string;
  readonly source: "company" | "research" | "reasoning" | "memory";
  readonly refId: string;
  readonly summary: string;
  readonly confidence: MarketingIntelligenceConfidence;
};

export type BusinessContextSnapshot = {
  readonly organizationSummary: string;
  readonly goals: readonly string[];
  readonly constraints: readonly string[];
  readonly projectObjective: string;
  readonly evidenceIds: readonly string[];
};

export type AudienceSegmentIntelligence = {
  readonly segment: string;
  readonly importance: MarketingImportance;
  readonly intentLevel: MarketingPriority;
  readonly coreProblem: string;
  readonly primaryMotivation: string;
  readonly keyObjections: readonly string[];
  readonly trustBuilders: readonly string[];
  readonly preferredChannels: readonly string[];
  readonly messageSensitivity: string;
  readonly evidenceIds: readonly string[];
  readonly confidence: MarketingIntelligenceConfidence;
};

export type ChannelIntelligence = {
  readonly channel: string;
  readonly audienceFit: MarketingPriority;
  readonly intentFit: MarketingPriority;
  readonly objectiveFit: MarketingPriority;
  readonly creativeFit: MarketingPriority;
  readonly competitiveIntensity: MarketingPriority;
  readonly estimatedComplexity: MarketingPriority;
  readonly measurementQuality: MarketingPriority;
  readonly organicOrPaid: "organic" | "paid" | "both" | "unknown";
  readonly funnelRole: string;
  readonly confidence: MarketingIntelligenceConfidence;
  readonly evidenceIds: readonly string[];
  readonly risks: readonly string[];
  readonly opportunities: readonly string[];
};

export type MessagingIntelligence = {
  readonly dominantMarketMessages: readonly string[];
  readonly saturatedClaims: readonly string[];
  readonly underusedMessages: readonly string[];
  readonly trustThemes: readonly string[];
  readonly proofRequirements: readonly string[];
  readonly objectionThemes: readonly string[];
  readonly emotionalDrivers: readonly string[];
  readonly rationalDrivers: readonly string[];
  readonly messageDifferentiation: readonly string[];
  readonly messageRisks: readonly string[];
  readonly confidence: MarketingIntelligenceConfidence;
  readonly evidenceIds: readonly string[];
};

export type CompetitiveMarketingIntelligence = {
  readonly competitorId: string;
  readonly name: string;
  readonly channelPresence: readonly string[];
  readonly messagingShare: string | null;
  readonly campaignThemes: readonly string[];
  readonly positioningCluster: string | null;
  readonly offerPatterns: readonly string[];
  readonly ctaPatterns: readonly string[];
  readonly contentThemes: readonly string[];
  readonly creativePatterns: readonly string[];
  readonly proofUsage: readonly string[];
  readonly marketSaturation: MarketingPriority;
  readonly visibleWeaknesses: readonly string[];
  readonly visibleWhitespace: readonly string[];
  readonly confidence: MarketingIntelligenceConfidence;
  readonly evidenceIds: readonly string[];
};

export type MarketIntelligenceSignal = {
  readonly signal: string;
  readonly marketingImplication: string;
  readonly confidence: MarketingIntelligenceConfidence;
  readonly urgency: MarketingPriority;
  readonly affectedAudiences: readonly string[];
  readonly affectedChannels: readonly string[];
  readonly evidenceIds: readonly string[];
};

export type FunnelIntelligence = {
  readonly stage: string;
  readonly status: "strong" | "gap" | "unknown";
  readonly gaps: readonly string[];
  readonly weakHandoffs: readonly string[];
  readonly missingProof: readonly string[];
  readonly missingContent: readonly string[];
  readonly missingCta: readonly string[];
  readonly trustGaps: readonly string[];
  readonly intentMismatch: readonly string[];
  readonly measurementGaps: readonly string[];
  readonly confidence: MarketingIntelligenceConfidence;
  readonly evidenceIds: readonly string[];
};

export type OfferIntelligence = {
  readonly clarity: MarketingPriority;
  readonly differentiation: MarketingPriority;
  readonly proof: MarketingPriority;
  readonly riskReversal: MarketingPriority;
  readonly urgency: MarketingPriority;
  readonly pricingTransparency: MarketingPriority;
  readonly valueCommunication: MarketingPriority;
  readonly entryOffer: string | null;
  readonly primaryConversionAction: string | null;
  readonly strengths: readonly string[];
  readonly weaknesses: readonly string[];
  readonly opportunities: readonly string[];
  readonly risks: readonly string[];
  readonly confidence: MarketingIntelligenceConfidence;
  readonly evidenceIds: readonly string[];
};

export type ContentIntelligence = {
  readonly contentThemes: readonly string[];
  readonly coverageGaps: readonly string[];
  readonly formatOpportunities: readonly string[];
  readonly authorityGaps: readonly string[];
  readonly educationGaps: readonly string[];
  readonly objectionContentGaps: readonly string[];
  readonly proofGaps: readonly string[];
  readonly comparisonContentOpportunities: readonly string[];
  readonly searchIntentContentGaps: readonly string[];
  readonly confidence: MarketingIntelligenceConfidence;
  readonly evidenceIds: readonly string[];
};

export type SearchIntelligence = {
  readonly commercialIntentClusters: readonly string[];
  readonly informationalClusters: readonly string[];
  readonly searchOpportunityThemes: readonly string[];
  readonly contentGaps: readonly string[];
  readonly competitiveSearchPressure: MarketingPriority;
  readonly brandDemand: MarketingPriority;
  readonly nonBrandDemand: MarketingPriority;
  readonly questionThemes: readonly string[];
  readonly conversionIntentTopics: readonly string[];
  readonly confidence: MarketingIntelligenceConfidence;
  readonly evidenceIds: readonly string[];
};

export type PaidMediaIntelligence = {
  readonly intentQuality: MarketingPriority;
  readonly audienceAvailability: MarketingPriority;
  readonly messageMarketFit: MarketingPriority;
  readonly measurementReadiness: MarketingPriority;
  readonly landingPageReadiness: MarketingPriority;
  readonly competitivePressure: MarketingPriority;
  readonly creativeDemand: MarketingPriority;
  readonly budgetSensitivity: MarketingPriority;
  readonly confidence: MarketingIntelligenceConfidence;
  readonly evidenceIds: readonly string[];
  readonly insufficientData: readonly InsufficientDataReason[];
};

export type OrganicIntelligence = {
  readonly authority: MarketingPriority;
  readonly contentConsistency: MarketingPriority;
  readonly searchVisibility: MarketingPriority;
  readonly socialPresence: MarketingPriority;
  readonly brandDemand: MarketingPriority;
  readonly thoughtLeadershipOpportunity: MarketingPriority;
  readonly communityOpportunity: MarketingPriority;
  readonly proofAvailability: MarketingPriority;
  readonly confidence: MarketingIntelligenceConfidence;
  readonly evidenceIds: readonly string[];
};

export type BenchmarkSource = {
  readonly id: string;
  readonly kind: "industry_report" | "platform_benchmark" | "memory" | "customer_data";
  readonly refId: string;
  readonly capturedAt: string;
};

export type BenchmarkRange = {
  readonly min: number | null;
  readonly max: number | null;
  readonly unit: string;
};

export type BenchmarkConfidence = "low" | "medium" | "high" | "unavailable";

export type MarketingBenchmark = {
  readonly id: string;
  readonly metric: string;
  readonly channel: string | null;
  readonly range: BenchmarkRange | null;
  readonly source: BenchmarkSource | null;
  readonly confidence: BenchmarkConfidence;
  readonly benchmarkUnavailable: boolean;
  readonly evidenceIds: readonly string[];
};

export type MarketingOpportunity = {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly category: string;
  readonly audience: readonly string[];
  readonly channels: readonly string[];
  readonly funnelStage: string;
  readonly expectedBusinessImpact: MarketingImportance;
  readonly marketingImpact: string;
  readonly urgency: MarketingPriority;
  readonly effort: MarketingPriority;
  readonly confidence: MarketingIntelligenceConfidence;
  readonly evidenceIds: readonly string[];
  readonly dependencies: readonly string[];
  readonly risks: readonly string[];
};

export type MarketingRisk = {
  readonly id: string;
  readonly description: string;
  readonly category: string;
  readonly likelihood: MarketingPriority;
  readonly severity: MarketingImportance;
  readonly marketingImpact: string;
  readonly businessImpact: string;
  readonly affectedChannels: readonly string[];
  readonly affectedAudience: readonly string[];
  readonly confidence: MarketingIntelligenceConfidence;
  readonly evidenceIds: readonly string[];
  readonly mitigationConsideration: string;
};

export type MarketingPrioritySignal = {
  readonly id: string;
  readonly subject: string;
  readonly priority: MarketingPriority;
  readonly reasoning: string;
  readonly businessImpact: MarketingImportance;
  readonly evidenceStrength: MarketingIntelligenceConfidence;
  readonly urgency: MarketingPriority;
  readonly confidence: MarketingIntelligenceConfidence;
  readonly effort: MarketingPriority;
  readonly dependencies: readonly string[];
};

export type MarketingStrategyInput = {
  readonly topAudienceSignals: readonly string[];
  readonly topChannelSignals: readonly string[];
  readonly topMessagingSignals: readonly string[];
  readonly topMarketSignals: readonly string[];
  readonly topCompetitiveSignals: readonly string[];
  readonly topFunnelGaps: readonly string[];
  readonly topOpportunities: readonly string[];
  readonly topRisks: readonly string[];
  readonly benchmarkContext: readonly MarketingBenchmark[];
  readonly constraints: readonly string[];
  readonly unknowns: readonly string[];
  readonly confidence: MarketingIntelligenceConfidence;
};

export type MarketingIntelligenceSummary = {
  readonly headline: string;
  readonly opportunityCount: number;
  readonly riskCount: number;
  readonly priorityCount: number;
  readonly insufficientDataFlags: readonly InsufficientDataReason[];
};

/** Layered marketing intelligence graph. */
export type MarketingIntelligenceBrainGraph = {
  readonly version: string;
  readonly organizationId: string;
  readonly projectId?: string;
  readonly campaignId?: string;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly companyGraphVersion: string;
  readonly researchGraphVersion: string;
  readonly reasoningGraphVersion: string;
  readonly evidence: readonly MarketingEvidenceRef[];
  readonly businessContext: BusinessContextSnapshot;
  readonly audienceIntelligence: readonly AudienceSegmentIntelligence[];
  readonly marketIntelligence: readonly MarketIntelligenceSignal[];
  readonly competitiveMarketing: readonly CompetitiveMarketingIntelligence[];
  readonly channelIntelligence: readonly ChannelIntelligence[];
  readonly messagingIntelligence: MessagingIntelligence;
  readonly offerIntelligence: OfferIntelligence;
  readonly funnelIntelligence: readonly FunnelIntelligence[];
  readonly contentIntelligence: ContentIntelligence;
  readonly searchIntelligence: SearchIntelligence;
  readonly paidMediaIntelligence: PaidMediaIntelligence;
  readonly organicIntelligence: OrganicIntelligence;
  readonly opportunitySignals: readonly MarketingOpportunity[];
  readonly riskSignals: readonly MarketingRisk[];
  readonly benchmarkContext: readonly MarketingBenchmark[];
  readonly marketingPriorities: readonly MarketingPrioritySignal[];
  readonly strategyInputs: MarketingStrategyInput;
  readonly summary: MarketingIntelligenceSummary;
  readonly confidence: MarketingIntelligenceConfidence;
};

export type MarketingIntelligenceSnapshot = {
  readonly id: string;
  readonly organizationId: string;
  readonly projectId?: string;
  readonly campaignId?: string;
  readonly graph: MarketingIntelligenceBrainGraph;
  readonly outputRef: string;
  readonly storedAt: string;
};

export type MarketingIntelligenceRun = {
  readonly id: string;
  readonly organizationId: string;
  readonly projectId?: string;
  readonly campaignId?: string;
  readonly startedAt: string;
  readonly completedAt: string | null;
  readonly status: "running" | "completed" | "failed";
  readonly snapshotId: string | null;
};

export type MarketingIntelligenceHistoryEntry = {
  readonly runId: string;
  readonly snapshotId: string;
  readonly version: number;
  readonly storedAt: string;
  readonly changeReason: string;
};

export type MarketingIntelligenceHistory = {
  readonly organizationId: string;
  readonly projectId?: string;
  readonly entries: readonly MarketingIntelligenceHistoryEntry[];
};

export type MarketingIntelligenceBrainInput = {
  readonly organizationId: string;
  readonly projectId?: string;
  readonly episodeId?: string;
  readonly campaignId?: string;
  readonly locale?: "nl" | "en";
  readonly companyGraph: CompanyGraph;
  readonly researchGraph: ResearchBrainGraph;
  readonly reasoningGraph: ReasoningBrainGraph;
  readonly memoryGraph?: import("../memory/types").MemoryGraph | null;
  readonly projectObjective?: string;
  readonly businessGoals?: readonly string[];
  readonly constraints?: readonly string[];
  readonly budgetContext?: string | null;
  readonly audienceContext?: readonly string[];
  readonly channelData?: readonly string[];
  readonly priorMarketingDecisions?: readonly string[];
};

export type MarketingIntelligenceBrainOutput = {
  readonly graph: MarketingIntelligenceBrainGraph;
  readonly structuredOutput: import("../../evidence/structured-output").BrainStructuredOutput;
  readonly outputRef: string;
  readonly snapshot: MarketingIntelligenceSnapshot;
  readonly run: MarketingIntelligenceRun;
};

export type MarketingIntelligenceBrainPayload = {
  readonly companyGraph?: CompanyGraph | null;
  readonly researchBrainGraph?: ResearchBrainGraph | null;
  readonly reasoningBrainGraph?: ReasoningBrainGraph | null;
  readonly memoryGraph?: import("../memory/types").MemoryGraph | null;
  readonly projectObjective?: string;
  readonly businessGoals?: readonly string[];
  readonly constraints?: readonly string[];
  readonly budgetContext?: string | null;
  readonly audienceContext?: readonly string[];
  readonly channelData?: readonly string[];
  readonly priorMarketingDecisions?: readonly string[];
};

export function emptyMessagingIntelligence(): MessagingIntelligence {
  return {
    dominantMarketMessages: [],
    saturatedClaims: [],
    underusedMessages: [],
    trustThemes: [],
    proofRequirements: [],
    objectionThemes: [],
    emotionalDrivers: [],
    rationalDrivers: [],
    messageDifferentiation: [],
    messageRisks: [],
    confidence: "low",
    evidenceIds: [],
  };
}

export function emptyMarketingIntelligenceBrainGraph(input: {
  organizationId: string;
  projectId?: string;
  campaignId?: string;
  companyGraphVersion: string;
  researchGraphVersion: string;
  reasoningGraphVersion: string;
  projectObjective?: string;
  createdAt?: string;
}): MarketingIntelligenceBrainGraph {
  const now = input.createdAt ?? new Date().toISOString();
  return {
    version: MARKETING_INTELLIGENCE_BRAIN_VERSION,
    organizationId: input.organizationId,
    projectId: input.projectId,
    campaignId: input.campaignId,
    createdAt: now,
    updatedAt: now,
    companyGraphVersion: input.companyGraphVersion,
    researchGraphVersion: input.researchGraphVersion,
    reasoningGraphVersion: input.reasoningGraphVersion,
    evidence: [],
    businessContext: {
      organizationSummary: "",
      goals: [],
      constraints: [],
      projectObjective: input.projectObjective ?? "",
      evidenceIds: [],
    },
    audienceIntelligence: [],
    marketIntelligence: [],
    competitiveMarketing: [],
    channelIntelligence: [],
    messagingIntelligence: emptyMessagingIntelligence(),
    offerIntelligence: {
      clarity: "low",
      differentiation: "low",
      proof: "low",
      riskReversal: "low",
      urgency: "low",
      pricingTransparency: "low",
      valueCommunication: "low",
      entryOffer: null,
      primaryConversionAction: null,
      strengths: [],
      weaknesses: [],
      opportunities: [],
      risks: [],
      confidence: "low",
      evidenceIds: [],
    },
    funnelIntelligence: [],
    contentIntelligence: {
      contentThemes: [],
      coverageGaps: [],
      formatOpportunities: [],
      authorityGaps: [],
      educationGaps: [],
      objectionContentGaps: [],
      proofGaps: [],
      comparisonContentOpportunities: [],
      searchIntentContentGaps: [],
      confidence: "low",
      evidenceIds: [],
    },
    searchIntelligence: {
      commercialIntentClusters: [],
      informationalClusters: [],
      searchOpportunityThemes: [],
      contentGaps: [],
      competitiveSearchPressure: "low",
      brandDemand: "low",
      nonBrandDemand: "low",
      questionThemes: [],
      conversionIntentTopics: [],
      confidence: "low",
      evidenceIds: [],
    },
    paidMediaIntelligence: {
      intentQuality: "low",
      audienceAvailability: "low",
      messageMarketFit: "low",
      measurementReadiness: "low",
      landingPageReadiness: "low",
      competitivePressure: "low",
      creativeDemand: "low",
      budgetSensitivity: "low",
      confidence: "low",
      evidenceIds: [],
      insufficientData: ["measurement_not_ready"],
    },
    organicIntelligence: {
      authority: "low",
      contentConsistency: "low",
      searchVisibility: "low",
      socialPresence: "low",
      brandDemand: "low",
      thoughtLeadershipOpportunity: "low",
      communityOpportunity: "low",
      proofAvailability: "low",
      confidence: "low",
      evidenceIds: [],
    },
    opportunitySignals: [],
    riskSignals: [],
    benchmarkContext: [],
    marketingPriorities: [],
    strategyInputs: {
      topAudienceSignals: [],
      topChannelSignals: [],
      topMessagingSignals: [],
      topMarketSignals: [],
      topCompetitiveSignals: [],
      topFunnelGaps: [],
      topOpportunities: [],
      topRisks: [],
      benchmarkContext: [],
      constraints: [],
      unknowns: [],
      confidence: "low",
    },
    summary: {
      headline: "Marketing intelligence not yet executed",
      opportunityCount: 0,
      riskCount: 0,
      priorityCount: 0,
      insufficientDataFlags: [],
    },
    confidence: "low",
  };
}

export type { CompanyGraph, ResearchBrainGraph, ReasoningBrainGraph };
