import type { BrainCapabilityId } from "@/lib/brain/capabilities/registry";
import { getBrainCapability } from "@/lib/brain/capabilities/registry";
import type { BrainStructuredOutput } from "@/lib/brain/evidence/structured-output";
import type {
  CampaignBrainOutputs,
  MarketingProject,
  MarketingProjectCampaignSetup,
} from "@/lib/peer-experience/marketing/projects/types";

const PERSISTED_CAPABILITIES = ["strategy", "channel_planning", "creative_generation"] as const;
export type PersistedCampaignBrainCapabilityId = (typeof PERSISTED_CAPABILITIES)[number];

export function readCampaignBrainOutputs(
  project: MarketingProject
): Partial<Record<BrainCapabilityId, BrainStructuredOutput>> {
  const stored = project.campaignSetup?.campaignBrainOutputs;
  if (!stored) return {};

  const contextVersion = project.campaignSetup?.campaignContextVersion ?? 0;
  if (stored.contextVersion !== contextVersion) return {};

  const seeded: Partial<Record<BrainCapabilityId, BrainStructuredOutput>> = {};
  for (const capabilityId of PERSISTED_CAPABILITIES) {
    const output = stored[capabilityId];
    if (output && isStoredOutputCompatible(capabilityId, output)) {
      seeded[capabilityId] = output;
    }
  }
  return seeded;
}

export function isStoredOutputCompatible(
  capabilityId: PersistedCampaignBrainCapabilityId,
  output: BrainStructuredOutput
): boolean {
  return output.capabilityVersion === getBrainCapability(capabilityId).version;
}

export function mergeCampaignBrainOutputs(
  existing: CampaignBrainOutputs | undefined,
  patch: Partial<Record<PersistedCampaignBrainCapabilityId, BrainStructuredOutput>>,
  contextVersion: number
): CampaignBrainOutputs {
  const next: CampaignBrainOutputs = {
    contextVersion,
    ...existing,
  };

  for (const capabilityId of PERSISTED_CAPABILITIES) {
    const output = patch[capabilityId];
    if (output) {
      next[capabilityId] = output;
    }
  }

  return next;
}

export function buildCampaignBrainOutputsPatch(
  setup: MarketingProjectCampaignSetup,
  patch: Partial<Record<PersistedCampaignBrainCapabilityId, BrainStructuredOutput>>
): Pick<MarketingProjectCampaignSetup, "campaignBrainOutputs"> {
  const contextVersion = setup.campaignContextVersion ?? 0;
  return {
    campaignBrainOutputs: mergeCampaignBrainOutputs(setup.campaignBrainOutputs, patch, contextVersion),
  };
}

export function clearCampaignBrainOutputsOnInvalidation(): Pick<
  MarketingProjectCampaignSetup,
  "campaignBrainOutputs"
> {
  return { campaignBrainOutputs: undefined };
}
