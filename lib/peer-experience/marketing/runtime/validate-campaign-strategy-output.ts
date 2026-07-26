import type { CampaignStrategyWorkUnitOutput } from "./types";

export type CampaignStrategyValidationResult =
  | { valid: true }
  | { valid: false; errors: readonly string[] };

export function validateCampaignStrategyWorkUnitOutput(
  output: CampaignStrategyWorkUnitOutput
): CampaignStrategyValidationResult {
  const errors: string[] = [];

  if (!output.title?.trim()) {
    errors.push("Strategy title is required.");
  }
  if (!output.summary?.trim()) {
    errors.push("Strategy summary is required.");
  }
  if (!output.positioning?.trim()) {
    errors.push("Strategy positioning is required.");
  }
  if (!output.messagingPillars.length) {
    errors.push("At least one messaging pillar is required.");
  }
  if (!output.recommendedChannels.length) {
    errors.push("At least one recommended channel is required.");
  }
  if (!output.ctaGuidance?.trim()) {
    errors.push("CTA guidance is required.");
  }

  if (errors.length) {
    return { valid: false, errors };
  }
  return { valid: true };
}
