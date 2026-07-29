import { describe, expect, it } from "vitest";
import { buildGroundedWeeklyMetrics } from "@/lib/customer-v17/build-grounded-weekly-metrics";
import { emptyWorkforceSummary } from "@/lib/home/build-workforce-summary";
import type { HomeViewModel } from "@/lib/home/types";

describe("buildGroundedWeeklyMetrics", () => {
  it("shows section when at least two measured metrics exist", () => {
    const viewModel = {
      workforceSummary: {
        ...emptyWorkforceSummary(),
        marketingTasksCompleted: 5,
        completedTasks: 3,
      },
    } as HomeViewModel;

    const result = buildGroundedWeeklyMetrics({
      viewModel,
      marketingSnapshots: [],
      pendingApprovals: 2,
      locale: "nl",
      primaryMarketingPeerId: "m1",
    });

    expect(result.showSection).toBe(true);
    expect(result.metrics.length).toBeGreaterThanOrEqual(2);
    expect(result.metrics.some((m) => m.id === "pending-approvals")).toBe(true);
    expect(result.metrics.some((m) => m.label === "Taken afgerond")).toBe(true);
  });

  it("does not include time saved or revenue metrics", () => {
    const viewModel = {
      workforceSummary: {
        ...emptyWorkforceSummary(),
        marketingTasksCompleted: 1,
        estimatedWorkingHoursSaved: 99,
        estimatedBusinessValue: 5000,
      },
    } as HomeViewModel;

    const result = buildGroundedWeeklyMetrics({
      viewModel,
      marketingSnapshots: [],
      pendingApprovals: 0,
      locale: "nl",
    });

    const labels = result.metrics.map((m) => m.label.toLowerCase()).join(" ");
    expect(labels).not.toMatch(/tijd|time saved|omzet|revenue/);
    expect(result.metrics.every((m) => m.confidence === "measured")).toBe(true);
  });

  it("links approvals to inbox", () => {
    const result = buildGroundedWeeklyMetrics({
      viewModel: {
        workforceSummary: { ...emptyWorkforceSummary(), marketingTasksCompleted: 2 },
      } as HomeViewModel,
      marketingSnapshots: [],
      pendingApprovals: 3,
      locale: "en",
    });
    const approvals = result.metrics.find((m) => m.id === "pending-approvals");
    expect(approvals?.href).toBe("/inbox");
  });
});
