import type { CampaignContext } from "@/lib/office/campaign/campaign-context";
import {
  evaluateStrategyContextReadiness,
  type StrategyContextReadiness,
} from "@/lib/office/campaign/strategy-context-readiness";
import { buildStrategyReadinessKnowledgeBundle } from "./build-knowledge-bundle";
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
  StrategyReadinessKnowledgeDimensions,
  StrategyReadinessKnowledgeSource,
} from "./types";

function mapKnowledgeSource(source: StrategyReadinessKnowledgeSource | null): StrategyReadinessFieldSource | null {
  if (!source) return null;
  if (source === "persisted_graph") return "research_graph";
  return source;
}

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

function normalizeKnowledgeSource(
  source:
    | "explicit_campaign"
    | "explicit_skip"
    | "company_profile"
    | "company_graph"
    | "research_graph"
    | "marketing_intelligence_graph"
    | "website_snapshot"
    | "inflight_graph"
    | "upstream_capability"
    | "deterministic_inference"
    | null
): StrategyReadinessKnowledgeSource | null {
  if (!source) return null;
  if (source === "company_graph" || source === "research_graph" || source === "marketing_intelligence_graph") {
    return "persisted_graph";
  }
  if (source === "website_snapshot") return "company_profile";
  return source;
}

function collectUnresolved(readiness: StrategyContextReadiness): readonly string[] {
  return [...readiness.machineReasonCodes];
}

/**
 * Merge explicit campaign setup with Peergent-discovered knowledge for Strategy readiness.
 * Explicit user-provided values always win; derived values fill only missing signals.
 */
export function buildEffectiveCampaignContextForStrategyReadiness(
  input: StrategyReadinessEnrichmentInput
): EffectiveStrategyReadinessBuildResult {
  const bundle = buildStrategyReadinessKnowledgeBundle(input);
  const base = bundle.campaignContext;
  const profile = bundle.companyProfile;
  const companyGraph = bundle.resolvedGraphs?.companyGraph ?? null;
  const research = bundle.resolvedGraphs?.researchBrainGraph ?? null;
  const marketingIntelligence = bundle.resolvedGraphs?.marketingIntelligenceBrainGraph ?? null;
  const capability = bundle.capabilityKnowledge;
  const inflight = bundle.inflightKnowledge;

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
    inflightAudience: inflight.targetAudience,
    capabilityAudience: capability.targetAudience,
    inferredAudience: bundle.inferredTargetAudience,
  });
  track(
    "targetAudience",
    mapKnowledgeSource(normalizeKnowledgeSource(audience.source)),
    Boolean(base.audience.trim() || base.brandContext?.targetAudience?.trim())
  );

  const industry = deriveIndustry({
    explicitIndustry: base.brandContext?.industry,
    profile,
    companyGraph,
    inflightIndustry: inflight.industry,
    capabilityIndustry: capability.industry,
  });
  track("industry", mapKnowledgeSource(normalizeKnowledgeSource(industry.source)), Boolean(base.brandContext?.industry?.trim()));

  const usps = deriveUniqueSellingPoints({
    explicitUsps: base.brandContext?.uniqueSellingPoints,
    profile,
    companyGraph,
    marketingIntelligence,
    inflightUsps: inflight.uniqueSellingPoints,
    capabilityUsps: capability.uniqueSellingPoints,
  });
  track(
    "uniqueValueProposition",
    mapKnowledgeSource(normalizeKnowledgeSource(usps.source)),
    Boolean(base.brandContext?.uniqueSellingPoints?.filter(Boolean).length)
  );

  const products = deriveProductsAndServices({
    explicitProducts: base.brandContext?.productsAndServices,
    description: base.description,
    profile,
    companyGraph,
    inflightProducts: inflight.productsAndServices,
    capabilityProducts: capability.productsAndServices,
  });
  track(
    "productOrService",
    mapKnowledgeSource(normalizeKnowledgeSource(products.source)),
    Boolean(
      base.brandContext?.productsAndServices?.filter(Boolean).length ||
        base.description.trim().length >= 20
    )
  );

  const website = deriveWebsiteKnowledge({
    websiteUrl: base.websiteUrl,
    websiteSkipped: base.websiteSource === "skipped" || base.websiteState === "skipped",
    profile,
    websiteSnapshot: bundle.companyWebsiteSnapshot,
    research,
    inflightWebsiteKnown: inflight.websiteKnown,
    inflightWebsiteUrl: inflight.websiteUrl,
    capabilityWebsiteUrl: capability.websiteUrl,
    capabilityWebsiteSemantic: capability.websiteSemantic,
  });
  track(
    "website",
    mapKnowledgeSource(normalizeKnowledgeSource(website.source)),
    Boolean(base.websiteUrl || base.websiteSource === "skipped" || base.websiteState === "skipped")
  );

  const competitors = deriveCompetitorKnowledge({
    competitors: base.competitors,
    competitorsSkipped: base.competitorsSkipped,
    profile,
    research,
    marketingIntelligence,
    inflightCompetitors: inflight.competitors,
    capabilityCompetitors: capability.competitors,
    capabilityCompetitorsSkipped: capability.competitorsExplicitlySkipped,
    capabilityCompetitorsHasEvidence: capability.competitorsHasEvidence,
  });
  track(
    "competitors",
    mapKnowledgeSource(normalizeKnowledgeSource(competitors.source)),
    Boolean(base.competitors.length > 0 || base.competitorsSkipped)
  );

  const knowledgeSources: StrategyReadinessKnowledgeDimensions = {
    targetAudience: {
      value: audience.value,
      source: normalizeKnowledgeSource(audience.source),
    },
    industry: {
      value: industry.value,
      source: normalizeKnowledgeSource(industry.source),
    },
    uniqueValueProposition: {
      values: usps.values,
      source: normalizeKnowledgeSource(usps.source),
    },
    productOrService: {
      values: products.values,
      source: normalizeKnowledgeSource(products.source),
    },
    website: {
      url: website.url,
      semantic: website.semantic,
      source: normalizeKnowledgeSource(website.source),
    },
    competitors: {
      explicitlySkipped: competitors.explicitlySkipped,
      hasEvidence: competitors.known,
      source: normalizeKnowledgeSource(competitors.source),
    },
  };

  const brandContext = mergeBrandContext(base, {
    industry: industry.value,
    targetAudience: audience.value,
    uniqueSellingPoints: usps.values,
    productsAndServices: products.values,
  });

  let websiteState = base.websiteState;
  let websiteSource = base.websiteSource;
  let websiteUrl = base.websiteUrl;
  if (website.explicitlySkipped || website.semantic === "not_applicable") {
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

  const readiness = evaluateStrategyContextReadiness(effectiveContext);

  return {
    effectiveContext,
    explicitFieldCount,
    derivedFieldCount,
    derivedFields,
    sourceKinds: [...sourceKinds],
    knowledgeSources,
    unresolved: collectUnresolved(readiness),
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
