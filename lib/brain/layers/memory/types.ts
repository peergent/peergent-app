/**
 * Memory Brain — canonical types.
 * PX-37. Organizational memory — not chat history, not a vector DB wrapper.
 * Never generate, validate, or optimize — only learn and remember.
 */

export const MEMORY_LAYER_VERSION = "1.0.0";

export type MemoryConfidence = "low" | "medium" | "high";

export type MemoryImportance = "low" | "medium" | "high" | "critical";

/** Independent memory domains — organizational knowledge categories. */
export type MemoryDomainId =
  | "business_memory"
  | "brand_memory"
  | "audience_memory"
  | "competitive_memory"
  | "creative_memory"
  | "validation_memory"
  | "execution_memory"
  | "performance_memory"
  | "learning_memory";

export type MemorySourceKind =
  | "research"
  | "marketing_intelligence"
  | "strategy"
  | "planning"
  | "creative"
  | "validation"
  | "approval"
  | "execution"
  | "performance"
  | "feedback"
  | "prior_memory";

export type MemoryEvidence = {
  readonly id: string;
  readonly source: MemorySourceKind;
  readonly refId: string;
  readonly summary: string;
  readonly capturedAt: string;
};

/** Quality gate — what Memory Brain decided to do with a candidate. */
export type MemoryQualityAction =
  | "store_permanent"
  | "store_temporary"
  | "merge"
  | "update"
  | "archive"
  | "forget"
  | "skip";

export type MemoryLifecycle = "active" | "archived" | "expired";

/** Every stored memory — full organizational knowledge record. */
export type MemoryRecord = {
  readonly id: string;
  readonly category: MemoryDomainId;
  readonly title: string;
  readonly description: string;
  readonly source: MemorySourceKind;
  readonly confidence: MemoryConfidence;
  readonly importance: MemoryImportance;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly expiresAt: string | null;
  readonly evidence: readonly MemoryEvidence[];
  readonly relatedCampaigns: readonly string[];
  readonly relatedDecisions: readonly string[];
  readonly relatedAssets: readonly string[];
  readonly tags: readonly string[];
  readonly lifecycle: MemoryLifecycle;
  readonly mergeKey: string;
};

export type MemoryDecision = {
  readonly id: string;
  readonly action: MemoryQualityAction;
  readonly memoryId: string;
  readonly targetMemoryId: string | null;
  readonly reason: string;
  readonly category: MemoryDomainId;
};

export type MemoryRelationKind =
  | "supports"
  | "contradicts"
  | "derived_from"
  | "related_to"
  | "supersedes";

export type MemoryRelation = {
  readonly id: string;
  readonly fromMemoryId: string;
  readonly toMemoryId: string;
  readonly kind: MemoryRelationKind;
  readonly reason: string;
};

/** Graph layer node — references memories in a domain layer. */
export type MemoryNode = {
  readonly id: string;
  readonly domain: MemoryDomainId;
  readonly label: string;
  readonly memoryIds: readonly string[];
  readonly layerOrder: number;
};

export type MemoryEvolutionEntry = {
  readonly id: string;
  readonly memoryId: string;
  readonly action: MemoryQualityAction;
  readonly previousTitle: string | null;
  readonly newTitle: string;
  readonly reason: string;
  readonly at: string;
};

export type MemorySummary = {
  readonly storedCount: number;
  readonly mergedCount: number;
  readonly skippedCount: number;
  readonly archivedCount: number;
  readonly forgottenCount: number;
  readonly totalActiveMemories: number;
  readonly confidence: MemoryConfidence;
  readonly reasoningSummary: string;
};

/** Snapshot of organizational memory at a point in time. */
export type MemorySnapshot = {
  readonly id: string;
  readonly organizationId: string;
  readonly campaignId: string | null;
  readonly episodeId: string | null;
  readonly createdAt: string;
  readonly memoryCount: number;
  readonly graphRef: string;
};

/** Complete Memory Brain output — persisted organizational knowledge graph. */
export type MemoryGraph = {
  readonly version: string;
  readonly organizationId: string;
  readonly campaignId: string;
  readonly episodeId?: string;
  readonly createdAt: string;
  readonly validationGraphRef: string | null;
  readonly creativeGraphRef: string | null;
  readonly nodes: readonly MemoryNode[];
  readonly relations: readonly MemoryRelation[];
  readonly memories: readonly MemoryRecord[];
  readonly decisions: readonly MemoryDecision[];
  readonly evolution: readonly MemoryEvolutionEntry[];
  readonly summary: MemorySummary;
  readonly confidence: MemoryConfidence;
};

export type MemoryQueryScope =
  | "business"
  | "brand"
  | "campaign"
  | "creative"
  | "performance"
  | "learning"
  | "context"
  | "recent"
  | "relevant";

export type MemoryQuery = {
  readonly scope: MemoryQueryScope;
  readonly organizationId: string;
  readonly campaignId?: string;
  readonly categories?: readonly MemoryDomainId[];
  readonly tags?: readonly string[];
  readonly minConfidence?: MemoryConfidence;
  readonly limit?: number;
};

export type MemoryQueryResult = {
  readonly query: MemoryQuery;
  readonly memories: readonly MemoryRecord[];
  readonly retrievedAt: string;
};

/** Input — assembled from Project Engine context + upstream brains. */
export type MemoryBrainInput = {
  readonly organizationId: string;
  readonly projectId: string;
  readonly episodeId?: string;
  readonly locale?: "nl" | "en";
  readonly creativeGraph?: import("../creative/types").CreativeGraph | null;
  readonly validationGraph?: import("../validation/types").ValidationGraph | null;
  readonly strategyGraph?: import("../../strategy/strategy-graph").StrategyGraph | null;
  readonly planningGraph?: import("../planning/types").PlanningGraph | null;
  readonly decisionCollection?: import("../../decision/decision-types").DecisionCollection | null;
  readonly brandGraph?: import("../brand/types").BrandGraph | null;
  readonly marketingIntelligence?: import("../marketing-intelligence/types").MarketingIntelligenceGraph | null;
  readonly researchGraph?: import("../research/types").ResearchGraph | null;
  readonly reasoningGraph?: import("../reasoning/types").ReasoningGraph | null;
  readonly campaignContext?: import("@/lib/office/campaign/campaign-context").CampaignContext | null;
  readonly approvalGranted?: boolean;
  readonly approvalDecisionIds?: readonly string[];
  readonly priorMemories?: readonly MemoryRecord[];
  readonly performanceMetrics?: readonly MemoryPerformanceMetric[];
  readonly customerFeedback?: readonly string[];
  readonly correlationId?: string;
  /** PX-47 — Learning Brain proposals consumed by Memory quality gate */
  readonly learningProposals?: readonly import("../learning/brain-types").MemoryWriteProposal[];
};

export type MemoryPerformanceMetric = {
  readonly channel: string;
  readonly metric: "ctr" | "roas" | "conversion" | "engagement";
  readonly value: number;
  readonly period: string;
};

export type MemoryBrainOutput = {
  readonly graph: MemoryGraph;
  readonly structuredOutput: import("../../evidence/structured-output").BrainStructuredOutput;
  readonly outputRef: string;
};

export type MemoryBrainPayload = Omit<
  MemoryBrainInput,
  "organizationId" | "projectId" | "episodeId" | "locale"
>;
