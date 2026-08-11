/**
 * Marketing Intelligence Brain — map graph to structured output.
 */

import type { BrainStructuredOutput } from "../../evidence/structured-output";
import type { MarketingIntelligenceBrainGraph } from "./brain-types";
import { MARKETING_INTELLIGENCE_BRAIN_VERSION } from "./brain-types";

export function mapMarketingIntelligenceToStructuredOutput(
  graph: MarketingIntelligenceBrainGraph,
  generatedAt?: string
): BrainStructuredOutput {
  const at = generatedAt ?? graph.updatedAt;

  const findings = graph.marketingPriorities.map((p) => ({
    id: p.id,
    label: p.subject,
    value: p.reasoning,
    confidence: p.confidence,
    provenance: [
      {
        kind: "capability_output" as const,
        refId: p.id,
        capturedAt: at,
      },
    ],
  }));

  const warnings = graph.summary.insufficientDataFlags.map((flag, i) => ({
    id: `warn-mi-${i}`,
    code: flag,
    message: `Marketing intelligence flag: ${flag}`,
    provenance: [{ kind: "capability_output" as const, refId: graph.version, capturedAt: at }],
  }));

  return {
    capabilityId: "marketing_intelligence",
    capabilityVersion: MARKETING_INTELLIGENCE_BRAIN_VERSION,
    findings,
    decisions: [],
    marketingIntelligenceBrainGraph: graph,
    recommendations: graph.opportunitySignals.map((o) => ({
      id: o.id,
      label: o.title,
      priority: o.urgency,
      provenance: o.evidenceIds.map((refId) => ({
        kind: "capability_output" as const,
        refId,
        capturedAt: at,
      })),
    })),
    actionProposals: [],
    executionResults: [],
    warnings,
    errors: [],
    generatedAt: at,
  };
}
