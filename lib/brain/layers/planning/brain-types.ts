/**
 * Planning Brain — PX-45 canonical types.
 * Operational planning layer — never re-decides strategy.
 */

import type { CompanyGraph } from "../company/types";
import type {
  AudienceStrategy,
  BudgetStrategy,
  CampaignObjective,
  ChannelStrategy,
  FunnelStrategy,
  MessagingStrategyDirection,
  OfferStrategyDirection,
  PlanningStrategyInput,
  PositioningStrategy,
  StrategicAssumption,
  StrategicDecision,
  StrategicRisk,
  StrategicTradeoff,
  StrategyApprovalRequirement,
  StrategyBrainGraph,
} from "../strategy/brain-types";

export const PLANNING_BRAIN_VERSION = "1.0.0";

export type PlanningConfidence = "low" | "medium" | "high";

export type PlanningPriority = "high" | "medium" | "low";

export type PlanningEntityStatus =
  | "NOT_STARTED"
  | "READY"
  | "BLOCKED"
  | "IN_PROGRESS"
  | "WAITING_FOR_APPROVAL"
  | "COMPLETED"
  | "CANCELLED";

export type PlanningDependencyType =
  | "requires"
  | "blocks"
  | "unblocks"
  | "depends_on"
  | "must_follow"
  | "must_precede"
  | "approval_dependency"
  | "data_dependency"
  | "creative_dependency"
  | "execution_dependency";

export type ScheduleWindowType = "fixed" | "flexible" | "relative" | "unknown";

export type AssignedBrain =
  | "research"
  | "creative"
  | "validation"
  | "execution"
  | "memory"
  | "customer";

export type PlanningObjective = {
  readonly id: string;
  readonly strategyObjectiveId: string;
  readonly objective: string;
  readonly businessOutcome: string;
  readonly successMetric: string;
  readonly priority: PlanningPriority;
  readonly timeHorizon: string;
  readonly dependencies: readonly string[];
  readonly constraints: readonly string[];
  readonly confidence: PlanningConfidence;
};

export type CampaignPlan = {
  readonly id: string;
  readonly name: string;
  readonly objective: string;
  readonly audience: readonly string[];
  readonly channelRoles: readonly string[];
  readonly businessOutcome: string;
  readonly successMetrics: readonly string[];
  readonly startWindow: string | null;
  readonly endWindow: string | null;
  readonly status: PlanningEntityStatus;
  readonly priority: PlanningPriority;
  readonly dependencies: readonly string[];
  readonly approvalRequirements: readonly string[];
  readonly milestoneIds: readonly string[];
  readonly workstreamIds: readonly string[];
  readonly deliverableIds: readonly string[];
  readonly creativeBriefRefs: readonly string[];
  readonly executionPreparationRefs: readonly string[];
  readonly confidence: PlanningConfidence;
};

export type Workstream = {
  readonly id: string;
  readonly campaignId: string;
  readonly name: string;
  readonly purpose: string;
  readonly ownerType: AssignedBrain | "planning";
  readonly priority: PlanningPriority;
  readonly dependencies: readonly string[];
  readonly milestoneIds: readonly string[];
  readonly workPackageIds: readonly string[];
  readonly status: PlanningEntityStatus;
  readonly startWindow: string | null;
  readonly endWindow: string | null;
};

export type WorkPackage = {
  readonly id: string;
  readonly workstreamId: string;
  readonly title: string;
  readonly purpose: string;
  readonly inputs: readonly string[];
  readonly expectedOutputs: readonly string[];
  readonly dependencies: readonly string[];
  readonly blockingDependencies: readonly string[];
  readonly estimatedComplexity: PlanningPriority;
  readonly approvalRequired: boolean;
  readonly status: PlanningEntityStatus;
  readonly assignedBrain: AssignedBrain | "planning";
  readonly handoffTarget: AssignedBrain | null;
};

export type PlanningBrainMilestone = {
  readonly id: string;
  readonly campaignId: string;
  readonly title: string;
  readonly description: string;
  readonly entryCriteria: readonly string[];
  readonly exitCriteria: readonly string[];
  readonly dependencies: readonly string[];
  readonly targetWindow: string | null;
  readonly status: PlanningEntityStatus;
  readonly blocking: boolean;
};

