/**
 * Marketing Intelligence — funnel domain.
 */

import type { ReasoningBrainGraph } from "../reasoning/brain-types";
import type { FunnelIntelligence, MarketingEvidenceRef } from "./brain-types";

const FUNNEL_STAGES = [
  "awareness",
  "consideration",
  "intent",
  "conversion",
  "retention",
  "advocacy",
] as const;

export function buildFunnelIntelligence(input: {
  reasoningGraph: ReasoningBrainGraph;
  evidence: readonly MarketingEvidenceRef[];
}): FunnelIntelligence[] {
  return FUNNEL_STAGES.map((stage) => {
    const relatedUnknowns = input.reasoningGraph.unknowns.filter((u) =>
      u.description.toLowerCase().includes(stage)
    );
    const gaps = relatedUnknowns.map((u) => u.description);
    const hasGap = gaps.length > 0 || input.reasoningGraph.unknowns.length > 2;

    return {
      stage,
      status: hasGap ? ("gap" as const) : ("unknown" as const),
      gaps,
      weakHandoffs: stage === "consideration" ? ["Intent handoff may lack proof"] : [],
      missingProof: stage === "conversion" ? ["Conversion-stage proof may be insufficient"] : [],
      missingContent: stage === "awareness" ? ["Top-of-funnel education content unclear"] : [],
      missingCta: [],
      trustGaps: input.reasoningGraph.risks.slice(0, 1).map((r) => r.description),
      intentMismatch: [],
      measurementGaps: stage === "conversion" ? ["Measurement readiness uncertain"] : [],
      confidence: hasGap ? "low" : "medium",
      evidenceIds: input.evidence.slice(0, 2).map((e) => e.id),
    };
  });
}

export function detectFunnelGaps(funnel: readonly FunnelIntelligence[]): string[] {
  return funnel.filter((f) => f.status === "gap").flatMap((f) => f.gaps);
}
