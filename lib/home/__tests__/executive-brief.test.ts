import { describe, expect, it } from "vitest";
import {
  aggregateWorkforceMetrics,
  buildExecutiveDecisionCard,
  buildExecutiveMorningBrief,
  EXECUTIVE_BRIEF_AVAILABLE_METRICS,
  EXECUTIVE_BRIEF_IMPACT_REQUIREMENTS,
  EXECUTIVE_BRIEF_OMITTED_METRICS,
  WORKFORCE_METRIC_REGISTRY,
} from "@/features/home/figma-port/executive-brief";
import { getHomeCopy } from "@/lib/i18n";
import type { HandoffState } from "@/lib/home/handoff-types";
import type { HomeViewModel } from "@/lib/home";
import { emptyWorkforceSummary } from "@/lib/home/build-workforce-summary";

const copy = getHomeCopy("en");

const handoff = {
  personalGreeting: "Good morning, Djemo.",
  briefingLines: [],
  companyActivity: { activeCount: 2, intensity: "medium" as const },
  teamWorkingVisible: true,
  primaryWork: null,
} as unknown as HandoffState;

describe("executive morning brief", () => {
  it("builds workforce accomplishment bullets from real movement activity types", () => {
    const viewModel = {
      isEmpty: false,
      allCaughtUp: false,
      narrative: { greeting: "Good morning, Djemo.", headline: "", detail: undefined },
      needsYou: [
        {
          id: "1",
          priority: "urgent" as const,
          title: "Review",
          subtitle: "Campaign",
          peerId: "p1",
          peerName: "Emma",
          href: "/inbox",
        },
      ],
      suggestedStart: null,
      teamPulse: [
        {
          peerId: "p1",
          name: "Emma",
          role: "Marketing",
          statusKind: "waiting" as const,
          statusLabel: "Waiting",
          detail: "Draft",
          href: "/team/p1",
        },
      ],
      awayMovement: [
        {
          id: "p1-conversation-123-abc",
          title: "Handled inquiry",
          description: "Support",
          peerName: "Emma",
          timestamp: new Date().toISOString(),
          href: "/team/p1",
        },
        {
          id: "p1-draft_generated-456-def",
          title: "Draft generated",
          description: "Campaign",
          peerName: "Emma",
          timestamp: new Date().toISOString(),
          href: "/team/p1",
        },
      ],
      recentMovement: [],
      workstreams: [],
      contextHealth: {
        available: false,
        confidencePercent: null,
        label: "",
        gapLabel: null,
        improveHref: null,
      },
      workforceSummary: emptyWorkforceSummary(),
    } satisfies HomeViewModel;

    const brief = buildExecutiveMorningBrief({ viewModel, handoff, copy });

    expect(brief.greeting).toContain("👋");
    expect(brief.workforceIntro).toBe("While you were away, your AI workforce:");
    expect(brief.accomplishments.map((a) => a.label)).toEqual([
      "handled 1 conversation",
      "completed 1 marketing task",
    ]);
    expect(brief.impact).toBeUndefined();
    expect(brief.fallbackProse).toBeUndefined();
    expect(brief).not.toHaveProperty("closing");
  });

  it("aggregates metrics via registry without hardcoded peer types", () => {
    const accomplishments = aggregateWorkforceMetrics([
      {
        id: "sales-1-lead_qualified-abc",
        title: "Lead",
        description: "",
        peerName: "Sales Peer",
        timestamp: new Date().toISOString(),
        href: "/team/sales-1",
      },
      {
        id: "peer-maya-draft_generated-456-def",
        title: "Draft",
        description: "",
        peerName: "Maya",
        timestamp: new Date().toISOString(),
        href: "/team/peer-maya",
      },
    ]);

    expect(accomplishments).toEqual([
      { key: "qualified_leads", count: 1, label: "generated 1 qualified lead" },
      { key: "marketing_tasks", count: 1, label: "completed 1 marketing task" },
    ]);
    expect(WORKFORCE_METRIC_REGISTRY.some((m) => m.key === "operations_tasks")).toBe(true);
  });

  it("moves judgment copy into the executive decision card", () => {
    const viewModel = {
      isEmpty: false,
      allCaughtUp: false,
      narrative: { greeting: "Hi", headline: "", detail: undefined },
      needsYou: [
        {
          id: "1",
          priority: "urgent" as const,
          title: "Review",
          subtitle: "Campaign",
          peerId: "p1",
          peerName: "Marketing Peer",
          href: "/inbox",
        },
        {
          id: "2",
          priority: "normal" as const,
          title: "Approve",
          subtitle: "Plan",
          peerId: "p2",
          peerName: "Alex",
          href: "/inbox",
        },
        {
          id: "3",
          priority: "normal" as const,
          title: "Sign",
          subtitle: "Doc",
          peerId: "p3",
          peerName: "Maya",
          href: "/inbox",
        },
        {
          id: "4",
          priority: "normal" as const,
          title: "Check",
          subtitle: "Invoice",
          peerId: "p4",
          peerName: "Oliver",
          href: "/inbox",
        },
        {
          id: "5",
          priority: "normal" as const,
          title: "Confirm",
          subtitle: "Task",
          peerId: "p5",
          peerName: "Sam",
          href: "/inbox",
        },
      ],
      suggestedStart: null,
      teamPulse: [],
      awayMovement: [],
      recentMovement: [],
      workstreams: [],
      contextHealth: {
        available: false,
        confidencePercent: null,
        label: "",
        gapLabel: null,
        improveHref: null,
      },
      workforceSummary: emptyWorkforceSummary(),
    } satisfies HomeViewModel;

    const card = buildExecutiveDecisionCard(viewModel, handoff, copy);

    expect(card?.title).toBe("Needs your judgment");
    expect(card?.body).toContain("Marketing Peer");
    expect(card?.body).toContain("4 other colleagues");
    expect(card?.ctaLabel).toBe("View all tasks →");
  });

  it("uses View all tasks CTA for a single pending decision", () => {
    const viewModel = {
      isEmpty: false,
      allCaughtUp: false,
      narrative: { greeting: "Hi", headline: "", detail: undefined },
      needsYou: [
        {
          id: "1",
          priority: "urgent" as const,
          title: "Review draft",
          subtitle: "Campaign",
          peerId: "p1",
          peerName: "Emma",
          href: "/team/p1",
        },
      ],
      suggestedStart: null,
      teamPulse: [],
      awayMovement: [],
      recentMovement: [],
      workstreams: [],
      contextHealth: {
        available: false,
        confidencePercent: null,
        label: "",
        gapLabel: null,
        improveHref: null,
      },
      workforceSummary: emptyWorkforceSummary(),
    } satisfies HomeViewModel;

    const card = buildExecutiveDecisionCard(viewModel, handoff, copy);

    expect(card?.ctaLabel).toBe("View all tasks →");
    expect(card?.body).toContain("Emma is waiting for your decision");
  });

  it("does not render a closing paragraph — stats and decision card carry the message", () => {
    const viewModel = {
      isEmpty: false,
      allCaughtUp: false,
      narrative: { greeting: "Good morning", headline: "", detail: undefined },
      needsYou: [
        {
          id: "1",
          priority: "urgent" as const,
          title: "Review",
          subtitle: "Campaign",
          peerId: "p1",
          peerName: "Emma",
          href: "/inbox",
        },
      ],
      suggestedStart: null,
      teamPulse: [{ peerId: "p1", name: "Emma", role: "Marketing", statusKind: "working" as const, statusLabel: "Working", detail: "", href: "/team/p1" }],
      awayMovement: [
        {
          id: "p1-conversation-123",
          title: "Chat",
          description: "",
          peerName: "Emma",
          timestamp: new Date().toISOString(),
          href: "/team/p1",
        },
      ],
      recentMovement: [],
      workstreams: [],
      contextHealth: { available: false, confidencePercent: null, label: "", gapLabel: null, improveHref: null },
      workforceSummary: emptyWorkforceSummary(),
    } satisfies HomeViewModel;

    const brief = buildExecutiveMorningBrief({ viewModel, handoff, copy });

    expect(brief).not.toHaveProperty("closing");
  });

  it("documents available and omitted metrics", () => {
    expect(EXECUTIVE_BRIEF_AVAILABLE_METRICS.length).toBeGreaterThan(0);
    expect(EXECUTIVE_BRIEF_OMITTED_METRICS).toContain("estimated business value (€)");
    expect(EXECUTIVE_BRIEF_OMITTED_METRICS).toContain("working hours saved");
    expect(EXECUTIVE_BRIEF_IMPACT_REQUIREMENTS.hoursSaved).toContain("durationMinutes");
  });
});
