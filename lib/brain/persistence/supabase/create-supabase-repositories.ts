import type { AppSupabaseClient } from "@/lib/intelligence/api/org-context";
import type { AsyncBrainRepositories } from "../contracts";
import {
  PersistentInMemoryBrainApprovalRepository,
  PersistentInMemoryBrainAuditRepository,
  PersistentInMemoryBrainCacheMetadataRepository,
  PersistentInMemoryBrainDependencyStateRepository,
  PersistentInMemoryBrainIdempotencyRepository,
  PersistentInMemoryBrainInvalidationQueueRepository,
  PersistentInMemoryBrainMemoryCandidateRepository,
  PersistentInMemoryBrainOutputRepository,
  PersistentInMemoryBrainRunRepository,
  PersistentInMemoryBrainSnapshotRepository,
  PersistentInMemoryCustomerCorrectionRepository,
} from "../in-memory-persistent-repositories";
import { SupabaseBrainRunRepository } from "./supabase-run-repository";
import { SupabaseBrainOutputRepository } from "./supabase-output-repository";
import { SupabaseBrainAuditRepository } from "./supabase-audit-repository";
import { SupabaseBrainIdempotencyRepository } from "./supabase-idempotency-repository";

/**
 * Supabase-backed Brain repositories for live organizations.
 * Snapshot/correction/queue repos use persistent in-memory until Supabase adapters land.
 */
export function createSupabaseBrainRepositories(supabase: AppSupabaseClient): AsyncBrainRepositories {
  return {
    runs: new SupabaseBrainRunRepository(supabase),
    outputs: new SupabaseBrainOutputRepository(supabase),
    audit: new SupabaseBrainAuditRepository(supabase),
    idempotency: new SupabaseBrainIdempotencyRepository(supabase),
    snapshots: new PersistentInMemoryBrainSnapshotRepository(),
    corrections: new PersistentInMemoryCustomerCorrectionRepository(),
    memoryCandidates: new PersistentInMemoryBrainMemoryCandidateRepository(),
    dependencyStates: new PersistentInMemoryBrainDependencyStateRepository(),
    invalidationQueue: new PersistentInMemoryBrainInvalidationQueueRepository(),
    cacheMetadata: new PersistentInMemoryBrainCacheMetadataRepository(),
    approvals: new PersistentInMemoryBrainApprovalRepository(),
  };
}

/** Test helper — full persistent in-memory bundle without Supabase. */
export function createTestPersistentRepositories(): AsyncBrainRepositories {
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
