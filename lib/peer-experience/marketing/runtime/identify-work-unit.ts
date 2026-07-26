import type { WorkUnit } from "@/lib/peer-workflow/work-unit";
import { lifecycleStageIndex } from "@/lib/peer-workflow/work-lifecycle";

export const CAMPAIGN_STRATEGY_WORK_UNIT_TITLE = "Finalize campaign strategy";
export const CREATIVE_DIRECTION_WORK_UNIT_TITLE = "Set creative direction";

const WORK_UNIT_KIND_PREFIX = "marketing-work-unit:";

export type MarketingWorkUnitRuntimeKind = "campaign_strategy" | "creative_direction";

export function isCampaignStrategyWorkUnit(unit: WorkUnit): boolean {
  if (unit.cancelled) return false;

  const raw = unit.rawRequest.trim();
  if (raw.startsWith(WORK_UNIT_KIND_PREFIX)) {
    const kind = raw.slice(WORK_UNIT_KIND_PREFIX.length).split("\n")[0]?.trim();
    return kind === "campaign_strategy";
  }

  return unit.title.trim().toLowerCase() === CAMPAIGN_STRATEGY_WORK_UNIT_TITLE.toLowerCase();
}

export function isCreativeDirectionWorkUnit(unit: WorkUnit): boolean {
  if (unit.cancelled) return false;

  const raw = unit.rawRequest.trim();
  if (raw.startsWith(WORK_UNIT_KIND_PREFIX)) {
    const kind = raw.slice(WORK_UNIT_KIND_PREFIX.length).split("\n")[0]?.trim();
    return kind === "creative_direction";
  }

  return unit.title.trim().toLowerCase() === CREATIVE_DIRECTION_WORK_UNIT_TITLE.toLowerCase();
}

export function resolveMarketingWorkUnitKind(unit: WorkUnit): MarketingWorkUnitRuntimeKind | null {
  if (isCampaignStrategyWorkUnit(unit)) return "campaign_strategy";
  if (isCreativeDirectionWorkUnit(unit)) return "creative_direction";
  return null;
}

export function findCampaignStrategyWorkUnit(
  projectId: string,
  workUnits: readonly WorkUnit[]
): WorkUnit | null {
  for (const unit of workUnits) {
    if (unit.projectId === projectId && isCampaignStrategyWorkUnit(unit)) {
      return unit;
    }
  }
  return null;
}

export function findCreativeDirectionWorkUnit(
  projectId: string,
  workUnits: readonly WorkUnit[]
): WorkUnit | null {
  for (const unit of workUnits) {
    if (unit.projectId === projectId && isCreativeDirectionWorkUnit(unit)) {
      return unit;
    }
  }
  return null;
}

export function isCreativeDirectionWorkUnitReviewReady(unit: WorkUnit): boolean {
  return isWorkUnitReviewReady(unit);
}

export function isCampaignStrategyWorkUnitReviewReady(unit: WorkUnit): boolean {
  return isWorkUnitReviewReady(unit);
}

function isWorkUnitReviewReady(unit: WorkUnit): boolean {
  return lifecycleStageIndex(unit.status) >= lifecycleStageIndex("review_ready");
}
