import { describe, expect, it } from "vitest";
import {
  buildMarketingTimelineNodes,
  contentTimelineNodeId,
  milestoneTimelineNodeId,
  resolveEffectiveTimelineSelection,
} from "@/lib/marketing-workspace/timeline-nodes";
import type {
  MarketingContentDraft,
  MarketingPlan,
  MarketingStrategy,
  MarketingUnderstanding,
} from "@/lib/marketing-intelligence";

const understanding: MarketingUnderstanding = {
  available: true,
  sparse: false,
  completeness: 80,
  gaps: [],
  brand: { values: [], toneOfVoice: {}, keyMessages: [] },
  products: [],
  services: [],
  customerSegments: [],
  competitors: [],
  goals: [],
  existingContent: [],
  assembledAt: "",
};

const strategy = { summary: "s" } as MarketingStrategy;

const plan = {
  contentCalendar: [
    {
      title: "LinkedIn launch post",
      contentType: "linkedin_post",
      scheduledWeek: 1,
      rationale: { why: "Launch" },
      linkedStrategyItems: [],
      estimatedEffort: "medium",
      expectedImpact: "high",
    },
    {
      title: "Blog article",
      contentType: "blog_article",
      scheduledWeek: 2,
      rationale: { why: "SEO" },
      linkedStrategyItems: [],
      estimatedEffort: "medium",
      expectedImpact: "high",
    },
  ],
} as unknown as MarketingPlan;

describe("buildMarketingTimelineNodes", () => {
  it("includes milestone nodes before content nodes", () => {
    const { nodes } = buildMarketingTimelineNodes({
      generating: null,
      understanding,
      strategy,
      plan,
      drafts: [],
    });

    expect(nodes.map((node) => node.id)).toEqual([
      milestoneTimelineNodeId("knowledge"),
      milestoneTimelineNodeId("strategy"),
      milestoneTimelineNodeId("plan"),
      contentTimelineNodeId("LinkedIn launch post"),
      contentTimelineNodeId("Blog article"),
    ]);
  });

  it("marks exactly one node as current for draft review focus", () => {
    const drafts = [
      {
        id: "d1",
        title: "LinkedIn launch post",
        status: "draft",
        planActivityReference: "LinkedIn launch post",
      } as MarketingContentDraft,
    ];

    const { nodes, currentNodeId } = buildMarketingTimelineNodes({
      generating: null,
      understanding,
      strategy,
      plan,
      drafts,
    });

    const currentNodes = nodes.filter((node) => node.progress === "current");
    expect(currentNodes).toHaveLength(1);
    expect(currentNodeId).toBe(contentTimelineNodeId("LinkedIn launch post"));
    expect(currentNodes[0]?.id).toBe(currentNodeId);
  });

  it("marks completed milestones and current content when plan has undrafted work", () => {
    const { nodes, currentNodeId } = buildMarketingTimelineNodes({
      generating: null,
      understanding,
      strategy,
      plan,
      drafts: [],
    });

    expect(nodes.find((node) => node.id === milestoneTimelineNodeId("plan"))?.progress).toBe(
      "completed"
    );
    expect(currentNodeId).toBe(contentTimelineNodeId("LinkedIn launch post"));
    expect(nodes.filter((node) => node.progress === "current")).toHaveLength(1);
  });

  it("falls back to current node when selection is invalid", () => {
    const snapshot = buildMarketingTimelineNodes({
      generating: null,
      understanding,
      strategy,
      plan,
      drafts: [],
    });

    expect(resolveEffectiveTimelineSelection(snapshot, "content:ghost")).toBe(
      snapshot.currentNodeId
    );
  });
});
