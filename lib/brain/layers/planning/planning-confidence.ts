import type { PlanningConfidence } from "./brain-types";

const ORDER: PlanningConfidence[] = ["low", "medium", "high"];

export function minPlanningConfidence(...values: PlanningConfidence[]): PlanningConfidence {
  if (values.length === 0) return "low";
  return values.reduce((min, v) => (ORDER.indexOf(v) < ORDER.indexOf(min) ? v : min));
}

export function enforcePlanningConfidenceCeiling(
  proposed: PlanningConfidence,
  upstream: readonly PlanningConfidence[]
): PlanningConfidence {
  const ceiling = minPlanningConfidence(...upstream);
  return ORDER.indexOf(proposed) <= ORDER.indexOf(ceiling) ? proposed : ceiling;
}

export function planningConfidenceFromInput(input: {
  strategyConfidence: PlanningConfidence;
  hasDeadline: boolean;
  budgetKnown: boolean;
  contextGapCount: number;
  blockingResourceCount: number;
}): PlanningConfidence {
  let base = input.strategyConfidence;
  if (!input.hasDeadline && base === "high") base = "medium";
  if (!input.budgetKnown) base = minPlanningConfidence(base, "medium");
  if (input.contextGapCount > 0) base = minPlanningConfidence(base, "medium");
  if (input.blockingResourceCount > 2) base = "low";
  return base;
}
