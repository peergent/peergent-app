import type {
  AsyncBrainAuditRepository,
  AsyncBrainIdempotencyRepository,
  AsyncBrainOutputRepository,
  AsyncBrainRepositories,
  AsyncBrainRunRepository,
} from "./contracts";
import type { BrainRunRepository, BrainOutputRepository, BrainAuditRepository, BrainIdempotencyRepository } from "../runtime/repositories/contracts";
import type { BrainCapabilityId } from "../capabilities/registry";
import { hashContextSlices } from "../providers/token-strategy";

export function wrapSyncRunRepository(sync: BrainRunRepository): AsyncBrainRunRepository {
  return {
    create: (run) => Promise.resolve(sync.create(run)),
    update: (run) => Promise.resolve(sync.update(run)),
    getById: (org, id) => Promise.resolve(sync.getById(org, id)),
    listByOrganization: (org) => Promise.resolve(sync.listByOrganization(org)),
    countByOrganization: (org) => Promise.resolve(sync.countByOrganization(org)),
    countChildRuns: (org, parent) => Promise.resolve(sync.countChildRuns(org, parent)),
  };
}

export function wrapSyncOutputRepository(sync: BrainOutputRepository): AsyncBrainOutputRepository {
  return {
    store: async (input) =>
      sync.store({
        organizationId: input.organizationId,
        runId: input.runId,
        output: input.output,
        storedAt: input.storedAt,
      }),
    getByRunId: (org, runId) => Promise.resolve(sync.getByRunId(org, runId)),
    getRecordById: async (org, outputId) => {
      void org;
      void outputId;
      return null;
    },
    getLatestCompatible: async () => null,
    markSuperseded: async () => undefined,
  };
}

export function wrapSyncAuditRepository(sync: BrainAuditRepository): AsyncBrainAuditRepository {
  return {
    append: (record) => Promise.resolve(sync.append(record)),
    listByTrace: (org, trace) => Promise.resolve(sync.listByTrace(org, trace)),
    listByRun: (org, runId) => Promise.resolve(sync.listByRun(org, runId)),
  };
}

export function wrapSyncIdempotencyRepository(sync: BrainIdempotencyRepository): AsyncBrainIdempotencyRepository {
  return {
    get: async (org, capabilityId, key) => {
      const runId = sync.get(org, key);
      if (!runId) return null;
      return {
        organizationId: org,
        capabilityId,
        idempotencyKey: key,
        runId,
        requestHash: "legacy",
        createdAt: new Date().toISOString(),
      };
    },
    set: async (record) => {
      sync.set(record.organizationId, record.idempotencyKey, record.runId);
    },
  };
}

export function wrapSyncRepositories(
  sync: {
    runs: BrainRunRepository;
    outputs: BrainOutputRepository;
    audit: BrainAuditRepository;
    idempotency: BrainIdempotencyRepository;
  },
  persistent: AsyncBrainRepositories
): AsyncBrainRepositories {
  void sync;
  return persistent;
}

export function hashIdempotencyRequest(input: {
  organizationId: string;
  capabilityId: BrainCapabilityId;
  payloadRefId?: string;
  campaignId?: string;
}): string {
  return hashContextSlices([
    input.organizationId,
    input.capabilityId,
    input.payloadRefId ?? "none",
    input.campaignId ?? "none",
  ]);
}

export function hashOutputContent(output: unknown): string {
  return hashContextSlices([JSON.stringify(output)]);
}
