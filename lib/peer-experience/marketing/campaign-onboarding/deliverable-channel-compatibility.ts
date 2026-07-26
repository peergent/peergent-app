import type { CampaignSetupChannel, CampaignSetupDeliverable } from "../projects/types";

/** Campaign-level channel label for deliverables not tied to a specific channel. */
export const CAMPAIGN_LEVEL_CHANNEL_LABEL = "Campaign";

export const CAMPAIGN_SETUP_CHANNEL_CUSTOMER_LABELS: Record<
  Exclude<CampaignSetupChannel, "other">,
  string
> = {
  linkedin: "LinkedIn",
  instagram: "Instagram",
  email: "Email",
  blog: "Blog",
  website_landing: "Website / landing page",
  meta_ads: "Meta Ads",
  google_ads: "Google Ads",
  decide_later: "Decide later",
};

export const CAMPAIGN_SETUP_DELIVERABLE_CUSTOMER_LABELS: Record<
  Exclude<CampaignSetupDeliverable, "other">,
  string
> = {
  social_post: "Social post",
  carousel: "Carousel",
  advertisement: "Advertisement",
  email: "Email",
  blog_article: "Blog article",
  landing_page: "Landing page",
  campaign_concept: "Campaign concept",
  decide_later: "Decide later",
};

export const DELIVERABLE_COMPATIBLE_SETUP_CHANNELS: Record<
  Exclude<CampaignSetupDeliverable, "other" | "decide_later">,
  readonly CampaignSetupChannel[]
> = {
  social_post: ["linkedin", "instagram"],
  carousel: ["linkedin", "instagram"],
  advertisement: ["meta_ads", "google_ads", "linkedin"],
  email: ["email"],
  blog_article: ["blog", "website_landing"],
  landing_page: ["website_landing"],
  campaign_concept: [],
};

const CAMPAIGN_LEVEL_ONLY = new Set<CampaignSetupDeliverable>(["campaign_concept"]);

export function setupChannelToPlannerLabel(
  channel: CampaignSetupChannel,
  customChannelLabels: readonly string[]
): string | null {
  if (channel === "decide_later") return null;
  if (channel === "other") {
    const label = customChannelLabels.find((l) => l.trim())?.trim();
    return label ?? null;
  }
  return CAMPAIGN_SETUP_CHANNEL_CUSTOMER_LABELS[channel];
}

export function selectedPlannerChannelLabels(input: {
  selectedChannels: readonly CampaignSetupChannel[];
  customChannelLabels: readonly string[];
}): { labels: string[]; channelKeys: CampaignSetupChannel[] } {
  const labels: string[] = [];
  const channelKeys: CampaignSetupChannel[] = [];

  for (const channel of input.selectedChannels) {
    if (channel === "decide_later") continue;
    const label = setupChannelToPlannerLabel(channel, input.customChannelLabels);
    if (!label) continue;
    labels.push(label);
    channelKeys.push(channel);
  }

  return { labels, channelKeys };
}

export function isDeliverableCompatibleWithChannel(
  deliverable: Exclude<CampaignSetupDeliverable, "other" | "decide_later">,
  channel: CampaignSetupChannel
): boolean {
  if (CAMPAIGN_LEVEL_ONLY.has(deliverable)) return false;
  return DELIVERABLE_COMPATIBLE_SETUP_CHANNELS[deliverable].includes(channel);
}

export type ResolvedSetupDeliverablePair = {
  readonly channelLabel: string;
  readonly deliverableType: string;
  readonly title: string;
};

export type PairDeliverablesResult = {
  readonly pairs: readonly ResolvedSetupDeliverablePair[];
  readonly pairingWarnings: readonly string[];
};

const DELIVERABLE_PLANNER_TYPE: Record<
  Exclude<CampaignSetupDeliverable, "other" | "decide_later">,
  string
> = {
  social_post: "social_post",
  carousel: "carousel",
  advertisement: "advertisement",
  email: "email",
  blog_article: "blog_article",
  landing_page: "landing_page",
  campaign_concept: "campaign_concept",
};

export function pairOnboardingDeliverablesToChannels(input: {
  selectedChannels: readonly CampaignSetupChannel[];
  customChannelLabels: readonly string[];
  selectedDeliverables: readonly CampaignSetupDeliverable[];
  customDeliverableLabels: readonly string[];
}): PairDeliverablesResult {
  const pairs: ResolvedSetupDeliverablePair[] = [];
  const warnings: string[] = [];
  const seen = new Set<string>();

  const addPair = (channelLabel: string, deliverableType: string, title: string) => {
    const key = `${channelLabel}|${deliverableType}|${title}`;
    if (seen.has(key)) return;
    seen.add(key);
    pairs.push({ channelLabel, deliverableType, title });
  };

  const { labels: channelLabels, channelKeys } = selectedPlannerChannelLabels(input);
  const hasDecideLaterChannels = input.selectedChannels.includes("decide_later");

  for (const deliverable of input.selectedDeliverables) {
    if (deliverable === "decide_later") continue;

    if (deliverable === "other") {
      const customDeliverable = input.customDeliverableLabels.find((l) => l.trim())?.trim();
      if (!customDeliverable) continue;

      if (hasDecideLaterChannels || channelLabels.length === 0) {
        addPair(CAMPAIGN_LEVEL_CHANNEL_LABEL, "custom", customDeliverable);
        continue;
      }

      let paired = false;
      for (let i = 0; i < channelKeys.length; i++) {
        const channelKey = channelKeys[i]!;
        const channelLabel = channelLabels[i]!;
        addPair(channelLabel, "custom", `${customDeliverable} — ${channelLabel}`);
        paired = true;
      }
      if (!paired) {
        addPair(CAMPAIGN_LEVEL_CHANNEL_LABEL, "custom", customDeliverable);
      }
      continue;
    }

    if (deliverable === "campaign_concept") {
      addPair(
        CAMPAIGN_LEVEL_CHANNEL_LABEL,
        DELIVERABLE_PLANNER_TYPE.campaign_concept,
        CAMPAIGN_SETUP_DELIVERABLE_CUSTOMER_LABELS.campaign_concept
      );
      continue;
    }

    const deliverableLabel = CAMPAIGN_SETUP_DELIVERABLE_CUSTOMER_LABELS[deliverable];
    const plannerType = DELIVERABLE_PLANNER_TYPE[deliverable];

    if (hasDecideLaterChannels || channelLabels.length === 0) {
      warnings.push(
        `${deliverableLabel} needs a channel choice before it can be scheduled — pick channels in setup when you are ready.`
      );
      continue;
    }

    let matchedAny = false;
    for (let i = 0; i < channelKeys.length; i++) {
      const channelKey = channelKeys[i]!;
      const channelLabel = channelLabels[i]!;
      if (!isDeliverableCompatibleWithChannel(deliverable, channelKey)) {
        warnings.push(
          `${deliverableLabel} is not planned for ${channelLabel} — choose a matching channel or deliverable in setup.`
        );
        continue;
      }
      matchedAny = true;
      addPair(
        channelLabel,
        plannerType,
        `${deliverableLabel} — ${channelLabel}`
      );
    }

    if (!matchedAny && channelKeys.length > 0) {
      warnings.push(
        `${deliverableLabel} could not be matched to your selected channels — adjust setup to continue.`
      );
    }
  }

  return {
    pairs: Object.freeze(pairs),
    pairingWarnings: Object.freeze([...new Set(warnings)]),
  };
}
