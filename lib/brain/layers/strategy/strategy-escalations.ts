import type { ReasoningBrainGraph } from "../reasoning/brain-types";
import type { StrategyBrainInput, StrategyEscalation } from "./brain-types";

export function buildStrategyEscalations(input: StrategyBrainInput): StrategyEscalation[] {
  const escalations: StrategyEscalation[] = [];
  const budgetKnown = Boolean(input.availableBudget?.amount);

  if (!budgetKnown) {
    escalations.push({
      id: "esc-budget-missing",
      kind: "budget_missing",
      reason: "Budget is unknown — strategic allocation cannot be finalized with certainty.",
      requiredInput: "Confirmed marketing budget and currency",
      blocking: false,
      recommendedQuestion: "What is the approved marketing budget for this initiative?",
    });
  }

  const blockingReasoning = input.reasoningGraph.escalations.filter((e) => e.requiresCustomerInput);
  for (const esc of blockingReasoning) {
    escalations.push({
      id: `esc-reasoning-${esc.id}`,
      kind: "customer_confirmation_required",
      reason: esc.reason,
      requiredInput: esc.title,
      blocking: true,
      recommendedQuestion: esc.title,
    });
  }

  if (input.reasoningGraph.contradictions.some((c) => c.resolutionStatus === "unresolved")) {
    escalations.push({
      id: "esc-insufficient-evidence",
      kind: "insufficient_evidence",
      reason: "Unresolved contradictions between company truth and research evidence.",
      requiredInput: "Resolution of conflicting claims",
      blocking: true,
      recommendedQuestion: "Which claim should marketing treat as authoritative?",
    });
  }

  const goals = input.businessGoals ?? [];
  const objectives = input.marketingObjectives ?? [];
  if (
    goals.length > 1 &&
    objectives.length > 1 &&
    goals[0]?.toLowerCase().includes("brand") &&
    objectives[0]?.toLowerCase().includes("lead")
  ) {
    escalations.push({
      id: "esc-goal-conflict",
      kind: "goal_conflict",
      reason: "Business goals and marketing objectives may conflict on brand vs demand focus.",
      requiredInput: "Primary goal priority",
      blocking: false,
      recommendedQuestion: "Should we prioritize brand building or lead generation this quarter?",
    });
  }

  return escalations;
}

export function hasBlockingEscalation(escalations: readonly StrategyEscalation[]): boolean {
  return escalations.some((e) => e.blocking);
}
