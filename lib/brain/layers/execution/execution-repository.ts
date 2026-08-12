import type { ExecutionHistory } from "./types";
import {
  getLayerRepositories,
  resetConfiguredLayerRepositories,
} from "../../persistence/layer-repository-factory";

export type ExecutionRecordKey = {
  organizationId: string;
  projectId: string;
  episodeId?: string;
  correlationId?: string;
};

export type ExecutionStoreRecord = {
  key: ExecutionRecordKey;
  history: ExecutionHistory;
  outputRef: string;
  storedAt: string;
  idempotencyKeys: readonly string[];
  batchIdempotencyKey: string;
};

export type ExecutionRepository = {
  store(record: ExecutionStoreRecord): void;
  get(key: ExecutionRecordKey): ExecutionStoreRecord | null;
  getLatest(input: { organizationId: string; projectId: string }): ExecutionStoreRecord | null;
  getByIdempotencyKey(input: {
    organizationId: string;
    idempotencyKey: string;
  }): ExecutionStoreRecord | null;
  clear(): void;
};

export class InMemoryExecutionRepository implements ExecutionRepository {
  private records = new Map<string, ExecutionStoreRecord>();
  private idempotencyIndex = new Map<string, ExecutionStoreRecord>();

  private serializeKey(key: ExecutionRecordKey): string {
    return `${key.organizationId}:${key.projectId}:${key.episodeId ?? "ep"}:${key.correlationId ?? "latest"}`;
  }

  store(record: ExecutionStoreRecord): void {
    this.records.set(this.serializeKey(record.key), record);
    this.records.set(
      this.serializeKey({
        organizationId: record.key.organizationId,
        projectId: record.key.projectId,
      }),
      record
    );
    for (const key of record.idempotencyKeys) {
      this.idempotencyIndex.set(`${record.key.organizationId}:${key}`, record);
    }
    this.idempotencyIndex.set(
      `${record.key.organizationId}:${record.batchIdempotencyKey}`,
      record
    );
  }

  get(key: ExecutionRecordKey): ExecutionStoreRecord | null {
    return this.records.get(this.serializeKey(key)) ?? null;
  }

  getLatest(input: { organizationId: string; projectId: string }): ExecutionStoreRecord | null {
    return this.get({ organizationId: input.organizationId, projectId: input.projectId });
  }

  getByIdempotencyKey(input: {
    organizationId: string;
    idempotencyKey: string;
  }): ExecutionStoreRecord | null {
    return this.idempotencyIndex.get(`${input.organizationId}:${input.idempotencyKey}`) ?? null;
  }

  clear(): void {
    this.records.clear();
    this.idempotencyIndex.clear();
  }
}

export function getDefaultExecutionRepository(): ExecutionRepository {
  return getLayerRepositories().execution;
}

export function resetDefaultExecutionRepository(): void {
  resetConfiguredLayerRepositories();
}
