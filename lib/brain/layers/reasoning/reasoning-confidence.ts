/**
 * Reasoning Brain — confidence derivation.
 * Never fabricate certainty.
 */

import type {
  ReasoningBrainGraph,
  ReasoningConfidenceLabel,
  ReasoningEvidenceRef,
  ReasoningInterpretation,
} from "./brain-types";

export function companyConfidenceToLabel(
  confidence: "low" | "medium" | "high"
): ReasoningConfidenceLabel {
  return confidence;
}

export function researchConfidenceToLabel(
  confidence: "low" | "medium" | "high"
): ReasoningConfidenceLabel {
  return confidence;
}

export function combineConfidence(input: {
  companyConfidence?: ReasoningConfidenceLabel;
  researchConfidence?: ReasoningConfidenceLabel;
  evidenceCount: number;
  contradictionCount: number;
  unknownCount: number;
}): ReasoningConfidenceLabel {
  const { evidenceCount, contradictionCount, unknownCount } = input;
  if (evidenceCount === 0) return "low";
  if (contradictionCount > 0 || unknownCount > 2) return "low";

  const scores = [
    input.companyConfidence === "high" ? 3 : input.companyConfidence === "medium" ? 2 : 1,
    input.researchConfidence === "high" ? 3 : input.researchConfidence === "medium" ? 2 : 1,
  ].filter((s) => s > 0);

  if (scores.length === 0) return "low";
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;

  if (avg >= 2.5 && evidenceCount >= 2) return "high";
  if (avg >= 1.5) return "medium";
  return "low";
}

export function enforceReasoningConfidenceCeiling(
  label: ReasoningConfidenceLabel,
  evidenceCount: number
): ReasoningConfidenceLabel {
  if (evidenceCount === 0) return "low";
  if (evidenceCount === 1 && label === "high") return "medium";
  return label;
}

export function aggregateGraphConfidence(
  interpretations: readonly ReasoningInterpretation[]
): ReasoningConfidenceLabel {
  if (interpretations.length === 0) return "low";
  const scores = interpretations.map((i) =>
    i.confidence === "high" ? 3 : i.confidence === "medium" ? 2 : 1
  );
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
  if (avg >= 2.5) return "high";
  if (avg >= 1.5) return "medium";
  return "low";
}

export function deriveInterpretationConfidence(input: {
  evidence: readonly ReasoningEvidenceRef[];
  contradictions: number;
}): { label: ReasoningConfidenceLabel; reason: string } {
  if (input.evidence.length === 0) {
    return { label: "low", reason: "No supporting evidence." };
  }
  if (input.contradictions > 0) {
    return {
      label: "low",
      reason: "Contradicting evidence reduces interpretive confidence.",
    };
  }
  const highCount = input.evidence.filter((e) => e.confidence === "high").length;
  if (highCount >= 2) {
    return { label: "high", reason: "Multiple high-confidence evidence sources agree." };
  }
  if (input.evidence.length >= 2) {
    return { label: "medium", reason: "Multiple evidence sources support interpretation." };
  }
  return { label: "low", reason: "Single evidence source — interpretation tentative." };
}

export function graphConfidenceFactors(graph: ReasoningBrainGraph): {
  companyCertainty: ReasoningConfidenceLabel;
  researchCertainty: ReasoningConfidenceLabel;
  evidenceQuality: ReasoningConfidenceLabel;
  contradictionPenalty: boolean;
  unknownPenalty: boolean;
} {
  const researchCertainty = graph.researchGraphVersion ? "medium" : "low";
  const companyCertainty =
    graph.evidence.filter((e) => e.source === "company_fact").length > 0 ? "medium" : "low";
  const evidenceQuality = aggregateGraphConfidence(graph.interpretations);

  return {
    companyCertainty,
    researchCertainty,
    evidenceQuality,
    contradictionPenalty: graph.contradictions.length > 0,
    unknownPenalty: graph.unknowns.length > 2,
  };
}
