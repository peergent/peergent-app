import type { MarketingUnderstanding } from "@/lib/marketing-intelligence";
import { describe, expect, it } from "vitest";
import { buildProgressRailViewModel } from "@/lib/peer-experience/marketing/build-progress-rail-view-model";
import { resolveCampaignTitle } from "@/lib/peer-experience/marketing/resolve-campaign-title";
import type { TimelineViewModel } from "@/lib/peer-experience";

const incompleteUnderstanding = {
  available: true,
  completeness: 20,
} as unknown as MarketingUnderstanding;

const completeUnderstanding = {
  available: true,
  completeness: 80,
} as unknown as MarketingUnderstanding;

const emptyTimeline: TimelineViewModel = {
  nodes: [],
  currentNodeId: null,
  selectedNodeId: null,
};

describe("resolveCampaignTitle", () => {
  it("prefers plan campaign title", () => {
    const title = resolveCampaignTitle(
      {
        campaigns: [
          {
            title: "Q2 Launch",
            channels: [],
            startWeek: 1,
            endWeek: 4,
            milestones: [],
            rationale: { why: "" },
            linkedStrategyItems: [],
            estimatedEffort: "low",
            expectedImpact: "high",
          },
        ],
      } as unknown as import("@/lib/marketing-intelligence").MarketingPlan,
      null
    );
    expect(title).toBe("Q2 Launch");
  });

  it("falls back to strategy campaign idea name", () => {
    const title = resolveCampaignTitle(null, {
      campaignIdeas: [
        {
          name: "Brand awareness push",
          objective: "",
          channels: [],
          rationale: { why: "", basedOn: [] },
        },
      ],
    } as unknown as import("@/lib/marketing-intelligence").MarketingStrategy);
    expect(title).toBe("Brand awareness push");
  });
});

describe("buildProgressRailViewModel", () => {
  it("marks understanding current when knowledge is incomplete", () => {
    const vm = buildProgressRailViewModel({
      understanding: incompleteUnderstanding,
      timeline: emptyTimeline,
      deliverable: { kind: "empty", title: "", message: "" },
      generating: null,
    });
    expect(vm.currentChapterId).toBe("understanding");
    expect(vm.chapters[0].state).toBe("current");
  });

  it("marks draft current for content deliverable", () => {
    const vm = buildProgressRailViewModel({
      understanding: completeUnderstanding,
      timeline: {
        nodes: [{ id: "content:post", label: "Post", progress: "current", region: "drafts" }],
        currentNodeId: "content:post",
        selectedNodeId: "content:post",
      },
      deliverable: {
        kind: "content",
        draftId: "d1",
        title: "Post",
        channel: "linkedin",
        body: "Hello",
        reviewStatusLabel: "Ready for review",
        reviewable: true,
      },
      generating: null,
    });
    expect(vm.currentChapterId).toBe("draft");
  });
});
