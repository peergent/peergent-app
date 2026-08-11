/**
 * Learning Brain — PX-46 canonical types.
 * Feedback layer — observes outcomes, proposes Memory writes, never mutates upstream graphs.
 */

import type { CompanyGraph } from "../company/types";
import type { CreativeGraph } from "../creative/types";
import type { ExecutionHistory } from "../execution/types";
import type { MarketingIntelligenceBrainGraph } from "../marketing-intelligence/brain-types";
import type { MemoryGraph } from "../memory/types";
import type { PlanningBrainGraph } from "../planning/brain-types";
import type { ReasoningBrainGraph } from "../reasoning/brain-types";
import type { ResearchBrainGraph } from "../research/brain-types";
import type { StrategyBrainGraph } from "../strategy/brain-types";
import type { ValidationGraph } from "../validation/types";

export const LEARNING_BRAIN_VERSION = "1.0.0";

export type LearningConfidence = "low" | "medium" | "high";

export type CausalityStrength = "none" | "correlation" | "suggestive" | "experimental" | "strong";

export type LearningComparisonType =
  | "target_vs_actual"
  | "baseline_vs_actual"
  | "variant_vs_variant"
  | "channel_vs_channel"
  | "audience_vs_audience"
  | "creative_vs_creative"
  | "period_vs_period"
  | "expected_vs_actual"
  | "validation_vs_performance"
  | "strategy_vs_outcome"
  | "plan_vs_execution";

export type LearningOutcomeClassification =
  | "outperformed"
  | "met_expectation"
  | "underperformed"
  | "inconclusive"
  | "measurement_failure"
  | "execution_failure"
  | "mixed";

export type HypothesisStatus = "proposed" | "supported" | "weakened" | "rejected" | "confirmed";

export type MemoryDurability = "temporary" | "reinforce_if_repeated" | "durable_candidate";

export type TargetBrain =
  | "research"
  | "reasoning"
  | "marketing_intelligence"
  | "strategy"
  | "planning"
  | "creative"
  | "validation"
  | "execution"
  | "memory";

export type DataQualityLevel = "poor" | "fair" | "good" | "excellent";

/* ── Performance input contract (no provider integrations) ── */

export type AttributionContext = {
  readonly model: string;
  readonly source: string;
  readonly confidence: LearningConfidence;
  readonly knownLimitations: readonly string[];
  readonly crossChannelEffects: readonly string[];
  readonly trackingCompleteness: number | null;
};

export type MeasurementContext = {
  readonly windowStart: string | null;
  readonly windowEnd: string | null;
  readonly durationDays: number | null;
  readonly attribution: AttributionContext;
};

export type PerformanceObservation = {
  readonly id: string;
  readonly organizationId: string;
  readonly projectId?: string;
  readonly campaignId?: string;
  readonly deliverableId?: string;
  readonly channel?: string;
  readonly metric: string;
  readonly value: number | null;
  readonly unit: string | null;
  readonly baseline: number | null;
  readonly target: number | null;
  readonly comparisonValue: number | null;
  readonly measurementWindow: string | null;
  readonly observedAt: string;
  readonly source: string;
  readonly sourceRef: string | null;
  readonly attributionModel: string | null;
  readonly attributionConfidence: LearningConfidence;
  readonly dataQuality: DataQualityLevel;
  readonly sampleSize: number | null;
  readonly segment: string | null;
  readonly metadata: Record<string, string>;
};

export type CustomerFeedbackObservation = {
  readonly id: string;
  readonly kind: "approved" | "rejected" | "edited" | "commented" | "rated" | "selected_variant";
  readonly subject: string;
  readonly reason: string | null;
  readonly deliverableId: string | null;
  readonly observedAt: string;
};

export type LearningExperimentContext = {
  readonly experimentId: string;
  readonly hypothesis: string;
  readonly control: string;
  readonly variants: readonly string[];
  readonly primaryMetric: string;
  readonly secondaryMetrics: readonly string[];
  readonly start: string | null;
  readonly end: string | null;
  readonly sampleSize: number | null;
  readonly allocation: string | null;
  readonly validity: LearningConfidence;
  readonly confounders: readonly string[];
};

/* ── Learning artifacts ── */

