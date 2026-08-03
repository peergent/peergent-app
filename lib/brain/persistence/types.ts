import type { BrainEnvironment } from "../domain/environment";
import type { BrainCapabilityId } from "../capabilities/registry";
import type { BrainStructuredOutput } from "../evidence/structured-output";
import type { BrainRunRecord } from "../runtime/repositories/contracts";
import type { CustomerCorrection } from "../company/corrections";
import type { BrainMemoryCandidate } from "../memory/candidate";
import type { CompanySnapshot } from "../company/snapshot";
import type { WebsiteSnapshot } from "../website/types";

export type PersistedBrainOutputRecord = {
  id: string;
  organizationId: string;
  runId: string;
  capabilityId: BrainCapabilityId;
  capabilityVersion: string;
  providerClass: string;
  outputSchemaVersion: string;
  contentHash: string;
  contextHash?: string;
  snapshotVersion?: string;
  freshness: "fresh" | "stale" | "superseded";
  supersededBy?: string;
  output: BrainStructuredOutput;
  storedAt: string;
  campaignId?: string;
};

export type PersistedSnapshotRecord = {
  id: string;
  organizationId: string;
  snapshotKind: "company" | "website" | "brain";
  schemaVersion: string;
  versionNumber: number;
  contextHash: string;
  sourceHash?: string;
  readinessState?: string;
  freshness: string;
  payload: Record<string, unknown>;
  payloadRefId?: string;
  supersededBy?: string;
  createdAt: string;
};

export type PersistedIdempotencyRecord = {
  organizationId: string;
  capabilityId: BrainCapabilityId;
  idempotencyKey: string;
  runId: string;
  requestHash: string;
  expiresAt?: string;
  createdAt: string;
};

export type PersistedDependencyState = {
  id: string;
  organizationId: string;
  entityKind: string;
  entityRef: string;
  capabilityId?: BrainCapabilityId;
  outputId?: string;
  freshness: "fresh" | "stale" | "invalidated";
  staleReason?: string;
  invalidatedAt?: string;
  updatedAt: string;
};

export type InvalidationQueueItem = {
  id: string;
  organizationId: string;
  status: "pending" | "processing" | "completed" | "failed" | "cancelled";
  sourceEvent: string;
  affectedEntity: string;
  affectedCapabilities: readonly BrainCapabilityId[];
  reason: string;
  correlationId?: string;
  attempts: number;
  error?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
};

export type PersistedCacheMetadata = {
  id: string;
  organizationId: string;
  cacheKey: string;
  capabilityId: BrainCapabilityId;
  capabilityVersion: string;
  contextHash: string;
  payloadHash: string;
  providerClass: string;
  freshness: string;
  outputId?: string;
  hitCount: number;
  invalidatedAt?: string;
  invalidatedReason?: string;
  expiresAt?: string;
  lastHitAt?: string;
  createdAt: string;
};

export type PersistedApprovalRecord = {
  id: string;
  organizationId: string;
  proposalId: string;
  runId?: string;
  outputId?: string;
  campaignId?: string;
  actionType: string;
  status: "pending" | "approved" | "rejected" | "cancelled";
  approverId?: string;
  feedback?: string;
  policyVersion?: string;
  consequence?: string;
  reversibility: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export type BrainRecoveryClassification =
  | "safe_to_resume"
  | "requires_customer_input"
  | "requires_approval"
  | "retryable"
  | "terminal"
  | "operator_review_required";

export type BrainRecoveryAssessment = {
  runId: string;
  status: BrainRunRecord["status"];
  classification: BrainRecoveryClassification;
  reason: string;
};

export type UpstreamOutputResolution = {
  accepted: boolean;
  output?: PersistedBrainOutputRecord;
  reason: string;
};

export type LiveAssemblyInput = {
  organizationId: string;
  peerId: string;
  environment: BrainEnvironment;
  locale: "nl" | "en";
  companySnapshot?: CompanySnapshot | null;
  websiteSnapshot?: WebsiteSnapshot | null;
  corrections?: readonly CustomerCorrection[];
  campaignContext?: import("@/lib/office/campaign/campaign-context").CampaignContext | null;
};

export type StoredMemoryCandidate = BrainMemoryCandidate & {
  sourceRunId?: string;
  sourceOutputId?: string;
  reason?: string;
  sensitivity?: string;
  contradictionRef?: string;
  reviewActorId?: string;
  reviewedAt?: string;
};
