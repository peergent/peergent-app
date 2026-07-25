import type { ExplainabilityView } from "@/lib/marketing-workspace/experience";

export type ExplainabilityPresentationViewModel = {
  title: string;
  summary: string;
  reasons: string[];
  supportingPoints: string[];
  confidenceLabel?: string;
};

const CONFIDENCE_LABELS: Record<string, string> = {
  high: "High confidence",
  moderate: "Moderate confidence",
  low: "Limited confidence",
};

export function presentExplainability(view: ExplainabilityView): ExplainabilityPresentationViewModel {
  return {
    title: view.title,
    summary: view.reasoning,
    reasons: view.evidence.slice(0, 6),
    supportingPoints: view.sourceReferences.map(humanizeSourceReference),
    confidenceLabel: view.confidence ? CONFIDENCE_LABELS[view.confidence] ?? view.confidence : undefined,
  };
}

function humanizeSourceReference(reference: string): string {
  return reference
    .replace(/-/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}
