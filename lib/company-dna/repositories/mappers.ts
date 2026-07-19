import type { Json } from "@/lib/supabase/database.types";
import type {
  CompanyValue,
  DecisionPrinciple,
  RiskProfile,
  ToneOfVoice,
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

export function parseValues(value: Json | null | undefined): CompanyValue[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (item): item is CompanyValue =>
      Boolean(item && typeof item === "object" && "id" in item && "name" in item)
  );
}

export function parseToneOfVoice(value: Json | null | undefined): ToneOfVoice {
  return parseRecord(value) as ToneOfVoice;
}

export function parseRiskProfile(value: Json | null | undefined): RiskProfile {
  return parseRecord(value) as RiskProfile;
}

export function parseDecisionPrinciples(
  value: Json | null | undefined
): DecisionPrinciple[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (item): item is DecisionPrinciple =>
      Boolean(item && typeof item === "object" && "id" in item && "name" in item)
  );
}

export function requireOrganizationId(
  organizationId: string | null | undefined
): string {
  if (!organizationId) {
    throw new Error("An active organization is required for Company DNA operations.");
  }
  return organizationId;
}
