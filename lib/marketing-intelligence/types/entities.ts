export type BrandPositioning = {
  positioningStatement?: string;
  tagline?: string;
  valueProposition?: string;
  keyMessages: string[];
  marketCategory?: string;
};

export type MarketingGoalStatus = "active" | "planned" | "completed" | "paused";

export type MarketingGoal = {
  id: string;
  marketingProfileId: string;
  title: string;
  description?: string;
  priority: number;
  timeframe?: string;
  status: MarketingGoalStatus;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type MarketingContentType =
  | "blog_post"
  | "social_post"
  | "email"
  | "landing_page"
  | "video"
  | "case_study"
  | "whitepaper"
  | "other";

export type MarketingContentItem = {
  id: string;
  marketingProfileId: string;
  title: string;
  contentType: MarketingContentType;
  channel?: string;
  summary?: string;
  sourceUrl?: string;
  publishedAt?: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type MarketingProfile = {
  id: string;
  organizationId: string;
  brandPositioning: BrandPositioning;
  createdAt: string;
  updatedAt: string;
};

export type MarketingProfileAggregate = MarketingProfile & {
  goals: MarketingGoal[];
  contentItems: MarketingContentItem[];
};

export type UpdateMarketingProfileInput = {
  brandPositioning?: BrandPositioning;
};

export type CreateMarketingGoalInput = Omit<
  MarketingGoal,
  "id" | "marketingProfileId" | "createdAt" | "updatedAt"
>;

export type UpdateMarketingGoalInput = Partial<
  Omit<CreateMarketingGoalInput, "sortOrder"> & { sortOrder?: number }
>;

export type CreateMarketingContentInput = Omit<
  MarketingContentItem,
  "id" | "marketingProfileId" | "createdAt" | "updatedAt"
>;

export type UpdateMarketingContentInput = Partial<
  Omit<CreateMarketingContentInput, "sortOrder"> & { sortOrder?: number }
>;
