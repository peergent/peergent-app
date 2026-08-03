/**
 * Module-scoped stores simulate cross-request persistence in tests.
 * Cleared explicitly via resetPersistentBrainStores().
 */
import type { BrainRunRecord } from "../runtime/repositories/contracts";
import type { BrainStructuredOutput } from "../evidence/structured-output";
import type { BrainAuditRecord } from "../audit/record";
import type { CustomerCorrection } from "../company/corrections";
import type {
  AsyncBrainAuditRepository,
  AsyncBrainIdempotencyRepository,
  AsyncBrainOutputRepository,
  AsyncBrainRunRepository,
  BrainApprovalRepository,
  BrainCacheMetadataRepository,
  BrainDependencyStateRepository,
  BrainInvalidationQueueRepository,
  BrainMemoryCandidateRepository,
  BrainSnapshotRepository,
  CustomerCorrectionRepository,
} from "./contracts";
import type {
  InvalidationQueueItem,
  PersistedApprovalRecord,
  PersistedBrainOutputRecord,
  PersistedCacheMetadata,
  PersistedDependencyState,
  PersistedIdempotencyRecord,
  PersistedSnapshotRecord,
  StoredMemoryCandidate,
} from "./types";
import type { BrainCapabilityId } from "../capabilities/registry";
import { BrainRunIsolationError } from "../runtime/errors";
import { assertRunOrganizationMatch } from "../runtime/repositories/in-memory-run-repository";

const runs = new Map<string, BrainRunRecord>();
const outputs = new Map<string, PersistedBrainOutputRecord>();
const outputsByRun = new Map<string, string>();
const audit = new Map<string, BrainAuditRecord>();
const idempotency = new Map<string, PersistedIdempotencyRecord>();
const snapshots = new Map<string, PersistedSnapshotRecord>();
const corrections = new Map<string, CustomerCorrection & { status?: string; supersededBy?: string }>();
const memoryCandidates = new Map<string, StoredMemoryCandidate>();
const dependencyStates = new Map<string, PersistedDependencyState>();
const invalidationQueue = new Map<string, InvalidationQueueItem>();
const cacheMetadata = new Map<string, PersistedCacheMetadata>();
const approvals = new Map<string, PersistedApprovalRecord>();

function orgKey(organizationId: string, id: string): string {
  return `${organizationId}:${id}`;
}

function idempotencyKey(organizationId: string, capabilityId: string, key: string): string {
  return `${organizationId}:${capabilityId}:${key}`;
}

export function resetPersistentBrainStores(): void {
  runs.clear();
  outputs.clear();
  outputsByRun.clear();
  audit.clear();
  idempotency.clear();
  snapshots.clear();
  corrections.clear();
  memoryCandidates.clear();
  dependencyStates.clear();
  invalidationQueue.clear();
  cacheMetadata.clear();
  approvals.clear();
}

export class PersistentInMemoryBrainRunRepository implements AsyncBrainRunRepository {
  async create(run: BrainRunRecord): Promise<BrainRunRecord> {
    runs.set(orgKey(run.organizationId, run.id), { ...run });
    return run;
  }

  async update(run: BrainRunRecord): Promise<BrainRunRecord> {
    const existing = await this.getById(run.organizationId, run.id);
    if (!existing) throw new Error(`Run not found: ${run.id}`);
    if (existing.version && run.version && run.version < existing.version) {
      throw new Error(`Optimistic concurrency conflict for run ${run.id}`);
    }
    const next = { ...run, version: (existing.version ?? 1) + 1 };
    runs.set(orgKey(run.organizationId, run.id), next);
    return next;
  }

  async getById(organizationId: string, runId: string): Promise<BrainRunRecord | null> {
    const run = runs.get(orgKey(organizationId, runId)) ?? null;
    if (run) assertRunOrganizationMatch(run, organizationId);
    return run;
  }

  async listByOrganization(organizationId: string): Promise<readonly BrainRunRecord[]> {
    return [...runs.values()].filter((r) => r.organizationId === organizationId);
  }

  async countByOrganization(organizationId: string): Promise<number> {
    return (await this.listByOrganization(organizationId)).length;
  }

  async countChildRuns(organizationId: string, parentRunId: string): Promise<number> {
    return (await this.listByOrganization(organizationId)).filter((r) => r.parentRunId === parentRunId).length;
  }
}

