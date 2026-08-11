import type { CompanyDomainId } from "../types";

export type CompanyDomainSpec = {
  id: CompanyDomainId;
  title: string;
  purpose: string;
  layerOrder: number;
};

/** Canonical domain layer order for Company Graph. */
export const COMPANY_DOMAIN_SPECS: readonly CompanyDomainSpec[] = [
  { id: "organization", title: "Organization", purpose: "Legal entity, name, identity.", layerOrder: 1 },
  { id: "business", title: "Business", purpose: "Business model and commercial identity.", layerOrder: 2 },
  { id: "brand", title: "Brand", purpose: "Brand expression and governance.", layerOrder: 3 },
  { id: "products", title: "Products", purpose: "Product catalogue.", layerOrder: 4 },
  { id: "services", title: "Services", purpose: "Service catalogue.", layerOrder: 5 },
  { id: "audience", title: "Audience", purpose: "Target audiences and ICP signals.", layerOrder: 6 },
  { id: "ideal_customers", title: "Ideal Customers", purpose: "Customer types and sizing.", layerOrder: 7 },
  { id: "markets", title: "Markets", purpose: "Markets and regions served.", layerOrder: 8 },
  { id: "industry", title: "Industry", purpose: "Industry classification.", layerOrder: 9 },
  { id: "mission", title: "Mission", purpose: "Organizational mission.", layerOrder: 10 },
  { id: "vision", title: "Vision", purpose: "Long-term vision.", layerOrder: 11 },
  { id: "core_values", title: "Core Values", purpose: "Brand promises and values.", layerOrder: 12 },
  { id: "tone_of_voice", title: "Tone of Voice", purpose: "Communication tone.", layerOrder: 13 },
  { id: "writing_style", title: "Writing Style", purpose: "Writing conventions.", layerOrder: 14 },
  { id: "brand_rules", title: "Brand Rules", purpose: "Do's and don'ts.", layerOrder: 15 },
  { id: "visual_identity", title: "Visual Identity", purpose: "Visual brand system.", layerOrder: 16 },
  { id: "business_goals", title: "Business Goals", purpose: "Long-term goals.", layerOrder: 17 },
  { id: "usps", title: "USPs", purpose: "Unique selling points.", layerOrder: 18 },
  { id: "differentiators", title: "Differentiators", purpose: "What makes the company different.", layerOrder: 19 },
  { id: "competitive_position", title: "Competitive Position", purpose: "Customer-supplied positioning baseline.", layerOrder: 20 },
  { id: "website", title: "Website", purpose: "Website metadata — not crawl results.", layerOrder: 21 },
  { id: "knowledge_sources", title: "Knowledge Sources", purpose: "Registered source catalogue.", layerOrder: 22 },
  { id: "policies", title: "Policies", purpose: "Known limitations and policies.", layerOrder: 23 },
  { id: "legal_constraints", title: "Legal Constraints", purpose: "Legal and compliance constraints.", layerOrder: 24 },
  { id: "compliance", title: "Compliance", purpose: "Compliance requirements.", layerOrder: 25 },
  { id: "integrations", title: "Integrations", purpose: "Connected systems registry.", layerOrder: 26 },
  { id: "locations", title: "Locations", purpose: "Geographic presence.", layerOrder: 27 },
  { id: "languages", title: "Languages", purpose: "Supported languages.", layerOrder: 28 },
];

export const COMPANY_LAYER_ORDER: Readonly<Record<CompanyDomainId, number>> = Object.fromEntries(
  COMPANY_DOMAIN_SPECS.map((s) => [s.id, s.layerOrder])
) as Record<CompanyDomainId, number>;
