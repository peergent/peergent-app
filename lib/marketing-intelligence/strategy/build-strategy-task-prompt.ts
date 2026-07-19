import type { StrategyReadiness } from "./assess-strategy-readiness";

const STRATEGY_JSON_SCHEMA = `{
  "summary": "string — executive summary of the recommended strategy",
  "confidence": "low | moderate | high",
  "confidenceReason": "string — why this confidence level",
  "targetAudiences": [{ "segment": "string", "priority": "primary|secondary|tertiary", "rationale": { "why": "string", "basedOn": ["company-dna"|"business-brain"|"marketing-understanding"] } }],
  "positioningRecommendations": [{ "recommendation": "string", "rationale": { "why": "string", "basedOn": [...] } }],
  "contentPillars": [{ "name": "string", "themes": ["string"], "rationale": { "why": "string", "basedOn": [...] } }],
  "campaignIdeas": [{ "name": "string", "objective": "string", "channels": ["string"], "rationale": { "why": "string", "basedOn": [...] } }],
  "seoOpportunities": [{ "topic": "string", "intent": "string", "rationale": { "why": "string", "basedOn": [...] } }],
  "socialMediaStrategy": [{ "platform": "string", "approach": "string", "contentFocus": ["string"], "rationale": { "why": "string", "basedOn": [...] } }],
  "customerJourneyRecommendations": [{ "stage": "string", "recommendation": "string", "rationale": { "why": "string", "basedOn": [...] } }],
  "leadGenerationOpportunities": [{ "opportunity": "string", "tactic": "string", "rationale": { "why": "string", "basedOn": [...] } }],
  "marketingPriorities": [{ "priority": 1, "title": "string", "rationale": { "why": "string", "basedOn": [...] } }],
  "knowledgeGaps": ["string — what context is missing that limits the strategy"]
}`;

/** Task prompt appendix instructing structured strategy output with rationale. */
export function buildMarketingStrategyTaskAppendix(readiness: StrategyReadiness): string {
  const gapBlock =
    readiness.knowledgeGaps.length > 0
      ? `Known knowledge gaps: ${readiness.knowledgeGaps.join(", ")}.`
      : "No major knowledge gaps detected.";

  return [
    "You are operating as the Marketing Strategist.",
    "Transform the verified Marketing Understanding into a structured Marketing Strategy.",
    "Do NOT write marketing copy, blog posts, social posts, emails, or any publishable content.",
    "Produce strategic recommendations only.",
    "",
    "Requirements:",
    "- Every recommendation MUST include a rationale object with `why` (plain-language explanation) and `basedOn` (array citing which context sources drove the recommendation: company-dna, business-brain, marketing-understanding).",
    "- Ground every recommendation in the verified context provided. Do not invent products, audiences, or capabilities.",
    "- When context is missing, note it in knowledgeGaps and reduce confidence accordingly.",
    `- Maximum confidence for this request: ${readiness.maxConfidence} (understanding completeness: ${readiness.understandingCompleteness}%).`,
    gapBlock,
    "",
    "Respond with valid JSON only (no markdown fences) matching this schema:",
    STRATEGY_JSON_SCHEMA,
  ].join("\n");
}

export const MARKETING_STRATEGY_BEHAVIORAL_INSTRUCTIONS = [
  "Produce strategic recommendations, not marketing copy or publishable content.",
  "Every recommendation must explain WHY it was made, citing company-dna, business-brain, or marketing-understanding.",
  "When context is insufficient, state gaps explicitly instead of guessing.",
  "Prioritize recommendations that align with brand tone, audience pain points, and stated marketing goals.",
] as const;

export const MARKETING_STRATEGY_DEFAULT_MAX_TOKENS = 4096;
