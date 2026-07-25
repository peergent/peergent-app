import { describe, expect, it } from "vitest";

import type { BrandBrainContextSlice } from "@/lib/brand-brain/types";
import { assembleMarketingDecision } from "@/lib/marketing-decision";
import type { MarketingDecisionRecord } from "@/lib/marketing-decision";
import { assembleCreativeBrief } from "../assemble-creative-brief";
import type { CreativeBriefSource } from "../creative-brief-source";
import {
  CreativeBriefBlockedDecisionError,
  CreativeBriefManualOnlyDecisionError,
  CreativeBriefRequestedSelectionBlockedError,
} from "../errors";
import { CREATIVE_BRIEF_REQUIRED_SECTIONS } from "../ownership";

const assembledAt = "2026-07-15T10:00:00.000Z";

const fullBrand: BrandBrainContextSlice = {
  available: true,
  completeness: 85,
  gaps: ["asset-references"],
  assembledAt,
  snapshot: {
    profile: {
      id: "bp-1",
      organizationId: "org-1",
      name: "Acme",
      status: "active",
      version: 1,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-02T00:00:00.000Z",
    },
    identity: {
      keyMessages: ["Delegate to AI colleagues", "Stay in control"],
      tagline: "Peers at work",
      valueProposition: "AI workforce OS",
    },
    voice: {
      summary: "Clear and confident",
      personalityTraits: ["Direct"],
      dos: ["Use active voice"],
      donts: ["Hype"],
      forbiddenPhrases: ["revolutionary"],
      preferredCtaPatterns: ["Book a demo"],
      emojiPolicy: "none",
    },
    visualIdentity: {
      colors: [{ id: "c1", role: "primary", hex: "#112233" }],
      typography: [{ id: "t1", role: "heading", fontFamily: "Inter" }],
      logoRules: [{ id: "l1", variant: "primary", assetId: "asset-logo" }],
    },
    creativeRules: {
      layoutConstraints: [
        {
          id: "lc1",
          channel: "linkedin",
          widthPx: 1200,
          heightPx: 628,
          notes: "Safe zone required for paid social.",
        },
      ],
    },
    assetReferences: [
      { id: "ar1", assetId: "asset-logo", role: "logo_primary", sortOrder: 0 },
    ],
  },
};

function buildDecision(overrides?: {
  requestedChannel?: string;
  requestedContentType?: string;
  responsibilityManual?: boolean;
  zeroPaidBudget?: boolean;
  includeBlogResponsibility?: boolean;
}): MarketingDecisionRecord {
  return assembleMarketingDecision({
    organizationId: "org-1",
    peerId: "peer-1",
    peerRole: "Marketing",
    objective: "Drive qualified demo requests",
    assembledAt,
    context: {
      companyDnaAvailable: true,
      businessBrainAvailable: true,
      marketingUnderstandingAvailable: true,
      marketingUnderstandingCompleteness: 85,
      customerSegmentCount: 2,
      brandBrainAvailable: true,
    },
    strategy: {
      summary: "SMB focus",
      confidence: "high",
      channelLabels: ["Blog"],
    },
    plan: {
      summary: "Q3 plan",
      confidence: "high",
      contentCalendarCount: 2,
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
          approvalPolicy: overrides?.responsibilityManual
            ? "approval_required"
            : "fully_automatic",
          autonomyLevel: overrides?.responsibilityManual ? "manual" : "autonomous",
        },
        ...(overrides?.includeBlogResponsibility
          ? [
              {
                category: "blog",
                enabled: true,
                approvalPolicy: "fully_automatic",
                autonomyLevel: "autonomous",
              },
            ]
          : []),
      ],
    },
    budgetConstraint: overrides?.zeroPaidBudget
      ? { maxMonthlySpend: 0, paidSpendBlocked: true }
      : { maxMonthlySpend: 500 },
    requestedChannel: overrides?.requestedChannel,
    requestedContentType: overrides?.requestedContentType,
  });
}

function buildSource(overrides: Partial<CreativeBriefSource> = {}): CreativeBriefSource {
  return {
    decision: buildDecision(),
    brand: fullBrand,
    assembledAt,
    audience: {
      segmentLabel: "Ops leaders",
      painPoints: ["Manual workflows"],
    },
    business: { proofPoints: ["200+ teams"] },
    campaignId: "camp-1",
    ...overrides,
  };
}