export type ScheduleWindow = {
  readonly id: string;
  readonly type: ScheduleWindowType;
  readonly start: string | null;
  readonly end: string | null;
  readonly relativeStart: string | null;
  readonly relativeEnd: string | null;
  readonly timezone: string | null;
  readonly flexibility: string;
  readonly reason: string;
  readonly source: string;
  readonly confidence: PlanningConfidence;
};

export type PlanningBrainDependency = {
  readonly id: string;
  readonly type: PlanningDependencyType;
  readonly fromRef: string;
  readonly toRef: string;
  readonly reason: string;
  readonly blocking: boolean;
};

export type PlannedDeliverable = {
  readonly id: string;
  readonly campaignId: string;
  readonly type: string;
  readonly channel: string;
  readonly objective: string;
  readonly audience: readonly string[];
  readonly purpose: string;
  readonly strategyRefs: readonly string[];
  readonly requiredInputs: readonly string[];
  readonly expectedOutputType: string;
  readonly priority: PlanningPriority;
  readonly approvalRequired: boolean;
  readonly validationRequired: boolean;
  readonly executionRequired: boolean;
  readonly dependencies: readonly string[];
  readonly creativeBriefInputId: string | null;
  readonly status: PlanningEntityStatus;
};

export type CreativeBriefInput = {
  readonly id: string;
  readonly campaignObjective: string;
  readonly businessOutcome: string;
  readonly targetAudience: readonly string[];
  readonly channel: string;
  readonly channelRole: string;
  readonly funnelStage: string;
  readonly positioningDirection: string;
  readonly messagingDirection: string;
  readonly offerDirection: string;
  readonly proofRequirements: readonly string[];
  readonly objections: readonly string[];
  readonly ctaType: string;
  readonly brandConstraints: readonly string[];
  readonly contentRequirements: readonly string[];
  readonly deliverableType: string;
  readonly successMetric: string;
  readonly constraints: readonly string[];
  readonly deadlineWindow: string | null;
  readonly strategyDecisionRefs: readonly string[];
  readonly planningRefs: readonly string[];
  readonly confidence: PlanningConfidence;
};

export type ApprovalGate = {
  readonly id: string;
  readonly kind: string;
  readonly reason: string;
  readonly requiredBefore: string;
  readonly relatedWorkPackageIds: readonly string[];
  readonly relatedDeliverableIds: readonly string[];
  readonly blocking: boolean;
  readonly status: PlanningEntityStatus;
  readonly decisionRefs: readonly string[];
};

export type ReviewCheckpoint = {
  readonly id: string;
  readonly purpose: string;
  readonly trigger: string;
  readonly requiredInputs: readonly string[];
  readonly expectedDecision: string;
  readonly scheduledWindow: string | null;
  readonly responsibleBrainOrUser: string;
};

export type ResourceAssumption = {
  readonly id: string;
  readonly statement: string;
  readonly status: "available" | "missing" | "unknown";
  readonly confidence: PlanningConfidence;
  readonly requiredBy: readonly string[];
  readonly blocking: boolean;
  readonly resolution: string | null;
};

export type PlanningContextGap = {
  readonly id: string;
  readonly missingContext: string;
  readonly whyNeeded: string;
  readonly affectedWork: readonly string[];
  readonly blocking: boolean;
  readonly recommendedResolution: string;
};

export type PlanningEscalation = {
  readonly id: string;
  readonly reason: string;
  readonly requiredInput: string;
  readonly blocking: boolean;
  readonly recommendedQuestion: string;
};

export type PlanningBrainRisk = {
  readonly id: string;
  readonly description: string;
  readonly likelihood: PlanningPriority;
  readonly severity: PlanningPriority;
  readonly affectedWork: readonly string[];
  readonly scheduleImpact: string;
  readonly businessImpact: string;
  readonly mitigationOption: string;
  readonly confidence: PlanningConfidence;
};

export type PlanningBrainDecision = {
  readonly id: string;
  readonly decision: string;
  readonly reason: string;
  readonly constraints: readonly string[];
  readonly dependencies: readonly string[];
  readonly impact: string;
  readonly reversible: boolean;
  readonly confidence: PlanningConfidence;
};

