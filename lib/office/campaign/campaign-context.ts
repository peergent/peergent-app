import type { MarketingPeerDomainInput } from "@/lib/peer-experience/marketing/view-models/marketing-peer-domain-input";
import type {
  CampaignSetupChannel,
  CampaignSetupDeliverable,
  MarketingProject,
  MarketingProjectCampaignSetup,
} from "@/lib/peer-experience/marketing/projects/types";
import type { CreateMarketingCampaignProjectInput } from "@/lib/peer-experience/marketing/projects/project-engine";
import { DEMO_COMPANY_NAME } from "@/lib/office/demo/demo-company";
import {
  buildDurationAtCreation,
  computeEndDateFromPreset,
  durationDaysForPreset,
  inferPresetFromDates,
  type CampaignDurationPreset,
} from "./campaign-duration";

/** Canonical demo seed campaign — uses Peergent fixture narrative. */
export const SEED_CAMPAIGN_ID = "camp-heatpump";

export type ContextAvailability =
  | "missing"
  | "available"
  | "simulated"
  | "simulated_analysis_complete"
  | "real_analysis_complete"
  | "skipped";

export type CampaignExecutionMode = "manual" | "semi_automatic" | "fully_automatic";

export type WebsiteSource = "missing" | "supplied_by_customer" | "skipped";

export type CampaignCompetitorEntry = {
  name: string;
  url?: string;
};

export type CampaignContext = {
  projectId: string;
  companyName: string;
  campaignName: string;
  goals: readonly string[];
  audience: string;
  description: string;
  extraContext: string;
  websiteUrl: string | null;
  websiteSource: WebsiteSource;
  websiteState: ContextAvailability;
  companyContextState: ContextAvailability;
  competitors: readonly CampaignCompetitorEntry[];
  competitorsSkipped: boolean;
  competitorContextState: ContextAvailability;
  campaignMode: "automatic" | "manual";
  executionMode: CampaignExecutionMode;
  selectedChannels: readonly CampaignSetupChannel[];
  selectedDeliverables: readonly CampaignSetupDeliverable[];
  isSeedCampaign: boolean;
  locale: "nl" | "en";
  durationPreset: CampaignDurationPreset;
  startDate: string | null;
  endDate: string | null;
  durationDays: number | null;
};

export function isSeedCampaign(projectId: string): boolean {
  return projectId === SEED_CAMPAIGN_ID;
}

export function executionModeFromSetup(
  setup?: MarketingProjectCampaignSetup
): CampaignExecutionMode {
  switch (setup?.approvalMode) {
    case "approval_before_generation":
      return "manual";
    case "no_approval_required":
      return "fully_automatic";
    case "approval_before_publication":
    default:
      return "semi_automatic";
  }
}

function goalLabels(setup: MarketingProjectCampaignSetup | undefined, nl: boolean): string[] {
  if (!setup) return [];
  const labels: string[] = [];
  const map: Record<string, { en: string; nl: string }> = {
    generate_leads: { en: "Generate leads", nl: "Leads genereren" },
    brand_awareness: { en: "Build brand awareness", nl: "Naamsbekendheid opbouwen" },
    product_launch: { en: "Launch a product or service", nl: "Product of dienst lanceren" },
    promote_offer: { en: "Promote an offer", nl: "Aanbod promoten" },
    recruit: { en: "Recruit people", nl: "Mensen werven" },
    customer_retention: { en: "Retain customers", nl: "Klanten behouden" },
    upsell: { en: "Upsell", nl: "Upsell" },
    custom: { en: "Custom goal", nl: "Aangepast doel" },
  };
  const primary = map[setup.primaryGoalId];
  if (primary) labels.push(nl ? primary.nl : primary.en);
  if (setup.customGoalText?.trim()) labels.push(setup.customGoalText.trim());
  for (const id of setup.secondaryGoalIds ?? []) {
    const label = map[id];
    if (label) labels.push(nl ? label.nl : label.en);
  }
  return labels;
}

/**
 * Resolves campaign-scoped context. Wizard campaigns use user input first;
 * seed campaign (`camp-heatpump`) may use the Veldwerk domain fixture.
 */
