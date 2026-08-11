/**
 * Strategy Brain — PX-44 canonical types.
 * Decision layer — chooses direction; never plans, creates, or executes.
 */

import type { CompanyGraph } from "../company/types";
import type { MarketingIntelligenceBrainGraph, MarketingStrategyInput } from "../marketing-intelligence/brain-types";
import type { ReasoningBrainGraph } from "../reasoning/brain-types";
import type { ResearchBrainGraph } from "../research/brain-types";

export const STRATEGY_BRAIN_VERSION = "1.0.0";

export type StrategyConfidence = "low" | "medium" | "high";

export type StrategyPriority = "high" | "medium" | "low";

export type StrategyImportance = "low" | "medium" | "high" | "critical";

export type StrategicDecisionType =
  | "audience"
  | "positioning"
  | "channel"
  | "budget"
  | "funnel"
  | "offer"
  | "messaging"
  | "campaign_objective"
  | "measurement"
  | "priority"
  | "defer"
  | "stop";

export type OpportunitySelectionStatus = "selected" | "rejected" | "deferred";

export type AudiencePriority = "primary" | "secondary" | "deprioritized" | "future";

export type StrategicEvidenceRef = {
  readonly id: string;
  readonly source: "company" | "research" | "reasoning" | "marketing_intelligence" | "memory";
  readonly refId: string;
  readonly summary: string;
  readonly confidence: StrategyConfidence;
};

export type StrategicProblem = {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly businessImpact: StrategyImportance;
  readonly marketingImpact: string;
  readonly evidenceIds: readonly string[];
  readonly confidence: StrategyConfidence;
  readonly urgency: StrategyPriority;
  readonly dependencies: readonly string[];
};

export type OpportunitySelection = {
  readonly opportunityId: string;
  readonly title: string;
  readonly status: OpportunitySelectionStatus;
  readonly reason: string;
  readonly expectedImpact: string;
  readonly confidence: StrategyConfidence;
  readonly resourceRequirement: StrategyPriority;
  readonly dependency: readonly string[];
  readonly timingRelevance: string;
};

export type AudienceStrategy = {
  readonly segment: string;
  readonly priority: AudiencePriority;
  readonly whySelected: string;
  readonly businessValue: string;
  readonly marketingFit: string;
  readonly intentLevel: StrategyPriority;
  readonly messageImplication: string;
  readonly channelImplication: string;
  readonly evidenceIds: readonly string[];
  readonly confidence: StrategyConfidence;
};

export type PositioningStrategy = {
  readonly positioningStatement: string;
  readonly strategicAngle: string;
  readonly whyThisAngle: string;
  readonly proofRequirements: readonly string[];
  readonly differentiation: readonly string[];
  readonly risks: readonly string[];
  readonly rejectedAngles: readonly string[];
  readonly confidence: StrategyConfidence;
  readonly evidenceIds: readonly string[];
};

export type ChannelStrategy = {
  readonly channel: string;
  readonly role: string;
  readonly priority: StrategyPriority;
  readonly selected: boolean;
  readonly objective: string;
  readonly funnelStage: string;
  readonly audience: readonly string[];
  readonly paidOrOrganic: "paid" | "organic" | "both" | "none";
  readonly investmentLevel: StrategyPriority;
  readonly measurementApproach: string;
  readonly reason: string;
  readonly dependencies: readonly string[];
  readonly risks: readonly string[];
  readonly confidence: StrategyConfidence;
  readonly evidenceIds: readonly string[];
};

export type BudgetAllocation = {
  readonly channelOrCategory: string;
  readonly percentageMin: number | null;
  readonly percentageMax: number | null;
  readonly rationale: string;
  readonly confidence: StrategyConfidence;
};

export type BudgetStrategy = {
  readonly totalBudget: number | null;
  readonly currency: string | null;
  readonly budgetRequired: boolean;
  readonly allocation: readonly BudgetAllocation[];
  readonly reserve: string | null;
  readonly testBudget: string | null;
  readonly scalingRules: readonly string[];
  readonly constraints: readonly string[];
  readonly confidence: StrategyConfidence;
};

export type FunnelStrategy = {
  readonly primaryFunnelModel: string;
  readonly stageObjectives: readonly { stage: string; objective: string }[];
  readonly channelRoles: readonly { channel: string; role: string }[];
  readonly contentRequirements: readonly string[];
  readonly conversionPoints: readonly string[];
  readonly handoffRequirements: readonly string[];
  readonly measurementPoints: readonly string[];
  readonly gapsToSolve: readonly string[];
  readonly confidence: StrategyConfidence;
};

