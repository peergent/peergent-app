import { resolveMarketingCampaignLocale, type MarketingCampaignLocale } from "./marketing-campaign-copy";
import type { CreateCampaignPrimaryGoalId } from "@/features/marketing-workspace/lib/create-campaign-form";

export type V17CreateCampaignCopy = {
  title: string;
  subtitle: (peerName: string) => string;
  nameLabel: string;
  primaryGoalLabel: string;
  customGoalLabel: string;
  descriptionLabel: string;
  audienceLabel: string;
  audienceHint: string;
  startDateLabel: string;
  endDateLabel: string;
  budgetLabel: string;
  currencyLabel: string;
  cancel: string;
  submit: string;
  submitError: string;
  goalLabels: Record<CreateCampaignPrimaryGoalId, string>;
  approvalLabels: Record<string, string>;
};

const goalNl: V17CreateCampaignCopy["goalLabels"] = {
  generate_leads: "Leads genereren",
  brand_awareness: "Naamsbekendheid vergroten",
  product_launch: "Product of dienst lanceren",
  promote_offer: "Aanbieding promoten",
  recruit: "Mensen werven",
  custom: "Anders",
};

const goalEn: V17CreateCampaignCopy["goalLabels"] = {
  generate_leads: "Generate leads",
  brand_awareness: "Build brand awareness",
  product_launch: "Launch a product or service",
  promote_offer: "Promote an offer",
  recruit: "Recruit people",
  custom: "Custom goal",
};

const nl: V17CreateCampaignCopy = {
  title: "Nieuwe campagne",
  subtitle: () =>
    "Stel de campagne in. Er wordt nog niets gepubliceerd zonder de vereiste goedkeuring.",
  nameLabel: "Campagnenaam",
  primaryGoalLabel: "Primair doel",
  customGoalLabel: "Ander doel",
  descriptionLabel: "Wat wil je bereiken?",
  audienceLabel: "Doelgroep",
  audienceHint: "optioneel",
  startDateLabel: "Startdatum",
  endDateLabel: "Einddatum",
  budgetLabel: "Budget",
  currencyLabel: "Valuta",
  cancel: "Annuleren",
  submit: "Campagne aanmaken",
  submitError: "De campagne kon niet worden aangemaakt. Probeer het opnieuw.",
  goalLabels: goalNl,
  approvalLabels: {},
};

const en: V17CreateCampaignCopy = {
  title: "New campaign",
  subtitle: (peerName) =>
    `Set up a campaign for ${peerName}. Nothing will be published without required approval.`,
  nameLabel: "Campaign name",
  primaryGoalLabel: "Primary goal",
  customGoalLabel: "Custom goal",
  descriptionLabel: "What do you want to achieve?",
  audienceLabel: "Target audience",
  audienceHint: "optional",
  startDateLabel: "Start date",
  endDateLabel: "End date",
  budgetLabel: "Budget",
  currencyLabel: "Currency",
  cancel: "Cancel",
  submit: "Create campaign",
  submitError: "We could not create this campaign. Try again in a moment.",
  goalLabels: goalEn,
  approvalLabels: {},
};

export function getV17CreateCampaignCopy(localePreference?: string | null): V17CreateCampaignCopy {
  const locale: MarketingCampaignLocale = resolveMarketingCampaignLocale(localePreference);
  return locale === "nl" ? nl : en;
}
