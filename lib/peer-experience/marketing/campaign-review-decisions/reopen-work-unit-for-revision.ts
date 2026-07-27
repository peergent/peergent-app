import type { WorkUnit } from "@/lib/peer-workflow/work-unit";

function eventId(): string {
  return `evt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

/**
 * Lifecycle is forward-only; revision reopens planning without inventing new stages.
 * Review decisions remain authoritative until a new artifact version is generated.
 */
export function reopenMarketingWorkUnitForRevision(
  unit: WorkUnit,
  note: string
): WorkUnit {
  if (unit.cancelled) return unit;
  const at = new Date().toISOString();
  const logEntry = {
    id: eventId(),
    at,
    event: "planning_started" as const,
    fromStage: unit.status,
    toStage: "planning" as const,
    note: note.trim() || "Reopened for revision after customer feedback.",
  };
  return {
    ...unit,
    status: "planning",
    updatedAt: at,
    eventLog: [...unit.eventLog, logEntry],
  };
}
