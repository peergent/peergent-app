/**
 * Marketing Intelligence — offer domain.
 */

import type { CompanyGraph } from "../company/types";
import type { ResearchBrainGraph } from "../research/brain-types";
import type { MarketingEvidenceRef, OfferIntelligence } from "./brain-types";
import { enforceMarketingConfidenceCeiling } from "./marketing-intelligence-confidence";

export function buildOfferIntelligence(input: {
  companyGraph: CompanyGraph;
  researchGraph: ResearchBrainGraph;
  evidence: readonly MarketingEvidenceRef[];
}): OfferIntelligence {
  const productFacts = input.companyGraph.facts.filter(
    (f) => f.domain === "products" || f.domain === "services" || f.domain === "usps"
  );
  const uspFacts = input.companyGraph.facts.filter((f) => f.domain === "usps");
  const evidenceIds = input.evidence
    .filter((e) => /product|service|offer|usp|pricing/i.test(e.summary))
    .map((e) => e.id);

  const hasPricing = input.evidence.some((e) => /pric/i.test(e.summary));
  const confidence = enforceMarketingConfidenceCeiling(
    productFacts.length >= 2 ? "medium" : "low",
    evidenceIds.length
  );

  const weaknesses: string[] = [];
  if (!hasPricing) weaknesses.push("Pricing transparency unclear in available evidence");
  if (uspFacts.some((u) => u.confidence === "low")) {
    weaknesses.push("USP differentiation weakly evidenced");
  }

  return {
    clarity: productFacts.length > 0 ? "medium" : "low",
    differentiation: uspFacts.length > 0 ? "medium" : "low",
    proof: uspFacts.some((u) => u.customerConfirmed) ? "medium" : "low",
    riskReversal: "low",
    urgency: "low",
    pricingTransparency: hasPricing ? "medium" : "low",
    valueCommunication: productFacts.length > 0 ? "medium" : "low",
    entryOffer: productFacts[0]?.value ?? null,
    primaryConversionAction: null,
    strengths: productFacts.map((f) => f.value).slice(0, 3),
    weaknesses,
    opportunities: input.researchGraph.opportunities.map((o) => o.description).slice(0, 2),
    risks: weaknesses,
    confidence,
    evidenceIds,
  };
}
