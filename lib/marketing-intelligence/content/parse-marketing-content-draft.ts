import type {
  ContentDraftRationale,
  ContentDraftStatus,
  ContentDraftValidationContext,
  ContentSourceReference,
  MarketingContentDraft,
  MarketingDraftContentType,
  ParsedMarketingContentDraftResult,
} from "../types/content-draft";
import { SUPPORTED_DRAFT_CONTENT_TYPES } from "../types/content-draft";
import type { StrategyLink } from "../types/plan";
import type { MarketingStrategyConfidence } from "../types/strategy";
import { normalizeContentType } from "./resolve-plan-activity";

const VALID_CONFIDENCE: MarketingStrategyConfidence[] = ["low", "moderate", "high"];
const VALID_STATUS: ContentDraftStatus[] = ["draft", "ready_for_review", "rejected", "approved"];
const VALID_SOURCES: ContentSourceReference["source"][] = [
  "company-dna",
  "business-brain",
  "marketing-understanding",
  "marketing-plan",
  "marketing-strategy",
];

const GENERIC_TERMS = new Set([
  "platform",
  "solution",
  "product",
  "service",
  "company",
  "team",
  "business",
  "customers",
  "users",
]);

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

function parseSourceReferences(
  value: unknown,
  warnings: string[]
): ContentSourceReference[] {
  if (!Array.isArray(value)) {
    warnings.push("Expected array for sourceReferences.");
    return [];
  }

  const refs: ContentSourceReference[] = [];
  for (const item of value) {
    if (!isRecord(item)) continue;
    const source = item.source;
    const reference = asString(item.reference, "sourceReferences.reference", warnings);
    if (
      typeof source === "string" &&
      VALID_SOURCES.includes(source as ContentSourceReference["source"]) &&
      reference
    ) {
      refs.push({ source: source as ContentSourceReference["source"], reference });
    }
  }
  return refs;
}

function parseStrategyLinksFromActivity(
  activityLinks: StrategyLink[]
): StrategyLink[] {
  return activityLinks.map((link) => ({ type: link.type, reference: link.reference }));
}

/** Detects potential product/service claims not grounded in known entities. */
export function detectUngroundedClaims(
  text: string,
  knownProducts: string[],
  knownServices: string[]
): string[] {
  const warnings: string[] = [];
  const known = new Set(
    [...knownProducts, ...knownServices].map((name) => name.trim().toLowerCase()).filter(Boolean)
  );

  const ourPattern = /\bour\s+([A-Za-z0-9]+(?:\s+[A-Za-z0-9]+){0,3})/gi;
  for (const match of text.matchAll(ourPattern)) {
    const term = match[1]?.trim().toLowerCase();
    if (!term || GENERIC_TERMS.has(term)) continue;
    const grounded = [...known].some(
      (entity) => entity.includes(term) || term.includes(entity)
    );
    if (!grounded && term.length > 2) {
      warnings.push(
        `Potential ungrounded claim: "${match[0]}" — not found in Business Brain products/services.`
      );
    }
  }

  return warnings;
}

export function validateContentDraft(
  draft: MarketingContentDraft,
  context: ContentDraftValidationContext
): string[] {
  const warnings: string[] = [...draft.warnings];

  if (
    draft.planActivityReference.trim().toLowerCase() !==
    context.expectedPlanActivityReference.trim().toLowerCase()
  ) {
    warnings.push(
      `planActivityReference mismatch: expected "${context.expectedPlanActivityReference}", got "${draft.planActivityReference}".`
    );
  }

  if (!SUPPORTED_DRAFT_CONTENT_TYPES.includes(draft.contentType)) {
    warnings.push(`Unsupported content type: ${draft.contentType}.`);
  }

  if (draft.sourceReferences.length === 0) {
    warnings.push("No sourceReferences provided — traceability is incomplete.");
  }

  if (!draft.rationale.why.trim()) {
    warnings.push("Missing rationale.why.");
  }

  warnings.push(
    ...detectUngroundedClaims(
      `${draft.title} ${draft.body}`,
      context.knownProductNames,
      context.knownServiceNames
    )
  );

  return [...new Set(warnings)];
}

