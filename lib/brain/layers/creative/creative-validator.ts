import type { CreativeGraph } from "./types";
import {
  containsCreativeTemplatePlaceholder,
  findCreativePlaceholderIssues,
} from "./creative-placeholder-markers";

export type CreativeValidationIssue = {
  code: string;
  message: string;
  severity: "error" | "warning";
};

export type CreativeValidationResult = {
  valid: boolean;
  score: number;
  issues: readonly CreativeValidationIssue[];
};

/** Validate CreativeGraph completeness — never approve empty creative. */
export function validateCreativeGraph(graph: CreativeGraph): CreativeValidationResult {
  const issues: CreativeValidationIssue[] = [];

  if (graph.phases.length < 7) {
    issues.push({
      code: "incomplete_phases",
      message: "Creative Brain must complete all seven thinking phases.",
      severity: "error",
    });
  }

  if (!graph.direction) {
    issues.push({
      code: "missing_direction",
      message: "Creative direction is required before deliverables.",
      severity: "error",
    });
  }

  if (graph.campaigns.length === 0) {
    issues.push({
      code: "missing_campaigns",
      message: "At least one campaign concept is required.",
      severity: "error",
    });
  }

  if (!graph.campaigns.some((c) => c.selected)) {
    issues.push({
      code: "no_selected_campaign",
      message: "One campaign concept must be selected.",
      severity: "warning",
    });
  }

  if (graph.messaging.length === 0) {
    issues.push({
      code: "missing_messaging",
      message: "Messaging framework is required.",
      severity: "error",
    });
  }

  if (graph.channelPlans.length === 0) {
    issues.push({
      code: "missing_channels",
      message: "Channel strategy is required.",
      severity: "warning",
    });
  }

  if (graph.deliverables.length === 0) {
    issues.push({
      code: "missing_deliverables",
      message: "At least one deliverable specification is required.",
      severity: "error",
    });
  }

  if (!graph.contentArtifacts?.length) {
    issues.push({
      code: "missing_content_artifacts",
      message: "Creative Brain must materialize publication-ready content artifacts.",
      severity: "error",
    });
  } else {
    for (const artifact of graph.contentArtifacts) {
      if (!artifact.body?.trim() || artifact.body.trim().length < 40) {
        issues.push({
          code: "content_too_short",
          message: `Content artifact ${artifact.id} is missing publication copy.`,
          severity: "error",
        });
      }
      for (const code of findCreativePlaceholderIssues({
        headline: artifact.headline,
        hook: artifact.hook,
        body: artifact.body,
        cta: artifact.cta,
        subject: artifact.subject,
      })) {
        issues.push({
          code,
          message: `Content artifact ${artifact.id} contains template placeholder copy.`,
          severity: "error",
        });
      }
    }
  }

  for (const deliverable of graph.deliverables) {
    if (
      containsCreativeTemplatePlaceholder(deliverable.hook) ||
      containsCreativeTemplatePlaceholder(deliverable.cta) ||
      containsCreativeTemplatePlaceholder(deliverable.bodyOutline)
    ) {
      issues.push({
        code: "deliverable_template_placeholder",
        message: `Deliverable ${deliverable.id} contains deterministic template copy.`,
        severity: "error",
      });
    }
    if (deliverable.reviewStatus === "planned") {
      issues.push({
        code: "deliverable_plan_only",
        message: `Deliverable ${deliverable.id} is a plan, not final creative.`,
        severity: "error",
      });
    }
  }

  if (graph.providerMeta?.providerMode === "live_llm" && graph.providerMeta.fallbackUsed) {
    issues.push({
      code: "creative_live_llm_fallback",
      message: "Production creative marked fallbackUsed while claiming live_llm.",
      severity: "error",
    });
  }

  const errors = issues.filter((i) => i.severity === "error");
  const warnings = issues.filter((i) => i.severity === "warning");
  const score = Math.max(0, 100 - errors.length * 25 - warnings.length * 10);

  return {
    valid: errors.length === 0,
    score,
    issues,
  };
}

export function scoreCreativeQuality(graph: CreativeGraph): number {
  return validateCreativeGraph(graph).score;
}
