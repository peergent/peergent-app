export type BrainTokenBudget = {
  maxTokens: number;
  reservedTokens: number;
  consumedTokens: number;
};

export type BrainContextProjection = {
  /** Stable hash of projected context slices — avoids resending full website/brand/business every run. */
  contextHash: string;
  includedSlices: readonly string[];
  excludedSlices: readonly string[];
  estimatedTokens: number;
};

export function createTokenBudget(maxTokens: number): BrainTokenBudget {
  return { maxTokens, reservedTokens: 0, consumedTokens: 0 };
}

export function projectContextBudget(
  budget: BrainTokenBudget,
  projection: BrainContextProjection
): { allowed: boolean; remaining: number } {
  const remaining = budget.maxTokens - budget.consumedTokens - budget.reservedTokens;
  return {
    allowed: projection.estimatedTokens <= remaining,
    remaining,
  };
}

export function hashContextSlices(slices: readonly string[]): string {
  return `ctx-${[...slices].sort().join("|")}`;
}