export type OfferStrategyDirection = {
  readonly offerDirection: string;
  readonly why: string;
  readonly proofNeeded: readonly string[];
  readonly riskReversalNeeded: readonly string[];
  readonly urgencyApproach: string;
  readonly ctaType: string;
  readonly confidence: StrategyConfidence;
};

export type MessagingStrategyDirection = {
  readonly primaryMessageTerritory: string;
  readonly secondaryMessageTerritories: readonly string[];
  readonly proofThemes: readonly string[];
  readonly objectionThemes: readonly string[];
  readonly emotionalDirection: string;
  readonly rationalDirection: string;
  readonly messagesToAvoid: readonly string[];
  readonly saturatedClaimsToAvoid: readonly string[];
  readonly confidence: StrategyConfidence;
};

export type StrategicKpi = {
  readonly name: string;
  readonly category: string;
  readonly purpose: string;
  readonly primaryOrSecondary: "primary" | "secondary";
  readonly targetDirection: "increase" | "decrease" | "maintain" | "monitor";
  readonly baseline: string | null;
  readonly target: string | null;
  readonly measurementSource: string;
  readonly reviewCadence: string;
  readonly decisionThreshold: string | null;
};

export type CampaignObjective = {
  readonly id: string;
  readonly objective: string;
  readonly audience: readonly string[];
  readonly channelRole: string;
  readonly businessOutcome: string;
  readonly successMetric: string;
  readonly priority: StrategyPriority;
  readonly timeHorizon: string;
  readonly dependencies: readonly string[];
  readonly confidence: StrategyConfidence;
};

export type StrategicTradeoff = {
  readonly id: string;
  readonly decision: string;
  readonly benefit: string;
  readonly cost: string;
  readonly risk: string;
  readonly reason: string;
  readonly alternative: string;
};

export type RejectedAlternative = {
  readonly id: string;
  readonly alternative: string;
  readonly reason: string;
  readonly evidenceIds: readonly string[];
  readonly confidence: StrategyConfidence;
};

export type StrategicAssumption = {
  readonly id: string;
  readonly statement: string;
  readonly confidence: StrategyConfidence;
  readonly evidenceIds: readonly string[];
  readonly riskIfWrong: string;
  readonly validationMethod: string;
  readonly reviewTrigger: string;
};

export type StrategicRisk = {
  readonly id: string;
  readonly description: string;
  readonly likelihood: StrategyPriority;
  readonly severity: StrategyImportance;
  readonly impact: string;
  readonly mitigationDirection: string;
  readonly trigger: string;
  readonly owner: string;
  readonly confidence: StrategyConfidence;
};

export type StrategicDecision = {
  readonly id: string;
  readonly decisionType: StrategicDecisionType;
  readonly title: string;
  readonly decision: string;
  readonly reason: string;
  readonly supportingEvidence: readonly string[];
  readonly alternativesConsidered: readonly string[];
  readonly tradeoffs: readonly string[];
  readonly expectedImpact: string;
  readonly confidence: StrategyConfidence;
  readonly dependencies: readonly string[];
  readonly reversible: boolean;
  readonly reviewTrigger: string;
  readonly createdAt: string;
};

export type StrategicPriority = {
  readonly id: string;
  readonly subject: string;
  readonly priority: StrategyPriority;
  readonly rationale: string;
  readonly decisionId: string | null;
};

export type StrategyRationale = {
  readonly headline: string;
  readonly evidenceSummary: string;
  readonly reasoningSummary: string;
  readonly marketingIntelligenceSummary: string;
  readonly decisionSummary: string;
  readonly evidenceIds: readonly string[];
};

export type StrategyEscalationKind =
  | "budget_missing"
  | "goal_conflict"
  | "audience_conflict"
  | "customer_confirmation_required"
  | "insufficient_evidence"
  | "legal_constraint";

export type StrategyEscalation = {
  readonly id: string;
  readonly kind: StrategyEscalationKind;
  readonly reason: string;
  readonly requiredInput: string;
  readonly blocking: boolean;
  readonly recommendedQuestion: string;
};

export type StrategyApprovalRequirement = {
  readonly requiresApproval: boolean;
  readonly approvalKind: string | null;
  readonly approvalReason: string | null;
  readonly decisionIds: readonly string[];
};

export type PlanningStrategyInput = {
  readonly selectedObjectives: readonly string[];
  readonly selectedAudiences: readonly string[];
  readonly selectedChannels: readonly string[];
  readonly positioningDirection: string;
  readonly messagingDirection: string;
  readonly funnelStrategy: string;
  readonly offerDirection: string;
  readonly budgetStrategy: string;
  readonly kpis: readonly string[];
  readonly priorities: readonly string[];
  readonly constraints: readonly string[];
  readonly dependencies: readonly string[];
  readonly risks: readonly string[];
  readonly assumptions: readonly string[];
  readonly approvalRequirements: readonly string[];
  readonly timeHorizon: string;
  readonly confidence: StrategyConfidence;
};

