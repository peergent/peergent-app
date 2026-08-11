import type {
  CampaignPlan,
  PlanningConfidence,
  PlanningEntityStatus,
  PlanningObjective,
} from "./brain-types";
import type { StrategyPlanningContext } from "./brain-types";
import { enforcePlanningConfidenceCeiling } from "./planning-confidence";

export function buildCampaignPlans(input: {
  ctx: StrategyPlanningContext;
  objectives: readonly PlanningObjective[];
  startWindow: string | null;
  endWindow: string | null;
  upstreamConfidence: PlanningConfidence;
}): CampaignPlan[] {
  return input.objectives.map((obj, index) => {
    const channels = input.ctx.channelStrategy.filter((c) => c.selected);
    const channelRoles = channels.map((c) => `${c.channel}: ${c.role}`);
    const audience =
      input.ctx.audienceStrategy
        .filter((a) => a.priority === "primary" || a.priority === "secondary")
        .map((a) => a.segment) || input.ctx.planningInput.selectedAudiences;

    const campaignId = `camp-plan-${obj.strategyObjectiveId}`;
    return {
      id: campaignId,
      name: `Campaign plan — ${obj.objective}`,
      objective: obj.objective,
      audience,
      channelRoles,
      businessOutcome: obj.businessOutcome,
      successMetrics: [obj.successMetric, ...input.ctx.kpis.slice(0, 2)],
      startWindow: input.startWindow,
      endWindow: input.endWindow,
      status: "NOT_STARTED" as PlanningEntityStatus,
      priority: obj.priority,
      dependencies: obj.dependencies,
      approvalRequirements: input.ctx.approval.requiresApproval
        ? [input.ctx.approval.approvalReason ?? "strategy_review"]
        : [],
      milestoneIds: [],
      workstreamIds: [],
      deliverableIds: [],
      creativeBriefRefs: [],
      executionPreparationRefs: [],
      confidence: enforcePlanningConfidenceCeiling(obj.confidence, [input.upstreamConfidence]),
    };
  });
}
