import { describe, expect, it } from "vitest";
import {
  buildCommandCenterViewModel,
  CC_ACTIVITY_VISIBLE_LIMIT,
  CC_APPROVALS_VISIBLE_LIMIT,
  CC_APPROVALS_VIEW_ALL_HREF,
  CC_FLAT_SPARKLINE,
  CC_MISSING_VALUE,
  COMMAND_CENTER_KPI_IDS,
  dedupeApprovals,
  normalizeAttributionPercents,
  selectAgentPerformanceServices,
  sortActivityNewestFirst,
  type CcServicePerformance,
} from "@/lib/home/build-command-center-view-model";
import { COMMAND_CENTER_LAYOUT_SECTIONS } from "@/features/home/command-center/CommandCenter";
import { COMMAND_CENTER_BACK_HREF } from "@/features/home/command-center/CommandCenterHeader";
import { emptyWorkforceSummary } from "@/lib/home/build-workforce-summary";
import { getHomeCopy } from "@/lib/i18n";
import type { HomeMovementItem, HomeViewModel } from "@/lib/home/types";
import type { HandoffState } from "@/lib/home/handoff-types";

const copy = getHomeCopy("en");

const handoff: HandoffState = {
  scene: "completed",
  urgency: "normal",
  greeting: "Good morning.",
  briefingLines: ["Marketing finished a draft."],
  personalGreeting: "Good morning, Alex.",
  headline: "Your team moved work forward.",
  categoryLabel: "WORK",
  primaryWork: null,
  secondaryWork: [],
  secondaryPriorities: [],
  responsiblePeer: null,
  destination: "/team",
  companyActivity: { activeCount: 2, intensity: "medium" },
  teamWorkingVisible: true,
  isPreview: false,
};

function minimalViewModel(overrides: Partial<HomeViewModel> = {}): HomeViewModel {
  return {
    narrative: { greeting: "Good morning, Alex.", headline: "Ready", detail: undefined },
    needsYou: [],
    suggestedStart: null,
    teamPulse: [],
    recentMovement: [],
    awayMovement: [],
    contextHealth: {
      available: false,
      confidencePercent: null,
      label: "—",
      gapLabel: null,
      improveHref: null,
    },
    workstreams: [],
    isEmpty: false,
    allCaughtUp: true,
    workforceSummary: {
      ...emptyWorkforceSummary(),
      completedTasks: 3,
      estimatedWorkingHoursSaved: 5,
      estimatedBusinessValue: 375,
    },
    ...overrides,
  };
}

describe("buildCommandCenterViewModel", () => {
  it("exposes exactly four top KPI cards in fixed order", () => {
    const model = buildCommandCenterViewModel({
      viewModel: minimalViewModel(),
      handoff,
      copy,
      activitySources: [],
      formatRelativeTime: () => "2m",
    });

    expect(model.metrics).toHaveLength(4);
    expect(model.metrics.map((metric) => metric.id)).toEqual([...COMMAND_CENTER_KPI_IDS]);
  });

  it("does not expose removed sections (manager brief, roi hero, active tasks, opportunity)", () => {
    const model = buildCommandCenterViewModel({
      viewModel: minimalViewModel(),
      handoff,
      copy,
      activitySources: [],
      formatRelativeTime: () => "2m",
    });

    expect("managerBrief" in model).toBe(false);
    expect("roiHero" in model).toBe(false);
    expect("activeTasks" in model).toBe(false);
    expect("opportunity" in model).toBe(false);
  });

  it("binds KPI values to workforce summary", () => {
    const model = buildCommandCenterViewModel({
      viewModel: minimalViewModel(),
      handoff,
      copy,
      activitySources: [],
      formatRelativeTime: () => "2m",
    });

    expect(model.metrics.find((m) => m.id === "tasks")?.value).toBe("3");
    expect(model.metrics.find((m) => m.id === "time")?.value).toBe("5h");
    expect(model.metrics.find((m) => m.id === "revenue")?.value).toContain("375");
  });

  it("renders em dash for missing metrics when view model is absent", () => {
    const model = buildCommandCenterViewModel({
      viewModel: null,
      handoff,
      copy,
      activitySources: [],
      formatRelativeTime: () => "2m",
    });

    expect(model.metrics.find((m) => m.id === "time")?.value).toBe(CC_MISSING_VALUE);
    expect(model.metrics.find((m) => m.id === "revenue")?.value).toBe(CC_MISSING_VALUE);
    expect(model.metrics.find((m) => m.id === "time")?.sparkValues).toEqual(CC_FLAT_SPARKLINE);
  });

  it("dedupes approvals and keeps review/approve hrefs", () => {
    const model = buildCommandCenterViewModel({
      viewModel: minimalViewModel({
        needsYou: [
          {
            id: "n1",
            priority: "urgent",
            title: "Review draft",
            subtitle: "Launch campaign",
            peerId: "p1",
            peerName: "Emma",
            href: "/team/p1",
          },
          {
            id: "n1",
            priority: "urgent",
            title: "Duplicate",
            subtitle: "Duplicate",
            peerId: "p1",
            peerName: "Emma",
            href: "/team/p1",
          },
        ],
        teamPulse: [
          {
            peerId: "p1",
            name: "Emma",
            role: "Marketing",
            statusLabel: "Working",
            statusKind: "working",
            detail: "",
            href: "/team/p1",
          },
        ],
      }),
      handoff,
      copy,
      activitySources: [],
      formatRelativeTime: () => "1m",
    });

    expect(model.approvals.pendingCount).toBe(1);
    expect(model.approvals.items[0]?.href).toBe("/team/p1");
    expect(model.approvals.items[0]?.reviewHref).toBe("/team/p1");
    expect(model.approvals.items[0]?.serviceKey).toBe("marketing");
  });

  it("limits visible approvals and links view all to inbox", () => {
    const needsYou = Array.from({ length: 5 }, (_, index) => ({
      id: `n${index}`,
      priority: "normal" as const,
      title: "Review",
      subtitle: `Item ${index}`,
      peerId: "p1",
      peerName: "Emma",
      href: `/team/p1/${index}`,
    }));

    const model = buildCommandCenterViewModel({
      viewModel: minimalViewModel({ needsYou }),
      handoff,
      copy,
      activitySources: [],
      formatRelativeTime: () => "1m",
    });

    expect(model.approvals.items).toHaveLength(CC_APPROVALS_VISIBLE_LIMIT);
    expect(model.approvals.pendingCount).toBe(5);
    expect(model.approvals.viewAllHref).toBe(CC_APPROVALS_VIEW_ALL_HREF);
  });

  it("sorts live activity newest first and limits to six items", () => {
    const movement: HomeMovementItem[] = Array.from({ length: 10 }, (_, index) => ({
      id: `m${index}`,
      title: `Activity ${index}`,
      description: "",
      peerName: "Emma",
      timestamp: new Date(Date.UTC(2026, 0, index + 1)).toISOString(),
      href: `/team/p1/${index}`,
    }));

    const model = buildCommandCenterViewModel({
      viewModel: minimalViewModel({ recentMovement: movement }),
      handoff,
      copy,
      activitySources: [],
      formatRelativeTime: () => "2m",
    });

    expect(model.activity).toHaveLength(CC_ACTIVITY_VISIBLE_LIMIT);
    expect(model.activity[0]?.id).toBe("m9");
    expect(model.activity[5]?.id).toBe("m4");
  });

  it("normalizes attribution percentages to sum to 100", () => {
    const rows = normalizeAttributionPercents([
      { serviceKey: "sales", label: "Sales", percent: 33 },
      { serviceKey: "marketing", label: "Marketing", percent: 33 },
      { serviceKey: "finance", label: "Finance", percent: 33 },
    ]);

    expect(rows.reduce((sum, row) => sum + row.percent, 0)).toBe(100);
  });
});

