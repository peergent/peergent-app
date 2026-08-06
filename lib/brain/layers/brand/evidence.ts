import type {
  BrandConfidenceScore,
  BrandResearchObservation,
  BrandResearchSource,
  BrandResearchUnknown,
} from "./types";
import { BRAND_LAYER_VERSION } from "./types";
import type { BrandConceptId } from "./types";

let observationCounter = 0;
let unknownCounter = 0;

export function resetBrandObservationCounter(): void {
  observationCounter = 0;
}

export function resetBrandUnknownCounter(): void {
  unknownCounter = 0;
}

export function clampBrandConfidence(value: BrandConfidenceScore): BrandConfidenceScore {
  if (Number.isNaN(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

export function brainConfidenceToBrandScore(
  confidence: "low" | "medium" | "high"
): BrandConfidenceScore {
  switch (confidence) {
    case "high":
      return 0.95;
    case "medium":
      return 0.7;
    case "low":
      return 0.4;
    default:
      return 0;
  }
}

export function createBrandResearchObservation(input: {
  id?: string;
  concept: BrandConceptId;
  title: string;
  evidence: string;
  source: BrandResearchSource;
  confidence: BrandConfidenceScore;
  collectedAt?: string;
  version?: string;
}): BrandResearchObservation {
  observationCounter += 1;
  return {
    id: input.id ?? `brand-obs-${observationCounter}`,
    concept: input.concept,
    title: input.title,
    evidence: input.evidence,
    source: input.source,
    confidence: clampBrandConfidence(input.confidence),
    collectedAt: input.collectedAt ?? new Date().toISOString(),
    version: input.version ?? BRAND_LAYER_VERSION,
  };
}

export function createBrandResearchUnknown(input: {
  id?: string;
  concept: BrandConceptId;
  title: string;
  reason: string;
  confidence?: BrandConfidenceScore;
  collectedAt?: string;
  version?: string;
}): BrandResearchUnknown {
  unknownCounter += 1;
  return {
    id: input.id ?? `brand-unknown-${unknownCounter}`,
    concept: input.concept,
    title: input.title,
    reason: input.reason,
    confidence: clampBrandConfidence(input.confidence ?? 0),
    collectedAt: input.collectedAt ?? new Date().toISOString(),
    version: input.version ?? BRAND_LAYER_VERSION,
  };
}
