/**
 * Project Runtime — PX-47 integration types.
 * Runner result states only — does not replace Project Engine lifecycle states.
 */

import type { BrainContextSlices, BrainPriorOutput } from "../project-engine/brain-contract";
import type { ProjectBrainId, ProjectEngineSnapshot, ProjectLifecycleState } from "../project-engine/types";
import type { PerformanceObservation } from "../layers/learning/brain-types";
import type { CampaignApprovalMode } from "@/lib/campaign/types/campaign";

export type EpisodeStatus =
  | "running"
  | "waiting_for_context"
  | "waiting_for_approval"
  | "waiting_for_outcomes"
  | "completed"
  | "failed";

export type ContextGapKind = "website" | "business" | "budget" | "integration" | "approval" | "measurement";

export type ContextGap = {
  kind: ContextGapKind;
  requiredBy: ProjectBrainId | "project_engine";
  reason: string;
  blocking: boolean;
  resolutionType: "customer_input" | "integration" | "approval" | "observation";
};

export type ProjectBrainArtifacts = {
  organizationId: string;
  projectId: string;
  episodeId: string;
  correlationId: string;
  companyOutputRef?: string;
  researchOutputRef?: string;
  reasoningOutputRef?: string;
  marketingIntelligenceOutputRef?: string;
  strategyOutputRef?: string;
  planningOutputRef?: string;
  creativeOutputRef?: string;
  validationOutputRef?: string;
  memoryOutputRefs: string[];
  executionOutputRef?: string;
  learningOutputRef?: string;
  performanceObservationIds: string[];
  approvalIds: string[];
  /** Last resolved learning proposals for Memory second-pass */
  learningProposalIds: string[];
};

export type ProjectApprovalRecord = {
  id: string;
  projectId: string;
  organizationId: string;
  checkpointKind: string;
  decision: "approved" | "rejected";
  actor: string;
  comment?: string;
  decidedAt: string;
};

export type StoredPerformanceObservation = PerformanceObservation & {
  ingestionId: string;
  ingestedAt: string;
};

export type ProjectEpisodeRecord = {
  snapshot: ProjectEngineSnapshot;
  artifacts: ProjectBrainArtifacts;
  episodeStatus: EpisodeStatus;
  contextReady: boolean;
  sliceAvailability: Partial<BrainContextSlices>;
  approvalSatisfied: boolean;
  validationApprovalPending: boolean;
  memoryCheckpoint1Complete: boolean;
  memoryCheckpoint2Complete: boolean;
  performanceObservationsAvailable: boolean;
  approvalGrantedForExecution: boolean;
  /** Canonical campaign approval mode for PE checkpoint selection. */
  campaignApprovalMode?: CampaignApprovalMode;
  contextGaps: ContextGap[];
  executedBrainKeys: string[];
  lastError: string | null;
  /** PX-54 — last runner loop exit (privacy-safe orchestration diagnostic). */
  lastRunnerExitReason?: string | null;
  correlationId: string;
  startedAt: string;
  updatedAt: string;
  completedAt: string | null;
  /** In-episode resolved graphs — canonical handoff cache for downstream brains */
  resolvedGraphs: Partial<ResolvedBrainOutputs>;
  /** Cached Learning → Memory proposals for checkpoint 2 */
  cachedLearningProposals?: readonly import("../layers/learning/brain-types").MemoryWriteProposal[];
  /** Optimistic concurrency version for durable episode store */
  durableVersion?: number;
  /** PX-59 — frozen approved package consumed by Execution (no regeneration). */
  approvedExecutionHandoff?: ApprovedExecutionHandoff | null;
  /** PX-61 — durable customer-supplied campaign brand context (survives reload). */
  suppliedCampaignBrandContext?: SuppliedCampaignBrandContext | null;
  /** PX-61B — durable website decision (supplied URL or explicit skip). */
  suppliedCampaignWebsiteDecision?: SuppliedCampaignWebsiteDecision | null;
  /** PX-61B — durable competitor decision (supplied list or explicit skip). */
  suppliedCampaignCompetitorDecision?: SuppliedCampaignCompetitorDecision | null;
};

