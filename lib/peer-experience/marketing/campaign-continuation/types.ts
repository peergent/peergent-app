import type { CampaignApprovalMode } from "@/lib/campaign/types/campaign";
import type { MarketingWorkUnitExecutionResult } from "../runtime/execute-marketing-work-unit-workspace";

import type {
  CampaignOrchestratorInput,
  MarketingWorkUnit,
} from "../campaign-orchestrator/types";

export type CampaignContinuationStopReason =
  | "no_executable_work_units"
  | "execution_failed"
  | "review_required"
  | "iteration_limit";

export type CampaignContinuationFailedWorkUnit = {
  readonly workUnitId: string;
  readonly runtimeKind: MarketingWorkUnit["runtimeKind"];
  readonly message: string;
};

export type CampaignContinuationResult = {
  readonly ok: boolean;
  readonly projectId: string;
  readonly completedWorkUnits: readonly MarketingWorkUnit[];
  readonly failedWorkUnit?: CampaignContinuationFailedWorkUnit;
  readonly stopReason: CampaignContinuationStopReason;
  readonly stopMessage: string;
  readonly iterations: number;
};

export type CampaignContinuationRunnerDeps = {
  readonly getOrchestratorInput: (projectId: string) => CampaignOrchestratorInput;
  readonly executeWorkUnit: (
    workUnitId: string
  ) => Promise<MarketingWorkUnitExecutionResult>;
  readonly getApprovalMode?: (projectId: string) => CampaignApprovalMode | undefined;
};

export const CAMPAIGN_CONTINUATION_MAX_ITERATIONS = 100;
