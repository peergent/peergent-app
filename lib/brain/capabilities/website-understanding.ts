import type { CompanySnapshot } from "../company/snapshot";
import type { WebsiteSnapshot } from "../website/types";
import type { BrainStructuredOutput } from "../evidence/structured-output";
import { emptyBrainStructuredOutput } from "../evidence/structured-output";
import { getBrainCapability } from "../capabilities/registry";

export type WebsiteUnderstandingInput = {
  companySnapshot: CompanySnapshot;
  websiteSnapshot?: WebsiteSnapshot | null;
  locale?: "nl" | "en" | null;
};

/**
 * Deterministic website_understanding — no LLM, no crawl.
 */
export function executeWebsiteUnderstanding(
  input: WebsiteUnderstandingInput
): BrainStructuredOutput {
  const def = getBrainCapability("website_understanding");
  const generatedAt = new Date().toISOString();
  const nl = input.locale === "nl";
  const website = input.websiteSnapshot ?? input.companySnapshot.website;
  const base = emptyBrainStructuredOutput("website_understanding", def.version, generatedAt);

  if (!website) {
    return {
      ...base,
      warnings: [
        {
          id: "warn-no-website",
          code: "website_unavailable",
          message: nl
            ? "Dat weet ik nog niet — er is nog geen website-snapshot beschikbaar."
            : "I don't know yet — no website snapshot is available.",
          provenance: [
            { kind: "website", refId: input.companySnapshot.organizationId, label: "missing" },
          ],
        },
      ],
    };
  }

  const findings = website.findings.map((f) => ({
    id: f.id,
    label: f.label,
    value: f.evidence.join(" "),
    confidence: f.confidence,
    provenance: [
      {
        kind: "website" as const,
        refId: website.source.url,
        label: f.kind,
        capturedAt: website.assembledAt,
      },
    ],
  }));

  const recommendations = website.findings
    .filter((f) => f.recommendation)
    .map((f) => ({
      id: `rec-${f.id}`,
      label: f.recommendation!,
      priority: f.severity === "critical" ? ("high" as const) : ("medium" as const),
      provenance: [{ kind: "website" as const, refId: website.source.url }],
    }));

  return {
    ...base,
    findings,
    recommendations,
    warnings: website.seo.issues.length
      ? [
          {
            id: "warn-seo",
            code: "seo_notes",
            message: website.seo.issues.join(" "),
            provenance: [{ kind: "website", refId: website.source.url }],
          },
        ]
      : [],
  };
}
