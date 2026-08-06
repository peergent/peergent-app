import type { MarketingIntelligenceGraph } from "./types";

export type MarketingIntelligenceRecordKey = {
  organizationId: string;
  campaignId?: string;
  correlationId?: string;
};

export type MarketingIntelligenceRecord = {
  key: MarketingIntelligenceRecordKey;
  graph: MarketingIntelligenceGraph;
  storedAt: string;
};

export type MarketingIntelligenceRepository = {
  store(record: MarketingIntelligenceRecord): void;
  getLatest(input: { organizationId: string; campaignId?: string }): MarketingIntelligenceRecord | null;
  clear(): void;
};

export class InMemoryMarketingIntelligenceRepository implements MarketingIntelligenceRepository {
  private records = new Map<string, MarketingIntelligenceRecord>();

  private serializeKey(key: MarketingIntelligenceRecordKey): string {
    return `${key.organizationId}:${key.campaignId ?? "org"}:${key.correlationId ?? "latest"}`;
  }

  store(record: MarketingIntelligenceRecord): void {
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

  getLatest(input: { organizationId: string; campaignId?: string }): MarketingIntelligenceRecord | null {
    const key = this.serializeKey({
      organizationId: input.organizationId,
      campaignId: input.campaignId,
    });
    return this.records.get(key) ?? null;
  }

  clear(): void {
    this.records.clear();
  }
}

let defaultRepository: InMemoryMarketingIntelligenceRepository | null = null;

export function getDefaultMarketingIntelligenceRepository(): InMemoryMarketingIntelligenceRepository {
  if (!defaultRepository) defaultRepository = new InMemoryMarketingIntelligenceRepository();
  return defaultRepository;
}

export function resetDefaultMarketingIntelligenceRepository(): void {
  defaultRepository?.clear();
  defaultRepository = null;
}
