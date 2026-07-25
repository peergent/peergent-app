import type { MarketingContentDraft } from "@/lib/marketing-intelligence";
import type { WorkUnit } from "@/lib/peer-workflow/work-unit";
import { buildEmmaRationaleBullets } from "./build-emma-rationale";
import { formatRelativeTime } from "./emma-narrative";
import { mapWorkUnitToTaskViewModel } from "./build-current-work-from-units";

const TIMELINE_EVENT_LABELS: Record<string, string> = {
  task_requested: "You assigned this",
  understanding_started: "Emma read the brief",
  planning_started: "Emma planned the work",
  creation_started: "Emma started creating",
  review_ready: "Ready for your review",
  approved: "You approved",
  scheduled: "Scheduled to publish",
  published: "Published",
  monitoring_started: "Emma is monitoring results",
  optimization_started: "Emma is optimizing",
  paused: "Paused",
  resumed: "Emma resumed work",
  cancelled: "Cancelled",
};

function humanTimelineLabel(event: string, note: string): string {
  if (note.trim()) return note.trim();
  return TIMELINE_EVENT_LABELS[event] ?? event.replace(/_/g, " ");
}

function humanStatusForUnit(unit: WorkUnit): string {
  return mapWorkUnitToTaskViewModel(unit).statusLabel;
}

export type TaskDrawerTab =
  | "overview"
  | "timeline"
  | "files"
  | "reasoning"
  | "comments"
  | "publishing"
  | "performance"
  | "history";

export type TaskDrawerTimelineEntry = {
  id: string;
  timeLabel: string;
  label: string;
  note: string;
};

export type TaskDrawerFile = {
  id: string;
  label: string;
  kind: string;
  refId: string;
  openLabel: string;
};

export type TaskDrawerViewModel = {
  workUnitId: string;
  title: string;
  statusLabel: string;
  lifecycleLabel: string;
  channel: string;
  objective: string | null;
  audience: string | null;
  startedLabel: string;
  draftId: string | null;
  timeline: TaskDrawerTimelineEntry[];
  files: TaskDrawerFile[];
  reasoning: string[];
  canPublish: boolean;
  isPublished: boolean;
  performanceHref: string;
};

export function buildTaskDrawerViewModel(input: {
  unit: WorkUnit;
  draft: MarketingContentDraft | null;
  peerId: string;
}): TaskDrawerViewModel {
  const { unit, draft } = input;

  const timeline: TaskDrawerTimelineEntry[] = unit.eventLog.map((event) => ({
    id: event.id,
    timeLabel: new Date(event.at).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    }),
    label: humanTimelineLabel(event.event, event.note),
    note: event.note,
  }));

  const files: TaskDrawerFile[] = unit.artifacts.map((artifact) => ({
    id: artifact.id,
    label: artifact.label,
    kind: artifact.kind,
    refId: artifact.refId,
    openLabel:
      artifact.kind === "image"
        ? "Open image"
        : artifact.kind === "caption"
          ? "Open caption"
          : "Open draft",
  }));

  if (draft && !files.some((f) => f.refId === draft.id)) {
    files.push({
      id: `file-draft-${draft.id}`,
      label: draft.title,
      kind: "draft",
      refId: draft.id,
      openLabel: "Open draft",
    });
  }

  return {
    workUnitId: unit.id,
    title: unit.title,
    statusLabel: humanStatusForUnit(unit),
    lifecycleLabel: humanStatusForUnit(unit),
    channel: unit.channel,
    objective: unit.objective,
    audience: unit.audience,
    startedLabel: formatRelativeTime(unit.startedAt) || "Just now",
    draftId: draft?.id ?? unit.draftId,
    timeline,
    files,
    reasoning: draft ? buildEmmaRationaleBullets(draft) : [],
    canPublish: draft?.status === "approved" || draft?.status === "ready_to_publish",
    isPublished: draft?.status === "published" || unit.status === "published",
    performanceHref: `/team/${input.peerId}/performance`,
  };
}
