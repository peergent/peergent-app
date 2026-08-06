/**
 * Planning Brain — canonical types.
 * Sprint 11.0. Outcome-first campaign execution planning — not a calendar or task list.
 */

export const PLANNING_LAYER_VERSION = "1.0.0";

export type PlanningConfidence = "low" | "medium" | "high";

export type PlanningNodeStatus =
  | "proposed"
  | "ready"
  | "waiting"
  | "blocked"
  | "in_progress"
  | "completed"
  | "deferred";

export type PlanningReadinessLevel = "ready" | "mostly_ready" | "waiting" | "blocked";

export type PlanningOwnerBrain = "marketing" | "brand" | "creative" | "execution" | "performance" | "customer";

export type PlanningPriority = "critical" | "high" | "medium" | "low";

/** A planning node — outcome-oriented, never a bare task. */
export type PlanningNode = {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly businessPurpose: string;
  readonly reason: string;
  readonly priority: PlanningPriority;
  readonly ownerBrain: PlanningOwnerBrain;
  readonly dependsOn: readonly string[];
  readonly blocks: readonly string[];
  readonly estimatedEffort: string;
  readonly requiredInputs: readonly string[];
  readonly producedOutputs: readonly string[];
  readonly approvalRequired: boolean;
  readonly reviewTrigger?: string;
  readonly status: PlanningNodeStatus;
  readonly confidence: PlanningConfidence;
};

export type PlanningObjective = {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly businessValue: string;
  readonly successCriteria: string;
  readonly linkedDecisionIds: readonly string[];
};

export type PlanningMilestone = {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly intent: string;
  readonly dependsOnNodeIds: readonly string[];
  readonly producesLearning: string;
};

/** Outcome-focused planning decision — distinct from Strategy Decision. */
export type PlanningDecision = {
  readonly id: string;
  readonly title: string;
  readonly summary: string;
  readonly reason: string;
  readonly whyNow: string;
  readonly whyNotEarlier: string;
  readonly whyNotLater: string;
  readonly businessValue: string;
  readonly dependsOn: readonly string[];
  readonly blocks: readonly string[];
  readonly delayRisk: string;
  readonly prerequisites: readonly string[];
  readonly expectedLearning: string;
  readonly reviewTrigger: string;
  readonly linkedNodeIds: readonly string[];
  readonly sourceDecisionId?: string;
};

export type PlanningDependency = {
  readonly id: string;
  readonly fromNodeId: string;
  readonly toNodeId: string;
  readonly relationship: "requires" | "enables" | "blocks";
  readonly reason: string;
};

export type PlanningRequirement = {
  readonly id: string;
  readonly title: string;
  readonly category:
    | "asset"
    | "knowledge"
    | "customer_input"
    | "integration"
    | "budget"
    | "approval"
    | "tracking";
  readonly reason: string;
  readonly blocksNodeIds: readonly string[];
  readonly status: "available" | "missing" | "partial";
};

export type PlanningRisk = {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly probability: PlanningConfidence;
  readonly impact: PlanningPriority;
  readonly mitigation: string;
  readonly fallback: string;
  readonly reviewTrigger: string;
  readonly linkedNodeIds: readonly string[];
};

export type PlanningReviewMoment = {
  readonly id: string;
  readonly title: string;
  readonly trigger: string;
  readonly purpose: string;
  readonly linkedObjectiveId?: string;
};

export type PlanningTimelineIntent = {
  readonly id: string;
  readonly phase: string;
  readonly intent: string;
  readonly nodeIds: readonly string[];
  readonly parallelWith?: readonly string[];
  readonly requiresCustomerInput: boolean;
  readonly happensAfterLaunch: boolean;
};

export type PlanningReadinessAssessment = {
  readonly level: PlanningReadinessLevel;
  readonly score: number;
  readonly summary: string;
  readonly blockers: readonly string[];
  readonly waitingFor: readonly string[];
  readonly checks: readonly {
    id: string;
    question: string;
    passed: boolean;
    explanation: string;
  }[];
};

export type PlanningDependencyAnalysis = {
  readonly dependencies: readonly PlanningDependency[];
  readonly criticalPath: readonly string[];
  readonly parallelOpportunities: readonly { nodeIds: readonly string[]; reason: string }[];
  readonly missingDependencies: readonly { nodeId: string; missingId: string; reason: string }[];
  readonly circularDependencies: readonly { cycle: readonly string[] }[];
  readonly unnecessaryDependencies: readonly { dependencyId: string; reason: string }[];
};

/** Complete Planning Brain output — bridge between strategy and execution. */
export type PlanningGraph = {
  readonly version: string;
  readonly organizationId: string;
  readonly campaignId?: string;
  readonly createdAt: string;
  readonly objectives: readonly PlanningObjective[];
  readonly milestones: readonly PlanningMilestone[];
  readonly planningDecisions: readonly PlanningDecision[];
  readonly executionStages: readonly PlanningNode[];
  readonly executionOrder: readonly string[];
  readonly dependencies: readonly PlanningDependency[];
  readonly blockedActivities: readonly string[];
  readonly parallelActivities: readonly { nodeIds: readonly string[]; reason: string }[];
  readonly criticalPath: readonly string[];
  readonly requiredAssets: readonly PlanningRequirement[];
  readonly requiredKnowledge: readonly PlanningRequirement[];
  readonly requiredCustomerInput: readonly PlanningRequirement[];
  readonly requiredIntegrations: readonly PlanningRequirement[];
  readonly reviewMoments: readonly PlanningReviewMoment[];
  readonly successCriteria: readonly string[];
  readonly readiness: PlanningReadinessAssessment;
  readonly risks: readonly PlanningRisk[];
  readonly unknowns: readonly string[];
  readonly estimatedTimeline: readonly PlanningTimelineIntent[];
  readonly dependencyAnalysis: PlanningDependencyAnalysis;
};

export type BuildPlanningGraphInput = {
  organizationId: string;
  campaignId?: string;
  locale?: "nl" | "en";
};

export type PlanningLayerInput = BuildPlanningGraphInput & {
  correlationId?: string;
};

export type PlanningLayerResult = {
  graph: PlanningGraph;
};
