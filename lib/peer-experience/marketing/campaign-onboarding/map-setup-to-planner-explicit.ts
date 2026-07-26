import type { CampaignPlannerExplicitDeliverable } from "@/lib/campaign/planner/types";
import type { MarketingProjectCampaignSetup } from "../projects/types";
import { isCampaignOnboardingComplete } from "./complete-campaign-onboarding";
import {
  CAMPAIGN_SETUP_CHANNEL_CUSTOMER_LABELS,
  CAMPAIGN_SETUP_DELIVERABLE_CUSTOMER_LABELS,
  pairOnboardingDeliverablesToChannels,
} from "./deliverable-channel-compatibility";

export {
  CAMPAIGN_SETUP_CHANNEL_CUSTOMER_LABELS,
  CAMPAIGN_SETUP_DELIVERABLE_CUSTOMER_LABELS,
} from "./deliverable-channel-compatibility";

export function resolveSetupChannelLabels(setup: MarketingProjectCampaignSetup): string[] {
  const channels = setup.selectedChannels ?? [];
  const labels: string[] = [];
  for (const channel of channels) {
    if (channel === "other") {
      for (const custom of setup.customChannelLabels ?? []) {
        if (custom.trim()) labels.push(custom.trim());
      }
      continue;
    }
    if (channel === "decide_later") {
      labels.push(CAMPAIGN_SETUP_CHANNEL_CUSTOMER_LABELS.decide_later);
      continue;
    }
    labels.push(CAMPAIGN_SETUP_CHANNEL_CUSTOMER_LABELS[channel]);
  }
  return labels;
}

export function mapCampaignSetupToPlannerExplicit(
  setup: MarketingProjectCampaignSetup
): {
  readonly deliverables: readonly CampaignPlannerExplicitDeliverable[];
  readonly channels: readonly string[];
  readonly pairingWarnings: readonly string[];
} {
  if (!isCampaignOnboardingComplete(setup)) {
    return { deliverables: [], channels: [], pairingWarnings: [] };
  }

  const deliverableSelections = setup.selectedDeliverables ?? [];
  if (deliverableSelections.includes("decide_later")) {
    return { deliverables: [], channels: [], pairingWarnings: [] };
  }

  const { pairs, pairingWarnings } = pairOnboardingDeliverablesToChannels({
    selectedChannels: setup.selectedChannels ?? [],
    customChannelLabels: setup.customChannelLabels ?? [],
    selectedDeliverables: deliverableSelections,
    customDeliverableLabels: setup.customDeliverableLabels ?? [],
  });

  const channelSet = new Set<string>();
  const deliverables: CampaignPlannerExplicitDeliverable[] = pairs.map((pair) => {
    channelSet.add(pair.channelLabel);
    return {
      channel: pair.channelLabel,
      deliverableType: pair.deliverableType,
      title: pair.title,
    };
  });

  return {
    deliverables: Object.freeze(deliverables),
    channels: Object.freeze([...channelSet]),
    pairingWarnings,
  };
}