describe("command center helpers", () => {
  it("dedupeApprovals keeps first occurrence", () => {
    const items = dedupeApprovals([
      { id: "a", priority: "normal", title: "t", subtitle: "s", peerId: "1", peerName: "X", href: "/x" },
      { id: "a", priority: "normal", title: "t2", subtitle: "s", peerId: "1", peerName: "X", href: "/y" },
    ]);

    expect(items).toHaveLength(1);
    expect(items[0]?.href).toBe("/x");
  });

  it("sortActivityNewestFirst orders by timestamp desc", () => {
    const sorted = sortActivityNewestFirst([
      {
        id: "1",
        title: "old",
        description: "",
        peerName: "A",
        timestamp: "2026-01-01T00:00:00.000Z",
        href: "/a",
      },
      {
        id: "2",
        title: "new",
        description: "",
        peerName: "A",
        timestamp: "2026-01-02T00:00:00.000Z",
        href: "/b",
      },
    ]);

    expect(sorted[0]?.id).toBe("2");
  });

  it("selectAgentPerformanceServices prefers four core departments", () => {
    const services: CcServicePerformance[] = [
      { serviceKey: "sales", label: "Sales", peerCount: 1, tasksThisWeek: 1, performancePct: 90, sparkValues: [1], sparkMuted: false } as CcServicePerformance,
      { serviceKey: "marketing", label: "Marketing", peerCount: 1, tasksThisWeek: 1, performancePct: 90, sparkValues: [1], sparkMuted: false } as CcServicePerformance,
      { serviceKey: "finance", label: "Finance", peerCount: 1, tasksThisWeek: 1, performancePct: 90, sparkValues: [1], sparkMuted: false } as CcServicePerformance,
      { serviceKey: "support", label: "Support", peerCount: 1, tasksThisWeek: 1, performancePct: 90, sparkValues: [1], sparkMuted: false } as CcServicePerformance,
      { serviceKey: "operations", label: "Operations", peerCount: 1, tasksThisWeek: 1, performancePct: 90, sparkValues: [1], sparkMuted: false } as CcServicePerformance,
    ];

    const selected = selectAgentPerformanceServices(services);
    expect(selected).toHaveLength(4);
    expect(selected.some((service) => service.serviceKey === "operations")).toBe(false);
  });
});

describe("CommandCenter layout", () => {
  it("documents approved desktop section order", () => {
    expect(COMMAND_CENTER_LAYOUT_SECTIONS).toEqual([
      "header",
      "intro",
      "kpis",
      "attention-activity",
      "agent-performance",
      "revenue-attribution",
    ]);
  });

  it("keeps back navigation target on HQ", () => {
    expect(COMMAND_CENTER_BACK_HREF).toBe("/hq");
  });
});
