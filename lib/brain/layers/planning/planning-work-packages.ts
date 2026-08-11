import type { AssignedBrain, PlanningEntityStatus, WorkPackage, Workstream } from "./brain-types";
import type { StrategyPlanningContext } from "./brain-types";

export function buildWorkPackages(input: {
  ctx: StrategyPlanningContext;
  workstreams: readonly Workstream[];
  strategyApprovalRequired: boolean;
}): WorkPackage[] {
  const { strategyApprovalRequired } = input;
  const packages: WorkPackage[] = [];

  for (const ws of input.workstreams) {
    if (ws.name === "Campaign setup") {
      packages.push(
        wp(ws.id, "Define campaign structure and operational checklist", "planning", [
          "PlanningStrategyInput",
          "ChannelStrategy",
        ], ["Campaign structure spec"], strategyApprovalRequired ? ["gate-strategy-review"] : [])
      );
    }
    if (ws.name === "Creative development") {
      packages.push(
        wp(ws.id, "Prepare creative brief package", "creative", ["CreativeBriefInput"], ["Creative brief refs"], [
          "gate-strategy-review",
        ])
      );
      for (const ch of input.ctx.channelStrategy.filter((c) => c.selected)) {
        packages.push(
          wp(
            ws.id,
            `Prepare ${ch.channel} creative brief`,
            "creative",
            ["CreativeBriefInput", ch.channel],
            [`${ch.channel} creative deliverable`],
            ["gate-strategy-review", `wp-brief-${ch.channel}`]
          )
        );
      }
    }
    if (ws.name === "Tracking / measurement") {
      packages.push(
        wp(ws.id, "Prepare analytics tracking requirements", "planning", ["KpiFramework"], [
          "Tracking specification",
        ], ["gate-strategy-review"])
      );
    }
    if (ws.name === "Approval") {
      packages.push(
        wp(ws.id, "Create approval package", "customer", ["ApprovalGate"], ["Approval record"], [
          "gate-strategy-review",
        ], true)
      );
    }
    if (ws.name === "Publishing preparation") {
      packages.push(
        wp(ws.id, "Prepare execution handoff package", "execution", ["ExecutionPreparation"], [
          "Execution instructions draft",
        ], ["gate-validation", "gate-customer-approval"], true)
      );
    }
    if (ws.name.includes("channel setup")) {
      const channel = ws.name.replace(" channel setup", "");
      packages.push(
        wp(
          ws.id,
          `Prepare ${channel} campaign structure`,
          ws.ownerType as AssignedBrain,
          [channel, "ChannelStrategy"],
          [`${channel} operational setup`],
          ["gate-strategy-review", "wp-tracking"]
        )
      );
    }
  }

  return packages.map((p, i) => ({ ...p, id: p.id || `wp-${i + 1}` }));
}

function wp(
  workstreamId: string,
  title: string,
  assignedBrain: AssignedBrain | "planning",
  inputs: string[],
  outputs: string[],
  deps: string[],
  approvalRequired = false
): WorkPackage {
  return {
    id: "",
    workstreamId,
    title,
    purpose: title,
    inputs,
    expectedOutputs: outputs,
    dependencies: deps.filter((d) => !d.startsWith("wp-")),
    blockingDependencies: deps,
    estimatedComplexity: "medium",
    approvalRequired,
    status: "NOT_STARTED",
    assignedBrain,
    handoffTarget: assignedBrain === "creative" ? "validation" : assignedBrain === "planning" ? "creative" : null,
  };
}

export function assignWorkPackageIds(packages: WorkPackage[]): WorkPackage[] {
  return packages.map((p, i) => ({
    ...p,
    id: p.id || `wp-${i + 1}`,
  }));
}
