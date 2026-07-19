import type { CompanyValue, ToneOfVoice } from "@/lib/company-dna";

/** Dimensions tracked for completeness scoring. */
export type MarketingUnderstandingDimension =
  | "companyDna"
  | "brandPositioning"
  | "products"
  | "services"
  | "customerSegments"
  | "competitors"
  | "goals"
  | "existingContent";

export type MarketingBrandUnderstanding = {
  mission?: string;
  values: CompanyValue[];
  toneOfVoice: ToneOfVoice;
  positioningStatement?: string;
  tagline?: string;
  valueProposition?: string;
  keyMessages: string[];
  marketCategory?: string;
};

export type MarketingProductSummary = {
  id: string;
  name: string;
  description?: string;
  category?: string;
};

export type MarketingServiceSummary = {
  id: string;
  name: string;
  description?: string;
  category?: string;
};

export type MarketingSegmentSummary = {
  id: string;
  name: string;
  description?: string;
  painPoints: string[];
  buyingTriggers: string[];
};

export type MarketingCompetitorSummary = {
  id: string;
  name: string;
  strengths: string[];
  weaknesses: string[];
  differentiators: string[];
};

export type MarketingGoalSummary = {
  id: string;
  title: string;
  description?: string;
  status: string;
  timeframe?: string;
  priority: number;
};

export type MarketingContentSummary = {
  id: string;
  title: string;
  contentType: string;
  channel?: string;
  summary?: string;
  sourceUrl?: string;
  publishedAt?: string;
};

/**
 * Structured summary of everything the Marketing Peer needs to know
 * before creating strategies or content.
 */
export type MarketingUnderstanding = {
  available: boolean;
  sparse: boolean;
  completeness: number;
  gaps: MarketingUnderstandingDimension[];
  brand: MarketingBrandUnderstanding;
  products: MarketingProductSummary[];
  services: MarketingServiceSummary[];
  customerSegments: MarketingSegmentSummary[];
  competitors: MarketingCompetitorSummary[];
  goals: MarketingGoalSummary[];
  existingContent: MarketingContentSummary[];
  assembledAt: string;
};
