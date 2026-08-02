/**
 * Future Project Brain boundary — UI consumes structured outputs regardless of source.
 * Simulation fills these today; live Project Brain replaces generation later.
 */

export type BrainEvidenceSource =
  | "simulated"
  | "real"
  | "user_input"
  | "company_profile"
  | "missing";

export type BrainEvidence = {
  source: BrainEvidenceSource;
  summary: string;
  findings: readonly string[];
  recommendation: string;
  reasoning: string;
  confidence?: "low" | "medium" | "high";
};