export type LearningComparison = {
  readonly id: string;
  readonly type: LearningComparisonType;
  readonly expected: string;
  readonly observed: string;
  readonly delta: string | null;
  readonly direction: "up" | "down" | "flat" | "unknown";
  readonly significance: LearningConfidence;
  readonly confidence: LearningConfidence;
  readonly evidenceRefs: readonly string[];
  readonly context: string;
};

export type LearningAnomaly = {
  readonly id: string;
  readonly metric: string;
  readonly expectedRange: string;
  readonly observedValue: string;
  readonly severity: "low" | "medium" | "high";
  readonly possibleExplanations: readonly string[];
  readonly evidenceIds: readonly string[];
  readonly confidence: LearningConfidence;
  readonly requiresMoreData: boolean;
};

export type LearningPattern = {
  readonly id: string;
  readonly category: string;
  readonly title: string;
  readonly description: string;
  readonly scope: string;
  readonly supportingObservations: readonly string[];
  readonly supportingCampaigns: readonly string[];
  readonly supportingDeliverables: readonly string[];
  readonly sampleSize: number;
  readonly consistency: LearningConfidence;
  readonly businessImpact: string;
  readonly confidence: LearningConfidence;
  readonly firstObservedAt: string;
  readonly lastObservedAt: string;
  readonly contradictions: readonly string[];
};

export type LearningHypothesis = {
  readonly id: string;
  readonly statement: string;
  readonly reason: string;
  readonly supportingEvidence: readonly string[];
  readonly contradictingEvidence: readonly string[];
  readonly confidence: LearningConfidence;
  readonly status: HypothesisStatus;
  readonly validationNeeded: boolean;
  readonly recommendedTest: string | null;
  readonly scope: string;
  readonly causalityStrength: CausalityStrength;
  readonly createdAt: string;
};

export type LearningInsight = {
  readonly id: string;
  readonly observation: string;
  readonly interpretation: string;
  readonly whyItMatters: string;
  readonly businessImpact: string;
  readonly evidenceRefs: readonly string[];
  readonly confidence: LearningConfidence;
  readonly scope: string;
  readonly limitations: readonly string[];
};

export type LearningOutcome = {
  readonly id: string;
  readonly classification: LearningOutcomeClassification;
  readonly whatHappened: string;
  readonly againstExpectation: string;
  readonly businessImpact: string;
  readonly confidence: LearningConfidence;
  readonly unknowns: readonly string[];
  readonly evidenceRefs: readonly string[];
};

export type StrategyLearningSignal = {
  readonly id: string;
  readonly subject: string;
  readonly finding: string;
  readonly decisionRef: string | null;
  readonly confidence: LearningConfidence;
};

export type PlanningLearningSignal = {
  readonly id: string;
  readonly subject: string;
  readonly finding: string;
  readonly workPackageRef: string | null;
  readonly confidence: LearningConfidence;
};

export type CreativeLearningSignal = {
  readonly id: string;
  readonly subject: string;
  readonly finding: string;
  readonly deliverableRef: string | null;
  readonly confidence: LearningConfidence;
};

export type ValidationLearningSignal = {
  readonly id: string;
  readonly subject: string;
  readonly finding: string;
  readonly validationRef: string | null;
  readonly confidence: LearningConfidence;
};

export type ExecutionLearningSignal = {
  readonly id: string;
  readonly subject: string;
  readonly finding: string;
  readonly executionRef: string | null;
  readonly confidence: LearningConfidence;
};

export type AudienceLearningSignal = {
  readonly id: string;
  readonly audience: string;
  readonly observedBehavior: string;
  readonly expectedBehavior: string;
  readonly performanceDifference: string;
  readonly confidence: LearningConfidence;
  readonly sampleSize: number | null;
  readonly businessImpact: string;
  readonly futureConsideration: string;
};

export type ChannelLearningSignal = {
  readonly id: string;
  readonly channel: string;
  readonly role: string;
  readonly expectedOutcome: string;
  readonly actualOutcome: string;
  readonly efficiency: string;
  readonly quality: string;
  readonly funnelContribution: string;
  readonly confidence: LearningConfidence;
  readonly limitations: readonly string[];
};

export type MessagingLearningSignal = {
  readonly id: string;
  readonly messageTerritory: string;
  readonly hookType: string | null;
  readonly proofType: string | null;
  readonly performanceRelationship: string;
  readonly scope: string;
  readonly confidence: LearningConfidence;
};

