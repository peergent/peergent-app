import type {
  ContentCalendarEntry,
  EffortLevel,
  ExpectedOutcome,
  ImpactLevel,
  MarketingPlan,
  ParsedMarketingPlanResult,
  PlanDependency,
  PlanObjective,
  PlanPriority,
  PlannedCampaign,
  PlanRationale,
  StrategyLink,
  StrategyLinkType,
  SuccessMetric,
  TimelinePhase,
} from "../types/plan";
import type { MarketingStrategyConfidence } from "../types/strategy";
import { normalizeContentType } from "../content/resolve-plan-activity";

const VALID_LINK_TYPES: StrategyLinkType[] = [
  "targetAudience",
  "positioning",
  "contentPillar",
  "campaignIdea",
  "seoOpportunity",
  "socialMedia",
  "customerJourney",
  "leadGeneration",
  "marketingPriority",
];

const VALID_EFFORT: EffortLevel[] = ["low", "medium", "high"];
const VALID_IMPACT: ImpactLevel[] = ["low", "medium", "high"];
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

function asNumber(value: unknown, field: string, warnings: string[], fallback: number): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.round(value);
  }
  warnings.push(`Invalid number for ${field} — using ${fallback}.`);
  return fallback;
}

function parseEffort(value: unknown, warnings: string[], field: string): EffortLevel {
  if (typeof value === "string" && VALID_EFFORT.includes(value as EffortLevel)) {
    return value as EffortLevel;
  }
  warnings.push(`Invalid estimatedEffort for ${field} — defaulting to medium.`);
  return "medium";
}

function parseImpact(value: unknown, warnings: string[], field: string): ImpactLevel {
  if (typeof value === "string" && VALID_IMPACT.includes(value as ImpactLevel)) {
    return value as ImpactLevel;
  }
  warnings.push(`Invalid expectedImpact for ${field} — defaulting to medium.`);
  return "medium";
}

function parseRationale(value: unknown, field: string, warnings: string[]): PlanRationale | null {
  if (!isRecord(value)) {
    warnings.push(`Missing rationale for ${field}.`);
    return null;
  }
  const why = asString(value.why, `${field}.rationale.why`, warnings);
  return why ? { why } : null;
}

function parseStrategyLinks(
  value: unknown,
  field: string,
  warnings: string[],
  required = true
): StrategyLink[] | null {
  if (!Array.isArray(value)) {
    if (required) warnings.push(`Expected linkedStrategyItems array for ${field}.`);
    return required ? null : [];
  }

  const links: StrategyLink[] = [];
  for (const item of value) {
    if (!isRecord(item)) continue;
    const type = item.type;
    const reference = asString(item.reference, `${field}.linkedStrategyItems.reference`, warnings);
    if (
      typeof type === "string" &&
      VALID_LINK_TYPES.includes(type as StrategyLinkType) &&
      reference
    ) {
      links.push({ type: type as StrategyLinkType, reference });
    }
  }

  if (required && links.length === 0) {
    warnings.push(`${field} must link to at least one strategy item.`);
    return null;
  }

  return links;
}

function parseActivityFields(
  item: Record<string, unknown>,
  field: string,
  warnings: string[],
  index: number
): {
  title: string;
  rationale: PlanRationale;
  linkedStrategyItems: StrategyLink[];
  estimatedEffort: EffortLevel;
  expectedImpact: ImpactLevel;
} | null {
  const title = asString(item.title, `${field}[${index}].title`, warnings);
  const rationale = parseRationale(item.rationale, `${field}[${index}]`, warnings);
  const linkedStrategyItems = parseStrategyLinks(
    item.linkedStrategyItems,
    `${field}[${index}]`,
    warnings
  );

  if (!title || !rationale || !linkedStrategyItems) return null;

  return {
    title,
    rationale,
    linkedStrategyItems,
    estimatedEffort: parseEffort(item.estimatedEffort, warnings, `${field}[${index}]`),
    expectedImpact: parseImpact(item.expectedImpact, warnings, `${field}[${index}]`),
  };
}

