import type { Json } from "@/lib/supabase/database.types";
import type { BrandPositioning } from "../types";

export function toJson(value: unknown): Json {
  return value as Json;
}

export function parseRecord(value: Json | null | undefined): Record<string, unknown> {
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value) as unknown;
      return parseRecord(parsed as Json);
    } catch {
      return {};
    }
  }

  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value as Record<string, unknown>;
}

function readString(record: Record<string, unknown>, ...keys: string[]): string | undefined {
  for (const key of keys) {
    const candidate = record[key];
    if (typeof candidate === "string" && candidate.trim()) {
      return candidate;
    }
  }
  return undefined;
}

function readKeyMessages(record: Record<string, unknown>): string[] {
  const raw = record.keyMessages ?? record.key_messages;

  if (Array.isArray(raw)) {
    return raw.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
  }

  if (typeof raw === "string" && raw.trim()) {
    return raw
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

export function parseBrandPositioning(value: Json | null | undefined): BrandPositioning {
  let record = parseRecord(value);
  const nested = record.brandPositioning ?? record.brand_positioning;

  if (nested && typeof nested === "object" && !Array.isArray(nested)) {
    record = nested as Record<string, unknown>;
  }

  return {
    positioningStatement: readString(
      record,
      "positioningStatement",
      "positioning_statement"
    ),
    tagline: readString(record, "tagline"),
    valueProposition: readString(record, "valueProposition", "value_proposition"),
    keyMessages: readKeyMessages(record),
    marketCategory: readString(record, "marketCategory", "market_category"),
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
