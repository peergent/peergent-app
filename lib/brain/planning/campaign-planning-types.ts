import type { BrainCapabilityId } from "../capabilities/registry";

/** Canonical persisted Planning capability identity — distinct from channel_planning. */
export const CAMPAIGN_PLANNING_CAPABILITY_ID = "campaign_planning" as const satisfies BrainCapabilityId;

export type PlanningOutputMetadata = {
  readonly projectId: string;
  readonly contextVersion: number;
  readonly planningCapabilityId: typeof CAMPAIGN_PLANNING_CAPABILITY_ID;
  readonly planningCapabilityVersion: string;
  readonly strategyCapabilityVersion: string;
  readonly strategyGraphVersion: string;
  readonly decisionEngineVersion: string;
  readonly decisionCount: number;
  readonly brandLayerVersion?: string;
  readonly strategyGeneratedAt: string;
  readonly validationStatus: "valid" | "invalid";
  readonly planningSource: "built" | "stored";
  readonly cacheReused: boolean;
};

export type PlanningBuildStatus = "completed" | "waiting_for_input" | "failed" | "cancelled";

export type PlanningBuildResult = {
  readonly status: PlanningBuildStatus;
  readonly output?: import("../evidence/structured-output").BrainStructuredOutput;
  readonly graph?: import("../layers/planning/types").PlanningGraph;
  readonly reused: boolean;
  readonly failureMessageSafe?: string;
  readonly waitingFor?: readonly string[];
};
