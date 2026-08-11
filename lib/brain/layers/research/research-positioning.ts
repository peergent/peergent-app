/**
 * Research Brain — positioning comparison and gap analysis.
 */

import type { CompanyGraph } from "../company/types";
import type {
  PositioningInsight,
  ResearchBrainEvidence,
  ResearchContradiction,
  ResearchFinding,
  ResearchOpportunity,
} from "./brain-types";
import { enforceConfidenceCeiling } from "./research-confidence";

let insightCounter = 0;
let findingCounter = 0;
let contradictionCounter = 0;
let opportunityCounter = 0;

export function resetResearchPositioningCounters(): void {
  insightCounter = 0;
  findingCounter = 0;
  contradictionCounter = 0;
  opportunityCounter = 0;
}

export function buildPositioningResearch(input: {
  companyGraph: CompanyGraph;
  evidence: readonly ResearchBrainEvidence[];
  competitorClaims?: readonly string[];
}): {
  insights: PositioningInsight[];
  contradictions: ResearchContradiction[];
  opportunities: ResearchOpportunity[];
  findings: ResearchFinding[];
} {
  const insights: PositioningInsight[] = [];
  const contradictions: ResearchContradiction[] = [];
  const opportunities: ResearchOpportunity[] = [];
  const findings: ResearchFinding[] = [];
  const now = new Date().toISOString();

  const uspFacts = input.companyGraph.facts.filter(
    (f) => f.domain === "usps" || f.domain === "differentiators" || f.key.includes("usp")
  );
  const positioningFacts = input.companyGraph.facts.filter(
    (f) => f.domain === "competitive_position" || f.key === "positioning"
  );

  const evidenceIds = input.evidence.map((e) => e.id);
  if (uspFacts.length === 0 && positioningFacts.length === 0) {
    return { insights, contradictions, opportunities, findings };
  }

  const positioningGaps: string[] = [];
  const messageSaturation: string[] = [];
  const proofGaps: string[] = [];

  for (const usp of uspFacts) {
    const claim = usp.value.toLowerCase();
    const competitorMatches = (input.competitorClaims ?? []).filter((c) =>
      c.toLowerCase().includes(claim.slice(0, Math.min(claim.length, 20)))
    );

    if (competitorMatches.length > 0) {
      messageSaturation.push(usp.value);
      contradictionCounter += 1;
      const relatedEvidence = input.evidence.filter((e) =>
        e.normalizedSummary.toLowerCase().includes(claim.slice(0, 12))
      );
      const cEvidenceIds =
        relatedEvidence.length > 0 ? relatedEvidence.map((e) => e.id) : evidenceIds.slice(0, 1);

      contradictions.push({
        id: `con-${contradictionCounter}`,
        companyClaim: usp.value,
        externalEvidence: `Competitor also claims similar: ${competitorMatches.join("; ")}`,
        companyFactId: usp.id,
        evidenceIds: cEvidenceIds,
        confidence: cEvidenceIds.length > 0 ? "medium" : "low",
        unresolved: true,
      });

      findingCounter += 1;
      findings.push({
        id: `find-pos-${findingCounter}`,
        domain: "positioning",
        title: `Saturated claim: ${usp.title}`,
        summary: `Company USP "${usp.value}" appears saturated in market evidence.`,
        findingType: "contradiction",
        confidence: enforceConfidenceCeiling("medium", cEvidenceIds.length, "contradiction"),
        importance: "high",
        sourceIds: relatedEvidence.map((e) => e.sourceId),
        evidenceIds: cEvidenceIds,
        relatedCompetitors: [],
        relatedAudienceSegments: [],
        relatedProducts: [],
        relatedMarkets: [],
        relatedCampaigns: [],
        createdAt: now,
        freshness: relatedEvidence[0]?.freshness ?? "unknown",
        expiresAt: null,
      });
    }

    if (usp.confidence === "low") {
      proofGaps.push(usp.value);
      positioningGaps.push(`Weak differentiation for: ${usp.value}`);
    }
  }

  if (positioningGaps.length > 0 || messageSaturation.length > 0 || proofGaps.length > 0) {
    insightCounter += 1;
    insights.push({
      id: `pos-${insightCounter}`,
      positioningGaps,
      differentiationOpportunities: positioningGaps.map((g) => g.replace("Weak differentiation for: ", "")),
      messageSaturation,
      proofGaps,
      trustGaps: [],
      evidenceIds: evidenceIds.slice(0, 5),
      confidence: evidenceIds.length > 0 ? "medium" : "low",
    });
  }

  for (const gap of positioningGaps.slice(0, 2)) {
    opportunityCounter += 1;
    opportunities.push({
      id: `opp-${opportunityCounter}`,
      domain: "positioning",
      title: "Differentiation opportunity",
      description: gap,
      evidenceIds: evidenceIds.slice(0, 3),
      confidence: "low",
    });
  }

  return { insights, contradictions, opportunities, findings };
}

export function detectReviewContradiction(input: {
  companyClaim: string;
  companyFactId: string | null;
  reviewTheme: string;
  evidenceIds: readonly string[];
}): ResearchContradiction | null {
  if (!input.reviewTheme.trim()) return null;
  contradictionCounter += 1;
  return {
    id: `con-${contradictionCounter}`,
    companyClaim: input.companyClaim,
    externalEvidence: input.reviewTheme,
    companyFactId: input.companyFactId,
    evidenceIds: [...input.evidenceIds],
    confidence: input.evidenceIds.length > 0 ? "medium" : "low",
    unresolved: true,
  };
}
