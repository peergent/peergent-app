import type { CampaignApprovalMode } from "@/lib/campaign";
import type {
  CampaignSetupChannel,
  CampaignSetupDeliverable,
} from "@/lib/peer-experience/marketing/projects/types";

/** Wizard-only options aligned with Campaign domain approval modes. */
export type CreateCampaignApprovalMode = CampaignApprovalMode;

export type CreateCampaignSetupMode = "automatic" | "manual";

export type CreateCampaignPrimaryGoalId =
  | "generate_leads"
  | "brand_awareness"
  | "product_launch"
  | "promote_offer"
  | "recruit"
  | "customer_retention"
  | "upsell"
  | "custom";

export const CREATE_CAMPAIGN_PRIMARY_GOALS: readonly {
  id: CreateCampaignPrimaryGoalId;
  label: string;
}[] = [
  { id: "brand_awareness", label: "Build brand awareness" },
  { id: "generate_leads", label: "Generate leads" },
  { id: "product_launch", label: "Launch a product or service" },
  { id: "customer_retention", label: "Retain customers" },
  { id: "upsell", label: "Upsell" },
  { id: "promote_offer", label: "Promote an offer" },
  { id: "recruit", label: "Recruit people" },
  { id: "custom", label: "Custom goal" },
] as const;

export const CREATE_CAMPAIGN_CHANNELS: readonly {
  id: CampaignSetupChannel;
  label: string;
}[] = [
  { id: "linkedin", label: "LinkedIn" },
  { id: "instagram", label: "Instagram" },
  { id: "google_ads", label: "Google Ads" },
  { id: "email", label: "Email" },
  { id: "website_landing", label: "Landing page" },
  { id: "blog", label: "Blog" },
] as const;

export const CREATE_CAMPAIGN_DELIVERABLES: readonly {
  id: CampaignSetupDeliverable;
  label: string;
  tooltip?: string;
}[] = [
  { id: "social_post", label: "Social post", tooltip: "Een enkele post voor social media." },
  {
    id: "carousel",
    label: "Carousel",
    tooltip:
      "Een social post met meerdere afbeeldingen of slides waar iemand doorheen kan bladeren.",
  },
  {
    id: "advertisement",
    label: "Advertentie",
    tooltip: "Een betaalde advertentie voor een gekozen platform, bijvoorbeeld Google Ads.",
  },
  {
    id: "email",
    label: "Acquisitie-e-mail",
    tooltip: "Een gerichte e-mail om potentiële klanten te benaderen.",
  },
  { id: "blog_article", label: "Blogartikel" },
  {
    id: "landing_page",
    label: "Landingspagina",
    tooltip:
      "Een aparte webpagina gericht op één actie, bijvoorbeeld een demo-aanvraag of offerte.",
  },
  {
    id: "campaign_concept",
    label: "Campagneconcept",
    tooltip:
      "Het centrale creatieve idee, de boodschap en stijl die alle campagneonderdelen verbindt.",
  },
];

export type CreateCampaignExecutionMode = "manual" | "semi_automatic" | "fully_automatic";

export type CreateCampaignPriority = "low" | "medium" | "high";

export type CreateCampaignFormValues = {
  setupMode: CreateCampaignSetupMode;
  name: string;
  primaryGoalId: CreateCampaignPrimaryGoalId;
  selectedGoalIds: CreateCampaignPrimaryGoalId[];
  customGoalText: string;
  description: string;
  targetAudience: string;
  intentNotes: string;
  startDate: string;
  endDate: string;
  budgetAmount: string;
  budgetCurrency: string;
  priority: CreateCampaignPriority;
  executionMode: CreateCampaignExecutionMode;
  approvalMode: CreateCampaignApprovalMode;
  selectedChannels: CampaignSetupChannel[];
  selectedDeliverables: CampaignSetupDeliverable[];
  durationPreset: CampaignDurationPreset;
};

export type CreateCampaignFieldErrors = Partial<
  Record<
    | "name"
    | "primaryGoalId"
    | "selectedGoalIds"
    | "customGoalText"
    | "description"
    | "startDate"
    | "endDate"
    | "budgetAmount"
    | "budgetCurrency",
    string
  >
>;

export function createEmptyCreateCampaignForm(
  setupMode: CreateCampaignSetupMode = "automatic"
): CreateCampaignFormValues {
  return {
    setupMode,
    name: "",
    primaryGoalId: "generate_leads",
    selectedGoalIds: ["generate_leads"],
    customGoalText: "",
    description: "",
    targetAudience: "",
    intentNotes: "",
    startDate: "",
    endDate: "",
    budgetAmount: "",
    budgetCurrency: "EUR",
    priority: "medium",
    executionMode: setupMode === "automatic" ? "semi_automatic" : "manual",
    approvalMode: "approval_before_publication",
    selectedChannels: [],
    selectedDeliverables: [],
    durationPreset: "1_month",
  };
}

export function approvalModeForExecutionMode(
  mode: CreateCampaignExecutionMode
): CreateCampaignApprovalMode {
  switch (mode) {
    case "manual":
      return "approval_before_generation";
    case "fully_automatic":
      return "no_approval_required";
    case "semi_automatic":
    default:
      return "approval_before_publication";
  }
}

