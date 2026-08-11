/**
 * Research Brain — competitor structured comparisons.
 * Never fabricate pricing or performance.
 */

import type { CompanyGraph } from "../company/types";
import type {
  CompetitorProfile,
  ResearchBrainEvidence,
  ResearchComparison,
  ResearchConfidenceLabel,
  ResearchFinding,
} from "./brain-types";
import { enforceConfidenceCeiling } from "./research-confidence";

let competitorCounter = 0;
let comparisonCounter = 0;
let findingCounter = 0;

export function resetResearchCompetitorCounters(): void {
  competitorCounter = 0;
  comparisonCounter = 0;
  findingCounter = 0;
}

function parseCompetitorNames(graph: CompanyGraph): string[] {
  const names = new Set<string>();
  for (const fact of graph.facts) {
    if (fact.domain === "competitive_position" || /competitor/i.test(fact.key)) {
      fact.value.split(/[,;]/).forEach((part) => {
        const trimmed = part.trim();
        if (trimmed.length > 1) names.add(trimmed);
      });
    }
  }
  return [...names].slice(0, 5);
}

export function buildCompetitorResearch(input: {
  companyGraph: CompanyGraph;
  evidence: readonly ResearchBrainEvidence[];
  maxCompetitors: number;
}): {
  profiles: CompetitorProfile[];
  comparisons: ResearchComparison[];
  findings: ResearchFinding[];
} {
  const names = parseCompetitorNames(input.companyGraph).slice(0, input.maxCompetitors);
  const profiles: CompetitorProfile[] = [];
  const comparisons: ResearchComparison[] = [];
  const findings: ResearchFinding[] = [];
  const now = new Date().toISOString();

  const companyPositioning = input.companyGraph.facts.find(
    (f) => f.domain === "competitive_position" || f.key === "positioning"
  );

  for (const name of names) {
    competitorCounter += 1;
    const relatedEvidence = input.evidence.filter((e) =>
      e.normalizedSummary.toLowerCase().includes(name.toLowerCase())
    );
    const evidenceIds = relatedEvidence.map((e) => e.id);
    const hasEvidence = evidenceIds.length > 0;
    const confidence: ResearchConfidenceLabel = hasEvidence ? "medium" : "low";

    profiles.push({
      id: `comp-${competitorCounter}`,
      name,
      website: null,
      positioning: hasEvidence ? relatedEvidence[0]?.normalizedSummary ?? null : null,
      offer: null,
      pricingSignals: [],
      primaryMessages: hasEvidence ? [relatedEvidence[0]?.normalizedSummary ?? ""] : [],
      proofPoints: [],
      channels: [],
      contentThemes: [],
      strengths: [],
      weaknesses: [],
      differentiators: [],
      customerSentiment: null,
      recentMovements: [],
      confidence,
      evidenceIds,
    });

    if (companyPositioning && hasEvidence) {
      comparisonCounter += 1;
      comparisons.push({
        id: `cmp-${comparisonCounter}`,
        subject: name,
        dimension: "positioning",
        companyValue: companyPositioning.value,
        externalValue: relatedEvidence[0]?.normalizedSummary ?? "",
        evidenceIds,
        confidence: "medium",
      });
    }

    findingCounter += 1;
    findings.push({
      id: `find-comp-${findingCounter}`,
      domain: "competitor",
      title: `Known competitor: ${name}`,
      summary: hasEvidence
        ? `Competitor ${name} referenced in company or research evidence.`
        : `Competitor ${name} listed without external verification.`,
      findingType: hasEvidence ? "fact" : "hypothesis",
      confidence: enforceConfidenceCeiling(confidence, evidenceIds.length, hasEvidence ? "fact" : "hypothesis"),
      importance: "medium",
      sourceIds: relatedEvidence.map((e) => e.sourceId),
      evidenceIds,
      relatedCompetitors: [name],
      relatedAudienceSegments: [],
      relatedProducts: [],
      relatedMarkets: [],
      relatedCampaigns: [],
      createdAt: now,
      freshness: relatedEvidence[0]?.freshness ?? "unknown",
      expiresAt: relatedEvidence[0]?.validUntil ?? null,
    });
  }

  return { profiles, comparisons, findings };
}
