import type { PlanningBrainRisk, PlanningContextGap, ResourceAssumption } from "./brain-types";
import type { StrategyPlanningContext } from "./brain-types";
import { enforcePlanningConfidenceCeiling } from "./planning-confidence";

export function buildPlanningRisks(input: {
  ctx: StrategyPlanningContext;
  contextGaps: readonly PlanningContextGap[];
  resources: readonly ResourceAssumption[];
  upstreamConfidence: "low" | "medium" | "high";
}): PlanningBrainRisk[] {
  const risks: PlanningBrainRisk[] = [];

  if (input.contextGaps.some((g) => g.id === "gap-budget")) {
    risks.push(risk("Budget timing risk", "medium", "high", "Paid launch work", "May delay channel activation", "Confirm budget before scheduling paid work", input.upstreamConfidence));
  }

  if (input.contextGaps.some((g) => g.id === "gap-analytics")) {
    risks.push(risk("Tracking not ready", "high", "high", "All conversion deliverables", "Cannot measure KPI framework", "Complete tracking setup before launch", input.upstreamConfidence));
  }

  if (input.resources.some((r) => r.blocking)) {
    risks.push(risk("Missing integration", "medium", "high", "Channel setup packages", "Blocks execution handoff", "Resolve resource assumptions early", input.upstreamConfidence));
  }

  risks.push(risk("Approval delay", "medium", "medium", "Creative and launch milestones", "Shifts relative schedule", "Front-load approval package preparation", input.upstreamConfidence));
  risks.push(risk("Dependency bottleneck", "medium", "medium", "Critical path work packages", "Sequential work may stack", "Parallelize independent creative briefs where possible", input.upstreamConfidence));

  for (const sr of input.ctx.risks.slice(0, 2)) {
    risks.push({
      id: `plan-risk-strat-${sr.id}`,
      description: sr.description,
      likelihood: sr.likelihood,
      severity: sr.severity === "critical" ? "high" : sr.severity === "high" ? "high" : "medium",
      affectedWork: ["Campaign execution"],
      scheduleImpact: "May affect milestone timing",
      businessImpact: sr.impact,
      mitigationOption: sr.mitigationDirection,
      confidence: enforcePlanningConfidenceCeiling(sr.confidence, [input.upstreamConfidence]),
    });
  }

  return risks;
}

function risk(
  description: string,
  likelihood: "high" | "medium" | "low",
  severity: "high" | "medium" | "low",
  affectedWork: string,
  scheduleImpact: string,
  mitigation: string,
  upstream: "low" | "medium" | "high"
): PlanningBrainRisk {
  return {
    id: `plan-risk-${description.toLowerCase().replace(/\s+/g, "-")}`,
    description,
    likelihood,
    severity,
    affectedWork: [affectedWork],
    scheduleImpact,
    businessImpact: scheduleImpact,
    mitigationOption: mitigation,
    confidence: enforcePlanningConfidenceCeiling("medium", [upstream]),
  };
}

export function buildOperationalDecisions(input: {
  parallelGroupCount: number;
}): import("./brain-types").PlanningBrainDecision[] {
  const decisions: import("./brain-types").PlanningBrainDecision[] = [
    {
      id: "plan-dec-sequence-approval",
      decision: "Schedule strategy approval before creative production",
      reason: "Creative briefs depend on approved strategic direction",
      constraints: ["Strategy approval gate"],
      dependencies: ["gate-strategy-review"],
      impact: "Prevents creative rework from strategy drift",
      reversible: true,
      confidence: "high",
    },
  ];

  if (input.parallelGroupCount > 0) {
    decisions.push({
      id: "plan-dec-parallel-briefs",
      decision: "Parallelize independent channel creative briefs after strategy approval",
      reason: "Briefs do not depend on each other",
      constraints: ["Shared strategy approval"],
      dependencies: ["gate-strategy-review"],
      impact: "Reduces time-to-creative-start",
      reversible: true,
      confidence: "medium",
    });
  }

  return decisions;
}

const BLOCKED_STRATEGIC_PATTERNS = [
  /\bnew target audience\b/i,
  /\breposition\b/i,
  /\bchange channel mix\b/i,
  /\breallocate budget\b/i,
  /\bnew kpi framework\b/i,
  /\bnew marketing objective\b/i,
];

export function assertNoStrategicDecision(text: string): void {
  for (const p of BLOCKED_STRATEGIC_PATTERNS) {
    if (p.test(text)) {
      throw new Error(`Planning attempted strategic decision: ${text}`);
    }
  }
}

export function operationalizeBudget(input: {
  ctx: StrategyPlanningContext;
  campaignIds: readonly string[];
}): { labels: string[]; escalation: boolean } {
  const allocation = input.ctx.budgetStrategy.allocation;
  if (input.ctx.budgetStrategy.budgetRequired) {
    return { labels: allocation.map((a) => `${a.channelOrCategory}: relative weight per strategy`), escalation: false };
  }
  const total = input.ctx.budgetStrategy.totalBudget ?? 0;
  const labels = allocation.map((a) => {
    const amount = a.percentageMin != null ? Math.round((total * a.percentageMin) / 100) : null;
    return `${a.channelOrCategory} operational budget: ${amount ?? "TBD"} ${input.ctx.budgetStrategy.currency ?? ""}`.trim();
  });
  return { labels, escalation: false };
}
