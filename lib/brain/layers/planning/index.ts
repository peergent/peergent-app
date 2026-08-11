export {
  PLANNING_LAYER_VERSION,
  type PlanningGraph,
  type PlanningNode,
  type PlanningDecision,
  type PlanningObjective,
  type PlanningMilestone,
  type PlanningRequirement,
  type PlanningRisk,
  type PlanningReviewMoment,
  type PlanningTimelineIntent,
  type PlanningReadinessAssessment,
  type PlanningReadinessLevel,
  type PlanningDependencyAnalysis,
  type PlanningDependency,
} from "./types";

export { buildPlanningGraph, type BuildPlanningGraphInput } from "./planning-builder";
export {
  analyzePlanningDependencies,
  mergeNodeDependencies,
  type DependencyAnalysisResult,
} from "./planning-dependency-engine";
export { assessPlanningReadiness } from "./planning-readiness-engine";
export { buildPlanningTimeline, deriveExecutionOrder } from "./planning-timeline-engine";
export { buildPlanningRisks as buildLegacyPlanningRisks, buildPlanningReviewMoments, buildPlanningRisks } from "./planning-risk-engine";
export { validatePlanningGraph, scorePlanningQuality, type PlanningValidationResult } from "./planning-validator";
export {
  presentExecutionPlanSummary,
  presentExecutionPlanDetail,
  presentExecutionPlanBriefingSections,
} from "./planning-presenter";
export {
  PlanningLayer,
  createPlanningLayer,
  collectPlanningGraph,
  planFromBrainInputs,
  type PlanningLayerInput,
  type PlanningLayerResult,
  type PlanFromBrainInputs,
} from "./planning-layer";
export {
  type PlanningRepository,
  InMemoryPlanningRepository,
  getDefaultPlanningRepository,
  resetDefaultPlanningRepository,
} from "./planning-repository";
export { PLANNING_MODULE_SPECS } from "./modules/specs";

/* PX-45 — Planning Brain */

export {
  PLANNING_BRAIN_VERSION,
  extractStrategyPlanningContext,
  type PlanningObjective as PlanningBrainObjective,
  type PlanningBrainMilestone,
  type PlanningBrainDependency,
  type PlanningBrainRisk,
  type PlanningBrainDecision,
} from "./brain-types";

export { buildPlanningBrainGraph } from "./planning-brain-graph";
export { validatePlanningBrainGraph, assertNoCreativeGeneration, assertNoExecution, assertNoFabricatedProgress, assertNoCompanyMutation as assertNoPlanningCompanyMutation, containsCreativeLanguage, containsExecutionLanguage } from "./planning-brain-validator";
export { mapPlanningBrainToStructuredOutput, mapPlanningBrainToOutput } from "./map-planning-brain-to-output";
export { PlanningBrainLayer, createPlanningBrainLayer, buildPlanningBrainGraphOutput, resetPlanningBrainLayerCounters } from "./planning-brain-layer";
export { PlanningBrainExecutor, createPlanningBrainExecutor, planningBrainContract } from "./planning-brain-executor";
export { getDefaultPlanningBrainRepository, resetDefaultPlanningBrainRepository, type PlanningBrainRepository } from "./planning-brain-repository";
export { enforcePlanningConfidenceCeiling, planningConfidenceFromInput } from "./planning-confidence";
export { computeInvalidationScope, applyInvalidationTrigger } from "./planning-invalidation";
export { assertNoStrategicDecision, operationalizeBudget } from "./planning-risks";
export { assertNoInventedObjectives } from "./planning-objectives";
export { assertNoFabricatedDates } from "./planning-schedule";

export type {
  PlanningBrainGraph,
  PlanningBrainInput,
  PlanningBrainOutput,
  PlanningBrainPayload,
  CampaignPlan,
  Workstream,
  WorkPackage,
  PlannedDeliverable,
  CreativeBriefInput,
  ApprovalGate,
  PlanningContextGap,
  ProjectPlan,
  PlanningSnapshot,
  PlanningRun,
  PlanningHistory,
} from "./brain-types";
