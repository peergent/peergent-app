import { describe, expect, it } from "vitest";
import {
  buildPeerColleagueView,
  peerCurrentAction,
  peerStatusChip,
} from "@/features/home/figma-port/figma-port-peer-detail";
import { getHomeCopy } from "@/lib/i18n";
import type { HomeViewModel, HomeTeamPulseItem } from "@/lib/home";
import { emptyWorkforceSummary } from "@/lib/home/build-workforce-summary";

const copy = getHomeCopy("en");

function pulse(overrides: Partial<HomeTeamPulseItem> = {}): HomeTeamPulseItem {
  return {
    peerId: "peer-1",
    name: "Emma",
    role: "Marketing",
    statusKind: "working",
    statusLabel: "Working",
    detail: "Writing campaign copy",
    href: "/team/peer-1",
    ...overrides,
  };
}

function viewModel(overrides: Partial<HomeViewModel> = {}): HomeViewModel {
  return {
    narrative: { greeting: "Good morning", headline: "Hi" },
    needsYou: [],
    suggestedStart: null,
    teamPulse: [pulse()],
    recentMovement: [
      {
        id: "peer-1-act-1",
        title: "Draft generated",
        description: "Summer campaign",
        peerName: "Emma",
        timestamp: new Date().toISOString(),
        href: "/team/peer-1",
      },
    ],
    awayMovement: [],
    contextHealth: {
      available: false,
      confidencePercent: null,
      label: "Not loaded",
      gapLabel: null,
      improveHref: null,
    },
    workstreams: [
      {
        id: "peer-1-workstream",
        peerId: "peer-1",
        peerName: "Emma",
        title: "Summer campaign",
        progressLabel: "3 of 8 steps",
        statusLabel: "Draft review",
        href: "/team/peer-1",
      },
    ],
    isEmpty: false,
    allCaughtUp: true,
    workforceSummary: emptyWorkforceSummary(),
    ...overrides,
  };
}

describe("peer colleague presentation", () => {
  it("avoids duplicate action and status chip text", () => {
    const item = pulse({
      statusKind: "idle",
      statusLabel: "Monitoring",
      detail: "Monitoring",
    });
    const action = peerCurrentAction(item, copy);
    expect(action).toBe("Monitoring");
    expect(peerStatusChip(item, action)).toBeNull();
  });

  it("maps live status, workstream metadata, actions, and attention", () => {
    const vm = viewModel({
      needsYou: [
        {
          id: "need-1",
          priority: "urgent",
          title: "Review draft",
          subtitle: "Summer campaign",
          peerId: "peer-1",
          peerName: "Emma",
          href: "/team/peer-1",
          timestamp: new Date().toISOString(),
        },
      ],
    });

    const view = buildPeerColleagueView(pulse(), vm, copy, () => "6 minutes ago");

    expect(view.liveStatus.headline).toBe("Working now");
    expect(view.liveStatus.action).toBe("Writing campaign copy");
    expect(view.liveStatus.timestampLabel).toBe("Started or updated 6 minutes ago");
    expect(view.currentWork?.title).toBe("Summer campaign");
    expect(view.currentWork?.metadata).toContain("3 of 8 steps");
    expect(view.recentActions).toHaveLength(1);
    expect(view.attention[0]?.status).toBeTruthy();
    expect(view.nextStep?.label).toBe("Review draft");
  });

  it("omits current work and recent actions when nothing additive exists", () => {
    const view = buildPeerColleagueView(
      pulse({ statusKind: "idle", detail: "Monitoring", statusLabel: "Monitoring" }),
      viewModel({ recentMovement: [], workstreams: [] }),
      copy,
      () => "—"
    );

    expect(view.currentWork).toBeUndefined();
    expect(view.recentActions).toHaveLength(0);
    expect(view.nextStep?.label).toBe(copy.ui.openWorkspace);
  });
});
