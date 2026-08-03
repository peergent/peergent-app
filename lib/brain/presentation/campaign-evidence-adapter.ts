import type { CampaignEvidenceSection } from "@/lib/office/campaign/workflow-types";
import type { BrainStructuredOutput } from "../evidence/structured-output";

export type CampaignEvidencePresentation = {
  title: string;
  intro?: string;
  sections: readonly CampaignEvidenceSection[];
};

/**
 * Maps structured Brain output → CampaignEvidenceSection for Vision v13 UI.
 * Narrative text is derived here — never stored in the core Brain model.
 */
export function presentBrainOutputForCampaign(input: {
  output: BrainStructuredOutput;
  title: string;
  intro?: string;
  findingsSectionTitle?: string;
  recommendationsSectionTitle?: string;
}): CampaignEvidencePresentation {
  const nl = false;
  const findingsTitle = input.findingsSectionTitle ?? (nl ? "Bevindingen" : "Findings");
  const recommendationsTitle =
    input.recommendationsSectionTitle ?? (nl ? "Aanbevelingen" : "Recommendations");

  const sections: CampaignEvidenceSection[] = [];

  if (input.output.findings.length > 0) {
    sections.push({
      id: "findings",
      title: findingsTitle,
      items: input.output.findings.map((f) => `${f.label}: ${f.value}`),
    });
  }

  if (input.output.decisions.length > 0) {
    sections.push({
      id: "decisions",
      title: nl ? "Beslissingen" : "Decisions",
      items: input.output.decisions.map((d) => `${d.label} — ${d.rationale}`),
    });
  }

  if (input.output.recommendations.length > 0) {
    sections.push({
      id: "recommendations",
      title: recommendationsTitle,
      items: input.output.recommendations.map((r) => r.label),
    });
  }

  if (input.output.warnings.length > 0) {
    sections.push({
      id: "warnings",
      title: nl ? "Let op" : "Warnings",
      items: input.output.warnings.map((w) => w.message),
    });
  }

  return {
    title: input.title,
    intro: input.intro,
    sections,
  };
}
