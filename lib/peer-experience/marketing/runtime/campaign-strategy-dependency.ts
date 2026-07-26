import type { MarketingStrategy } from "@/lib/marketing-intelligence";
import type { WorkUnit } from "@/lib/peer-workflow/work-unit";

import { CAMPAIGN_STRATEGY_EXECUTION_COMPLETE_NOTE } from "./execute-marketing-work-unit";
import {
  findCampaignStrategyWorkUnit,
  isCampaignStrategyWorkUnitReviewReady,
} from "./identify-work-unit";

export function isCampaignStrategyCompleteForCreativeDirection(input: {
  projectId: string;
  workUnits: readonly WorkUnit[];
  strategy: MarketingStrategy | null;
}): boolean {
  if (!input.strategy?.summary?.trim()) {
    return false;
  }
  const strategyUnit = findCampaignStrategyWorkUnit(input.projectId, input.workUnits);
  if (!strategyUnit) {
    return true;
  }
  if (isCampaignStrategyWorkUnitReviewReady(strategyUnit)) {
    return true;
  }
  return strategyUnit.eventLog.some((e) =>
    e.note.includes(CAMPAIGN_STRATEGY_EXECUTION_COMPLETE_NOTE)
  );
}
