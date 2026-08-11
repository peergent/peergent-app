import type { MarketingIntelligenceBrainGraph } from "../marketing-intelligence/brain-types";
import type { MessagingStrategyDirection, StrategyConfidence } from "./brain-types";
import { enforceStrategyConfidenceCeiling } from "./strategy-confidence";

export function buildMessagingStrategyDirection(input: {
  miGraph: MarketingIntelligenceBrainGraph;
  positioningAngle: string;
  upstreamConfidence: StrategyConfidence;
}): MessagingStrategyDirection {
  const messaging = input.miGraph.messagingIntelligence;

  return {
    primaryMessageTerritory: input.positioningAngle || messaging.underusedMessages[0] || "Outcome certainty",
    secondaryMessageTerritories: messaging.underusedMessages.slice(1, 4),
    proofThemes: messaging.proofRequirements.slice(0, 5),
    objectionThemes: messaging.objectionThemes.slice(0, 5),
    emotionalDirection: messaging.emotionalDrivers[0] ?? "Confidence and relief from uncertainty",
    rationalDirection: messaging.rationalDrivers[0] ?? "Measurable business outcomes",
    messagesToAvoid: messaging.messageRisks.slice(0, 5),
    saturatedClaimsToAvoid: messaging.saturatedClaims.slice(0, 5),
    confidence: enforceStrategyConfidenceCeiling(messaging.confidence, [input.upstreamConfidence]),
  };
}
