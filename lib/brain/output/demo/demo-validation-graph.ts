import { buildValidationGraph } from "@/lib/brain/layers/validation/build-validation-graph";
import type { ValidationGraph } from "@/lib/brain/layers/validation/types";
import { buildDemoCreativeGraph } from "./demo-creative-graph";

/** Deterministic demo ValidationGraph — READY_WITH_SUGGESTIONS with realistic score. */
export function buildDemoValidationGraph(input: {
  organizationId: string;
  campaignId: string;
  nl: boolean;
  now: string;
}): ValidationGraph {
  const creativeGraph = buildDemoCreativeGraph({
    organizationId: input.organizationId,
    campaignId: input.campaignId,
    nl: input.nl,
    now: input.now,
  });

  const graph = buildValidationGraph({
    organizationId: input.organizationId,
    projectId: input.campaignId,
    locale: input.nl ? "nl" : "en",
    creativeGraph,
  });

  if (graph.report.publicationReadiness === "READY" && graph.report.warnings.length === 0) {
    return {
      ...graph,
      report: {
        ...graph.report,
        publicationReadiness: "READY_WITH_SUGGESTIONS",
        warnings: [
          {
            id: "demo-claim-warn",
            category: "legal_claims",
            reason: input.nl
              ? "De term 'marktleidend' verdient onderbouwing vóór hergebruik."
              : "The term 'market-leading' should be supported before reuse.",
            businessImpact: input.nl
              ? "Vertrouwen kan dalen zonder proof op de landingspagina."
              : "Trust may drop without proof on the landing page.",
            suggestedResolution: input.nl
              ? "Voeg delivery proof toe vóór budgetverhoging."
              : "Add delivery proof before increasing spend.",
          },
          ...graph.report.warnings,
        ],
        optionalImprovements: [
          {
            warningId: "demo-claim-warn",
            category: "legal_claims",
            summary: input.nl
              ? "Onderbouw 'marktleidend' met proof."
              : "Support 'market-leading' with proof.",
            expectedImpact: input.nl
              ? "Versterkt vertrouwen na ad click."
              : "Strengthens trust after ad click.",
          },
          ...graph.report.optionalImprovements,
        ],
      },
    };
  }

  return graph;
}
