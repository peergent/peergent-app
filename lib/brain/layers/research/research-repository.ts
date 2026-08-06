import type { ResearchGraph } from "./types";

/** Key for ephemeral research storage — independent from durable Memory. */
export type ResearchRecordKey = {
  organizationId: string;
  campaignId?: string;
  correlationId?: string;
};

export type ResearchRecord = {
  key: ResearchRecordKey;
  graph: ResearchGraph;
  storedAt: string;
  expiresAt?: string;
};

/**
 * Research Repository contract.
 * Research is temporary — Memory stores validated knowledge later (Validation Layer).
 */
export type ResearchRepository = {
  store(record: ResearchRecord): void;
  get(key: ResearchRecordKey): ResearchRecord | null;
  getLatest(input: { organizationId: string; campaignId?: string }): ResearchRecord | null;
  delete(key: ResearchRecordKey): boolean;
  clear(): void;
};

export class InMemoryResearchRepository implements ResearchRepository {
  private records = new Map<string, ResearchRecord>();

  private serializeKey(key: ResearchRecordKey): string {
    return `${key.organizationId}:${key.campaignId ?? "org"}:${key.correlationId ?? "latest"}`;
  }

  store(record: ResearchRecord): void {
    this.records.set(this.serializeKey(record.key), record);
    if (record.key.campaignId) {
      this.records.set(
        this.serializeKey({ organizationId: record.key.organizationId, campaignId: record.key.campaignId }),
        record
      );
    }
  }

  get(key: ResearchRecordKey): ResearchRecord | null {
    return this.records.get(this.serializeKey(key)) ?? null;
  }

  getLatest(input: { organizationId: string; campaignId?: string }): ResearchRecord | null {
    return (
      this.get({ organizationId: input.organizationId, campaignId: input.campaignId }) ??
      this.get({ organizationId: input.organizationId })
    );
  }

  delete(key: ResearchRecordKey): boolean {
    return this.records.delete(this.serializeKey(key));
  }

  clear(): void {
    this.records.clear();
  }
}

let defaultResearchRepository: ResearchRepository | null = null;

export function getDefaultResearchRepository(): ResearchRepository {
  if (!defaultResearchRepository) {
    defaultResearchRepository = new InMemoryResearchRepository();
  }
  return defaultResearchRepository;
}

export function resetDefaultResearchRepository(): void {
  defaultResearchRepository?.clear();
  defaultResearchRepository = null;
}
