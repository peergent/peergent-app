/**
 * Marketing Intelligence — opportunity signals.
 */

import type { ChannelIntelligence } from "./brain-types";
import type { ReasoningBrainGraph } from "../reasoning/brain-types";
import type { ResearchBrainGraph } from "../research/brain-types";
import type { MarketingEvidenceRef, MarketingOpportunity } from "./brain-types";
import { enforceMarketingConfidenceCeiling } from "./marketing-intelligence-confidence";

let oppCounter = 0;

export function resetMarketingOpportunityCounter(): void {
  oppCounter = 0;
}

export function buildMarketingOpportunities(input: {
  researchGraph: ResearchBrainGraph;
  reasoningGraph: ReasoningBrainGraph;
  channels: readonly ChannelIntelligence[];
  evidence: readonly MarketingEvidenceRef[];
}): MarketingOpportunity[] {
  const opportunities: MarketingOpportunity[] = [];

  for (const researchOpp of input.researchGraph.opportunities) {
    oppCounter += 1;
    opportunities.push({
      id: `mi-opp-${oppCounter}`,
      title: researchOpp.title,
      description: researchOpp.description,
      category: researchOpp.domain,
      audience: [],
      channels: [],
      funnelStage: "consideration",
      expectedBusinessImpact: "medium",
      marketingImpact: researchOpp.description,
      urgency: researchOpp.confidence === "high" ? "high" : "medium",
      effort: "medium",
      confidence: enforceMarketingConfidenceCeiling(researchOpp.confidence, researchOpp.evidenceIds.length),
      evidenceIds: researchOpp.evidenceIds,
      dependencies: [],
      risks: [],
    });
  }

  for (const channel of input.channels.filter((c) => c.opportunities.length > 0)) {
    oppCounter += 1;
    opportunities.push({
      id: `mi-opp-${oppCounter}`,
      title: `${channel.channel} opportunity signal`,
      description: channel.opportunities.join("; "),
      category: "channel",
      audience: [],
      channels: [channel.channel],
      funnelStage: channel.funnelRole,
      expectedBusinessImpact: "medium",
      marketingImpact: channel.opportunities[0] ?? "",
      urgency: channel.intentFit,
      effort: channel.estimatedComplexity,
      confidence: channel.confidence,
      evidenceIds: channel.evidenceIds,
      dependencies: [],
      risks: [...channel.risks],
    });
  }

  for (const reasoningOpp of input.reasoningGraph.opportunities.slice(0, 3)) {
    oppCounter += 1;
    opportunities.push({
      id: `mi-opp-${oppCounter}`,
      title: reasoningOpp.description.slice(0, 60),
      description: reasoningOpp.description,
      category: "reasoning",
      audience: [],
      channels: [],
      funnelStage: "awareness",
      expectedBusinessImpact: "medium",
      marketingImpact: reasoningOpp.reason,
      urgency: reasoningOpp.priority,
      effort: reasoningOpp.requiredEffort,
      confidence: enforceMarketingConfidenceCeiling(
        reasoningOpp.confidence,
        reasoningOpp.supportingEvidence.length
      ),
      evidenceIds: reasoningOpp.supportingEvidence,
      dependencies: [],
      risks: [],
    });
  }

  return opportunities;
}

export function containsStrategyLanguage(text: string): boolean {
  return /\b(use .+ as primary|allocate \d+|spend \d+|we should launch)\b/i.test(text);
}
