import type { WorkUnit } from "@/lib/peer-workflow/work-unit";

export const CAMPAIGN_STRATEGY_WORK_UNIT_TITLE = "Finalize campaign strategy";

const WORK_UNIT_KIND_PREFIX = "marketing-work-unit:";

export function isCampaignStrategyWorkUnit(unit: WorkUnit): boolean {
  if (unit.cancelled) return false;

  const raw = unit.rawRequest.trim();
  if (raw.startsWith(WORK_UNIT_KIND_PREFIX)) {
    const kind = raw.slice(WORK_UNIT_KIND_PREFIX.length).split("\n")[0]?.trim();
    return kind === "campaign_strategy";
  }

  return unit.title.trim().toLowerCase() === CAMPAIGN_STRATEGY_WORK_UNIT_TITLE.toLowerCase();
}
