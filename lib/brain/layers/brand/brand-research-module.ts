import type { BrandConceptId } from "./types";

export type BrandResearchModuleId =
  | "profile_brand_research"
  | "capability_brand_research"
  | "campaign_brand_research"
  | "website_messaging_research"
  | "visual_identity_research"
  | "channel_style_research";

export type BrandResearchModuleSpec = {
  readonly id: BrandResearchModuleId;
  readonly version: string;
  readonly purpose: string;
  readonly implemented: boolean;
  readonly concepts: readonly BrandConceptId[];
  readonly inputDescription: string;
  readonly outputDescription: string;
};

export type BrandResearchModuleInput = {
  readonly organizationId: string;
  readonly campaignId?: string;
};

export type BrandResearchModuleOutput = {
  readonly moduleId: BrandResearchModuleId;
  readonly observationCount: number;
  readonly unknownCount: number;
};

export function averageBrandModuleConfidence(scores: readonly number[]): number {
  if (scores.length === 0) return 0;
  return scores.reduce((sum, s) => sum + s, 0) / scores.length;
}