export type ApprovalLearningSignal = {
  readonly id: string;
  readonly pattern: string;
  readonly finding: string;
  readonly confidence: LearningConfidence;
};

export type LearningContradiction = {
  readonly id: string;
  readonly claimA: string;
  readonly claimB: string;
  readonly scopeA: string;
  readonly scopeB: string;
  readonly evidenceA: readonly string[];
  readonly evidenceB: readonly string[];
  readonly possibleExplanation: string;
  readonly resolutionStatus: "unresolved" | "contextualized" | "needs_more_data";
  readonly confidence: LearningConfidence;
};

export type LearningUnknown = {
  readonly id: string;
  readonly question: string;
  readonly whyUnknown: string;
  readonly requiredEvidence: readonly string[];
  readonly blockingForLearning: boolean;
  readonly recommendedNextMeasurement: string;
};

export type MemoryWriteProposal = {
  readonly id: string;
  readonly category: string;
  readonly title: string;
  readonly learning: string;
  readonly scope: string;
  readonly evidenceRefs: readonly string[];
  readonly confidence: LearningConfidence;
  readonly importance: "low" | "medium" | "high";
  readonly durability: MemoryDurability;
  readonly recommendedMemoryDomain: string;
  readonly relatedCampaigns: readonly string[];
  readonly relatedDeliverables: readonly string[];
  readonly contradictions: readonly string[];
  readonly expiresAt: string | null;
  readonly reasonToStore: string;
  readonly freshnessSensitivity: "low" | "medium" | "high";
  readonly reviewAfter: string | null;
};

export type LearningRecommendation = {
  readonly id: string;
  readonly title: string;
  readonly recommendation: string;
  readonly reason: string;
  readonly evidence: readonly string[];
  readonly expectedBenefit: string;
  readonly confidence: LearningConfidence;
  readonly scope: string;
  readonly targetBrain: TargetBrain;
  readonly requiresValidation: boolean;
};

export type LearningSystemProposal = {
  readonly id: string;
  readonly area: string;
  readonly proposal: string;
  readonly reason: string;
  readonly evidence: readonly string[];
  readonly confidence: LearningConfidence;
  readonly autoApply: false;
};

export type DataQualityAssessment = {
  readonly qualityScore: number | null;
  readonly qualityLevel: DataQualityLevel;
  readonly limitations: readonly string[];
  readonly usableForLearning: boolean;
  readonly usableForDurableMemory: boolean;
};

export type LearningSummary = {
  readonly observationsAnalyzed: number;
  readonly comparisonsMade: number;
  readonly patternsFound: number;
  readonly hypothesesCreated: number;
  readonly confirmedLearnings: number;
  readonly inconclusiveLearnings: number;
  readonly contradictions: number;
  readonly memoryProposals: number;
  readonly futureRecommendations: number;
  readonly dataQuality: DataQualityLevel;
  readonly confidence: LearningConfidence;
};

export type LearningBrainGraph = {
  readonly version: string;
  readonly organizationId: string;
  readonly projectId?: string;
  readonly campaignId?: string;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly measurementWindow: MeasurementContext;
  readonly changeReason: string;
  readonly supersedes: string | null;
  readonly observations: readonly PerformanceObservation[];
  readonly customerFeedback: readonly CustomerFeedbackObservation[];
  readonly experiments: readonly LearningExperimentContext[];
  readonly dataQuality: DataQualityAssessment;
  readonly comparisons: readonly LearningComparison[];
  readonly anomalies: readonly LearningAnomaly[];
  readonly patterns: readonly LearningPattern[];
  readonly hypotheses: readonly LearningHypothesis[];
  readonly insights: readonly LearningInsight[];
  readonly outcomes: readonly LearningOutcome[];
  readonly strategySignals: readonly StrategyLearningSignal[];
  readonly planningSignals: readonly PlanningLearningSignal[];
  readonly creativeSignals: readonly CreativeLearningSignal[];
  readonly validationSignals: readonly ValidationLearningSignal[];
  readonly executionSignals: readonly ExecutionLearningSignal[];
  readonly audienceSignals: readonly AudienceLearningSignal[];
  readonly channelSignals: readonly ChannelLearningSignal[];
  readonly messagingSignals: readonly MessagingLearningSignal[];
  readonly approvalSignals: readonly ApprovalLearningSignal[];
  readonly contradictions: readonly LearningContradiction[];
  readonly unknowns: readonly LearningUnknown[];
  readonly recommendations: readonly LearningRecommendation[];
  readonly systemProposals: readonly LearningSystemProposal[];
  readonly memoryWriteProposals: readonly MemoryWriteProposal[];
  readonly confidence: LearningConfidence;
  readonly summary: LearningSummary;
};

