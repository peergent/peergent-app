import { describe, expect, it } from "vitest";
import {
  activitySourcesFromMarketingSnapshots,
  buildWorkforceSummary,
  emptyWorkforceSummary,
} from "@/lib/home/build-workforce-summary";
import { createActivity } from "@/lib/marketing-workspace/experience/activity-feed";
import type { PeerRow } from "@/lib/peer-display";
import type { HomePeerWorkspaceSnapshot } from "@/lib/home/types";

function makePeer(overrides: Partial<PeerRow> = {}): PeerRow {
  return {
    id: "peer-maya",
    name: "Maya",
    role: "Marketing",
    status: "active",
    website: "https://acme.com",
    objective: "Run marketing",
    organization_id: "org-1",
    created_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

function makeSnapshot(
  activities: ReturnType<typeof createActivity>[],
  peer = makePeer()
): HomePeerWorkspaceSnapshot {
  return {
    peer,
    workspace: { activityFeed: activities },
  };
}

describe("buildWorkforceSummary", () => {
  it("returns empty summary when no accomplishments exist", () => {
    const summary = buildWorkforceSummary({
      activitySources: [],
      lastVisitAt: null,
      teamPulse: [],
      needsYou: [],
    });

    expect(summary).toEqual(emptyWorkforceSummary());
  });

  it("aggregates marketing and conversation accomplishments since last visit", () => {
    const lastVisitAt = "2026-03-10T08:00:00.000Z";
    const sources = activitySourcesFromMarketingSnapshots([
      makeSnapshot([
        createActivity("conversation", "Handled inquiry", "Prospect chat", {
          timestamp: "2026-03-10T09:00:00.000Z",
        }),
        createActivity("draft_generated", "Generated article", "Q1 launch", {
          timestamp: "2026-03-10T09:30:00.000Z",
        }),
        createActivity("strategy_completed", "Completed strategy", "Campaign", {
          timestamp: "2026-03-09T18:00:00.000Z",
        }),
      ]),
    ]);

    const summary = buildWorkforceSummary({
      activitySources: sources,
      lastVisitAt,
      teamPulse: [
        {
          peerId: "peer-maya",
          name: "Maya",
          role: "Marketing",
          statusKind: "working",
          statusLabel: "Working",
          detail: "Drafting",
          href: "/team/peer-maya",
        },
      ],
      needsYou: [
        {
          id: "need-1",
          priority: "urgent",
          title: "Review draft",
          subtitle: "Campaign",
          peerId: "peer-maya",
          peerName: "Maya",
          href: "/team/peer-maya",
        },
      ],
    });

    expect(summary.conversationsHandled).toBe(1);
    expect(summary.marketingTasksCompleted).toBe(1);
    expect(summary.leadsGenerated).toBe(0);
    expect(summary.activePeers).toBe(1);
    expect(summary.pendingApprovals).toBe(1);
    expect(summary.summaryLines).toEqual([
      "handled 1 conversation",
      "completed 1 marketing task",
    ]);
  });

  it("derives estimated hours and business value from configurable weights", () => {
    const summary = buildWorkforceSummary({
      activitySources: activitySourcesFromMarketingSnapshots([
        makeSnapshot([
          createActivity("conversation", "Chat", "Support", {
            timestamp: "2026-03-10T10:00:00.000Z",
          }),
          createActivity("draft_generated", "Article", "Launch", {
            timestamp: "2026-03-10T10:05:00.000Z",
          }),
        ]),
      ]),
      lastVisitAt: null,
      teamPulse: [],
      needsYou: [],
      config: { hourlyRateEur: 100 },
    });

    // 8 min conversation + 45 min article = 53 min ≈ 0.9 h → €90 at €100/h
    expect(summary.estimatedWorkingHoursSaved).toBe(0.9);
    expect(summary.estimatedBusinessValue).toBe(90);
  });

  it("automatically includes future peer domains when activity tokens appear", () => {
    const salesPeer = makePeer({ id: "peer-sales", name: "Alex", role: "Sales" });
    const summary = buildWorkforceSummary({
      activitySources: [
        {
          peerId: salesPeer.id,
          peerRole: salesPeer.role,
          activities: [
            createActivity("lead_qualified", "Qualified lead", "Acme Corp", {
              timestamp: "2026-03-10T11:00:00.000Z",
            }),
            createActivity("meeting_booked", "Booked demo", "Acme Corp", {
              timestamp: "2026-03-10T11:05:00.000Z",
            }),
          ],
        },
      ],
      lastVisitAt: null,
      teamPulse: [],
      needsYou: [],
    });

    expect(summary.leadsGenerated).toBe(1);
    expect(summary.meetingsBooked).toBe(1);
    expect(summary.summaryLines).toEqual(["generated 1 qualified lead", "booked 1 meeting"]);
  });

  it("excludes pending approvals and setup noise from accomplishments", () => {
    const summary = buildWorkforceSummary({
      activitySources: activitySourcesFromMarketingSnapshots([
        makeSnapshot([
          createActivity("waiting_approval", "Waiting", "Draft ready"),
          createActivity("understanding_loaded", "Loaded", "DNA"),
          createActivity("gap_detected", "Gap", "Missing segment"),
        ]),
      ]),
      lastVisitAt: null,
      teamPulse: [],
      needsYou: [],
    });

    expect(summary.summaryLines).toHaveLength(0);
    expect(summary.estimatedWorkingHoursSaved).toBeNull();
  });
});