/** Customer-supplied brand context persisted on the episode for durable reload. */
export type SuppliedCampaignBrandContext = {
  brandName: string;
  industry?: string;
  mission?: string;
  uniqueSellingPoints?: readonly string[];
  productsAndServices?: readonly string[];
  positioning?: string;
  tone?: string;
  targetAudience?: string;
  suppliedAt: string;
  source: "customer_supplied";
};

/** Durable website decision on episode — distinct from missing. */
export type SuppliedCampaignWebsiteDecision = {
  decision: "supplied" | "skipped";
  websiteUrl?: string;
  decidedAt: string;
  source: "customer_supplied" | "customer_skipped";
};

/** Durable competitor decision on episode — distinct from missing. */
export type SuppliedCampaignCompetitorDecision = {
  decision: "supplied" | "skipped";
  competitors?: readonly { name: string; url?: string }[];
  decidedAt: string;
  source: "customer_supplied" | "customer_skipped";
};

/** Immutable handoff from CampaignApprovalPackage → Execution Brain. */
export type ApprovedExecutionHandoff = {
  packageId: string;
  packageVersion: string;
  creativeGraphRef: string;
  validationGraphRef: string;
  planningGraphRef: string | null;
  strategyGraphRef: string | null;
  approvedAt: string;
  approvalId: string;
  deliverableIds: readonly string[];
  channels: readonly string[];
  /** Set when execution attempted but live integrations are missing. */
  executionPhase?:
    | "approved"
    | "executing"
    | "prepared"
    | "blocked_integration"
    | "completed";
  blockedChannels?: readonly string[];
  blockedReason?: string | null;
};

export type ResolvedBrainOutputs = {
  companyGraph: import("../layers/company/types").CompanyGraph | null;
  researchBrainGraph: import("../layers/research/brain-types").ResearchBrainGraph | null;
  reasoningBrainGraph: import("../layers/reasoning/brain-types").ReasoningBrainGraph | null;
  marketingIntelligenceBrainGraph: import("../layers/marketing-intelligence/brain-types").MarketingIntelligenceBrainGraph | null;
  strategyBrainGraph: import("../layers/strategy/brain-types").StrategyBrainGraph | null;
  planningBrainGraph: import("../layers/planning/brain-types").PlanningBrainGraph | null;
  creativeGraph: import("../layers/creative/types").CreativeGraph | null;
  validationGraph: import("../layers/validation/types").ValidationGraph | null;
  memoryGraph: import("../layers/memory/types").MemoryGraph | null;
  executionHistory: import("../layers/execution/types").ExecutionHistory | null;
  learningBrainGraph: import("../layers/learning/brain-types").LearningBrainGraph | null;
  priorMemories: readonly import("../layers/memory/types").MemoryRecord[];
};

export type ProjectRuntimeEvent = {
  eventId: string;
  projectId: string;
  organizationId: string;
  brainId: ProjectBrainId | null;
  timestamp: string;
  correlationId: string;
  type: string;
  outputRef: string | null;
  customerSafeSummary?: string;
  /** PX-63D — safe audit metadata (no prompts or raw customer content). */
  metadata?: Record<string, unknown>;
};

/** Legitimate pause boundary for production episode runs — not arbitrary step counts. */
export type EpisodeRunTarget = {
  /** Stop after this brain completes successfully. */
  targetBrain?: ProjectBrainId;
  /** Stop when lifecycle reaches this state. */
  targetLifecycleState?: ProjectLifecycleState;
};

export type EpisodeRunInput = {
  organizationId: string;
  projectId: string;
  peerId: string;
  episodeId?: string;
  locale?: "nl" | "en";
  correlationId?: string;
  contextReady?: boolean;
  sliceAvailability?: Partial<BrainContextSlices>;
  maxSteps?: number;
  /** When true, acquire real context via PX-49 instead of marketing fixture. */
  useRealContext?: boolean;
  peerRole?: string;
  campaignContext?: import("@/lib/office/campaign/campaign-context").CampaignContext;
  supabase?: import("@/lib/intelligence/api/org-context").AppSupabaseClient;
  /** PX-50 — run until target brain/state or legitimate pause (approval, context, outcomes). */
  target?: EpisodeRunTarget;
};

