import type { ResearchBrainGraph } from "../layers/research/brain-types";
import type { ReasoningBrainGraph } from "../layers/reasoning/brain-types";
import { resolveIntelligenceLlmConfig } from "./intelligence-llm-config";

export type PromptEvidenceItem = {
  readonly evidenceId: string;
  readonly label: string;
  readonly sourceType: string;
  readonly url: string | null;
  readonly excerpt: string;
  readonly classification: "FACT" | "OBSERVATION" | "INFERENCE" | "UNKNOWN";
};

export function buildResearchEvidencePromptItems(
  researchGraph: ResearchBrainGraph
): PromptEvidenceItem[] {
  const config = resolveIntelligenceLlmConfig();
  return researchGraph.evidence.slice(0, config.maxEvidenceItems).map((ev, index) => {
    const finding = researchGraph.findings.find((f) => f.evidenceIds.includes(ev.id));
    const findingType = finding?.findingType ?? "observation";
    const classification =
      findingType === "fact"
        ? "FACT"
        : findingType === "hypothesis"
          ? "INFERENCE"
          : findingType === "gap"
            ? "UNKNOWN"
            : "OBSERVATION";

    return {
      evidenceId: ev.id,
      label: `E${index + 1}`,
      sourceType: ev.sourceType,
      url: ev.url,
      excerpt: ev.normalizedSummary.slice(0, config.maxExcerptChars),
      classification,
    };
  });
}

export function formatEvidenceForPrompt(items: readonly PromptEvidenceItem[]): string {
  return items
    .map(
      (item) =>
        `[${item.label} id=${item.evidenceId} type=${item.classification} source=${item.sourceType}` +
        `${item.url ? ` url=${item.url}` : ""}]\n` +
        `UNTRUSTED_EXTERNAL_DATA: ${item.excerpt}`
    )
    .join("\n\n");
}

export function buildReasoningSummaryForMiPrompt(reasoningGraph: ReasoningBrainGraph): string {
  return reasoningGraph.interpretations
    .slice(0, 8)
    .map(
      (i) =>
        `- ${i.title}: ${i.summary} [evidence: ${i.supportedEvidence.join(", ") || "none"}]`
    )
    .join("\n");
}

export function validEvidenceIdSet(items: readonly PromptEvidenceItem[]): Set<string> {
  return new Set(items.map((item) => item.evidenceId));
}
