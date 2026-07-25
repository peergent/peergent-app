import { describe, expect, it, vi, beforeEach } from "vitest";

import { assembleContextPackage } from "@/lib/context-engine/assembly/context-package";
import { composeContext, getDefaultLazyLayers } from "@/lib/context-engine/assembly/compose-context";
import { LoaderRegistry } from "@/lib/context-engine/core/loader-registry";
import {
  BUILD_CONTEXT_LAZY_LAYERS,
  brandBrainLoader,
  defaultLoaders,
} from "@/lib/context-engine/loaders";
import { brandBrainLoader as brandBrainLoaderExport } from "@/lib/context-engine/loaders/brand-brain-loader";
import type { ContextScope } from "@/lib/context-engine/types";
import { BRAND_BRAIN_GAPS } from "@/lib/brand-brain/ownership";
import { loadBrandBrainContext } from "@/lib/intelligence/adapters/brand-brain-adapter";
import {
  assembledBrandProfileToContextSlice,
  emptyBrandBrainContextSlice,
} from "@/lib/intelligence/types/brand-brain-context-slice";
import type { AssembledBrandProfile } from "@/lib/brand-brain/assemble-brand-profile";
import { createMarketingBundle } from "@/lib/prompt-builder/__tests__/fixtures";
import type { MarketingUnderstandingContextSlice } from "@/lib/intelligence/types/marketing-understanding-context-slice";

const marketingUnderstandingFixture: MarketingUnderstandingContextSlice = {
  roleApplicable: true,
  available: true,
  sparse: false,
  completeness: 88,
  gaps: ["existingContent"],
  brand: {
    mission: "Help teams grow",
    values: [{ id: "v1", name: "Clarity" }],
    toneOfVoice: { summary: "Confident" },
    positioningStatement: "AI employees for growing teams",
    keyMessages: ["Hire peers, not tools"],
  },
  products: [{ id: "p1", name: "Platform" }],
  services: [{ id: "s1", name: "Onboarding" }],
  customerSegments: [
    {
      id: "seg1",
      name: "SMB founders",
      painPoints: ["Limited time"],
      buyingTriggers: ["Growth pressure"],
    },
  ],
  competitors: [{ id: "c1", name: "Rival Co", strengths: [], weaknesses: [], differentiators: [] }],
  goals: [{ id: "g1", title: "Increase inbound", status: "active", priority: 1 }],
  existingContent: [],
  assembledAt: "2026-01-01T00:00:00.000Z",
};

function bundleWithMarketingLayers() {
  const base = createMarketingBundle();
  base.layers["marketing-understanding"] = {
    key: "marketing-understanding",
    data: marketingUnderstandingFixture,
    sources: [
      {
        id: "marketing:understanding",
        type: "derived",
        label: "Marketing Understanding",
        fetchedAt: "2026-01-01T00:00:00.000Z",
        freshness: "live",
      },
    ],
    priority: 55,
    loadMode: "lazy",
  };
  return base;
}

vi.mock("@/lib/intelligence/adapters/brand-brain-adapter", () => ({
  loadBrandBrainContext: vi.fn(),
}));

const mockedLoadBrandBrain = vi.mocked(loadBrandBrainContext);