export type LearningSnapshot = {
  readonly id: string;
  readonly organizationId: string;
  readonly projectId?: string;
  readonly campaignId?: string;
  readonly graph: LearningBrainGraph;
  readonly outputRef: string;
  readonly storedAt: string;
};

export type LearningRun = {
  readonly id: string;
  readonly organizationId: string;
  readonly projectId?: string;
  readonly campaignId?: string;
  readonly startedAt: string;
  readonly completedAt: string | null;
  readonly status: "running" | "completed" | "insufficient_data" | "failed";
  readonly snapshotId: string | null;
};

export type LearningHistoryEntry = {
  readonly runId: string;
  readonly snapshotId: string;
  readonly version: number;
  readonly storedAt: string;
  readonly changeReason: string;
  readonly measurementWindow: string | null;
};

export type LearningHistory = {
  readonly organizationId: string;
  readonly projectId?: string;
  readonly entries: readonly LearningHistoryEntry[];
};

export type LearningBrainInput = {
  readonly organizationId: string;
  readonly projectId?: string;
  readonly episodeId?: string;
  readonly campaignId?: string;
  readonly locale?: "nl" | "en";
  readonly performanceObservations: readonly PerformanceObservation[];
  readonly customerFeedback?: readonly CustomerFeedbackObservation[];
  readonly experiments?: readonly LearningExperimentContext[];
  readonly approvalSignals?: readonly ApprovalLearningSignal[];
  readonly measurementContext?: MeasurementContext;
  readonly companyGraph?: CompanyGraph | null;
  readonly researchGraph?: ResearchBrainGraph | null;
  readonly reasoningGraph?: ReasoningBrainGraph | null;
  readonly marketingIntelligenceGraph?: MarketingIntelligenceBrainGraph | null;
  readonly strategyGraph?: StrategyBrainGraph | null;
  readonly planningGraph?: PlanningBrainGraph | null;
  readonly creativeGraph?: CreativeGraph | null;
  readonly validationGraph?: ValidationGraph | null;
  readonly executionHistory?: ExecutionHistory | null;
  readonly memoryGraph?: MemoryGraph | null;
  readonly changeReason?: string;
  readonly supersedesSnapshotId?: string | null;
  readonly priorHypotheses?: readonly LearningHypothesis[];
  readonly priorPatterns?: readonly LearningPattern[];
};

export type LearningBrainOutput = {
  readonly graph: LearningBrainGraph;
  readonly structuredOutput: import("../../evidence/structured-output").BrainStructuredOutput;
  readonly outputRef: string;
  readonly snapshot: LearningSnapshot;
  readonly run: LearningRun;
};

export type LearningBrainPayload = {
  readonly performanceObservations?: readonly PerformanceObservation[];
  readonly customerFeedback?: readonly CustomerFeedbackObservation[];
  readonly experiments?: readonly LearningExperimentContext[];
  readonly approvalSignals?: readonly ApprovalLearningSignal[];
  readonly measurementContext?: MeasurementContext;
  readonly companyGraph?: CompanyGraph | null;
  readonly researchBrainGraph?: ResearchBrainGraph | null;
  readonly reasoningBrainGraph?: ReasoningBrainGraph | null;
  readonly marketingIntelligenceBrainGraph?: MarketingIntelligenceBrainGraph | null;
  readonly strategyBrainGraph?: StrategyBrainGraph | null;
  readonly planningBrainGraph?: PlanningBrainGraph | null;
  readonly creativeGraph?: CreativeGraph | null;
  readonly validationGraph?: ValidationGraph | null;
  readonly executionHistory?: ExecutionHistory | null;
  readonly memoryGraph?: MemoryGraph | null;
  readonly changeReason?: string;
  readonly supersedesSnapshotId?: string | null;
  readonly priorHypotheses?: readonly LearningHypothesis[];
  readonly priorPatterns?: readonly LearningPattern[];
};

export type { CompanyGraph, StrategyBrainGraph, PlanningBrainGraph, CreativeGraph, ValidationGraph, ExecutionHistory, MemoryGraph };
