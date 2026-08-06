/**
 * Research Layer — canonical types.
 * Sprint 8 Phase 2. Facts only — no recommendations, no strategy.
 */

/** Research Layer version — bumps when graph schema changes. */
export const RESEARCH_LAYER_VERSION = "1.0.0";

/** Numeric confidence attached to every research node (0 = missing, 1 = verified). */
export type ResearchConfidenceScore = number;

export const RESEARCH_CONFIDENCE = {
  /** Direct website or customer-confirmed statement. */
  websiteStatement: 0.95,
  /** Strong homepage or profile inference. */
  homepageInference: 0.7,
  /** Weak or partial inference. */
  weakInference: 0.4,
  /** Data not available. */
  missing: 0,
} as const;

/** Origin of a research finding — traceable back to source. */
export type ResearchSourceKind =
  | "website"
  | "competitor"
  | "brandbook"
  | "customer"
  | "memory"
  | "human"
  | "api"
  | "manual"
  | "company_profile"
  | "campaign_context"
  | "capability_output";

export type ResearchSource = {
  kind: ResearchSourceKind;
  /** Stable reference — URL, record id, capability id, etc. */
  refId: string;
  label?: string;
  capturedAt?: string;
};

export type ResearchValidationStatus = "pending" | "validated" | "rejected" | "superseded";

/** Every fact collected must carry full provenance — no free-floating text. */
export type ResearchEvidence = {
  id: string;
  title: string;
  description: string;
  source: ResearchSource;
  confidence: ResearchConfidenceScore;
  collectedAt: string;
  version: string;
  validationStatus: ResearchValidationStatus;
};

/** Explicit record of what Research does NOT know — future Layers must not guess. */
export type ResearchUnknown = {
  id: string;
  title: string;
  confidence: ResearchConfidenceScore;
  reason: string;
  collectedAt: string;
  version: string;
};

/** SWOT-style research nodes — evidence-backed only. */
export type ResearchSwotNode = {
  label: string;
  evidence: readonly ResearchEvidence[];
};

/** Canonical Research Layer output — consumed by Understanding Layer (future). */
export type ResearchGraph = {
  version: string;
  organizationId: string;
  campaignId?: string;
  collectedAt: string;
  company: readonly ResearchEvidence[];
  website: readonly ResearchEvidence[];
  products: readonly ResearchEvidence[];
  services: readonly ResearchEvidence[];
  competitors: readonly ResearchEvidence[];
  audience: readonly ResearchEvidence[];
  brand: readonly ResearchEvidence[];
  seo: readonly ResearchEvidence[];
  market: readonly ResearchEvidence[];
  offer: readonly ResearchEvidence[];
  strengths: readonly ResearchSwotNode[];
  weaknesses: readonly ResearchSwotNode[];
  opportunities: readonly ResearchSwotNode[];
  risks: readonly ResearchSwotNode[];
  unknowns: readonly ResearchUnknown[];
};

export type ResearchGraphNodeKey =
  | "company"
  | "website"
  | "products"
  | "services"
  | "competitors"
  | "audience"
  | "brand"
  | "seo"
  | "market"
  | "offer";

export function emptyResearchGraph(input: {
  organizationId: string;
  campaignId?: string;
  collectedAt?: string;
}): ResearchGraph {
  const collectedAt = input.collectedAt ?? new Date().toISOString();
  return {
    version: RESEARCH_LAYER_VERSION,
    organizationId: input.organizationId,
    campaignId: input.campaignId,
    collectedAt,
    company: [],
    website: [],
    products: [],
    services: [],
    competitors: [],
    audience: [],
    brand: [],
    seo: [],
    market: [],
    offer: [],
    strengths: [],
    weaknesses: [],
    opportunities: [],
    risks: [],
    unknowns: [],
  };
}
