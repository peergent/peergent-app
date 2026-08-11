/**
 * Research Brain — market signal discovery.
 */

import type { CompanyGraph } from "../company/types";
import type { MarketSignal, ResearchBrainEvidence, ResearchFinding } from "./brain-types";
import { enforceConfidenceCeiling } from "./research-confidence";

let signalCounter = 0;
let findingCounter = 0;

export function resetResearchMarketCounters(): void {
  signalCounter = 0;
  findingCounter = 0;
}

export function buildMarketResearch(input: {
  companyGraph: CompanyGraph;
  evidence: readonly ResearchBrainEvidence[];
}): { signals: MarketSignal[]; findings: ResearchFinding[] } {
  const signals: MarketSignal[] = [];
  const findings: ResearchFinding[] = [];
  const now = new Date().toISOString();

  const industryFacts = input.companyGraph.facts.filter(
    (f) => f.domain === "industry" || f.domain === "markets"
  );

  for (const fact of industryFacts) {
    const relatedEvidence = input.evidence.filter(
      (e) =>
        e.normalizedSummary.includes(fact.value) || e.rawExcerpt.includes(fact.value)
    );
    const evidenceIds =
      relatedEvidence.length > 0 ? relatedEvidence.map((e) => e.id) : [];

    if (evidenceIds.length === 0) continue;

    signalCounter += 1;
    signals.push({
      id: `mkt-${signalCounter}`,
      signalType: fact.domain,
      description: fact.value,
      evidenceIds,
      confidence: fact.confidence === "high" ? "medium" : "low",
      freshness: relatedEvidence[0]?.freshness ?? "unknown",
    });

    findingCounter += 1;
    findings.push({
      id: `find-mkt-${findingCounter}`,
      domain: "market",
      title: `Market context: ${fact.title}`,
      summary: fact.value,
      findingType: "signal",
      confidence: enforceConfidenceCeiling(
        fact.confidence === "high" ? "medium" : "low",
        evidenceIds.length,
        "signal"
      ),
      importance: "medium",
      sourceIds: relatedEvidence.map((e) => e.sourceId),
      evidenceIds,
      relatedCompetitors: [],
      relatedAudienceSegments: [],
      relatedProducts: [],
      relatedMarkets: [fact.value],
      relatedCampaigns: [],
      createdAt: now,
      freshness: relatedEvidence[0]?.freshness ?? "unknown",
      expiresAt: relatedEvidence[0]?.validUntil ?? null,
    });
  }

  return { signals, findings };
}
