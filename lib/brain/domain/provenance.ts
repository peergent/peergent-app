/** Canonical source of a Brain finding — everything must be traceable. */
export type BrainProvenanceKind =
  | "customer_input"
  | "customer_confirmed"
  | "customer_entered"
  | "website"
  | "website_extracted"
  | "integration"
  | "document"
  | "company_profile"
  | "business_brain"
  | "brand_brain"
  | "campaign_context"
  | "capability_output"
  | "assumption"
  | "performance"
  | "memory"
  | "market"
  | "competitor"
  | "demo_fixture"
  | "model_inference"
  | "brain_inference"
  | "unknown";

export type BrainProvenanceRef = {
  kind: BrainProvenanceKind;
  /** Stable reference id — never a huge raw payload. */
  refId: string;
  label?: string;
  capturedAt?: string;
};
