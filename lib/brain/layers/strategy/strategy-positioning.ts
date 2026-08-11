import type { MarketingIntelligenceBrainGraph } from "../marketing-intelligence/brain-types";
import type { ReasoningBrainGraph } from "../reasoning/brain-types";
import type { PositioningStrategy, RejectedAlternative, StrategyConfidence } from "./brain-types";
import { enforceStrategyConfidenceCeiling } from "./strategy-confidence";

export function buildPositioningStrategy(input: {
  miGraph: MarketingIntelligenceBrainGraph;
  reasoningGraph: ReasoningBrainGraph;
  upstreamConfidence: StrategyConfidence;
}): { positioning: PositioningStrategy; rejectedAlternatives: RejectedAlternative[] } {
  const competitive = input.miGraph.competitiveMarketing[0];
  const messaging = input.miGraph.messagingIntelligence;
  const interpretation = input.reasoningGraph.interpretations[0];

  const saturated = messaging.saturatedClaims ?? [];
  const strategicAngle =
    competitive?.visibleWhitespace?.[0] ??
    messaging.messageDifferentiation?.[0] ??
    messaging.underusedMessages?.[0] ??
    interpretation?.title ??
    "Expertise and certainty over price competition";

  const rejectedAngles: string[] = [];
  const rejectedAlternatives: RejectedAlternative[] = [];

  if (saturated.some((c) => /price|discount|cheap/i.test(c))) {
    rejectedAngles.push("Price-led positioning");
    rejectedAlternatives.push({
      id: "rej-pos-price",
      alternative: "Discount-led positioning",
      reason: "Conflicts with premium brand signals and saturated competitor messaging.",
      evidenceIds: ["mi-messaging"],
      confidence: enforceStrategyConfidenceCeiling("medium", [input.upstreamConfidence]),
    });
  }

  const positioning: PositioningStrategy = {
    positioningStatement: `Compete on ${strategicAngle.toLowerCase()} rather than commodity comparison.`,
    strategicAngle,
    whyThisAngle:
      competitive?.visibleWhitespace?.[0]
        ? "Competitive whitespace identified in upstream marketing intelligence."
        : "Upstream intelligence indicates differentiation opportunity away from saturated claims.",
    proofRequirements: messaging.proofRequirements?.slice(0, 4) ?? ["Customer outcomes", "Expertise signals"],
    differentiation: messaging.messageDifferentiation?.slice(0, 4) ?? [],
    risks: ["Market may require longer education cycles", "Proof burden increases with premium positioning"],
    rejectedAngles,
    confidence: enforceStrategyConfidenceCeiling(messaging.confidence ?? "medium", [input.upstreamConfidence]),
    evidenceIds: ["mi-messaging", "mi-competitive"],
  };

  return { positioning, rejectedAlternatives };
}
