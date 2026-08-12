import type { CompanyGraph, CompanyGraphSnapshot, CompanyHistory, CompanyHistoryEntry } from "./types";
import {
  getLayerRepositories,
  resetConfiguredLayerRepositories,
} from "../../persistence/layer-repository-factory";

export type CompanyStoreRecord = {
  organizationId: string;
  graph: CompanyGraph;
  snapshot: CompanyGraphSnapshot;
  outputRef: string;
  storedAt: string;
  history: CompanyHistory;
};

export type CompanyRepository = {
  store(record: CompanyStoreRecord): void;
  getLatest(organizationId: string): CompanyStoreRecord | null;
  getVersion(input: { organizationId: string; version: number }): CompanyStoreRecord | null;
  getHistory(organizationId: string): CompanyHistory;
  clear(): void;
};

export class InMemoryCompanyRepository implements CompanyRepository {
  private latest = new Map<string, CompanyStoreRecord>();
  private versions = new Map<string, CompanyStoreRecord>();

  private versionKey(orgId: string, version: number): string {
    return `${orgId}:v${version}`;
  }

  store(record: CompanyStoreRecord): void {
    this.latest.set(record.organizationId, record);
    this.versions.set(this.versionKey(record.organizationId, record.graph.versionMeta.version), record);
  }

  getLatest(organizationId: string): CompanyStoreRecord | null {
    return this.latest.get(organizationId) ?? null;
  }

  getVersion(input: { organizationId: string; version: number }): CompanyStoreRecord | null {
    return this.versions.get(this.versionKey(input.organizationId, input.version)) ?? null;
  }

  getHistory(organizationId: string): CompanyHistory {
    return this.latest.get(organizationId)?.history ?? { organizationId, entries: [] };
  }

  clear(): void {
    this.latest.clear();
    this.versions.clear();
  }
}

export function appendHistoryEntry(
  history: CompanyHistory,
  entry: CompanyHistoryEntry
): CompanyHistory {
  return {
    organizationId: history.organizationId,
    entries: [...history.entries, entry],
  };
}

export function getDefaultCompanyRepository(): CompanyRepository {
  return getLayerRepositories().company;
}

export function resetDefaultCompanyRepository(): void {
  resetConfiguredLayerRepositories();
}