export type EpisodeRunResult = {
  episode: ProjectEpisodeRecord;
  status: EpisodeStatus;
  missingContext: ContextGap[];
  reason: string | null;
  events: readonly ProjectRuntimeEvent[];
  observability: EpisodeObservability;
  /** PX-60 — why the runner stopped (privacy-safe). */
  stopReason?: import("./episode-runner-stop-reasons").EpisodeRunnerStopReason | null;
};

export type EpisodeObservability = {
  episodeId: string;
  organizationId: string;
  projectId: string;
  peerId: string;
  correlationId: string;
  currentProjectState: ProjectLifecycleState;
  currentBrain: ProjectBrainId | null;
  startedAt: string;
  updatedAt: string;
  completedAt: string | null;
  brainOutputRefs: Record<string, string | undefined>;
  eventCount: number;
  approvalState: "none" | "pending" | "satisfied";
  observationState: "none" | "waiting" | "available";
  lastError: string | null;
};

export type ResumeEpisodeInput = {
  projectId: string;
  organizationId: string;
  approvalSatisfied?: boolean;
  performanceObservations?: readonly PerformanceObservation[];
  locale?: "nl" | "en";
  maxSteps?: number;
  /** PX-60 — pass through production execution context for post-approval continuation. */
  peerId?: string;
  peerRole?: string;
  useRealContext?: boolean;
  supabase?: import("@/lib/intelligence/api/org-context").AppSupabaseClient;
  campaignContext?: import("@/lib/office/campaign/campaign-context").CampaignContext;
};

export type SubmitApprovalInput = {
  projectId: string;
  organizationId: string;
  approvalId: string;
  decision: "approved" | "rejected";
  actor: string;
  comment?: string;
  timestamp?: string;
};

export type BrainHandoffContext = {
  organizationId: string;
  projectId: string;
  episodeId: string;
  locale: "nl" | "en";
  correlationId: string;
  artifacts: ProjectBrainArtifacts;
  priorOutputs: BrainPriorOutput[];
  priorMemories: readonly import("../layers/memory/types").MemoryRecord[];
  campaignContext: import("@/lib/office/campaign/campaign-context").CampaignContext;
  companySnapshot: import("../company/snapshot").CompanySnapshot;
  brandGraph: import("../layers/brand/types").BrandGraph | null;
  approvalGrantedForExecution: boolean;
  performanceObservations: readonly PerformanceObservation[];
  memoryCheckpointPhase: "checkpoint_1" | "checkpoint_2" | null;
  learningProposalIds: string[];
  learningProposals: readonly import("../layers/learning/brain-types").MemoryWriteProposal[];
  approvedExecutionHandoff?: ApprovedExecutionHandoff | null;
  peerId?: string;
};

/** PX-50 — optional capability adapter for production BrainRuntime execution. */
export type ProjectBrainExecutionAdapter = {
  execute(input: {
    brainId: ProjectBrainId;
    episode: ProjectEpisodeRecord;
    contextHandoff: {
      companySnapshot: import("../company/snapshot").CompanySnapshot;
      brandGraph: import("../layers/brand/types").BrandGraph | null;
      campaignContext: import("@/lib/office/campaign/campaign-context").CampaignContext;
      priorMemories: readonly import("../layers/memory/types").MemoryRecord[];
    };
    locale: "nl" | "en";
    idempotencyKey: string;
  }): Promise<import("../project-engine/brain-contract").BrainResult<import("../project-engine/brain-contract").BrainOutput>>;
  /** Last capability run for Office projection (e.g. strategy BrainRunResult). */
  lastCapabilityRun?: import("../runtime/run-result").BrainRunResult | null;
};
