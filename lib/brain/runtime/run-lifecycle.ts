export type BrainRunStatus =
  | "queued"
  | "gathering_context"
  | "ready"
  | "running"
  | "waiting_for_input"
  | "waiting_for_approval"
  | "completed"
  | "partial"
  | "failed"
  | "cancelled"
  | "blocked";

export const BRAIN_RUN_STATUSES: readonly BrainRunStatus[] = [
  "queued",
  "gathering_context",
  "ready",
  "running",
  "waiting_for_input",
  "waiting_for_approval",
  "completed",
  "partial",
  "failed",
  "cancelled",
  "blocked",
];

export function isTerminalBrainRunStatus(status: BrainRunStatus): boolean {
  return (
    status === "completed" ||
    status === "partial" ||
    status === "failed" ||
    status === "cancelled"
  );
}

export type BrainUsageMetadata = {
  /** Placeholder — no provider in Sprint 1. */
  providerId?: string;
  modelId?: string;
  inputTokens?: number;
  outputTokens?: number;
  estimatedCostCents?: number;
  cacheHit?: boolean;
};

export type BrainRunBudget = {
  maxTokens?: number;
  maxCostCents?: number;
  tokensUsed: number;
  costCentsUsed: number;
};

export type BrainRun = {
  id: string;
  traceId: string;
  parentRunId?: string;
  childRunIds: readonly string[];
  organizationId: string;
  peerId: string;
  campaignId?: string;
  environment: import("../domain/environment").BrainEnvironment;
  capabilityId: import("../capabilities/registry").BrainCapabilityId;
  status: BrainRunStatus;
  usage: BrainUsageMetadata;
  budget: BrainRunBudget;
  startedAt: string;
  updatedAt: string;
  completedAt?: string;
};
