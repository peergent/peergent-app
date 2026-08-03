/**
 * @deprecated Use `@/lib/brain/presentation/campaign-evidence-adapter` for UI mapping.
 * Provenance kinds align with BrainProvenanceKind in lib/brain/domain/provenance.ts.
 */
export type { BrainProvenanceKind as BrainEvidenceSource } from "@/lib/brain/domain/provenance";

/** @deprecated Narrative view model — derive from BrainStructuredOutput via presentation adapter. */
export type BrainEvidence = {
  source: import("@/lib/brain/domain/provenance").BrainProvenanceKind;
  summary: string;
  findings: readonly string[];
  recommendation: string;
  reasoning: string;
  confidence?: "low" | "medium" | "high";
};