function createScope(organizationId = "org-ctx-1"): ContextScope {
  return {
    organization: {
      organizationId,
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
    requestedAt: "2026-06-20T12:00:00.000Z",
  };
}

const fullAssembled: AssembledBrandProfile = {
  profile: {
    id: "dna-1",
    organizationId: "org-ctx-1",
    name: "Acme",
    status: "active",
    version: 1,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-02T00:00:00.000Z",
  },
  identity: {
    tagline: "Built for teams",
    keyMessages: ["Peers"],
    story: "Mission",
  },
  visualIdentity: { colors: [], typography: [], logoRules: [] },
  voice: {
    summary: "Clear",
    personalityTraits: [],
    dos: [],
    donts: [],
    forbiddenPhrases: [],
    preferredCtaPatterns: [],
    emojiPolicy: "none",
  },
  creativeRules: { layoutConstraints: [] },
  assetReferences: [],
  gaps: ["visual-colors", "visual-typography", "logo-rules", "layout-constraints", "asset-references"],
};

describe("brand-brain context integration", () => {
  beforeEach(() => {
    mockedLoadBrandBrain.mockReset();
  });

  it("registers the brand-brain loader in default loaders and lazy plan", () => {
    expect(defaultLoaders.some((loader) => loader.layerKey === "brand-brain")).toBe(
      true
    );
    expect(brandBrainLoaderExport.layerKey).toBe("brand-brain");
    expect(BUILD_CONTEXT_LAZY_LAYERS).toContain("brand-brain");
    expect(getDefaultLazyLayers()).toContain("brand-brain");

    const registry = new LoaderRegistry();
    registry.registerMany(defaultLoaders);
    expect(registry.get("brand-brain")).toBe(brandBrainLoader);
  });

  it("assembles a complete brand slice with gaps preserved", async () => {
    const assembledAt = "2026-06-20T12:00:00.000Z";
    const slice = assembledBrandProfileToContextSlice(fullAssembled, assembledAt);
    mockedLoadBrandBrain.mockResolvedValue({
      slice,
      sources: [
        {
          id: "brand-brain:org-ctx-1",
          type: "supabase",
          label: "Brand Brain",
          fetchedAt: assembledAt,
          freshness: "live",
        },
      ],
    });

    const result = await brandBrainLoader.load({
      scope: createScope(),
      supabase: {} as never,
    });

    expect(mockedLoadBrandBrain).toHaveBeenCalledWith(
      {},
      "org-ctx-1",
      "2026-06-20T12:00:00.000Z"
    );
    expect(result.data.available).toBe(true);
    expect(result.data.gaps).toContain("visual-colors");
    expect(result.data.snapshot.identity?.tagline).toBe("Built for teams");
  });

  it("returns partial slice when sources are empty but organization exists", async () => {
    const assembledAt = "2026-06-20T12:00:00.000Z";
    const partial: AssembledBrandProfile = {
      ...fullAssembled,
      identity: { keyMessages: [] },
      voice: {
        personalityTraits: [],
        dos: [],
        donts: [],
        forbiddenPhrases: [],
        preferredCtaPatterns: [],
        emojiPolicy: "none",
      },
      gaps: [...BRAND_BRAIN_GAPS],
      profile: { ...fullAssembled.profile, status: "draft" },
    };
    mockedLoadBrandBrain.mockResolvedValue({
      slice: assembledBrandProfileToContextSlice(partial, assembledAt),
      sources: [],
    });

    const result = await brandBrainLoader.load({
      scope: createScope(),
      supabase: {} as never,
    });

    expect(result.data.available).toBe(false);
    expect(result.data.gaps.length).toBe(BRAND_BRAIN_GAPS.length);
  });

  it("does not throw when brand sources are missing rows", async () => {
    mockedLoadBrandBrain.mockResolvedValue({
      slice: assembledBrandProfileToContextSlice(fullAssembled, "2026-06-20T12:00:00.000Z"),
      sources: [],
    });

    await expect(
      brandBrainLoader.load({ scope: createScope(), supabase: {} as never })
    ).resolves.toBeDefined();
  });

  it("degrades when organization is inaccessible", async () => {
    const assembledAt = "2026-06-20T12:00:00.000Z";
    mockedLoadBrandBrain.mockResolvedValue({
      slice: emptyBrandBrainContextSlice(assembledAt),
      sources: [
        {
          id: "brand-brain:unavailable:org-ctx-1",
          type: "derived",
          label: "Brand Brain unavailable — organization not accessible",
          fetchedAt: assembledAt,
          freshness: "cached",
        },
      ],
      degraded: true,
    });

    const result = await brandBrainLoader.load({
      scope: createScope(),
      supabase: {} as never,
    });

    expect(result.data.available).toBe(false);
    expect(result.sources[0]?.label).toContain("organization not accessible");
  });

  it("degrades on repository failure without throwing", async () => {
    mockedLoadBrandBrain.mockResolvedValue({
      slice: emptyBrandBrainContextSlice("2026-06-20T12:00:00.000Z"),
      sources: [
        {
          id: "brand-brain:unavailable:org-ctx-1",
          type: "derived",
          label: "Brand Brain unavailable — source load failed",
          fetchedAt: "2026-06-20T12:00:00.000Z",
          freshness: "cached",
        },
      ],
      degraded: true,
    });

    await expect(
      brandBrainLoader.load({ scope: createScope(), supabase: {} as never })
    ).resolves.toMatchObject({ key: "brand-brain" });
  });

  it("includes brandBrain in ContextPackage with warnings and sources", () => {
    const base = bundleWithMarketingLayers();
    const assembledAt = "2026-06-01T00:00:00.000Z";
    const slice = assembledBrandProfileToContextSlice(fullAssembled, assembledAt);

    base.layers["brand-brain"] = {
      key: "brand-brain",
      data: slice,
      sources: [
        {
          id: "brand-brain:live",
          type: "supabase",
          label: "Brand Brain",
          fetchedAt: assembledAt,
          freshness: "live",
        },
      ],
      priority: 58,
      loadMode: "lazy",
    };

    const bundle = composeContext(base.scope, base.layers, {
      pendingLazyLayers: [...BUILD_CONTEXT_LAZY_LAYERS],
      traceId: base.meta.traceId,
    });

    const contextPackage = assembleContextPackage(bundle);

    expect(contextPackage.slices.brandBrain?.available).toBe(true);
    expect(contextPackage.slices.companyDna).toBeDefined();
    expect(contextPackage.slices.marketingUnderstanding).toBeDefined();
    expect(contextPackage.meta.loadedLayers).toContain("brand-brain");
    expect(contextPackage.meta.sources.some((s) => s.label === "Brand Brain")).toBe(
      true
    );
    expect(
      contextPackage.meta.warnings.some((w) => w.includes("Brand Brain is incomplete"))
    ).toBe(true);
  });

  it("warns when brand brain is unavailable without failing other slices", () => {
    const base = bundleWithMarketingLayers();
    const assembledAt = "2026-06-01T00:00:00.000Z";

    base.layers["brand-brain"] = {
      key: "brand-brain",
      data: emptyBrandBrainContextSlice(assembledAt),
      sources: [
        {
          id: "brand-brain:unavailable",
          type: "derived",
          label: "Brand Brain unavailable",
          fetchedAt: assembledAt,
          freshness: "cached",
        },
      ],
      priority: 58,
      loadMode: "lazy",
    };

    const contextPackage = assembleContextPackage(
      composeContext(base.scope, base.layers, {
        pendingLazyLayers: [...BUILD_CONTEXT_LAZY_LAYERS],
        traceId: base.meta.traceId,
      })
    );

    expect(contextPackage.slices.brandBrain?.available).toBe(false);
    expect(contextPackage.meta.warnings).toContain("Brand Brain unavailable or empty");
    expect(contextPackage.slices.marketingUnderstanding).toBeDefined();
  });
});