describe("assembleCreativeBrief", () => {
  it("assembles a complete brief from decision + brand", () => {
    const brief = assembleCreativeBrief(buildSource());

    for (const section of CREATIVE_BRIEF_REQUIRED_SECTIONS) {
      expect(brief).toHaveProperty(section);
    }
    expect(brief.channel.channel).toBe("linkedin");
    expect(brief.contentType).toBe("social_post");
    expect(brief.forbiddenWords).toContain("revolutionary");
    expect(brief.approvalRequirements.brandReviewRequired).toBe(true);
    expect(brief.assemblyTrace?.length).toBeGreaterThan(0);
  });

  it("prefers explicit permitted channel over other recommendations", () => {
    const decision = buildDecision({ includeBlogResponsibility: true });
    const brief = assembleCreativeBrief(
      buildSource({
        decision,
        requestedChannelId: "blog",
      })
    );

    expect(brief.channel.channel).toBe("web");
    expect(brief.assemblyTrace?.some((line) => line.includes("blog"))).toBe(true);
  });

  it("falls back to recommended channel when no explicit request", () => {
    const brief = assembleCreativeBrief(buildSource());
    expect(brief.assemblyTrace?.some((line) => line.includes("RECOMMENDED"))).toBe(
      true
    );
    expect(brief.channel.channel).toBe("linkedin");
  });

  it("never selects a blocked channel", () => {
    const decision = buildDecision({
      requestedChannel: "google_ads",
      zeroPaidBudget: true,
    });
    expect(decision.channelRecommendations.find((c) => c.id === "google_ads")?.status).toBe(
      "BLOCKED"
    );

    expect(() =>
      assembleCreativeBrief(
        buildSource({
          decision,
          requestedChannelId: "google_ads",
        })
      )
    ).toThrow(CreativeBriefBlockedDecisionError);
  });

  it("rejects blocked marketing decisions", () => {
    const decision = buildDecision();
    const blocked: MarketingDecisionRecord = {
      ...decision,
      status: "blocked",
      eligibility: {
        ...decision.eligibility,
        canExecute: false,
        canGenerateCreative: false,
        blockedReasons: ["Policy block"],
      },
    };

    expect(() => assembleCreativeBrief(buildSource({ decision: blocked }))).toThrow(
      CreativeBriefBlockedDecisionError
    );
  });

  it("rejects manual-only decisions", () => {
    const decision = buildDecision({ responsibilityManual: true });
    expect(() => assembleCreativeBrief(buildSource({ decision }))).toThrow(
      CreativeBriefManualOnlyDecisionError
    );
  });

  it("marks partial brand as draft with stricter approval notes", () => {
    const partialBrand: BrandBrainContextSlice = {
      ...fullBrand,
      available: false,
      completeness: 20,
      gaps: ["voice", "visual-colors", "asset-references"],
      snapshot: {
        profile: fullBrand.snapshot.profile,
        identity: { keyMessages: [] },
      },
    };

    const brief = assembleCreativeBrief(buildSource({ brand: partialBrand }));
    expect(brief.status).toBe("draft");
    expect(brief.approvalRequirements.brandReviewRequired).toBe(true);
    expect(brief.approvalRequirements.notes).toContain("Brand Brain unavailable");
  });

  it("preserves forbidden claims, disclaimers, and output volume", () => {
    const decision = buildDecision();
    const withCompliance: MarketingDecisionRecord = {
      ...decision,
      forbiddenClaims: ["Guaranteed ROI"],
      requiredDisclaimers: [
        { id: "d1", text: "Results vary.", sourceRef: "legal" },
      ],
      creativeVolume: {
        recommendedCount: 2,
        minimumCount: 1,
        maximumCount: 3,
        rationale: "Two variants authorized.",
      },
    };

    const brief = assembleCreativeBrief(buildSource({ decision: withCompliance }));
    expect(brief.forbiddenClaims).toEqual(["Guaranteed ROI"]);
    expect(brief.requiredDisclaimers[0]?.text).toBe("Results vary.");
    expect(brief.outputRequirements.deliverableSummary).toBe("Two variants authorized.");
    expect(brief.outputRequirements.variants).toHaveLength(2);
  });

  it("is deterministic and does not mutate inputs", () => {
    const source = buildSource();
    const snapshot = JSON.stringify(source);
    const a = assembleCreativeBrief(source);
    const b = assembleCreativeBrief(source);
    expect(a).toEqual(b);
    expect(JSON.stringify(source)).toBe(snapshot);
  });

  it("round-trips through JSON without embedding dependency records", () => {
    const brief = assembleCreativeBrief(buildSource());
    const serialized = JSON.stringify(brief);
    expect(serialized).not.toContain("channelRecommendations");
    expect(serialized).not.toContain("MarketingDecisionRecord");
    expect(serialized).not.toContain('"snapshot"');

    const parsed = JSON.parse(serialized);
    expect(parsed.id).toBe(brief.id);
  });
});
