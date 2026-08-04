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
  /** Dev-safe provider id selected before execution. */
  initialProviderId?: string;
  /** Dev-safe terminal provider after fallback, if any. */
  finalProviderId?: string;
  /** Dev-safe failure category when fallback occurred. */
  fallbackReason?: string;
  upstreamStrategyFound?: boolean;
  upstreamChannelsFound?: boolean;
  strategyVersionCompatible?: boolean;
  channelVersionCompatible?: boolean;
  selectedChannelCount?: number;
  businessValidationCategory?: string;
  businessValidationSubreason?: string;
  approvedCanonicalChannels?: string;
  generatedCanonicalChannels?: string;
  unmatchedChannels?: string;
  requestStarted?: boolean;
  validationAttempts?: number;
  validationRepairCount?: number;
  initialRequestDurationMs?: number;
  repairRequestDurationMs?: number;
  fallbackDurationMs?: number;
  timeoutOwner?: string;
  configuredTimeoutMs?: number;
  timeoutAttemptNumber?: number;
  responseHeadersReceived?: boolean;
  responseBodyStarted?: boolean;
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
