/** Canonical source of a Brain finding — everything must be traceable. */
export type BrainProvenanceKind =
  | "customer_input"
  | "website"
  | "integration"
  | "document"
  | "company_profile"
  | "performance"
  | "memory"
  | "market"
  | "competitor"
  | "demo_fixture"
  | "model_inference";

export type BrainProvenanceRef = {
  kind: BrainProvenanceKind;
  /** Stable reference id — never a huge raw payload. */
  refId: string;
  label?: string;
  capturedAt?: string;
};
