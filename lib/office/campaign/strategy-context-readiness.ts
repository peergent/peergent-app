import type { CampaignContext } from "./campaign-context";
import type {
  CampaignContextReadiness,
  CompetitorDecision,
  EssentialContextFieldId,
  WebsiteAnalysisState,
  WebsiteDecision,
  WebsiteSnapshotState,
} from "./campaign-context-readiness";
import { essentialFieldLabel } from "./campaign-context-readiness";

/** Canonical strategy-readiness contract version — bump when required fields change. */
export const STRATEGY_READINESS_CONTRACT_VERSION = "v1";

export type StrategyContextReadiness = {
  ready: boolean;
  essentialReady: boolean;
  missingEssentialFields: readonly EssentialContextFieldId[];
  optionalContextStates: {
    websiteDecision: WebsiteDecision;
    competitorDecision: CompetitorDecision;
    websiteSnapshotState: WebsiteSnapshotState;
    websiteAnalysisState: WebsiteAnalysisState;
  };
  customerSafeMessage: string;
  machineReasonCodes: readonly string[];
  sourceVersion: string;
};

function resolveWebsiteDecision(ctx: CampaignContext): WebsiteDecision {
  if (ctx.websiteState === "skipped" || ctx.websiteSource === "skipped") return "skipped";
  if (
    ctx.websiteUrl ||
    ctx.websiteState === "available" ||
    ctx.websiteState === "simulated_analysis_complete"
  ) {
    return "supplied";
  }
  return "missing";
}

function resolveCompetitorDecision(ctx: CampaignContext): CompetitorDecision {
  if (ctx.competitorsSkipped || ctx.competitorContextState === "skipped") return "skipped";
  if (ctx.competitors.length > 0 || ctx.competitorContextState === "available") return "supplied";
  return "missing";
}

function resolveWebsiteSnapshotState(ctx: CampaignContext): WebsiteSnapshotState {
  const decision = resolveWebsiteDecision(ctx);
  if (decision === "missing" || decision === "skipped") return "none";
  if (ctx.isSeedCampaign && ctx.websiteState === "simulated_analysis_complete") {
    return "crawl_available";
  }
  return "url_only";
}

function resolveWebsiteAnalysisState(
  ctx: CampaignContext,
  snapshotState: WebsiteSnapshotState
): WebsiteAnalysisState {
  const decision = resolveWebsiteDecision(ctx);
  if (decision === "skipped" || decision === "missing") return "not_applicable";
  if (snapshotState === "crawl_available") return "available";
  return "unavailable_without_scan";
}

function collectMissingEssentialFields(ctx: CampaignContext): EssentialContextFieldId[] {
  if (ctx.isSeedCampaign) return [];

  const missing: EssentialContextFieldId[] = [];
  const brand = ctx.brandContext;

  const brandName = brand?.brandName?.trim() || ctx.brandName?.trim();
  if (!brandName) missing.push("brandName");

  if (ctx.goals.length === 0) missing.push("campaignGoal");

  const audience = ctx.audience.trim() || brand?.targetAudience?.trim();
  if (!audience) missing.push("targetAudience");

  if (!brand?.industry?.trim()) missing.push("industry");

  const hasProduct =
    (brand?.productsAndServices?.filter(Boolean).length ?? 0) > 0 ||
    ctx.description.trim().length >= 20;
  if (!hasProduct) missing.push("productOrService");

  const hasUsp = (brand?.uniqueSellingPoints?.filter(Boolean).length ?? 0) > 0;
  if (!hasUsp) missing.push("uniqueValueProposition");

  return missing;
}

function buildCustomerSafeMessage(
  missing: readonly EssentialContextFieldId[],
  locale: "nl" | "en"
): string {
  const nl = locale === "nl";
  if (missing.length === 0) {
    return nl
      ? "Er ontbreekt nog campagnecontext om een strategie te maken."
      : "Campaign context is still missing to generate a strategy.";
  }
  const labels = missing.map((field) => essentialFieldLabel(field, nl));
  const prefix = nl ? "Er ontbreekt nog: " : "Still missing: ";
  return prefix + labels.join(nl ? ", " : ", ") + ".";
}

function buildMachineReasonCodes(
  missing: readonly EssentialContextFieldId[],
  websiteDecision: WebsiteDecision,
  competitorDecision: CompetitorDecision
): string[] {
  const codes = missing.map((field) => `missing_${field}`);
  if (websiteDecision === "missing") codes.push("website_decision_missing");
  if (competitorDecision === "missing") codes.push("competitor_decision_missing");
  return codes;
}

/**
 * Canonical strategy-readiness contract — single source of truth for Office + Brain.
 * Required: brand name, goal, audience, industry, product/offer, ≥1 USP.
 * Optional (resolved, not blocking): website, competitors, mission, tone, market data.
 */
export function evaluateStrategyContextReadiness(ctx: CampaignContext): StrategyContextReadiness {
  const websiteDecision = resolveWebsiteDecision(ctx);
  const competitorDecision = resolveCompetitorDecision(ctx);
  const websiteSnapshotState = resolveWebsiteSnapshotState(ctx);
  const websiteAnalysisState = resolveWebsiteAnalysisState(ctx, websiteSnapshotState);
  const missingEssentialFields = collectMissingEssentialFields(ctx);
  const essentialReady = ctx.isSeedCampaign || missingEssentialFields.length === 0;
  const ready =
    essentialReady && websiteDecision !== "missing" && competitorDecision !== "missing";
  const locale = ctx.locale;

  return {
    ready,
    essentialReady,
    missingEssentialFields,
    optionalContextStates: {
      websiteDecision,
      competitorDecision,
      websiteSnapshotState,
      websiteAnalysisState,
    },
    customerSafeMessage: buildCustomerSafeMessage(missingEssentialFields, locale),
    machineReasonCodes: buildMachineReasonCodes(
      missingEssentialFields,
      websiteDecision,
      competitorDecision
    ),
    sourceVersion: STRATEGY_READINESS_CONTRACT_VERSION,
  };
}

/** Map canonical readiness to legacy CampaignContextReadiness for existing orchestrator call sites. */
export function toCampaignContextReadiness(
  strategy: StrategyContextReadiness
): CampaignContextReadiness {
  return {
    essentialReady: strategy.essentialReady,
    missingEssentialFields: strategy.missingEssentialFields,
    websiteDecision: strategy.optionalContextStates.websiteDecision,
    competitorDecision: strategy.optionalContextStates.competitorDecision,
    websiteSnapshotState: strategy.optionalContextStates.websiteSnapshotState,
    websiteAnalysisState: strategy.optionalContextStates.websiteAnalysisState,
  };
}

export function evaluateCampaignContextReadinessFromContract(
  ctx: CampaignContext
): CampaignContextReadiness {
  return toCampaignContextReadiness(evaluateStrategyContextReadiness(ctx));
}

export function strategyContextReadyFromContract(ctx: CampaignContext): boolean {
  return evaluateStrategyContextReadiness(ctx).ready;
}
