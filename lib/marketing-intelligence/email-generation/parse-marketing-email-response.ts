import type { ParsedMarketingEmailCampaign } from "./types";

export type ParseMarketingEmailCampaignResult =
  | { success: true; email: ParsedMarketingEmailCampaign; warnings: string[] }
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

function asOptionalString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export function parseMarketingEmailCampaignResponse(
  text: string
): ParseMarketingEmailCampaignResult {
  const warnings: string[] = [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(text.trim());
  } catch {
    return { success: false, error: "Email campaign response was not valid JSON.", warnings };
  }

  if (!isRecord(parsed)) {
    return { success: false, error: "Email campaign response must be a JSON object.", warnings };
  }

  const subject = asString(parsed.subject, "subject", warnings);
  const previewText = asString(parsed.previewText, "previewText", warnings);
  const body = asString(parsed.body, "body", warnings);
  const cta = asString(parsed.cta, "cta", warnings);

  if (!subject || !previewText || !body || !cta) {
    return {
      success: false,
      error: "Email campaign is missing subject, preview text, body, or CTA.",
      warnings,
    };
  }

  if (body.length < 40) {
    return {
      success: false,
      error: "Email body is too short to be a complete marketing email.",
      warnings,
    };
  }

  return {
    success: true,
    email: {
      subject,
      previewText,
      body,
      cta,
      secondaryCta: asOptionalString(parsed.secondaryCta),
      suggestedSendTiming: asOptionalString(parsed.suggestedSendTiming),
      audienceNote: asOptionalString(parsed.audienceNote),
    },
    warnings,
  };
}
