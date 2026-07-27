import type { WorkUnit } from "@/lib/peer-workflow/work-unit";

import { isCampaignStrategyCompleteForCreativeDirection } from "../runtime/campaign-strategy-dependency";
import {
  isCampaignStrategyWorkUnitReviewReady,
  isCreativeDirectionWorkUnitReviewReady,
  isEmailCampaignWorkUnitReviewReady,
  isLinkedInPostWorkUnitReviewReady,
  type MarketingWorkUnitRuntimeKind,
} from "../runtime/identify-work-unit";
import {
  isCreativeDirectionCompleteForLinkedInPost,
  LINKEDIN_POST_DEPENDENCY_BLOCKED_MESSAGE,
} from "../runtime/linkedin-post-dependencies";
import { resolveContentExecutionArtifacts } from "../runtime/resolve-content-execution-artifacts";
import type { CampaignOrchestratorInput } from "./types";

const CREATIVE_DIRECTION_STRATEGY_BLOCKED_MESSAGE =
  "Campaign strategy must be completed first.";

const EXECUTION_IN_PROGRESS_BLOCKED_MESSAGE = "Work unit is currently executing.";

export function isMarketingWorkUnitPlanComplete(
  kind: MarketingWorkUnitRuntimeKind,
  unit: WorkUnit
): boolean {
  switch (kind) {
    case "campaign_strategy":
      return isCampaignStrategyWorkUnitReviewReady(unit);
    case "creative_direction":
      return isCreativeDirectionWorkUnitReviewReady(unit);
    case "linkedin_post":
      return isLinkedInPostWorkUnitReviewReady(unit);
    case "email_campaign":
      return isEmailCampaignWorkUnitReviewReady(unit);
    default: {
      const _exhaustive: never = kind;
      return _exhaustive;
    }
  }
}

function lifecycleMissingDependenciesForContent(
  input: CampaignOrchestratorInput
): string[] {
  const missing: string[] = [];
  if (
    !isCampaignStrategyCompleteForCreativeDirection({
      projectId: input.projectId,
      workUnits: input.workUnits,
      strategy: input.strategy,
    })
  ) {
    missing.push("campaign_strategy");
  }
  if (
    !isCreativeDirectionCompleteForLinkedInPost({
      projectId: input.projectId,
      workUnits: input.workUnits,
      creativeBriefByCampaignId: input.creativeBriefByCampaignId,
    })
  ) {
    missing.push("creative_direction");
  }
  return missing;
}

function artifactMissingDependencies(input: CampaignOrchestratorInput): string[] {
  const missing: string[] = [];
  if (!input.strategy?.summary?.trim()) {
    missing.push("strategy_artifact");
  }
  const brief = input.creativeBriefByCampaignId?.[input.projectId];
  if (!brief?.campaignGoal.summary?.trim()) {
    missing.push("creative_brief");
  }
  return missing;
}

export type WorkUnitPlanEvaluation =
  | { readonly executable: true }
  | {
      readonly executable: false;
      readonly blockingReason: string;
      readonly missingDependencies: readonly string[];
    };

export function evaluateMarketingWorkUnitPlan(
  kind: MarketingWorkUnitRuntimeKind,
  unit: WorkUnit,
  input: CampaignOrchestratorInput
): WorkUnitPlanEvaluation {
  if (unit.status === "creating") {
    return {
      executable: false,
      blockingReason: EXECUTION_IN_PROGRESS_BLOCKED_MESSAGE,
      missingDependencies: [],
    };
  }

  switch (kind) {
    case "campaign_strategy":
      return { executable: true };

    case "creative_direction": {
      if (
        isCampaignStrategyCompleteForCreativeDirection({
          projectId: input.projectId,
          workUnits: input.workUnits,
          strategy: input.strategy,
        })
      ) {
        return { executable: true };
      }
      return {
        executable: false,
        blockingReason: CREATIVE_DIRECTION_STRATEGY_BLOCKED_MESSAGE,
        missingDependencies: ["campaign_strategy"],
      };
    }

    case "linkedin_post":
    case "email_campaign": {
      const lifecycleMissing = lifecycleMissingDependenciesForContent(input);
      if (lifecycleMissing.length > 0) {
        return {
          executable: false,
          blockingReason: LINKEDIN_POST_DEPENDENCY_BLOCKED_MESSAGE,
          missingDependencies: lifecycleMissing,
        };
      }

      const artifacts = resolveContentExecutionArtifacts({
        projectId: input.projectId,
        workUnits: input.workUnits,
        strategy: input.strategy,
        creativeBriefByCampaignId: input.creativeBriefByCampaignId,
      });
      if (!artifacts.ok) {
        return {
          executable: false,
          blockingReason: artifacts.internalMessage,
          missingDependencies: artifactMissingDependencies(input),
        };
      }

      return { executable: true };
    }

    default: {
      const _exhaustive: never = kind;
      return _exhaustive;
    }
  }
}
