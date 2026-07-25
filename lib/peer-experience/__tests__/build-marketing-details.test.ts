import { describe, expect, it } from "vitest";
import {
  buildMarketingDetailsViewModel,
  slideOverKindForRegion,
  slideOverTitleForKind,
} from "@/lib/peer-experience/marketing/build-marketing-details-view-model";
import type { MarketingUnderstanding } from "@/lib/marketing-intelligence";

const understanding: MarketingUnderstanding = {
  available: true,
  sparse: false,
  completeness: 82,
  gaps: [],
  brand: {
    values: [],
    toneOfVoice: {},
    keyMessages: [],
    positioningStatement: "We help SMBs grow with AI marketing.",
  },
  products: [{ id: "1", name: "Platform" }],
  services: [],
  customerSegments: [{ id: "1", name: "SMB", painPoints: [], buyingTriggers: [] }],
  competitors: [],
  goals: [],
  existingContent: [],
  assembledAt: "",
};

describe("buildMarketingDetailsViewModel", () => {
  it("returns collapsed rows with human summaries", () => {
    const details = buildMarketingDetailsViewModel({
      understanding,
      strategy: { summary: "Focus on product-led growth." } as never,
      plan: null,
      drafts: [],
      deliverable: {
        kind: "document",
        documentType: "strategy",
        title: "Strategy",
        summary: "Focus on product-led growth.",
        metadata: [],
        inspectRegion: "strategy",
      },
      profileCounts: { goals: 2, content: 4 },
      activityFeed: [],
    });

    expect(details.rows).toHaveLength(5);
    expect(details.rows[0]?.title).toBe("Business context");
    expect(details.rows[0]?.secondaryAction?.slideOverKind).toBe("business-context");
    expect(details.rows[4]?.title).toBe("Recent decisions");
    expect(details.rows[4]?.secondaryAction).toBeUndefined();
  });

  it("maps workspace regions to slide-over kinds", () => {
    expect(slideOverKindForRegion("understanding")).toBe("business-context");
    expect(slideOverKindForRegion("strategy")).toBe("strategy");
    expect(slideOverKindForRegion("plan")).toBe("plan");
    expect(slideOverKindForRegion("drafts")).toBeNull();
  });

  it("uses human slide-over titles", () => {
    expect(slideOverTitleForKind("explainability")).toBe("Why did Maya decide this?");
  });
});
