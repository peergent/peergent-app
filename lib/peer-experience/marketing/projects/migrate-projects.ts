import type { MarketingWorkspacePersistedState } from "@/lib/marketing-workspace/types";
import type { WorkUnit } from "@/lib/peer-workflow/work-unit";
import { createMarketingProject } from "./project-engine";
import type { MarketingProject } from "./types";

export type ProjectMigrationResult = {
  projects: MarketingProject[];
  workUnits: WorkUnit[];
};

/** Backfill projects for legacy workspaces where work units had no projectId. */
export function migrateWorkspaceProjects(
  state: Pick<MarketingWorkspacePersistedState, "projects" | "workUnits">
): ProjectMigrationResult {
  const existingProjects = state.projects ?? [];
  const workUnits = state.workUnits ?? [];
  const projectsById = new Map(existingProjects.map((p) => [p.id, p]));
  const migratedUnits: WorkUnit[] = [];
  const newProjects: MarketingProject[] = [];

  for (const unit of workUnits) {
    if (unit.projectId && projectsById.has(unit.projectId)) {
      migratedUnits.push(unit);
      continue;
    }

    if (unit.projectId && !projectsById.has(unit.projectId)) {
      const recovered: MarketingProject = {
        id: unit.projectId,
        peerId: unit.peerId,
        title: unit.title,
        goal: unit.objective ?? unit.rawRequest,
        campaignType: "custom",
        createdAt: unit.startedAt,
        updatedAt: unit.updatedAt,
        ownerLabel: "You",
        rawRequest: unit.rawRequest,
        archivedAt: unit.cancelled ? unit.updatedAt : null,
      };
      projectsById.set(recovered.id, recovered);
      newProjects.push(recovered);
      migratedUnits.push(unit);
      continue;
    }

    const project = createMarketingProject({
      peerId: unit.peerId,
      title: unit.title,
      goal: unit.objective ?? unit.rawRequest,
      channel: unit.channel,
      deliverableKind: unit.deliverableKind,
      rawRequest: unit.rawRequest,
      ownerLabel: "You",
    });
    project.createdAt = unit.startedAt;
    project.updatedAt = unit.updatedAt;
    if (unit.cancelled) {
      project.archivedAt = unit.updatedAt;
    }

    projectsById.set(project.id, project);
    newProjects.push(project);
    migratedUnits.push({ ...unit, projectId: project.id });
  }

  return {
    projects: [...existingProjects, ...newProjects],
    workUnits: migratedUnits.length > 0 ? migratedUnits : workUnits,
  };
}