export class PersistentInMemoryBrainOutputRepository implements AsyncBrainOutputRepository {
  async store(input: {
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
  }): Promise<string> {
    const id = `out-${input.runId}`;
    const record: PersistedBrainOutputRecord = {
      id,
      organizationId: input.organizationId,
      runId: input.runId,
      capabilityId: input.capabilityId,
      capabilityVersion: input.capabilityVersion,
      providerClass: input.providerClass ?? "deterministic",
      outputSchemaVersion: "BrainStructuredOutput",
      contentHash: input.contentHash,
      contextHash: input.contextHash,
      snapshotVersion: input.snapshotVersion,
      freshness: "fresh",
      output: input.output,
      storedAt: input.storedAt,
      campaignId: input.campaignId,
    };
    outputs.set(orgKey(input.organizationId, id), record);
    outputsByRun.set(orgKey(input.organizationId, input.runId), id);
    return id;
  }

  async getByRunId(organizationId: string, runId: string): Promise<BrainStructuredOutput | null> {
    const id = outputsByRun.get(orgKey(organizationId, runId));
    if (!id) return null;
    return outputs.get(orgKey(organizationId, id))?.output ?? null;
  }

  async getRecordById(organizationId: string, outputId: string): Promise<PersistedBrainOutputRecord | null> {
    return outputs.get(orgKey(organizationId, outputId)) ?? null;
  }

  async getLatestCompatible(input: {
    organizationId: string;
    capabilityId: BrainCapabilityId;
    capabilityVersion: string;
    campaignId?: string;
    freshness?: "fresh" | "any";
  }): Promise<PersistedBrainOutputRecord | null> {
    const list = [...outputs.values()]
      .filter((o) => o.organizationId === input.organizationId && o.capabilityId === input.capabilityId)
      .filter((o) => input.freshness !== "fresh" || o.freshness === "fresh")
      .filter((o) => !input.campaignId || o.campaignId === input.campaignId)
      .sort((a, b) => b.storedAt.localeCompare(a.storedAt));
    const match = list.find((o) => o.capabilityVersion === input.capabilityVersion) ?? null;
    return match;
  }

  async markSuperseded(organizationId: string, outputId: string, supersededBy: string): Promise<void> {
    const record = outputs.get(orgKey(organizationId, outputId));
    if (!record) return;
    outputs.set(orgKey(organizationId, outputId), {
      ...record,
      freshness: "superseded",
      supersededBy,
    });
  }
}

export class PersistentInMemoryBrainAuditRepository implements AsyncBrainAuditRepository {
  async append(record: BrainAuditRecord): Promise<BrainAuditRecord> {
    audit.set(orgKey(record.organizationId, record.id), record);
    return record;
  }

  async listByTrace(organizationId: string, traceId: string): Promise<readonly BrainAuditRecord[]> {
    return [...audit.values()]
      .filter((r) => r.organizationId === organizationId && r.traceId === traceId)
      .sort((a, b) => a.recordedAt.localeCompare(b.recordedAt));
  }

  async listByRun(organizationId: string, runId: string): Promise<readonly BrainAuditRecord[]> {
    return [...audit.values()].filter(
      (r) => r.organizationId === organizationId && r.id.includes(runId)
    );
  }
}

export class PersistentInMemoryBrainIdempotencyRepository implements AsyncBrainIdempotencyRepository {
  async get(
    organizationId: string,
    capabilityId: BrainCapabilityId,
    idempotencyKeyValue: string
  ): Promise<PersistedIdempotencyRecord | null> {
    return idempotency.get(idempotencyKey(organizationId, capabilityId, idempotencyKeyValue)) ?? null;
  }

  async set(record: PersistedIdempotencyRecord): Promise<void> {
    const existing = await this.get(record.organizationId, record.capabilityId, record.idempotencyKey);
    if (existing && existing.requestHash !== record.requestHash) {
      throw new Error("Idempotency key reused with different request payload.");
    }
    idempotency.set(
      idempotencyKey(record.organizationId, record.capabilityId, record.idempotencyKey),
      record
    );
  }
}

export class PersistentInMemoryBrainSnapshotRepository implements BrainSnapshotRepository {
  async store(record: PersistedSnapshotRecord): Promise<PersistedSnapshotRecord> {
    snapshots.set(orgKey(record.organizationId, record.id), record);
    return record;
  }

  async getById(organizationId: string, snapshotId: string): Promise<PersistedSnapshotRecord | null> {
    return snapshots.get(orgKey(organizationId, snapshotId)) ?? null;
  }

  async getLatest(
    organizationId: string,
    snapshotKind: PersistedSnapshotRecord["snapshotKind"]
  ): Promise<PersistedSnapshotRecord | null> {
    const list = [...snapshots.values()]
      .filter((s) => s.organizationId === organizationId && s.snapshotKind === snapshotKind && !s.supersededBy)
      .sort((a, b) => b.versionNumber - a.versionNumber);
    return list[0] ?? null;
  }

