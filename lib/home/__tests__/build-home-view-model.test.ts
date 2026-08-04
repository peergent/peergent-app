import { describe, expect, it } from "vitest";
import { buildHomeViewModel } from "@/lib/home/build-home-view-model";
import type { HomePeerWorkspaceSnapshot } from "@/lib/home/types";
import type { MarketingContentDraft, MarketingUnderstanding } from "@/lib/marketing-intelligence";
import type { PeerRow } from "@/lib/peer-display";
import { getHomeCopy } from "@/lib/i18n";

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

function makeUnderstanding(overrides: Partial<MarketingUnderstanding> = {}): MarketingUnderstanding {
  return {
    available: true,
    sparse: false,
    completeness: 80,
    gaps: [],
    brand: {
      values: [],
      toneOfVoice: { summary: "Confident" },
      keyMessages: [],
    },
    products: [],
    services: [],
    customerSegments: [],
    competitors: [],
    goals: [],
    existingContent: [],
    assembledAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function makeDraft(overrides: Partial<MarketingContentDraft> = {}): MarketingContentDraft {
  return {
    id: "draft-1",
    planActivityReference: "act-1",
    contentType: "blog_article",
    objective: "Awareness",
    title: "Q1 Launch Post",
    body: "Body",
    keywords: [],
    rationale: {
      why: "Supports launch",
      planActivityReference: "act-1",
      strategyLinks: [],
    },
    sourceReferences: [],
    confidence: "moderate",
    status: "draft",
    warnings: [],
    generatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function makeSnapshot(
  peer: PeerRow,
  workspace: HomePeerWorkspaceSnapshot["workspace"]
): HomePeerWorkspaceSnapshot {
  return { peer, workspace };
}

describe("buildHomeViewModel", () => {
  const copy = getHomeCopy("en");

  it("returns welcome narrative and onboarding suggested start when there are no peers", () => {
    const model = buildHomeViewModel({
      peers: [],
      marketingSnapshots: [],
      understanding: null,
      lastVisitAt: null,
      locale: "en",
    });

    expect(model.isEmpty).toBe(true);
    expect(model.narrative.headline).toBe(copy.narratives.welcome);
    expect(model.suggestedStart?.href).toBe("/website-intelligence");
    expect(model.needsYou).toHaveLength(0);
    expect(model.recentMovement).toHaveLength(0);
  });

  it("surfaces draft review in needs you and suggested start from real workflow focus", () => {
    const peer = makePeer();
    const model = buildHomeViewModel({
      firstName: "Alex",
      peers: [peer],
      marketingSnapshots: [
        makeSnapshot(peer, {
          drafts: [makeDraft({ status: "ready_for_review" })],
        }),
      ],
      understanding: makeUnderstanding(),
      lastVisitAt: null,
      locale: "en",
    });

    expect(model.needsYou).toHaveLength(1);
    expect(model.needsYou[0]?.title).toBe(copy.needsYouItems.reviewDraft);
    expect(model.needsYou[0]?.href).toBe("/office/peer-maya/work");
    expect(model.suggestedStart?.ctaLabel).toBe(copy.needsYouItems.reviewDraft);
    expect(model.suggestedStart?.headline).toBe("Q1 Launch Post");
    expect(model.narrative.headline).toContain("Maya");
  });

  it("uses while-away narrative when movement occurred after last visit", () => {
    const peer = makePeer();
    const model = buildHomeViewModel({
      peers: [peer],
      marketingSnapshots: [
        makeSnapshot(peer, {
          drafts: [],
          activityFeed: [
            {
              id: "feed-1",
              activityType: "strategy_completed",
              title: "Strategy approved",
              description: "Campaign strategy is ready",
              timestamp: "2026-07-20T10:00:00.000Z",
            },
          ],
        }),
      ],
      understanding: makeUnderstanding(),
      lastVisitAt: "2026-07-20T08:00:00.000Z",
      locale: "en",
    });

    expect(model.recentMovement).toHaveLength(1);
    expect(model.narrative.headline).toContain("strategy approved");
  });

  it("shows honest context health when understanding is unavailable", () => {
    const peer = makePeer();
    const model = buildHomeViewModel({
      peers: [peer],
      marketingSnapshots: [makeSnapshot(peer, { drafts: [] })],
      understanding: null,
      lastVisitAt: null,
      locale: "en",
    });

    expect(model.contextHealth.available).toBe(false);
    expect(model.contextHealth.label).toBe(copy.contextNotLoaded);
    expect(model.contextHealth.improveHref).toBe("/company");
  });

  it("does not invent team activity for non-marketing peers", () => {
    const salesPeer = makePeer({
      id: "peer-sales",
      name: "Sam",
      role: "Sales",
    });

    const model = buildHomeViewModel({
      peers: [salesPeer],
      marketingSnapshots: [],
      understanding: null,
      lastVisitAt: null,
      locale: "en",
    });

    expect(model.teamPulse).toHaveLength(1);
    expect(model.teamPulse[0]?.statusKind).toBe("idle");
    expect(model.teamPulse[0]?.detail).toContain("Open this colleague");
    expect(model.workstreams).toHaveLength(0);
    expect(model.recentMovement).toHaveLength(0);
  });

  it("reports all caught up when peers exist but nothing needs the user", () => {
    const peer = makePeer();
    const model = buildHomeViewModel({
      peers: [peer],
      marketingSnapshots: [
        makeSnapshot(peer, {
          drafts: [],
          strategy: {
            summary: "Grow awareness",
            confidence: "moderate",
            confidenceReason: "Based on context",
            targetAudiences: [],
            positioningRecommendations: [],
            contentPillars: [],
            campaignIdeas: [],
            seoOpportunities: [],
            socialMediaStrategy: [],
            customerJourneyRecommendations: [],
            leadGenerationOpportunities: [],
            marketingPriorities: [],
            knowledgeGaps: [],
            generatedAt: "2026-01-01T00:00:00.000Z",
          },
          plan: {
            summary: "Q1 campaign",
            confidence: "moderate",
            confidenceReason: "ok",
            basedOnStrategySummary: "Grow awareness",
            objectives: [],
            priorities: [],
            timeline: [],
            campaigns: [],
            contentCalendar: [],
            dependencies: [],
            expectedOutcomes: [],
            successMetrics: [],
            knowledgeGaps: [],
            generatedAt: "2026-01-01T00:00:00.000Z",
          },
        }),
      ],
      understanding: makeUnderstanding({ completeness: 90 }),
      lastVisitAt: null,
      locale: "en",
    });

    expect(model.allCaughtUp).toBe(true);
    expect(model.needsYou).toHaveLength(0);
    expect(model.narrative.headline).toContain("Maya");
  });

  it("attaches workforceSummary as the morning brief source of truth", () => {
    const peer = makePeer();
    const model = buildHomeViewModel({
      peers: [peer],
      marketingSnapshots: [
        makeSnapshot(peer, {
          activityFeed: [
            {
              id: "conversation-1-abc",
              timestamp: "2026-03-10T12:00:00.000Z",
              activityType: "conversation",
              title: "Handled inquiry",
              description: "Prospect",
            },
          ],
        }),
      ],
      understanding: null,
      lastVisitAt: "2026-03-10T08:00:00.000Z",
      locale: "en",
    });

    expect(model.workforceSummary.conversationsHandled).toBe(1);
    expect(model.workforceSummary.summaryLines).toContain("handled 1 conversation");
    expect(model.workforceSummary.estimatedWorkingHoursSaved).toBeGreaterThan(0);
  });
});
