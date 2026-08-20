/**
 * PX-55 / PX-63D — read-only hydration into shared L1 module stores (no Supabase write-through).
 */

import type { LayerDocumentRow } from "./supabase-sync";
import { emitPersistenceDiagnostic } from "./persistence-diagnostics";
import {
  PersistentCompanyRepository,
  PersistentCreativeRepository,
  PersistentExecutionRepository,
  PersistentLearningBrainRepository,
  PersistentMarketingIntelligenceBrainRepository,
  PersistentMemoryRepository,
  PersistentPlanningBrainRepository,
  PersistentReasoningBrainRepository,
  PersistentResearchBrainRepository,
  PersistentStrategyBrainRepository,
  PersistentValidationRepository,
} from "./persistent-repositories";

/** Persistent-only repos — share module stores with active bundle without write-through. */
const hydrationRepos = {
  company: new PersistentCompanyRepository(),
  researchBrain: new PersistentResearchBrainRepository(),
  reasoningBrain: new PersistentReasoningBrainRepository(),
  marketingIntelligenceBrain: new PersistentMarketingIntelligenceBrainRepository(),
  strategyBrain: new PersistentStrategyBrainRepository(),
  planningBrain: new PersistentPlanningBrainRepository(),
  learningBrain: new PersistentLearningBrainRepository(),
  creative: new PersistentCreativeRepository(),
  validation: new PersistentValidationRepository(),
  memory: new PersistentMemoryRepository(),
  execution: new PersistentExecutionRepository(),
};

/** Populate shared L1 cache from durable rows — must never write back to Supabase. */
export function applyHydratedLayerDocumentToL1Cache(row: LayerDocumentRow): void {
  emitPersistenceDiagnostic({
    event: "persistence_hydration_l1_apply",
    organizationId: row.organization_id,
    projectId: row.project_id ?? undefined,
    brainId: row.brain_id,
    documentKind: row.document_kind,
    operation: "hydration.read_only_l1",
  });

  const payload = row.payload as Record<string, unknown>;

  switch (row.document_kind) {
    case "company_store":
      hydrationRepos.company.store(payload as unknown as import("../../layers/company/company-repository").CompanyStoreRecord);
      break;
    case "research_snapshot":
      hydrationRepos.researchBrain.storeSnapshot(payload as unknown as import("../../layers/research/brain-types").ResearchSnapshot);
      break;
    case "reasoning_snapshot":
      hydrationRepos.reasoningBrain.storeSnapshot(payload as unknown as import("../../layers/reasoning/brain-types").ReasoningSnapshot);
      break;
    case "mi_snapshot":
      hydrationRepos.marketingIntelligenceBrain.storeSnapshot(
        payload as unknown as import("../../layers/marketing-intelligence/brain-types").MarketingIntelligenceSnapshot
      );
      break;
    case "strategy_snapshot":
      hydrationRepos.strategyBrain.storeSnapshot(payload as unknown as import("../../layers/strategy/brain-types").StrategySnapshot);
      break;
    case "planning_snapshot":
      hydrationRepos.planningBrain.storeSnapshot(payload as unknown as import("../../layers/planning/brain-types").PlanningSnapshot);
      break;
    case "learning_snapshot":
      hydrationRepos.learningBrain.storeSnapshot(payload as unknown as import("../../layers/learning/brain-types").LearningSnapshot);
      break;
    case "creative_record":
      hydrationRepos.creative.store(payload as unknown as import("../../layers/creative/creative-repository").CreativeRecord);
      break;
    case "validation_record":
      hydrationRepos.validation.store(payload as unknown as import("../../layers/validation/validation-repository").ValidationRecord);
      break;
    case "memory_store":
      hydrationRepos.memory.store(payload as unknown as import("../../layers/memory/memory-repository").MemoryStoreRecord);
      break;
    case "execution_store":
      hydrationRepos.execution.store(payload as unknown as import("../../layers/execution/execution-repository").ExecutionStoreRecord);
      break;
    default:
      break;
  }
}