function parseObjectives(value: unknown, warnings: string[]): PlanObjective[] {
  if (!Array.isArray(value)) {
    warnings.push("Expected array for objectives.");
    return [];
  }

  const results: PlanObjective[] = [];
  for (const [index, item] of value.entries()) {
    if (!isRecord(item)) continue;
    const base = parseActivityFields(item, "objectives", warnings, index);
    if (!base) continue;
    results.push({
      ...base,
      description: asString(item.description, "objectives.description", warnings) ?? undefined,
      successCriteria:
        asString(item.successCriteria, "objectives.successCriteria", warnings) ?? undefined,
    });
  }
  return results;
}

function parsePriorities(value: unknown, warnings: string[]): PlanPriority[] {
  if (!Array.isArray(value)) {
    warnings.push("Expected array for priorities.");
    return [];
  }

  const results: PlanPriority[] = [];
  for (const [index, item] of value.entries()) {
    if (!isRecord(item)) continue;
    const base = parseActivityFields(item, "priorities", warnings, index);
    if (!base) continue;
    results.push({
      ...base,
      rank: asNumber(item.rank, "priorities.rank", warnings, results.length + 1),
    });
  }
  return results;
}

function parseTimeline(value: unknown, warnings: string[]): TimelinePhase[] {
  if (!Array.isArray(value)) {
    warnings.push("Expected array for timeline.");
    return [];
  }

  const results: TimelinePhase[] = [];
  for (const [index, item] of value.entries()) {
    if (!isRecord(item)) continue;
    const base = parseActivityFields(item, "timeline", warnings, index);
    if (!base) continue;
    const phase = asString(item.phase, "timeline.phase", warnings);
    if (!phase) continue;
    results.push({
      ...base,
      phase,
      startWeek: asNumber(item.startWeek, "timeline.startWeek", warnings, 1),
      endWeek: asNumber(item.endWeek, "timeline.endWeek", warnings, 4),
      activities: asStringArray(item.activities, "timeline.activities", warnings),
    });
  }
  return results;
}

function parseCampaigns(value: unknown, warnings: string[]): PlannedCampaign[] {
  if (!Array.isArray(value)) {
    warnings.push("Expected array for campaigns.");
    return [];
  }

  const results: PlannedCampaign[] = [];
  for (const [index, item] of value.entries()) {
    if (!isRecord(item)) continue;
    const base = parseActivityFields(item, "campaigns", warnings, index);
    if (!base) continue;
    results.push({
      ...base,
      channels: asStringArray(item.channels, "campaigns.channels", warnings),
      startWeek: asNumber(item.startWeek, "campaigns.startWeek", warnings, 1),
      endWeek: asNumber(item.endWeek, "campaigns.endWeek", warnings, 8),
      milestones: asStringArray(item.milestones, "campaigns.milestones", warnings),
    });
  }
  return results;
}

function parseContentCalendar(value: unknown, warnings: string[]): ContentCalendarEntry[] {
  if (!Array.isArray(value)) {
    warnings.push("Expected array for contentCalendar.");
    return [];
  }

  const results: ContentCalendarEntry[] = [];
  for (const [index, item] of value.entries()) {
    if (!isRecord(item)) continue;
    const base = parseActivityFields(item, "contentCalendar", warnings, index);
    if (!base) continue;
    const rawContentType = asString(item.contentType, "contentCalendar.contentType", warnings);
    if (!rawContentType) continue;

    const normalizedContentType = normalizeContentType(rawContentType);
    if (!normalizedContentType) {
      warnings.push(
        `contentCalendar[${index}].contentType "${rawContentType}" is not a supported draft content type — entry skipped.`
      );
      continue;
    }

    if (rawContentType !== normalizedContentType) {
      warnings.push(
        `contentCalendar[${index}].contentType normalized from "${rawContentType}" to "${normalizedContentType}".`
      );
    }

    results.push({
      ...base,
      contentType: normalizedContentType,
      channel: asString(item.channel, "contentCalendar.channel", warnings) ?? undefined,
      scheduledWeek: asNumber(item.scheduledWeek, "contentCalendar.scheduledWeek", warnings, 1),
      pillar: asString(item.pillar, "contentCalendar.pillar", warnings) ?? undefined,
    });
  }
  return results;
}

