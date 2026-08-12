import type { AcquiredContextItem, ContextAcquisitionBudget } from "../types";

export function applyContextBudget(
  items: readonly AcquiredContextItem[],
  budget: ContextAcquisitionBudget
): { items: AcquiredContextItem[]; truncated: boolean } {
  const capped = items.slice(0, budget.maxTotalItems);
  return {
    items: capped,
    truncated: capped.length < items.length,
  };
}
