import type { ValidationGraph } from "@/lib/brain/layers/validation/types";
import type { ApprovalReason, ExecutiveApprovalAction } from "../types";
import { customerTextOrFallback, sanitizeCustomerText } from "../sanitize";
import {
  isApprovalSafe,
  publicationReadinessLabel,
} from "./validation-source";

function reviewedAreas(nl: boolean): string {
  return nl
    ? "merk, doelgroep, positionering, kanaalgeschiktheid en conversiekwaliteit"
    : "brand, audience, positioning, channel fit and conversion quality";
}

/** Validation-aware approval explanation — explains WHY approval is safe. */
export function publishValidationApprovalReason(input: {
  validation: ValidationGraph | null;
  nl: boolean;
}): ApprovalReason | null {
  if (!input.validation) return null;
  const report = input.validation.report;
  const nl = input.nl;

  if (!isApprovalSafe(report.publicationReadiness)) return null;

  const score = report.overallScore.value;
  const readiness = publicationReadinessLabel(report.publicationReadiness, nl);
  const warning = report.warnings[0];

  const summary = nl
    ? `Emma beoordeelde de campagne op ${reviewedAreas(true)}. Score: ${score}/100 — ${readiness.toLowerCase()}.`
    : `Emma reviewed the campaign across ${reviewedAreas(false)}. Score: ${score}/100 — ${readiness.toLowerCase()}.`;

  const warningNote = warning
    ? nl
      ? ` Eén niet-blokkerende waarschuwing: ${sanitizeCustomerText(warning.reason) ?? warning.reason}`
      : ` One non-blocking warning remains: ${sanitizeCustomerText(warning.reason) ?? warning.reason}`
    : "";

  return {
    summary: summary + warningNote,
    unblocks: nl
      ? "Publicatie kan starten na jouw goedkeuring."
      : "Publishing can begin after your approval.",
    expectedImpact: customerTextOrFallback(
      report.estimatedConversion.value > 0
        ? nl
          ? `Geschat conversiepotentieel: ${report.estimatedConversion.value}/100.`
          : `Estimated conversion potential: ${report.estimatedConversion.value}/100.`
        : null,
      nl ? "Campagne klaar voor publicatie." : "Campaign ready for publication."
    ),
  };
}

export function publishValidationExecutiveApprovals(input: {
  validation: ValidationGraph | null;
  nl: boolean;
  href?: string | null;
}): readonly ExecutiveApprovalAction[] {
  if (!input.validation) return [];
  const report = input.validation.report;
  const nl = input.nl;

  if (!isApprovalSafe(report.publicationReadiness)) return [];

  const score = report.overallScore.value;
  const warning = report.warnings[0];

  let reason = nl
    ? `Emma beoordeelde de campagne op ${reviewedAreas(true)}.`
    : `Emma reviewed the campaign across ${reviewedAreas(false)}.`;

  reason += nl
    ? ` De campagne scoorde ${score}/100 en is klaar voor publicatie.`
    : ` The campaign scored ${score}/100 and is ready for publication.`;

  if (warning) {
    reason += nl
      ? ` Eén niet-blokkerende waarschuwing: ${sanitizeCustomerText(warning.reason) ?? warning.reason}.`
      : ` One non-blocking warning remains: ${sanitizeCustomerText(warning.reason) ?? warning.reason}.`;
  }

  return [
    {
      id: "approval-campaign-validated",
      title: nl ? "Campagne klaar voor goedkeuring" : "Campaign ready for approval",
      reason,
      businessImpact: customerTextOrFallback(
        report.estimatedConversion.value > 0
          ? nl
            ? `Conversiepotentieel: ${report.estimatedConversion.value}/100.`
            : `Conversion potential: ${report.estimatedConversion.value}/100.`
          : null,
        nl ? "Publicatie na goedkeuring." : "Publication after approval."
      ),
      primaryLabel: nl ? "Campagne goedkeuren" : "Approve campaign",
      href: input.href ?? null,
    },
  ];
}

/** Surface required fixes when publication is blocked or changes required. */
export function publishValidationRequiredFixes(input: {
  validation: ValidationGraph | null;
  nl: boolean;
}): import("../types").ValidationRequiredFixOutput[] {
  if (!input.validation) return [];
  const report = input.validation.report;

  if (report.publicationReadiness === "READY" || report.publicationReadiness === "READY_WITH_SUGGESTIONS") {
    return [];
  }

  const nl = input.nl;
  const fixes: import("../types").ValidationRequiredFixOutput[] = [];

  for (const issue of report.issues.filter((i) => i.blocking || report.publicationReadiness === "BLOCKED")) {
    fixes.push({
      id: issue.id,
      title: sanitizeCustomerText(issue.reason) ?? issue.reason,
      whyItMatters: sanitizeCustomerText(issue.reason) ?? issue.reason,
      businessImpact: sanitizeCustomerText(issue.businessImpact) ?? issue.businessImpact,
      nextStep: nl
        ? `Emma moet dit aanpassen voordat de kwaliteitsreview opnieuw kan starten. ${sanitizeCustomerText(issue.suggestedResolution) ?? issue.suggestedResolution}`
        : `Emma must revise this before the quality review runs again. ${sanitizeCustomerText(issue.suggestedResolution) ?? issue.suggestedResolution}`,
      blocking: issue.blocking,
    });
  }

  if (fixes.length === 0) {
    for (const fix of report.requiredFixes.slice(0, 3)) {
      const issue = report.issues.find((i) => i.id === fix.issueId);
      if (!issue) continue;
      fixes.push({
        id: fix.issueId,
        title: sanitizeCustomerText(fix.summary) ?? fix.summary,
        whyItMatters: sanitizeCustomerText(issue.reason) ?? issue.reason,
        businessImpact: sanitizeCustomerText(issue.businessImpact) ?? issue.businessImpact,
        nextStep: nl
          ? `Emma moet dit aanpassen voordat validatie opnieuw kan starten.`
          : `Emma must revise this before validation runs again.`,
        blocking: fix.blocking,
      });
    }
  }

  return fixes.slice(0, 5);
}
