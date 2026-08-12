/**
 * Module-scoped stores — simulate durable storage across repository instances.
 * Cleared explicitly via resetPersistentLayerStores().
 */

import type { CompanyStoreRecord } from "../../layers/company/company-repository";
import type { ResearchRecord } from "../../layers/research/research-repository";
import type {
  ResearchHistory,
  ResearchRun,
  ResearchSnapshot,
} from "../../layers/research/brain-types";
import type { ReasoningRecord } from "../../layers/reasoning/reasoning-repository";
import type {
  ReasoningHistory,
  ReasoningRun,
  ReasoningSnapshot,
} from "../../layers/reasoning/brain-types";
import type { MarketingIntelligenceRecord } from "../../layers/marketing-intelligence/marketing-intelligence-repository";
import type {
  MarketingIntelligenceHistory,
  MarketingIntelligenceRun,
  MarketingIntelligenceSnapshot,
} from "../../layers/marketing-intelligence/brain-types";
import type {
  StrategyHistory,
  StrategyRun,
  StrategySnapshot,
} from "../../layers/strategy/brain-types";
import type { PlanningRecord } from "../../layers/planning/planning-repository";
import type {
  PlanningHistory,
  PlanningRun,
  PlanningSnapshot,
} from "../../layers/planning/brain-types";
import type { CreativeRecord } from "../../layers/creative/creative-repository";
import type { ValidationRecord } from "../../layers/validation/validation-repository";
import type { MemoryStoreRecord } from "../../layers/memory/memory-repository";
import type { MemoryRecord } from "../../layers/memory/types";
import type { ExecutionStoreRecord } from "../../layers/execution/execution-repository";
import type {
  LearningHistory,
  LearningRun,
  LearningSnapshot,
} from "../../layers/learning/brain-types";
import type { BrandRecord } from "../../layers/brand/brand-repository";
import type {
  ProjectApprovalRecord,
  ProjectEpisodeRecord,
  ProjectRuntimeEvent,
  StoredPerformanceObservation,
} from "../../project-runtime/types";

/** Company */
export const companyLatest = new Map<string, CompanyStoreRecord>();
export const companyVersions = new Map<string, CompanyStoreRecord>();

/** Research */
export const researchRecords = new Map<string, ResearchRecord>();
export const researchSnapshots = new Map<string, ResearchSnapshot>();
export const researchRuns = new Map<string, ResearchRun>();
export const researchHistories = new Map<string, ResearchHistory>();

/** Reasoning */
export const reasoningRecords = new Map<string, ReasoningRecord>();
export const reasoningSnapshots = new Map<string, ReasoningSnapshot>();
export const reasoningRuns = new Map<string, ReasoningRun>();
export const reasoningHistories = new Map<string, ReasoningHistory>();

/** Marketing Intelligence */
export const miRecords = new Map<string, MarketingIntelligenceRecord>();
export const miSnapshots = new Map<string, MarketingIntelligenceSnapshot>();
export const miRuns = new Map<string, MarketingIntelligenceRun>();
export const miHistories = new Map<string, MarketingIntelligenceHistory>();

/** Strategy */
export const strategySnapshots = new Map<string, StrategySnapshot>();
export const strategyRuns = new Map<string, StrategyRun>();
export const strategyHistories = new Map<string, StrategyHistory>();

/** Planning */
export const planningRecords = new Map<string, PlanningRecord>();
export const planningSnapshots = new Map<string, PlanningSnapshot>();
export const planningRuns = new Map<string, PlanningRun>();
export const planningHistories = new Map<string, PlanningHistory>();

/** Creative / Validation */
export const creativeRecords = new Map<string, CreativeRecord>();
export const validationRecords = new Map<string, ValidationRecord>();

/** Memory */
export const memoryRecords = new Map<string, MemoryStoreRecord>();
export const orgMemoryIndex = new Map<string, MemoryRecord[]>();

/** Execution */
export const executionRecords = new Map<string, ExecutionStoreRecord>();
export const executionIdempotencyIndex = new Map<string, ExecutionStoreRecord>();

/** Learning */
export const learningSnapshots = new Map<string, LearningSnapshot>();
export const learningRuns = new Map<string, LearningRun>();
export const learningHistories = new Map<string, LearningHistory>();

/** Brand */
export const brandRecords = new Map<string, BrandRecord>();

/** Project runtime */
export const projectEpisodes = new Map<string, ProjectEpisodeRecord>();
export const projectApprovals = new Map<string, ProjectApprovalRecord[]>();
export const projectObservations = new Map<string, StoredPerformanceObservation[]>();
export const projectEvents = new Map<string, ProjectRuntimeEvent[]>();

/** Output ref index for cross-session resolution */
export const outputRefIndex = new Map<string, unknown>();

export function resetPersistentLayerStores(): void {
  companyLatest.clear();
  companyVersions.clear();
  researchRecords.clear();
  researchSnapshots.clear();
  researchRuns.clear();
  researchHistories.clear();
  reasoningRecords.clear();
  reasoningSnapshots.clear();
  reasoningRuns.clear();
  reasoningHistories.clear();
  miRecords.clear();
  miSnapshots.clear();
  miRuns.clear();
  miHistories.clear();
  strategySnapshots.clear();
  strategyRuns.clear();
  strategyHistories.clear();
  planningRecords.clear();
  planningSnapshots.clear();
  planningRuns.clear();
  planningHistories.clear();
  creativeRecords.clear();
  validationRecords.clear();
  memoryRecords.clear();
  orgMemoryIndex.clear();
  executionRecords.clear();
  executionIdempotencyIndex.clear();
  learningSnapshots.clear();
  learningRuns.clear();
  learningHistories.clear();
  brandRecords.clear();
  projectEpisodes.clear();
  projectApprovals.clear();
  projectObservations.clear();
  projectEvents.clear();
  outputRefIndex.clear();
}
