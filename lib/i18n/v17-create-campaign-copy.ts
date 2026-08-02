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
  channelsLabel: string;
  executionModeLabel: string;
  intentNotesLabel: string;
  intentNotesHint: string;
  executionModes: Record<"manual" | "semi_automatic" | "fully_automatic", { title: string; description: string }>;
  channelsHint: string;
  approvalSummaryLabel: string;
  approvalSummaryText: string;
};

const goalNl: V17CreateCampaignCopy["goalLabels"] = {
  generate_leads: "Leads genereren",
  brand_awareness: "Naamsbekendheid",
  product_launch: "Product lanceren",
  customer_retention: "Klanten behouden",
  upsell: "Upsell",
  promote_offer: "Aanbieding promoten",
  recruit: "Recruitment",
  custom: "Anders",
};

const goalEn: V17CreateCampaignCopy["goalLabels"] = {
  generate_leads: "Generate leads",
  brand_awareness: "Brand awareness",
  product_launch: "Product launch",
  customer_retention: "Customer retention",
  upsell: "Upsell",
  promote_offer: "Promote an offer",
  recruit: "Recruitment",
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
  channelsLabel: "Kanalen",
  executionModeLabel: "Uitvoeringsmodus",
  intentNotesLabel: "Extra context",
  intentNotesHint: "optioneel — Emma bepaalt zelf de kanalen en deliverables",
  channelsHint: "Emma kiest de kanalen en deliverables op basis van je doel.",
  executionModes: {
    manual: {
      title: "Handmatig",
      description: "Emma wacht op jou vóór elke belangrijke stap.",
    },
    semi_automatic: {
      title: "Semi-automatisch",
      description: "Emma maakt alles; jij keurt goed vóór publicatie.",
    },
    fully_automatic: {
      title: "Volledig automatisch",
      description: "Emma voert de workflow uit; jij volgt de voortgang.",
    },
  },
  approvalSummaryLabel: "Goedkeuring",
  approvalSummaryText:
    "Emma bereidt alles voor en publiceert pas na jouw goedkeuring.",
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
  channelsLabel: "Channels",
  executionModeLabel: "Execution mode",
  intentNotesLabel: "Additional context",
  intentNotesHint: "optional — Emma chooses channels and deliverables",
  channelsHint: "Emma selects channels and deliverables based on your goal.",
  executionModes: {
    manual: {
      title: "Manual",
      description: "Emma waits for you before each important step.",
    },
    semi_automatic: {
      title: "Semi-automatic",
      description: "Emma creates everything; you approve before publication.",
    },
    fully_automatic: {
      title: "Fully automatic",
      description: "Emma runs the workflow; you monitor progress.",
    },
  },
  approvalSummaryLabel: "Approval",
  approvalSummaryText:
    "Emma prepares everything and publishes only after your approval.",
};

export function getV17CreateCampaignCopy(localePreference?: string | null): V17CreateCampaignCopy {
  const locale: MarketingCampaignLocale = resolveMarketingCampaignLocale(localePreference);
  return locale === "nl" ? nl : en;
}
