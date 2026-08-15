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
  resolveCampaignBrandBoundary,
  type CampaignBrandContextFields,
} from "@/lib/office/campaign/campaign-brand-boundary";
import { emitCampaignBrandBoundaryDiagnostic } from "@/lib/office/campaign/campaign-brand-boundary-diagnostics";
import {
  buildDurationAtCreation,
  computeEndDateFromPreset,
  durationDaysForPreset,
  inferPresetFromDates,
  type CampaignDurationPreset,
} from "./campaign-duration";

/** Canonical demo seed campaign — uses Peergent fixture narrative. */
export const SEED_CAMPAIGN_ID = "camp-heatpump";

import type { CampaignWorkflowStepId } from "./workflow-types";
import type { DemoStepApprovalStatus } from "@/lib/office/demo/demo-workflow-simulation";

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

export type CampaignBrandContext = CampaignBrandContextFields;

export type CampaignContext = {
  projectId: string;
  /** Brand/client being marketed in this campaign. */
  brandName: string;
  /** Account organization operating the campaign (may differ from brand). */
  accountOrganizationName: string | null;
  /** When true, org-level Business/Brand Brain must not bleed into this campaign. */
  usesExternalBrand: boolean;
  /** @deprecated Use brandName — kept for backward-compatible call sites. */
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
  brandContext: CampaignBrandContext | null;
  businessAnalyzedApproved: boolean;
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
  /** Live Office — monotonic context version for Brain output invalidation. */
  contextVersion?: number;
  /** Live Office — customer review gates copied from project setup. */
  stepApprovals?: Partial<Record<CampaignWorkflowStepId, DemoStepApprovalStatus>>;
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
  /** Durable organizations.name — canonical org identity for brand boundary. */
  organizationName?: string | null;
  /** @deprecated Prefer organizationName — legacy caller override. */
  accountOrganizationName?: string | null;
  /** When set, emitted in privacy-safe brand boundary diagnostics. */
  organizationId?: string;
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

  const boundary = resolveCampaignBrandBoundary({
    campaignTitle: project.title,
    setup,
    isSeedCampaign: seed,
    durableOrganizationName: input.organizationName,
    accountOrganizationNameOverride: input.accountOrganizationName,
    understanding: domainInput.understanding ?? null,
    seedBrandName: DEMO_COMPANY_NAME,
  });

  const brandName = boundary.brandName;
  const campaignName = project.title.trim() || brandName;
  const accountOrganizationName = boundary.accountOrganizationName;
  const usesExternalBrand = boundary.usesExternalBrand;

  emitCampaignBrandBoundaryDiagnostic({
    event: "campaign_brand_boundary_resolved",
    organizationId: input.organizationId,
    organizationIdentitySource: boundary.organizationIdentitySource,
    hasExplicitCampaignBrand: boundary.hasExplicitCampaignBrand,
    usesExternalBrand: boundary.usesExternalBrand,
    externalBrandDecisionSource: boundary.externalBrandDecisionSource,
    setupMode: setup?.setupMode,
  });
  const brandContext = setup?.campaignBrandContext
    ? {
        brandName: setup.campaignBrandContext.brandName ?? brandName,
        industry: setup.campaignBrandContext.industry,
        mission: setup.campaignBrandContext.mission,
        uniqueSellingPoints: setup.campaignBrandContext.uniqueSellingPoints,
        productsAndServices: setup.campaignBrandContext.productsAndServices,
        positioning: setup.campaignBrandContext.positioning,
        tone: setup.campaignBrandContext.tone,
        targetAudience: setup.campaignBrandContext.targetAudience,
      }
    : null;
  const businessAnalyzedApproved = Boolean(setup?.businessAnalyzedApproved);

  const websiteUrl = input.websiteUrl ?? setup?.websiteUrl ?? null;
  const websiteSkipped = Boolean(input.websiteSkipped ?? setup?.websiteSkipped);
  const setupCompetitors = setup?.campaignCompetitors ?? [];
  const storedCompetitors = input.competitors ?? setupCompetitors;
  const competitorsSkipped = Boolean(input.competitorsSkipped ?? setup?.competitorsSkipped);

  let websiteState: ContextAvailability = "missing";
  let websiteSource: WebsiteSource = "missing";
  if (websiteSkipped) {
    websiteState = "skipped";
    websiteSource = "skipped";
  } else if (websiteUrl) {
    websiteState = seed ? "simulated_analysis_complete" : "available";
    websiteSource = "supplied_by_customer";
  }

  const hasCampaignBrandContext = Boolean(brandContext?.brandName?.trim());
  const hasOrgProfileForOwnBrand =
    !usesExternalBrand &&
    Boolean(domainInput.understanding?.available && domainInput.understanding.brand?.positioningStatement);

  let companyContextState: ContextAvailability = "missing";
  if (seed || businessAnalyzedApproved) {
    companyContextState = seed ? "simulated_analysis_complete" : "available";
  } else if (hasCampaignBrandContext) {
    companyContextState = "available";
  } else if (hasOrgProfileForOwnBrand) {
    companyContextState = "available";
  } else if (description || audience) {
    companyContextState = "available";
  }

  let competitorContextState: ContextAvailability = "missing";
  const domainCompetitors = domainInput.understanding?.competitors ?? [];
  if (competitorsSkipped) {
    competitorContextState = "skipped";
  } else if (storedCompetitors.length > 0) {
    competitorContextState = seed ? "simulated_analysis_complete" : "available";
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
    brandName,
    accountOrganizationName,
    usesExternalBrand,
    companyName: brandName,
    campaignName,
    goals: goalLabels(setup, nl),
    audience,
    description,
    extraContext,
    websiteUrl,
    websiteSource,
    websiteState,
    companyContextState,
    brandContext,
    businessAnalyzedApproved,
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
    contextVersion: setup?.campaignContextVersion ?? 0,
    stepApprovals: setup?.stepApprovals,
  };
}

export function buildCampaignContextFromCreateInput(
  project: MarketingProject,
  input: CreateMarketingCampaignProjectInput,
  locale: "nl" | "en" = "nl",
  options?: { organizationName?: string | null; organizationId?: string }
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

  const boundary = resolveCampaignBrandBoundary({
    campaignTitle: project.title,
    setup: project.campaignSetup,
    isSeedCampaign: false,
    durableOrganizationName: options?.organizationName,
    understanding: null,
  });

  emitCampaignBrandBoundaryDiagnostic({
    event: "campaign_brand_boundary_resolved",
    organizationId: options?.organizationId,
    organizationIdentitySource: boundary.organizationIdentitySource,
    hasExplicitCampaignBrand: boundary.hasExplicitCampaignBrand,
    usesExternalBrand: boundary.usesExternalBrand,
    externalBrandDecisionSource: boundary.externalBrandDecisionSource,
    setupMode: input.setupMode ?? "automatic",
  });

  return {
    projectId: project.id,
    brandName: boundary.brandName,
    accountOrganizationName: boundary.accountOrganizationName,
    usesExternalBrand: boundary.usesExternalBrand,
    companyName: boundary.brandName,
    campaignName: project.title.trim() || boundary.brandName,
    goals,
    audience: input.targetAudience?.trim() ?? "",
    description: input.description.trim(),
    extraContext: input.description.trim(),
    websiteUrl: null,
    websiteSource: "missing",
    websiteState: "missing",
    companyContextState: input.description.trim() || input.targetAudience?.trim() ? "available" : "missing",
    brandContext: null,
    businessAnalyzedApproved: false,
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
