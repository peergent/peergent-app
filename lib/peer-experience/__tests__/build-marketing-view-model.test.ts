import { describe, expect, it } from "vitest";
import { buildMarketingViewModel } from "@/lib/peer-experience";
import type { MarketingUnderstanding } from "@/lib/marketing-intelligence";

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

const baseExtras = {
  profileCounts: { goals: 0, content: 0 },
  activityFeed: [],
};

describe("buildMarketingViewModel", () => {
  it("uses Maya copy without system terminology for strategy-ready state", () => {
    const viewModel = buildMarketingViewModel({
      generating: null,
      understanding,
      strategy: null,
      plan: null,
      drafts: [],
      selectedTimelineNodeId: null,
      ...baseExtras,
    });

    expect(viewModel.now.headline).toContain("marketing strategy");
    expect(viewModel.now.headline).not.toContain("Generate");
    expect(viewModel.now.headline).not.toContain("ready_to_publish");
    expect(viewModel.now.primaryAction?.label).toBe("Start my marketing strategy");
  });

  it("shows working state without primary action while drafting", () => {
    const viewModel = buildMarketingViewModel({
      generating: "draft",
      generatingActivity: "LinkedIn post",
      understanding,
      strategy: { summary: "s" } as never,
      plan: { contentCalendar: [] } as never,
      drafts: [],
      selectedTimelineNodeId: null,
      ...baseExtras,
    });

    expect(viewModel.now.presence).toBe("working");
    expect(viewModel.now.primaryAction).toBeNull();
    expect(viewModel.now.headline).toContain("LinkedIn post");
  });

  it("maps draft review to customer-facing review CTA", () => {
    const viewModel = buildMarketingViewModel({
      generating: null,
      understanding,
      strategy: { summary: "s" } as never,
      plan: {
        contentCalendar: [
          {
            title: "Post",
            contentType: "blog_article",
            scheduledWeek: 1,
            rationale: { why: "test" },
            linkedStrategyItems: [],
            estimatedEffort: "medium",
            expectedImpact: "high",
          },
        ],
      } as never,
      drafts: [
        {
          id: "d1",
          title: "LinkedIn launch post",
          status: "draft",
          planActivityReference: "Post",
        } as never,
      ],
      selectedTimelineNodeId: null,
      ...baseExtras,
    });

    expect(viewModel.now.headline).toContain("LinkedIn launch post");
    expect(viewModel.now.detail).toContain("feedback");
    expect(viewModel.now.primaryAction?.label).toBe("Review content");
  });
});
