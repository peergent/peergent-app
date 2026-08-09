/**
 * Persistence model — what the Project Engine stores per project episode.
 */

import type { ProjectEngineSnapshot } from "./types";

export type PersistedProjectEngineRecord = {
  recordVersion: 1;
  snapshot: ProjectEngineSnapshot;
  revision: string;
  persistedAt: string;
};

export type ProjectEngineRepository = {
  load(input: { peerId: string; projectId: string }): Promise<PersistedProjectEngineRecord | null>;
  save(record: PersistedProjectEngineRecord): Promise<PersistedProjectEngineRecord>;
};

export type ProjectEnginePersistenceAdapter = {
  readSnapshot(input: { peerId: string; projectId: string }): ProjectEngineSnapshot | null;
  writeSnapshot(snapshot: ProjectEngineSnapshot): void;
};

export function createPersistenceRecord(
  snapshot: ProjectEngineSnapshot,
  revision?: string
): PersistedProjectEngineRecord {
  return {
    recordVersion: 1,
    snapshot,
    revision: revision ?? `${snapshot.updatedAt}:${snapshot.contextVersion}`,
    persistedAt: new Date().toISOString(),
  };
}

export type ProjectEngineSetupFields = {
  projectEngineSnapshot?: ProjectEngineSnapshot;
  projectEngineRevision?: string;
};

export const MAX_EVENT_LOG_ENTRIES = 200;
export const MAX_BRAIN_HISTORY_ENTRIES = 50;
export const DEFAULT_MAX_RETRIES = 3;

export function trimEngineSnapshot(snapshot: ProjectEngineSnapshot): ProjectEngineSnapshot {
  return {
    ...snapshot,
    eventLog: snapshot.eventLog.slice(-MAX_EVENT_LOG_ENTRIES),
    brainHistory: snapshot.brainHistory.slice(-MAX_BRAIN_HISTORY_ENTRIES),
  };
}
