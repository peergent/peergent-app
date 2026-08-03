import type { CampaignContext } from "@/lib/office/campaign/campaign-context";
import type { MarketingUnderstanding } from "@/lib/marketing-intelligence";
import type { BrainEnvironment } from "../domain/environment";
import type { BrainCapabilityId } from "../capabilities/registry";
import type { BrainExecutionMode } from "../policy/approval-policy";
import type { DemoPerformanceMetric } from "../capabilities/execution-context";
import type { BrainStructuredOutput } from "../evidence/structured-output";

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
  /** Full campaign context for capability executors — not stored in BrainSnapshot slices. */
  campaignContext?: CampaignContext;
  marketingUnderstanding?: MarketingUnderstanding | null;
  /** Upstream capability outputs for dependent capabilities. */
  upstreamOutputs?: Partial<Record<BrainCapabilityId, BrainStructuredOutput>>;
  /** Demo/test performance metrics — never fabricated in live. */
  performanceMetrics?: readonly DemoPerformanceMetric[];
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
