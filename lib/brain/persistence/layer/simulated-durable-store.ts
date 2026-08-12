/**
 * Simulated Supabase durable store — separate from L1 cache for cold-start tests.
 */

import type { LayerDocumentRow } from "./supabase-sync";
import type {
  ProjectApprovalRecord,
  ProjectEpisodeRecord,
  ProjectRuntimeEvent,
  StoredPerformanceObservation,
} from "../../project-runtime/types";
import type { MemoryRecord } from "../../layers/memory/types";
import type { ExecutionIdempotencyRecord } from "./durable-persistence-port";

const documents = new Map<string, LayerDocumentRow>();
const latestPointers = new Map<string, { outputRef: string; documentId: string; version: number }>();
const episodes = new Map<string, { episode: ProjectEpisodeRecord; version: number }>();
const events = new Map<string, ProjectRuntimeEvent[]>();
const approvals = new Map<string, ProjectApprovalRecord[]>();
const observations = new Map<string, StoredPerformanceObservation[]>();
const orgMemories = new Map<string, MemoryRecord[]>();
const executionIdempotency = new Map<string, ExecutionIdempotencyRecord>();

function docKey(orgId: string, brainId: string, docId: string): string {
  return `${orgId}:${brainId}:${docId}`;
}

function episodeKey(orgId: string, projectId: string): string {
  return `${orgId}:${projectId}`;
}

function idemKey(orgId: string, key: string): string {
  return `${orgId}:${key}`;
}

export const simulatedDurableStore = {
  upsertDocument(row: LayerDocumentRow): void {
    documents.set(docKey(row.organization_id, row.brain_id, row.document_id), row);
  },

  upsertLatest(input: {
    organizationId: string;
    brainId: string;
    scopeKey: string;
    latestOutputRef: string;
    latestDocumentId: string;
    latestVersion: number;
  }): void {
    latestPointers.set(`${input.organizationId}:${input.brainId}:${input.scopeKey}`, {
      outputRef: input.latestOutputRef,
      documentId: input.latestDocumentId,
      version: input.latestVersion,
    });
  },

  getDocumentByOutputRef(orgId: string, outputRef: string): LayerDocumentRow | null {
    for (const row of documents.values()) {
      if (row.organization_id === orgId && row.output_ref === outputRef) return row;
    }
    return null;
  },

  listDocuments(orgId: string, projectId?: string): LayerDocumentRow[] {
    return [...documents.values()].filter(
      (d) => d.organization_id === orgId && (!projectId || d.project_id === projectId)
    );
  },

  upsertEpisode(episode: ProjectEpisodeRecord, expectedVersion: number): { newVersion: number; conflict: boolean } {
    const key = episodeKey(episode.snapshot.organizationId, episode.snapshot.projectId);
    const current = episodes.get(key);
    if (current && current.version !== expectedVersion) {
      return { newVersion: current.version, conflict: true };
    }
    const newVersion = (current?.version ?? 0) + 1;
    episodes.set(key, { episode, version: newVersion });
    return { newVersion, conflict: false };
  },

  getEpisode(orgId: string, projectId: string): { episode: ProjectEpisodeRecord; version: number } | null {
    return episodes.get(episodeKey(orgId, projectId)) ?? null;
  },

  appendEvent(event: ProjectRuntimeEvent): void {
    const list = events.get(event.projectId) ?? [];
    if (list.some((e) => e.eventId === event.eventId)) return;
    events.set(event.projectId, [...list, event]);
  },

  listEvents(projectId: string): readonly ProjectRuntimeEvent[] {
    return events.get(projectId) ?? [];
  },

  upsertApproval(record: ProjectApprovalRecord): void {
    const list = approvals.get(record.projectId) ?? [];
    const idx = list.findIndex((a) => a.id === record.id);
    if (idx >= 0) {
      const next = [...list];
      next[idx] = record;
      approvals.set(record.projectId, next);
      return;
    }
    approvals.set(record.projectId, [...list, record]);
  },

  getApprovals(projectId: string): readonly ProjectApprovalRecord[] {
    return approvals.get(projectId) ?? [];
  },

  upsertObservations(projectId: string, obs: readonly StoredPerformanceObservation[]): void {
    const list = observations.get(projectId) ?? [];
    const seen = new Set(list.map((o) => o.id));
    observations.set(projectId, [...list, ...obs.filter((o) => !seen.has(o.id))]);
  },

  getObservations(projectId: string): readonly StoredPerformanceObservation[] {
    return observations.get(projectId) ?? [];
  },

  upsertOrgMemories(orgId: string, memories: readonly MemoryRecord[]): void {
    const existing = orgMemories.get(orgId) ?? [];
    const byId = new Map(existing.map((m) => [m.id, m]));
    for (const mem of memories) byId.set(mem.id, mem);
    orgMemories.set(orgId, [...byId.values()]);
  },

  getOrgMemories(orgId: string): readonly MemoryRecord[] {
    return orgMemories.get(orgId) ?? [];
  },

  upsertExecutionIdempotency(record: ExecutionIdempotencyRecord): void {
    executionIdempotency.set(idemKey(record.organizationId, record.idempotencyKey), record);
  },

  getExecutionIdempotency(orgId: string, key: string): ExecutionIdempotencyRecord | null {
    return executionIdempotency.get(idemKey(orgId, key)) ?? null;
  },

  clear(): void {
    documents.clear();
    latestPointers.clear();
    episodes.clear();
    events.clear();
    approvals.clear();
    observations.clear();
    orgMemories.clear();
    executionIdempotency.clear();
  },
};

export function resetSimulatedDurableStore(): void {
  simulatedDurableStore.clear();
}
