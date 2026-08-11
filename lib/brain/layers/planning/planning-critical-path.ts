import type { CriticalPath, PlanningBrainDependency, PlanningBrainMilestone, WorkPackage } from "./brain-types";

export function calculateCriticalPath(input: {
  workPackages: readonly WorkPackage[];
  milestones: readonly PlanningBrainMilestone[];
  dependencies: readonly PlanningBrainDependency[];
  hasExactDates: boolean;
}): CriticalPath {
  const blocking = input.dependencies.filter((d) => d.blocking).map((d) => d.id);
  const blockingWps = input.workPackages.filter((wp) =>
    input.dependencies.some((d) => d.toRef === wp.id && d.blocking)
  );
  const blockingMs = input.milestones.filter((m) => m.blocking);

  const criticalWps = blockingWps.length > 0 ? blockingWps.map((w) => w.id) : input.workPackages.slice(0, 3).map((w) => w.id);
  const criticalMs = blockingMs.map((m) => m.id);

  return {
    criticalPathWorkPackages: criticalWps,
    criticalPathMilestones: criticalMs,
    blockingDependencies: blocking,
    scheduleRisk: input.hasExactDates
      ? "Timeline depends on approval and integration readiness"
      : "Sequence-only planning — timeline precision unknown until deadlines confirmed",
  };
}
