/**
 * Reasoning Brain — contradiction interpretation and resolution.
 * Reasoning owns contradiction resolution — never silent overwrite.
 */

import type { CompanyGraph } from "../company/types";
import type { ResearchBrainGraph } from "../research/brain-types";
import type {
  ReasoningBrainContradiction,
  ReasoningConfidenceLabel,
  ReasoningEscalation,
  ReasoningInterpretation,
} from "./brain-types";
import { enforceReasoningConfidenceCeiling } from "./reasoning-confidence";

let contradictionCounter = 0;
let interpretationCounter = 0;

export function resetReasoningContradictionCounters(): void {
  contradictionCounter = 0;
  interpretationCounter = 0;
}

function channelFacts(companyGraph: CompanyGraph): string[] {
  return companyGraph.facts
    .filter(
      (f) =>
        /channel|linkedin|social|platform/i.test(f.key) ||
        /channel|linkedin|social|platform/i.test(f.title) ||
        /channel|linkedin|social|platform/i.test(f.value)
    )
    .map((f) => f.value.toLowerCase());
}

export function buildReasoningContradictions(input: {
  companyGraph: CompanyGraph;
  researchGraph: ResearchBrainGraph;
  createdAt: string;
}): {
  contradictions: ReasoningBrainContradiction[];
  interpretations: ReasoningInterpretation[];
  escalations: ReasoningEscalation[];
} {
  const contradictions: ReasoningBrainContradiction[] = [];
  const interpretations: ReasoningInterpretation[] = [];
  const escalations: ReasoningEscalation[] = [];

  for (const researchCon of input.researchGraph.contradictions) {
    contradictionCounter += 1;
    const confidence: ReasoningConfidenceLabel = enforceReasoningConfidenceCeiling(
      researchCon.confidence,
      researchCon.evidenceIds.length
    );

    contradictions.push({
      id: `rc-${contradictionCounter}`,
      companyClaim: researchCon.companyClaim,
      researchClaim: researchCon.externalEvidence,
      interpretation: `Company claim "${researchCon.companyClaim}" conflicts with external evidence.`,
      resolutionStatus: "escalated",
      relatedFactIds: researchCon.companyFactId ? [researchCon.companyFactId] : [],
      relatedResearchIds: researchCon.evidenceIds,
      evidenceIds: researchCon.evidenceIds,
      confidence,
      createdAt: input.createdAt,
    });

    interpretationCounter += 1;
    interpretations.push({
      id: `int-con-${interpretationCounter}`,
      title: "Positioning saturation detected",
      summary: `USP or claim "${researchCon.companyClaim}" appears saturated in market evidence.`,
      confidence,
      importance: "high",
      supportedEvidence: researchCon.evidenceIds,
      relatedFacts: researchCon.companyFactId ? [researchCon.companyFactId] : [],
      relatedResearch: researchCon.evidenceIds,
      businessImpact: "Differentiation may be weaker than assumed.",
      customerImpact: "Customers may not perceive unique value in this claim.",
      marketImpact: "Market messaging around this theme appears crowded.",
      confidenceReason: "Research contradiction with company USP.",
      createdAt: input.createdAt,
    });

    escalations.push({
      id: `esc-usp-${contradictionCounter}`,
      kind: "customer_confirmation_required",
      title: "USP uniqueness requires confirmation",
      reason: `Company believes "${researchCon.companyClaim}" is differentiated; research suggests saturation.`,
      relatedContradictionId: `rc-${contradictionCounter}`,
      relatedEvidence: researchCon.evidenceIds,
      priority: "high",
      requiresCustomerInput: true,
      createdAt: input.createdAt,
    });
  }

  const companyChannels = channelFacts(input.companyGraph);
  const avoidsLinkedIn =
    companyChannels.some((c) => /never|not use|avoid|exclude/i.test(c) && /linkedin/i.test(c)) ||
    (companyChannels.length > 0 &&
      !companyChannels.some((c) => /linkedin/i.test(c)) &&
      companyChannels.some((c) => /email only|no social/i.test(c)));

  const competitorLinkedInActivity = input.researchGraph.findings.some(
    (f) =>
      /linkedin|social|channel/i.test(f.domain) ||
      /linkedin|competitor.*channel/i.test(f.summary.toLowerCase())
  );

  const linkedInCompetitorProfile = input.researchGraph.competitorProfiles.some((p) =>
    p.channels.some((c) => /linkedin/i.test(c))
  );

  if ((competitorLinkedInActivity || linkedInCompetitorProfile) && avoidsLinkedIn) {
    contradictionCounter += 1;
    const evidenceIds = input.researchGraph.evidence.slice(0, 3).map((e) => e.id);

    contradictions.push({
      id: `rc-${contradictionCounter}`,
      companyClaim: "Company does not use LinkedIn",
      researchClaim: "Competitors show LinkedIn channel activity",
      interpretation: "LinkedIn appears underutilized despite competitor activity.",
      resolutionStatus: "interpreted",
      relatedFactIds: [],
      relatedResearchIds: input.researchGraph.findings
        .filter((f) => /linkedin|channel|competitor/i.test(f.domain))
        .map((f) => f.id),
      evidenceIds,
      confidence: evidenceIds.length > 0 ? "medium" : "low",
      createdAt: input.createdAt,
    });

    interpretationCounter += 1;
    interpretations.push({
      id: `int-li-${interpretationCounter}`,
      title: "LinkedIn appears underutilized",
      summary:
        "LinkedIn appears underutilized despite high competitor activity on the channel.",
      confidence: evidenceIds.length > 0 ? "medium" : "low",
      importance: "high",
      supportedEvidence: evidenceIds,
      relatedFacts: [],
      relatedResearch: input.researchGraph.findings.slice(0, 3).map((f) => f.id),
      businessImpact: "Potential reach gap in B2B discovery.",
      customerImpact: "Target buyers may not encounter the brand where competitors are visible.",
      marketImpact: "Competitors may dominate LinkedIn mindshare in this category.",
      confidenceReason: "Company channel posture conflicts with competitor channel evidence.",
      createdAt: input.createdAt,
    });
  }

  return { contradictions, interpretations, escalations };
}
