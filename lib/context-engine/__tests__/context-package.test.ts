import { describe, expect, it } from "vitest";
import { assembleContextPackage } from "@/lib/context-engine/assembly/context-package";
import { composeContext, getDefaultLazyLayers } from "@/lib/context-engine/assembly/compose-context";
import { BUILD_CONTEXT_LAZY_LAYERS } from "@/lib/context-engine/loaders";
import { createMarketingBundle } from "@/lib/prompt-builder/__tests__/fixtures";
import type { MarketingUnderstandingContextSlice } from "@/lib/intelligence/types/marketing-understanding-context-slice";

const marketingUnderstanding: MarketingUnderstandingContextSlice = {
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

function createLoadedMarketingBundle() {
  const bundle = createMarketingBundle();
  bundle.layers["marketing-understanding"] = {
    key: "marketing-understanding",
    data: marketingUnderstanding,
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
  bundle.layers["peer-type"] = {
    key: "peer-type",
    data: { role: "Marketing", capabilities: ["strategy", "plan", "content"] },
    sources: [
      {
        id: "peer-type:marketing",
        type: "derived",
        label: "peer-type",
        fetchedAt: "2026-01-01T00:00:00.000Z",
        freshness: "cached",
      },
    ],
    priority: 45,
    loadMode: "lazy",
  };
  return bundle;
}

describe("assembleContextPackage warnings", () => {
  it("does not warn about stub layers excluded from buildContext load plan", () => {
    const base = createLoadedMarketingBundle();
    const bundle = composeContext(base.scope, base.layers, {
      pendingLazyLayers: [...BUILD_CONTEXT_LAZY_LAYERS],
      traceId: base.meta.traceId,
    });

    expect(bundle.meta.missingLayers).not.toContain("knowledge");
    expect(bundle.meta.missingLayers).not.toContain("memory");
    expect(bundle.meta.missingLayers).not.toContain("tools");

    const contextPackage = assembleContextPackage(bundle);
    expect(contextPackage.meta.warnings.some((w) => w.includes("knowledge layer"))).toBe(
      false
    );
    expect(contextPackage.meta.warnings.some((w) => w.includes("memory layer"))).toBe(false);
  });

  it("still warns when optional stub layers are tracked as pending but not loaded", () => {
    const base = createLoadedMarketingBundle();
    const bundle = composeContext(base.scope, base.layers, {
      pendingLazyLayers: getDefaultLazyLayers(),
      traceId: base.meta.traceId,
    });

    expect(bundle.meta.missingLayers).toContain("knowledge");
    expect(bundle.meta.missingLayers).toContain("memory");

    const contextPackage = assembleContextPackage(bundle);
    expect(contextPackage.meta.warnings).toContain("knowledge layer not loaded");
    expect(contextPackage.meta.warnings).toContain("memory layer not loaded");
  });
});
