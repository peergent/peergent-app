import type { CreativeGraph } from "./types";

export type CreativeRecordKey = {
  organizationId: string;
  campaignId?: string;
  episodeId?: string;
  correlationId?: string;
};

export type CreativeRecord = {
  key: CreativeRecordKey;
  graph: CreativeGraph;
  outputRef: string;
  storedAt: string;
  expiresAt?: string;
};

export type CreativeRepository = {
  store(record: CreativeRecord): void;
  get(key: CreativeRecordKey): CreativeRecord | null;
  getLatest(input: { organizationId: string; campaignId?: string }): CreativeRecord | null;
  delete(key: CreativeRecordKey): boolean;
  clear(): void;
};

export class InMemoryCreativeRepository implements CreativeRepository {
  private records = new Map<string, CreativeRecord>();

  private serializeKey(key: CreativeRecordKey): string {
    return `${key.organizationId}:${key.campaignId ?? "org"}:${key.episodeId ?? "ep"}:${key.correlationId ?? "latest"}`;
  }

  store(record: CreativeRecord): void {
    this.records.set(this.serializeKey(record.key), record);
    if (record.key.campaignId) {
      this.records.set(
        this.serializeKey({
          organizationId: record.key.organizationId,
          campaignId: record.key.campaignId,
        }),
        record
      );
    }
  }

  get(key: CreativeRecordKey): CreativeRecord | null {
    return this.records.get(this.serializeKey(key)) ?? null;
  }

  getLatest(input: { organizationId: string; campaignId?: string }): CreativeRecord | null {
    return (
      this.get({ organizationId: input.organizationId, campaignId: input.campaignId }) ??
      this.get({ organizationId: input.organizationId })
    );
  }

  delete(key: CreativeRecordKey): boolean {
    return this.records.delete(this.serializeKey(key));
  }

  clear(): void {
    this.records.clear();
  }
}

let defaultRepository: InMemoryCreativeRepository | null = null;

export function getDefaultCreativeRepository(): InMemoryCreativeRepository {
  if (!defaultRepository) defaultRepository = new InMemoryCreativeRepository();
  return defaultRepository;
}

export function resetDefaultCreativeRepository(): void {
  defaultRepository?.clear();
  defaultRepository = null;
}
