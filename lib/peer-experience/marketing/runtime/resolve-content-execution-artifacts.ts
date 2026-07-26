import type { CreativeBrief } from "@/lib/creative-brief";
import type { MarketingStrategy } from "@/lib/marketing-intelligence";
import type { WorkUnit } from "@/lib/peer-workflow/work-unit";

import {
  findCampaignStrategyWorkUnit,
  findCreativeDirectionWorkUnit,
  isCampaignStrategyWorkUnitReviewReady,
  isCreativeDirectionWorkUnitReviewReady,
} from "./identify-work-unit";

export type ResolveContentExecutionArtifactsResult =
  | {
      readonly ok: true;
      readonly strategy: MarketingStrategy;
      readonly creativeBrief: CreativeBrief;
    }
  | {
      readonly ok: false;
      readonly internalMessage: string;
    };

/**
 * Loads persisted strategy + creative brief required for autonomous content generation.
 * Lifecycle review_ready alone is not enough — generation needs the saved artifacts.
 */
export function resolveContentExecutionArtifacts(input: {
  projectId: string;
  workUnits: readonly WorkUnit[];
  strategy: MarketingStrategy | null;
  creativeBriefByCampaignId?: Readonly<Record<string, CreativeBrief>>;
}): ResolveContentExecutionArtifactsResult {
  const strategy = input.strategy;
  if (!strategy?.summary?.trim()) {
    const strategyUnit = findCampaignStrategyWorkUnit(input.projectId, input.workUnits);
    if (strategyUnit && isCampaignStrategyWorkUnitReviewReady(strategyUnit)) {
      return {
        ok: false,
        internalMessage:
          "Campaign strategy work unit is review_ready but strategy content is missing from the marketing workspace.",
      };
    }
    return {
      ok: false,
      internalMessage: "Campaign strategy content is required before generating deliverables.",
    };
  }

  const creativeBrief = input.creativeBriefByCampaignId?.[input.projectId];
  if (!creativeBrief?.campaignGoal.summary?.trim()) {
    const creativeUnit = findCreativeDirectionWorkUnit(input.projectId, input.workUnits);
    if (creativeUnit && isCreativeDirectionWorkUnitReviewReady(creativeUnit)) {
      return {
        ok: false,
        internalMessage:
          "Creative direction work unit is review_ready but creative brief is missing from the marketing workspace.",
      };
    }
    return {
      ok: false,
      internalMessage: "Creative direction content is required before generating deliverables.",
    };
  }

  return { ok: true, strategy, creativeBrief };
}
