import type { MarketingStrategy } from "../types/strategy";
import type { PlanReadiness } from "./assess-plan-readiness";

const PLAN_JSON_SCHEMA = `{
  "summary": "string — executive summary of the execution plan",
  "confidence": "low | moderate | high",
  "confidenceReason": "string — why this confidence level",
  "basedOnStrategySummary": "string — brief reference to the input strategy",
  "objectives": [{ "title": "string", "description": "string", "successCriteria": "string", "rationale": { "why": "string" }, "linkedStrategyItems": [{ "type": "targetAudience|positioning|contentPillar|campaignIdea|seoOpportunity|socialMedia|customerJourney|leadGeneration|marketingPriority", "reference": "string" }], "estimatedEffort": "low|medium|high", "expectedImpact": "low|medium|high" }],
  "priorities": [{ "rank": 1, "title": "string", "rationale": { "why": "string" }, "linkedStrategyItems": [...], "estimatedEffort": "low|medium|high", "expectedImpact": "low|medium|high" }],
  "timeline": [{ "phase": "string", "startWeek": 1, "endWeek": 4, "activities": ["string"], "title": "string", "rationale": { "why": "string" }, "linkedStrategyItems": [...], "estimatedEffort": "low|medium|high", "expectedImpact": "low|medium|high" }],
  "campaigns": [{ "title": "string", "channels": ["string"], "startWeek": 1, "endWeek": 6, "milestones": ["string"], "rationale": { "why": "string" }, "linkedStrategyItems": [...], "estimatedEffort": "low|medium|high", "expectedImpact": "low|medium|high" }],
  "contentCalendar": [{ "title": "string", "contentType": "string", "channel": "string", "scheduledWeek": 2, "pillar": "string", "rationale": { "why": "string" }, "linkedStrategyItems": [...], "estimatedEffort": "low|medium|high", "expectedImpact": "low|medium|high" }],
  "dependencies": [{ "dependent": "string", "dependsOn": "string", "rationale": { "why": "string" } }],
  "expectedOutcomes": [{ "title": "string", "outcome": "string", "timeframe": "string", "rationale": { "why": "string" }, "linkedStrategyItems": [...], "estimatedEffort": "low|medium|high", "expectedImpact": "low|medium|high" }],
  "successMetrics": [{ "metric": "string", "target": "string", "rationale": { "why": "string" }, "linkedStrategyItems": [...] }],
  "knowledgeGaps": ["string"]
}`;

/** Task prompt appendix instructing structured plan output from a Marketing Strategy. */
export function buildMarketingPlanTaskAppendix(
  strategy: MarketingStrategy,
  readiness: PlanReadiness
): string {
  const gapBlock =
    readiness.knowledgeGaps.length > 0
      ? `Known knowledge gaps from strategy: ${readiness.knowledgeGaps.join(", ")}.`
      : "No major knowledge gaps detected in the strategy.";

  const strategyBlock = JSON.stringify(
    {
      summary: strategy.summary,
      confidence: strategy.confidence,
      targetAudiences: strategy.targetAudiences.map((a) => a.segment),
      positioningRecommendations: strategy.positioningRecommendations.map(
        (p) => p.recommendation
      ),
      contentPillars: strategy.contentPillars.map((p) => p.name),
      campaignIdeas: strategy.campaignIdeas.map((c) => c.name),
      seoOpportunities: strategy.seoOpportunities.map((s) => s.topic),
      socialMediaStrategy: strategy.socialMediaStrategy.map((s) => s.platform),
      customerJourneyRecommendations: strategy.customerJourneyRecommendations.map(
        (j) => j.stage
      ),
      leadGenerationOpportunities: strategy.leadGenerationOpportunities.map(
        (l) => l.opportunity
      ),
      marketingPriorities: strategy.marketingPriorities.map((p) => p.title),
    },
    null,
    2
  );

  return [
    "You are operating as the Marketing Planner.",
    "Transform the provided Marketing Strategy into an actionable Marketing Plan.",
    "Do NOT write marketing copy, blog posts, social posts, emails, or any publishable content.",
    "Produce an execution plan only — what to do, when, and in what order.",
    "",
    "Input Marketing Strategy:",
    strategyBlock,
    "",
    "Requirements:",
    "- Every planned activity MUST include: rationale (why), linkedStrategyItems (which strategy items it implements), estimatedEffort (low|medium|high), expectedImpact (low|medium|high).",
    "- linkedStrategyItems must reference actual items from the input strategy using type and reference fields.",
    "- Ground the plan in the strategy provided. Do not invent strategy items not present in the input.",
    "- Content calendar entries describe planned content slots (type, channel, week) — not the content itself.",
    "- When the strategy is incomplete, note limitations in knowledgeGaps.",
    `- Maximum confidence for this request: ${readiness.maxConfidence} (${readiness.strategyItemCount} strategy items available).`,
    gapBlock,
    "",
    "Respond with valid JSON only (no markdown fences) matching this schema:",
    PLAN_JSON_SCHEMA,
  ].join("\n");
}

export const MARKETING_PLAN_BEHAVIORAL_INSTRUCTIONS = [
  "Produce an actionable execution plan, not marketing copy or publishable content.",
  "Every planned activity must link back to specific Marketing Strategy items.",
  "Include estimated effort and expected impact on all planned activities.",
  "Sequence activities logically with clear dependencies and a realistic timeline.",
] as const;

export const MARKETING_PLAN_DEFAULT_MAX_TOKENS = 6144;
