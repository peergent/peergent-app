/**
 * Planning Brain — graph builder orchestrator.
 */

import type {
  CampaignPlan,
  PlanningBrainGraph,
  PlanningBrainInput,
  PlanningSummary,
  ProjectPlan,
} from "./brain-types";
import { PLANNING_BRAIN_VERSION, extractStrategyPlanningContext } from "./brain-types";
import { buildPlanningObjectives } from "./planning-objectives";
import { buildCampaignPlans } from "./planning-campaigns";
import { buildWorkstreams } from "./planning-workstreams";
import { assignWorkPackageIds, buildWorkPackages } from "./planning-work-packages";
import { buildMilestones } from "./planning-milestones";
import { buildDeliverables } from "./planning-deliverables";
import { buildPlanningDependencies } from "./planning-dependencies";
import { calculateCriticalPath } from "./planning-critical-path";
import { identifyParallelism } from "./planning-parallelism";
import { buildScheduleWindows } from "./planning-schedule";
import { buildApprovalGates, buildReviewCheckpoints } from "./planning-approvals";
import { buildContextGaps, buildPlanningEscalations, buildResourceAssumptions } from "./planning-resources";
import { buildOperationalDecisions, buildPlanningRisks, operationalizeBudget } from "./planning-risks";
import {
  buildExecutionPreparations,
  buildBudgetOperationalLabels,
  MEMORY_CHECKPOINT_RECOMMENDATIONS,
} from "./planning-context-gaps";
import { applyInvalidationTrigger } from "./planning-invalidation";
import { planningConfidenceFromInput } from "./planning-confidence";

