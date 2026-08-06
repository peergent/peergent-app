import type { ResearchModuleSpec } from "../research-module";

export const COMPANY_RESEARCH_SPEC: ResearchModuleSpec = {
  id: "company_research",
  version: "1.0.0",
  purpose: "Discover confirmed company facts — name, positioning, industry, goals.",
  legacyCapabilityId: "company_understanding",
  implemented: true,
  inputDescription: "CompanySnapshot with knownFacts and profile fields.",
  outputDescription: "Evidence nodes for company identity and positioning.",
};

export const WEBSITE_RESEARCH_SPEC: ResearchModuleSpec = {
  id: "website_research",
  version: "1.0.0",
  purpose: "Discover website-derived facts — pages, messaging, structure, URL state.",
  legacyCapabilityId: "website_understanding",
  implemented: true,
  inputDescription: "WebsiteSnapshot or customer-supplied URL.",
  outputDescription: "Evidence nodes for website findings; unknowns when URL-only.",
};

export const COMPETITOR_RESEARCH_SPEC: ResearchModuleSpec = {
  id: "competitor_research",
  version: "1.0.0",
  purpose: "Discover customer-supplied competitor identities — no live market scraping.",
  legacyCapabilityId: "competitor_understanding",
  implemented: true,
  inputDescription: "Campaign competitors and company profile mainCompetitors.",
  outputDescription: "Evidence nodes per competitor; unknowns when skipped or empty.",
};

export const PRODUCT_RESEARCH_SPEC: ResearchModuleSpec = {
  id: "product_research",
  version: "1.0.0",
  purpose: "Discover product catalog facts from profile and website.",
  implemented: false,
  inputDescription: "Company profile products, website product pages (future).",
  outputDescription: "Evidence nodes per product with provenance.",
};

export const AUDIENCE_RESEARCH_SPEC: ResearchModuleSpec = {
  id: "audience_research",
  version: "1.0.0",
  purpose: "Discover target audience and ICP signals from profile and campaign.",
  implemented: false,
  inputDescription: "Company profile targetAudiences, campaign audience.",
  outputDescription: "Evidence nodes for audience segments; unknowns when missing.",
};

export const SEO_RESEARCH_SPEC: ResearchModuleSpec = {
  id: "seo_research",
  version: "1.0.0",
  purpose: "Discover SEO signals — meta, structure, keywords (future crawl).",
  implemented: false,
  inputDescription: "Website crawl metadata, search console API (future).",
  outputDescription: "Evidence nodes for SEO findings.",
};

export const BRAND_RESEARCH_SPEC: ResearchModuleSpec = {
  id: "brand_research",
  version: "1.0.0",
  purpose: "Discover brand identity constraints — tone, positioning alignment.",
  legacyCapabilityId: "brand_understanding",
  implemented: false,
  inputDescription: "Brand Brain constraints, brand_understanding capability output.",
  outputDescription: "Evidence nodes for brand rules consumed by downstream Layers.",
};

export const MARKET_RESEARCH_SPEC: ResearchModuleSpec = {
  id: "market_research",
  version: "1.0.0",
  purpose: "Discover market landscape facts — category, trends (future tools).",
  legacyCapabilityId: "market_understanding",
  implemented: false,
  inputDescription: "Market tools, industry reports (future).",
  outputDescription: "Evidence nodes for market context.",
};

export const OFFER_RESEARCH_SPEC: ResearchModuleSpec = {
  id: "offer_research",
  version: "1.0.0",
  purpose: "Discover offer and pricing signals — never invent pricing.",
  implemented: false,
  inputDescription: "Website pricing pages, Business Brain pricing (future).",
  outputDescription: "Evidence or explicit unknown when pricing unavailable.",
};

export const RESEARCH_MODULE_SPECS: readonly ResearchModuleSpec[] = [
  COMPANY_RESEARCH_SPEC,
  WEBSITE_RESEARCH_SPEC,
  COMPETITOR_RESEARCH_SPEC,
  PRODUCT_RESEARCH_SPEC,
  AUDIENCE_RESEARCH_SPEC,
  SEO_RESEARCH_SPEC,
  BRAND_RESEARCH_SPEC,
  MARKET_RESEARCH_SPEC,
  OFFER_RESEARCH_SPEC,
];

export function getResearchModuleSpec(id: ResearchModuleSpec["id"]): ResearchModuleSpec {
  const spec = RESEARCH_MODULE_SPECS.find((s) => s.id === id);
  if (!spec) throw new Error(`Unknown research module: ${id}`);
  return spec;
}
