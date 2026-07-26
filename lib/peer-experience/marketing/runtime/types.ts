import type { CreativeBrief } from "@/lib/creative-brief";
import type { ContextPackage } from "@/lib/intelligence";
import type { MarketingStrategy } from "@/lib/marketing-intelligence";
import type { WorkUnit } from "@/lib/peer-workflow/work-unit";

import type { MarketingPeerDomainInput } from "../view-models/marketing-peer-domain-input";
import type { CreativeDirectionWorkUnitOutput } from "./validate-creative-direction-output";

export type CampaignStrategyWorkUnitOutput = {
  readonly title: string;
  readonly summary: string;
  readonly positioning: string;
  readonly messagingPillars: readonly string[];
  readonly recommendedChannels: readonly string[];
  readonly ctaGuidance: string;
};

export type MarketingWorkUnitExecutionPhase =
  | "planning"
  | "executing"
  | "completed"
  | "failed";

export type MarketingWorkUnitFailureStage =
  | "resolve_work_unit"
  | "resolve_project"
  | "build_context"
  | "assemble_decision"
  | "assemble_brief"
  | "generate_strategy"
  | "generate_creative_brief"
  | "validate_output"
  | "save_strategy"
  | "save_creative_brief"
  | "update_work_unit";

export type MarketingPeerRuntimePersistencePort = {
  readonly saveStrategy: (strategy: MarketingStrategy) => void | Promise<void>;
  readonly saveCreativeBrief?: (input: {
    campaignId: string;
    brief: CreativeBrief;
  }) => void | Promise<void>;
  readonly updateWorkUnit: (unit: WorkUnit) => WorkUnit | Promise<WorkUnit>;
};

export type MarketingWorkUnitRuntimeDeps = {
  readonly buildContext: (input: {
    organizationId: string;
    peerId: string;
    userId: string;
    taskHint: string;
  }) => Promise<ContextPackage>;
  readonly generateStrategy: (input: {
    contextPackage: ContextPackage;
    taskHint?: string;
  }) => Promise<
    | { success: true; strategy: MarketingStrategy; warnings: string[]; traceId: string }
    | { success: false; error: string; warnings: string[]; traceId: string }
  >;
  readonly generateCreativeBrief: (input: {
    contextPackage: ContextPackage;
    strategy: MarketingStrategy;
    decision: import("@/lib/marketing-decision").MarketingDecisionRecord;
    project: import("../projects/types").MarketingProject;
    taskHint?: string;
  }) => Promise<
    | { success: true; brief: CreativeBrief; warnings: string[]; traceId: string }
    | { success: false; error: string; warnings: string[]; traceId: string }
  >;
};

export type ExecuteMarketingWorkUnitInput = {
  readonly workUnitId: string;
  readonly organizationId: string;
  readonly userId: string;
  readonly domainInput: MarketingPeerDomainInput;
  readonly assembledAt: string;
  readonly persistence: MarketingPeerRuntimePersistencePort;
  readonly deps?: Partial<MarketingWorkUnitRuntimeDeps>;
};

export type UnsupportedWorkUnitResult = {
  readonly ok: false;
  readonly code: "UnsupportedWorkUnit";
  readonly message: string;
  readonly workUnitId: string;
  readonly failureStage: "resolve_work_unit";
};

export type MarketingWorkUnitExecutionFailure = {
  readonly ok: false;
  readonly code: Exclude<
    import("./errors").MarketingWorkUnitRuntimeErrorCode,
    "UnsupportedWorkUnit"
  >;
  /** Customer-safe message — never raw provider or stack details. */
  readonly message: string;
  readonly workUnitId: string;
  readonly phase: MarketingWorkUnitExecutionPhase;
  readonly failureStage: MarketingWorkUnitFailureStage;
  readonly workUnit?: WorkUnit;
};

export type CampaignStrategyWorkUnitExecutionSuccess = {
  readonly ok: true;
  readonly workUnitId: string;
  readonly kind: "campaign_strategy";
  readonly phase: "completed";
  readonly output: CampaignStrategyWorkUnitOutput;
  readonly strategy: MarketingStrategy;
  readonly workUnit: WorkUnit;
  readonly warnings: readonly string[];
  readonly idempotent: boolean;
};

export type CreativeDirectionWorkUnitExecutionSuccess = {
  readonly ok: true;
  readonly workUnitId: string;
  readonly kind: "creative_direction";
  readonly phase: "completed";
  readonly output: CreativeDirectionWorkUnitOutput;
  readonly brief: CreativeBrief;
  readonly workUnit: WorkUnit;
  readonly warnings: readonly string[];
  readonly idempotent: boolean;
};

export type MarketingWorkUnitExecutionSuccess =
  | CampaignStrategyWorkUnitExecutionSuccess
  | CreativeDirectionWorkUnitExecutionSuccess;

export type ExecuteMarketingWorkUnitResult =
  | MarketingWorkUnitExecutionSuccess
  | UnsupportedWorkUnitResult
  | MarketingWorkUnitExecutionFailure;
