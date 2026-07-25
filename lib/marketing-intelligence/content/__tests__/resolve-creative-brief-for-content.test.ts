import { describe, expect, it, vi, afterEach } from "vitest";
import type { BrandBrainContextSlice } from "@/lib/brand-brain/types";
import type { ContextPackage } from "@/lib/intelligence";
import * as marketingDecisionModule from "@/lib/marketing-decision";
import type { MarketingDecisionRecord } from "@/lib/marketing-decision";
import type { MarketingPlan } from "../types/plan";
import {
  buildMarketingDecisionSourceForContent,
  resolveCreativeBriefForContent,
} from "../resolve-creative-brief-for-content";
import { formatCreativeBriefPromptSection } from "../format-creative-brief-prompt-section";

const assembledAt = "2026-07-20T12:00:00.000Z";

const fullBrand: BrandBrainContextSlice = {
  available: true,
  completeness: 85,
  gaps: [],
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
      keyMessages: ["Delegate to AI colleagues"],
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
    creativeRules: { layoutConstraints: [] },
    assetReferences: [],
  },
};

const samplePlan: MarketingPlan = {
  summary: "12-week plan",
  confidence: "high",
  confidenceReason: "Clear strategy",
  basedOnStrategySummary: "Inbound focus",
  objectives: [],
  priorities: [],
  timeline: [],
  campaigns: [{ name: "Launch", channels: ["LinkedIn"], objective: "Awareness" }],
  contentCalendar: [
    {
      title: "LinkedIn launch post",
      contentType: "linkedin_post",
      channel: "LinkedIn",
      scheduledWeek: 5,
      pillar: "Growth",
      rationale: { why: "Launch" },
      linkedStrategyItems: [{ type: "campaignIdea", reference: "Launch" }],
      estimatedEffort: "medium",
      expectedImpact: "high",
    },
  ],
  dependencies: [],
  expectedOutcomes: [],
  successMetrics: [],
  knowledgeGaps: [],
  generatedAt: assembledAt,
};

function buildContextPackage(brand?: BrandBrainContextSlice): ContextPackage {
  return {
    version: "2.0",
    traceId: "trace-1",
    scope: {
      organization: { organizationId: "org-1", organizationName: "Acme", slug: "acme" },
      peer: {
        peerId: "peer-1",
        role: "Marketing",
        name: "Emma",
        objective: "Drive demos",
        website: null,
        status: "active",
      },
      actor: { userId: "user-1", membershipRole: "owner" },
      sessionId: "session-1",
      requestedAt: assembledAt,
    },
    slices: {
      companyDna: {
        available: true,
        values: [],
        toneOfVoice: { summary: "Confident" },
        riskProfile: { tolerance: "balanced" },
        decisionPrinciples: [],
      },
      businessBrain: {
        available: true,
        products: [{ id: "p1", name: "Platform", metadata: {}, sortOrder: 0 }],
        services: [],
        customerSegments: [],
        competitors: [],
        internalProcesses: [],
        knowledgeSources: [],
        facts: [],
      },
      marketingUnderstanding: {
        roleApplicable: true,
        available: true,
        sparse: false,
        completeness: 85,
        gaps: [],
        brand: { values: [], toneOfVoice: {}, keyMessages: [] },
        products: [],
        services: [],
        customerSegments: [
          {
            id: "s1",
            name: "Ops leaders",
            painPoints: ["Manual workflows"],
            buyingTriggers: ["Growth"],
          },
        ],
        competitors: [],
        goals: [],
        existingContent: [],
        assembledAt,
      },
      ...(brand ? { brandBrain: brand } : {}),
    },
    meta: {
      completeness: 80,
      loadedLayers: [],
      missingLayers: [],
      warnings: [],
      sources: [],
      assembledAt,
      cacheHits: [],
    },
  } as ContextPackage;
}

describe("resolveCreativeBriefForContent", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns a usable brief with forbidden words from brand", () => {
    const activity = samplePlan.contentCalendar[0];
    const result = resolveCreativeBriefForContent({
      contextPackage: buildContextPackage(fullBrand),
      plan: samplePlan,
      activity,
      normalizedContentType: "linkedin_post",
    });

    expect(result.status).toBe("used");
    expect(result.brief).toBeDefined();
    expect(result.brief!.forbiddenWords).toContain("revolutionary");

    const section = formatCreativeBriefPromptSection(result.brief!);
    expect(section).not.toContain("assemblyTrace");
    expect(section).not.toContain("bp-1");
  });

  it("falls back when marketing decision is blocked", () => {
    const blockedDecision = {
      status: "blocked",
      eligibility: {
        canExecute: false,
        canGenerateCreative: false,
        canPublish: false,
        blockedReasons: ["Budget exhausted."],
      },
      approvalPolicy: { mode: "approval_required" },
    } as MarketingDecisionRecord;

    vi.spyOn(marketingDecisionModule, "assembleMarketingDecision").mockReturnValue(
      blockedDecision
    );

    const result = resolveCreativeBriefForContent({
      contextPackage: buildContextPackage(fullBrand),
      plan: samplePlan,
      activity: samplePlan.contentCalendar[0],
      normalizedContentType: "linkedin_post",
    });

    expect(result.status).toBe("legacy_fallback");
    expect(result.fallbackReason).toContain("Budget");
  });

  it("falls back on manual-only approval policy", () => {
    const manualDecision = {
      status: "restricted",
      eligibility: {
        canExecute: true,
        canGenerateCreative: true,
        canPublish: false,
        blockedReasons: [],
      },
      approvalPolicy: { mode: "blocked_manual_only" },
    } as MarketingDecisionRecord;

    vi.spyOn(marketingDecisionModule, "assembleMarketingDecision").mockReturnValue(
      manualDecision
    );

    const result = resolveCreativeBriefForContent({
      contextPackage: buildContextPackage(fullBrand),
      plan: samplePlan,
      activity: samplePlan.contentCalendar[0],
      normalizedContentType: "linkedin_post",
    });

    expect(result.status).toBe("legacy_fallback");
    expect(result.warnings.some((w) => w.includes("manual-only"))).toBe(true);
  });

  it("warns when Brand Brain is missing but may still assemble", () => {
    const result = resolveCreativeBriefForContent({
      contextPackage: buildContextPackage(undefined),
      plan: samplePlan,
      activity: samplePlan.contentCalendar[0],
      normalizedContentType: "linkedin_post",
    });

    expect(["used", "legacy_fallback"]).toContain(result.status);
    if (result.status === "used") {
      expect(result.warnings.some((w) => w.includes("Brand Brain unavailable"))).toBe(
        true
      );
    }
  });

  it("buildMarketingDecisionSourceForContent includes plan activity channel", () => {
    const activity = samplePlan.contentCalendar[0];
    const source = buildMarketingDecisionSourceForContent({
      contextPackage: buildContextPackage(fullBrand),
      plan: samplePlan,
      activity,
      normalizedContentType: "linkedin_post",
    });

    expect(source.planActivity?.title).toBe("LinkedIn launch post");
    expect(source.requestedChannel).toBe("LinkedIn");
    expect(source.requestedContentType).toBe("linkedin_post");
  });
});
