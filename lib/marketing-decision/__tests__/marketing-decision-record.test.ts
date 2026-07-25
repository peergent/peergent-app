import { describe, expect, it } from "vitest";

import type { MarketingDecisionRecord, MarketingDecisionSource } from "../types";
import { assembleMarketingDecision } from "../assemble-marketing-decision";

const baseSource: MarketingDecisionSource = {
  organizationId: "org-1",
  peerId: "peer-1",
  peerRole: "Marketing",
  objective: "Drive demo requests",
  assembledAt: "2026-07-10T12:00:00.000Z",
  context: {
    companyDnaAvailable: true,
    businessBrainAvailable: true,
    marketingUnderstandingAvailable: true,
    marketingUnderstandingCompleteness: 82,
    marketingUnderstandingSparse: false,
    brandBrainAvailable: true,
    brandForbiddenPhrases: ["revolutionary"],
    brandPreferredCtaPatterns: ["Book a demo"],
    customerSegmentCount: 2,
  },
  strategy: {
    summary: "Focus on SMB founders.",
    confidence: "high",
    channelLabels: ["LinkedIn", "Blog"],
  },
  plan: {
    summary: "12-week plan",
    confidence: "high",
    contentCalendarCount: 4,
    campaignChannelLabels: ["LinkedIn"],
  },
  planActivity: {
    title: "Founder pain points slot",
    contentType: "blog_article",
    channel: "Blog",
  },
  responsibilityPolicy: {
    responsibilities: [
      {
        category: "linkedin",
        enabled: true,
        approvalPolicy: "fully_automatic",
        autonomyLevel: "autonomous",
      },
      {
        category: "blog",
        enabled: true,
        approvalPolicy: "fully_automatic",
        autonomyLevel: "autonomous",
      },
    ],
  },
  budgetConstraint: {
    maxMonthlySpend: 500,
  },
};

describe("MarketingDecisionRecord types", () => {
  it("accepts a full assembled record without embedding dependency payloads", () => {
    const record: MarketingDecisionRecord = assembleMarketingDecision(baseSource);

    expect(record.organizationId).toBe("org-1");
    expect(record.channelRecommendations.length).toBeGreaterThan(0);
    expect(record.contentTypeRecommendations.some((r) => r.id === "blog_article")).toBe(
      true
    );
    expect(JSON.stringify(record)).not.toContain("targetAudiences");
    expect(JSON.stringify(record)).not.toContain("contentCalendar");
  });

  it("round-trips through JSON serialization", () => {
    const record = assembleMarketingDecision(baseSource);
    const parsed = JSON.parse(JSON.stringify(record)) as MarketingDecisionRecord;
    expect(parsed.id).toBe(record.id);
    expect(parsed.forbiddenWords).toEqual(["revolutionary"]);
  });
});
