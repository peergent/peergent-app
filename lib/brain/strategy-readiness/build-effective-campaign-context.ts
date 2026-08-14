import type { CampaignContext } from "@/lib/office/campaign/campaign-context";
import {
  evaluateStrategyContextReadiness,
  type StrategyContextReadiness,
} from "@/lib/office/campaign/strategy-context-readiness";
import {
  deriveCompetitorKnowledge,
  deriveIndustry,
  deriveProductsAndServices,
  deriveTargetAudience,
  deriveUniqueSellingPoints,
  deriveWebsiteKnowledge,
} from "./extract-brain-knowledge";
import type {
  EffectiveStrategyReadinessBuildResult,
  EffectiveStrategyReadinessEvaluation,
  StrategyReadinessEnrichmentInput,
  StrategyReadinessFieldSource,
} from "./types";

function mergeBrandContext(
  base: CampaignContext,
  input: {
    industry: string | null;
    targetAudience: string | null;
    uniqueSellingPoints: readonly string[];
    productsAndServices: readonly string[];
  }
): CampaignContext["brandContext"] {
  const explicit = base.brandContext;
  const brandName = explicit?.brandName?.trim() || base.brandName?.trim() || base.companyName?.trim();

  return {
    brandName: brandName ?? undefined,
    industry: explicit?.industry?.trim() || input.industry || undefined,
    targetAudience: explicit?.targetAudience?.trim() || input.targetAudience || undefined,
    uniqueSellingPoints:
      explicit?.uniqueSellingPoints?.filter(Boolean).length
        ? explicit.uniqueSellingPoints
        : input.uniqueSellingPoints.length > 0
          ? [...input.uniqueSellingPoints]
          : undefined,
    productsAndServices:
      explicit?.productsAndServices?.filter(Boolean).length
        ? explicit.productsAndServices
        : input.productsAndServices.length > 0
          ? [...input.productsAndServices]
          : undefined,
    mission: explicit?.mission,
    positioning: explicit?.positioning,
    tone: explicit?.tone,
  };
}

/**
 * Merge explicit campaign setup with Peergent-discovered knowledge for Strategy readiness.
 * Explicit user-provided values always win; derived values fill only missing signals.
 */
