import type {
  CampaignSetupChannel,
  CampaignSetupDeliverable,
  MarketingProject,
  MarketingProjectCampaignSetup,
} from "../projects/types";

export type CampaignOnboardingInput = {
  readonly audience: string;
  readonly selectedChannels: readonly CampaignSetupChannel[];
  readonly customChannelLabels: readonly string[];
  readonly selectedDeliverables: readonly CampaignSetupDeliverable[];
  readonly customDeliverableLabels: readonly string[];
  readonly timingDecision: "dated" | "no_deadline";
  readonly startDate?: string;
  readonly endDate?: string;
};

export type CampaignOnboardingResult =
  | { readonly ok: true; readonly projectId: string; readonly completedAt: string }
  | {
      readonly ok: false;
      readonly projectId: string;
      readonly code:
        | "WORKSPACE_UNAVAILABLE"
        | "PROJECT_NOT_FOUND"
        | "NOT_CAMPAIGN_WIZARD"
        | "ALREADY_COMPLETED"
        | "INVALID_INPUT";
      readonly message: string;
    };

export class CampaignOnboardingValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CampaignOnboardingValidationError";
  }
}

export function resolveCampaignSetupAudience(
  setup: MarketingProjectCampaignSetup | undefined
): string | undefined {
  const confirmed = setup?.confirmedAudience?.trim();
  if (confirmed) return confirmed;
  return setup?.targetAudience?.trim() || undefined;
}

export function isCampaignOnboardingComplete(
  setup: MarketingProjectCampaignSetup | undefined
): boolean {
  return Boolean(setup?.onboardingCompletedAt?.trim());
}

export function validateCampaignOnboardingInput(input: CampaignOnboardingInput): void {
  if (!input.audience.trim()) {
    throw new CampaignOnboardingValidationError("Audience is required.");
  }

  const channels = [...input.selectedChannels];
  if (channels.length === 0) {
    throw new CampaignOnboardingValidationError("Select at least one channel or Decide later.");
  }
  const hasDecideLaterChannel = channels.includes("decide_later");
  if (hasDecideLaterChannel && channels.length > 1) {
    throw new CampaignOnboardingValidationError(
      "Decide later cannot be combined with specific channels."
    );
  }
  if (channels.includes("other") && input.customChannelLabels.every((l) => !l.trim())) {
    throw new CampaignOnboardingValidationError("Add a label for Other channel.");
  }

  const deliverables = [...input.selectedDeliverables];
  if (deliverables.length === 0) {
    throw new CampaignOnboardingValidationError(
      "Select at least one deliverable or Decide later."
    );
  }
  const hasDecideLaterDeliverable = deliverables.includes("decide_later");
  if (hasDecideLaterDeliverable && deliverables.length > 1) {
    throw new CampaignOnboardingValidationError(
      "Decide later cannot be combined with specific deliverables."
    );
  }
  if (hasDecideLaterChannel) {
    const allowed = deliverables.every(
      (d) => d === "campaign_concept" || d === "other" || d === "decide_later"
    );
    if (!allowed) {
      throw new CampaignOnboardingValidationError(
        "When channels are undecided, choose Campaign concept, Other, or Decide later."
      );
    }
  }
  if (deliverables.includes("other") && input.customDeliverableLabels.every((l) => !l.trim())) {
    throw new CampaignOnboardingValidationError("Add a label for Other deliverable.");
  }

  if (input.timingDecision === "dated") {
    if (!input.startDate?.trim() && !input.endDate?.trim()) {
      throw new CampaignOnboardingValidationError("Add a start or end date, or choose No deadline yet.");
    }
    if (input.startDate && input.endDate) {
      const start = Date.parse(input.startDate);
      const end = Date.parse(input.endDate);
      if (!Number.isNaN(start) && !Number.isNaN(end) && end < start) {
        throw new CampaignOnboardingValidationError("End date cannot be before start date.");
      }
    }
  }
}

export function applyCampaignOnboardingToProject(
  project: MarketingProject,
  input: CampaignOnboardingInput,
  completedAt: string
): MarketingProject {
  validateCampaignOnboardingInput(input);
  const audience = input.audience.trim();
  const existingSetup = project.campaignSetup;
  if (!existingSetup) {
    throw new CampaignOnboardingValidationError("Campaign setup is missing on this project.");
  }

  const setupBase: MarketingProjectCampaignSetup = {
    ...existingSetup,
    targetAudience: audience,
    confirmedAudience: audience,
    selectedChannels: [...input.selectedChannels],
    customChannelLabels: input.customChannelLabels.map((l) => l.trim()).filter(Boolean),
    selectedDeliverables: [...input.selectedDeliverables],
    customDeliverableLabels: input.customDeliverableLabels.map((l) => l.trim()).filter(Boolean),
    timingDecision: input.timingDecision,
    onboardingCompletedAt: completedAt,
  };

  let setup: MarketingProjectCampaignSetup;
  if (input.timingDecision === "dated") {
    setup = {
      ...setupBase,
      ...(input.startDate?.trim() ? { startDate: input.startDate.trim() } : {}),
      ...(input.endDate?.trim() ? { endDate: input.endDate.trim() } : {}),
    };
  } else {
    const { startDate: _start, endDate: _end, ...withoutDates } = setupBase;
    setup = withoutDates;
  }

  return {
    ...project,
    updatedAt: completedAt,
    campaignSetup: setup,
  };
}
