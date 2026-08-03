import type { BrainCapabilityId } from "../capabilities/registry";
import type { BrainProvenanceRef } from "../domain/provenance";

/** Admin trace record — no chain of thought, only auditable facts. */
export type BrainAuditRecord = {
  id: string;
  traceId: string;
  organizationId: string;
  peerId: string;
  campaignId?: string;
  environment: import("../domain/environment").BrainEnvironment;
  capabilityId?: BrainCapabilityId;
  sources: readonly BrainProvenanceRef[];
  policyDecision?: string;
  approvalState?: string;
  toolRequestIds: readonly string[];
  errorCodes: readonly string[];
  usageTokens: number;
  durationMs: number;
  recordedAt: string;
};

export type BrainAuditTrace = {
  traceId: string;
  records: readonly BrainAuditRecord[];
};
