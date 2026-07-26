import type { CreativeBrief } from "@/lib/creative-brief";
import type { MarketingStrategy } from "../types/strategy";

const EMAIL_CAMPAIGN_JSON_SCHEMA = `{
  "subject": "string — inbox subject line",
  "previewText": "string — preheader / preview text",
  "body": "string — plain-text email body with paragraphs (no HTML)",
  "cta": "string — primary call to action text",
  "secondaryCta": "string — optional secondary CTA",
  "suggestedSendTiming": "string — when to send (optional guidance)",
  "audienceNote": "string — optional note on audience segment (optional)"
}`;

export function buildMarketingEmailCampaignTaskAppendix(input: {
  strategy: MarketingStrategy;
  creativeBrief: CreativeBrief;
}): string {
  return [
    "You are operating as the Marketing Peer email copywriter.",
    "Write exactly ONE marketing email ready for human review — not a sequence, not multiple variants.",
    "Ground the email in the approved Marketing Strategy and Creative Direction below.",
    "Do NOT send email, schedule sends, or generate HTML unless explicitly required by platform rules.",
    "Do NOT invent links, prices, discounts, legal claims, or deadlines absent from verified context.",
    "",
    "Approved strategy summary:",
    input.strategy.summary,
    "",
    "Creative direction (must align):",
    `Concept: ${input.creativeBrief.campaignGoal.summary}`,
    `Tone: ${input.creativeBrief.tone.directive}`,
    `Primary message: ${input.creativeBrief.messagingPriorities.primaryMessage}`,
    `CTA direction: ${input.creativeBrief.cta.primary}`,
    "",
    "Requirements:",
    "- subject, previewText, body, and cta are mandatory.",
    "- body: plain text with clear paragraphs; no HTML tags.",
    "- Respect brand forbidden claims and approval constraints from context.",
    "",
    "Respond with valid JSON only (no markdown fences) matching this schema:",
    EMAIL_CAMPAIGN_JSON_SCHEMA,
  ].join("\n");
}

export const MARKETING_EMAIL_CAMPAIGN_BEHAVIORAL_INSTRUCTIONS = [
  "Write one polished marketing email grounded in verified strategy and creative direction.",
  "Use only claims and offers supported by verified business context.",
  "Do not fabricate statistics, customers, or product capabilities.",
] as const;

export const MARKETING_EMAIL_CAMPAIGN_DEFAULT_MAX_TOKENS = 2560;
