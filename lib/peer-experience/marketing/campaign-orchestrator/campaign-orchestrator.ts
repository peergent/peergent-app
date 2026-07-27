import { workUnitsForProject } from "../projects/project-engine";
import { resolveMarketingWorkUnitKind } from "../runtime/identify-work-unit";
import {
  evaluateMarketingWorkUnitPlan,
  isMarketingWorkUnitPlanComplete,
} from "./evaluate-marketing-work-unit-plan";
import type {
  CampaignExecutionPlan,
  CampaignOrchestratorInput,
  MarketingWorkUnit,
} from "./types";

/**
 * Read-only planner for marketing campaign work units.
 * Evaluates lifecycle, dependencies, and persisted artifacts without executing or mutating state.
 */
export class CampaignOrchestrator {
  static plan(input: CampaignOrchestratorInput): CampaignExecutionPlan {
    const executableWorkUnits: MarketingWorkUnit[] = [];
    const blockedWorkUnits: CampaignExecutionPlan["blockedWorkUnits"] = [];
    const completedWorkUnits: MarketingWorkUnit[] = [];

    for (const unit of workUnitsForProject(input.projectId, [...input.workUnits])) {
      if (unit.cancelled) {
        continue;
      }

      const runtimeKind = resolveMarketingWorkUnitKind(unit);
      if (!runtimeKind) {
        continue;
      }

      const entry: MarketingWorkUnit = { workUnit: unit, runtimeKind };

      if (isMarketingWorkUnitPlanComplete(runtimeKind, unit)) {
        completedWorkUnits.push(entry);
        continue;
      }

      const evaluation = evaluateMarketingWorkUnitPlan(runtimeKind, unit, input);
      if (evaluation.executable) {
        executableWorkUnits.push(entry);
        continue;
      }

      blockedWorkUnits.push({
        workUnitId: unit.id,
        runtimeKind,
        workUnit: unit,
        blockingReason: evaluation.blockingReason,
        missingDependencies: evaluation.missingDependencies,
      });
    }

    return {
      executableWorkUnits,
      blockedWorkUnits,
      completedWorkUnits,
    };
  }
}
