/**
 * Research Brain — Company update proposals.
 * Research may propose; Company Brain decides canonical truth.
 */

import type { CompanyGraph } from "../company/types";
import type { AudienceInsight, CompanyUpdateProposal, ResearchFinding } from "./brain-types";

let proposalCounter = 0;

export function resetResearchUpdateProposalCounter(): void {
  proposalCounter = 0;
}

export function buildCompanyUpdateProposals(input: {
  companyGraph: CompanyGraph;
  audienceInsights: readonly AudienceInsight[];
  findings: readonly ResearchFinding[];
}): CompanyUpdateProposal[] {
  const proposals: CompanyUpdateProposal[] = [];
  const existingSegments = new Set(
    input.companyGraph.facts
      .filter((f) => f.domain === "audience" || f.domain === "ideal_customers")
      .map((f) => f.value.toLowerCase())
  );

  for (const insight of input.audienceInsights) {
    if (existingSegments.has(insight.segment.toLowerCase())) continue;
    if (insight.evidenceIds.length === 0) {
      proposalCounter += 1;
      proposals.push({
        id: `cup-${proposalCounter}`,
        targetDomain: "audience",
        targetFact: "audience_segment",
        proposedValue: insight.segment,
        reason: "Research hypothesis — no external evidence yet; requires customer confirmation.",
        confidence: "low",
        evidenceIds: [],
        breakingChange: false,
        requiresCustomerConfirmation: true,
      });
      continue;
    }

    proposalCounter += 1;
    proposals.push({
      id: `cup-${proposalCounter}`,
      targetDomain: "audience",
      targetFact: "audience_segment",
      proposedValue: insight.segment,
      reason: "External research suggests adding this audience segment.",
      confidence: insight.confidence,
      evidenceIds: [...insight.evidenceIds],
      breakingChange: false,
      requiresCustomerConfirmation: true,
    });
  }

  const weakUsps = input.findings.filter(
    (f) => f.domain === "positioning" && f.findingType === "contradiction"
  );
  for (const finding of weakUsps.slice(0, 2)) {
    proposalCounter += 1;
    proposals.push({
      id: `cup-${proposalCounter}`,
      targetDomain: "usps",
      targetFact: finding.title,
      proposedValue: "Mark as weakly differentiated",
      reason: finding.summary,
      confidence: finding.confidence,
      evidenceIds: [...finding.evidenceIds],
      breakingChange: false,
      requiresCustomerConfirmation: true,
    });
  }

  return proposals;
}

/** Guard — Research never mutates CompanyGraph. */
export function assertNoCompanyMutation(
  before: CompanyGraph,
  after: CompanyGraph
): boolean {
  return (
    before.organizationId === after.organizationId &&
    before.facts.length === after.facts.length &&
    before.versionMeta.version === after.versionMeta.version
  );
}
