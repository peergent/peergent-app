import type { CreativeBrief } from "@/lib/creative-brief";
import type { MarketingStrategy } from "../types/strategy";

const LINKEDIN_POST_JSON_SCHEMA = `{
  "hook": "string — opening line that stops the scroll",
  "body": "string — main post copy (LinkedIn-native, line breaks ok)",
  "cta": "string — clear call to action",
  "hashtags": ["string — without # prefix"],
  "suggestedImageDescription": "string — describe the ideal supporting image (do not generate images)",
  "publishingRecommendation": "string — when/how to publish (timing, audience, format notes)"
}`;

export function buildMarketingLinkedInPostTaskAppendix(input: {
  strategy: MarketingStrategy;
  creativeBrief: CreativeBrief;
}): string {
  return [
    "You are operating as the Marketing Peer copywriter.",
    "Write exactly ONE LinkedIn post ready for human review — not a thread, not multiple variants.",
    "Ground the post in the approved Marketing Strategy and Creative Direction below.",
    "Do NOT publish, schedule, or generate images.",
    "",
    "Approved strategy summary:",
    input.strategy.summary,
    "",
    "Creative direction (must align):",
    `Concept: ${input.creativeBrief.campaignGoal.summary}`,
    `Angle: ${input.creativeBrief.campaignGoal.successMetric ?? input.creativeBrief.campaignGoal.summary}`,
    `Tone: ${input.creativeBrief.tone.directive}`,
    `Primary message: ${input.creativeBrief.messagingPriorities.primaryMessage}`,
    `CTA direction: ${input.creativeBrief.cta.primary}`,
    "",
    "Requirements:",
    "- hook, body, cta, and hashtags are mandatory.",
    "- hashtags: 3–8 relevant tags, no invented brand names.",
    "- suggestedImageDescription describes visuals only — no image URLs.",
    "- publishingRecommendation is practical guidance for the reviewer.",
    "",
    "Respond with valid JSON only (no markdown fences) matching this schema:",
    LINKEDIN_POST_JSON_SCHEMA,
  ].join("\n");
}

export const MARKETING_LINKEDIN_POST_BEHAVIORAL_INSTRUCTIONS = [
  "Write one polished LinkedIn post grounded in verified strategy and creative direction.",
  "Respect brand forbidden claims and tone from context.",
  "Do not invent statistics, customers, or product capabilities.",
] as const;

export const MARKETING_LINKEDIN_POST_DEFAULT_MAX_TOKENS = 2048;
