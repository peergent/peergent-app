import type { CompanyDnaContextSlice } from "@/lib/intelligence/types/company-dna-context-slice";
import type { BusinessBrainContextSlice } from "@/lib/intelligence/types/business-brain-context-slice";
import type { MarketingProfileAggregate } from "../types";
import type {
  MarketingUnderstanding,
  MarketingUnderstandingDimension,
} from "../types/understanding";

const UNDERSTANDING_DIMENSIONS: MarketingUnderstandingDimension[] = [
  "companyDna",
  "brandPositioning",
  "products",
  "services",
  "customerSegments",
  "competitors",
  "goals",
  "existingContent",
];

function hasBrandPositioning(profile: MarketingProfileAggregate): boolean {
  const bp = profile.brandPositioning;
  if (!bp) return false;

  return Boolean(
    bp.positioningStatement?.trim() ||
      bp.tagline?.trim() ||
      bp.valueProposition?.trim() ||
      (bp.keyMessages?.length ?? 0) > 0 ||
      bp.marketCategory?.trim()
  );
}

function hasCompanyDna(dna: CompanyDnaContextSlice): boolean {
  return Boolean(
    dna.mission?.trim() ||
      dna.values.length > 0 ||
      dna.toneOfVoice.summary?.trim() ||
      (dna.toneOfVoice.personality?.length ?? 0) > 0 ||
      dna.riskProfile.summary?.trim() ||
      dna.decisionPrinciples.length > 0
  );
}

function computeCompleteness(
  coverage: Record<MarketingUnderstandingDimension, boolean>
): { completeness: number; gaps: MarketingUnderstandingDimension[] } {
  const gaps = UNDERSTANDING_DIMENSIONS.filter((dimension) => !coverage[dimension]);
  const filled = UNDERSTANDING_DIMENSIONS.length - gaps.length;
  const completeness = Math.round((filled / UNDERSTANDING_DIMENSIONS.length) * 100);

  return { completeness, gaps };
}

export type BuildMarketingUnderstandingInput = {
  companyDna: CompanyDnaContextSlice;
  businessBrain: BusinessBrainContextSlice;
  marketingProfile: MarketingProfileAggregate;
};

/** Composes a structured Marketing Understanding from domain intelligence inputs. */
export function buildMarketingUnderstanding(
  input: BuildMarketingUnderstandingInput
): MarketingUnderstanding {
  const { companyDna, businessBrain, marketingProfile } = input;

  const coverage: Record<MarketingUnderstandingDimension, boolean> = {
    companyDna: hasCompanyDna(companyDna),
    brandPositioning: hasBrandPositioning(marketingProfile),
    products: businessBrain.products.length > 0,
    services: businessBrain.services.length > 0,
    customerSegments: businessBrain.customerSegments.length > 0,
    competitors: businessBrain.competitors.length > 0,
    goals: marketingProfile.goals.length > 0,
    existingContent: marketingProfile.contentItems.length > 0,
  };

  const { completeness, gaps } = computeCompleteness(coverage);
  const sparse = completeness < 50;

  const understanding: MarketingUnderstanding = {
    available: completeness > 0,
    sparse,
    completeness,
    gaps,
    brand: {
      mission: companyDna.mission,
      values: companyDna.values,
      toneOfVoice: companyDna.toneOfVoice,
      positioningStatement: marketingProfile.brandPositioning.positioningStatement,
      tagline: marketingProfile.brandPositioning.tagline,
      valueProposition: marketingProfile.brandPositioning.valueProposition,
      keyMessages: marketingProfile.brandPositioning.keyMessages,
      marketCategory: marketingProfile.brandPositioning.marketCategory,
    },
    products: businessBrain.products.map((product) => ({
      id: product.id,
      name: product.name,
      description: product.description,
      category: product.category,
    })),
    services: businessBrain.services.map((service) => ({
      id: service.id,
      name: service.name,
      description: service.description,
      category: service.category,
    })),
    customerSegments: businessBrain.customerSegments.map((segment) => ({
      id: segment.id,
      name: segment.name,
      description: segment.description,
      painPoints: segment.painPoints,
      buyingTriggers: segment.buyingTriggers,
    })),
    competitors: businessBrain.competitors.map((competitor) => ({
      id: competitor.id,
      name: competitor.name,
      strengths: competitor.strengths,
      weaknesses: competitor.weaknesses,
      differentiators: competitor.differentiators,
    })),
    goals: marketingProfile.goals.map((goal) => ({
      id: goal.id,
      title: goal.title,
      description: goal.description,
      status: goal.status,
      timeframe: goal.timeframe,
      priority: goal.priority,
    })),
    existingContent: marketingProfile.contentItems.map((item) => ({
      id: item.id,
      title: item.title,
      contentType: item.contentType,
      channel: item.channel,
      summary: item.summary,
      sourceUrl: item.sourceUrl,
      publishedAt: item.publishedAt,
    })),
    assembledAt: new Date().toISOString(),
  };

  return understanding;
}

export function emptyMarketingUnderstanding(): MarketingUnderstanding {
  return {
    available: false,
    sparse: true,
    completeness: 0,
    gaps: [...UNDERSTANDING_DIMENSIONS],
    brand: {
      values: [],
      toneOfVoice: {},
      keyMessages: [],
    },
    products: [],
    services: [],
    customerSegments: [],
    competitors: [],
    goals: [],
    existingContent: [],
    assembledAt: new Date().toISOString(),
  };
}
