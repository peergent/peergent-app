import type { ResearchEvidence } from "../research/types";
import { RESEARCH_CONFIDENCE } from "../research/types";
import type { ReasoningConfidenceScore } from "./types";
import { clampReasoningConfidence } from "./reasoning-node";

export type ConfidenceInput = {
  evidence: readonly ResearchEvidence[];
  /** Penalty applied when contradictions affect this node (0–1). */
  contradictionPenalty?: number;
  /** Minimum evidence count before inference is allowed. */
  minEvidenceCount?: number;
};

/**
 * Derives reasoning confidence from research evidence.
 * Never outputs reasoning without computable confidence — returns 0 when insufficient.
 */
export function deriveReasoningConfidence(input: ConfidenceInput): ReasoningConfidenceScore {
  const { evidence, contradictionPenalty = 0, minEvidenceCount = 1 } = input;
  if (evidence.length < minEvidenceCount) return RESEARCH_CONFIDENCE.missing;

  const avg = evidence.reduce((sum, e) => sum + e.confidence, 0) / evidence.length;
  const quantityBoost = Math.min(0.08, evidence.length * 0.015);
  const sourceQuality = evidence.some((e) => e.confidence >= RESEARCH_CONFIDENCE.websiteStatement)
    ? 0.05
    : 0;

  return clampReasoningConfidence(avg + quantityBoost + sourceQuality - contradictionPenalty);
}

export function confidenceFromSingleEvidence(
  evidence: ResearchEvidence | undefined,
  contradictionPenalty = 0
): ReasoningConfidenceScore {
  if (!evidence) return RESEARCH_CONFIDENCE.missing;
  return clampReasoningConfidence(evidence.confidence - contradictionPenalty);
}

export function isUnknownConfidence(confidence: ReasoningConfidenceScore): boolean {
  return confidence <= RESEARCH_CONFIDENCE.missing;
}
