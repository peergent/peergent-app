/**
 * Research Brain — audience enrichment (proposals only, never overwrite Company Brain).
 */

import type { CompanyGraph } from "../company/types";
import type {
  AudienceInsight,
  ResearchBrainEvidence,
  ResearchFinding,
} from "./brain-types";
import { enforceConfidenceCeiling } from "./research-confidence";

let insightCounter = 0;
let findingCounter = 0;

export function resetResearchAudienceCounters(): void {
  insightCounter = 0;
  findingCounter = 0;
}

export function buildAudienceResearch(input: {
  companyGraph: CompanyGraph;
  evidence: readonly ResearchBrainEvidence[];
  enrichmentSegments?: readonly string[];
}): { insights: AudienceInsight[]; findings: ResearchFinding[] } {
  const insights: AudienceInsight[] = [];
  const findings: ResearchFinding[] = [];
  const now = new Date().toISOString();

  const audienceFacts = input.companyGraph.facts.filter(
    (f) => f.domain === "audience" || f.domain === "ideal_customers"
  );

  const segments = audienceFacts.map((f) => f.value);
  const enrichmentCandidates = input.enrichmentSegments ?? [];

  for (const segment of segments) {
    const relatedEvidence = input.evidence.filter((e) =>
      e.normalizedSummary.toLowerCase().includes(segment.toLowerCase())
    );
    const evidenceIds = relatedEvidence.map((e) => e.id);
    if (evidenceIds.length === 0) continue;

    insightCounter += 1;
    insights.push({
      id: `aud-${insightCounter}`,
      segment,
      painPoints: [],
      motivations: [],
      objections: [],
      purchaseTriggers: [],
      languageUsed: relatedEvidence.map((e) => e.rawExcerpt.slice(0, 80)),
      trustDrivers: [],
      decisionCriteria: [],
      frequentQuestions: [],
      channelBehavior: [],
      confidence: "medium",
      evidenceIds,
      enrichmentOnly: true,
    });

    findingCounter += 1;
    findings.push({
      id: `find-aud-${findingCounter}`,
      domain: "audience",
      title: `Audience segment documented: ${segment}`,
      summary: `External evidence aligns with known audience segment "${segment}". Enrichment only — Company Brain remains canonical.`,
      findingType: "fact",
      confidence: enforceConfidenceCeiling("medium", evidenceIds.length, "fact"),
      importance: "medium",
      sourceIds: relatedEvidence.map((e) => e.sourceId),
      evidenceIds,
      relatedCompetitors: [],
      relatedAudienceSegments: [segment],
      relatedProducts: [],
      relatedMarkets: [],
      relatedCampaigns: [],
      createdAt: now,
      freshness: relatedEvidence[0]?.freshness ?? "unknown",
      expiresAt: relatedEvidence[0]?.validUntil ?? null,
    });
  }

  for (const candidate of enrichmentCandidates) {
    if (segments.some((s) => s.toLowerCase() === candidate.toLowerCase())) continue;

    insightCounter += 1;
    insights.push({
      id: `aud-${insightCounter}`,
      segment: candidate,
      painPoints: [],
      motivations: [],
      objections: [],
      purchaseTriggers: [],
      languageUsed: [],
      trustDrivers: [],
      decisionCriteria: [],
      frequentQuestions: [],
      channelBehavior: [],
      confidence: "low",
      evidenceIds: [],
      enrichmentOnly: true,
    });

    findingCounter += 1;
    findings.push({
      id: `find-aud-${findingCounter}`,
      domain: "audience",
      title: `Proposed audience enrichment: ${candidate}`,
      summary: `Research suggests "${candidate}" as a potential audience segment — requires Company Brain confirmation.`,
      findingType: "hypothesis",
      confidence: "low",
      importance: "low",
      sourceIds: [],
      evidenceIds: [],
      relatedCompetitors: [],
      relatedAudienceSegments: [candidate],
      relatedProducts: [],
      relatedMarkets: [],
      relatedCampaigns: [],
      createdAt: now,
      freshness: "unknown",
      expiresAt: null,
    });
  }

  return { insights, findings };
}
