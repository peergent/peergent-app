import type { BrainEnvironment } from "../domain/environment";
import type { BrainCapabilityId } from "../capabilities/registry";
import type { BrainExecutionMode } from "../policy/approval-policy";

export type BrainRunRequest = {
  organizationId: string;
  peerId: string;
  capabilityId: BrainCapabilityId;
  environment?: BrainEnvironment;
  actorId: string;
  campaignId?: string;
  taskId?: string;
  purpose?: string;
  contextRefIds?: readonly string[];
  payloadRefId?: string;
  locale?: string | null;
  idempotencyKey?: string;
  correlationId?: string;
  parentRunId?: string;
  dryRun?: boolean;
  executionMode?: BrainExecutionMode;
  approvalPolicy?: "prepare_only" | "approval_required" | "fully_automatic";
  requestId?: string;
  permissions?: readonly string[];
};

export type BrainRuntimeBudgetLimits = {
  maxRuns?: number;
  maxChildRuns?: number;
  maxEstimatedCostCents?: number;
  maxInputTokens?: number;
  maxOutputTokens?: number;
  timeoutMs?: number;
  maxRetries?: number;
  allowedProviderIds?: readonly string[];
};

export type BrainRunRequestWithBudget = BrainRunRequest & {
  budget?: BrainRuntimeBudgetLimits;
};
