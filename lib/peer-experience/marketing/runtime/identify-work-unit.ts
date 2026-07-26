import {
  isGenericChannelPlaceholderDeliverableType,
  isGenericChannelPlaceholderTitle,
} from "@/lib/campaign/planner/content-target-identity";
import type { WorkUnit } from "@/lib/peer-workflow/work-unit";
import { lifecycleStageIndex } from "@/lib/peer-workflow/work-lifecycle";

export const CAMPAIGN_STRATEGY_WORK_UNIT_TITLE = "Finalize campaign strategy";
export const CREATIVE_DIRECTION_WORK_UNIT_TITLE = "Set creative direction";

const WORK_UNIT_KIND_PREFIX = "marketing-work-unit:";

/** Planner channel-only fallback work units (`deliverableKind: generic`, title `{channel} deliverable`). */
export function isGenericChannelPlaceholderWorkUnit(unit: WorkUnit): boolean {
  if (unit.cancelled) return false;
  if (isGenericChannelPlaceholderDeliverableType(unit.deliverableKind)) {
    return true;
  }
  return isGenericChannelPlaceholderTitle(unit.channel, unit.title);
}

export type MarketingWorkUnitRuntimeKind =
  | "campaign_strategy"
  | "creative_direction"
  | "linkedin_post"
  | "email_campaign";

function isExcludedAutonomousContentUnit(unit: WorkUnit): boolean {
  return (
    isCampaignStrategyWorkUnit(unit) ||
    isCreativeDirectionWorkUnit(unit) ||
    isLinkedInPostWorkUnit(unit)
  );
}

function isEmailPublicationOrMonitoringUnit(unit: WorkUnit): boolean {
  const title = unit.title.trim().toLowerCase();
  const objective = (unit.objective ?? "").trim().toLowerCase();
  if (title.includes("monitor") || title.includes("performance")) return true;
  if (title.startsWith("publish ") || title.startsWith("send ")) return true;
  if (objective.includes("before publication") && !objective.includes("draft")) return true;
  if (title.includes("publication") && !title.includes("newsletter") && !title.includes("email campaign")) {
    return true;
  }
  return false;
}

export function isEmailCampaignWorkUnit(unit: WorkUnit): boolean {
  if (unit.cancelled) return false;
  if (isGenericChannelPlaceholderWorkUnit(unit)) return false;
  if (isExcludedAutonomousContentUnit(unit)) return false;
  if (isEmailPublicationOrMonitoringUnit(unit)) return false;

  const raw = unit.rawRequest.trim();
  if (raw.startsWith(WORK_UNIT_KIND_PREFIX)) {
    const kind = raw.slice(WORK_UNIT_KIND_PREFIX.length).split("\n")[0]?.trim();
    if (kind === "email_campaign") return true;
  }

  if (unit.deliverableKind === "email" || unit.deliverableKind === "newsletter") {
    return true;
  }

  const channel = unit.channel.trim().toLowerCase();
  if (channel.includes("email")) {
    const title = unit.title.trim().toLowerCase();
    if (title.includes("newsletter") || title.includes("email")) {
      return !isEmailPublicationOrMonitoringUnit(unit);
    }
  }

  return false;
}

export function isLinkedInPostWorkUnit(unit: WorkUnit): boolean {
  if (unit.cancelled) return false;
  if (isGenericChannelPlaceholderWorkUnit(unit)) return false;
  if (isCampaignStrategyWorkUnit(unit) || isCreativeDirectionWorkUnit(unit)) {
    return false;
  }

  const raw = unit.rawRequest.trim();
  if (raw.startsWith(WORK_UNIT_KIND_PREFIX)) {
    const kind = raw.slice(WORK_UNIT_KIND_PREFIX.length).split("\n")[0]?.trim();
    if (kind === "linkedin_post") return true;
  }

  if (unit.deliverableKind === "linkedin") {
    return true;
  }

  const channel = unit.channel.trim().toLowerCase();
  const title = unit.title.trim().toLowerCase();
  if (channel.includes("linkedin")) {
    return title.includes("linkedin") || channel === "linkedin";
  }

  return false;
}

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
  if (isLinkedInPostWorkUnit(unit)) return "linkedin_post";
  if (isEmailCampaignWorkUnit(unit)) return "email_campaign";
  return null;
}

export function findEmailCampaignWorkUnits(
  projectId: string,
  workUnits: readonly WorkUnit[]
): WorkUnit[] {
  const matches: WorkUnit[] = [];
  for (const unit of workUnits) {
    if (unit.projectId === projectId && isEmailCampaignWorkUnit(unit)) {
      matches.push(unit);
    }
  }
  return matches;
}

export function isEmailCampaignWorkUnitReviewReady(unit: WorkUnit): boolean {
  return isWorkUnitReviewReady(unit);
}

export function findLinkedInPostWorkUnits(
  projectId: string,
  workUnits: readonly WorkUnit[]
): WorkUnit[] {
  const matches: WorkUnit[] = [];
  for (const unit of workUnits) {
    if (unit.projectId === projectId && isLinkedInPostWorkUnit(unit)) {
      matches.push(unit);
    }
  }
  return matches;
}

export function isLinkedInPostWorkUnitReviewReady(unit: WorkUnit): boolean {
  return isWorkUnitReviewReady(unit);
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
