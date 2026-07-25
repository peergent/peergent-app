/**
 * Architectural ownership for Brand Brain (domain boundary only).
 * Business Brain, Company DNA, Asset Brain, and Performance Brain remain separate owners.
 */

/** Modules owned exclusively by Brand Brain. */
export const BRAND_BRAIN_OWNED_MODULES = [
  "identity",
  "visualIdentity",
  "toneOfVoice",
  "creativeRules",
  "assetReferences",
] as const;

export type BrandBrainOwnedModule = (typeof BRAND_BRAIN_OWNED_MODULES)[number];

/** Concerns that must not be modeled inside Brand Brain. */
export const BRAND_BRAIN_EXCLUDED_CONCERNS = [
  "products",
  "services",
  "competitors",
  "customerSegments",
  "knowledge",
  "uploadedAssets",
  "performanceMetrics",
] as const;

export type BrandBrainExcludedConcern = (typeof BRAND_BRAIN_EXCLUDED_CONCERNS)[number];

/** Maps owned modules to human-readable scope (documentation and tests). */
export const BRAND_BRAIN_MODULE_DESCRIPTIONS: Readonly<
  Record<BrandBrainOwnedModule, string>
> = {
  identity:
    "Market-facing identity: positioning, tagline, value proposition, key messages, story.",
  visualIdentity:
    "Deterministic visual system: colors, typography, and logo usage rules.",
  toneOfVoice:
    "Customer-facing voice: traits, dos and donts, forbidden phrases, CTA patterns.",
  creativeRules:
    "Layout and channel constraints for governed creative output.",
  assetReferences:
    "Approved asset IDs and roles; binaries live in Asset Brain.",
};

/** Gaps align to owned modules and visual sub-dimensions for future completeness scoring. */
export const BRAND_BRAIN_GAPS = [
  "identity",
  "visual-colors",
  "visual-typography",
  "logo-rules",
  "voice",
  "layout-constraints",
  "asset-references",
] as const satisfies readonly import("./types").BrandBrainGap[];