export function buildEffectiveCampaignContextForStrategyReadiness(
  input: StrategyReadinessEnrichmentInput
): EffectiveStrategyReadinessBuildResult {
  const base = input.campaignContext;
  const profile = input.companyProfile ?? null;
  const companyGraph = input.resolvedGraphs?.companyGraph ?? null;
  const research = input.resolvedGraphs?.researchBrainGraph ?? null;
  const marketingIntelligence = input.resolvedGraphs?.marketingIntelligenceBrainGraph ?? null;

  const derivedFields: string[] = [];
  const sourceKinds = new Set<StrategyReadinessFieldSource>();
  let explicitFieldCount = 0;
  let derivedFieldCount = 0;

  const track = (
    field: string,
    source: StrategyReadinessFieldSource | null,
    isExplicit: boolean
  ) => {
    if (isExplicit) {
      explicitFieldCount += 1;
      return;
    }
    if (source) {
      derivedFieldCount += 1;
      derivedFields.push(field);
      sourceKinds.add(source);
    }
  };

  if (base.brandContext?.industry?.trim()) explicitFieldCount += 1;
  if (base.audience.trim() || base.brandContext?.targetAudience?.trim()) explicitFieldCount += 1;
  if (base.brandContext?.uniqueSellingPoints?.length) explicitFieldCount += 1;
  if (base.goals.length > 0) explicitFieldCount += 1;
  if (base.websiteUrl || base.websiteSource === "skipped") explicitFieldCount += 1;
  if (base.competitors.length > 0 || base.competitorsSkipped) explicitFieldCount += 1;

  const audience = deriveTargetAudience({
    explicitAudience: base.audience,
    brandTargetAudience: base.brandContext?.targetAudience,
    profile,
    research,
    marketingIntelligence,
  });
  track(
    "targetAudience",
    audience.source,
    Boolean(base.audience.trim() || base.brandContext?.targetAudience?.trim())
  );

  const industry = deriveIndustry({
    explicitIndustry: base.brandContext?.industry,
    profile,
    companyGraph,
  });
  track("industry", industry.source, Boolean(base.brandContext?.industry?.trim()));

  const usps = deriveUniqueSellingPoints({
    explicitUsps: base.brandContext?.uniqueSellingPoints,
    profile,
    companyGraph,
    marketingIntelligence,
  });
  track(
    "uniqueValueProposition",
    usps.source,
    Boolean(base.brandContext?.uniqueSellingPoints?.filter(Boolean).length)
  );

  const products = deriveProductsAndServices({
    explicitProducts: base.brandContext?.productsAndServices,
    description: base.description,
    profile,
    companyGraph,
  });
  track(
    "productOrService",
    products.source,
    Boolean(
      base.brandContext?.productsAndServices?.filter(Boolean).length ||
        base.description.trim().length >= 20
    )
  );

  const website = deriveWebsiteKnowledge({
    websiteUrl: base.websiteUrl,
    websiteSkipped: base.websiteSource === "skipped" || base.websiteState === "skipped",
    profile,
    websiteSnapshot: input.companyWebsiteSnapshot ?? null,
    research,
  });
  track(
    "website",
    website.source,
    Boolean(base.websiteUrl || base.websiteSource === "skipped" || base.websiteState === "skipped")
  );

  const competitors = deriveCompetitorKnowledge({
    competitors: base.competitors,
    competitorsSkipped: base.competitorsSkipped,
    profile,
    research,
    marketingIntelligence,
  });
  track(
    "competitors",
    competitors.source,
    Boolean(base.competitors.length > 0 || base.competitorsSkipped)
  );

  const brandContext = mergeBrandContext(base, {
    industry: industry.value,
    targetAudience: audience.value,
    uniqueSellingPoints: usps.values,
    productsAndServices: products.values,
  });

  let websiteState = base.websiteState;
  let websiteSource = base.websiteSource;
  let websiteUrl = base.websiteUrl;
  if (website.explicitlySkipped) {
    websiteState = "skipped";
    websiteSource = "skipped";
    websiteUrl = null;
  } else if (website.known) {
    websiteState = website.url ? "available" : "real_analysis_complete";
    websiteSource = website.url ? "supplied_by_customer" : base.websiteSource;
    websiteUrl = website.url ?? websiteUrl;
  }

  let competitorContextState = base.competitorContextState;
  if (competitors.explicitlySkipped) {
    competitorContextState = "skipped";
  } else if (competitors.known && competitors.competitors.length > 0) {
    competitorContextState = "available";
  }

  const effectiveContext: CampaignContext = {
    ...base,
    audience: audience.value ?? base.audience,
    brandContext,
    websiteUrl,
    websiteSource,
    websiteState,
    competitors: competitors.competitors,
    competitorsSkipped: competitors.explicitlySkipped,
    competitorContextState,
  };

  return {
    effectiveContext,
    explicitFieldCount,
    derivedFieldCount,
    derivedFields,
    sourceKinds: [...sourceKinds],
  };
}

export function evaluateEffectiveStrategyContextReadiness(
  input: StrategyReadinessEnrichmentInput
): EffectiveStrategyReadinessEvaluation & { readiness: StrategyContextReadiness } {
  const build = buildEffectiveCampaignContextForStrategyReadiness(input);
  const readiness = evaluateStrategyContextReadiness(build.effectiveContext);
  return {
    build,
    readiness,
    ready: readiness.ready,
    machineReasonCodes: readiness.machineReasonCodes,
  };
}

export function parseStrategyReadinessReasonCodes(errorMessage: string | null | undefined): readonly string[] {
  if (!errorMessage?.trim()) return [];
  return errorMessage
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean);
}
