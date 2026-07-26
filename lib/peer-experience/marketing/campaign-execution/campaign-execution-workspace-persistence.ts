import { createWorkUnit } from "@/lib/peer-workflow/work-unit-engine";
import type { WorkUnit } from "@/lib/peer-workflow/work-unit";
import type { MarketingProject } from "../projects/types";
import type { CampaignExecutionPersistencePort } from "./campaign-execution-application-source";
import { extractExecutorOperationIdFromRawRequest } from "./campaign-execution-application-source";

export type CampaignExecutionWorkspaceStateSnapshot = {
  readonly projects: readonly MarketingProject[];
  readonly workUnits: readonly WorkUnit[];
};

export type CampaignExecutionWorkspacePersistenceBundle = {
  readonly port: CampaignExecutionPersistencePort;
  readonly getNextState: () => CampaignExecutionWorkspaceStateSnapshot;
};

/**
 * In-memory persistence for one apply pass — commit once to React/session storage afterward.
 */
export function createCampaignExecutionWorkspacePersistence(input: {
  projects: readonly MarketingProject[];
  workUnits: readonly WorkUnit[];
}): CampaignExecutionWorkspacePersistenceBundle {
  let projects = [...input.projects];
  let workUnits = [...input.workUnits];

  const port: CampaignExecutionPersistencePort = {
    createWorkUnit: (createInput) => {
      const unit = createWorkUnit(createInput);
      workUnits = [...workUnits, unit];
      return unit;
    },
    updateWorkUnit: (unit) => {
      workUnits = workUnits.map((u) => (u.id === unit.id ? unit : u));
      return unit;
    },
    updateProject: (project) => {
      projects = projects.map((p) => (p.id === project.id ? project : p));
      return project;
    },
  };

  return {
    port,
    getNextState: () => ({
      projects: Object.freeze([...projects]),
      workUnits: Object.freeze([...workUnits]),
    }),
  };
}

export function collectAppliedCampaignOperationIds(
  workUnits: readonly WorkUnit[],
  projectId: string
): string[] {
  const ids: string[] = [];
  for (const unit of workUnits) {
    if (unit.projectId !== projectId || unit.cancelled) continue;
    const opId = extractExecutorOperationIdFromRawRequest(unit.rawRequest);
    if (opId) ids.push(opId);
  }
  return ids;
}

export function mergeWorkUnitsPreservingOthers(
  previous: readonly WorkUnit[],
  nextForProject: readonly WorkUnit[],
  projectId: string
): WorkUnit[] {
  const replacedIds = new Set(nextForProject.filter((u) => u.projectId === projectId).map((u) => u.id));
  const preserved = previous.filter((u) => u.projectId !== projectId && !replacedIds.has(u.id));
  const projectUnits = nextForProject.filter((u) => u.projectId === projectId);
  return [...preserved, ...projectUnits];
}

export function mergeProjectsPreservingOthers(
  previous: readonly MarketingProject[],
  nextProjects: readonly MarketingProject[],
  projectId: string
): MarketingProject[] {
  const updated = nextProjects.find((p) => p.id === projectId);
  if (!updated) return [...previous];
  return previous.map((p) => (p.id === projectId ? updated : p));
}
