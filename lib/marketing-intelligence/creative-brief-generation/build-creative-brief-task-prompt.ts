import type { MarketingStrategy } from "../types/strategy";

const CREATIVE_DIRECTION_JSON_SCHEMA = `{
  "campaignConcept": "string — the core campaign idea in one clear paragraph",
  "campaignAngle": "string — the distinctive angle or hook for this campaign",
  "toneOfVoice": { "directive": "string", "traits": ["string"], "avoid": ["string"] },
  "visualDirection": { "summary": "string", "mustInclude": ["string"], "mustAvoid": ["string"] },
  "messagingHierarchy": {
    "primaryMessage": "string",
    "supportingMessages": ["string"],
    "proofPoints": ["string"]
  },
  "ctaDirection": { "primary": "string", "secondary": "string" },
  "mandatoryBrandConstraints": {
    "forbiddenClaims": ["string"],
    "forbiddenWords": ["string"],
    "requiredDisclaimers": ["string"]
  },
  "creativeRecommendations": ["string — actionable creative guidance for production"]
}`;

export function buildMarketingCreativeBriefTaskAppendix(strategy: MarketingStrategy): string {
  return [
    "You are operating as the Marketing Creative Director.",
    "Produce a campaign creative direction brief grounded in the approved Marketing Strategy and verified context.",
    "Do NOT write finished ads, posts, or publishable copy — direction and constraints only.",
    "",
    "Approved strategy summary (must align with this):",
    strategy.summary,
    "",
    "Requirements:",
    "- campaignConcept and campaignAngle must be distinct and campaign-specific.",
    "- toneOfVoice, visualDirection, messagingHierarchy, and ctaDirection are mandatory.",
    "- mandatoryBrandConstraints must respect brand forbidden phrases and policy from context.",
    "- creativeRecommendations should be practical for downstream content and design work.",
    "",
    "Respond with valid JSON only (no markdown fences) matching this schema:",
    CREATIVE_DIRECTION_JSON_SCHEMA,
  ].join("\n");
}

export const MARKETING_CREATIVE_BRIEF_BEHAVIORAL_INSTRUCTIONS = [
  "Produce creative direction, not final marketing copy.",
  "Ground every recommendation in verified strategy and brand context.",
  "When context is insufficient, state conservative defaults rather than inventing claims.",
] as const;

export const MARKETING_CREATIVE_BRIEF_DEFAULT_MAX_TOKENS = 3072;