export type ExecutionPreparation = {
  readonly id: string;
  readonly deliverableId: string;
  readonly targetChannel: string;
  readonly requiredProvider: string | null;
  readonly requiredIntegration: string | null;
  readonly requiredAccount: string | null;
  readonly requiredApproval: boolean;
  readonly requiredValidation: boolean;
  readonly scheduleWindow: string | null;
  readonly payloadRequirements: readonly string[];
  readonly trackingRequirements: readonly string[];
};

export type CriticalPath = {
  readonly criticalPathWorkPackages: readonly string[];
  readonly criticalPathMilestones: readonly string[];
  readonly blockingDependencies: readonly string[];
  readonly scheduleRisk: string;
};

export type ParallelGroups = {
  readonly parallelGroups: readonly { id: string; workPackageIds: readonly string[]; reason: string }[];
  readonly sequentialGroups: readonly { id: string; workPackageIds: readonly string[]; reason: string }[];
};

export type ProjectPlan = {
  readonly id: string;
  readonly organizationId: string;
  readonly projectId?: string;
  readonly campaignIds: readonly string[];
  readonly objectiveSummary: string;
  readonly timeHorizon: string;
  readonly status: PlanningEntityStatus;
};

export type PlanningSummary = {
  readonly numberOfCampaigns: number;
  readonly numberOfWorkstreams: number;
  readonly numberOfWorkPackages: number;
  readonly numberOfDeliverables: number;
  readonly numberOfMilestones: number;
  readonly numberOfApprovalGates: number;
  readonly blockingDependencies: number;
  readonly contextGaps: number;
  readonly criticalPathLength: number;
  readonly estimatedPlanningWindow: string;
  readonly confidence: PlanningConfidence;
};

export type PlanInvalidationScope = {
  readonly trigger: string;
  readonly reason: string;
  readonly campaignIds: readonly string[];
  readonly workstreamIds: readonly string[];
  readonly workPackageIds: readonly string[];
  readonly deliverableIds: readonly string[];
  readonly scheduleWindowIds: readonly string[];
};

export type PlanningBrainGraph = {
  readonly version: string;
  readonly organizationId: string;
  readonly projectId?: string;
  readonly campaignId?: string;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly strategyVersionRef: string;
  readonly changeReason: string;
  readonly supersedes: string | null;
  readonly strategyInput: PlanningStrategyInput;
  readonly planningObjectives: readonly PlanningObjective[];
  readonly projectPlan: ProjectPlan;
  readonly campaignPlans: readonly CampaignPlan[];
  readonly workstreams: readonly Workstream[];
  readonly workPackages: readonly WorkPackage[];
  readonly milestones: readonly PlanningBrainMilestone[];
  readonly deliverables: readonly PlannedDeliverable[];
  readonly dependencies: readonly PlanningBrainDependency[];
  readonly criticalPath: CriticalPath;
  readonly parallelGroups: ParallelGroups;
  readonly scheduleWindows: readonly ScheduleWindow[];
  readonly approvalGates: readonly ApprovalGate[];
  readonly reviewCheckpoints: readonly ReviewCheckpoint[];
  readonly resourceAssumptions: readonly ResourceAssumption[];
  readonly contextGaps: readonly PlanningContextGap[];
  readonly escalations: readonly PlanningEscalation[];
  readonly planningRisks: readonly PlanningBrainRisk[];
  readonly planningDecisions: readonly PlanningBrainDecision[];
  readonly creativeBriefInputs: readonly CreativeBriefInput[];
  readonly executionPreparations: readonly ExecutionPreparation[];
  readonly memoryCheckpointRecommendations: readonly string[];
  readonly invalidationScopes: readonly PlanInvalidationScope[];
  readonly summary: PlanningSummary;
  readonly confidence: PlanningConfidence;
};

export type PlanningSnapshot = {
  readonly id: string;
  readonly organizationId: string;
  readonly projectId?: string;
  readonly campaignId?: string;
  readonly graph: PlanningBrainGraph;
  readonly outputRef: string;
  readonly storedAt: string;
};