  async listStale(organizationId: string): Promise<readonly PersistedSnapshotRecord[]> {
    return [...snapshots.values()].filter((s) => s.organizationId === organizationId && s.freshness === "stale");
  }
}

export class PersistentInMemoryCustomerCorrectionRepository implements CustomerCorrectionRepository {
  async create(
    correction: CustomerCorrection & { status?: string; supersededBy?: string }
  ): Promise<CustomerCorrection> {
    corrections.set(orgKey(correction.organizationId, correction.id), { ...correction, status: correction.status ?? "active" });
    return correction;
  }

  async listActive(organizationId: string): Promise<readonly CustomerCorrection[]> {
    return [...corrections.values()].filter(
      (c) => c.organizationId === organizationId && c.status !== "superseded" && c.status !== "removed"
    );
  }

  async supersede(organizationId: string, correctionId: string, supersededBy: string): Promise<void> {
    const existing = corrections.get(orgKey(organizationId, correctionId));
    if (!existing) return;
    corrections.set(orgKey(organizationId, correctionId), {
      ...existing,
      status: "superseded",
      supersededBy,
    });
  }
}

export class PersistentInMemoryBrainMemoryCandidateRepository implements BrainMemoryCandidateRepository {
  async store(candidate: StoredMemoryCandidate): Promise<StoredMemoryCandidate> {
    memoryCandidates.set(orgKey(candidate.organizationId, candidate.id), candidate);
    return candidate;
  }

  async listByOrganization(
    organizationId: string,
    reviewState?: StoredMemoryCandidate["reviewState"]
  ): Promise<readonly StoredMemoryCandidate[]> {
    return [...memoryCandidates.values()].filter(
      (c) => c.organizationId === organizationId && (!reviewState || c.reviewState === reviewState)
    );
  }

  async updateReviewState(
    organizationId: string,
    candidateId: string,
    reviewState: StoredMemoryCandidate["reviewState"],
    actorId?: string
  ): Promise<void> {
    const existing = memoryCandidates.get(orgKey(organizationId, candidateId));
    if (!existing) return;
    memoryCandidates.set(orgKey(organizationId, candidateId), {
      ...existing,
      reviewState,
      reviewActorId: actorId,
      reviewedAt: new Date().toISOString(),
    });
  }
}

export class PersistentInMemoryBrainDependencyStateRepository implements BrainDependencyStateRepository {
  async upsert(state: PersistedDependencyState): Promise<PersistedDependencyState> {
    dependencyStates.set(orgKey(state.organizationId, state.id), state);
    return state;
  }

  async listByOrganization(
    organizationId: string,
    freshness?: PersistedDependencyState["freshness"]
  ): Promise<readonly PersistedDependencyState[]> {
    return [...dependencyStates.values()].filter(
      (s) => s.organizationId === organizationId && (!freshness || s.freshness === freshness)
    );
  }

  async markStale(input: {
    organizationId: string;
    entityKind: string;
    entityRef: string;
    capabilityId?: BrainCapabilityId;
    reason: string;
  }): Promise<void> {
    const id = `dep-${input.entityKind}-${input.entityRef}-${input.capabilityId ?? "all"}`;
    const existing = dependencyStates.get(orgKey(input.organizationId, id));
    dependencyStates.set(orgKey(input.organizationId, id), {
      id,
      organizationId: input.organizationId,
      entityKind: input.entityKind,
      entityRef: input.entityRef,
      capabilityId: input.capabilityId,
      freshness: "stale",
      staleReason: input.reason,
      invalidatedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      outputId: existing?.outputId,
    });
  }
}

export class PersistentInMemoryBrainInvalidationQueueRepository implements BrainInvalidationQueueRepository {
  async enqueue(
    item: Omit<InvalidationQueueItem, "id" | "createdAt" | "updatedAt"> & { id?: string }
  ): Promise<InvalidationQueueItem> {
    const now = new Date().toISOString();
    const record: InvalidationQueueItem = {
      ...item,
      id: item.id ?? `inv-${Date.now()}`,
      createdAt: now,
      updatedAt: now,
    };
    invalidationQueue.set(orgKey(item.organizationId, record.id), record);
    return record;
  }

  async listPending(organizationId: string): Promise<readonly InvalidationQueueItem[]> {
    return [...invalidationQueue.values()].filter(
      (i) => i.organizationId === organizationId && i.status === "pending"
    );
  }

  async updateStatus(
    organizationId: string,
    itemId: string,
    status: InvalidationQueueItem["status"],
    error?: string
  ): Promise<void> {
    const existing = invalidationQueue.get(orgKey(organizationId, itemId));
    if (!existing) return;
    invalidationQueue.set(orgKey(organizationId, itemId), {
      ...existing,
      status,
      error,
      updatedAt: new Date().toISOString(),
      completedAt: status === "completed" || status === "failed" ? new Date().toISOString() : existing.completedAt,
      attempts: existing.attempts + (status === "failed" ? 1 : 0),
    });
  }
}

