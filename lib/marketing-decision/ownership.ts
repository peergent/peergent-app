/**
 * Architectural ownership for the Marketing Decision Engine (domain boundary only).
 * Deterministic policy and evidence — not LLM generation, storage, or rendering.
 */

/** Decision capabilities owned exclusively by Marketing Decision. */
export const MARKETING_DECISION_OWNED_MODULES = [
  "eligibility",
  "readiness",
  "constraints",
  "approvalPolicy",
  "budgetPolicy",
  "channelRecommendations",
  "contentTypeRecommendations",
  "ctaStrategy",
  "creativeVolume",
  "forbiddenClaims",
  "forbiddenWords",
  "requiredDisclaimers",
  "evidence",
  "gaps",
] as const;

export type MarketingDecisionOwnedModule =
  (typeof MARKETING_DECISION_OWNED_MODULES)[number];

/** Systems and artifacts that must not be duplicated inside Marketing Decision types. */
export const MARKETING_DECISION_EXCLUDED_CONCERNS = [
  "brandBrain",
  "businessBrain",
  "marketBrain",
  "performanceBrain",
  "marketingStrategy",
  "marketingPlan",
  "creativeBrief",
  "generatedCopy",
  "templates",
  "rendering",
  "publishing",
  "storage",
] as const;

export type MarketingDecisionExcludedConcern =
  (typeof MARKETING_DECISION_EXCLUDED_CONCERNS)[number];

export const MARKETING_DECISION_MODULE_DESCRIPTIONS: Readonly<
  Record<MarketingDecisionOwnedModule, string>
> = {
  eligibility: "Whether creative execution may proceed under current context and policy.",
  readiness: "Interpretation of intelligence completeness and confidence ceilings.",
  constraints: "Hard rules that recommendations and generation must obey.",
  approvalPolicy: "Human gates before generation or publication.",
  budgetPolicy: "Spend autonomy and monthly limits from responsibility guardrails.",
  channelRecommendations: "Ranked channel options with policy status and evidence.",
  contentTypeRecommendations: "Ranked content types with draftability and evidence.",
  ctaStrategy: "CTA pattern constraints — not final marketing copy.",
  creativeVolume: "Bounds on how many creatives this decision authorizes.",
  forbiddenClaims: "Claims that must not appear in generated output.",
  forbiddenWords: "Words or phrases blocked for this execution.",
  requiredDisclaimers: "Compliance text that must accompany output.",
  evidence: "Pointers to inputs that justified each recommendation.",
  gaps: "Missing inputs required for a complete decision.",
};

export const MARKETING_DECISION_GAPS = [
  "marketingUnderstanding",
  "companyDna",
  "businessBrain",
  "brandBrain",
  "marketingStrategy",
  "marketingPlan",
  "planActivity",
  "responsibilityPolicy",
  "campaignObjective",
  "budgetConstraint",
] as const;

export type MarketingDecisionGap = (typeof MARKETING_DECISION_GAPS)[number];
