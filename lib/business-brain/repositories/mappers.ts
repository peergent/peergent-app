import type { Json } from "@/lib/supabase/database.types";
import type {
  FactConfidence,
  FactImportance,
  KnowledgeSourceType,
} from "../types";

export function toJson(value: unknown): Json {
  return value as Json;
}

export function parseRecord(value: Json | null | undefined): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }
  return value as Record<string, unknown>;
}

export function parseStringArray(value: Json | null | undefined): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

export function parseFactConfidence(value: string | null | undefined): FactConfidence {
  if (value === "low" || value === "high") return value;
  return "moderate";
}

export function parseFactImportance(value: string | null | undefined): FactImportance {
  if (value === "low" || value === "high") return value;
  return "medium";
}

const KNOWLEDGE_SOURCE_TYPES = new Set<KnowledgeSourceType>([
  "pdf",
  "website",
  "notion",
  "google_drive",
  "confluence",
  "email",
  "manual_note",
]);

export function parseKnowledgeSourceType(value: string): KnowledgeSourceType {
  if (KNOWLEDGE_SOURCE_TYPES.has(value as KnowledgeSourceType)) {
    return value as KnowledgeSourceType;
  }
  return "manual_note";
}

export function requireOrganizationId(
  organizationId: string | null | undefined
): string {
  if (!organizationId) {
    throw new Error("An active organization is required for Business Brain operations.");
  }
  return organizationId;
}
