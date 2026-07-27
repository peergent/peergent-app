import type { CreativeBrief } from "@/lib/creative-brief";
import type { MarketingStrategy } from "@/lib/marketing-intelligence";
import type { WorkUnit } from "@/lib/peer-workflow/work-unit";

import type { MarketingWorkUnitRuntimeKind } from "../runtime/identify-work-unit";

export type MarketingWorkUnit = {
  workUnit: WorkUnit;
  runtimeKind: MarketingWorkUnitRuntimeKind;
};

export type BlockedWorkUnit = {
  workUnitId: string;
  runtimeKind: MarketingWorkUnitRuntimeKind;
  workUnit: WorkUnit;
  blockingReason: string;
  missingDependencies: readonly string[];
};

export type CampaignExecutionPlan = {
  executableWorkUnits: MarketingWorkUnit[];
  blockedWorkUnits: BlockedWorkUnit[];
  completedWorkUnits: MarketingWorkUnit[];
};

export type CampaignOrchestratorInput = {
  projectId: string;
  workUnits: readonly WorkUnit[];
  strategy: MarketingStrategy | null;
  creativeBriefByCampaignId?: Readonly<Record<string, CreativeBrief>>;
};
