import type { BrainRunRecord } from "../runtime/repositories/contracts";
import type { BrainStructuredOutput } from "../evidence/structured-output";
import type { BrainAuditRecord } from "../audit/record";
import type { BrainCapabilityId } from "../capabilities/registry";
import type { CustomerCorrection } from "../company/corrections";
import type {
  PersistedBrainOutputRecord,
  PersistedSnapshotRecord,
  PersistedIdempotencyRecord,
  PersistedDependencyState,
  InvalidationQueueItem,
  PersistedCacheMetadata,
  PersistedApprovalRecord,
  StoredMemoryCandidate,
} from "./types";

/** Async repository contracts for live persistent storage. */
export interface AsyncBrainRunRepository {
  create(run: BrainRunRecord): Promise<BrainRunRecord>;
  update(run: BrainRunRecord): Promise<BrainRunRecord>;
  getById(organizationId: string, runId: string): Promise<BrainRunRecord | null>;
  listByOrganization(organizationId: string): Promise<readonly BrainRunRecord[]>;
  countByOrganization(organizationId: string): Promise<number>;
  countChildRuns(organizationId: string, parentRunId: string): Promise<number>;
}

export interface AsyncBrainOutputRepository {
  store(input: {
    organizationId: string;
    runId: string;
    output: BrainStructuredOutput;
    storedAt: string;
    capabilityId: BrainCapabilityId;
    capabilityVersion: string;
    providerClass?: string;
    contentHash: string;
    contextHash?: string;
    snapshotVersion?: string;
    campaignId?: string;
  }): Promise<string>;
  getByRunId(organizationId: string, runId: string): Promise<BrainStructuredOutput | null>;
  getRecordById(organizationId: string, outputId: string): Promise<PersistedBrainOutputRecord | null>;
  getLatestCompatible(input: {
    organizationId: string;
    capabilityId: BrainCapabilityId;
    capabilityVersion: string;
    campaignId?: string;
    freshness?: "fresh" | "any";
  }): Promise<PersistedBrainOutputRecord | null>;
  markSuperseded(organizationId: string, outputId: string, supersededBy: string): Promise<void>;
}

export interface AsyncBrainAuditRepository {
  append(record: BrainAuditRecord): Promise<BrainAuditRecord>;
  listByTrace(organizationId: string, traceId: string): Promise<readonly BrainAuditRecord[]>;
  listByRun(organizationId: string, runId: string): Promise<readonly BrainAuditRecord[]>;
}

export interface AsyncBrainIdempotencyRepository {
  get(organizationId: string, capabilityId: BrainCapabilityId, idempotencyKey: string): Promise<PersistedIdempotencyRecord | null>;
  set(record: PersistedIdempotencyRecord): Promise<void>;
}

export interface BrainSnapshotRepository {
  store(record: PersistedSnapshotRecord): Promise<PersistedSnapshotRecord>;
  getById(organizationId: string, snapshotId: string): Promise<PersistedSnapshotRecord | null>;
  getLatest(organizationId: string, snapshotKind: PersistedSnapshotRecord["snapshotKind"]): Promise<PersistedSnapshotRecord | null>;
  listStale(organizationId: string): Promise<readonly PersistedSnapshotRecord[]>;
}

export interface CustomerCorrectionRepository {
  create(correction: CustomerCorrection & { status?: string; supersededBy?: string }): Promise<CustomerCorrection>;
  listActive(organizationId: string): Promise<readonly CustomerCorrection[]>;
  supersede(organizationId: string, correctionId: string, supersededBy: string): Promise<void>;
}

export interface BrainMemoryCandidateRepository {
  store(candidate: StoredMemoryCandidate): Promise<StoredMemoryCandidate>;
  listByOrganization(organizationId: string, reviewState?: StoredMemoryCandidate["reviewState"]): Promise<readonly StoredMemoryCandidate[]>;
  updateReviewState(organizationId: string, candidateId: string, reviewState: StoredMemoryCandidate["reviewState"], actorId?: string): Promise<void>;
}

export interface BrainDependencyStateRepository {
  upsert(state: PersistedDependencyState): Promise<PersistedDependencyState>;
  listByOrganization(organizationId: string, freshness?: PersistedDependencyState["freshness"]): Promise<readonly PersistedDependencyState[]>;
  markStale(input: {
    organizationId: string;
    entityKind: string;
    entityRef: string;
    capabilityId?: BrainCapabilityId;
    reason: string;
  }): Promise<void>;
}

export interface BrainInvalidationQueueRepository {
  enqueue(item: Omit<InvalidationQueueItem, "id" | "createdAt" | "updatedAt"> & { id?: string }): Promise<InvalidationQueueItem>;
  listPending(organizationId: string): Promise<readonly InvalidationQueueItem[]>;
  updateStatus(organizationId: string, itemId: string, status: InvalidationQueueItem["status"], error?: string): Promise<void>;
}

export interface BrainCacheMetadataRepository {
  upsert(entry: Omit<PersistedCacheMetadata, "id" | "createdAt"> & { id?: string }): Promise<PersistedCacheMetadata>;
  getByKey(organizationId: string, cacheKey: string): Promise<PersistedCacheMetadata | null>;
  invalidateByContextHash(organizationId: string, contextHash: string, reason: string): Promise<number>;
  recordHit(organizationId: string, cacheKey: string): Promise<void>;
}

export interface BrainApprovalRepository {
  create(record: Omit<PersistedApprovalRecord, "id" | "createdAt" | "updatedAt"> & { id?: string }): Promise<PersistedApprovalRecord>;
  updateStatus(organizationId: string, approvalId: string, status: PersistedApprovalRecord["status"], approverId?: string, feedback?: string): Promise<PersistedApprovalRecord>;
  getByProposalId(organizationId: string, proposalId: string): Promise<PersistedApprovalRecord | null>;
}

export type AsyncBrainRepositories = {
  runs: AsyncBrainRunRepository;
  outputs: AsyncBrainOutputRepository;
  audit: AsyncBrainAuditRepository;
  idempotency: AsyncBrainIdempotencyRepository;
  snapshots: BrainSnapshotRepository;
  corrections: CustomerCorrectionRepository;
  memoryCandidates: BrainMemoryCandidateRepository;
  dependencyStates: BrainDependencyStateRepository;
  invalidationQueue: BrainInvalidationQueueRepository;
  cacheMetadata: BrainCacheMetadataRepository;
  approvals: BrainApprovalRepository;
};

export type RepositoryStorageMode = "in_memory" | "persistent_in_memory" | "supabase";
