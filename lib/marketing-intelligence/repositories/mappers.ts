import type { Json } from "@/lib/supabase/database.types";
import type { BrandPositioning } from "../types";

export function toJson(value: unknown): Json {
  return value as Json;
}

export function parseRecord(value: Json | null | undefined): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }
  return value as Record<string, unknown>;
}

export function parseBrandPositioning(value: Json | null | undefined): BrandPositioning {
  const record = parseRecord(value);
  const keyMessages = record.keyMessages;

  return {
    positioningStatement:
      typeof record.positioningStatement === "string"
        ? record.positioningStatement
        : undefined,
    tagline: typeof record.tagline === "string" ? record.tagline : undefined,
    valueProposition:
      typeof record.valueProposition === "string" ? record.valueProposition : undefined,
    keyMessages: Array.isArray(keyMessages)
      ? keyMessages.filter((item): item is string => typeof item === "string")
      : [],
    marketCategory:
      typeof record.marketCategory === "string" ? record.marketCategory : undefined,
  };
}

export function emptyBrandPositioning(): BrandPositioning {
  return { keyMessages: [] };
}

export function requireOrganizationId(
  organizationId: string | null | undefined
): string {
  if (!organizationId) {
    throw new Error("An active organization is required for Marketing Intelligence operations.");
  }
  return organizationId;
}

export function parseGoalStatus(value: string | null | undefined) {
  if (
    value === "active" ||
    value === "planned" ||
    value === "completed" ||
    value === "paused"
  ) {
    return value;
  }
  return "active" as const;
}

export function parseContentType(value: string | null | undefined) {
  const allowed = [
    "blog_post",
    "social_post",
    "email",
    "landing_page",
    "video",
    "case_study",
    "whitepaper",
    "other",
  ] as const;

  if (allowed.includes(value as (typeof allowed)[number])) {
    return value as (typeof allowed)[number];
  }
  return "other" as const;
}
