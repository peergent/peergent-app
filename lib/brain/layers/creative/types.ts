/**
 * Creative Brain — canonical types.
 * PX-35. Senior marketing strategist that thinks before creating.
 * Never publish, execute, or optimize — only create structured direction.
 */

import type { CreativeChannelId, CreativeDeliverableType } from "../../llm/creative-generation-contract";

export const CREATIVE_LAYER_VERSION = "1.0.0";

export type CreativeConfidence = "low" | "medium" | "high";

/** Seven thinking phases — never jump directly to writing. */
export type CreativeThinkingPhase =
  | "understand_business"
  | "understand_audience"
  | "find_positioning"
  | "generate_campaign_concepts"
  | "generate_messaging"
  | "generate_channel_strategy"
  | "generate_deliverables";

export type CreativePhaseRecord = {
  readonly phase: CreativeThinkingPhase;
  readonly completedAt: string;
  readonly summary: string;
  readonly confidence: CreativeConfidence;
  readonly insightCount: number;
};

/** Selected creative direction after positioning phase. */
export type CreativeDirection = {
  readonly id: string;
  readonly name: string;
  readonly angle: string;
  readonly emotion: string;
  readonly rationale: string;
  readonly selected: boolean;
};

/** Campaign concept — not final copy. */
export type CreativeCampaign = {
  readonly id: string;
  readonly name: string;
  readonly objective: string;
  readonly targetAudience: string;
  readonly keyMessage: string;
  readonly emotionalTrigger: string;
  readonly businessValue: string;
  readonly estimatedImpact: string;
  readonly confidence: CreativeConfidence;
  readonly selected: boolean;
};

export type CreativeObjection = {
  readonly objection: string;
  readonly response: string;
};

/** Messaging framework — structured, reusable. */
export type CreativeMessaging = {
  readonly id: string;
  readonly campaignId: string;
  readonly headline: string;
  readonly supportingMessage: string;
  readonly cta: string;
  readonly proof: readonly string[];
  readonly objections: readonly CreativeObjection[];
  readonly trustBuilders: readonly string[];
};

/** Per-channel content strategy. */
export type CreativeChannelPlan = {
  readonly channel: CreativeChannelId;
  readonly why: string;
  readonly goal: string;
  readonly audience: string;
  readonly priority: "critical" | "high" | "medium" | "low";
  readonly organic: boolean;
  readonly paid: boolean;
};

/** Creative deliverable specification — planning record; see contentArtifacts for publication copy. */
export type CreativeDeliverable = {
  readonly id: string;
  readonly type: CreativeDeliverableType;
  readonly channel: CreativeChannelId;
  readonly headline: string;
  readonly hook: string;
  readonly bodyOutline: string;
  readonly cta: string;
  readonly headlineVariations: readonly string[];
  readonly ctaVariations: readonly string[];
  readonly hookVariations: readonly string[];
  readonly rationale: string;
  readonly reviewStatus: "planned" | "draft" | "needs_review";
};

/** Creative decision with selected direction and discarded alternatives. */
export type CreativeDecision = {
  readonly id: string;
  readonly title: string;
  readonly summary: string;
  readonly reason: string;
  readonly whyNow: string;
  readonly businessImpact: string;
  readonly confidence: CreativeConfidence;
  readonly selectedDirection: string;
  readonly discardedAlternatives: readonly { alternative: string; reason: string }[];
};

export type CreativeDiscardedIdea = {
  readonly idea: string;
  readonly reason: string;
  readonly phase: CreativeThinkingPhase;
};

export type CreativeReasoningStep = {
  readonly step: string;
  readonly insight: string;
  readonly phase: CreativeThinkingPhase;
};

/** Complete Creative Brain output — handover to Validation Layer (future). */
export type CreativeGraph = {
  readonly version: string;
  readonly organizationId: string;
  readonly campaignId: string;
  readonly episodeId?: string;
  readonly createdAt: string;
  readonly phases: readonly CreativePhaseRecord[];
  readonly direction: CreativeDirection | null;
  readonly campaigns: readonly CreativeCampaign[];
  readonly messaging: readonly CreativeMessaging[];
  readonly channelPlans: readonly CreativeChannelPlan[];
  readonly deliverables: readonly CreativeDeliverable[];
  readonly decisions: readonly CreativeDecision[];
  readonly discardedIdeas: readonly CreativeDiscardedIdea[];
  readonly reasoning: readonly CreativeReasoningStep[];
  readonly confidence: CreativeConfidence;
  readonly estimatedBusinessImpact: string;
  /** PX-57 — materialized publication-ready content derived from specs + messaging. */
  readonly contentArtifacts?: readonly import("./materialize-creative-content-artifacts").CreativeContentArtifact[];
};

/** Input to Creative Brain — assembled from Project Engine context + upstream brains. */
export type CreativeBrainInput = {
  readonly organizationId: string;
  readonly projectId: string;
  readonly episodeId?: string;
  readonly locale?: "nl" | "en";
  readonly strategyGraph?: import("../../strategy/strategy-graph").StrategyGraph | null;
  readonly planningGraph?: import("../planning/types").PlanningGraph | null;
  readonly decisionCollection?: import("../../decision/decision-types").DecisionCollection | null;
  readonly brandGraph?: import("../brand/types").BrandGraph | null;
  readonly marketingIntelligence?: import("../marketing-intelligence/types").MarketingIntelligenceGraph | null;
  readonly researchGraph?: import("../research/types").ResearchGraph | null;
  readonly reasoningGraph?: import("../reasoning/types").ReasoningGraph | null;
  readonly campaignContext?: import("@/lib/office/campaign/campaign-context").CampaignContext | null;
  readonly companySummary?: string;
  readonly audienceSummary?: string;
  readonly correlationId?: string;
};

/** Full Creative Brain output — graph + structured brain output handle. */
export type CreativeBrainOutput = {
  readonly graph: CreativeGraph;
  readonly structuredOutput: import("../../evidence/structured-output").BrainStructuredOutput;
  readonly outputRef: string;
};
