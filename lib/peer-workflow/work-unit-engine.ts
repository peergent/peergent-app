import type { GeneratingActivity } from "@/lib/marketing-workspace/workflow-focus";
import type { MarketingContentDraft } from "@/lib/marketing-intelligence";
import {
  advanceLifecycleTo,
  canAdvanceLifecycle,
  type WorkLifecycleEvent,
  type WorkLifecycleStage,
  WORK_LIFECYCLE_STAGES,
} from "./work-lifecycle";
import type {
  CreateWorkUnitInput,
  WorkAutomation,
  WorkAutomationRecurrence,
  WorkDeliverableKind,
  WorkUnit,
  WorkUnitArtifact,
  WorkUnitEvent,
} from "./work-unit";

function eventId(): string {
  return `evt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function unitId(): string {
  return `wu-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function automationId(): string {
  return `auto-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function appendEvent(
  unit: WorkUnit,
  event: WorkLifecycleEvent,
  toStage: WorkLifecycleStage,
  note: string
): WorkUnitEvent {
  return {
    id: eventId(),
    at: new Date().toISOString(),
    event,
    fromStage: unit.status,
    toStage,
    note,
  };
}

export function createWorkUnit(input: CreateWorkUnitInput): WorkUnit {
  const now = new Date().toISOString();
  const unit: WorkUnit = {
    id: unitId(),
    peerId: input.peerId,
    projectId: input.projectId ?? null,
    role: input.role,
    title: input.title,
    status: "requested",
    deliverableKind: input.deliverableKind,
    channel: input.channel,
    objective: input.objective,
    audience: input.audience,
    needsVisual: input.needsVisual,
    recurrence: input.recurrence,
    automationTrigger: input.automationTrigger ?? null,
    draftId: null,
    planActivityReference: input.planActivityReference ?? null,
    rawRequest: input.rawRequest,
    startedAt: now,
    updatedAt: now,
    estimatedCompletionAt: null,
    artifacts: [],
    eventLog: [],
    paused: false,
    cancelled: false,
  };

  const requestedEvent = appendEvent(unit, "task_requested", "requested", "Task requested");
  return {
    ...unit,
    eventLog: [requestedEvent],
  };
}

export function transitionWorkUnit(
  unit: WorkUnit,
  toStage: WorkLifecycleStage,
  event: WorkLifecycleEvent,
  note: string
): WorkUnit {
  if (unit.cancelled) return unit;
  if (!canAdvanceLifecycle(unit.status, toStage) && unit.status !== toStage) {
    const steps = advanceLifecycleTo(unit.status, toStage);
    if (steps.length === 0) return unit;
    return steps.reduce(
      (current, stage) => transitionWorkUnit(current, stage, event, note),
      unit
    );
  }

  const logEntry = appendEvent(unit, event, toStage, note);
  return {
    ...unit,
    status: toStage,
    updatedAt: new Date().toISOString(),
    eventLog: [...unit.eventLog, logEntry],
  };
}

/** Roll back from failed in-flight execution so the customer can retry explicitly. */
export function revertWorkUnitFromFailedExecution(unit: WorkUnit, note: string): WorkUnit {
  if (unit.cancelled) return unit;
  const at = new Date().toISOString();
  const trimmed = note.trim() || "Execution failed.";
  const logEntry: WorkUnitEvent = {
    id: eventId(),
    at,
    event: "planning_started",
    fromStage: unit.status,
    toStage: "planning",
    note: `Execution rolled back for retry: ${trimmed}`,
  };
  return {
    ...unit,
    status: "planning",
    updatedAt: at,
    eventLog: [...unit.eventLog, logEntry],
  };
}

export function attachDraftToWorkUnit(
  unit: WorkUnit,
  draft: MarketingContentDraft
): WorkUnit {
  const artifacts: WorkUnitArtifact[] = [...unit.artifacts];
  if (!artifacts.some((a) => a.refId === draft.id && a.kind === "draft")) {
    artifacts.push({
      id: `art-draft-${draft.id}`,
      kind: "draft",
      label: "Open draft",
      refId: draft.id,
    });
  }
  if (unit.needsVisual && !artifacts.some((a) => a.kind === "image")) {
    artifacts.push({
      id: `art-image-${draft.id}`,
      kind: "image",
      label: "Open images",
      refId: draft.id,
    });
  }
  if (!artifacts.some((a) => a.kind === "caption")) {
    artifacts.push({
      id: `art-caption-${draft.id}`,
      kind: "caption",
      label: "Open caption",
      refId: draft.id,
    });
  }

  let next: WorkUnit = {
    ...unit,
    draftId: draft.id,
    artifacts,
    planActivityReference: draft.planActivityReference,
  };

  if (lifecycleIndex(next.status) < lifecycleIndex("review_ready")) {
    next = transitionWorkUnit(next, "review_ready", "review_ready", "Deliverable ready for review");
  }

  return next;
}

export function mapDraftStatusToLifecycleStage(
  status: MarketingContentDraft["status"]
): WorkLifecycleStage {
  switch (status) {
    case "draft":
    case "ready_for_review":
      return "review_ready";
    case "approved":
      return "approved";
    case "ready_to_publish":
      return "scheduled";
    case "published":
      return "published";
    case "rejected":
      return "creating";
    default:
      return "creating";
  }
}

export function mapGeneratingToLifecycleStage(
  generating: GeneratingActivity
): WorkLifecycleStage {
  switch (generating) {
    case "understanding":
      return "understanding";
    case "strategy":
    case "plan":
      return "planning";
    case "draft":
      return "creating";
    case "publication":
      return "scheduled";
  }
}

export function syncWorkUnitFromMarketingState(input: {
  unit: WorkUnit;
  generating: GeneratingActivity | null;
  draft: MarketingContentDraft | null;
}): WorkUnit {
  let next = input.unit;
  if (next.cancelled || next.paused) return next;

  if (input.generating) {
    const target = mapGeneratingToLifecycleStage(input.generating);
    if (lifecycleIndex(target) > lifecycleIndex(next.status)) {
      const event =
        target === "understanding"
          ? "understanding_started"
          : target === "planning"
            ? "planning_started"
            : target === "creating"
              ? "creation_started"
              : "scheduled";
      next = transitionWorkUnit(next, target, event, `Emma is ${target.replace("_", " ")}`);
    }
    return next;
  }

  if (input.draft) {
    next = attachDraftToWorkUnit(next, input.draft);
    const target = mapDraftStatusToLifecycleStage(input.draft.status);
    if (lifecycleIndex(target) > lifecycleIndex(next.status)) {
      const eventMap: Partial<Record<WorkLifecycleStage, WorkLifecycleEvent>> = {
        review_ready: "review_ready",
        approved: "approved",
        scheduled: "scheduled",
        published: "published",
      };
      next = transitionWorkUnit(
        next,
        target,
        eventMap[target] ?? "review_ready",
        `Status updated to ${target}`
      );
    }
    if (input.draft.status === "published" && next.status === "published") {
      if (lifecycleIndex(next.status) < lifecycleIndex("monitoring")) {
        next = transitionWorkUnit(next, "monitoring", "monitoring_started", "Monitoring performance");
      }
    }
  }

  return next;
}

export function createAutomationFromWorkUnit(
  unit: WorkUnit,
  triggerLabel?: string | null
): WorkAutomation | null {
  if (unit.recurrence === "once") return null;
  return {
    id: automationId(),
    peerId: unit.peerId,
    workUnitId: unit.id,
    recurrence: unit.recurrence,
    trigger: unit.automationTrigger,
    triggerLabel: triggerLabel ?? null,
    createdAt: new Date().toISOString(),
    active: true,
  };
}

export function resumeWorkUnit(unit: WorkUnit): WorkUnit {
  if (!unit.paused) return unit;
  return {
    ...unit,
    paused: false,
    updatedAt: new Date().toISOString(),
    eventLog: [...unit.eventLog, appendEvent(unit, "resumed", unit.status, "Task resumed")],
  };
}

export function pauseWorkUnit(unit: WorkUnit): WorkUnit {
  return {
    ...unit,
    paused: true,
    updatedAt: new Date().toISOString(),
    eventLog: [...unit.eventLog, appendEvent(unit, "paused", unit.status, "Task paused")],
  };
}

export function cancelWorkUnit(unit: WorkUnit): WorkUnit {
  return {
    ...unit,
    cancelled: true,
    updatedAt: new Date().toISOString(),
    eventLog: [...unit.eventLog, appendEvent(unit, "cancelled", unit.status, "Task cancelled")],
  };
}

/** Append a timeline note without advancing lifecycle. */
export function recordWorkUnitNote(unit: WorkUnit, note: string): WorkUnit {
  const at = new Date().toISOString();
  return {
    ...unit,
    updatedAt: at,
    eventLog: [
      ...unit.eventLog,
      {
        id: eventId(),
        at,
        event: "review_ready",
        fromStage: unit.status,
        toStage: unit.status,
        note,
      },
    ],
  };
}

export function activeWorkUnits(units: WorkUnit[]): WorkUnit[] {
  return units.filter(
    (u) =>
      !u.cancelled &&
      u.status !== "published" &&
      u.status !== "monitoring" &&
      u.status !== "optimizing"
  );
}

export function sortWorkUnitsByRecency(units: WorkUnit[]): WorkUnit[] {
  return [...units].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
}

function lifecycleIndex(stage: WorkLifecycleStage): number {
  return WORK_LIFECYCLE_STAGES.indexOf(stage);
}

export function deliverableKindFromChannel(channel: string): WorkDeliverableKind {
  const normalized = channel.toLowerCase();
  if (normalized.includes("instagram")) return "instagram";
  if (normalized.includes("linkedin")) return "linkedin";
  if (normalized.includes("newsletter") || normalized.includes("email")) return "newsletter";
  if (normalized.includes("blog")) return "blog";
  if (normalized.includes("landing")) return "landing_page";
  if (normalized.includes("meta")) return "meta_ad";
  if (normalized.includes("google")) return "google_ad";
  return "generic";
}

export function mapRecurrenceToEngine(
  recurrence: import("@/lib/peer-experience/marketing/parse-delegation-intent").DelegationRecurrence
): WorkAutomationRecurrence {
  switch (recurrence) {
    case "weekly":
      return "weekly";
    case "monthly":
      return "monthly";
    case "custom":
      return "custom";
    case "trigger":
      return "trigger";
    default:
      return "once";
  }
}
