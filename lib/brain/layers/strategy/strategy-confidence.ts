import type { StrategyConfidence } from "./brain-types";

const ORDER: StrategyConfidence[] = ["low", "medium", "high"];

export function minStrategyConfidence(...values: StrategyConfidence[]): StrategyConfidence {
  if (values.length === 0) return "low";
  return values.reduce((min, v) => (ORDER.indexOf(v) < ORDER.indexOf(min) ? v : min));
}

export function enforceStrategyConfidenceCeiling(
  proposed: StrategyConfidence,
  upstream: readonly StrategyConfidence[]
): StrategyConfidence {
  const ceiling = minStrategyConfidence(...upstream);
  return ORDER.indexOf(proposed) <= ORDER.indexOf(ceiling) ? proposed : ceiling;
}

export function confidenceFromUpstream(input: {
  company?: StrategyConfidence;
  research?: StrategyConfidence;
  reasoning?: StrategyConfidence;
  marketingIntelligence?: StrategyConfidence;
  assumptionCount?: number;
  budgetKnown?: boolean;
}): StrategyConfidence {
  const upstream = [
    input.company ?? "low",
    input.research ?? "low",
    input.reasoning ?? "low",
    input.marketingIntelligence ?? "low",
  ];
  let base = minStrategyConfidence(...upstream);
  if ((input.assumptionCount ?? 0) > 4 && base === "high") base = "medium";
  if (!input.budgetKnown && base === "high") base = "medium";
  return base;
}
