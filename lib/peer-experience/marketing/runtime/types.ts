import type { ContextPackage } from "@/lib/intelligence";
import type { MarketingStrategy } from "@/lib/marketing-intelligence";
import type { WorkUnit } from "@/lib/peer-workflow/work-unit";

import type { MarketingPeerDomainInput } from "../view-models/marketing-peer-domain-input";

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
  | "validate_output"
  | "save_strategy"
  | "update_work_unit";

export type MarketingPeerRuntimePersistencePort = {
  readonly saveStrategy: (strategy: MarketingStrategy) => void | Promise<void>;
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

export type MarketingWorkUnitExecutionSuccess = {
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

export type ExecuteMarketingWorkUnitResult =
  | MarketingWorkUnitExecutionSuccess
  | UnsupportedWorkUnitResult
  | MarketingWorkUnitExecutionFailure;
