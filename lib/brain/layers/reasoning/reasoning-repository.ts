import type { ReasoningGraph } from "./types";

export type ReasoningRecordKey = {
  organizationId: string;
  campaignId?: string;
  correlationId?: string;
};

export type ReasoningRecord = {
  key: ReasoningRecordKey;
  graph: ReasoningGraph;
  storedAt: string;
  expiresAt?: string;
};

/**
 * Reasoning Repository — ephemeral only.
 * No Memory writes. Validated understanding promotes later via Validation Layer.
 */
export type ReasoningRepository = {
  store(record: ReasoningRecord): void;
  get(key: ReasoningRecordKey): ReasoningRecord | null;
  getLatest(input: { organizationId: string; campaignId?: string }): ReasoningRecord | null;
  delete(key: ReasoningRecordKey): boolean;
  clear(): void;
};

export class InMemoryReasoningRepository implements ReasoningRepository {
  private records = new Map<string, ReasoningRecord>();

  private serializeKey(key: ReasoningRecordKey): string {
    return `${key.organizationId}:${key.campaignId ?? "org"}:${key.correlationId ?? "latest"}`;
  }

  store(record: ReasoningRecord): void {
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

  get(key: ReasoningRecordKey): ReasoningRecord | null {
    return this.records.get(this.serializeKey(key)) ?? null;
  }

  getLatest(input: { organizationId: string; campaignId?: string }): ReasoningRecord | null {
    return (
      this.get({ organizationId: input.organizationId, campaignId: input.campaignId }) ??
      this.get({ organizationId: input.organizationId })
    );
  }

  delete(key: ReasoningRecordKey): boolean {
    return this.records.delete(this.serializeKey(key));
  }

  clear(): void {
    this.records.clear();
  }
}

let defaultReasoningRepository: ReasoningRepository | null = null;

export function getDefaultReasoningRepository(): ReasoningRepository {
  if (!defaultReasoningRepository) {
    defaultReasoningRepository = new InMemoryReasoningRepository();
  }
  return defaultReasoningRepository;
}

export function resetDefaultReasoningRepository(): void {
  defaultReasoningRepository?.clear();
  defaultReasoningRepository = null;
}
