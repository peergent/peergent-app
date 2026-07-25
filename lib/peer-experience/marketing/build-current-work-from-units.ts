import type { MarketingContentDraft } from "@/lib/marketing-intelligence";
import type { WorkUnit } from "@/lib/peer-workflow/work-unit";
import {
  WORK_LIFECYCLE_LABELS,
  WORK_LIFECYCLE_STAGES,
  type WorkLifecycleStage,
} from "@/lib/peer-workflow/work-lifecycle";
import type {
  EmmaCurrentWorkViewModel,
  EmmaPipelineStage,
  EmmaWorkTaskAction,
  EmmaWorkTaskViewModel,
} from "./emma-workspace-types";
import { formatRelativeTime } from "./emma-narrative";

const CREATION_STAGE_LABELS = [
  "Understanding",
  "Planning",
  "Writing caption",
  "Creating image",
  "Brand review",
  "Preparing review",
  "Publishing",
] as const;

function stagesForWorkUnit(unit: WorkUnit): EmmaPipelineStage[] {
  const lifecycleIdx = WORK_LIFECYCLE_STAGES.indexOf(unit.status);

  if (unit.needsVisual && unit.status === "creating") {
    return [
      { id: "u1", label: "Understanding", progress: 100, status: "complete" },
      { id: "u2", label: "Planning", progress: 100, status: "complete" },
      {
        id: "u3",
        label: "Writing caption",
        progress: 0,
        status: "active",
        waitLabel: "In progress",
      },
      { id: "u4", label: "Creating image", progress: 0, status: "pending", waitLabel: "Waiting" },
      { id: "u5", label: "Brand review", progress: 0, status: "pending", waitLabel: "Waiting" },
      {
        id: "u6",
        label: "Preparing review",
        progress: 0,
        status: "pending",
        waitLabel: "Waiting",
      },
      { id: "u7", label: "Publishing", progress: 0, status: "pending", waitLabel: "Waiting" },
    ];
  }

  return WORK_LIFECYCLE_STAGES.slice(0, 7).map((stage, index) => {
    const label = CREATION_STAGE_LABELS[index] ?? WORK_LIFECYCLE_LABELS[stage];
    if (index < lifecycleIdx) {
      return { id: stage, label, progress: 100, status: "complete" as const };
    }
    if (index === lifecycleIdx) {
      return {
        id: stage,
        label,
        progress: 0,
        status: "active" as const,
        waitLabel: "In progress",
      };
    }
    return { id: stage, label, progress: 0, status: "pending" as const, waitLabel: "Waiting" };
  });
}

function computeProgress(stages: EmmaPipelineStage[]): number {
  if (stages.length === 0) return 0;
  const complete = stages.filter((s) => s.status === "complete").length;
  const hasActive = stages.some((s) => s.status === "active");
  const slice = 100 / stages.length;
  const value = complete * slice + (hasActive ? slice * 0.65 : 0);
  return Math.min(99, Math.max(0, Math.round(value)));
}

function humanStatusLabel(unit: WorkUnit, stages: EmmaPipelineStage[]): string {
  if (unit.paused) return "Paused";
  const active = stages.find((s) => s.status === "active");
  if (active) return active.label;
  switch (unit.status) {
    case "review_ready":
      return "Ready for your review";
    case "approved":
      return "Approved";
    case "scheduled":
      return "Scheduled to publish";
    case "published":
      return "Published";
    case "understanding":
      return "Understanding the brief";
    case "planning":
      return "Planning";
    case "creating":
      return "Creating";
    default:
      return "In progress";
  }
}

function etaLabel(unit: WorkUnit): string | null {
  if (unit.estimatedCompletionAt) {
    const mins = Math.max(
      1,
      Math.round((new Date(unit.estimatedCompletionAt).getTime() - Date.now()) / 60000)
    );
    return `${mins} min`;
  }
  if (unit.status === "creating") return "~12 min";
  if (unit.status === "planning") return "~5 min";
  return null;
}

function actionsForWorkUnit(_unit: WorkUnit): EmmaWorkTaskAction[] {
  return [];
}

export function mapWorkUnitToTaskViewModel(
  unit: WorkUnit,
  isSelected = false
): EmmaWorkTaskViewModel {
  const stages = stagesForWorkUnit(unit);
  const activeStage = stages.find((s) => s.status === "active");
  const statusLabel = humanStatusLabel(unit, stages);

  return {
    id: unit.id,
    title: unit.title,
    lifecycleStage: unit.status,
    lifecycleLabel: statusLabel,
    statusLabel,
    activeStageLabel: activeStage?.label ?? null,
    startedLabel: formatRelativeTime(unit.startedAt) || "Just now",
    estimatedCompletionLabel: unit.estimatedCompletionAt
      ? new Date(unit.estimatedCompletionAt).toLocaleString()
      : null,
    stages,
    artifacts: unit.artifacts.map((a) => ({ id: a.id, label: a.label, refId: a.refId })),
    actions: actionsForWorkUnit(unit),
    isPaused: unit.paused,
    isActive: !unit.cancelled && unit.status !== "published" && unit.status !== "monitoring",
    isSelected,
    progressPercent: computeProgress(stages),
    etaLabel: etaLabel(unit),
  };
}

export function buildCurrentWorkFromWorkUnits(
  units: WorkUnit[],
  selectedWorkUnitId: string | null = null
): EmmaCurrentWorkViewModel {
  const active = units.filter(
    (u) => !u.cancelled && u.status !== "monitoring" && u.status !== "optimizing"
  );
  const sorted = [...active].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
  const primary = sorted[0] ? mapWorkUnitToTaskViewModel(sorted[0], sorted[0].id === selectedWorkUnitId) : null;
  const queue = sorted.slice(1).map((u) => mapWorkUnitToTaskViewModel(u, u.id === selectedWorkUnitId));

  if (!primary) {
    return {
      primaryTask: null,
      queue: [],
      selectedWorkUnitId: null,
      campaignTitle: null,
      activeStageLabel: null,
      sectionSubtitle: "Assign work above when you're ready.",
      isActive: false,
      statusLine: "Nothing in progress.",
      stages: [],
      etaMinutes: null,
    };
  }

  return {
    primaryTask: primary,
    queue,
    selectedWorkUnitId,
    campaignTitle: primary.title,
    activeStageLabel: primary.activeStageLabel,
    sectionSubtitle: "Here's what Emma is working on right now.",
    isActive: primary.isActive,
    statusLine: primary.statusLabel,
    stages: primary.stages,
    etaMinutes: null,
  };
}

export function findWorkUnitForDraft(units: WorkUnit[], draftId: string): WorkUnit | null {
  return units.find((u) => u.draftId === draftId) ?? null;
}

export function lifecycleStageForApproval(draft: MarketingContentDraft): WorkLifecycleStage {
  if (draft.status === "published") return "published";
  if (draft.status === "ready_to_publish") return "scheduled";
  if (draft.status === "approved") return "approved";
  return "review_ready";
}
