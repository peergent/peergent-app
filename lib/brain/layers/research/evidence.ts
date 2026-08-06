import type {
  ResearchConfidenceScore,
  ResearchEvidence,
  ResearchSource,
  ResearchValidationStatus,
} from "./types";
import { RESEARCH_LAYER_VERSION } from "./types";

let evidenceCounter = 0;

export function resetResearchEvidenceCounter(): void {
  evidenceCounter = 0;
}

export function createResearchEvidence(input: {
  id?: string;
  title: string;
  description: string;
  source: ResearchSource;
  confidence: ResearchConfidenceScore;
  collectedAt?: string;
  version?: string;
  validationStatus?: ResearchValidationStatus;
}): ResearchEvidence {
  evidenceCounter += 1;
  return {
    id: input.id ?? `evidence-${evidenceCounter}`,
    title: input.title,
    description: input.description,
    source: input.source,
    confidence: clampConfidence(input.confidence),
    collectedAt: input.collectedAt ?? new Date().toISOString(),
    version: input.version ?? RESEARCH_LAYER_VERSION,
    validationStatus: input.validationStatus ?? "pending",
  };
}

export function clampConfidence(value: ResearchConfidenceScore): ResearchConfidenceScore {
  if (Number.isNaN(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

export function brainConfidenceToScore(confidence: "low" | "medium" | "high"): ResearchConfidenceScore {
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
