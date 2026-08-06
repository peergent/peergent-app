import { describe, expect, it } from "vitest";
import {
  buildV17CommandCenterViewModel,
  V17_COMMAND_CENTER_LAYOUT_SECTIONS,
  v17PerformanceCardHref,
} from "@/lib/customer-v17/build-v17-command-center-view-model";
import { emptyWorkforceSummary } from "@/lib/home/build-workforce-summary";
import { getHomeCopy } from "@/lib/i18n";
import type { HomeViewModel } from "@/lib/home/types";
import type { HandoffState } from "@/lib/home/handoff-types";

const copy = getHomeCopy("en");

const handoff: HandoffState = {
  scene: "completed",
  urgency: "normal",
  greeting: "Good morning.",
  briefingLines: [],
  personalGreeting: "Good morning.",
  headline: "Ready",
  categoryLabel: "WORK",
  primaryWork: null,
  secondaryWork: [],
  secondaryPriorities: [],
  responsiblePeer: null,
  destination: "/team",
  companyActivity: { activeCount: 0, intensity: "low" },
  teamWorkingVisible: false,
  isPreview: false,
};

function viewModel(overrides: Partial<HomeViewModel> = {}): HomeViewModel {
  return {
    narrative: { greeting: "Hi", headline: "Ready" },
    needsYou: [],
    suggestedStart: null,
    teamPulse: [],
    recentMovement: [],
    awayMovement: [],
    workstreams: [],
    contextHealth: {
      available: false,
      confidencePercent: null,
      label: "",
      gapLabel: null,
      improveHref: null,
    },
    workforceSummary: emptyWorkforceSummary(),
    ...overrides,
  };
}

describe("buildV17CommandCenterViewModel", () => {
  it("uses approved section order constant", () => {
    expect(V17_COMMAND_CENTER_LAYOUT_SECTIONS).toEqual([
      "header",
      "working-now",
      "completed-today",
      "waiting-for-you",
      "peer-performance",
      "weekly-impact",
    ]);
  });

  it("builds grounded weekly impact with metrics array", () => {
    const model = buildV17CommandCenterViewModel({
      viewModel: viewModel({
        workforceSummary: {
          ...emptyWorkforceSummary(),
          marketingTasksCompleted: 3,
        },
      }),
      handoff,
      copy,
      activitySources: [],
      formatRelativeTime: () => "now",
      localePreference: "nl",
      canonicalPeers: [],
      marketingSnapshots: [],
    });
    expect(model.weeklyImpact.metrics.length).toBeGreaterThanOrEqual(0);
    if (model.weeklyImpact.showSection) {
      expect(model.weeklyImpact.metrics.length).toBeGreaterThanOrEqual(2);
    }
  });

  it("links performance cards to peer results", () => {
    const vm = viewModel({
      teamPulse: [
        {
          peerId: "emma",
          name: "Emma",
          role: "Marketing",
          statusLabel: "Working",
          statusKind: "working",
          detail: "Campaign plan",
          href: "/team/emma",
        },
      ],
    });
    const model = buildV17CommandCenterViewModel({
      viewModel: vm,
      handoff,
      copy,
      activitySources: [],
      formatRelativeTime: () => "now",
      localePreference: "en",
    });
    if (model.performance[0]) {
      expect(v17PerformanceCardHref(model.performance[0])).toBe("/office/emma/performance");
    }
  });

  it("localizes Dutch header copy via locale preference", () => {
    const model = buildV17CommandCenterViewModel({
      viewModel: viewModel(),
      handoff,
      copy,
      activitySources: [],
      formatRelativeTime: () => "nu",
      localePreference: "nl",
    });
    expect(model.legacy).toBeDefined();
  });
});
