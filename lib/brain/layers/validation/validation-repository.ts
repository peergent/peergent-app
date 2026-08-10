import type { ValidationGraph } from "./types";

export type ValidationRecordKey = {
  organizationId: string;
  campaignId?: string;
  episodeId?: string;
  correlationId?: string;
};

export type ValidationRecord = {
  key: ValidationRecordKey;
  graph: ValidationGraph;
  outputRef: string;
  storedAt: string;
  expiresAt?: string;
};

export type ValidationRepository = {
  store(record: ValidationRecord): void;
  get(key: ValidationRecordKey): ValidationRecord | null;
  getLatest(input: { organizationId: string; campaignId?: string }): ValidationRecord | null;
  delete(key: ValidationRecordKey): boolean;
  clear(): void;
};

export class InMemoryValidationRepository implements ValidationRepository {
  private records = new Map<string, ValidationRecord>();

  private serializeKey(key: ValidationRecordKey): string {
    return `${key.organizationId}:${key.campaignId ?? "org"}:${key.episodeId ?? "ep"}:${key.correlationId ?? "latest"}`;
  }

  store(record: ValidationRecord): void {
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

  get(key: ValidationRecordKey): ValidationRecord | null {
    return this.records.get(this.serializeKey(key)) ?? null;
  }

  getLatest(input: { organizationId: string; campaignId?: string }): ValidationRecord | null {
    return (
      this.get({ organizationId: input.organizationId, campaignId: input.campaignId }) ??
      this.get({ organizationId: input.organizationId })
    );
  }

  delete(key: ValidationRecordKey): boolean {
    return this.records.delete(this.serializeKey(key));
  }

  clear(): void {
    this.records.clear();
  }
}

let defaultRepository: InMemoryValidationRepository | null = null;

export function getDefaultValidationRepository(): InMemoryValidationRepository {
  if (!defaultRepository) defaultRepository = new InMemoryValidationRepository();
  return defaultRepository;
}

export function resetDefaultValidationRepository(): void {
  defaultRepository?.clear();
  defaultRepository = null;
}
