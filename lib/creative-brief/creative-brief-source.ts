import type { BrandBrainContextSlice } from "@/lib/brand-brain/types";
import type { MarketingDecisionRecord } from "@/lib/marketing-decision";

/** Optional audience context — only supplied facts, never inferred markets. */
export type CreativeBriefAudienceInput = {
  readonly segmentLabel?: string;
  readonly description?: string;
  readonly painPoints?: readonly string[];
  readonly buyingTriggers?: readonly string[];
};

/** Optional business context — proof points supplied by caller only. */
export type CreativeBriefBusinessInput = {
  readonly proofPoints?: readonly string[];
};

/** Readonly assembler input — no React, Supabase, or framework request types. */
export type CreativeBriefSource = {
  readonly decision: MarketingDecisionRecord;
  readonly brand: BrandBrainContextSlice;
  readonly audience?: CreativeBriefAudienceInput;
  readonly business?: CreativeBriefBusinessInput;
  /** Explicit channel id matching decision recommendation ids (e.g. linkedin). */
  readonly requestedChannelId?: string;
  /** Explicit content type id matching decision recommendation ids (e.g. linkedin_post). */
  readonly requestedContentTypeId?: string;
  readonly assembledAt: string;
  readonly campaignId?: string;
  readonly projectId?: string;
  readonly briefTitle?: string;
};

export type CreativeBriefBrandInput = BrandBrainContextSlice;
