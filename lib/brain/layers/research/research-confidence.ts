/**
 * Research Brain — confidence scoring.
 * Never convert inference into high-confidence fact without evidence.
 */

import type {
  ResearchBrainEvidence,
  ResearchConfidenceLabel,
  ResearchFinding,
  ResearchFindingType,
} from "./brain-types";

export type ConfidenceFactors = {
  readonly sourceAuthority: number;
  readonly sourceFreshness: number;
  readonly supportingSourceCount: number;
  readonly consistencyAcrossSources: number;
  readonly directVsInferred: number;
  readonly contradictingEvidence: number;
};

const AUTHORITY: Record<string, number> = {
  company_website: 0.9,
  company_graph: 0.85,
  competitor_website: 0.75,
  search_result: 0.6,
  review_platform: 0.7,
  market_report: 0.8,
  memory_read: 0.65,
  manual_source: 0.7,
  future_connector: 0.5,
};

export function scoreConfidenceFactors(input: {
  evidence: readonly ResearchBrainEvidence[];
  findingType: ResearchFindingType;
  contradictingCount?: number;
}): ConfidenceFactors {
  const { evidence, findingType, contradictingCount = 0 } = input;
  if (evidence.length === 0) {
    return {
      sourceAuthority: 0,
      sourceFreshness: 0,
      supportingSourceCount: 0,
      consistencyAcrossSources: 0,
      directVsInferred: 0,
      contradictingEvidence: contradictingCount > 0 ? 1 : 0,
    };
  }

  const authority =
    evidence.reduce((sum, e) => sum + (AUTHORITY[e.sourceType] ?? 0.4), 0) / evidence.length;

  const freshness =
    evidence.filter((e) => e.freshness === "fresh").length / evidence.length;

  const directRatio =
    evidence.filter((e) => e.directEvidence).length / evidence.length;

  const uniqueSources = new Set(evidence.map((e) => e.sourceId)).size;
  const supporting = Math.min(1, uniqueSources / 3);

  let consistency = 0.7;
  if (uniqueSources >= 2) consistency = 0.85;

  const factors: ConfidenceFactors = {
    sourceAuthority: authority,
    sourceFreshness: freshness,
    supportingSourceCount: supporting,
    consistencyAcrossSources: consistency,
    directVsInferred: directRatio,
    contradictingEvidence: contradictingCount > 0 ? 0.8 : 0,
  };

  if (findingType === "hypothesis") {
    return { ...factors, directVsInferred: Math.min(factors.directVsInferred, 0.4) };
  }

  return factors;
}

export function factorsToConfidenceLabel(factors: ConfidenceFactors): ResearchConfidenceLabel {
  const score =
    factors.sourceAuthority * 0.25 +
    factors.sourceFreshness * 0.15 +
    factors.supportingSourceCount * 0.2 +
    factors.consistencyAcrossSources * 0.15 +
    factors.directVsInferred * 0.2 -
    factors.contradictingEvidence * 0.3;

  if (factors.supportingSourceCount === 0 && factors.directVsInferred < 0.5) return "low";
  if (score >= 0.75) return "high";
  if (score >= 0.5) return "medium";
  return "low";
}

export function computeFindingConfidence(finding: {
  findingType: ResearchFindingType;
  evidence: readonly ResearchBrainEvidence[];
  contradictingCount?: number;
}): ResearchConfidenceLabel {
  if (finding.findingType === "hypothesis") return "low";
  if (finding.evidence.length === 0) return "low";

  const factors = scoreConfidenceFactors({
    evidence: finding.evidence,
    findingType: finding.findingType,
    contradictingCount: finding.contradictingCount,
  });
  return factorsToConfidenceLabel(factors);
}

export function aggregateGraphConfidence(findings: readonly ResearchFinding[]): ResearchConfidenceLabel {
  if (findings.length === 0) return "low";
  const scores = findings.map((f) =>
    f.confidence === "high" ? 3 : f.confidence === "medium" ? 2 : 1
  );
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
  if (avg >= 2.5) return "high";
  if (avg >= 1.5) return "medium";
  return "low";
}

/** Guard — unsupported facts must never be high confidence. */
export function enforceConfidenceCeiling(
  label: ResearchConfidenceLabel,
  evidenceCount: number,
  findingType: ResearchFindingType
): ResearchConfidenceLabel {
  if (evidenceCount === 0) return "low";
  if (findingType === "hypothesis") return "low";
  if (evidenceCount === 1 && label === "high") return "medium";
  return label;
}
