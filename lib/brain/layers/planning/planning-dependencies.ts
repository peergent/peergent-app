import type { ApprovalGate, PlanningBrainDependency, WorkPackage } from "./brain-types";

export function buildPlanningDependencies(input: {
  workPackages: readonly WorkPackage[];
  approvalGates: readonly ApprovalGate[];
  deliverableIds: readonly string[];
}): PlanningBrainDependency[] {
  const deps: PlanningBrainDependency[] = [];
  let counter = 0;
  const id = () => `dep-${++counter}`;

  const strategyGate = input.approvalGates.find((g) => g.kind === "strategy_review");
  if (strategyGate) {
    for (const wp of input.workPackages) {
      if (wp.title.toLowerCase().includes("creative") || wp.title.toLowerCase().includes("campaign structure")) {
        deps.push({
          id: id(),
          type: "approval_dependency",
          fromRef: strategyGate.id,
          toRef: wp.id,
          reason: "Creative cannot start until Strategy approval.",
          blocking: true,
        });
      }
    }
  }

  const validationGate = input.approvalGates.find((g) => g.kind === "creative_review");
  const execGate = input.approvalGates.find((g) => g.kind === "publish_approval");
  if (validationGate && execGate) {
    deps.push({
      id: id(),
      type: "execution_dependency",
      fromRef: validationGate.id,
      toRef: execGate.id,
      reason: "Execution cannot start until Validation + customer approval.",
      blocking: true,
    });
  }

  const trackingWp = input.workPackages.find((w) => w.title.includes("tracking"));
  const channelWps = input.workPackages.filter((w) => w.title.includes("campaign structure"));
  for (const chWp of channelWps) {
    if (trackingWp) {
      deps.push({
        id: id(),
        type: "depends_on",
        fromRef: trackingWp.id,
        toRef: chWp.id,
        reason: "Channel launch depends on conversion tracking.",
        blocking: true,
      });
    }
  }

  for (const wp of input.workPackages) {
    for (const dep of wp.blockingDependencies) {
      if (dep.startsWith("gate-")) {
        deps.push({
          id: id(),
          type: "requires",
          fromRef: dep,
          toRef: wp.id,
          reason: `Work package requires ${dep}`,
          blocking: true,
        });
      }
    }
  }

  return deps;
}