export type StrategyGraphSummary = {
  readonly headline: string;
  readonly decisionCount: number;
  readonly selectedOpportunityCount: number;
  readonly rejectedAlternativeCount: number;
  readonly escalationCount: number;
};

/** Layered Strategy Graph — auditable strategic choices. */
export type StrategyBrainGraph = {
  readonly version: string;
  readonly organizationId: string;
  readonly projectId?: string;
  readonly campaignId?: string;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly businessObjective: string;
  readonly strategicContext: readonly string[];
  readonly companyGraphVersion: string;
  readonly researchGraphVersion: string;
  readonly reasoningGraphVersion: string;
  readonly marketingIntelligenceVersion: string;
  readonly evidence: readonly StrategicEvidenceRef[];
  readonly strategicProblems: readonly StrategicProblem[];
  readonly opportunitySelections: readonly OpportunitySelection[];
  readonly audienceStrategy: readonly AudienceStrategy[];
  readonly positioningStrategy: PositioningStrategy;
  readonly channelStrategy: readonly ChannelStrategy[];
  readonly funnelStrategy: FunnelStrategy;
  readonly offerStrategyDirection: OfferStrategyDirection;
  readonly messagingStrategyDirection: MessagingStrategyDirection;
  readonly budgetStrategy: BudgetStrategy;
  readonly kpiFramework: readonly StrategicKpi[];
  readonly campaignObjectives: readonly CampaignObjective[];
  readonly strategicTradeoffs: readonly StrategicTradeoff[];
  readonly strategicAssumptions: readonly StrategicAssumption[];
  readonly strategicRisks: readonly StrategicRisk[];
  readonly strategicDecisions: readonly StrategicDecision[];
  readonly strategicPriorities: readonly StrategicPriority[];
  readonly selectedStrategy: string;
  readonly rejectedAlternatives: readonly RejectedAlternative[];
  readonly strategyRationale: StrategyRationale;
  readonly planningInputs: PlanningStrategyInput;
  readonly escalations: readonly StrategyEscalation[];
  readonly approval: StrategyApprovalRequirement;
  readonly summary: StrategyGraphSummary;
  readonly confidence: StrategyConfidence;
};

export type StrategySnapshot = {
  readonly id: string;
  readonly organizationId: string;
  readonly projectId?: string;
  readonly campaignId?: string;
  readonly graph: StrategyBrainGraph;
  readonly outputRef: string;
  readonly storedAt: string;
};

export type StrategyRun = {
  readonly id: string;
  readonly organizationId: string;
  readonly projectId?: string;
  readonly campaignId?: string;
  readonly startedAt: string;
  readonly completedAt: string | null;
  readonly status: "running" | "completed" | "blocked" | "failed";
  readonly snapshotId: string | null;
};

export type StrategyHistoryEntry = {
  readonly runId: string;
  readonly snapshotId: string;
  readonly version: number;
  readonly storedAt: string;
  readonly changeReason: string;
};

export type StrategyHistory = {
  readonly organizationId: string;
  readonly projectId?: string;
  readonly entries: readonly StrategyHistoryEntry[];
};

export type StrategicDecisionRecord = StrategicDecision & {
  readonly snapshotId: string;
  readonly organizationId: string;
};

export type StrategyBrainInput = {
  readonly organizationId: string;
  readonly projectId?: string;
  readonly episodeId?: string;
  readonly campaignId?: string;
  readonly locale?: "nl" | "en";
  readonly companyGraph: CompanyGraph;
  readonly researchGraph: ResearchBrainGraph;
  readonly reasoningGraph: ReasoningBrainGraph;
  readonly marketingIntelligenceGraph: MarketingIntelligenceBrainGraph;
  readonly marketingStrategyInput?: MarketingStrategyInput;
  readonly memoryGraph?: import("../memory/types").MemoryGraph | null;
  readonly projectObjective?: string;
  readonly businessGoals?: readonly string[];
  readonly marketingObjectives?: readonly string[];
  readonly availableBudget?: { amount: number; currency: string } | null;
  readonly timeHorizon?: string;
  readonly constraints?: readonly string[];
  readonly customerPriorities?: readonly string[];
  readonly approvalPolicy?: "always" | "major_only" | "none";
};

export type StrategyBrainOutput = {
  readonly graph: StrategyBrainGraph;
  readonly structuredOutput: import("../../evidence/structured-output").BrainStructuredOutput;
  readonly outputRef: string;
  readonly snapshot: StrategySnapshot;
  readonly run: StrategyRun;
};

