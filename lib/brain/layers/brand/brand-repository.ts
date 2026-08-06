import type { BrandGraph } from "./types";

/** Key for ephemeral brand storage — independent from durable Memory (future). */
export type BrandRecordKey = {
  organizationId: string;
  campaignId?: string;
  correlationId?: string;
};

export type BrandRecord = {
  key: BrandRecordKey;
  graph: BrandGraph;
  storedAt: string;
  expiresAt?: string;
};

/**
 * Brand Repository contract.
 * Brand Brain stores research + model ephemerally until Brand Memory validates knowledge.
 */
export type BrandRepository = {
  store(record: BrandRecord): void;
  get(key: BrandRecordKey): BrandRecord | null;
  getLatest(input: { organizationId: string; campaignId?: string }): BrandRecord | null;
  delete(key: BrandRecordKey): boolean;
  clear(): void;
};

export class InMemoryBrandRepository implements BrandRepository {
  private records = new Map<string, BrandRecord>();

  private serializeKey(key: BrandRecordKey): string {
    return `${key.organizationId}:${key.campaignId ?? "org"}:${key.correlationId ?? "latest"}`;
  }

  store(record: BrandRecord): void {
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

  get(key: BrandRecordKey): BrandRecord | null {
    return this.records.get(this.serializeKey(key)) ?? null;
  }

  getLatest(input: { organizationId: string; campaignId?: string }): BrandRecord | null {
    return (
      this.get({ organizationId: input.organizationId, campaignId: input.campaignId }) ??
      this.get({ organizationId: input.organizationId })
    );
  }

  delete(key: BrandRecordKey): boolean {
    return this.records.delete(this.serializeKey(key));
  }

  clear(): void {
    this.records.clear();
  }
}

let defaultBrandRepository: BrandRepository | null = null;

export function getDefaultBrandRepository(): BrandRepository {
  if (!defaultBrandRepository) {
    defaultBrandRepository = new InMemoryBrandRepository();
  }
  return defaultBrandRepository;
}

export function resetDefaultBrandRepository(): void {
  defaultBrandRepository?.clear();
  defaultBrandRepository = null;
}
