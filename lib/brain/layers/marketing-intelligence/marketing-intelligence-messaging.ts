/**
 * Marketing Intelligence — messaging domain.
 */

import type { ResearchBrainGraph } from "../research/brain-types";
import type { ReasoningBrainGraph } from "../reasoning/brain-types";
import type { MarketingEvidenceRef, MessagingIntelligence } from "./brain-types";
import { enforceMarketingConfidenceCeiling } from "./marketing-intelligence-confidence";

export function buildMessagingIntelligence(input: {
  researchGraph: ResearchBrainGraph;
  reasoningGraph: ReasoningBrainGraph;
  evidence: readonly MarketingEvidenceRef[];
}): MessagingIntelligence {
  const saturatedClaims: string[] = [];
  const dominantMessages: string[] = [];
  const messageRisks: string[] = [];

  for (const insight of input.researchGraph.positioningInsights) {
    saturatedClaims.push(...insight.messageSaturation);
    messageRisks.push(...insight.proofGaps.map((g) => `Proof gap: ${g}`));
  }

  for (const contradiction of input.reasoningGraph.contradictions) {
    saturatedClaims.push(contradiction.companyClaim);
    messageRisks.push(`Saturation risk: ${contradiction.companyClaim}`);
  }

  for (const finding of input.researchGraph.findings.filter((f) => f.findingType === "contradiction")) {
    dominantMessages.push(finding.title);
  }

  const competitorMessages = input.researchGraph.competitorProfiles.flatMap((p) => p.primaryMessages);
  dominantMessages.push(...competitorMessages.filter(Boolean));

  const evidenceIds = input.evidence
    .filter((e) => /message|position|usp|claim/i.test(e.summary))
    .map((e) => e.id);

  const confidence = enforceMarketingConfidenceCeiling(
    saturatedClaims.length > 0 ? "medium" : evidenceIds.length > 0 ? "low" : "low",
    evidenceIds.length
  );

  if (saturatedClaims.length > 0) {
    messageRisks.push("High saturation on dominant market claims — differentiation risk.");
  }

  return {
    dominantMarketMessages: [...new Set(dominantMessages)].slice(0, 8),
    saturatedClaims: [...new Set(saturatedClaims)],
    underusedMessages: [],
    trustThemes: input.reasoningGraph.interpretations
      .filter((i) => /trust|proof/i.test(i.summary))
      .map((i) => i.title),
    proofRequirements: input.researchGraph.positioningInsights.flatMap((p) => p.proofGaps),
    objectionThemes: input.reasoningGraph.risks.map((r) => r.description).slice(0, 5),
    emotionalDrivers: [],
    rationalDrivers: input.reasoningGraph.interpretations
      .filter((i) => /market|business/i.test(i.marketImpact))
      .map((i) => i.summary)
      .slice(0, 3),
    messageDifferentiation: input.researchGraph.positioningInsights.flatMap(
      (p) => p.differentiationOpportunities
    ),
    messageRisks,
    confidence,
    evidenceIds,
  };
}

export function detectMessagingSaturation(saturatedClaims: readonly string[]): boolean {
  return saturatedClaims.length >= 1;
}
