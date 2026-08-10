import type { ValidationGraph } from "@/lib/brain/layers/validation/types";
import type { LiveActivityEvent } from "../types";
import { sanitizeCustomerText } from "../sanitize";
import { publicationReadinessLabel } from "./validation-source";

function relativeTimeLabel(iso: string, nl: boolean, now: Date): string {
  const then = new Date(iso).getTime();
  const diffMs = now.getTime() - then;
  const minutes = Math.round(diffMs / 60_000);
  if (minutes < 60) {
    return nl ? `${Math.max(1, minutes)} minuten geleden` : `${Math.max(1, minutes)} minutes ago`;
  }
  const hours = Math.round(minutes / 60);
  return nl ? `${hours} uur geleden` : `${hours} hours ago`;
}

/** Meaningful validation milestones — not all 19 evaluator events. */
export function publishValidationActivityEvents(input: {
  validation: ValidationGraph | null;
  nl: boolean;
  now: Date;
}): readonly LiveActivityEvent[] {
  if (!input.validation) return [];

  const report = input.validation.report;
  const nl = input.nl;
  const at = input.validation.createdAt;
  const events: LiveActivityEvent[] = [];

  events.push({
    id: "validation-started",
    timestamp: at,
    timeLabel: relativeTimeLabel(at, nl, input.now),
    title: nl ? "Kwaliteitsreview gestart" : "Quality review started",
    subtitle: nl
      ? "Emma controleert de campagne voordat iets live gaat."
      : "Emma is checking the campaign before anything goes live.",
    tone: "insight",
    sourceBrain: "validation",
    whyItMatters: nl
      ? "Peergent beoordeelt eigen werk kritisch — geen blind publiceren."
      : "Peergent critically reviews its own work — no blind publishing.",
    href: null,
  });

  const brandPass = report.passes.find((p) => p.category === "brand_consistency");
  if (brandPass || report.categories.find((c) => c.id === "brand_consistency")?.status === "pass") {
    events.push({
      id: "validation-brand-pass",
      timestamp: at,
      timeLabel: relativeTimeLabel(at, nl, input.now),
      title: nl ? "Merkconsistentie goedgekeurd" : "Brand consistency passed",
      subtitle: sanitizeCustomerText(brandPass?.reason) ??
        (nl ? "Messaging past bij merkidentiteit." : "Messaging matches brand identity."),
      tone: "success",
      sourceBrain: "validation",
      whyItMatters: nl ? "Merkherkenning blijft intact." : "Brand recognition stays intact.",
      href: null,
    });
  }

  const blockingIssue = report.issues.find((i) => i.blocking);
  if (blockingIssue) {
    events.push({
      id: "validation-claim-detected",
      timestamp: at,
      timeLabel: relativeTimeLabel(at, nl, input.now),
      title: nl ? "Ondersteunde claim gedetecteerd" : "Unsupported claim detected",
      subtitle: sanitizeCustomerText(blockingIssue.reason) ?? blockingIssue.reason,
      tone: "attention",
      sourceBrain: "validation",
      whyItMatters: sanitizeCustomerText(blockingIssue.businessImpact) ?? blockingIssue.businessImpact,
      href: null,
    });
  } else if (report.warnings.length > 0) {
    const warn = report.warnings[0]!;
    events.push({
      id: "validation-warning",
      timestamp: at,
      timeLabel: relativeTimeLabel(at, nl, input.now),
      title: nl ? "Aandachtspunt gevonden" : "Issue flagged for review",
      subtitle: sanitizeCustomerText(warn.reason) ?? warn.reason,
      tone: "attention",
      sourceBrain: "validation",
      whyItMatters: sanitizeCustomerText(warn.businessImpact) ?? warn.businessImpact,
      href: null,
    });
  }

  if (report.publicationReadiness === "READY" || report.publicationReadiness === "READY_WITH_SUGGESTIONS") {
    events.push({
      id: "validation-passed",
      timestamp: at,
      timeLabel: relativeTimeLabel(at, nl, input.now),
      title: nl
        ? `Kwaliteitsreview geslaagd — ${report.overallScore.value}/100`
        : `Quality review passed — ${report.overallScore.value}/100`,
      subtitle: publicationReadinessLabel(report.publicationReadiness, nl),
      tone: "success",
      sourceBrain: "validation",
      whyItMatters: nl ? "Campagne voldoet aan kwaliteitsdrempel." : "Campaign meets quality threshold.",
      href: null,
    });

    events.push({
      id: "validation-ready-for-approval",
      timestamp: at,
      timeLabel: relativeTimeLabel(at, nl, input.now),
      title: nl ? "Klaar voor goedkeuring" : "Ready for approval",
      subtitle: nl
        ? "Emma wacht op jouw goedkeuring vóór publicatie."
        : "Emma awaits your approval before publishing.",
      tone: "attention",
      sourceBrain: "validation",
      whyItMatters: nl ? "Jij behoudt controle over publicatie." : "You retain control over publication.",
      href: null,
    });
  } else if (report.publicationReadiness === "CHANGES_REQUIRED" || report.publicationReadiness === "BLOCKED") {
    events.push({
      id: "validation-revision-needed",
      timestamp: at,
      timeLabel: relativeTimeLabel(at, nl, input.now),
      title: publicationReadinessLabel(report.publicationReadiness, nl),
      subtitle: nl
        ? "Emma moet aanpassingen doorvoeren voordat publicatie kan starten."
        : "Emma must apply revisions before publication can begin.",
      tone: "attention",
      sourceBrain: "validation",
      whyItMatters: nl ? "Kwaliteit gaat boven snelheid." : "Quality comes before speed.",
      href: null,
    });
  }

  return events.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
}

export function mergeValidationActivityEvents(
  existing: readonly LiveActivityEvent[],
  validation: readonly LiveActivityEvent[]
): readonly LiveActivityEvent[] {
  if (validation.length === 0) return existing;

  const withoutGenericWaiting = existing.filter(
    (e) => e.id !== "creative-waiting-approval"
  );

  return [...validation, ...withoutGenericWaiting].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
}