export function buildCampaignContext(input: {
  project: MarketingProject;
  domainInput: MarketingPeerDomainInput;
  locale?: string | null;
  websiteSkipped?: boolean;
  websiteUrl?: string | null;
  competitors?: readonly CampaignCompetitorEntry[];
  competitorsSkipped?: boolean;
}): CampaignContext {
  const { project, domainInput } = input;
  const nl = input.locale === "nl";
  const setup = project.campaignSetup;
  const seed = isSeedCampaign(project.id);

  const audience =
    setup?.confirmedAudience?.trim() ||
    setup?.targetAudience?.trim() ||
    (seed && domainInput.understanding?.customerSegments?.[0]?.description) ||
    "";

  const description = setup?.description?.trim() || project.rawRequest?.trim() || "";
  const extraContext = project.rawRequest?.trim() || description;

  const companyName = seed
    ? DEMO_COMPANY_NAME
    : project.title.trim() || DEMO_COMPANY_NAME;

  const websiteUrl = input.websiteUrl ?? null;
  const websiteSkipped = Boolean(input.websiteSkipped);
  const storedCompetitors = input.competitors ?? [];
  const competitorsSkipped = Boolean(input.competitorsSkipped);

  let websiteState: ContextAvailability = "missing";
  let websiteSource: WebsiteSource = "missing";
  if (websiteSkipped) {
    websiteState = "skipped";
    websiteSource = "skipped";
  } else if (websiteUrl) {
    websiteState = "simulated_analysis_complete";
    websiteSource = "supplied_by_customer";
  }

  const hasCompanyProfile =
    seed ||
    Boolean(domainInput.understanding?.available && domainInput.understanding.brand?.positioningStatement);

  let companyContextState: ContextAvailability = "missing";
  if (seed || hasCompanyProfile) {
    companyContextState = seed ? "simulated_analysis_complete" : "available";
  } else if (description || audience) {
    companyContextState = "available";
  }

  let competitorContextState: ContextAvailability = "missing";
  const domainCompetitors = domainInput.understanding?.competitors ?? [];
  if (competitorsSkipped) {
    competitorContextState = "skipped";
  } else if (storedCompetitors.length > 0) {
    competitorContextState = "simulated_analysis_complete";
  } else if (seed && domainCompetitors.length > 0) {
    competitorContextState = "simulated";
  }

  const selectedChannels =
    setup?.selectedChannels?.filter((c) => c !== "decide_later") ?? [];
  const selectedDeliverables =
    setup?.selectedDeliverables?.filter((d) => d !== "decide_later") ?? [];

  const durationPreset =
    setup?.durationPreset ??
    (setup?.startDate && setup?.endDate
      ? inferPresetFromDates(setup.startDate, setup.endDate) ?? "1_month"
      : "1_month");

  return {
    projectId: project.id,
    companyName,
    campaignName: project.title,
    goals: goalLabels(setup, nl),
    audience,
    description,
    extraContext,
    websiteUrl,
    websiteSource,
    websiteState,
    companyContextState,
    competitors: storedCompetitors,
    competitorsSkipped,
    competitorContextState,
    campaignMode: setup?.setupMode ?? "automatic",
    executionMode: executionModeFromSetup(setup),
    selectedChannels,
    selectedDeliverables,
    isSeedCampaign: seed,
    locale: nl ? "nl" : "en",
    durationPreset,
    startDate: setup?.startDate ?? null,
    endDate: setup?.endDate ?? null,
    durationDays: durationDaysForPreset(durationPreset),
  };
}

export function buildCampaignContextFromCreateInput(
  project: MarketingProject,
  input: CreateMarketingCampaignProjectInput,
  locale: "nl" | "en" = "nl"
): CampaignContext {
  const nl = locale === "nl";
  const goals: string[] = [];
  const goalMap: Record<string, { en: string; nl: string }> = {
    generate_leads: { en: "Generate leads", nl: "Leads genereren" },
    brand_awareness: { en: "Build brand awareness", nl: "Naamsbekendheid opbouwen" },
    product_launch: { en: "Launch a product", nl: "Product lanceren" },
    promote_offer: { en: "Promote an offer", nl: "Aanbod promoten" },
    recruit: { en: "Recruit", nl: "Werven" },
    customer_retention: { en: "Retain customers", nl: "Klanten behouden" },
    upsell: { en: "Upsell", nl: "Upsell" },
    custom: { en: "Custom goal", nl: "Aangepast doel" },
  };
  const primary = goalMap[input.primaryGoalId];
  if (primary) goals.push(nl ? primary.nl : primary.en);
  if (input.customGoalText?.trim()) goals.push(input.customGoalText.trim());

  const selectedChannels =
    input.selectedChannels?.filter((c) => c !== "decide_later") ?? [];
  const selectedDeliverables =
    input.selectedDeliverables?.filter((d) => d !== "decide_later") ?? [];

  const durationPreset = input.durationPreset ?? "1_month";
  const durationFromCreation = input.startDate
    ? {
        preset: durationPreset,
        startDate: input.startDate,
        endDate:
          durationPreset === "ongoing"
            ? null
            : input.endDate ?? computeEndDateFromPreset(new Date(input.startDate), durationPreset),
        durationDays: durationPreset === "ongoing" ? null : durationDaysForPreset(durationPreset),
      }
    : buildDurationAtCreation(durationPreset);

  return {
    projectId: project.id,
    companyName: input.name.trim(),
    campaignName: input.name.trim(),
    goals,
    audience: input.targetAudience?.trim() ?? "",
    description: input.description.trim(),
    extraContext: input.description.trim(),
    websiteUrl: null,
    websiteSource: "missing",
    websiteState: "missing",
    companyContextState: input.description.trim() || input.targetAudience?.trim() ? "available" : "missing",
    competitors: [],
    competitorsSkipped: false,
    competitorContextState: "missing",
    campaignMode: input.setupMode ?? "automatic",
    executionMode:
      input.approvalMode === "approval_before_generation"
        ? "manual"
        : input.approvalMode === "no_approval_required"
          ? "fully_automatic"
          : "semi_automatic",
    selectedChannels,
    selectedDeliverables,
    isSeedCampaign: false,
    locale: nl ? "nl" : "en",
    durationPreset: durationFromCreation.preset,
    startDate: durationFromCreation.startDate,
    endDate: durationFromCreation.endDate,
    durationDays: durationFromCreation.durationDays,
  };
}

/** Forbidden terms for wizard campaigns — must never appear when user did not provide them. */
export const INSTALLER_LEAK_TERMS = [
  "warmtepomp",
  "heat pump",
  "installateur",
  "installateurs",
  "installation company",
  "installatiebedrijf",
  "installatie-eigenaren",
  "veldwerk",
  "planningssoftware",
  "buitendienst",
  "field service",
  "monteurs",
  "installatieploeg",
] as const;

export function containsInstallerLeak(text: string): boolean {
  const lower = text.toLowerCase();
  return INSTALLER_LEAK_TERMS.some((term) => lower.includes(term.toLowerCase()));
}