export type StrategyBrainPayload = {
  readonly companyGraph?: CompanyGraph | null;
  readonly researchBrainGraph?: ResearchBrainGraph | null;
  readonly reasoningBrainGraph?: ReasoningBrainGraph | null;
  readonly marketingIntelligenceBrainGraph?: MarketingIntelligenceBrainGraph | null;
  readonly marketingStrategyInput?: MarketingStrategyInput | null;
  readonly memoryGraph?: import("../memory/types").MemoryGraph | null;
  readonly projectObjective?: string;
  readonly businessGoals?: readonly string[];
  readonly marketingObjectives?: readonly string[];
  readonly availableBudget?: { amount: number; currency: string } | null;
  readonly timeHorizon?: string;
  readonly constraints?: readonly string[];
  readonly customerPriorities?: readonly string[];
  readonly approvalPolicy?: "always" | "major_only" | "none";
};

export function emptyPositioningStrategy(): PositioningStrategy {
  return {
    positioningStatement: "",
    strategicAngle: "",
    whyThisAngle: "",
    proofRequirements: [],
    differentiation: [],
    risks: [],
    rejectedAngles: [],
    confidence: "low",
    evidenceIds: [],
  };
}

export function emptyStrategyBrainGraph(input: {
  organizationId: string;
  projectId?: string;
  campaignId?: string;
  businessObjective: string;
  companyGraphVersion: string;
  researchGraphVersion: string;
  reasoningGraphVersion: string;
  marketingIntelligenceVersion: string;
  createdAt?: string;
}): StrategyBrainGraph {
  const now = input.createdAt ?? new Date().toISOString();
  return {
    version: STRATEGY_BRAIN_VERSION,
    organizationId: input.organizationId,
    projectId: input.projectId,
    campaignId: input.campaignId,
    createdAt: now,
    updatedAt: now,
    businessObjective: input.businessObjective,
    strategicContext: [],
    companyGraphVersion: input.companyGraphVersion,
    researchGraphVersion: input.researchGraphVersion,
    reasoningGraphVersion: input.reasoningGraphVersion,
    marketingIntelligenceVersion: input.marketingIntelligenceVersion,
    evidence: [],
    strategicProblems: [],
    opportunitySelections: [],
    audienceStrategy: [],
    positioningStrategy: emptyPositioningStrategy(),
    channelStrategy: [],
    funnelStrategy: {
      primaryFunnelModel: "",
      stageObjectives: [],
      channelRoles: [],
      contentRequirements: [],
      conversionPoints: [],
      handoffRequirements: [],
      measurementPoints: [],
      gapsToSolve: [],
      confidence: "low",
    },
    offerStrategyDirection: {
      offerDirection: "",
      why: "",
      proofNeeded: [],
      riskReversalNeeded: [],
      urgencyApproach: "",
      ctaType: "",
      confidence: "low",
    },
    messagingStrategyDirection: {
      primaryMessageTerritory: "",
      secondaryMessageTerritories: [],
      proofThemes: [],
      objectionThemes: [],
      emotionalDirection: "",
      rationalDirection: "",
      messagesToAvoid: [],
      saturatedClaimsToAvoid: [],
      confidence: "low",
    },
    budgetStrategy: {
      totalBudget: null,
      currency: null,
      budgetRequired: true,
      allocation: [],
      reserve: null,
      testBudget: null,
      scalingRules: [],
      constraints: [],
      confidence: "low",
    },
    kpiFramework: [],
    campaignObjectives: [],
    strategicTradeoffs: [],
    strategicAssumptions: [],
    strategicRisks: [],
    strategicDecisions: [],
    strategicPriorities: [],
    selectedStrategy: "",
    rejectedAlternatives: [],
    strategyRationale: {
      headline: "",
      evidenceSummary: "",
      reasoningSummary: "",
      marketingIntelligenceSummary: "",
      decisionSummary: "",
      evidenceIds: [],
    },
    planningInputs: {
      selectedObjectives: [],
      selectedAudiences: [],
      selectedChannels: [],
      positioningDirection: "",
      messagingDirection: "",
      funnelStrategy: "",
      offerDirection: "",
      budgetStrategy: "",
      kpis: [],
      priorities: [],
      constraints: [],
      dependencies: [],
      risks: [],
      assumptions: [],
      approvalRequirements: [],
      timeHorizon: "",
      confidence: "low",
    },
    escalations: [],
    approval: { requiresApproval: false, approvalKind: null, approvalReason: null, decisionIds: [] },
    summary: {
      headline: "Strategy not yet executed",
      decisionCount: 0,
      selectedOpportunityCount: 0,
      rejectedAlternativeCount: 0,
      escalationCount: 0,
    },
    confidence: "low",
  };
}

export type { CompanyGraph, ResearchBrainGraph, ReasoningBrainGraph, MarketingIntelligenceBrainGraph, MarketingStrategyInput };
