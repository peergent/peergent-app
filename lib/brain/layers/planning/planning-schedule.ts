import type { PlanningConfidence, ScheduleWindow } from "./brain-types";

export function buildScheduleWindows(input: {
  customerDeadline?: { start: string; end: string } | string | null;
  timeHorizon: string;
  upstreamConfidence: PlanningConfidence;
}): { startWindow: string | null; endWindow: string | null; windows: ScheduleWindow[] } {
  const windows: ScheduleWindow[] = [];

  if (typeof input.customerDeadline === "string") {
    windows.push({
      id: "sw-deadline",
      type: "fixed",
      start: null,
      end: input.customerDeadline,
      relativeStart: null,
      relativeEnd: null,
      timezone: null,
      flexibility: "fixed",
      reason: "Customer-provided deadline",
      source: "customer_deadline",
      confidence: "high",
    });
    return {
      startWindow: null,
      endWindow: input.customerDeadline,
      windows,
    };
  }

  if (input.customerDeadline && typeof input.customerDeadline === "object") {
    windows.push({
      id: "sw-deadline-range",
      type: "fixed",
      start: input.customerDeadline.start,
      end: input.customerDeadline.end,
      relativeStart: null,
      relativeEnd: null,
      timezone: null,
      flexibility: "flexible",
      reason: "Customer-provided date range",
      source: "customer_deadline",
      confidence: "medium",
    });
    return {
      startWindow: input.customerDeadline.start,
      endWindow: input.customerDeadline.end,
      windows,
    };
  }

  windows.push({
    id: "sw-relative-horizon",
    type: "relative",
    start: null,
    end: null,
    relativeStart: "After strategy approval",
    relativeEnd: input.timeHorizon,
    timezone: null,
    flexibility: "flexible",
    reason: "No fixed deadline — relative planning within strategy time horizon",
    source: "strategy_time_horizon",
    confidence: enforceRelativeConfidence(input.upstreamConfidence),
  });

  windows.push({
    id: "sw-week-1",
    type: "relative",
    start: null,
    end: null,
    relativeStart: "Week 1",
    relativeEnd: "Week 1",
    timezone: null,
    flexibility: "flexible",
    reason: "Initial setup phase",
    source: "planning_sequence",
    confidence: "low",
  });

  return { startWindow: null, endWindow: null, windows };
}

function enforceRelativeConfidence(c: PlanningConfidence): PlanningConfidence {
  return c === "high" ? "medium" : c;
}

export function assertNoFabricatedDates(windows: readonly ScheduleWindow[], hasDeadline: boolean): void {
  if (hasDeadline) return;
  for (const w of windows) {
    if (w.type === "fixed" && (w.start || w.end) && w.source !== "customer_deadline") {
      throw new Error("Fabricated fixed date without customer deadline");
    }
  }
}
