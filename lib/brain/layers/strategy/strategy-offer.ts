import type { MarketingIntelligenceBrainGraph } from "../marketing-intelligence/brain-types";
import type { OfferStrategyDirection, StrategyConfidence } from "./brain-types";
import { enforceStrategyConfidenceCeiling } from "./strategy-confidence";

export function buildOfferStrategyDirection(input: {
  miGraph: MarketingIntelligenceBrainGraph;
  upstreamConfidence: StrategyConfidence;
}): OfferStrategyDirection {
  const offer = input.miGraph.offerIntelligence;
  const direction =
    offer.proof === "high"
      ? "Lead with proof"
      : offer.entryOffer
        ? `Lead with ${offer.entryOffer}`
        : offer.primaryConversionAction
          ? `Lead with ${offer.primaryConversionAction}`
          : "Lead with consultation";

  return {
    offerDirection: direction,
    why:
      offer.strengths[0] ??
      "Offer presentation aligned with upstream offer intelligence and trust requirements.",
    proofNeeded: offer.proof === "high" ? offer.strengths : ["Case studies", "Customer outcomes"],
    riskReversalNeeded: offer.riskReversal === "high" ? ["Guarantee or trial framing"] : [],
    urgencyApproach: offer.urgency === "high" ? "Outcome-driven urgency" : "Avoid artificial scarcity",
    ctaType: offer.primaryConversionAction ?? "Book consultation",
    confidence: enforceStrategyConfidenceCeiling(offer.confidence, [input.upstreamConfidence]),
  };
}