function parseDependencies(value: unknown, warnings: string[]): PlanDependency[] {
  if (!Array.isArray(value)) {
    warnings.push("Expected array for dependencies.");
    return [];
  }

  const results: PlanDependency[] = [];
  for (const [index, item] of value.entries()) {
    if (!isRecord(item)) continue;
    const dependent = asString(item.dependent, "dependencies.dependent", warnings);
    const dependsOn = asString(item.dependsOn, "dependencies.dependsOn", warnings);
    const rationale = parseRationale(item.rationale, `dependencies[${index}]`, warnings);
    if (dependent && dependsOn && rationale) {
      results.push({ dependent, dependsOn, rationale });
    }
  }
  return results;
}

function parseExpectedOutcomes(value: unknown, warnings: string[]): ExpectedOutcome[] {
  if (!Array.isArray(value)) {
    warnings.push("Expected array for expectedOutcomes.");
    return [];
  }

  const results: ExpectedOutcome[] = [];
  for (const [index, item] of value.entries()) {
    if (!isRecord(item)) continue;
    const base = parseActivityFields(item, "expectedOutcomes", warnings, index);
    if (!base) continue;
    const outcome = asString(item.outcome, "expectedOutcomes.outcome", warnings);
    if (!outcome) continue;
    results.push({
      ...base,
      outcome,
      timeframe: asString(item.timeframe, "expectedOutcomes.timeframe", warnings) ?? undefined,
    });
  }
  return results;
}

function parseSuccessMetrics(value: unknown, warnings: string[]): SuccessMetric[] {
  if (!Array.isArray(value)) {
    warnings.push("Expected array for successMetrics.");
    return [];
  }

  const results: SuccessMetric[] = [];
  for (const [index, item] of value.entries()) {
    if (!isRecord(item)) continue;
    const metric = asString(item.metric, "successMetrics.metric", warnings);
    const target = asString(item.target, "successMetrics.target", warnings);
    const rationale = parseRationale(item.rationale, `successMetrics[${index}]`, warnings);
    const linkedStrategyItems = parseStrategyLinks(
      item.linkedStrategyItems,
      `successMetrics[${index}]`,
      warnings,
      true
    );
    if (metric && target && rationale && linkedStrategyItems) {
      results.push({ metric, target, rationale, linkedStrategyItems });
    }
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

/** Parses and validates a Marketing Plan from AI response text. */
export function parseMarketingPlanResponse(text: string): ParsedMarketingPlanResult {
  const warnings: string[] = [];

  let parsed: unknown;
  try {
    parsed = extractJsonObject(text);
  } catch {
    return { success: false, error: "Failed to parse Marketing Plan JSON.", warnings };
  }

  if (!isRecord(parsed)) {
    return { success: false, error: "Marketing Plan response must be a JSON object.", warnings };
  }

  const summary = asString(parsed.summary, "summary", warnings);
  const confidenceReason = asString(parsed.confidenceReason, "confidenceReason", warnings);
  const basedOnStrategySummary = asString(
    parsed.basedOnStrategySummary,
    "basedOnStrategySummary",
    warnings
  );

  if (!summary || !confidenceReason || !basedOnStrategySummary) {
    return {
      success: false,
      error: "Marketing Plan is missing required summary fields.",
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

  const plan: MarketingPlan = {
    summary,
    confidence,
    confidenceReason,
    basedOnStrategySummary,
    objectives: parseObjectives(parsed.objectives, warnings),
    priorities: parsePriorities(parsed.priorities, warnings),
    timeline: parseTimeline(parsed.timeline, warnings),
    campaigns: parseCampaigns(parsed.campaigns, warnings),
    contentCalendar: parseContentCalendar(parsed.contentCalendar, warnings),
    dependencies: parseDependencies(parsed.dependencies, warnings),
    expectedOutcomes: parseExpectedOutcomes(parsed.expectedOutcomes, warnings),
    successMetrics: parseSuccessMetrics(parsed.successMetrics, warnings),
    knowledgeGaps: asStringArray(parsed.knowledgeGaps, "knowledgeGaps", warnings),
    generatedAt: new Date().toISOString(),
  };

  const hasPlanContent =
    plan.objectives.length > 0 ||
    plan.priorities.length > 0 ||
    plan.timeline.length > 0 ||
    plan.campaigns.length > 0 ||
    plan.contentCalendar.length > 0;

  if (!hasPlanContent) {
    return {
      success: false,
      error: "Marketing Plan contains no valid planned activities with strategy links.",
      warnings,
    };
  }

  return { success: true, plan, warnings };
}
