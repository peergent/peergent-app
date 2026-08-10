/**
 * ValidationPublisher — structured output for Brain Output Layer, Approval, Memory, Learning.
 * Does not generate UI copy — only publishes typed validation artifacts.
 */

import type { ValidationGraph, ValidationSummary } from "./types";
import { buildValidationSummary } from "./build-validation-graph";

export type ValidationPublishPayload = {
  graph: ValidationGraph;
  summary: ValidationSummary;
  /** Customer-safe readiness label — derived, not raw internal codes */
  readinessLabel: string;
  /** Executive quality headline — structured, not paragraph */
  qualityHeadline: string;
  blockingIssueCount: number;
  approvedDeliverableIds: readonly string[];
  rejectedDeliverableIds: readonly string[];
  businessRiskSummaries: readonly string[];
  brandRiskSummaries: readonly string[];
};

const READINESS_LABELS: Record<
  ValidationGraph["report"]["publicationReadiness"],
  { en: string; nl: string }
> = {
  READY: {
    en: "Ready for publication",
    nl: "Klaar voor publicatie",
  },
  READY_WITH_SUGGESTIONS: {
    en: "Ready with suggested improvements",
    nl: "Klaar met suggesties",
  },
  CHANGES_REQUIRED: {
    en: "Changes required before publication",
    nl: "Wijzigingen vereist voor publicatie",
  },
  BLOCKED: {
    en: "Blocked — cannot publish",
    nl: "Geblokkeerd — kan niet publiceren",
  },
};

export class ValidationPublisher {
  publish(input: { graph: ValidationGraph; locale?: "nl" | "en" }): ValidationPublishPayload {
    const nl = input.locale === "nl";
    const graph = input.graph;
    const summary = buildValidationSummary(graph);
    const readiness = graph.report.publicationReadiness;
    const labels = READINESS_LABELS[readiness];

    return {
      graph,
      summary,
      readinessLabel: nl ? labels.nl : labels.en,
      qualityHeadline: nl
        ? `Kwaliteitsscore: ${graph.report.overallScore.value}/100`
        : `Quality score: ${graph.report.overallScore.value}/100`,
      blockingIssueCount: summary.blockingIssueCount,
      approvedDeliverableIds: graph.report.approvedDeliverables.map((d) => d.deliverableId),
      rejectedDeliverableIds: graph.report.rejectedDeliverables.map((d) => d.deliverableId),
      businessRiskSummaries: graph.report.businessRisks.map((r) => r.risk),
      brandRiskSummaries: graph.report.brandRisks.map((r) => r.risk),
    };
  }
}

export function createValidationPublisher(): ValidationPublisher {
  return new ValidationPublisher();
}

export function publishValidationOutput(input: {
  graph: ValidationGraph;
  locale?: "nl" | "en";
}): ValidationPublishPayload {
  return createValidationPublisher().publish(input);
}
