/**
 * Create and update project engine snapshots.
 */

import { createProjectEngineEvent } from "./event-model";
import type { ProjectEngineSnapshot, ProjectLifecycleState } from "./types";
import { PROJECT_ENGINE_VERSION } from "./types";

export type CreateProjectSnapshotInput = {
  projectId: string;
  peerId: string;
  organizationId: string;
  episodeId?: string;
  contextVersion?: number;
  locale?: "nl" | "en";
  now?: Date;
};

export function createProjectEngineSnapshot(
  input: CreateProjectSnapshotInput
): ProjectEngineSnapshot {
  const now = input.now ?? new Date();
  const iso = now.toISOString();
  const nl = input.locale === "nl";

  const snapshot: ProjectEngineSnapshot = {
    projectId: input.projectId,
    peerId: input.peerId,
    organizationId: input.organizationId,
    episodeId: input.episodeId ?? `ep-${input.projectId}-${now.getTime()}`,
    state: "created",
    previousState: null,
    activeBrain: null,
    completedBrains: [],
    pendingBrains: [
      "company",
      "research",
      "reasoning",
      "marketing_intelligence",
      "strategy",
      "planning",
      "creative",
      "validation",
      "execution",
      "memory",
      "learning",
    ],
    waitingReason: null,
    approvalCheckpoint: null,
    brainHistory: [],
    decisionIds: [],
    eventLog: [],
    retryCount: {},
    contextVersion: input.contextVersion ?? 0,
    startedAt: iso,
    updatedAt: iso,
    completedAt: null,
    engineVersion: PROJECT_ENGINE_VERSION,
  };

  const event = createProjectEngineEvent({
    type: "project_created",
    brainId: null,
    state: "created",
    nl,
    at: now,
  });

  return { ...snapshot, eventLog: [event] };
}

export function withProjectState(
  snapshot: ProjectEngineSnapshot,
  state: ProjectLifecycleState,
  now: Date
): ProjectEngineSnapshot {
  return {
    ...snapshot,
    previousState: snapshot.state,
    state,
    updatedAt: now.toISOString(),
    completedAt: state === "complete" ? now.toISOString() : snapshot.completedAt,
  };
}
