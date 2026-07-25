import { describe, expect, it, vi, afterEach } from "vitest";

import type { ContextPackage } from "@/lib/intelligence";
import { assembleMarketingDecision } from "@/lib/marketing-decision";
import { isDevPlaygroundEnabled } from "@/lib/dev/guards";
import {
  assembleDevMarketingDecision,
  buildDevMarketingDecisionSourceFromContextPackage,
  presentMarketingDecisionInspectorView,
  sanitizeDevAssemblyError,
} from "@/lib/dev/marketing-decision-inspector-view";
import { sanitizeDevDisplayText } from "@/lib/dev/brand-brain-inspector-view";

function createContextPackage(
  overrides: Partial<ContextPackage["slices"]> = {}
): ContextPackage {
  return {
    version: "2.0",
    traceId: "trace-dev-1",
    scope: {
      organization: {
        organizationId: "org-1",
        organizationName: "Acme",
        slug: "acme",
      },
      peer: {
        peerId: "peer-1",
        role: "Marketing",
        name: "Emma",
        objective: "Grow pipeline",
        website: null,
        status: "active",
      },
      actor: { userId: "user-1", membershipRole: "owner" },
      sessionId: "session-1",
      requestedAt: "2026-07-20T12:00:00.000Z",
    },
    slices: {
      companyDna: {
        available: true,
        mission: "Help teams",
        values: [],
        toneOfVoice: { summary: "Clear" },
        riskProfile: { tolerance: "balanced" },
        decisionPrinciples: [],
      },
      businessBrain: {
        available: true,
        products: [],
        services: [],
        customerSegments: [{ id: "s1", name: "Founders" }],
        competitors: [],
        internalProcesses: [],
        knowledgeSources: [],
        facts: [],
      },
      marketingUnderstanding: {
        roleApplicable: true,
        available: true,
        sparse: false,
        completeness: 80,
        gaps: [],
        brand: { values: [], toneOfVoice: {}, keyMessages: [] },
        products: [],
        services: [],
        customerSegments: [{ id: "s1", name: "Founders", painPoints: [], buyingTriggers: [] }],
        competitors: [],
        goals: [],
        existingContent: [],
        assembledAt: "2026-07-20T12:00:00.000Z",
      },
      brandBrain: {
        available: true,
        completeness: 70,
        gaps: ["asset-references"],
        assembledAt: "2026-07-20T12:00:00.000Z",
        snapshot: {
          voice: {
            forbiddenPhrases: ["revolutionary"],
            preferredCtaPatterns: ["Book a demo"],
            personalityTraits: [],
            dos: [],
            donts: [],
            emojiPolicy: "none",
          },
        },
      },
      ...overrides,
    },
    meta: {
      completeness: 70,
      loadedLayers: ["company-dna", "business-brain", "marketing-understanding", "brand-brain"],
      missingLayers: [],
      warnings: [],
      sources: [],
      assembledAt: "2026-07-20T12:00:00.000Z",
      cacheHits: [],
    },
  };
}

describe("marketing decision inspector view", () => {
  it("builds conservative source without inventing strategy or budget", () => {
    const build = buildDevMarketingDecisionSourceFromContextPackage({
      contextPackage: createContextPackage(),
      controls: { objective: "Dev objective for validation" },
    });

    expect(build.source.strategy).toBeUndefined();
    expect(build.source.plan).toBeUndefined();
    expect(build.source.budgetConstraint).toBeUndefined();
    expect(build.missingFromContext).toContain("marketingStrategy");
    expect(build.assumptions.some((a) => a.includes("conservative"))).toBe(true);
  });

  it("presents complete decision with recommendations and constraints separated", () => {
    const { record, build } = assembleDevMarketingDecision({
      contextPackage: createContextPackage(),
      controls: { objective: "Validate pipeline" },
    });
    const view = presentMarketingDecisionInspectorView({
      record,
      assumptions: build.assumptions,
      missingFromContext: build.missingFromContext,
    });

    expect(view?.available).toBe(true);
    expect(view?.contentTypeRecommendations.length).toBeGreaterThan(0);
    expect(view?.assumptions.length).toBeGreaterThan(0);
    expect(view?.gaps.length).toBeGreaterThan(0);
  });

  it("presents restricted/blocked eligibility clearly", () => {
    const source = buildDevMarketingDecisionSourceFromContextPackage({
      contextPackage: createContextPackage({
        marketingUnderstanding: {
          roleApplicable: true,
          available: true,
          sparse: true,
          completeness: 10,
          gaps: ["products"],
          brand: { values: [], toneOfVoice: {}, keyMessages: [] },
          products: [],
          services: [],
          customerSegments: [],
          competitors: [],
          goals: [],
          existingContent: [],
          assembledAt: "2026-07-20T12:00:00.000Z",
        },
      }),
      controls: { objective: "Low readiness test" },
    }).source;

    const record = assembleMarketingDecision(source);
    const view = presentMarketingDecisionInspectorView({ record });
    expect(view?.readiness.maxConfidence).toBe("low");
    expect(view?.eligibility.canPublish).toBe(false);
  });

  it("sanitizes error-like strings in assembly errors", () => {
    const sanitized = sanitizeDevAssemblyError(
      new Error("supabase connection failed with PGRST116")
    );
    expect(sanitized.message).toBe("[redacted]");
    expect(sanitizeDevDisplayText("Normal policy message")).toBe("Normal policy message");
  });
});

describe("dev playground guard", () => {
  const originalEnv = process.env.NODE_ENV;

  afterEach(() => {
    vi.stubEnv("NODE_ENV", originalEnv ?? "test");
  });

  it("remains disabled outside development", () => {
    vi.stubEnv("NODE_ENV", "production");
    expect(isDevPlaygroundEnabled()).toBe(false);
  });
});
