import type { ApprovalGate, PlanningEntityStatus, PlannedDeliverable, WorkPackage } from "./brain-types";
import type { StrategyPlanningContext } from "./brain-types";

export function buildApprovalGates(input: {
  ctx: StrategyPlanningContext;
  workPackages: readonly WorkPackage[];
  deliverables: readonly PlannedDeliverable[];
}): ApprovalGate[] {
  const gates: ApprovalGate[] = [];

  if (input.ctx.approval.requiresApproval) {
    gates.push({
      id: "gate-strategy-review",
      kind: input.ctx.approval.approvalKind ?? "strategy_review",
      reason: input.ctx.approval.approvalReason ?? "Strategy review required before execution planning",
      requiredBefore: "Creative production",
      relatedWorkPackageIds: input.workPackages.filter((w) => !w.title.includes("Campaign setup")).map((w) => w.id),
      relatedDeliverableIds: input.deliverables.map((d) => d.id),
      blocking: true,
      status: "NOT_STARTED",
      decisionRefs: input.ctx.approval.decisionIds,
    });
  }

  gates.push({
    id: "gate-creative-review",
    kind: "creative_review",
    reason: "Creative deliverables require review before validation",
    requiredBefore: "Validation",
    relatedWorkPackageIds: input.workPackages.filter((w) => w.assignedBrain === "creative").map((w) => w.id),
    relatedDeliverableIds: input.deliverables.map((d) => d.id),
    blocking: true,
    status: "NOT_STARTED",
    decisionRefs: [],
  });

  gates.push({
    id: "gate-customer-approval",
    kind: "campaign_approval",
    reason: "Customer approval required before publication",
    requiredBefore: "Execution",
    relatedWorkPackageIds: input.workPackages.filter((w) => w.approvalRequired).map((w) => w.id),
    relatedDeliverableIds: input.deliverables.filter((d) => d.approvalRequired).map((d) => d.id),
    blocking: true,
    status: "NOT_STARTED",
    decisionRefs: [],
  });

  gates.push({
    id: "gate-validation",
    kind: "creative_review",
    reason: "Validation must pass before execution",
    requiredBefore: "Execution",
    relatedWorkPackageIds: [],
    relatedDeliverableIds: input.deliverables.filter((d) => d.validationRequired).map((d) => d.id),
    blocking: true,
    status: "NOT_STARTED",
    decisionRefs: [],
  });

  gates.push({
    id: "gate-publish-approval",
    kind: "publish_approval",
    reason: "Publication requires validated assets and approvals",
    requiredBefore: "Campaign launch",
    relatedWorkPackageIds: input.workPackages.filter((w) => w.assignedBrain === "execution").map((w) => w.id),
    relatedDeliverableIds: input.deliverables.filter((d) => d.executionRequired).map((d) => d.id),
    blocking: true,
    status: "NOT_STARTED",
    decisionRefs: [],
  });

  if (input.ctx.budgetStrategy.budgetRequired) {
    gates.push({
      id: "gate-budget-approval",
      kind: "budget_approval",
      reason: "Budget confirmation required before paid channel execution",
      requiredBefore: "Paid channel launch",
      relatedWorkPackageIds: input.workPackages
        .filter((w) => w.title.toLowerCase().includes("google") || w.title.toLowerCase().includes("paid"))
        .map((w) => w.id),
      relatedDeliverableIds: input.deliverables.filter((d) => d.executionRequired).map((d) => d.id),
      blocking: true,
      status: "NOT_STARTED",
      decisionRefs: [],
    });
  }

  return gates;
}

export function buildReviewCheckpoints(input: {
  timeHorizon: string;
  scheduledWindow: string | null;
}): import("./brain-types").ReviewCheckpoint[] {
  return [
    {
      id: "rc-creative-review",
      purpose: "Creative review",
      trigger: "Creative deliverables complete",
      requiredInputs: ["Creative deliverables", "CreativeBriefInput"],
      expectedDecision: "Proceed to validation or request revisions",
      scheduledWindow: "After creative production",
      responsibleBrainOrUser: "Validation Brain",
    },
    {
      id: "rc-pre-launch",
      purpose: "Pre-launch validation",
      trigger: "Validation passed",
      requiredInputs: ["Validated assets", "Approval gates"],
      expectedDecision: "Ready for publication",
      scheduledWindow: input.scheduledWindow,
      responsibleBrainOrUser: "Customer",
    },
    {
      id: "rc-post-launch",
      purpose: "Post-launch 7-day review",
      trigger: "Campaign launched",
      requiredInputs: ["Performance data", "KPI framework"],
      expectedDecision: "Continue, optimize, or pause",
      scheduledWindow: "7 days after launch",
      responsibleBrainOrUser: "Marketing leadership",
    },
  ];
}
