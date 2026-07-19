import type {
  CampaignIdea,
  ContentPillar,
  CustomerJourneyRecommendation,
  LeadGenerationOpportunity,
  MarketingPriority,
  MarketingStrategy,
  MarketingStrategyConfidence,
  ParsedMarketingStrategyResult,
  PositioningRecommendation,
  SeoOpportunity,
  SocialMediaStrategy,
  StrategyEvidenceSource,
  StrategyRationale,
  TargetAudienceRecommendation,
} from "../types/strategy";

const VALID_EVIDENCE: StrategyEvidenceSource[] = [
  "company-dna",
  "business-brain",
  "marketing-understanding",
];

const VALID_CONFIDENCE: MarketingStrategyConfidence[] = ["low", "moderate", "high"];

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function asString(value: unknown, field: string, warnings: string[]): string | null {
  if (typeof value !== "string" || !value.trim()) {
    warnings.push(`Missing or invalid string for ${field}.`);
    return null;
  }
  return value.trim();
}

function asStringArray(value: unknown, field: string, warnings: string[]): string[] {
  if (!Array.isArray(value)) {
    warnings.push(`Expected array for ${field}.`);
    return [];
  }
  return value
    .filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    .map((item) => item.trim());
}

function parseRationale(value: unknown, field: string, warnings: string[]): StrategyRationale | null {
  if (!isRecord(value)) {
    warnings.push(`Missing rationale for ${field}.`);
    return null;
  }

  const why = asString(value.why, `${field}.rationale.why`, warnings);
  if (!why) return null;

  const basedOnRaw = value.basedOn;
  const basedOn: StrategyEvidenceSource[] = [];
  if (Array.isArray(basedOnRaw)) {
    for (const item of basedOnRaw) {
      if (typeof item === "string" && VALID_EVIDENCE.includes(item as StrategyEvidenceSource)) {
        basedOn.push(item as StrategyEvidenceSource);
      }
    }
  }

  if (basedOn.length === 0) {
    warnings.push(`${field}.rationale.basedOn must cite at least one evidence source.`);
    return null;
  }

  return { why, basedOn };
}

function parseWithRationale<T>(
  items: unknown,
  field: string,
  warnings: string[],
  mapper: (record: Record<string, unknown>, rationale: StrategyRationale) => T | null
): T[] {
  if (!Array.isArray(items)) {
    warnings.push(`Expected array for ${field}.`);
    return [];
  }

  const parsed: T[] = [];
  for (const [index, item] of items.entries()) {
    if (!isRecord(item)) continue;
    const rationale = parseRationale(item.rationale, `${field}[${index}]`, warnings);
    if (!rationale) continue;
    const mapped = mapper(item, rationale);
    if (mapped) parsed.push(mapped);
  }
  return parsed;
}

function parseTargetAudiences(value: unknown, warnings: string[]): TargetAudienceRecommendation[] {
  return parseWithRationale(value, "targetAudiences", warnings, (item, rationale) => {
    const segment = asString(item.segment, "targetAudiences.segment", warnings);
    if (!segment) return null;
    const priorityRaw = item.priority;
    const priority =
      priorityRaw === "primary" || priorityRaw === "secondary" || priorityRaw === "tertiary"
        ? priorityRaw
        : "secondary";
    return { segment, priority, rationale };
  });
}

function parsePositioning(value: unknown, warnings: string[]): PositioningRecommendation[] {
  return parseWithRationale(value, "positioningRecommendations", warnings, (item, rationale) => {
    const recommendation = asString(item.recommendation, "positioningRecommendations", warnings);
    return recommendation ? { recommendation, rationale } : null;
  });
}

function parseContentPillars(value: unknown, warnings: string[]): ContentPillar[] {
  return parseWithRationale(value, "contentPillars", warnings, (item, rationale) => {
    const name = asString(item.name, "contentPillars.name", warnings);
    if (!name) return null;
    return { name, themes: asStringArray(item.themes, "contentPillars.themes", warnings), rationale };
  });
}

function parseCampaignIdeas(value: unknown, warnings: string[]): CampaignIdea[] {
  return parseWithRationale(value, "campaignIdeas", warnings, (item, rationale) => {
    const name = asString(item.name, "campaignIdeas.name", warnings);
    const objective = asString(item.objective, "campaignIdeas.objective", warnings);
    if (!name || !objective) return null;
    return {
      name,
      objective,
      channels: asStringArray(item.channels, "campaignIdeas.channels", warnings),
      rationale,
    };
  });
}

function parseSeoOpportunities(value: unknown, warnings: string[]): SeoOpportunity[] {
  return parseWithRationale(value, "seoOpportunities", warnings, (item, rationale) => {
    const topic = asString(item.topic, "seoOpportunities.topic", warnings);
    const intent = asString(item.intent, "seoOpportunities.intent", warnings);
    return topic && intent ? { topic, intent, rationale } : null;
  });
}