export function buildPlanningBrainGraph(input: PlanningBrainInput): PlanningBrainGraph {
  const createdAt = new Date().toISOString();
  const ctx = extractStrategyPlanningContext(input.strategyGraph);
  const upstreamConfidence = ctx.planningInput.confidence;

  const schedule = buildScheduleWindows({
    customerDeadline: input.customerDeadline,
    timeHorizon: ctx.planningInput.timeHorizon,
    upstreamConfidence,
  });

  const planningObjectives = buildPlanningObjectives({ ctx, upstreamConfidence });
  const campaignPlans = buildCampaignPlans({
    ctx,
    objectives: planningObjectives,
    startWindow: schedule.startWindow,
    endWindow: schedule.endWindow,
    upstreamConfidence,
  });

  let allWorkstreams: import("./brain-types").Workstream[] = [];
  let allWorkPackages: import("./brain-types").WorkPackage[] = [];
  let allMilestones: import("./brain-types").PlanningBrainMilestone[] = [];
  let allDeliverables: import("./brain-types").PlannedDeliverable[] = [];
  let allBriefs: import("./brain-types").CreativeBriefInput[] = [];

  for (const campaign of campaignPlans) {
    const milestones = buildMilestones({
      campaignId: campaign.id,
      targetWindow: schedule.endWindow ?? ctx.planningInput.timeHorizon,
    });
    const workstreams = buildWorkstreams({
      ctx,
      campaignId: campaign.id,
      startWindow: schedule.startWindow,
      endWindow: schedule.endWindow,
    });
    const workPackages = assignWorkPackageIds(
      buildWorkPackages({
        ctx,
        workstreams,
        strategyApprovalRequired: ctx.approval.requiresApproval,
      })
    );
    const { deliverables, briefs } = buildDeliverables({
      ctx,
      campaignId: campaign.id,
      upstreamConfidence,
    });

    allMilestones = [...allMilestones, ...milestones];
    allWorkstreams = [...allWorkstreams, ...workstreams];
    allWorkPackages = [...allWorkPackages, ...workPackages];
    allDeliverables = [...allDeliverables, ...deliverables];
    allBriefs = [...allBriefs, ...briefs];
  }

  const enrichedCampaigns: CampaignPlan[] = campaignPlans.map((c) => ({
    ...c,
    milestoneIds: allMilestones.filter((m) => m.campaignId === c.id).map((m) => m.id),
    workstreamIds: allWorkstreams.filter((w) => w.campaignId === c.id).map((w) => w.id),
    deliverableIds: allDeliverables.filter((d) => d.campaignId === c.id).map((d) => d.id),
    creativeBriefRefs: allBriefs.filter((b) =>
      allDeliverables.some((d) => d.campaignId === c.id && d.creativeBriefInputId === b.id)
    ).map((b) => b.id),
  }));

  const approvalGates = buildApprovalGates({
    ctx,
    workPackages: allWorkPackages,
    deliverables: allDeliverables,
  });

  const dependencies = buildPlanningDependencies({
    workPackages: allWorkPackages,
    approvalGates,
    deliverableIds: allDeliverables.map((d) => d.id),
  });

  const parallelGroups = identifyParallelism({
    workPackages: allWorkPackages,
    strategyApprovedGateId: "gate-strategy-review",
  });

  const criticalPath = calculateCriticalPath({
    workPackages: allWorkPackages,
    milestones: allMilestones,
    dependencies,
    hasExactDates: schedule.windows.some((w) => w.source === "customer_deadline"),
  });

  const resources = buildResourceAssumptions({
    ctx,
    workPackageIds: allWorkPackages.map((w) => w.id),
  });

  const contextGaps = buildContextGaps({ ctx, resources });
  const escalations = buildPlanningEscalations(contextGaps);

  const planningRisks = buildPlanningRisks({
    ctx,
    contextGaps,
    resources,
    upstreamConfidence,
  });

  const planningDecisions = buildOperationalDecisions({
    parallelGroupCount: parallelGroups.parallelGroups.length,
  });

  const executionPreparations = buildExecutionPreparations({
    ctx,
    deliverables: allDeliverables,
    scheduleWindow: schedule.endWindow ?? ctx.planningInput.timeHorizon,
  });

  void operationalizeBudget({ ctx, campaignIds: enrichedCampaigns.map((c) => c.id) });
  void buildBudgetOperationalLabels({ ctx });

  const confidence = planningConfidenceFromInput({
    strategyConfidence: upstreamConfidence,
    hasDeadline: schedule.windows.some((w) => w.source === "customer_deadline"),
    budgetKnown: !ctx.budgetStrategy.budgetRequired,
    contextGapCount: contextGaps.length,
    blockingResourceCount: resources.filter((r) => r.blocking).length,
  });

  const projectPlan: ProjectPlan = {
    id: `project-plan-${input.organizationId}`,
    organizationId: input.organizationId,
    projectId: input.projectId,
    campaignIds: enrichedCampaigns.map((c) => c.id),
    objectiveSummary: input.projectObjective ?? ctx.planningInput.selectedObjectives[0] ?? "Execute strategy",
    timeHorizon: ctx.planningInput.timeHorizon,
    status: "NOT_STARTED",
  };

  const summary: PlanningSummary = {
    numberOfCampaigns: enrichedCampaigns.length,
    numberOfWorkstreams: allWorkstreams.length,
    numberOfWorkPackages: allWorkPackages.length,
    numberOfDeliverables: allDeliverables.length,
    numberOfMilestones: allMilestones.length,
    numberOfApprovalGates: approvalGates.length,
    blockingDependencies: dependencies.filter((d) => d.blocking).length,
    contextGaps: contextGaps.length,
    criticalPathLength: criticalPath.criticalPathWorkPackages.length,
    estimatedPlanningWindow: schedule.endWindow ?? ctx.planningInput.timeHorizon,
    confidence,
  };

  const baseGraph: PlanningBrainGraph = {
    version: PLANNING_BRAIN_VERSION,
    organizationId: input.organizationId,
    projectId: input.projectId,
    campaignId: input.campaignId,
    createdAt,
    updatedAt: createdAt,
    strategyVersionRef: input.strategyGraph.version,
    changeReason: input.changeReason ?? "Planning brain run",
    supersedes: input.supersedesSnapshotId ?? null,
    strategyInput: ctx.planningInput,
    planningObjectives,
    projectPlan,
    campaignPlans: enrichedCampaigns.map((c) => ({
      ...c,
      executionPreparationRefs: executionPreparations
        .filter((e) => c.deliverableIds.includes(e.deliverableId))
        .map((e) => e.id),
    })),
    workstreams: allWorkstreams.map((ws) => ({
      ...ws,
      milestoneIds: allMilestones.filter((m) => m.campaignId === ws.campaignId).map((m) => m.id),
      workPackageIds: allWorkPackages.filter((wp) => wp.workstreamId === ws.id).map((wp) => wp.id),
    })),
    workPackages: allWorkPackages,
    milestones: allMilestones,
    deliverables: allDeliverables,
    dependencies,
    criticalPath,
    parallelGroups,
    scheduleWindows: schedule.windows,
    approvalGates,
    reviewCheckpoints: buildReviewCheckpoints({
      timeHorizon: ctx.planningInput.timeHorizon,
      scheduledWindow: schedule.endWindow,
    }),
    resourceAssumptions: resources,
    contextGaps,
    escalations,
    planningRisks,
    planningDecisions,
    creativeBriefInputs: allBriefs,
    executionPreparations,
    memoryCheckpointRecommendations: [...MEMORY_CHECKPOINT_RECOMMENDATIONS],
    invalidationScopes: [],
    summary,
    confidence,
  };

  return {
    ...baseGraph,
    invalidationScopes: applyInvalidationTrigger(
      baseGraph,
      input.invalidationTrigger,
      input.changeReason ?? "Invalidation trigger"
    ),
  };
}

export type { PlanningBrainInput };
