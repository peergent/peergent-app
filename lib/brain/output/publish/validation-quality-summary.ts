import type { ValidationGraph } from "@/lib/brain/layers/validation/types";
import type { ValidationDomainId } from "@/lib/brain/layers/validation/types";
import type { ValidationQualityCheck, ValidationQualitySummary } from "../types";
import {
  confidenceLabel,
  publicationReadinessLabel,
} from "./validation-source";

const CHECK_GROUPS: readonly {
  id: string;
  en: string;
  nl: string;
  domains: readonly ValidationDomainId[];
}[] = [
  {
    id: "brand",
    en: "Brand consistency",
    nl: "Merkconsistentie",
    domains: ["brand_consistency", "tone_of_voice"],
  },
  {
    id: "audience",
    en: "Audience fit",
    nl: "Doelgroepfit",
    domains: ["audience_fit", "business_fit"],
  },
  {
    id: "positioning",
    en: "Positioning",
    nl: "Positionering",
    domains: ["positioning", "competitive_differentiation", "creative_quality"],
  },
  {
    id: "channels",
    en: "Channel suitability",
    nl: "Kanaalgeschiktheid",
    domains: [
      "channel_linkedin",
      "channel_google_ads",
      "channel_email",
      "channel_landing_page",
      "channel_blog",
    ],
  },
  {
    id: "conversion",
    en: "Conversion quality",
    nl: "Conversiekwaliteit",
    domains: ["cta_quality", "conversion_potential", "message_clarity", "trust", "objections"],
  },
  {
    id: "claims",
    en: "Claims",
    nl: "Claims",
    domains: ["legal_claims"],
  },
  {
    id: "consistency",
    en: "Message consistency",
    nl: "Boodschapconsistentie",
    domains: ["consistency"],
  },
];

function groupStatus(
  categories: ValidationGraph["report"]["categories"],
  domains: readonly ValidationDomainId[]
): ValidationQualityCheck["status"] {
  const matched = categories.filter((c) => domains.includes(c.id));
  if (matched.some((c) => c.status === "fail")) return "fail";
  if (matched.some((c) => c.status === "warning")) return "warning";
  if (matched.length === 0) return "pass";
  return "pass";
}

function groupDetail(
  report: ValidationGraph["report"],
  domains: readonly ValidationDomainId[],
  nl: boolean
): string | null {
  const warnings = report.warnings.filter((w) => domains.includes(w.category));
  const issues = report.issues.filter((i) => domains.includes(i.category));
  const count = warnings.length + issues.length;
  if (count === 0) return null;
  if (issues.some((i) => i.blocking)) {
    return nl ? `${count} blokkade` : `${count} blocking`;
  }
  return nl
    ? `${count} ${count === 1 ? "waarschuwing" : "waarschuwingen"}`
    : `${count} ${count === 1 ? "warning" : "warnings"}`;
}

/** Structured customer-facing quality summary — concise, not a QA dashboard. */
export function publishValidationQualitySummary(input: {
  validation: ValidationGraph | null;
  nl: boolean;
}): ValidationQualitySummary | null {
  if (!input.validation) return null;

  const report = input.validation.report;
  const nl = input.nl;

  const checks: ValidationQualityCheck[] = CHECK_GROUPS.map((group) => ({
    id: group.id,
    label: nl ? group.nl : group.en,
    status: groupStatus(report.categories, group.domains),
    detail: groupDetail(report, group.domains, nl),
  }));

  const blockingCount = report.issues.filter((i) => i.blocking).length;
  const warningCount = report.warnings.length;

  const strongest = checks.filter((c) => c.status === "pass").map((c) => c.label);
  const weakest = checks.filter((c) => c.status !== "pass");

  let narrative: string;
  if (report.publicationReadiness === "BLOCKED") {
    narrative = nl
      ? `Kwaliteitsreview: ${report.overallScore.value}/100. Publicatie geblokkeerd — ${blockingCount} blokkade${blockingCount === 1 ? "" : "s"}.`
      : `Quality review: ${report.overallScore.value}/100. Publication blocked — ${blockingCount} blocking issue${blockingCount === 1 ? "" : "s"}.`;
  } else if (report.publicationReadiness === "CHANGES_REQUIRED") {
    narrative = nl
      ? `Kwaliteitsreview: ${report.overallScore.value}/100. Revisie vereist voordat publicatie kan starten.`
      : `Quality review: ${report.overallScore.value}/100. Revision required before publication can begin.`;
  } else if (weakest.length > 0) {
    narrative = nl
      ? `Kwaliteitsreview: ${report.overallScore.value}/100. ${strongest.slice(0, 3).join(", ")} sterk. ${weakest.length} aandachtspunt${weakest.length === 1 ? "" : "en"}.`
      : `Quality review: ${report.overallScore.value}/100. ${strongest.slice(0, 3).join(", ")} strong. ${weakest.length} item${weakest.length === 1 ? "" : "s"} need attention.`;
  } else {
    narrative = nl
      ? `Kwaliteitsreview: ${report.overallScore.value}/100. Klaar voor goedkeuring.`
      : `Quality review: ${report.overallScore.value}/100. Ready for approval.`;
  }

  return {
    headline: nl ? "Kwaliteitsreview" : "Quality review",
    score: report.overallScore.value,
    scoreMax: report.overallScore.max,
    readinessLabel: publicationReadinessLabel(report.publicationReadiness, nl),
    confidenceLabel: confidenceLabel(input.validation.confidence, nl),
    checks,
    blockingCount,
    warningCount,
    narrative,
  };
}
