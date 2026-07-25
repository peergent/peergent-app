import { describe, expect, it } from "vitest";
import { buildInboxViewModel } from "@/lib/inbox/build-inbox-view-model";
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
  workspace: Partial<HomePeerWorkspaceSnapshot["workspace"]> = {}
): HomePeerWorkspaceSnapshot {
  return {
    peer,
    workspace: {
      drafts: [],
      activityFeed: [],
      publicationPackages: [],
      ...workspace,
    },
  };
}

describe("buildInboxViewModel", () => {
  const copy = getHomeCopy("en");

  it("returns empty inbox when no attention items exist", () => {
    const model = buildInboxViewModel({
      marketingSnapshots: [],
      understanding: makeUnderstanding(),
    });

    expect(model.isEmpty).toBe(true);
    expect(model.items).toEqual([]);
    expect(model.urgentCount).toBe(0);
  });

  it("prioritizes draft review as urgent inbox item", () => {
    const peer = makePeer();
    const model = buildInboxViewModel({
      marketingSnapshots: [
        makeSnapshot(peer, {
          drafts: [makeDraft({ status: "ready_for_review" })],
        }),
      ],
      understanding: makeUnderstanding(),
    });

    expect(model.isEmpty).toBe(false);
    expect(model.urgentCount).toBe(1);
    expect(model.items[0]?.kind).toBe("draft_review");
    expect(model.items[0]?.title).toBe(copy.needsYouItems.reviewDraft);
    expect(model.items[0]?.href).toBe("/team/peer-maya");
  });

  it("includes strategy-complete as a normal inbox item", () => {
    const peer = makePeer();
    const model = buildInboxViewModel({
      marketingSnapshots: [
        makeSnapshot(peer, {
          strategy: {
            summary: "Grow awareness",
            confidence: "moderate",
            confidenceReason: "Solid context",
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
        }),
      ],
      understanding: makeUnderstanding(),
    });

    expect(model.items.some((item) => item.kind === "strategy_complete")).toBe(true);
  });
});