export class PersistentInMemoryBrainCacheMetadataRepository implements BrainCacheMetadataRepository {
  async upsert(
    entry: Omit<PersistedCacheMetadata, "id" | "createdAt"> & { id?: string }
  ): Promise<PersistedCacheMetadata> {
    const record: PersistedCacheMetadata = {
      ...entry,
      id: entry.id ?? `cache-${entry.cacheKey}`,
      createdAt: new Date().toISOString(),
    };
    cacheMetadata.set(orgKey(entry.organizationId, record.cacheKey), record);
    return record;
  }

  async getByKey(organizationId: string, cacheKey: string): Promise<PersistedCacheMetadata | null> {
    return cacheMetadata.get(orgKey(organizationId, cacheKey)) ?? null;
  }

  async invalidateByContextHash(organizationId: string, contextHash: string, reason: string): Promise<number> {
    let count = 0;
    for (const [key, entry] of cacheMetadata.entries()) {
      if (entry.organizationId === organizationId && entry.contextHash === contextHash && !entry.invalidatedAt) {
        cacheMetadata.set(key, {
          ...entry,
          invalidatedAt: new Date().toISOString(),
          invalidatedReason: reason,
        });
        count++;
      }
    }
    return count;
  }

  async recordHit(organizationId: string, cacheKey: string): Promise<void> {
    const existing = cacheMetadata.get(orgKey(organizationId, cacheKey));
    if (!existing) return;
    cacheMetadata.set(orgKey(organizationId, cacheKey), {
      ...existing,
      hitCount: existing.hitCount + 1,
      lastHitAt: new Date().toISOString(),
    });
  }
}

export class PersistentInMemoryBrainApprovalRepository implements BrainApprovalRepository {
  async create(
    record: Omit<PersistedApprovalRecord, "id" | "createdAt" | "updatedAt"> & { id?: string }
  ): Promise<PersistedApprovalRecord> {
    const now = new Date().toISOString();
    const full: PersistedApprovalRecord = {
      ...record,
      id: record.id ?? `appr-${Date.now()}`,
      createdAt: now,
      updatedAt: now,
    };
    approvals.set(orgKey(record.organizationId, full.id), full);
    return full;
  }

  async updateStatus(
    organizationId: string,
    approvalId: string,
    status: PersistedApprovalRecord["status"],
    approverId?: string,
    feedback?: string
  ): Promise<PersistedApprovalRecord> {
    const existing = approvals.get(orgKey(organizationId, approvalId));
    if (!existing) throw new Error(`Approval not found: ${approvalId}`);
    const updated = {
      ...existing,
      status,
      approverId: approverId ?? existing.approverId,
      feedback: feedback ?? existing.feedback,
      updatedAt: new Date().toISOString(),
    };
    approvals.set(orgKey(organizationId, approvalId), updated);
    return updated;
  }

  async getByProposalId(organizationId: string, proposalId: string): Promise<PersistedApprovalRecord | null> {
    return (
      [...approvals.values()].find(
        (a) => a.organizationId === organizationId && a.proposalId === proposalId
      ) ?? null
    );
  }
}

export function createPersistentInMemoryRepositories(): import("./contracts").AsyncBrainRepositories {
  return {
    runs: new PersistentInMemoryBrainRunRepository(),
    outputs: new PersistentInMemoryBrainOutputRepository(),
    audit: new PersistentInMemoryBrainAuditRepository(),
    idempotency: new PersistentInMemoryBrainIdempotencyRepository(),
    snapshots: new PersistentInMemoryBrainSnapshotRepository(),
    corrections: new PersistentInMemoryCustomerCorrectionRepository(),
    memoryCandidates: new PersistentInMemoryBrainMemoryCandidateRepository(),
    dependencyStates: new PersistentInMemoryBrainDependencyStateRepository(),
    invalidationQueue: new PersistentInMemoryBrainInvalidationQueueRepository(),
    cacheMetadata: new PersistentInMemoryBrainCacheMetadataRepository(),
    approvals: new PersistentInMemoryBrainApprovalRepository(),
  };
}

/** Cross-org isolation guard for persistent stores. */
export function assertPersistentOrganizationAccess(
  recordOrgId: string,
  requestedOrgId: string,
  entityLabel: string
): void {
  if (recordOrgId !== requestedOrgId) {
    throw new BrainRunIsolationError(
      `${entityLabel} belongs to ${recordOrgId}, not ${requestedOrgId}`
    );
  }
}
