import type { ResponseValidationOptions, ValidatedResponse } from "./types";

const DEFAULT_MAX_LENGTH = 8000;

/** Character budget aligned to LLM max output tokens — avoids truncating structured JSON mid-object. */
export function structuredJsonMaxLength(maxTokens: number): number {
  return Math.max(maxTokens * 4, 16_384);
}

function stripAccidentalMarkdownFences(text: string): string {
  const trimmed = text.trim();
  const fenceMatch = trimmed.match(/^```(?:[a-zA-Z0-9_-]+)?\n([\s\S]*?)\n```$/);

  if (fenceMatch?.[1]) {
    return fenceMatch[1].trim();
  }

  return trimmed.replace(/^\s*```\s*/g, "").replace(/\s*```\s*$/g, "").trim();
}

function hasMalformedOutput(text: string): boolean {
  if (!text.trim()) {
    return true;
  }

  if (text.includes("\u0000")) {
    return true;
  }

  if (/^[\s\r\n]+$/.test(text)) {
    return true;
  }

  return false;
}

export function validateResponse(
  text: string,
  options: ResponseValidationOptions = {}
): ValidatedResponse {
  const warnings: string[] = [];
  const maxLength = options.maxLength ?? DEFAULT_MAX_LENGTH;
  const originalLength = text.length;
  let normalized = stripAccidentalMarkdownFences(text);

  if (normalized.length > maxLength) {
    warnings.push(`Response truncated to ${maxLength} characters.`);
    normalized = normalized.slice(0, maxLength).trim();
  }

  if (hasMalformedOutput(normalized)) {
    return {
      success: false,
      text: "",
      warnings: ["Response was empty or malformed."],
      metadata: {
        originalLength,
        trimmedLength: normalized.length,
      },
    };
  }

  if (normalized !== text.trim()) {
    warnings.push("Removed accidental markdown formatting from the response.");
  }

  return {
    success: true,
    text: normalized,
    warnings,
    metadata: {
      originalLength,
      trimmedLength: normalized.length,
    },
  };
}
