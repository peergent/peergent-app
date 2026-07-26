import type { CreativeBrief } from "@/lib/creative-brief";
import type { MarketingStrategy } from "@/lib/marketing-intelligence";
import type { WorkUnit } from "@/lib/peer-workflow/work-unit";

import { isCampaignStrategyCompleteForCreativeDirection } from "./campaign-strategy-dependency";
import { CREATIVE_DIRECTION_EXECUTION_COMPLETE_NOTE } from "./execute-creative-direction-work-unit";
import {
  findCreativeDirectionWorkUnit,
  isCreativeDirectionWorkUnitReviewReady,
} from "./identify-work-unit";

export const LINKEDIN_POST_DEPENDENCY_BLOCKED_MESSAGE =
  "Campaign strategy and creative direction must be completed first.";

export function isCreativeDirectionCompleteForLinkedInPost(input: {
  projectId: string;
  workUnits: readonly WorkUnit[];
  creativeBriefByCampaignId?: Readonly<Record<string, CreativeBrief>>;
}): boolean {
  const creativeUnit = findCreativeDirectionWorkUnit(input.projectId, input.workUnits);
  if (creativeUnit) {
    if (isCreativeDirectionWorkUnitReviewReady(creativeUnit)) {
      return true;
    }
    return creativeUnit.eventLog.some((e) =>
      e.note.includes(CREATIVE_DIRECTION_EXECUTION_COMPLETE_NOTE)
    );
  }

  const brief = input.creativeBriefByCampaignId?.[input.projectId];
  return Boolean(brief?.campaignGoal.summary?.trim());
}

export function areLinkedInPostDependenciesMet(input: {
  projectId: string;
  workUnits: readonly WorkUnit[];
  strategy: MarketingStrategy | null;
  creativeBriefByCampaignId?: Readonly<Record<string, CreativeBrief>>;
}): boolean {
  if (
    !isCampaignStrategyCompleteForCreativeDirection({
      projectId: input.projectId,
      workUnits: input.workUnits,
      strategy: input.strategy,
    })
  ) {
    return false;
  }

  return isCreativeDirectionCompleteForLinkedInPost({
    projectId: input.projectId,
    workUnits: input.workUnits,
    creativeBriefByCampaignId: input.creativeBriefByCampaignId,
  });
}
