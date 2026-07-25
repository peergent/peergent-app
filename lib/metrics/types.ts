import type { IntegrationProviderId } from "@/lib/integrations/types";

/** Stored metric snapshot — populated only from connected integrations or operational data. */
export type MetricSnapshot = {
  id: string;
  peerId: string;
  provider: IntegrationProviderId | "operational";
  metricKey: string;
  label: string;
  value: string;
  unit: string | null;
  periodStart: string | null;
  periodEnd: string | null;
  recordedAt: string;
};

export type PerformanceSectionId =
  | "overview"
  | "channels"
  | "campaigns"
  | "content"
  | "seo"
  | "ads"
  | "attribution"
  | "workforce_roi";

export type PerformancePageSection = {
  id: PerformanceSectionId;
  title: string;
  description: string;
  metricKeys: string[];
  requiresConnection: IntegrationProviderId[];
};

export const PERFORMANCE_PAGE_SECTIONS: PerformancePageSection[] = [
  {
    id: "overview",
    title: "Overview",
    description: "Reach, engagement, leads, and hours saved across connected channels.",
    metricKeys: ["reach", "engagement", "leads", "hours_saved"],
    requiresConnection: ["ga4"],
  },
  {
    id: "channels",
    title: "Channels",
    description: "LinkedIn, Instagram, Meta Ads, Google Ads, and email performance.",
    metricKeys: ["linkedin_reach", "instagram_reach", "meta_spend", "google_spend"],
    requiresConnection: ["linkedin", "instagram", "meta", "google_ads"],
  },
  {
    id: "campaigns",
    title: "Campaigns",
    description: "Top campaigns, attribution, and ROAS.",
    metricKeys: ["campaign_roas", "campaign_leads", "campaign_cpa"],
    requiresConnection: ["ga4", "meta", "google_ads"],
  },
  {
    id: "content",
    title: "Content performance",
    description: "Posts, newsletters, and landing pages.",
    metricKeys: ["content_engagement", "content_clicks"],
    requiresConnection: ["ga4", "linkedin", "instagram"],
  },
  {
    id: "seo",
    title: "SEO",
    description: "Rankings, Search Console visibility, and content gaps.",
    metricKeys: ["seo_clicks", "seo_impressions", "seo_rankings"],
    requiresConnection: ["search_console"],
  },
  {
    id: "ads",
    title: "Paid media",
    description: "CPC, CTR, CPA, and budget recommendations.",
    metricKeys: ["cpc", "ctr", "cpa", "roas"],
    requiresConnection: ["meta", "google_ads"],
  },
  {
    id: "attribution",
    title: "Attribution",
    description: "Traffic, funnels, and revenue influenced by Emma.",
    metricKeys: ["attributed_leads", "attributed_revenue"],
    requiresConnection: ["ga4", "hubspot"],
  },
  {
    id: "workforce_roi",
    title: "AI workforce ROI",
    description: "Hours saved, content output, and business value from Emma.",
    metricKeys: ["hours_saved", "content_published", "tasks_completed"],
    requiresConnection: [],
  },
];
