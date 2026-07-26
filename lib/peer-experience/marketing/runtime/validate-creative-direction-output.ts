import type { CreativeBrief } from "@/lib/creative-brief";

export type CreativeDirectionWorkUnitOutput = {
  readonly campaignConcept: string;
  readonly campaignAngle: string;
  readonly tone: string;
  readonly visualDirection: string;
  readonly messagingHierarchy: readonly string[];
  readonly ctaGuidance: string;
  readonly brandConstraints: readonly string[];
  readonly creativeRecommendations: readonly string[];
};

export function mapCreativeBriefToWorkUnitOutput(brief: CreativeBrief): CreativeDirectionWorkUnitOutput {
  return {
    campaignConcept: brief.campaignGoal.summary,
    campaignAngle: brief.campaignGoal.successMetric ?? brief.campaignGoal.summary,
    tone: brief.tone.directive,
    visualDirection: brief.visualPriorities.summary,
    messagingHierarchy: brief.messagingPriorities.rankOrder?.length
      ? [...brief.messagingPriorities.rankOrder]
      : [
          brief.messagingPriorities.primaryMessage,
          ...(brief.messagingPriorities.supportingMessages ?? []),
        ],
    ctaGuidance: brief.cta.primary,
    brandConstraints: [
      ...brief.forbiddenClaims.map((c) => `Avoid claim: ${c}`),
      ...brief.forbiddenWords.map((w) => `Avoid word: ${w}`),
      ...brief.requiredDisclaimers.map((d) => d.text),
    ],
    creativeRecommendations: brief.outputRequirements.variants?.length
      ? [...brief.outputRequirements.variants]
      : [brief.outputRequirements.deliverableSummary],
  };
}

export function validateCreativeDirectionWorkUnitOutput(brief: CreativeBrief): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  if (!brief.campaignGoal.summary?.trim()) {
    errors.push("Campaign concept is required.");
  }
  if (!brief.tone.directive?.trim()) {
    errors.push("Tone of voice is required.");
  }
  if (!brief.messagingPriorities.primaryMessage?.trim()) {
    errors.push("Messaging hierarchy is required.");
  }
  if (!brief.visualPriorities.summary?.trim()) {
    errors.push("Visual direction is required.");
  }
  if (!brief.cta.primary?.trim()) {
    errors.push("CTA guidance is required.");
  }
  return { valid: errors.length === 0, errors };
}
