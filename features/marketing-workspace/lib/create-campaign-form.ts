import type { CampaignApprovalMode } from "@/lib/campaign";

/** Wizard-only options aligned with Campaign domain approval modes. */
export type CreateCampaignApprovalMode = CampaignApprovalMode;

export type CreateCampaignPrimaryGoalId =
  | "generate_leads"
  | "brand_awareness"
  | "product_launch"
  | "promote_offer"
  | "recruit"
  | "custom";

export const CREATE_CAMPAIGN_PRIMARY_GOALS: readonly {
  id: CreateCampaignPrimaryGoalId;
  label: string;
}[] = [
  { id: "generate_leads", label: "Generate leads" },
  { id: "brand_awareness", label: "Build brand awareness" },
  { id: "product_launch", label: "Launch a product or service" },
  { id: "promote_offer", label: "Promote an offer" },
  { id: "recruit", label: "Recruit people" },
  { id: "custom", label: "Custom goal" },
] as const;

export type CreateCampaignFormValues = {
  name: string;
  primaryGoalId: CreateCampaignPrimaryGoalId;
  customGoalText: string;
  description: string;
  targetAudience: string;
  startDate: string;
  endDate: string;
  budgetAmount: string;
  budgetCurrency: string;
  approvalMode: CreateCampaignApprovalMode;
};

export type CreateCampaignFieldErrors = Partial<
  Record<
    | "name"
    | "primaryGoalId"
    | "customGoalText"
    | "description"
    | "startDate"
    | "endDate"
    | "budgetAmount"
    | "budgetCurrency",
    string
  >
>;

export function createEmptyCreateCampaignForm(): CreateCampaignFormValues {
  return {
    name: "",
    primaryGoalId: "generate_leads",
    customGoalText: "",
    description: "",
    targetAudience: "",
    startDate: "",
    endDate: "",
    budgetAmount: "",
    budgetCurrency: "USD",
    approvalMode: "approval_before_publication",
  };
}

export function validateCreateCampaignForm(
  values: CreateCampaignFormValues
): CreateCampaignFieldErrors {
  const errors: CreateCampaignFieldErrors = {};
  const name = values.name.trim();
  const description = values.description.trim();

  if (!name) {
    errors.name = "Enter a campaign name.";
  }

  if (!description) {
    errors.description = "Describe what you want to achieve.";
  }

  const goalLabel = resolvePrimaryGoalLabel(values);
  if (!goalLabel.trim()) {
    errors.primaryGoalId = "Choose a primary goal.";
  }

  if (values.primaryGoalId === "custom" && !values.customGoalText.trim()) {
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
  if (values.primaryGoalId === "custom") {
    return values.customGoalText.trim();
  }
  const match = CREATE_CAMPAIGN_PRIMARY_GOALS.find((g) => g.id === values.primaryGoalId);
  return match?.label ?? "";
}

export function createCampaignFormHasErrors(errors: CreateCampaignFieldErrors): boolean {
  return Object.keys(errors).length > 0;
}

import type { CreateMarketingCampaignProjectInput } from "@/lib/peer-experience/marketing/projects/project-engine";

export function toCreateMarketingCampaignProjectInput(
  peerId: string,
  ownerLabel: string,
  values: CreateCampaignFormValues
): CreateMarketingCampaignProjectInput {
  const goalLabel = resolvePrimaryGoalLabel(values);
  const budgetRaw = values.budgetAmount.trim();
  const budgetAmount =
    budgetRaw.length > 0 && !Number.isNaN(Number(budgetRaw)) ? Number(budgetRaw) : undefined;

  return {
    peerId,
    ownerLabel,
    name: values.name.trim(),
    goalLabel,
    description: values.description.trim(),
    primaryGoalId: values.primaryGoalId,
    customGoalText: values.customGoalText.trim() || undefined,
    targetAudience: values.targetAudience.trim() || undefined,
    startDate: values.startDate || undefined,
    endDate: values.endDate || undefined,
    budgetAmount,
    budgetCurrency: values.budgetCurrency.trim() || "USD",
    approvalMode: values.approvalMode,
  };
}
