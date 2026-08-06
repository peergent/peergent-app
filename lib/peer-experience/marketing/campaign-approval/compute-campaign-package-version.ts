import type { BrainStructuredOutput } from "@/lib/brain/evidence/structured-output";
import { readCampaignBrainOutputs } from "@/lib/office/campaign/campaign-brain-outputs";
import type { BrainCapabilityId } from "@/lib/brain/capabilities/registry";
import type { MarketingProject } from "../projects/types";
import type { CampaignPackageVersion } from "./campaign-approval-types";

const BRAIN_CAPABILITIES = [
  "strategy",
  "channel_planning",
  "creative_generation",
] as const satisfies readonly Extract<
  BrainCapabilityId,
  "strategy" | "channel_planning" | "creative_generation"
>[];

function brainOutputFingerprint(
  outputs: Partial<Record<(typeof BRAIN_CAPABILITIES)[number], BrainStructuredOutput>>
): string {
  return BRAIN_CAPABILITIES.map((capabilityId) => {
    const output = outputs[capabilityId];
    if (!output) return `${capabilityId}:none`;
    return `${capabilityId}:${output.capabilityVersion}:${output.generatedAt}`;
  }).join("|");
}

/** Briefing version tracks the brain outputs that produced the executive briefing. */
export function computeBriefingVersionFromBrainOutputs(
  outputs: Partial<Record<(typeof BRAIN_CAPABILITIES)[number], BrainStructuredOutput>>
): string {
  return [
    outputs.strategy?.generatedAt ?? "none",
    outputs.channel_planning?.generatedAt ?? "none",
    outputs.creative_generation?.generatedAt ?? "none",
  ].join("|");
}

/** Fingerprint of the generated campaign package for version-locked approval. */
export function computeCampaignPackageVersion(input: {
  project: MarketingProject;
}): CampaignPackageVersion {
  const campaignContextVersion = input.project.campaignSetup?.campaignContextVersion ?? 0;
  const brainOutputs = readCampaignBrainOutputs(input.project);
  const brainOutputVersion = brainOutputFingerprint(brainOutputs);
  const briefingVersion = computeBriefingVersionFromBrainOutputs(brainOutputs);
  const campaignPackageVersion = `${campaignContextVersion}::${brainOutputVersion}::${briefingVersion}`;

  return {
    campaignContextVersion,
    brainOutputVersion,
    briefingVersion,
    campaignPackageVersion,
  };
}
