/**
 * Resolves persisted Brain outputs from layer repositories by organization/project.
 */

import { getDefaultCompanyRepository } from "../layers/company/company-repository";
import { getDefaultResearchBrainRepository } from "../layers/research/research-brain-repository";
import { getDefaultReasoningBrainRepository } from "../layers/reasoning/reasoning-brain-repository";
import { getDefaultMarketingIntelligenceBrainRepository } from "../layers/marketing-intelligence/marketing-intelligence-brain-repository";
import { getDefaultStrategyBrainRepository } from "../layers/strategy/strategy-brain-repository";
import { getDefaultPlanningBrainRepository } from "../layers/planning/planning-brain-repository";
import { getDefaultCreativeRepository } from "../layers/creative/creative-repository";
import { getDefaultValidationRepository } from "../layers/validation/validation-repository";
import { getDefaultMemoryRepository } from "../layers/memory/memory-repository";
import { getDefaultExecutionRepository } from "../layers/execution/execution-repository";
import { getDefaultLearningBrainRepository } from "../layers/learning/learning-brain-repository";
import type { ProjectBrainArtifacts } from "./types";

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

export function resolveBrainOutputs(input: {
  organizationId: string;
  projectId: string;
  artifacts: ProjectBrainArtifacts;
}): ResolvedBrainOutputs {
  const key = { organizationId: input.organizationId, projectId: input.projectId };

  const company = getDefaultCompanyRepository().getLatest(input.organizationId)?.graph ?? null;
  const research = getDefaultResearchBrainRepository().getLatestSnapshot(key)?.graph ?? null;
  const reasoning = getDefaultReasoningBrainRepository().getLatestSnapshot(key)?.graph ?? null;
  const mi = getDefaultMarketingIntelligenceBrainRepository().getLatestSnapshot(key)?.graph ?? null;
  const strategy = getDefaultStrategyBrainRepository().getLatestSnapshot(key)?.graph ?? null;
  const planning = getDefaultPlanningBrainRepository().getLatestSnapshot(key)?.graph ?? null;
  const creative = getDefaultCreativeRepository().getLatest({ organizationId: input.organizationId, campaignId: input.projectId })?.graph ?? null;
  const validation = getDefaultValidationRepository().getLatest({ organizationId: input.organizationId, campaignId: input.projectId })?.graph ?? null;
  const memory = getDefaultMemoryRepository().getLatest({ organizationId: input.organizationId, campaignId: input.projectId })?.graph ?? null;
  const execution = getDefaultExecutionRepository().getLatest({ organizationId: input.organizationId, projectId: input.projectId })?.history ?? null;
  const learning = getDefaultLearningBrainRepository().getLatestSnapshot(key)?.graph ?? null;
  const priorMemories = getDefaultMemoryRepository().getOrgMemories(input.organizationId);

  return {
    companyGraph: company,
    researchBrainGraph: research,
    reasoningBrainGraph: reasoning,
    marketingIntelligenceBrainGraph: mi,
    strategyBrainGraph: strategy,
    planningBrainGraph: planning,
    creativeGraph: creative,
    validationGraph: validation,
    memoryGraph: memory,
    executionHistory: execution,
    learningBrainGraph: learning,
    priorMemories,
  };
}
