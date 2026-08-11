/**
 * Marketing Intelligence — market signals domain.
 */

import type { ResearchBrainGraph } from "../research/brain-types";
import type { ReasoningBrainGraph } from "../reasoning/brain-types";
import type { MarketIntelligenceSignal, MarketingEvidenceRef } from "./brain-types";
import { enforceMarketingConfidenceCeiling } from "./marketing-intelligence-confidence";

let signalCounter = 0;

export function resetMarketIntelligenceCounter(): void {
  signalCounter = 0;
}

export function buildMarketIntelligence(input: {
  researchGraph: ResearchBrainGraph;
  reasoningGraph: ReasoningBrainGraph;
  evidence: readonly MarketingEvidenceRef[];
}): MarketIntelligenceSignal[] {
  const signals: MarketIntelligenceSignal[] = [];

  for (const marketSignal of input.researchGraph.marketSignals) {
    signalCounter += 1;
    const evidenceIds = input.evidence
      .filter((e) => marketSignal.evidenceIds.includes(e.refId))
      .map((e) => e.id);

    signals.push({
      signal: marketSignal.description,
      marketingImplication: `Category context affects messaging and channel emphasis: ${marketSignal.signalType}`,
      confidence: enforceMarketingConfidenceCeiling(marketSignal.confidence, evidenceIds.length),
      urgency: marketSignal.freshness === "expired" ? "high" : "medium",
      affectedAudiences: [],
      affectedChannels: [],
      evidenceIds: evidenceIds.length > 0 ? evidenceIds : marketSignal.evidenceIds,
    });
  }

  for (const opp of input.reasoningGraph.opportunities.slice(0, 3)) {
    signalCounter += 1;
    signals.push({
      signal: opp.description,
      marketingImplication: `Market opportunity with marketing relevance: ${opp.reason}`,
      confidence: enforceMarketingConfidenceCeiling(opp.confidence, opp.supportingEvidence.length),
      urgency: opp.priority,
      affectedAudiences: [],
      affectedChannels: [],
      evidenceIds: opp.supportingEvidence,
    });
  }

  return signals;
}
