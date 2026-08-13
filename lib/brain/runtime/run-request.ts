import type { CampaignContext } from "@/lib/office/campaign/campaign-context";
import type { MarketingUnderstanding } from "@/lib/marketing-intelligence";
import type { BrainEnvironment } from "../domain/environment";
import type { BrainCapabilityId } from "../capabilities/registry";
import type { BrainExecutionMode } from "../policy/approval-policy";
import type { DemoPerformanceMetric } from "../capabilities/execution-context";
import type { BrainStructuredOutput } from "../evidence/structured-output";
import type { ResearchGraph } from "../layers/research";
import type { ReasoningGraph } from "../layers/reasoning";
import type { MarketingIntelligenceGraph } from "../layers/marketing-intelligence";
import type { ProjectBrainId } from "../project-engine/types";

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
  /** Pre-built Research Layer graph — built automatically when omitted. */
  researchGraph?: ResearchGraph | null;
  /** Pre-built Reasoning Layer graph — built automatically from research when omitted. */
  reasoningGraph?: ReasoningGraph | null;
  /** Pre-built Marketing Intelligence graph — built from reasoning when omitted. */
  marketingIntelligenceGraph?: MarketingIntelligenceGraph | null;
  /** Reuse persisted campaign output — skips provider execution (session cache). */
  reuseStoredOutput?: BrainStructuredOutput;
  /** Demo/test performance metrics — never fabricated in live. */
  performanceMetrics?: readonly DemoPerformanceMetric[];
  /** PX-50.3 observability-only — never read by runtime execution logic. */
  runtimeDiagnosticBrainId?: ProjectBrainId;
  /** PX-50.3 observability-only — never read by runtime execution logic. */
  runtimeDiagnosticEpisodeId?: string;
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