export function validateCreateCampaignForm(
  values: CreateCampaignFormValues
): CreateCampaignFieldErrors {
  const errors: CreateCampaignFieldErrors = {};
  const name = values.name.trim();
  const description = values.description.trim();
  const isAutomatic = values.setupMode === "automatic";

  if (!name) {
    errors.name = "Enter a campaign name.";
  }

  if (!description) {
    if (isAutomatic) {
      errors.description = "Describe what you want to achieve.";
    }
  }

  if (isAutomatic) {
    if (values.endDate && values.startDate) {
      const start = Date.parse(values.startDate);
      const end = Date.parse(values.endDate);
      if (!Number.isNaN(start) && !Number.isNaN(end) && end < start) {
        errors.endDate = "End date cannot be before the start date.";
      }
    }
    return errors;
  }

  // Manual wizard: goals required; description optional
  if (values.selectedGoalIds.length === 0) {
    errors.selectedGoalIds = "Choose at least one goal.";
  }

  if (values.selectedGoalIds.includes("custom") && !values.customGoalText.trim()) {
    errors.customGoalText = "Describe your custom goal.";
  }

  if (values.startDate && values.endDate) {
    const start = Date.parse(values.startDate);
    const end = Date.parse(values.endDate);
    if (!Number.isNaN(start) && !Number.isNaN(end) && end < start) {
      errors.endDate = "End date cannot be before the start date.";
    }
  }

  if (values.budgetAmount.trim()) {
    const amount = Number(values.budgetAmount);
    if (Number.isNaN(amount) || amount < 0) {
      errors.budgetAmount = "Budget cannot be negative.";
    }
  }

  return errors;
}

export function resolvePrimaryGoalLabel(values: CreateCampaignFormValues): string {
  if (values.setupMode === "automatic") {
    return values.description.trim();
  }

  const labels = values.selectedGoalIds
    .map((id) => {
      if (id === "custom") return values.customGoalText.trim();
      return CREATE_CAMPAIGN_PRIMARY_GOALS.find((g) => g.id === id)?.label ?? "";
    })
    .filter(Boolean);

  return labels.join(", ");
}

export function createCampaignFormHasErrors(errors: CreateCampaignFieldErrors): boolean {
  return Object.keys(errors).length > 0;
}

import type { CreateMarketingCampaignProjectInput } from "@/lib/peer-experience/marketing/projects/project-engine";
import type { CampaignDurationPreset } from "@/lib/office/campaign/campaign-duration";
import {
  buildDurationAtCreation,
  computeEndDateFromPreset,
  durationDaysForPreset,
} from "@/lib/office/campaign/campaign-duration";

export function toCreateMarketingCampaignProjectInput(
  peerId: string,
  ownerLabel: string,
  values: CreateCampaignFormValues
): CreateMarketingCampaignProjectInput {
  const goalLabel = resolvePrimaryGoalLabel(values);
  const budgetRaw = values.budgetAmount.trim();
  const budgetAmount =
    budgetRaw.length > 0 && !Number.isNaN(Number(budgetRaw)) ? Number(budgetRaw) : undefined;

  const primaryGoalId =
    values.setupMode === "automatic"
      ? "custom"
      : values.selectedGoalIds[0] ?? values.primaryGoalId;

  const descriptionParts = [values.description.trim()];
  if (values.intentNotes.trim()) descriptionParts.push(values.intentNotes.trim());
  if (values.targetAudience.trim() && values.setupMode === "manual") {
    descriptionParts.push(`Audience: ${values.targetAudience.trim()}`);
  }
  let description = descriptionParts.filter(Boolean).join("\n\n");
  if (!description && values.setupMode === "manual") {
    description = goalLabel;
  }

  const duration = values.startDate
    ? {
        preset: values.durationPreset,
        startDate: values.startDate,
        endDate:
          values.durationPreset === "ongoing"
            ? null
            : values.endDate ||
              computeEndDateFromPreset(new Date(values.startDate), values.durationPreset),
        durationDays:
          values.durationPreset === "ongoing"
            ? null
            : values.endDate
              ? Math.max(
                  1,
                  Math.round(
                    (Date.parse(values.endDate) - Date.parse(values.startDate)) / 86400000
                  )
                )
              : durationDaysForPreset(values.durationPreset),
      }
    : buildDurationAtCreation(values.durationPreset);

  return {
    peerId,
    ownerLabel,
    name: values.name.trim(),
    goalLabel,
    description,
    primaryGoalId,
    customGoalText: values.customGoalText.trim() || undefined,
    targetAudience: values.targetAudience.trim() || undefined,
    startDate: duration.startDate,
    endDate: duration.endDate ?? undefined,
    durationPreset: values.durationPreset,
    budgetAmount,
    budgetCurrency: values.budgetCurrency.trim() || "EUR",
    approvalMode: approvalModeForExecutionMode(values.executionMode),
    setupMode: values.setupMode,
    secondaryGoalIds:
      values.setupMode === "manual" && values.selectedGoalIds.length > 1
        ? values.selectedGoalIds.slice(1)
        : undefined,
    priority: values.priority,
    selectedChannels:
      values.setupMode === "manual" && values.selectedChannels.length > 0
        ? values.selectedChannels
        : undefined,
    selectedDeliverables:
      values.setupMode === "manual" && values.selectedDeliverables.length > 0
        ? values.selectedDeliverables
        : undefined,
  };
}
