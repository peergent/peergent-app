import type { CampaignSetupChannel, CampaignSetupDeliverable } from "@/lib/peer-experience/marketing/projects/types";
import type { MarketingProject } from "@/lib/peer-experience/marketing/projects/types";
import type { CampaignOnboardingInput } from "@/lib/peer-experience/marketing/campaign-onboarding";
import {
  CAMPAIGN_SETUP_CHANNEL_CUSTOMER_LABELS,
  CAMPAIGN_SETUP_DELIVERABLE_CUSTOMER_LABELS,
} from "@/lib/peer-experience/marketing/campaign-onboarding";

export type CampaignOnboardingFormState = {
  audience: string;
  selectedChannels: CampaignSetupChannel[];
  customChannelLabel: string;
  selectedDeliverables: CampaignSetupDeliverable[];
  customDeliverableLabel: string;
  timingDecision: "dated" | "no_deadline";
  startDate: string;
  endDate: string;
};

export const CAMPAIGN_ONBOARDING_CHANNEL_OPTIONS: readonly CampaignSetupChannel[] = [
  "linkedin",
  "instagram",
  "email",
  "blog",
  "website_landing",
  "meta_ads",
  "google_ads",
  "other",
  "decide_later",
];

export const CAMPAIGN_ONBOARDING_DELIVERABLE_OPTIONS: readonly CampaignSetupDeliverable[] = [
  "social_post",
  "carousel",
  "advertisement",
  "email",
  "blog_article",
  "landing_page",
  "campaign_concept",
  "other",
  "decide_later",
];

export function createCampaignOnboardingFormState(
  project: MarketingProject
): CampaignOnboardingFormState {
  const setup = project.campaignSetup;
  const audience =
    setup?.confirmedAudience?.trim() ||
    setup?.targetAudience?.trim() ||
    "";

  return {
    audience,
    selectedChannels: setup?.selectedChannels ? [...setup.selectedChannels] : [],
    customChannelLabel: setup?.customChannelLabels?.[0]?.trim() ?? "",
    selectedDeliverables: setup?.selectedDeliverables ? [...setup.selectedDeliverables] : [],
    customDeliverableLabel: setup?.customDeliverableLabels?.[0]?.trim() ?? "",
    timingDecision: setup?.timingDecision ?? "no_deadline",
    startDate: setup?.startDate ?? "",
    endDate: setup?.endDate ?? "",
  };
}

export type CampaignOnboardingStepErrors = Partial<Record<string, string>>;

export function validateCampaignOnboardingStep(
  step: 1 | 2 | 3 | 4,
  state: CampaignOnboardingFormState
): CampaignOnboardingStepErrors {
  const errors: CampaignOnboardingStepErrors = {};
  if (step === 1) {
    if (!state.audience.trim()) {
      errors.audience = "Tell us who this campaign should reach.";
    }
  }
  if (step === 2) {
    if (state.selectedChannels.length === 0) {
      errors.channels = "Choose at least one channel or Decide later.";
    }
    if (
      state.selectedChannels.includes("decide_later") &&
      state.selectedChannels.length > 1
    ) {
      errors.channels = "Decide later cannot be combined with other channels.";
    }
    if (state.selectedChannels.includes("other") && !state.customChannelLabel.trim()) {
      errors.customChannelLabel = "Add a short label for Other.";
    }
  }
  if (step === 3) {
    if (state.selectedDeliverables.length === 0) {
      errors.deliverables = "Choose at least one deliverable or Decide later.";
    }
    if (
      state.selectedDeliverables.includes("decide_later") &&
      state.selectedDeliverables.length > 1
    ) {
      errors.deliverables = "Decide later cannot be combined with other deliverables.";
    }
    if (state.selectedChannels.includes("decide_later")) {
      const allowed = state.selectedDeliverables.every(
        (d) => d === "campaign_concept" || d === "other" || d === "decide_later"
      );
      if (!allowed) {
        errors.deliverables =
          "With channels undecided, pick Campaign concept, Other, or Decide later.";
      }
    }
    if (state.selectedDeliverables.includes("other") && !state.customDeliverableLabel.trim()) {
      errors.customDeliverableLabel = "Add a short label for Other.";
    }
  }
  if (step === 4) {
    if (state.timingDecision === "dated") {
      if (!state.startDate.trim() && !state.endDate.trim()) {
        errors.timing = "Add a start or end date, or choose No deadline yet.";
      }
      if (state.startDate && state.endDate) {
        const start = Date.parse(state.startDate);
        const end = Date.parse(state.endDate);
        if (!Number.isNaN(start) && !Number.isNaN(end) && end < start) {
          errors.timing = "End date cannot be before start date.";
        }
      }
    }
  }
  return errors;
}

export function campaignOnboardingStepHasErrors(errors: CampaignOnboardingStepErrors): boolean {
  return Object.keys(errors).length > 0;
}

export function toCampaignOnboardingInput(state: CampaignOnboardingFormState): CampaignOnboardingInput {
  return {
    audience: state.audience.trim(),
    selectedChannels: state.selectedChannels,
    customChannelLabels: state.customChannelLabel.trim()
      ? [state.customChannelLabel.trim()]
      : [],
    selectedDeliverables: state.selectedDeliverables,
    customDeliverableLabels: state.customDeliverableLabel.trim()
      ? [state.customDeliverableLabel.trim()]
      : [],
    timingDecision: state.timingDecision,
    ...(state.timingDecision === "dated"
      ? {
          ...(state.startDate.trim() ? { startDate: state.startDate.trim() } : {}),
          ...(state.endDate.trim() ? { endDate: state.endDate.trim() } : {}),
        }
      : {}),
  };
}

export function channelOptionLabel(channel: CampaignSetupChannel): string {
  if (channel === "other") return "Other";
  return CAMPAIGN_SETUP_CHANNEL_CUSTOMER_LABELS[channel];
}

export function deliverableOptionLabel(deliverable: CampaignSetupDeliverable): string {
  if (deliverable === "other") return "Other";
  return CAMPAIGN_SETUP_DELIVERABLE_CUSTOMER_LABELS[deliverable];
}

export function deliverableOptionsForChannels(
  channels: readonly CampaignSetupChannel[]
): readonly CampaignSetupDeliverable[] {
  if (channels.includes("decide_later")) {
    return ["campaign_concept", "other", "decide_later"];
  }
  return CAMPAIGN_ONBOARDING_DELIVERABLE_OPTIONS;
}

export function summarizeOnboardingState(state: CampaignOnboardingFormState): {
  audience: string;
  channels: string;
  deliverables: string;
  timing: string;
} {
  const channelLabels = state.selectedChannels.map((c) =>
    c === "other" && state.customChannelLabel.trim()
      ? state.customChannelLabel.trim()
      : channelOptionLabel(c)
  );
  const deliverableLabels = state.selectedDeliverables.map((d) =>
    d === "other" && state.customDeliverableLabel.trim()
      ? state.customDeliverableLabel.trim()
      : deliverableOptionLabel(d)
  );
  const timing =
    state.timingDecision === "no_deadline"
      ? "No deadline yet"
      : [state.startDate, state.endDate].filter(Boolean).join(" → ") || "Dates to be confirmed";

  return {
    audience: state.audience.trim(),
    channels: channelLabels.join(", "),
    deliverables: deliverableLabels.join(", "),
    timing,
  };
}
