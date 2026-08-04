import type { CampaignContext } from "./campaign-context";
import {
  evaluateCampaignContextReadinessFromContract,
  evaluateStrategyContextReadiness,
  strategyContextReadyFromContract,
} from "./strategy-context-readiness";

export type EssentialContextFieldId =
  | "brandName"
  | "campaignGoal"
  | "targetAudience"
  | "industry"
  | "productOrService"
  | "uniqueValueProposition";

export type WebsiteDecision = "supplied" | "skipped" | "missing";
export type CompetitorDecision = "supplied" | "skipped" | "missing";
export type WebsiteSnapshotState = "none" | "url_only" | "crawl_available";
export type WebsiteAnalysisState = "unavailable_without_scan" | "available" | "not_applicable";

export type CampaignContextReadiness = {
  essentialReady: boolean;
  missingEssentialFields: readonly EssentialContextFieldId[];
  websiteDecision: WebsiteDecision;
  competitorDecision: CompetitorDecision;
  websiteSnapshotState: WebsiteSnapshotState;
  websiteAnalysisState: WebsiteAnalysisState;
};

const ESSENTIAL_FIELD_LABELS: Record<
  EssentialContextFieldId,
  { nl: string; en: string }
> = {
  brandName: { nl: "Merk- of bedrijfsnaam", en: "Brand or company name" },
  campaignGoal: { nl: "Campagnedoel", en: "Campaign goal" },
  targetAudience: { nl: "Doelgroep", en: "Target audience" },
  industry: { nl: "Branche", en: "Industry" },
  productOrService: { nl: "Product of dienst", en: "Product or service" },
  uniqueValueProposition: { nl: "Unieke waardepropositie", en: "Unique value proposition" },
};

export function essentialFieldLabel(field: EssentialContextFieldId, nl: boolean): string {
  return ESSENTIAL_FIELD_LABELS[field][nl ? "nl" : "en"];
}

/** Central gate — essential vs optional campaign context. Delegates to canonical strategy contract. */
export function evaluateCampaignContextReadiness(ctx: CampaignContext): CampaignContextReadiness {
  return evaluateCampaignContextReadinessFromContract(ctx);
}

export function strategyContextReady(readiness: CampaignContextReadiness): boolean {
  if (!readiness.essentialReady) return false;
  if (readiness.websiteDecision === "missing") return false;
  if (readiness.competitorDecision === "missing") return false;
  return true;
}

export { evaluateStrategyContextReadiness, strategyContextReadyFromContract };
