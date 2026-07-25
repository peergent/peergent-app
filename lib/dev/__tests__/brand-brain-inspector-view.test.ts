import { describe, expect, it, vi, afterEach } from "vitest";
import type { BrandBrainContextSlice } from "@/lib/brand-brain/types";
import { BRAND_BRAIN_GAPS } from "@/lib/brand-brain/ownership";
import { emptyBrandBrainContextSlice } from "@/lib/intelligence/types/brand-brain-context-slice";
import { isDevPlaygroundEnabled } from "@/lib/dev/guards";
import {
  filterBrandBrainWarnings,
  isBrandBrainDegraded,
  presentBrandBrainInspectorView,
  sanitizeDevDisplayText,
} from "@/lib/dev/brand-brain-inspector-view";

const completeSlice: BrandBrainContextSlice = {
  available: true,
  completeness: 86,
  gaps: ["asset-references"],
  assembledAt: "2026-06-01T00:00:00.000Z",
  snapshot: {
    profile: {
      id: "p1",
      organizationId: "org-1",
      name: "Acme Inc",
      status: "active",
      version: 1,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-02T00:00:00.000Z",
    },
    identity: {
      story: "We help teams delegate.",
      positioningStatement: "AI workforce OS",
      tagline: "Peers at work",
      valueProposition: "Hire AI colleagues",
      keyMessages: ["Delegation over automation"],
      marketCategory: "B2B SaaS",
    },
    voice: {
      summary: "Clear and confident",
      personalityTraits: ["Direct"],
      dos: ["Use active voice"],
      donts: ["Hype"],
      preferredCtaPatterns: ["Start with your team"],
      forbiddenPhrases: ["revolutionary"],
      emojiPolicy: "sparingly",
    },
    visualIdentity: {
      colors: [{ id: "c1", role: "primary", hex: "#112233" }],
      typography: [
        {
          id: "t1",
          role: "heading",
          fontFamily: "Inter",
        },
      ],
      logoRules: [{ id: "l1", variant: "primary" }],
    },
    creativeRules: {
      layoutConstraints: [
        {
          id: "lc1",
          channel: "linkedin",
          safeAreaInsetsPx: { top: 8, right: 8, bottom: 8, left: 8 },
        },
      ],
    },
    assetReferences: [],
  },
};

describe("brand brain inspector view", () => {
  it("presents a complete slice with gaps and sources", () => {
    const view = presentBrandBrainInspectorView({
      slice: completeSlice,
      organizationName: "Acme Inc",
      sources: [
        {
          id: "brand-brain:org-1",
          type: "supabase",
          label: "Brand Brain",
          fetchedAt: "2026-06-01T00:00:00.000Z",
          freshness: "live",
        },
      ],
      warnings: ["Brand Brain is incomplete (86% complete) — gaps: asset-references"],
    });

    expect(view).not.toBeNull();
    expect(view?.availability.available).toBe(true);
    expect(view?.availability.degraded).toBe(false);
    expect(view?.identity.tagline).toBe("Peers at work");
    expect(view?.gaps).toEqual(["asset-references"]);
    expect(view?.visualIdentity.colors.state).toBe("present");
    expect(view?.sources[0]?.label).toBe("Brand Brain");
  });

  it("presents partial slice with missing modules", () => {
    const partial: BrandBrainContextSlice = {
      ...completeSlice,
      available: false,
      completeness: 14,
      gaps: [...BRAND_BRAIN_GAPS],
      snapshot: {
        profile: completeSlice.snapshot.profile,
        identity: { keyMessages: [] },
        voice: {
          personalityTraits: [],
          dos: [],
          donts: [],
          forbiddenPhrases: [],
          preferredCtaPatterns: [],
          emojiPolicy: "none",
        },
        visualIdentity: { colors: [], typography: [], logoRules: [] },
        creativeRules: { layoutConstraints: [] },
        assetReferences: [],
      },
    };

    const view = presentBrandBrainInspectorView({ slice: partial });
    expect(view?.availability.available).toBe(false);
    expect(view?.identity.moduleState).toBe("missing");
    expect(view?.visualIdentity.typography.state).toBe("missing");
    expect(view?.voice.moduleState).toBe("missing");
  });

  it("marks unavailable slice as degraded with warnings", () => {
    const slice = emptyBrandBrainContextSlice("2026-06-01T00:00:00.000Z");
    const warnings = ["Brand Brain unavailable or empty"];
    const sources = [
      {
        id: "brand-brain:unavailable:org-1",
        type: "derived" as const,
        label: "Brand Brain unavailable — source load failed",
        fetchedAt: "2026-06-01T00:00:00.000Z",
        freshness: "cached" as const,
      },
    ];

    expect(isBrandBrainDegraded(slice, sources, warnings)).toBe(true);

    const view = presentBrandBrainInspectorView({ slice, sources, warnings });
    expect(view?.availability.degraded).toBe(true);
    expect(view?.gaps.length).toBe(BRAND_BRAIN_GAPS.length);
  });

  it("handles empty arrays safely", () => {
    const view = presentBrandBrainInspectorView({
      slice: {
        ...completeSlice,
        gaps: ["asset-references", "logo-rules", "visual-typography"],
        snapshot: {
          ...completeSlice.snapshot,
          visualIdentity: {
            colors: completeSlice.snapshot.visualIdentity!.colors,
            typography: [],
            logoRules: [],
          },
          assetReferences: [],
        },
      },
    });

    expect(view?.visualIdentity.typography.state).toBe("missing");
    expect(view?.assetReferences.items).toEqual([]);
    expect(view?.voice.dos).toEqual(["Use active voice"]);
  });

  it("redacts sensitive error-like strings from display", () => {
    expect(sanitizeDevDisplayText("PostgREST error PGRST116")).toBe("[redacted]");
    expect(sanitizeDevDisplayText("Normal tagline")).toBe("Normal tagline");

    const view = presentBrandBrainInspectorView({
      slice: completeSlice,
      warnings: ["Brand Brain unavailable — supabase connection failed"],
    });
    expect(view?.warnings[0]).toBe("[redacted]");
  });

  it("filters brand brain warnings only", () => {
    const filtered = filterBrandBrainWarnings([
      "Company DNA unavailable or empty",
      "Brand Brain is incomplete (50% complete) — gaps: voice",
    ]);
    expect(filtered).toHaveLength(1);
    expect(filtered[0]).toContain("Brand Brain");
  });
});

describe("dev playground guard", () => {
  const originalEnv = process.env.NODE_ENV;

  afterEach(() => {
    vi.stubEnv("NODE_ENV", originalEnv ?? "test");
  });

  it("is disabled outside development", () => {
    vi.stubEnv("NODE_ENV", "production");
    expect(isDevPlaygroundEnabled()).toBe(false);
  });

  it("is enabled in development", () => {
    vi.stubEnv("NODE_ENV", "development");
    expect(isDevPlaygroundEnabled()).toBe(true);
  });
});
