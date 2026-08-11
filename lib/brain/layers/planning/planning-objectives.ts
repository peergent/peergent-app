import type { CampaignObjective, PlanningObjective, PlanningConfidence } from "./brain-types";
import type { StrategyPlanningContext } from "./brain-types";
import { enforcePlanningConfidenceCeiling } from "./planning-confidence";

export function buildPlanningObjectives(input: {
  ctx: StrategyPlanningContext;
  upstreamConfidence: PlanningConfidence;
}): PlanningObjective[] {
  const objectives = input.ctx.campaignObjectives.map((obj) => toPlanningObjective(obj, input));
  if (objectives.length === 0) {
    return input.ctx.planningInput.selectedObjectives.map((objective, i) => ({
      id: `plan-obj-fallback-${i}`,
      strategyObjectiveId: `strategy-obj-${i}`,
      objective,
      businessOutcome: objective,
      successMetric: input.ctx.kpis[0] ?? "Qualified leads",
      priority: i === 0 ? "high" : "medium",
      timeHorizon: input.ctx.planningInput.timeHorizon,
      dependencies: input.ctx.planningInput.dependencies,
      constraints: input.ctx.planningInput.constraints,
      confidence: enforcePlanningConfidenceCeiling(input.ctx.planningInput.confidence, [
        input.upstreamConfidence,
      ]),
    }));
  }
  return objectives;
}

function toPlanningObjective(
  obj: CampaignObjective,
  input: { ctx: StrategyPlanningContext; upstreamConfidence: PlanningConfidence }
): PlanningObjective {
  return {
    id: `plan-obj-${obj.id}`,
    strategyObjectiveId: obj.id,
    objective: obj.objective,
    businessOutcome: obj.businessOutcome,
    successMetric: obj.successMetric,
    priority: obj.priority,
    timeHorizon: obj.timeHorizon,
    dependencies: obj.dependencies,
    constraints: input.ctx.planningInput.constraints,
    confidence: enforcePlanningConfidenceCeiling(obj.confidence, [input.upstreamConfidence]),
  };
}

export function assertNoInventedObjectives(
  objectives: readonly PlanningObjective[],
  allowedObjectiveTexts: readonly string[],
  allowedStrategyObjectiveIds: readonly string[]
): void {
  const allowedTexts = new Set(allowedObjectiveTexts);
  const allowedIds = new Set(allowedStrategyObjectiveIds);
  for (const obj of objectives) {
    if (!allowedIds.has(obj.strategyObjectiveId) && !allowedTexts.has(obj.objective)) {
      throw new Error(`Planning invented strategic objective: ${obj.objective}`);
    }
  }
}
