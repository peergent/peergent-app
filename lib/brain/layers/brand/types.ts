/**
 * Brand Brain — canonical types.
 * Sprint 10.0. Living brand knowledge model — not a brandbook, prompt, or JSON config.
 */

/** Brand Brain version — bumps when graph schema changes. */
export const BRAND_LAYER_VERSION = "1.0.0";

export type BrandConfidenceScore = number;

export const BRAND_CONFIDENCE = {
  customerConfirmed: 0.95,
  capabilityFinding: 0.75,
  profileInference: 0.65,
  weakSignal: 0.4,
  missing: 0,
} as const;

/** How brand knowledge is known — never collapse evidence into truth silently. */
export type BrandKnowledgeStatus =
  | "observed"
  | "inferred"
  | "validated"
  | "assumed"
  | "unknown";

export type BrandResearchSourceKind =
  | "website"
  | "brandbook"
  | "customer"
  | "campaign_context"
  | "company_profile"
  | "capability_output"
  | "human"
  | "manual"
  | "memory"
  | "api";

export type BrandResearchSource = {
  readonly kind: BrandResearchSourceKind;
  /** Stable reference — URL, record id, capability id, etc. */
  readonly refId: string;
  readonly label?: string;
  readonly capturedAt?: string;
};

/**
 * Brand Research observation — evidence only, no interpretation into truth.
 * Preserves source, evidence, confidence, timestamp, version.
 */
export type BrandResearchObservation = {
  readonly id: string;
  readonly concept: BrandConceptId;
  readonly title: string;
  readonly evidence: string;
  readonly source: BrandResearchSource;
  readonly confidence: BrandConfidenceScore;
  readonly collectedAt: string;
  readonly version: string;
};

/** Explicit record of what Brand Research does NOT know. */
export type BrandResearchUnknown = {
  readonly id: string;
  readonly concept: BrandConceptId;
  readonly title: string;
  readonly reason: string;
  readonly confidence: BrandConfidenceScore;
  readonly collectedAt: string;
  readonly version: string;
};

/** Brand Research output — facts collected, never decided. */
export type BrandResearchGraph = {
  readonly version: string;
  readonly organizationId: string;
  readonly campaignId?: string;
  readonly collectedAt: string;
  readonly observations: readonly BrandResearchObservation[];
  readonly unknowns: readonly BrandResearchUnknown[];
};

/**
 * Brand Model fact — structured, versionable, queryable brand knowledge.
 * Distinguishes observed / inferred / validated / assumed / unknown.
 */
export type BrandFact = {
  readonly id: string;
  readonly concept: BrandConceptId;
  readonly label: string;
  readonly value: string;
  readonly knowledgeStatus: BrandKnowledgeStatus;
  readonly confidence: BrandConfidenceScore;
  readonly supportingObservationIds: readonly string[];
  readonly collectedAt: string;
  readonly version: string;
};

/** Structured brand knowledge representation. */
export type BrandModel = {
  readonly version: string;
  readonly facts: readonly BrandFact[];
};

/** Canonical Brand Brain output — research + model. */
export type BrandGraph = {
  readonly version: string;
  readonly organizationId: string;
  readonly campaignId?: string;
  readonly collectedAt: string;
  readonly research: BrandResearchGraph;
  readonly model: BrandModel;
};

/** All brand concepts the graph supports — Pixel Brain owns rendering details. */
export type BrandConceptId =
  | "mission"
  | "vision"
  | "values"
  | "personality"
  | "audience"
  | "tone_of_voice"
  | "writing_style"
  | "messaging"
  | "visual_identity"
  | "color_system"
  | "typography"
  | "spacing"
  | "photography"
  | "illustration"
  | "motion"
  | "buttons"
  | "icons"
  | "cta_style"
  | "layouts"
  | "email_style"
  | "social_style"
  | "advertising_style"
  | "design_principles"
  | "brand_rules";

export type BrandConceptDomain =
  | "foundation"
  | "voice"
  | "visual"
  | "components"
  | "channel_styles"
  | "governance";

export function emptyBrandResearchGraph(input: {
  organizationId: string;
  campaignId?: string;
  collectedAt?: string;
}): BrandResearchGraph {
  return {
    version: BRAND_LAYER_VERSION,
    organizationId: input.organizationId,
    campaignId: input.campaignId,
    collectedAt: input.collectedAt ?? new Date().toISOString(),
    observations: [],
    unknowns: [],
  };
}

export function emptyBrandModel(): BrandModel {
  return {
    version: BRAND_LAYER_VERSION,
    facts: [],
  };
}

export function emptyBrandGraph(input: {
  organizationId: string;
  campaignId?: string;
  collectedAt?: string;
}): BrandGraph {
  const collectedAt = input.collectedAt ?? new Date().toISOString();
  return {
    version: BRAND_LAYER_VERSION,
    organizationId: input.organizationId,
    campaignId: input.campaignId,
    collectedAt,
    research: emptyBrandResearchGraph({ ...input, collectedAt }),
    model: emptyBrandModel(),
  };
}
