import { describe, expect, it } from "vitest";

import { assembleMarketingDecision } from "../assemble-marketing-decision";
import type { MarketingDecisionSource } from "../types";

const assembledAt = "2026-07-10T12:00:00.000Z";

function createSource(
  overrides: Partial<MarketingDecisionSource> = {}
): MarketingDecisionSource {
  return {
    organizationId: "org-1",
    peerId: "peer-1",
    peerRole: "Marketing",
    objective: "Drive demo requests",
    assembledAt,
    context: {
      companyDnaAvailable: true,
      businessBrainAvailable: true,
      marketingUnderstandingAvailable: true,
      marketingUnderstandingCompleteness: 85,
      customerSegmentCount: 1,
      brandBrainAvailable: true,
      brandForbiddenPhrases: ["guaranteed ROI"],
      brandPreferredCtaPatterns: ["Start free trial", "Book a demo"],
    },
    strategy: {
      summary: "SMB founder focus",
      confidence: "high",
      channelLabels: ["LinkedIn"],
    },
    plan: {
      summary: "Q3 plan",
      confidence: "high",
      contentCalendarCount: 3,
      campaignChannelLabels: ["LinkedIn"],
    },
    planActivity: {
      title: "Launch post",
      contentType: "linkedin_post",
      channel: "LinkedIn",
    },
    responsibilityPolicy: {
      responsibilities: [
        {
          category: "linkedin",
          enabled: true,
          approvalPolicy: "fully_automatic",
          autonomyLevel: "autonomous",
        },
      ],
    },
    budgetConstraint: { maxMonthlySpend: 1000 },
    ...overrides,
  };
}

describe("assembleMarketingDecision", () => {
  it("produces a full eligible decision for complete input", () => {
    const record = assembleMarketingDecision(createSource());

    expect(record.status).not.toBe("blocked");
    expect(record.eligibility.canExecute).toBe(true);
    expect(record.eligibility.canGenerateCreative).toBe(true);
    expect(record.channelRecommendations.some((c) => c.status === "RECOMMENDED")).toBe(
      true
    );
    expect(record.evidence.length).toBeGreaterThan(0);
  });

  it("records gaps for partial context", () => {
    const record = assembleMarketingDecision(
      createSource({
        strategy: undefined,
        plan: undefined,
        planActivity: undefined,
        responsibilityPolicy: undefined,
        context: {
          marketingUnderstandingAvailable: false,
          companyDnaAvailable: false,
          businessBrainAvailable: false,
        },
      })
    );

    expect(record.gaps).toContain("marketingUnderstanding");
    expect(record.gaps).toContain("marketingStrategy");
    expect(record.gaps).toContain("responsibilityPolicy");
  });

  it("restricts generation when readiness is low", () => {
    const record = assembleMarketingDecision(
      createSource({
        context: {
          companyDnaAvailable: false,
          businessBrainAvailable: false,
          marketingUnderstandingAvailable: true,
          marketingUnderstandingCompleteness: 10,
          marketingUnderstandingSparse: true,
          customerSegmentCount: 0,
        },
      })
    );

    expect(record.readiness.maxConfidence).toBe("low");
    expect(record.eligibility.canPublish).toBe(false);
  });

  it("requires approval when autonomy is manual", () => {
    const record = assembleMarketingDecision(
      createSource({
        responsibilityPolicy: {
          responsibilities: [
            {
              category: "linkedin",
              enabled: true,
              approvalPolicy: "approval_required",
              autonomyLevel: "manual",
            },
          ],
        },
      })
    );

    expect(record.approvalPolicy.mode).toBe("blocked_manual_only");
    expect(record.eligibility.canGenerateCreative).toBe(false);
  });

  it("preserves zero budget limit and blocks paid channels", () => {
    const record = assembleMarketingDecision(
      createSource({
        budgetConstraint: { maxMonthlySpend: 0, paidSpendBlocked: true },
        requestedChannel: "google_ads",
        responsibilityPolicy: {
          responsibilities: [
            {
              category: "google_ads",
              enabled: true,
              approvalPolicy: "approval_required",
              autonomyLevel: "semi_autonomous",
              maxMonthlySpend: 0,
            },
          ],
        },
      })
    );

    expect(record.budgetPolicy.maxMonthlySpend).toBe(0);
    expect(record.budgetPolicy.paidChannelsAllowed).toBe(false);
    const google = record.channelRecommendations.find((c) => c.id === "google_ads");
    expect(google?.status).toBe("BLOCKED");
  });

  it("blocks requested content type when not draftable", () => {
    const record = assembleMarketingDecision(
      createSource({
        planActivity: {
          title: "Webinar",
          contentType: "webinar",
          channel: "LinkedIn",
        },
        requestedContentType: "webinar",
      })
    );

    const webinar = record.contentTypeRecommendations.find((c) => c.id === "webinar");
    expect(webinar?.status ?? "BLOCKED").toBe("BLOCKED");
    expect(record.eligibility.blockedReasons.some((r) => r.includes("webinar"))).toBe(
      true
    );
  });

  it("prefers plan activity channel over strategy suggestions", () => {
    const record = assembleMarketingDecision(
      createSource({
        planActivity: {
          title: "Launch post",
          contentType: "linkedin_post",
          channel: "LinkedIn",
        },
        strategy: {
          summary: "Strategy",
          confidence: "high",
          channelLabels: ["Blog"],
        },
      })
    );

    expect(record.channelRecommendations[0]?.id).toBe("linkedin");
    expect(record.channelRecommendations[0]?.status).toBe("RECOMMENDED");
  });

  it("includes evidence on recommendations and does not invent performance data", () => {
    const record = assembleMarketingDecision(createSource());

    for (const channel of record.channelRecommendations) {
      expect(channel.evidence.length).toBeGreaterThan(0);
      expect(JSON.stringify(channel.evidence)).not.toMatch(/performance/i);
      expect(JSON.stringify(channel.evidence)).not.toMatch(/market share/i);
    }
  });

  it("is deterministic for identical input", () => {
    const source = createSource();
    const a = assembleMarketingDecision(source);
    const b = assembleMarketingDecision(source);
    expect(a).toEqual(b);
  });

  it("does not mutate the source object", () => {
    const source = createSource();
    const snapshot = JSON.stringify(source);
    assembleMarketingDecision(source);
    expect(JSON.stringify(source)).toBe(snapshot);
  });

  it("merges brand forbidden phrases into forbiddenWords", () => {
    const record = assembleMarketingDecision(createSource());
    expect(record.forbiddenWords).toContain("guaranteed ROI");
    expect(record.ctaStrategy.primaryPattern).toBe("Start free trial");
  });
});
