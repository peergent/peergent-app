import type { CampaignEvidenceSection } from "@/lib/office/campaign/workflow-types";
import type { BrainStructuredOutput } from "../evidence/structured-output";

export type CampaignEvidencePresentation = {
  title: string;
  intro?: string;
  sections: readonly CampaignEvidenceSection[];
};

const INTERNAL_PATTERNS = [
  /^capabilityId:/i,
  /^provider:/i,
  /cache_hit/i,
  /ctx-[a-f0-9]+/i,
  /run-[a-z0-9-]+/i,
];

function sanitizeCustomerText(text: string): string {
  let value = text
    .replace(/linkedin_post|google_ads_campaign|creative_generation|channel_planning/gi, "")
    .replace(/\s+/g, " ")
    .trim();
  for (const pattern of INTERNAL_PATTERNS) {
    if (pattern.test(value)) value = value.replace(pattern, "").trim();
  }
  return value.replace(/\(\s*\)/g, "").trim();
}

/**
 * Maps structured Brain output → CampaignEvidenceSection for Vision v13 UI.
 * Narrative text is derived here — never stored in the core Brain model.
 */
export function presentBrainOutputForCampaign(input: {
  output: BrainStructuredOutput;
  title: string;
  intro?: string;
  locale?: "nl" | "en";
  findingsSectionTitle?: string;
  recommendationsSectionTitle?: string;
}): CampaignEvidencePresentation {
  const nl = input.locale === "nl";
  const findingsTitle = input.findingsSectionTitle ?? (nl ? "Bevindingen" : "Findings");
  const recommendationsTitle =
    input.recommendationsSectionTitle ?? (nl ? "Aanbevelingen" : "Recommendations");

  const sections: CampaignEvidenceSection[] = [];

  if (input.output.findings.length > 0) {
    sections.push({
      id: "findings",
      title: findingsTitle,
      items: input.output.findings.map((f) =>
        sanitizeCustomerText(`${f.label}: ${f.value}`)
      ),
    });
  }

  if (input.output.decisions.length > 0) {
    sections.push({
      id: "decisions",
      title: nl ? "Beslissingen" : "Decisions",
      items: input.output.decisions.map((d) =>
        sanitizeCustomerText(`${d.label} — ${d.rationale}`)
      ),
    });
  }

  if (input.output.recommendations.length > 0) {
    sections.push({
      id: "recommendations",
      title: recommendationsTitle,
      items: input.output.recommendations.map((r) => sanitizeCustomerText(r.label)),
    });
  }

  if (input.output.warnings.length > 0) {
    sections.push({
      id: "warnings",
      title: nl ? "Let op" : "Notes",
      items: input.output.warnings.map((w) => sanitizeCustomerText(w.message)),
    });
  }

  const unknownWarnings = input.output.warnings.filter((w) =>
    /unknown|onbekend|missing|insufficient|nog nodig|still need/i.test(w.message)
  );
  if (unknownWarnings.length > 0) {
    sections.push({
      id: "unknowns",
      title: nl ? "Nog onbekend" : "Still unknown",
      items: unknownWarnings.map((w) => sanitizeCustomerText(w.message)),
    });
  }

  return {
    title: input.title,
    intro: input.intro,
    sections,
  };
}
