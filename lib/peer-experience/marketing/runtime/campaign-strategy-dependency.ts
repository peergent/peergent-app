import type { MarketingStrategy } from "@/lib/marketing-intelligence";
import type { WorkUnit } from "@/lib/peer-workflow/work-unit";

import { CAMPAIGN_STRATEGY_EXECUTION_COMPLETE_NOTE } from "./execute-marketing-work-unit";
import {
  findCampaignStrategyWorkUnit,
  isCampaignStrategyWorkUnitReviewReady,
} from "./identify-work-unit";

/**
 * Strategy is satisfied for downstream autonomous work when the strategy work unit
 * has reached review_ready (terminal for generation), or legacy completion signals apply.
 * Persisted strategy text alone is used only when no strategy work unit exists.
 */
export function isCampaignStrategyCompleteForCreativeDirection(input: {
  projectId: string;
  workUnits: readonly WorkUnit[];
  strategy: MarketingStrategy | null;
}): boolean {
  const strategyUnit = findCampaignStrategyWorkUnit(input.projectId, input.workUnits);
  if (strategyUnit) {
    if (isCampaignStrategyWorkUnitReviewReady(strategyUnit)) {
      return true;
    }
    return strategyUnit.eventLog.some((e) =>
      e.note.includes(CAMPAIGN_STRATEGY_EXECUTION_COMPLETE_NOTE)
    );
  }

  return Boolean(input.strategy?.summary?.trim());
}
