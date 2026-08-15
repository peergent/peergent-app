import type { CampaignContext } from "@/lib/office/campaign/campaign-context";
import type { CompanyProfile } from "../company/profile";
import type { WebsiteSnapshot } from "../website/types";
import type { ResolvedBrainOutputs } from "../project-runtime/brain-output-resolver";
import type { BrainCapabilityId } from "../capabilities/registry";
import type { BrainStructuredOutput } from "../evidence/structured-output";
import type { ResearchGraph } from "../layers/research/types";
import type { ReasoningGraph } from "../layers/reasoning/types";
import type { MarketingIntelligenceGraph } from "../layers/marketing-intelligence/types";
import type { CapabilityKnowledgeContribution } from "./extract-capability-knowledge";
import type { InflightGraphKnowledgeContribution } from "./extract-inflight-graph-knowledge";

/** Canonical website knowledge semantics for Strategy readiness boundary. */
export type WebsiteKnowledgeSemantic =
  | "available"
  | "discovered"
  | "explicitly_skipped"
  | "not_applicable"
  | "unknown";

export type StrategyReadinessKnowledgeSource =
  | "explicit_campaign"
  | "explicit_skip"
  | "company_profile"
  | "persisted_graph"
  | "upstream_capability"
  | "inflight_graph"
  | "deterministic_inference";

/** @deprecated Use StrategyReadinessKnowledgeSource — kept for existing diagnostics. */
export type StrategyReadinessFieldSource =
  | "explicit_campaign"
  | "company_profile"
  | "company_graph"
  | "research_graph"
  | "marketing_intelligence_graph"
  | "website_snapshot"
  | "upstream_capability"
  | "inflight_graph"
  | "deterministic_inference"
  | "explicit_skip";

export type StrategyReadinessKnowledgeDimensions = {
  targetAudience: { value: string | null; source: StrategyReadinessKnowledgeSource | null };
  industry: { value: string | null; source: StrategyReadinessKnowledgeSource | null };
  uniqueValueProposition: { values: readonly string[]; source: StrategyReadinessKnowledgeSource | null };
  productOrService: { values: readonly string[]; source: StrategyReadinessKnowledgeSource | null };
  website: {
    url: string | null;
    semantic: WebsiteKnowledgeSemantic;
    source: StrategyReadinessKnowledgeSource | null;
  };
  competitors: {
    explicitlySkipped: boolean;
    hasEvidence: boolean;
    source: StrategyReadinessKnowledgeSource | null;
  };
};

/**
 * Unified Strategy readiness knowledge boundary — single canonical view across
 * campaign context, profile, persisted graphs, in-flight graphs, and capability outputs.
 */
export type StrategyReadinessKnowledgeBundle = {
  campaignContext: CampaignContext;
  companyProfile: CompanyProfile | null;
  companyWebsiteSnapshot: WebsiteSnapshot | null;
  resolvedGraphs: Partial<ResolvedBrainOutputs> | null;
  upstreamCapabilityOutputs: Partial<Record<BrainCapabilityId, BrainStructuredOutput>> | null;
  inflightGraphs: {
    researchGraph: ResearchGraph | null;
    reasoningGraph: ReasoningGraph | null;
    marketingIntelligenceGraph: MarketingIntelligenceGraph | null;
  };
  capabilityKnowledge: CapabilityKnowledgeContribution;
  inflightKnowledge: InflightGraphKnowledgeContribution;
  inferredTargetAudience: string | null;
};

/** Inputs for merging explicit campaign setup with Peergent-discovered knowledge. */
export type StrategyReadinessEnrichmentInput = {
  campaignContext: CampaignContext;
  companyProfile?: CompanyProfile | null;
  companyWebsiteSnapshot?: WebsiteSnapshot | null;
  resolvedGraphs?: Partial<ResolvedBrainOutputs> | null;
  upstreamCapabilityOutputs?: Partial<Record<BrainCapabilityId, BrainStructuredOutput>> | null;
  inflightGraphs?: {
    researchGraph?: ResearchGraph | null;
    reasoningGraph?: ReasoningGraph | null;
    marketingIntelligenceGraph?: MarketingIntelligenceGraph | null;
  } | null;
};

/** Request-scoped enrichment overlay — campaignContext comes from the run request. */
export type StrategyReadinessRequestEnrichment = Pick<
  StrategyReadinessEnrichmentInput,
  "resolvedGraphs" | "upstreamCapabilityOutputs" | "inflightGraphs"
>;

export type EffectiveStrategyReadinessBuildResult = {
  /** Campaign context enriched for readiness evaluation — explicit values preserved. */
  effectiveContext: CampaignContext;
  explicitFieldCount: number;
  derivedFieldCount: number;
  derivedFields: readonly string[];
  sourceKinds: readonly StrategyReadinessFieldSource[];
  knowledgeSources: StrategyReadinessKnowledgeDimensions;
  unresolved: readonly string[];
};

export type EffectiveStrategyReadinessEvaluation = {
  ready: boolean;
  machineReasonCodes: readonly string[];
  build: EffectiveStrategyReadinessBuildResult;
};

export type StrategyReadinessKnowledgeResolvedDiagnostic = {
  event: "strategy_readiness_knowledge_resolved";
  organizationId: string;
  projectId: string;
  episodeId?: string;
  targetAudienceSource: StrategyReadinessKnowledgeSource | null;
  industrySource: StrategyReadinessKnowledgeSource | null;
  uniqueValuePropositionSource: StrategyReadinessKnowledgeSource | null;
  productOrServiceSource: StrategyReadinessKnowledgeSource | null;
  websiteDecisionSource: StrategyReadinessKnowledgeSource | null;
  competitorDecisionSource: StrategyReadinessKnowledgeSource | null;
  unresolved: readonly string[];
  ready: boolean;
};

export type StrategyReadinessDiagnosticPayload = {
  event: "strategy_readiness_context_built";
  organizationId: string;
  projectId: string;
  episodeId?: string;
  explicitFieldCount: number;
  derivedFieldCount: number;
  missingRequirementCodes: readonly string[];
  websiteKnowledgeAvailable: boolean;
  competitorKnowledgeAvailable: boolean;
  sourceKinds: readonly StrategyReadinessFieldSource[];
  ready: boolean;
};
