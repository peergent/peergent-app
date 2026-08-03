import type { CompanyFactSource } from "./source-priority";

export type CustomerCorrectionAction =
  | "edit"
  | "remove"
  | "replace"
  | "approve"
  | "reject_inference";

/** Customer correction — overrides lower-priority sources. */
export type CustomerCorrection = {
  id: string;
  organizationId: string;
  fieldKey: string;
  action: CustomerCorrectionAction;
  correctedValue: string | null;
  correctedListValue?: readonly string[];
  reason?: string;
  correctedAt: string;
  correctedBy: string;
  /** Corrections always map to customer_confirmed source priority. */
  source: Extract<CompanyFactSource, "customer_confirmed">;
  /** Fields whose cached context should invalidate when this correction applies. */
  invalidates?: readonly string[];
};

export function defaultInvalidationsForField(fieldKey: string): readonly string[] {
  const map: Record<string, readonly string[]> = {
    website: ["website_snapshot", "company_snapshot", "company_understanding", "strategy"],
    industry: ["company_snapshot", "company_understanding"],
    targetAudiences: ["company_snapshot", "company_understanding", "strategy"],
    positioning: ["company_snapshot", "company_understanding", "strategy", "creative_generation"],
    tone: ["company_snapshot", "brand_understanding", "creative_generation"],
    mainCompetitors: ["company_snapshot", "competitor_understanding", "strategy"],
  };
  return map[fieldKey] ?? ["company_snapshot", "company_understanding"];
}

export function applyCorrectionToFieldValue(
  currentValue: string | null,
  correction: CustomerCorrection | undefined
): string | null {
  if (!correction) return currentValue;
  if (correction.action === "remove") return null;
  if (correction.action === "reject_inference") return null;
  if (correction.action === "approve") return currentValue;
  return correction.correctedValue;
}

export function applyCorrectionToListValue(
  currentValue: readonly string[] | null | undefined,
  correction: CustomerCorrection | undefined
): readonly string[] | null {
  if (!correction) return currentValue ?? null;
  if (correction.action === "remove" || correction.action === "reject_inference") return null;
  if (correction.correctedListValue) return correction.correctedListValue;
  return currentValue ?? null;
}