export type ParseContentDraftOptions = {
  expectedPlanActivityReference: string;
  normalizedContentType: MarketingDraftContentType;
  strategyLinks: StrategyLink[];
  validationContext: ContentDraftValidationContext;
  draftId?: string;
};

/** Parses and validates a Marketing Content Draft from AI response text. */
export function parseMarketingContentDraft(
  text: string,
  options: ParseContentDraftOptions
): ParsedMarketingContentDraftResult {
  const warnings: string[] = [];

  let parsed: unknown;
  try {
    parsed = extractJsonObject(text);
  } catch {
    return { success: false, error: "Failed to parse Marketing Content Draft JSON.", warnings };
  }

  if (!isRecord(parsed)) {
    return {
      success: false,
      error: "Marketing Content Draft response must be a JSON object.",
      warnings,
    };
  }

  const planActivityReference = asString(
    parsed.planActivityReference,
    "planActivityReference",
    warnings
  );
  const objective = asString(parsed.objective, "objective", warnings);
  const title = asString(parsed.title, "title", warnings);
  const body = asString(parsed.body, "body", warnings);

  if (!planActivityReference || !objective || !title || !body) {
    return {
      success: false,
      error: "Marketing Content Draft is missing required fields.",
      warnings,
    };
  }

  if (
    planActivityReference.trim().toLowerCase() !==
    options.expectedPlanActivityReference.trim().toLowerCase()
  ) {
    return {
      success: false,
      error: `planActivityReference must match "${options.expectedPlanActivityReference}".`,
      warnings,
    };
  }

  const contentTypeRaw = asString(parsed.contentType, "contentType", warnings);
  const normalizedType = contentTypeRaw ? normalizeContentType(contentTypeRaw) : null;

  if (!normalizedType || normalizedType !== options.normalizedContentType) {
    return {
      success: false,
      error: `contentType must be "${options.normalizedContentType}".`,
      warnings,
    };
  }

  const rationaleWhy = isRecord(parsed.rationale)
    ? asString(parsed.rationale.why, "rationale.why", warnings)
    : null;

  if (!rationaleWhy) {
    return {
      success: false,
      error: "Marketing Content Draft requires rationale.why.",
      warnings,
    };
  }

  const confidenceRaw = parsed.confidence;
  const confidence = VALID_CONFIDENCE.includes(confidenceRaw as MarketingStrategyConfidence)
    ? (confidenceRaw as MarketingStrategyConfidence)
    : "moderate";

  const statusRaw = parsed.status;
  const status: ContentDraftStatus = VALID_STATUS.includes(statusRaw as ContentDraftStatus)
    ? (statusRaw as ContentDraftStatus)
    : "draft";

  if (status !== "draft") {
    warnings.push(`Status "${statusRaw}" overridden to "draft" — content is never auto-published.`);
  }

  const rationale: ContentDraftRationale = {
    why: rationaleWhy,
    planActivityReference,
    strategyLinks: parseStrategyLinksFromActivity(options.strategyLinks),
  };

  const draft: MarketingContentDraft = {
    id: options.draftId ?? crypto.randomUUID(),
    planActivityReference,
    contentType: normalizedType,
    channel: asString(parsed.channel, "channel", warnings) ?? undefined,
    objective,
    targetAudience: asString(parsed.targetAudience, "targetAudience", warnings) ?? undefined,
    title,
    body,
    callToAction: asString(parsed.callToAction, "callToAction", warnings) ?? undefined,
    keywords: asStringArray(parsed.keywords, "keywords", warnings),
    rationale,
    sourceReferences: parseSourceReferences(parsed.sourceReferences, warnings),
    confidence,
    status: "draft",
    warnings: [],
    generatedAt: new Date().toISOString(),
  };

  draft.warnings = validateContentDraft(draft, options.validationContext);

  if (draft.warnings.some((w) => w.includes("planActivityReference mismatch"))) {
    return {
      success: false,
      error: "planActivityReference does not match the selected plan activity.",
      warnings: draft.warnings,
    };
  }

  return { success: true, draft, warnings: [...warnings, ...draft.warnings] };
}
