import type { ParsedMarketingLinkedInPost } from "./types";

export type ParseMarketingLinkedInPostResult =
  | { success: true; post: ParsedMarketingLinkedInPost; warnings: string[] }
  | { success: false; error: string; warnings: string[] };

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
    .map((item) => item.trim().replace(/^#+/, ""));
}

export function parseMarketingLinkedInPostResponse(text: string): ParseMarketingLinkedInPostResult {
  const warnings: string[] = [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(text.trim());
  } catch {
    return { success: false, error: "LinkedIn post response was not valid JSON.", warnings };
  }

  if (!isRecord(parsed)) {
    return { success: false, error: "LinkedIn post response must be a JSON object.", warnings };
  }

  const hook = asString(parsed.hook, "hook", warnings);
  const body = asString(parsed.body, "body", warnings);
  const cta = asString(parsed.cta, "cta", warnings);
  const hashtags = asStringArray(parsed.hashtags, "hashtags", warnings);
  const suggestedImageDescription = asString(
    parsed.suggestedImageDescription,
    "suggestedImageDescription",
    warnings
  );
  const publishingRecommendation = asString(
    parsed.publishingRecommendation,
    "publishingRecommendation",
    warnings
  );

  if (!hook || !body || !cta || hashtags.length === 0) {
    return {
      success: false,
      error: "LinkedIn post is missing hook, body, CTA, or hashtags.",
      warnings,
    };
  }

  return {
    success: true,
    post: {
      hook,
      body,
      cta,
      hashtags,
      suggestedImageDescription: suggestedImageDescription ?? "",
      publishingRecommendation: publishingRecommendation ?? "",
    },
    warnings,
  };
}
