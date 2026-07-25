import type { WorkUnit } from "@/lib/peer-workflow/work-unit";
import {
  WORK_LIFECYCLE_LABELS,
  WORK_LIFECYCLE_STAGES,
  type WorkLifecycleStage,
} from "@/lib/peer-workflow/work-lifecycle";
import { primaryWorkUnitForProject } from "@/lib/peer-experience/marketing/projects/project-engine";

export type ProjectCardStep = {
  id: string;
  label: string;
  state: "done" | "current" | "pending";
};

const CARD_STAGES: WorkLifecycleStage[] = [
  "understanding",
  "planning",
  "creating",
  "review_ready",
  "approved",
  "published",
];

export function buildProjectCardSteps(
  projectId: string,
  workUnits: WorkUnit[]
): ProjectCardStep[] {
  const unit = primaryWorkUnitForProject(projectId, workUnits);
  if (!unit) {
    return [
      { id: "planning", label: "Planning", state: "current" },
      { id: "creating", label: "Create deliverables", state: "pending" },
    ];
  }

  const currentIdx = WORK_LIFECYCLE_STAGES.indexOf(unit.status);
  return CARD_STAGES.map((stage) => {
    const idx = WORK_LIFECYCLE_STAGES.indexOf(stage);
    let state: ProjectCardStep["state"] = "pending";
    if (idx < currentIdx) state = "done";
    else if (idx === currentIdx || (currentIdx === -1 && stage === "planning")) state = "current";
    if (unit.status === "published" || unit.status === "monitoring") {
      state = "done";
    }
    return {
      id: stage,
      label: WORK_LIFECYCLE_LABELS[stage],
      state,
    };
  });
}

export function remainingProjectSteps(steps: ProjectCardStep[]): number {
  return steps.filter((s) => s.state === "pending" || s.state === "current").length;
}
