/**
 * Architectural ownership for the Campaign domain (boundary only).
 * Campaign coordinates marketing work — it does not embed intelligence,
 * creative payloads, assets, rendering, or publishing.
 */

/** Top-level sections owned exclusively by Campaign. */
export const CAMPAIGN_OWNED_MODULES = [
  "goal",
  "audience",
  "execution",
  "references",
  "performance",
  "workforce",
] as const;

export type CampaignOwnedModule = (typeof CAMPAIGN_OWNED_MODULES)[number];

/** External systems and payloads that must not be duplicated inside Campaign types. */
export const CAMPAIGN_EXCLUDED_CONCERNS = [
  "brandBrain",
  "businessBrain",
  "marketingUnderstanding",
  "creativeBriefContents",
  "marketingDecisionContents",
  "assets",
  "generatedContentBodies",
  "renderer",
  "publishing",
  "contextEngine",
  "promptBuilder",
  "aiRuntime",
  "storage",
] as const;

export type CampaignExcludedConcern = (typeof CAMPAIGN_EXCLUDED_CONCERNS)[number];

export const CAMPAIGN_MODULE_DESCRIPTIONS: Readonly<
  Record<CampaignOwnedModule, string>
> = {
  goal:
    "Business and marketing objectives plus success metrics for the campaign unit.",
  audience:
    "Target audience summary, personas, and segment references — not full segment records.",
  execution:
    "Channels, timeline, lifecycle status, budget envelope, and approval mode.",
  references:
    "Opaque IDs linking to decisions, briefs, generated content, and assets — not their payloads.",
  performance:
    "KPI placeholders, progress snapshot, and operational recommendations.",
  workforce:
    "Participating AI worker roles, status, responsibility scope, and completion.",
};

/** Identity fields live on the Campaign root (id, organizationId, name, description). */
export const CAMPAIGN_IDENTITY_FIELDS = [
  "id",
  "organizationId",
  "name",
  "description",
] as const;

export type CampaignIdentityField = (typeof CAMPAIGN_IDENTITY_FIELDS)[number];

/** Every owned module is required on a complete Campaign record. */
export const CAMPAIGN_REQUIRED_SECTIONS = CAMPAIGN_OWNED_MODULES;

export type CampaignRequiredSection = (typeof CAMPAIGN_REQUIRED_SECTIONS)[number];

/** Section keys used for future completeness scoring. */
export const CAMPAIGN_GAPS = CAMPAIGN_OWNED_MODULES;

export type CampaignGap = CampaignOwnedModule;
