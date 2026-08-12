/**
 * Project Runtime — PX-47 integration types.
 * Runner result states only — does not replace Project Engine lifecycle states.
 */

import type { BrainContextSlices, BrainPriorOutput } from "../project-engine/brain-contract";
import type { ProjectBrainId, ProjectEngineSnapshot, ProjectLifecycleState } from "../project-engine/types";
import type { PerformanceObservation } from "../layers/learning/brain-types";

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
  contextGaps: ContextGap[];
  executedBrainKeys: string[];
  lastError: string | null;
  correlationId: string;
  startedAt: string;
  updatedAt: string;
  completedAt: string | null;
  /** In-episode resolved graphs — canonical handoff cache for downstream brains */
  resolvedGraphs: Partial<ResolvedBrainOutputs>;
  /** Cached Learning → Memory proposals for checkpoint 2 */
  cachedLearningProposals?: readonly import("../layers/learning/brain-types").MemoryWriteProposal[];
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
};

export type EpisodeRunResult = {
  episode: ProjectEpisodeRecord;
  status: EpisodeStatus;
  missingContext: ContextGap[];
  reason: string | null;
  events: readonly ProjectRuntimeEvent[];
  observability: EpisodeObservability;
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
};
