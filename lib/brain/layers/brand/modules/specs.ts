import type { BrandResearchModuleSpec } from "../brand-research-module";

export const PROFILE_BRAND_RESEARCH_SPEC: BrandResearchModuleSpec = {
  id: "profile_brand_research",
  version: "1.0.0",
  purpose: "Collect brand evidence from company profile — positioning, tone, promises.",
  implemented: true,
  concepts: ["mission", "vision", "values", "personality", "tone_of_voice", "messaging", "audience"],
  inputDescription: "CompanySnapshot profile fields with provenance.",
  outputDescription: "BrandResearchObservation nodes — evidence only, no interpretation.",
};

export const CAPABILITY_BRAND_RESEARCH_SPEC: BrandResearchModuleSpec = {
  id: "capability_brand_research",
  version: "1.0.0",
  purpose: "Collect brand evidence from brand_understanding capability output.",
  implemented: true,
  concepts: ["tone_of_voice", "messaging", "personality", "values"],
  inputDescription: "BrainStructuredOutput from brand_understanding capability.",
  outputDescription: "Observation nodes mapped from capability findings.",
};

export const CAMPAIGN_BRAND_RESEARCH_SPEC: BrandResearchModuleSpec = {
  id: "campaign_brand_research",
  version: "1.0.0",
  purpose: "Collect brand evidence from campaign-supplied brand context.",
  implemented: true,
  concepts: ["mission", "values", "personality", "audience", "tone_of_voice", "messaging"],
  inputDescription: "CampaignSetup campaignBrandContext from customer.",
  outputDescription: "Observation nodes from customer-supplied campaign brand context.",
};

export const WEBSITE_MESSAGING_RESEARCH_SPEC: BrandResearchModuleSpec = {
  id: "website_messaging_research",
  version: "1.0.0",
  purpose: "Collect messaging signals from website understanding — no visual pixel data.",
  implemented: true,
  concepts: ["messaging", "writing_style", "cta_style"],
  inputDescription: "Website understanding capability findings.",
  outputDescription: "Messaging-related observations from website content.",
};

export const VISUAL_IDENTITY_RESEARCH_SPEC: BrandResearchModuleSpec = {
  id: "visual_identity_research",
  version: "1.0.0",
  purpose: "Collect high-level visual identity signals — not pixel-level rendering.",
  implemented: false,
  concepts: [
    "visual_identity",
    "color_system",
    "typography",
    "spacing",
    "photography",
    "illustration",
    "motion",
  ],
  inputDescription: "Brandbook uploads, design system references (future).",
  outputDescription: "Visual identity observations without pixel specifications.",
};

export const CHANNEL_STYLE_RESEARCH_SPEC: BrandResearchModuleSpec = {
  id: "channel_style_research",
  version: "1.0.0",
  purpose: "Collect channel-specific brand style evidence.",
  implemented: false,
  concepts: ["email_style", "social_style", "advertising_style", "layouts", "buttons", "icons"],
  inputDescription: "Channel examples, templates, past campaigns (future).",
  outputDescription: "Channel style observations.",
};

export const BRAND_RESEARCH_MODULE_SPECS: readonly BrandResearchModuleSpec[] = [
  PROFILE_BRAND_RESEARCH_SPEC,
  CAPABILITY_BRAND_RESEARCH_SPEC,
  CAMPAIGN_BRAND_RESEARCH_SPEC,
  WEBSITE_MESSAGING_RESEARCH_SPEC,
  VISUAL_IDENTITY_RESEARCH_SPEC,
  CHANNEL_STYLE_RESEARCH_SPEC,
];

export function getBrandResearchModuleSpec(
  id: BrandResearchModuleSpec["id"]
): BrandResearchModuleSpec | undefined {
  return BRAND_RESEARCH_MODULE_SPECS.find((spec) => spec.id === id);
}
