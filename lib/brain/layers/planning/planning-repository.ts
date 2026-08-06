import type { PlanningGraph } from "./types";

export type PlanningRecordKey = {
  organizationId: string;
  campaignId?: string;
  correlationId?: string;
};

export type PlanningRecord = {
  key: PlanningRecordKey;
  graph: PlanningGraph;
  storedAt: string;
  expiresAt?: string;
};

export type PlanningRepository = {
  store(record: PlanningRecord): void;
  get(key: PlanningRecordKey): PlanningRecord | null;
  getLatest(input: { organizationId: string; campaignId?: string }): PlanningRecord | null;
  delete(key: PlanningRecordKey): boolean;
  clear(): void;
};

export class InMemoryPlanningRepository implements PlanningRepository {
  private records = new Map<string, PlanningRecord>();

  private serializeKey(key: PlanningRecordKey): string {
    return `${key.organizationId}:${key.campaignId ?? "org"}:${key.correlationId ?? "latest"}`;
  }

  store(record: PlanningRecord): void {
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

  get(key: PlanningRecordKey): PlanningRecord | null {
    return this.records.get(this.serializeKey(key)) ?? null;
  }

  getLatest(input: { organizationId: string; campaignId?: string }): PlanningRecord | null {
    return (
      this.get({ organizationId: input.organizationId, campaignId: input.campaignId }) ??
      this.get({ organizationId: input.organizationId })
    );
  }

  delete(key: PlanningRecordKey): boolean {
    return this.records.delete(this.serializeKey(key));
  }

  clear(): void {
    this.records.clear();
  }
}

let defaultRepository: InMemoryPlanningRepository | null = null;

export function getDefaultPlanningRepository(): InMemoryPlanningRepository {
  if (!defaultRepository) defaultRepository = new InMemoryPlanningRepository();
  return defaultRepository;
}

export function resetDefaultPlanningRepository(): void {
  defaultRepository?.clear();
  defaultRepository = null;
}
