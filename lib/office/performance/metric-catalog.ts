import type { IntegrationProviderId } from "@/lib/integrations/types";
import type { MarketingCampaignLocale } from "@/lib/i18n/marketing-campaign-copy";

/**
 * What the Office knows how to render, keyed by the metric key the domain
 * already uses.
 *
 * ## Why this exists
 *
 * The Office reached its metrics through `EXECUTIVE_METRIC_DEFS`, a six-item
 * allowlist that matched by *label keyword* — it looked for the substring
 * "reach" inside a metric's display name. That is fragile in two ways: it
 * silently broke the moment the labels were translated, and it discarded the
 * thirty other metric keys the domain already models.
 *
 * This catalogue keys on `MetricSnapshot.metricKey`, which is the stable
 * identifier, and covers every key named by `PERFORMANCE_PAGE_SECTIONS`.
 * Nothing here invents a metric: a definition only says *how to present* a
 * figure if a connected source reports it. An unreported key renders nothing.
 *
 * ## kind
 *
 * `outcome` is something that happened to the business — revenue, leads,
 * reach, clicks, return. `activity` is what was produced or spent — published
 * counts, tasks, ad spend. Marketing is about improving the business, so
 * outcomes outrank activity everywhere they meet.
 *
 * ## upIsGood
 *
 * Not every rise is good news. Cost-per-acquisition climbing is bad; average
 * search position climbing is bad, because position 1 beats position 9.
 * Without this the palette would colour both green.
 */

export type OfficeMetricKind = "outcome" | "activity";

export type OfficeMetricDef = {
  key: string;
  label: Record<MarketingCampaignLocale, string>;
  kind: OfficeMetricKind;
  /** False where a rising number is worse for the business. */
  upIsGood: boolean;
  /**
   * Sources that can legitimately report this. Used to state provenance, and
   * to refuse a figure arriving from somewhere that cannot know it.
   */
  providers: IntegrationProviderId[];
  /**
   * Ranking inside the executive row. Lower leads. Revenue outranks reach
   * because a business owner asks "did this make money" before "who saw it".
   */
  priority: number;
};

const def = (
  key: string,
  en: string,
  nl: string,
  kind: OfficeMetricKind,
  providers: IntegrationProviderId[],
  priority: number,
  upIsGood = true
): OfficeMetricDef => ({
  key,
  label: { en, nl },
  kind,
  upIsGood,
  providers,
  priority,
});

export const OFFICE_METRIC_CATALOG: readonly OfficeMetricDef[] = [
  /* ---- Business outcomes, in the order an owner asks about them --------- */
  def("attributed_revenue", "Revenue influenced", "Beïnvloede omzet", "outcome", ["ga4", "hubspot"], 10),
  def("attributed_leads", "Attributed leads", "Toegeschreven leads", "outcome", ["ga4", "hubspot"], 20),
  def("leads", "Leads", "Leads", "outcome", ["hubspot", "ga4"], 30),
  def("campaign_leads", "Campaign leads", "Leads uit campagnes", "outcome", ["ga4", "meta", "google_ads"], 40),
  def("roas", "ROAS", "ROAS", "outcome", ["meta", "google_ads"], 50),
  def("campaign_roas", "Campaign ROAS", "ROAS per campagne", "outcome", ["meta", "google_ads"], 60),

  /* ---- Cost efficiency. A rise is bad news. ----------------------------- */
  def("cpa", "Cost per acquisition", "Kosten per acquisitie", "outcome", ["meta", "google_ads"], 70, false),
  def("campaign_cpa", "Campaign CPA", "CPA per campagne", "outcome", ["meta", "google_ads"], 80, false),
  def("cpc", "Cost per click", "Kosten per klik", "outcome", ["meta", "google_ads"], 90, false),

  /* ---- Audience and engagement ----------------------------------------- */
  def("reach", "Reach", "Bereik", "outcome", ["ga4", "linkedin", "instagram", "meta"], 100),
  def("ctr", "Click-through rate", "Doorklikratio", "outcome", ["meta", "google_ads", "search_console"], 110),
  def("engagement", "Engagement", "Interactie", "outcome", ["linkedin", "instagram", "meta"], 120),
  def("linkedin_reach", "LinkedIn reach", "Bereik op LinkedIn", "outcome", ["linkedin"], 130),
  def("instagram_reach", "Instagram reach", "Bereik op Instagram", "outcome", ["instagram"], 140),
  def("content_clicks", "Content clicks", "Kliks op content", "outcome", ["ga4", "linkedin", "instagram"], 150),
  def("content_engagement", "Content engagement", "Interactie op content", "outcome", ["linkedin", "instagram", "ga4"], 160),

  /* ---- Organic visibility ---------------------------------------------- */
  def("seo_clicks", "Search clicks", "Kliks uit zoeken", "outcome", ["search_console"], 170),
  def("seo_impressions", "Search impressions", "Vertoningen in zoeken", "outcome", ["search_console"], 180),
  // Position 1 beats position 9, so a rising number is worse.
  def("seo_rankings", "Average position", "Gemiddelde positie", "outcome", ["search_console"], 190, false),

  /* ---- Inputs and production. Real, useful, deliberately secondary. ----- */
  def("meta_spend", "Meta spend", "Uitgaven Meta", "activity", ["meta"], 200, false),
  def("google_spend", "Google Ads spend", "Uitgaven Google Ads", "activity", ["google_ads"], 210, false),
  def("hours_saved", "Hours saved", "Bespaarde tijd", "activity", [], 220),
  def("content_published", "Published", "Gepubliceerd", "activity", [], 230),
  def("tasks_completed", "Tasks completed", "Taken afgerond", "activity", [], 240),
];

const BY_KEY = new Map(OFFICE_METRIC_CATALOG.map((entry) => [entry.key, entry]));

export function officeMetricDef(key: string): OfficeMetricDef | null {
  return BY_KEY.get(key) ?? null;
}

/**
 * Whether a provider is allowed to report a key.
 *
 * Definitions with no providers are internally counted (published, tasks) and
 * accept the `operational` source only. Anything else arriving from an
 * unexpected provider is dropped rather than displayed, because a figure whose
 * provenance we cannot state is a figure we cannot defend.
 */
export function providerCanReport(def: OfficeMetricDef, provider: string): boolean {
  if (def.providers.length === 0) return provider === "operational";
  return (def.providers as string[]).includes(provider);
}
