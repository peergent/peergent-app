import type { PlanInvalidationScope, PlanningBrainGraph } from "./brain-types";

export type InvalidationInput = {
  trigger: string;
  reason: string;
  graph: PlanningBrainGraph;
};

export function computeInvalidationScope(input: InvalidationInput): PlanInvalidationScope {
  const { trigger, reason, graph } = input;

  switch (trigger) {
    case "strategy_change":
      return {
        trigger,
        reason,
        campaignIds: graph.campaignPlans.map((c) => c.id),
        workstreamIds: graph.workstreams.map((w) => w.id),
        workPackageIds: graph.workPackages.map((w) => w.id),
        deliverableIds: graph.deliverables.map((d) => d.id),
        scheduleWindowIds: graph.scheduleWindows.map((s) => s.id),
      };
    case "budget_change":
      return {
        trigger,
        reason,
        campaignIds: graph.campaignPlans.map((c) => c.id),
        workstreamIds: graph.workstreams.filter((w) => w.name.includes("channel")).map((w) => w.id),
        workPackageIds: graph.workPackages.filter((w) => w.title.includes("campaign structure")).map((w) => w.id),
        deliverableIds: graph.deliverables.filter((d) => d.executionRequired).map((d) => d.id),
        scheduleWindowIds: [],
      };
    case "approval_rejected":
      return {
        trigger,
        reason,
        campaignIds: [],
        workstreamIds: graph.workstreams.filter((w) => w.name === "Approval").map((w) => w.id),
        workPackageIds: graph.workPackages.filter((w) => w.approvalRequired).map((w) => w.id),
        deliverableIds: [],
        scheduleWindowIds: graph.scheduleWindows.filter((s) => s.relativeStart?.includes("After")).map((s) => s.id),
      };
    case "deadline_change":
      return {
        trigger,
        reason,
        campaignIds: graph.campaignPlans.map((c) => c.id),
        workstreamIds: [],
        workPackageIds: [],
        deliverableIds: [],
        scheduleWindowIds: graph.scheduleWindows.map((s) => s.id),
      };
    default:
      return {
        trigger,
        reason,
        campaignIds: [],
        workstreamIds: [],
        workPackageIds: [],
        deliverableIds: [],
        scheduleWindowIds: [],
      };
  }
}

export function applyInvalidationTrigger(
  graph: PlanningBrainGraph,
  trigger: string | null | undefined,
  reason: string
): readonly PlanInvalidationScope[] {
  if (!trigger) return graph.invalidationScopes;
  const scope = computeInvalidationScope({ trigger, reason, graph });
  return [...graph.invalidationScopes, scope];
}
