/**
 * Layer repository composition root — selects in-memory vs persistent vs Supabase.
 */

import type { AppSupabaseClient } from "@/lib/intelligence/api/org-context";
import type { CompanyRepository } from "../layers/company/company-repository";
import type { ResearchBrainRepository } from "../layers/research/research-brain-repository";
import type { ReasoningBrainRepository } from "../layers/reasoning/reasoning-brain-repository";
import type { MarketingIntelligenceBrainRepository } from "../layers/marketing-intelligence/marketing-intelligence-brain-repository";
import type { StrategyBrainRepository } from "../layers/strategy/strategy-brain-repository";
import type { PlanningBrainRepository } from "../layers/planning/planning-brain-repository";
import type { CreativeRepository } from "../layers/creative/creative-repository";
import type { ValidationRepository } from "../layers/validation/validation-repository";
import type { MemoryRepository } from "../layers/memory/memory-repository";
import type { ExecutionRepository } from "../layers/execution/execution-repository";
import type { LearningBrainRepository } from "../layers/learning/learning-brain-repository";
import type { BrandRepository } from "../layers/brand/brand-repository";
import type { ProjectEpisodeRepository } from "../project-runtime/project-episode-repository";
import { InMemoryCompanyRepository } from "../layers/company/company-repository";
import { InMemoryResearchBrainRepository } from "../layers/research/research-brain-repository";
import { InMemoryReasoningBrainRepository } from "../layers/reasoning/reasoning-brain-repository";
import { InMemoryMarketingIntelligenceBrainRepository } from "../layers/marketing-intelligence/marketing-intelligence-brain-repository";
import { InMemoryStrategyBrainRepository } from "../layers/strategy/strategy-brain-repository";
import { InMemoryPlanningBrainRepository } from "../layers/planning/planning-brain-repository";
import { InMemoryCreativeRepository } from "../layers/creative/creative-repository";
import { InMemoryValidationRepository } from "../layers/validation/validation-repository";
import { InMemoryMemoryRepository } from "../layers/memory/memory-repository";
import { InMemoryExecutionRepository } from "../layers/execution/execution-repository";
import { InMemoryLearningBrainRepository } from "../layers/learning/learning-brain-repository";
import { InMemoryBrandRepository } from "../layers/brand/brand-repository";
import { InMemoryProjectEpisodeRepository } from "../project-runtime/project-episode-repository";
import {
  PersistentCompanyRepository,
  PersistentCreativeRepository,
  PersistentExecutionRepository,
  PersistentLearningBrainRepository,
  PersistentMarketingIntelligenceBrainRepository,
  PersistentMemoryRepository,
  PersistentPlanningBrainRepository,
  PersistentProjectEpisodeRepository,
  PersistentReasoningBrainRepository,
  PersistentResearchBrainRepository,
  PersistentStrategyBrainRepository,
  PersistentValidationRepository,
  PersistentBrandRepository,
} from "./layer/persistent-repositories";
import { resetPersistentLayerStores } from "./layer/stores";
import { createSupabaseLayerRepositories } from "./layer/supabase-layer-repositories";
import {
  PersistenceConfigurationError,
  resolveBrainPersistenceMode,
} from "./server/persistence-config";

export type LayerRepositoryStorageMode = "in_memory" | "persistent_in_memory" | "supabase";

export type LayerRepositoryBundle = {
  storageMode: LayerRepositoryStorageMode;
  company: CompanyRepository;
  researchBrain: ResearchBrainRepository;
  reasoningBrain: ReasoningBrainRepository;
  marketingIntelligenceBrain: MarketingIntelligenceBrainRepository;
  strategyBrain: StrategyBrainRepository;
  planningBrain: PlanningBrainRepository;
  creative: CreativeRepository;
  validation: ValidationRepository;
  memory: MemoryRepository;
  execution: ExecutionRepository;
  learningBrain: LearningBrainRepository;
  brand: BrandRepository;
  projectEpisode: ProjectEpisodeRepository;
};

export type CreateLayerRepositoriesInput = {
  mode?: LayerRepositoryStorageMode;
  supabase?: AppSupabaseClient | null;
};

function createVolatileLayerRepositories(): LayerRepositoryBundle {
  return {
    storageMode: "in_memory",
    company: new InMemoryCompanyRepository(),
    researchBrain: new InMemoryResearchBrainRepository(),
    reasoningBrain: new InMemoryReasoningBrainRepository(),
    marketingIntelligenceBrain: new InMemoryMarketingIntelligenceBrainRepository(),
    strategyBrain: new InMemoryStrategyBrainRepository(),
    planningBrain: new InMemoryPlanningBrainRepository(),
    creative: new InMemoryCreativeRepository(),
    validation: new InMemoryValidationRepository(),
    memory: new InMemoryMemoryRepository(),
    execution: new InMemoryExecutionRepository(),
    learningBrain: new InMemoryLearningBrainRepository(),
    brand: new InMemoryBrandRepository(),
    projectEpisode: new InMemoryProjectEpisodeRepository(),
  };
}

function createPersistentLayerRepositories(): LayerRepositoryBundle {
  return {
    storageMode: "persistent_in_memory",
    company: new PersistentCompanyRepository(),
    researchBrain: new PersistentResearchBrainRepository(),
    reasoningBrain: new PersistentReasoningBrainRepository(),
    marketingIntelligenceBrain: new PersistentMarketingIntelligenceBrainRepository(),
    strategyBrain: new PersistentStrategyBrainRepository(),
    planningBrain: new PersistentPlanningBrainRepository(),
    creative: new PersistentCreativeRepository(),
    validation: new PersistentValidationRepository(),
    memory: new PersistentMemoryRepository(),
    execution: new PersistentExecutionRepository(),
    learningBrain: new PersistentLearningBrainRepository(),
    brand: new PersistentBrandRepository(),
    projectEpisode: new PersistentProjectEpisodeRepository(),
  };
}

/** Canonical layer repository factory. */
export function createLayerRepositories(input: CreateLayerRepositoriesInput = {}): LayerRepositoryBundle {
  const mode = input.mode ?? (input.supabase ? "supabase" : "persistent_in_memory");

  if (mode === "in_memory") {
    return createVolatileLayerRepositories();
  }

  if (mode === "supabase" && input.supabase) {
    return createSupabaseLayerRepositories(input.supabase);
  }

  return createPersistentLayerRepositories();
}

export function resetLayerRepositoryStores(): void {
  resetPersistentLayerStores();
}

let activeBundle: LayerRepositoryBundle | null = null;

/** Configure global layer repositories — call from server composition root. */
export function configureLayerRepositories(input: CreateLayerRepositoriesInput = {}): LayerRepositoryBundle {
  activeBundle = createLayerRepositories(input);
  return activeBundle;
}

/** Get active layer repositories — defaults to persistent_in_memory for local dev/tests only. */
export function getLayerRepositories(): LayerRepositoryBundle {
  if (!activeBundle) {
    const mode = resolveBrainPersistenceMode();
    if (process.env.NODE_ENV === "production" && mode === "supabase") {
      throw new PersistenceConfigurationError(
        "Brain layer repositories not initialized. Call ensureServerBrainRuntime() before Brain layer access."
      );
    }
    activeBundle = createPersistentLayerRepositories();
  }
  return activeBundle;
}

export function resetConfiguredLayerRepositories(): void {
  resetLayerRepositoryStores();
  activeBundle = null;
}
