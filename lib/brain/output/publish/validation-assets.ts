import type { ValidationGraph } from "@/lib/brain/layers/validation/types";
import type { CreativeStrategyAssetOutput, BrainOutputRecommendation } from "../types";
import { sanitizeCustomerText } from "../sanitize";

function deliverableQualityState(
  deliverableId: string,
  validation: ValidationGraph | null,
  nl: boolean
): { statusLabel: string; statusTone: CreativeStrategyAssetOutput["statusTone"] } {
  if (!validation) {
    return {
      statusLabel: nl ? "Klaar voor review" : "Ready for review",
      statusTone: "review",
    };
  }

  const report = validation.report;
  const rejected = report.rejectedDeliverables.find((d) => d.deliverableId === deliverableId);
  if (rejected) {
    return {
      statusLabel: nl ? "Geblokkeerd" : "Blocked",
      statusTone: "review",
    };
  }

  const deliverableIssues = report.issues.filter((i) => i.deliverableId === deliverableId);
  const deliverableWarnings = report.warnings.filter((w) => w.deliverableId === deliverableId);

  if (deliverableIssues.some((i) => i.blocking)) {
    return {
      statusLabel: nl ? "Geblokkeerd" : "Blocked",
      statusTone: "review",
    };
  }

  if (deliverableIssues.length > 0) {
    return {
      statusLabel: nl ? "Revisie nodig" : "Needs revision",
      statusTone: "draft",
    };
  }

  if (deliverableWarnings.length > 0) {
    const reason = sanitizeCustomerText(deliverableWarnings[0]?.reason);
    return {
      statusLabel: reason
        ? nl
          ? `Klaar · ${reason.slice(0, 40)}`
          : `Ready · ${reason.slice(0, 40)}`
        : nl
          ? "Klaar met suggestie"
          : "Ready with suggestion",
      statusTone: "review",
    };
  }

  if (report.approvedDeliverables.find((d) => d.deliverableId === deliverableId)) {
    return {
      statusLabel: nl ? "Klaar" : "Ready",
      statusTone: "review",
    };
  }

  if (report.publicationReadiness === "BLOCKED" || report.publicationReadiness === "CHANGES_REQUIRED") {
    return {
      statusLabel: nl ? "Revisie nodig" : "Needs revision",
      statusTone: "draft",
    };
  }

  return {
    statusLabel: nl ? "Klaar" : "Ready",
    statusTone: "review",
  };
}

/** Apply validation verdict to creative assets — verdict only, not machinery. */
export function enrichAssetsWithValidation(input: {
  assets: readonly CreativeStrategyAssetOutput[];
  validation: ValidationGraph | null;
  nl: boolean;
}): readonly CreativeStrategyAssetOutput[] {
  if (!input.validation) return input.assets;

  return input.assets.map((asset) => {
    const quality = deliverableQualityState(asset.id, input.validation, input.nl);
    return {
      ...asset,
      statusLabel: quality.statusLabel,
      statusTone: quality.statusTone,
    };
  });
}

export function publishValidationRecommendations(input: {
  validation: ValidationGraph | null;
  nl: boolean;
  href?: string | null;
}): {
  required: BrainOutputRecommendation[];
  optional: BrainOutputRecommendation[];
} {
  if (!input.validation) return { required: [], optional: [] };

  const report = input.validation.report;
  const nl = input.nl;

  const required = report.requiredFixes.map((fix) => {
    const issue = report.issues.find((i) => i.id === fix.issueId);
    return {
      id: `req-fix-${fix.issueId}`,
      headline: nl ? "Verplichte aanpassing" : "Required fix",
      reason: sanitizeCustomerText(fix.summary) ?? fix.summary,
      expectedOutcome: nl ? "Deblokkeert publicatie." : "Unblocks publication.",
      confidence: { value: 0.95, label: nl ? "Hoog" : "High" },
      businessImpact: sanitizeCustomerText(issue?.businessImpact) ?? (nl ? "Blokkeert voortgang." : "Blocks progress."),
      whyNow: nl ? "Moet worden opgelost vóór goedkeuring." : "Must be resolved before approval.",
      href: input.href ?? null,
      source: "validation" as const,
    };
  });

  const optional = report.optionalImprovements.map((imp) => ({
    id: `opt-imp-${imp.warningId}`,
    headline: nl ? "Optionele verbetering" : "Optional improvement",
    reason: sanitizeCustomerText(imp.summary) ?? imp.summary,
    expectedOutcome: sanitizeCustomerText(imp.expectedImpact) ?? imp.expectedImpact,
    confidence: { value: 0.6, label: nl ? "Gemiddeld" : "Medium" },
    businessImpact: sanitizeCustomerText(imp.expectedImpact) ?? imp.expectedImpact,
    whyNow: nl ? "Verbetert resultaat maar blokkeert niet." : "Improves results but does not block.",
    href: input.href ?? null,
    source: "validation" as const,
  }));

  return { required, optional };
}
