import type { BrainEnvironment } from "../domain/environment";
import type { BrainCapabilityId } from "../capabilities/registry";
import type { BrainRunStatus } from "../runtime/run-lifecycle";

export type BrainHealthStatus = "healthy" | "degraded" | "unavailable";

export type BrainHealth = {
  organizationId: string;
  environment: BrainEnvironment;
  status: BrainHealthStatus;
  activeRuns: number;
  failedRuns24h: number;
  staleSources: number;
  lastRunAt?: string;
  checkedAt: string;
};

export type BrainRunSummary = {
  runId: string;
  traceId: string;
  organizationId: string;
  peerId: string;
  campaignId?: string;
  capabilityId: BrainCapabilityId;
  environment: BrainEnvironment;
  status: BrainRunStatus;
  durationMs?: number;
  tokensUsed?: number;
  cacheHit?: boolean;
  warningCount: number;
  errorCount: number;
  startedAt: string;
  completedAt?: string;
};

export type BrainSourceHealth = {
  sourceKind: string;
  refId: string;
  organizationId: string;
  available: boolean;
  freshness: "fresh" | "stale" | "missing";
  lastUpdatedAt?: string;
  warning?: string;
};
