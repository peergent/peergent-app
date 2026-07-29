import type { WorkUnit } from "@/lib/peer-workflow/work-unit";
import { WORK_UNIT_FAILED_EXECUTION_NOTE_PREFIX } from "@/lib/peer-workflow/work-unit-engine";

/** A genuine, still-live execution failure, reduced to customer-safe fields. */
export type SafeFailureSignal = {
  workUnitId: string;
  projectId: string | null;
  /** Customer-facing deliverable title — never an internal executor message. */
  workTitle: string;
  failedAt: string;
};

function isFailedExecutionEvent(note: string): boolean {
  return note.startsWith(WORK_UNIT_FAILED_EXECUTION_NOTE_PREFIX);
}

/**
 * Truthful "Failed safely" detection (PEERGENT_PRESENCE_MODEL.md §3.6).
 *
 * A unit counts as failed only when its *most recent* event is a failed-execution
 * rollback. Any later event means the Peer moved on, so the failure is no longer
 * the live state — this is what keeps ordinary waiting from reading as failure.
 *
 * Cancelled units never count: the customer ended those deliberately.
 *
 * The rollback note body is deliberately discarded. It carries internal executor
 * detail (provider errors, stack messages) that must never reach customer UI.
 */
export function detectSafeFailure(
  workUnits: readonly WorkUnit[]
): SafeFailureSignal | null {
  let latest: SafeFailureSignal | null = null;

  for (const unit of workUnits) {
    if (unit.cancelled) continue;

    const lastEvent = unit.eventLog[unit.eventLog.length - 1];
    if (!lastEvent || !isFailedExecutionEvent(lastEvent.note)) continue;

    if (!latest || lastEvent.at > latest.failedAt) {
      latest = {
        workUnitId: unit.id,
        projectId: unit.projectId ?? null,
        workTitle: unit.title,
        failedAt: lastEvent.at,
      };
    }
  }

  return latest;
}
