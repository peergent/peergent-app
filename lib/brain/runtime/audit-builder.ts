import type { BrainAuditRecord } from "../audit/record";
import type { BrainRunRecord } from "./repositories/contracts";
import type { BrainStructuredOutput } from "../evidence/structured-output";
import type { ContextAssemblyResult } from "../context/assembly-types";
import type { BrainPolicyResult } from "../policy/approval-policy";
import type { BrainContextProjection } from "../providers/token-strategy";

export function buildRunAuditRecord(input: {
  run: BrainRunRecord;
  assembly: ContextAssemblyResult;
  projection: BrainContextProjection;
  policy: BrainPolicyResult;
  output?: BrainStructuredOutput;
  providerId: string;
  cacheHit: boolean;
  durationMs: number;
  errorCodes?: readonly string[];
}): BrainAuditRecord {
  return {
    id: `audit-${input.run.id}-${Date.now()}`,
    traceId: input.run.traceId,
    organizationId: input.run.organizationId,
    peerId: input.run.peerId,
    campaignId: input.run.campaignId,
    environment: input.run.environment,
    capabilityId: input.run.capabilityId,
    sources: input.assembly.companySnapshot.sources.map((s) => ({
      kind: s.kind,
      refId: s.refId,
      label: s.label,
      capturedAt: s.capturedAt,
    })),
    policyDecision: input.policy.decision,
    approvalState: input.run.status === "waiting_for_approval" ? "pending" : undefined,
    toolRequestIds: [],
    errorCodes: input.errorCodes ?? [],
    usageTokens: (input.run.usage.inputTokens ?? 0) + (input.run.usage.outputTokens ?? 0),
    durationMs: input.durationMs,
    recordedAt: new Date().toISOString(),
  };
}

/** Extended audit metadata stored alongside standard record — no chain of thought. */
export type BrainRunAuditMetadata = {
  readinessState: string;
  contextHash: string;
  snapshotVersion: string;
  cacheHit: boolean;
  providerId: string;
  includedSlices: readonly string[];
  warningCount: number;
  errorCount: number;
};

export function buildRunAuditMetadata(input: {
  assembly: ContextAssemblyResult;
  projection: BrainContextProjection;
  providerId: string;
  cacheHit: boolean;
  output?: BrainStructuredOutput;
}): BrainRunAuditMetadata {
  return {
    readinessState: input.assembly.state,
    contextHash: input.projection.contextHash,
    snapshotVersion: String(input.assembly.version.version),
    cacheHit: input.cacheHit,
    providerId: input.providerId,
    includedSlices: input.projection.includedSlices,
    warningCount: input.output?.warnings.length ?? 0,
    errorCount: input.output?.errors.length ?? 0,
  };
}