export type PlanningRun = {
  readonly id: string;
  readonly organizationId: string;
  readonly projectId?: string;
  readonly campaignId?: string;
  readonly startedAt: string;
  readonly completedAt: string | null;
  readonly status: "running" | "completed" | "blocked" | "failed";
  readonly snapshotId: string | null;
};

export type PlanningHistoryEntry = {
  readonly runId: string;
  readonly snapshotId: string;
  readonly version: number;
  readonly storedAt: string;
  readonly changeReason: string;
  readonly strategyVersionRef: string;
};

export type PlanningHistory = {
  readonly organizationId: string;
  readonly projectId?: string;
  readonly entries: readonly PlanningHistoryEntry[];
};

export type PlanningBrainInput = {
  readonly organizationId: string;
  readonly projectId?: string;
  readonly episodeId?: string;
  readonly campaignId?: string;
  readonly locale?: "nl" | "en";
  readonly companyGraph: CompanyGraph;
  readonly strategyGraph: StrategyBrainGraph;
  readonly memoryGraph?: import("../memory/types").MemoryGraph | null;
  readonly projectObjective?: string;
  readonly customerDeadline?: { start: string; end: string } | string | null;
  readonly resourceConstraints?: readonly string[];
  readonly approvalPolicy?: "always" | "major_only" | "none";
  readonly changeReason?: string;
  readonly supersedesSnapshotId?: string | null;
  readonly invalidationTrigger?: string | null;
};

export type PlanningBrainOutput = {
  readonly graph: PlanningBrainGraph;
  readonly structuredOutput: import("../../evidence/structured-output").BrainStructuredOutput;
  readonly outputRef: string;
  readonly snapshot: PlanningSnapshot;
  readonly run: PlanningRun;
};

export type PlanningBrainPayload = {
  readonly companyGraph?: CompanyGraph | null;
  readonly strategyBrainGraph?: StrategyBrainGraph | null;
  readonly memoryGraph?: import("../memory/types").MemoryGraph | null;
  readonly projectObjective?: string;
  readonly customerDeadline?: { start: string; end: string } | string | null;
  readonly resourceConstraints?: readonly string[];
  readonly approvalPolicy?: "always" | "major_only" | "none";
  readonly changeReason?: string;
  readonly supersedesSnapshotId?: string | null;
  readonly invalidationTrigger?: string | null;
};

export type StrategyPlanningContext = {
  readonly planningInput: PlanningStrategyInput;
  readonly decisions: readonly StrategicDecision[];
  readonly campaignObjectives: readonly CampaignObjective[];
  readonly audienceStrategy: readonly AudienceStrategy[];
  readonly channelStrategy: readonly ChannelStrategy[];
  readonly positioningStrategy: PositioningStrategy;
  readonly messagingDirection: MessagingStrategyDirection;
  readonly funnelStrategy: FunnelStrategy;
  readonly offerDirection: OfferStrategyDirection;
  readonly budgetStrategy: BudgetStrategy;
  readonly kpis: readonly string[];
  readonly tradeoffs: readonly StrategicTradeoff[];
  readonly risks: readonly StrategicRisk[];
  readonly assumptions: readonly StrategicAssumption[];
  readonly approval: StrategyApprovalRequirement;
};

export function extractStrategyPlanningContext(graph: StrategyBrainGraph): StrategyPlanningContext {
  return {
    planningInput: graph.planningInputs,
    decisions: graph.strategicDecisions,
    campaignObjectives: graph.campaignObjectives,
    audienceStrategy: graph.audienceStrategy,
    channelStrategy: graph.channelStrategy,
    positioningStrategy: graph.positioningStrategy,
    messagingDirection: graph.messagingStrategyDirection,
    funnelStrategy: graph.funnelStrategy,
    offerDirection: graph.offerStrategyDirection,
    budgetStrategy: graph.budgetStrategy,
    kpis: graph.kpiFramework.map((k) => k.name),
    tradeoffs: graph.strategicTradeoffs,
    risks: graph.strategicRisks,
    assumptions: graph.strategicAssumptions,
    approval: graph.approval,
  };
}

export type {
  CompanyGraph,
  StrategyBrainGraph,
  PlanningStrategyInput,
  CampaignObjective,
  StrategicDecision,
};
