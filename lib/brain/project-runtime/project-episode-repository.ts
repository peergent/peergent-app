/**
 * In-memory project episode persistence — PX-48 can replace with durable store.
 */

import type {
  ProjectApprovalRecord,
  ProjectEpisodeRecord,
  StoredPerformanceObservation,
} from "./types";

export type ProjectEpisodeRepository = {
  save(episode: ProjectEpisodeRecord): void;
  get(input: { organizationId: string; projectId: string }): ProjectEpisodeRecord | null;
  saveApproval(record: ProjectApprovalRecord): void;
  getApprovals(projectId: string): readonly ProjectApprovalRecord[];
  saveObservations(projectId: string, observations: readonly StoredPerformanceObservation[]): void;
  getObservations(projectId: string): readonly StoredPerformanceObservation[];
  listEvents(projectId: string): readonly import("./types").ProjectRuntimeEvent[];
  appendEvent(projectId: string, event: import("./types").ProjectRuntimeEvent): void;
  clear(): void;
};

export class InMemoryProjectEpisodeRepository implements ProjectEpisodeRepository {
  private episodes = new Map<string, ProjectEpisodeRecord>();
  private approvals = new Map<string, ProjectApprovalRecord[]>();
  private observations = new Map<string, StoredPerformanceObservation[]>();
  private events = new Map<string, import("./types").ProjectRuntimeEvent[]>();

  private key(orgId: string, projectId: string): string {
    return `${orgId}:${projectId}`;
  }

  save(episode: ProjectEpisodeRecord): void {
    this.episodes.set(this.key(episode.snapshot.organizationId, episode.snapshot.projectId), episode);
  }

  get(input: { organizationId: string; projectId: string }): ProjectEpisodeRecord | null {
    return this.episodes.get(this.key(input.organizationId, input.projectId)) ?? null;
  }

  saveApproval(record: ProjectApprovalRecord): void {
    const list = this.approvals.get(record.projectId) ?? [];
    this.approvals.set(record.projectId, [...list, record]);
  }

  getApprovals(projectId: string): readonly ProjectApprovalRecord[] {
    return this.approvals.get(projectId) ?? [];
  }

  saveObservations(projectId: string, observations: readonly StoredPerformanceObservation[]): void {
    const list = this.observations.get(projectId) ?? [];
    this.observations.set(projectId, [...list, ...observations]);
  }

  getObservations(projectId: string): readonly StoredPerformanceObservation[] {
    return this.observations.get(projectId) ?? [];
  }

  listEvents(projectId: string): readonly import("./types").ProjectRuntimeEvent[] {
    return this.events.get(projectId) ?? [];
  }

  appendEvent(projectId: string, event: import("./types").ProjectRuntimeEvent): void {
    const list = this.events.get(projectId) ?? [];
    this.events.set(projectId, [...list, event]);
  }

  clear(): void {
    this.episodes.clear();
    this.approvals.clear();
    this.observations.clear();
    this.events.clear();
  }
}

let defaultRepo: InMemoryProjectEpisodeRepository | null = null;

export function getDefaultProjectEpisodeRepository(): ProjectEpisodeRepository {
  if (!defaultRepo) defaultRepo = new InMemoryProjectEpisodeRepository();
  return defaultRepo;
}

export function resetDefaultProjectEpisodeRepository(): void {
  defaultRepo?.clear();
  defaultRepo = null;
}
