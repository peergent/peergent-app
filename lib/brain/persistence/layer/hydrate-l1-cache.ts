/**
 * PX-55 — read-only hydration into L1 module stores (no Supabase write-through).
 */

import type { CompanyStoreRecord } from "../../layers/company/company-repository";
import type { ResearchSnapshot } from "../../layers/research/brain-types";
import type { ReasoningSnapshot } from "../../layers/reasoning/brain-types";
import type { MarketingIntelligenceSnapshot } from "../../layers/marketing-intelligence/brain-types";
import type { StrategySnapshot } from "../../layers/strategy/brain-types";
import type { PlanningSnapshot } from "../../layers/planning/brain-types";
import type { LearningSnapshot } from "../../layers/learning/brain-types";
import type { CreativeRecord } from "../../layers/creative/creative-repository";
import type { ValidationRecord } from "../../layers/validation/validation-repository";
import type { MemoryStoreRecord } from "../../layers/memory/memory-repository";
import type { ExecutionStoreRecord } from "../../layers/execution/execution-repository";
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
import type { LayerDocumentRow } from "./supabase-sync";
import { emitPersistenceDiagnostic } from "./persistence-diagnostics";

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

/** Populate L1 cache from durable rows — must never write back to Supabase. */
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
      hydrationRepos.company.store(payload as unknown as CompanyStoreRecord);
      break;
    case "research_snapshot":
      hydrationRepos.researchBrain.storeSnapshot(payload as unknown as ResearchSnapshot);
      break;
    case "reasoning_snapshot":
      hydrationRepos.reasoningBrain.storeSnapshot(payload as unknown as ReasoningSnapshot);
      break;
    case "mi_snapshot":
      hydrationRepos.marketingIntelligenceBrain.storeSnapshot(
        payload as unknown as MarketingIntelligenceSnapshot
      );
      break;
    case "strategy_snapshot":
      hydrationRepos.strategyBrain.storeSnapshot(payload as unknown as StrategySnapshot);
      break;
    case "planning_snapshot":
      hydrationRepos.planningBrain.storeSnapshot(payload as unknown as PlanningSnapshot);
      break;
    case "learning_snapshot":
      hydrationRepos.learningBrain.storeSnapshot(payload as unknown as LearningSnapshot);
      break;
    case "creative_record":
      hydrationRepos.creative.store(payload as unknown as CreativeRecord);
      break;
    case "validation_record":
      hydrationRepos.validation.store(payload as unknown as ValidationRecord);
      break;
    case "memory_store":
      hydrationRepos.memory.store(payload as unknown as MemoryStoreRecord);
      break;
    case "execution_store":
      hydrationRepos.execution.store(payload as unknown as ExecutionStoreRecord);
      break;
    default:
      break;
  }
}
