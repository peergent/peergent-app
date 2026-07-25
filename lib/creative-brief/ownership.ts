/**
 * Architectural ownership for the Creative Brief Engine (domain boundary only).
 * Brand Brain, Business Brain, Performance, Renderer, Publishing, and Templates
 * remain separate dependencies — not modeled inside this module.
 */

/** Content sections owned exclusively by the Creative Brief. */
export const CREATIVE_BRIEF_OWNED_MODULES = [
  "campaignGoal",
  "audience",
  "channel",
  "contentType",
  "tone",
  "cta",
  "messagingPriorities",
  "visualPriorities",
  "requiredAssets",
  "forbiddenClaims",
  "forbiddenWords",
  "requiredDisclaimers",
  "platformConstraints",
  "outputRequirements",
  "approvalRequirements",
] as const;

export type CreativeBriefOwnedModule = (typeof CREATIVE_BRIEF_OWNED_MODULES)[number];

/** External systems that must not be duplicated inside Creative Brief types. */
export const CREATIVE_BRIEF_EXCLUDED_CONCERNS = [
  "brandBrain",
  "businessBrain",
  "performance",
  "renderer",
  "publishing",
  "templates",
] as const;

export type CreativeBriefExcludedConcern =
  (typeof CREATIVE_BRIEF_EXCLUDED_CONCERNS)[number];

/** Human-readable scope for each owned module (documentation and tests). */
export const CREATIVE_BRIEF_MODULE_DESCRIPTIONS: Readonly<
  Record<CreativeBriefOwnedModule, string>
> = {
  campaignGoal: "What the campaign must achieve before any model runs.",
  audience: "Who the creative is for: segment, pains, and triggers.",
  channel: "Where the creative will appear, including placement notes.",
  contentType: "The deliverable shape (post, email, ad, etc.).",
  tone: "Voice directive for this brief, separate from long-lived Brand Brain.",
  cta: "Primary and secondary calls to action for this execution.",
  messagingPriorities: "Ranked messages and proof points for this piece.",
  visualPriorities: "What must be shown or avoided visually in this execution.",
  requiredAssets: "Asset IDs or roles that must appear in the output.",
  forbiddenClaims: "Claims that must not appear in generated copy.",
  forbiddenWords: "Words or phrases blocked for this brief.",
  requiredDisclaimers: "Legal or compliance text that must be included.",
  platformConstraints: "Character limits, ratios, safe zones, and platform rules.",
  outputRequirements: "Deliverable formats, variants, and accessibility expectations.",
  approvalRequirements: "Review gates before publish or handoff to renderer.",
};

/** Every owned module is required on a complete CreativeBrief. */
export const CREATIVE_BRIEF_REQUIRED_SECTIONS = CREATIVE_BRIEF_OWNED_MODULES;

export type CreativeBriefRequiredSection =
  (typeof CREATIVE_BRIEF_REQUIRED_SECTIONS)[number];

/** Section keys used for future completeness scoring. */
export const CREATIVE_BRIEF_GAPS = CREATIVE_BRIEF_OWNED_MODULES;

export type CreativeBriefGap = CreativeBriefOwnedModule;
