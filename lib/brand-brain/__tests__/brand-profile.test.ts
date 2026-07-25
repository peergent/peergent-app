import { describe, expect, it } from "vitest";

import type {
  BrandBrainContextSlice,
  BrandProfileSnapshot,
} from "../types";

const FIXTURE_SNAPSHOT: BrandProfileSnapshot = {
  profile: {
    id: "profile-1",
    organizationId: "org-1",
    name: "Acme",
    status: "active",
    version: 1,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  identity: {
    keyMessages: ["Quality first"],
    tagline: "Built to last",
  },
  visualIdentity: {
    colors: [
      { id: "c1", role: "primary", hex: "#112233" },
    ],
    typography: [
      { id: "t1", role: "heading", fontFamily: "Inter" },
    ],
    logoRules: [
      { id: "l1", variant: "primary", assetId: "asset-logo-1" },
    ],
  },
  voice: {
    personalityTraits: ["direct"],
    dos: ["Use active voice"],
    donts: ["Use jargon"],
    forbiddenPhrases: [],
    preferredCtaPatterns: ["Get started"],
    emojiPolicy: "sparingly",
  },
  creativeRules: {
    layoutConstraints: [
      {
        id: "lc1",
        channel: "instagram",
        widthPx: 1080,
        heightPx: 1080,
      },
    ],
  },
  assetReferences: [
    {
      id: "ref-1",
      assetId: "asset-logo-1",
      role: "logo_primary",
      sortOrder: 0,
    },
  ],
};

describe("brand-profile types", () => {
  it("accepts a readonly snapshot fixture with all owned modules", () => {
    expect(FIXTURE_SNAPSHOT.profile.organizationId).toBe("org-1");
    expect(FIXTURE_SNAPSHOT.visualIdentity.colors).toHaveLength(1);
    expect(FIXTURE_SNAPSHOT.assetReferences[0]?.assetId).toBe("asset-logo-1");
  });

  it("accepts a partial context slice for engine projection", () => {
    const slice: BrandBrainContextSlice = {
      available: true,
      completeness: 42,
      gaps: ["visual-typography", "voice"],
      snapshot: {
        identity: FIXTURE_SNAPSHOT.identity,
      },
      assembledAt: "2026-01-01T00:00:00.000Z",
    };

    expect(slice.gaps).toContain("voice");
    expect(slice.snapshot.identity?.keyMessages).toEqual(["Quality first"]);
  });
});
