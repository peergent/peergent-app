import type { BrainConfidence } from "../domain/confidence";

/**
 * Source priority for company facts — higher rank wins on conflict.
 * 1. Customer confirmed → 2. Customer entered → 3. Website extracted →
 * 4. Integration → 5. Brain inference → 6. Unknown
 */
export type CompanyFactSource =
  | "customer_confirmed"
  | "customer_entered"
  | "website_extracted"
  | "integration"
  | "brain_inference"
  | "unknown";

export const COMPANY_FACT_SOURCE_PRIORITY: readonly CompanyFactSource[] = [
  "customer_confirmed",
  "customer_entered",
  "website_extracted",
  "integration",
  "brain_inference",
  "unknown",
];

export function sourcePriorityRank(source: CompanyFactSource): number {
  const index = COMPANY_FACT_SOURCE_PRIORITY.indexOf(source);
  return index === -1 ? COMPANY_FACT_SOURCE_PRIORITY.length : index;
}

export function winningSource(
  a: CompanyFactSource,
  b: CompanyFactSource
): CompanyFactSource {
  return sourcePriorityRank(a) <= sourcePriorityRank(b) ? a : b;
}

export type CompanyProfileField<T = string> = {
  value: T | null;
  source: CompanyFactSource;
  confidence: BrainConfidence;
  lastUpdatedAt: string | null;
  freshness: import("../domain/freshness").FreshnessState;
  customerConfirmed: boolean;
};

export function emptyCompanyField(): CompanyProfileField {
  return {
    value: null,
    source: "unknown",
    confidence: "low",
    lastUpdatedAt: null,
    freshness: "unknown",
    customerConfirmed: false,
  };
}

export function fieldFromListValue(
  value: readonly string[] | null,
  source: CompanyFactSource,
  options: {
    confidence?: BrainConfidence;
    lastUpdatedAt?: string;
    freshness?: import("../domain/freshness").FreshnessState;
    customerConfirmed?: boolean;
  } = {}
): CompanyProfileField<readonly string[]> {
  return {
    value,
    source,
    confidence: options.confidence ?? (value?.length ? "medium" : "low"),
    lastUpdatedAt: options.lastUpdatedAt ?? null,
    freshness: options.freshness ?? (value?.length ? "fresh" : "unknown"),
    customerConfirmed: options.customerConfirmed ?? source === "customer_confirmed",
  };
}

export function fieldFromValue(
  value: string | null,
  source: CompanyFactSource,
  options: {
    confidence?: BrainConfidence;
    lastUpdatedAt?: string;
    freshness?: import("../domain/freshness").FreshnessState;
    customerConfirmed?: boolean;
  } = {}
): CompanyProfileField {
  return {
    value,
    source,
    confidence: options.confidence ?? (value ? "medium" : "low"),
    lastUpdatedAt: options.lastUpdatedAt ?? null,
    freshness: options.freshness ?? (value ? "fresh" : "unknown"),
    customerConfirmed: options.customerConfirmed ?? source === "customer_confirmed",
  };
}
