/**
 * PX-57 — publication-readiness invariants for campaign approval packages.
 * Semantic, artifact-based — not arbitrary profile completeness gates.
 */

import type { CreativeContentArtifact } from "../layers/creative/materialize-creative-content-artifacts";
import type { CreativeGraph } from "../layers/creative/types";
import type { ValidationGraph } from "../layers/validation/types";

export type PublicationInvariantIssue = {
  code: string;
  message: string;
  field?: string;
  deliverableId?: string;
  blocking: boolean;
};

const UNRESOLVED_CHANNEL = /^(tbd|unknown|to be determined|nog te bepalen)$/i;
const PLACEHOLDER_PURPOSE = /^support campaign objective$/i;
const PLAN_ONLY_REVIEW = /^planned$/i;

/** Known demo/test fixture markers that must never appear in production packages. */
export const PRODUCTION_FIXTURE_MARKERS = [
  "demo-peer-fixture",
  "test-fixture-campaign",
  "__demo__",
  "FIXTURE_CAMPAIGN_ID",
] as const;

export function detectFixtureContamination(text: string): string | null {
  const lower = text.toLowerCase();
  for (const marker of PRODUCTION_FIXTURE_MARKERS) {
    if (lower.includes(marker.toLowerCase())) return marker;
  }
  return null;
}

function deliverableHasUnresolvedChannel(channel: string): boolean {
  return UNRESOLVED_CHANNEL.test(channel.trim());
}

export function evaluateCreativePublicationInvariants(input: {
  creative: CreativeGraph;
  contentArtifacts: readonly CreativeContentArtifact[];
  locale?: "nl" | "en";
}): PublicationInvariantIssue[] {
  const nl = input.locale === "nl";
  const issues: PublicationInvariantIssue[] = [];

  if (input.contentArtifacts.length === 0) {
    issues.push({
      code: "missing_content_artifacts",
      message: nl
        ? "Creatieve content is niet gematerialiseerd — alleen plannen aanwezig."
        : "Creative content was not materialized — only plans present.",
      blocking: true,
    });
  }

  for (const spec of input.creative.deliverables) {
    if (PLAN_ONLY_REVIEW.test(spec.reviewStatus)) {
      issues.push({
        code: "plan_only_deliverable",
        message: nl
          ? `Deliverable ${spec.type} is nog een plan, geen publicatiecontent.`
          : `Deliverable ${spec.type} is still a plan, not publication content.`,
        deliverableId: spec.id,
        blocking: true,
      });
    }
    if (deliverableHasUnresolvedChannel(String(spec.channel))) {
      issues.push({
        code: "unresolved_channel",
        message: nl ? "Kanaal is niet vastgesteld." : "Channel is not resolved.",
        field: "channel",
        deliverableId: spec.id,
        blocking: true,
      });
    }
  }

  for (const artifact of input.contentArtifacts) {
    if (!artifact.body?.trim() || artifact.body.trim().length < 40) {
      issues.push({
        code: "missing_content",
        message: nl ? "Publicatiecontent ontbreekt of is te kort." : "Publication content is missing or too short.",
        field: "body",
        deliverableId: artifact.sourceDeliverableId,
        blocking: true,
      });
    }
    if (!artifact.cta?.trim()) {
      issues.push({
        code: "missing_cta",
        message: nl ? "Call-to-action ontbreekt." : "Call-to-action is missing.",
        field: "cta",
        deliverableId: artifact.sourceDeliverableId,
        blocking: true,
      });
    }
    if (!artifact.targetAudience?.trim()) {
      issues.push({
        code: "missing_audience",
        message: nl ? "Doelgroep ontbreekt voor deliverable." : "Audience is missing for deliverable.",
        field: "targetAudience",
        deliverableId: artifact.sourceDeliverableId,
        blocking: true,
      });
    }
    if (deliverableHasUnresolvedChannel(String(artifact.channel))) {
      issues.push({
        code: "unresolved_channel",
        message: nl ? "Kanaal is niet vastgesteld." : "Channel is not resolved.",
        field: "channel",
        deliverableId: artifact.sourceDeliverableId,
        blocking: true,
      });
    }

    const contamination = detectFixtureContamination(
      [artifact.headline, artifact.body, artifact.hook, artifact.targetAudience].join(" ")
    );
    if (contamination) {
      issues.push({
        code: "fixture_contamination",
        message: nl
          ? `Test/fixture-inhoud gedetecteerd (${contamination}).`
          : `Test/fixture content detected (${contamination}).`,
        blocking: true,
      });
    }
  }

  const serialized = JSON.stringify(input.creative);
  if (PLACEHOLDER_PURPOSE.test(serialized)) {
    issues.push({
      code: "placeholder_purpose",
      message: nl ? "Doel is een placeholder, niet een campagnedoel." : "Purpose is a placeholder, not a campaign goal.",
      blocking: true,
    });
  }

  return issues;
}

export function evaluateValidationPublicationInvariants(input: {
  validation: ValidationGraph | null;
  locale?: "nl" | "en";
}): PublicationInvariantIssue[] {
  const nl = input.locale === "nl";
  if (!input.validation) {
    return [
      {
        code: "missing_validation",
        message: nl ? "Validatierapport ontbreekt." : "Validation report is missing.",
        blocking: true,
      },
    ];
  }

  const issues: PublicationInvariantIssue[] = [];
  const readiness = input.validation.report.publicationReadiness;

  if (readiness === "BLOCKED" || readiness === "CHANGES_REQUIRED") {
    issues.push({
      code: "validation_not_ready",
      message: nl
        ? `Validatie: ${readiness} — publicatie nog niet gereed.`
        : `Validation: ${readiness} — not publication-ready.`,
      blocking: true,
    });
  }

  const blockingValidation = input.validation.report.issues.filter((i) => i.blocking);
  for (const issue of blockingValidation) {
    issues.push({
      code: `validation_${issue.id}`,
      message: issue.reason,
      deliverableId: issue.deliverableId,
      blocking: true,
    });
  }

  return issues;
}

export function publicationReadyFromInvariants(
  issues: readonly PublicationInvariantIssue[]
): boolean {
  return !issues.some((i) => i.blocking);
}
