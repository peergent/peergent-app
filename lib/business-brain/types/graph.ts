/** Entity kinds for cross-references and future Knowledge Graph node mapping. */
export type BusinessBrainEntityKind =
  | "business_brain"
  | "product"
  | "service"
  | "customer_segment"
  | "competitor"
  | "internal_process"
  | "knowledge_source"
  | "fact";

/** Stable reference to any Business Brain entity — becomes a graph node identifier. */
export type BusinessBrainEntityRef = {
  kind: BusinessBrainEntityKind;
  id: string;
};

export type FactConfidence = "low" | "moderate" | "high";
export type FactImportance = "low" | "medium" | "high";

export type KnowledgeSourceType =
  | "pdf"
  | "website"
  | "notion"
  | "google_drive"
  | "confluence"
  | "email"
  | "manual_note";
