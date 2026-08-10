/**
 * Resolve ValidationGraph from persisted brain output.
 */

import type { BrainStructuredOutput } from "@/lib/brain/evidence/structured-output";
import type {
  PublicationReadiness,
  ValidationGraph,
  ValidationReport,
} from "@/lib/brain/layers/validation/types";

export function resolveValidationGraph(
  output?: BrainStructuredOutput | null
): ValidationGraph | null {
  if (!output) return null;
  if (output.validationGraph) return output.validationGraph;

  const readinessFinding = output.findings.find((f) => f.id === "validation-readiness");
  if (!readinessFinding?.value) return null;

  try {
    const scoreFinding = output.findings.find((f) => f.id === "validation-overall-score");
    const categories = output.findings
      .filter((f) => f.id.startsWith("validation-category-"))
      .map((f) => JSON.parse(f.value) as { status: string; score: number; summary: string });

    if (categories.length === 0) return null;

    const report: ValidationReport = {
      version: "1.0.0",
      organizationId: "",
      campaignId: "",
      createdAt: output.generatedAt,
      overallScore: {
        value: Number(scoreFinding?.value ?? 0),
        max: 100,
        label: "good",
      },
      publicationReadiness: readinessFinding.value as PublicationReadiness,
      categories: [],
      issues: [],
      warnings: output.warnings.map((w, i) => ({
        id: w.id || `warn-${i}`,
        category: "legal_claims" as const,
        reason: w.message,
        businessImpact: "",
        suggestedResolution: "",
      })),
      passes: [],
      requiredFixes: [],
      optionalImprovements: [],
      businessRisks: [],
      brandRisks: [],
      approvedDeliverables: [],
      rejectedDeliverables: [],
      reasoningSummary: "",
      confidence: "medium",
      estimatedQuality: { value: Number(scoreFinding?.value ?? 0), max: 100, label: "good" },
      estimatedConversion: { value: 0, max: 100, label: "fair" },
    };

    return {
      version: "1.0.0",
      organizationId: "",
      campaignId: "",
      createdAt: output.generatedAt,
      creativeGraphRef: "",
      report,
      phases: [],
      confidence: "medium",
    };
  } catch {
    return null;
  }
}

/** Canonical customer-facing readiness language — never expose internal codes. */
export function publicationReadinessLabel(readiness: PublicationReadiness, nl: boolean): string {
  const labels: Record<PublicationReadiness, { en: string; nl: string }> = {
    READY: { en: "Ready", nl: "Klaar" },
    READY_WITH_SUGGESTIONS: {
      en: "Ready · suggestions available",
      nl: "Klaar · suggesties beschikbaar",
    },
    CHANGES_REQUIRED: { en: "Revision required", nl: "Revisie vereist" },
    BLOCKED: { en: "Publication blocked", nl: "Publicatie geblokkeerd" },
  };
  return nl ? labels[readiness].nl : labels[readiness].en;
}

export function confidenceLabel(
  confidence: ValidationGraph["confidence"],
  nl: boolean
): string {
  switch (confidence) {
    case "high":
      return nl ? "Hoog vertrouwen" : "High confidence";
    case "medium":
      return nl ? "Gemiddeld vertrouwen" : "Medium confidence";
    default:
      return nl ? "Laag vertrouwen" : "Low confidence";
  }
}

export function isApprovalSafe(readiness: PublicationReadiness): boolean {
  return readiness === "READY" || readiness === "READY_WITH_SUGGESTIONS";
}

export function isPublicationBlocked(readiness: PublicationReadiness): boolean {
  return readiness === "BLOCKED" || readiness === "CHANGES_REQUIRED";
}
