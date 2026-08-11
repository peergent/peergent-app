/**
 * Marketing Intelligence — audience domain.
 */

import type { CompanyGraph } from "../company/types";
import type { ResearchBrainGraph } from "../research/brain-types";
import type { ReasoningBrainGraph } from "../reasoning/brain-types";
import type { AudienceSegmentIntelligence, MarketingEvidenceRef } from "./brain-types";
import { enforceMarketingConfidenceCeiling } from "./marketing-intelligence-confidence";

let segmentCounter = 0;

export function resetAudienceIntelligenceCounter(): void {
  segmentCounter = 0;
}

export function buildAudienceIntelligence(input: {
  companyGraph: CompanyGraph;
  researchGraph: ResearchBrainGraph;
  reasoningGraph: ReasoningBrainGraph;
  evidence: readonly MarketingEvidenceRef[];
  audienceContext?: readonly string[];
}): AudienceSegmentIntelligence[] {
  const segments: AudienceSegmentIntelligence[] = [];
  const audienceFacts = input.companyGraph.facts.filter(
    (f) => f.domain === "audience" || f.domain === "ideal_customers"
  );

  const names = [
    ...audienceFacts.map((f) => f.value),
    ...(input.audienceContext ?? []),
    ...input.researchGraph.audienceInsights.map((a) => a.segment),
  ];
  const unique = [...new Set(names.map((n) => n.trim()).filter(Boolean))].slice(0, 6);

  for (const segment of unique) {
    segmentCounter += 1;
    const relatedEvidence = input.evidence.filter((e) =>
      e.summary.toLowerCase().includes(segment.toLowerCase())
    );
    const evidenceIds = relatedEvidence.map((e) => e.id);
    const insight = input.researchGraph.audienceInsights.find(
      (a) => a.segment.toLowerCase() === segment.toLowerCase()
    );

    if (evidenceIds.length === 0 && !insight) continue;

    const confidence = enforceMarketingConfidenceCeiling(
      insight?.confidence ?? (evidenceIds.length >= 2 ? "medium" : "low"),
      evidenceIds.length
    );

    segments.push({
      segment,
      importance: confidence === "high" ? "high" : "medium",
      intentLevel: confidence === "low" ? "low" : "medium",
      coreProblem: insight?.painPoints[0] ?? "Problem context requires more audience evidence.",
      primaryMotivation: insight?.motivations[0] ?? "Motivation inferred from company and research context.",
      keyObjections: insight?.objections.length ? [...insight.objections] : [],
      trustBuilders: insight?.trustDrivers.length ? [...insight.trustDrivers] : [],
      preferredChannels: insight?.channelBehavior.length ? [...insight.channelBehavior] : [],
      messageSensitivity: confidence === "low" ? "High — weak evidence" : "Moderate",
      evidenceIds,
      confidence,
    });
  }

  return segments;
}
