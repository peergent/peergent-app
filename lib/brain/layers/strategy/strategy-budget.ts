import type { ChannelStrategy, BudgetStrategy, StrategyConfidence } from "./brain-types";
import { enforceStrategyConfidenceCeiling } from "./strategy-confidence";

export function buildBudgetStrategy(input: {
  availableBudget?: { amount: number; currency: string } | null;
  channelStrategy: readonly ChannelStrategy[];
  constraints?: readonly string[];
  upstreamConfidence: StrategyConfidence;
}): BudgetStrategy {
  const selected = input.channelStrategy.filter((c) => c.selected);
  const budgetKnown = Boolean(input.availableBudget?.amount);

  if (!budgetKnown) {
    const allocations = selected.map((ch) => ({
      channelOrCategory: ch.channel,
      percentageMin: ch.priority === "high" ? 40 : ch.priority === "medium" ? 15 : null,
      percentageMax: ch.priority === "high" ? 60 : ch.priority === "medium" ? 30 : null,
      rationale: `Relative weight for ${ch.role} based on channel role and intent fit.`,
      confidence: enforceStrategyConfidenceCeiling("low", [input.upstreamConfidence]),
    }));
    return {
      totalBudget: null,
      currency: null,
      budgetRequired: true,
      allocation: allocations,
      reserve: "15–20% testing reserve recommended once budget is confirmed",
      testBudget: "Hold for channel validation experiments",
      scalingRules: ["Scale winning intent channels before expanding awareness spend"],
      constraints: input.constraints ?? [],
      confidence: enforceStrategyConfidenceCeiling("low", [input.upstreamConfidence]),
    };
  }

  const total = input.availableBudget!.amount;
  const currency = input.availableBudget!.currency;
  const weights = selected.map((ch) => (ch.priority === "high" ? 0.5 : ch.priority === "medium" ? 0.25 : 0.1));
  const weightSum = weights.reduce((a, b) => a + b, 0) || 1;
  const reservePct = 0.15;

  const allocation = selected.map((ch, i) => {
    const pct = Math.round((weights[i]! / weightSum) * (1 - reservePct) * 100);
    return {
      channelOrCategory: ch.channel,
      percentageMin: pct,
      percentageMax: pct,
      rationale: `Strategic allocation for ${ch.role} — ${ch.reason}`,
      confidence: enforceStrategyConfidenceCeiling(ch.confidence, [input.upstreamConfidence]),
    };
  });

  return {
    totalBudget: total,
    currency,
    budgetRequired: false,
    allocation,
    reserve: `${Math.round(total * reservePct)} ${currency} (${Math.round(reservePct * 100)}%)`,
    testBudget: `${Math.round(total * 0.1)} ${currency} for initial channel tests`,
    scalingRules: [
      "Increase spend on channels meeting qualified lead targets",
      "Pause underperforming channels after review threshold breach",
    ],
    constraints: input.constraints ?? [],
    confidence: enforceStrategyConfidenceCeiling("medium", [input.upstreamConfidence]),
  };
}