function parseSocialMedia(value: unknown, warnings: string[]): SocialMediaStrategy[] {
  return parseWithRationale(value, "socialMediaStrategy", warnings, (item, rationale) => {
    const platform = asString(item.platform, "socialMediaStrategy.platform", warnings);
    const approach = asString(item.approach, "socialMediaStrategy.approach", warnings);
    if (!platform || !approach) return null;
    return {
      platform,
      approach,
      contentFocus: asStringArray(item.contentFocus, "socialMediaStrategy.contentFocus", warnings),
      rationale,
    };
  });
}

function parseCustomerJourney(value: unknown, warnings: string[]): CustomerJourneyRecommendation[] {
  return parseWithRationale(
    value,
    "customerJourneyRecommendations",
    warnings,
    (item, rationale) => {
      const stage = asString(item.stage, "customerJourneyRecommendations.stage", warnings);
      const recommendation = asString(
        item.recommendation,
        "customerJourneyRecommendations.recommendation",
        warnings
      );
      return stage && recommendation ? { stage, recommendation, rationale } : null;
    }
  );
}

function parseLeadGen(value: unknown, warnings: string[]): LeadGenerationOpportunity[] {
  return parseWithRationale(
    value,
    "leadGenerationOpportunities",
    warnings,
    (item, rationale) => {
      const opportunity = asString(
        item.opportunity,
        "leadGenerationOpportunities.opportunity",
        warnings
      );
      const tactic = asString(item.tactic, "leadGenerationOpportunities.tactic", warnings);
      return opportunity && tactic ? { opportunity, tactic, rationale } : null;
    }
  );
}

function parsePriorities(value: unknown, warnings: string[]): MarketingPriority[] {
  const results: MarketingPriority[] = [];
  if (!Array.isArray(value)) {
    warnings.push("Expected array for marketingPriorities.");
    return results;
  }

  for (const [index, item] of value.entries()) {
    if (!isRecord(item)) continue;
    const rationale = parseRationale(item.rationale, `marketingPriorities[${index}]`, warnings);
    if (!rationale) continue;
    const title = asString(item.title, "marketingPriorities.title", warnings);
    if (!title) continue;
    const priority =
      typeof item.priority === "number" && Number.isFinite(item.priority)
        ? Math.round(item.priority)
        : results.length + 1;
    results.push({ priority, title, rationale });
  }

  return results;
}

function extractJsonObject(text: string): unknown {
  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start >= 0 && end > start) {
      return JSON.parse(trimmed.slice(start, end + 1));
    }
    throw new Error("Response is not valid JSON.");
  }
}

/** Parses and validates a Marketing Strategy from AI response text. */
export function parseMarketingStrategyResponse(text: string): ParsedMarketingStrategyResult {
  const warnings: string[] = [];

  let parsed: unknown;
  try {
    parsed = extractJsonObject(text);
  } catch {
    return { success: false, error: "Failed to parse Marketing Strategy JSON.", warnings };
  }

  if (!isRecord(parsed)) {
    return { success: false, error: "Marketing Strategy response must be a JSON object.", warnings };
  }

  const summary = asString(parsed.summary, "summary", warnings);
  const confidenceReason = asString(parsed.confidenceReason, "confidenceReason", warnings);
  if (!summary || !confidenceReason) {
    return {
      success: false,
      error: "Marketing Strategy is missing required summary or confidenceReason.",
      warnings,
    };
  }

  const confidenceRaw = parsed.confidence;
  const confidence = VALID_CONFIDENCE.includes(confidenceRaw as MarketingStrategyConfidence)
    ? (confidenceRaw as MarketingStrategyConfidence)
    : "moderate";

  if (confidenceRaw !== confidence) {
    warnings.push("Invalid confidence value — defaulted to moderate.");
  }

  const strategy: MarketingStrategy = {
    summary,
    confidence,
    confidenceReason,
    targetAudiences: parseTargetAudiences(parsed.targetAudiences, warnings),
    positioningRecommendations: parsePositioning(parsed.positioningRecommendations, warnings),
    contentPillars: parseContentPillars(parsed.contentPillars, warnings),
    campaignIdeas: parseCampaignIdeas(parsed.campaignIdeas, warnings),
    seoOpportunities: parseSeoOpportunities(parsed.seoOpportunities, warnings),
    socialMediaStrategy: parseSocialMedia(parsed.socialMediaStrategy, warnings),
    customerJourneyRecommendations: parseCustomerJourney(
      parsed.customerJourneyRecommendations,
      warnings
    ),
    leadGenerationOpportunities: parseLeadGen(parsed.leadGenerationOpportunities, warnings),
    marketingPriorities: parsePriorities(parsed.marketingPriorities, warnings),
    knowledgeGaps: asStringArray(parsed.knowledgeGaps, "knowledgeGaps", warnings),
    generatedAt: new Date().toISOString(),
  };

  const hasRecommendations =
    strategy.targetAudiences.length > 0 ||
    strategy.positioningRecommendations.length > 0 ||
    strategy.contentPillars.length > 0 ||
    strategy.campaignIdeas.length > 0 ||
    strategy.marketingPriorities.length > 0;

  if (!hasRecommendations) {
    return {
      success: false,
      error: "Marketing Strategy contains no valid recommendations with rationale.",
      warnings,
    };
  }

  return { success: true, strategy, warnings };
}
