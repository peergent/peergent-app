import type { CompanyFactSource } from "./source-priority";

/** Customer correction — overrides lower-priority sources without persistence in Sprint 2. */
export type CustomerCorrection = {
  id: string;
  organizationId: string;
  fieldKey: string;
  correctedValue: string | null;
  correctedListValue?: readonly string[];
  reason?: string;
  correctedAt: string;
  correctedBy: string;
  /** Corrections always map to customer_confirmed source priority. */
  source: Extract<CompanyFactSource, "customer_confirmed">;
};

export function applyCorrectionToFieldValue(
  currentValue: string | null,
  correction: CustomerCorrection | undefined
): string | null {
  if (!correction) return currentValue;
  return correction.correctedValue;
}
