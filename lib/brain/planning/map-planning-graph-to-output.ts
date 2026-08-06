import type { CampaignContext } from "@/lib/office/campaign/campaign-context";
import type { BrainStructuredOutput } from "../evidence/structured-output";
import { emptyBrainStructuredOutput } from "../evidence/structured-output";
import { getBrainCapability } from "../capabilities/registry";
import { campaignProvenance } from "../capabilities/shared/provenance";
import type { PlanningGraph } from "../layers/planning/types";
import type { PlanningValidationResult } from "../layers/planning/planning-validator";
import {
  presentExecutionPlanSummary,
  presentReadinessCustomerSummary,
  presentCustomerInputSummary,
} from "../layers/planning/planning-presenter";
import type { PlanningOutputMetadata } from "./campaign-planning-types";
import { CAMPAIGN_PLANNING_CAPABILITY_ID } from "./campaign-planning-types";

/** Map PlanningGraph → BrainStructuredOutput for campaign persistence. */
export function mapPlanningGraphToBrainOutput(input: {
  graph: PlanningGraph;
  campaignContext: CampaignContext;
  validation: PlanningValidationResult;
  metadata: PlanningOutputMetadata;
  locale: "nl" | "en";
}): BrainStructuredOutput {
  const def = getBrainCapability(CAMPAIGN_PLANNING_CAPABILITY_ID);
  const nl = input.locale === "nl";
  const base = emptyBrainStructuredOutput(CAMPAIGN_PLANNING_CAPABILITY_ID, def.version, input.graph.createdAt);
  const provenance = [campaignProvenance(input.campaignContext.projectId, "campaign_planning")];

  const executionSummary = presentExecutionPlanSummary({ graph: input.graph, locale: input.locale });
  const readinessSummary = presentReadinessCustomerSummary(input.graph, input.locale);
  const customerNeeds = presentCustomerInputSummary(input.graph, input.locale);

  return {
    ...base,
    findings: [
      {
        id: "plan-exec",
        label: nl ? "Executieplan" : "Execution plan",
        value: executionSummary,
        confidence: "high",
        provenance,
      },
      {
        id: "plan-readiness",
        label: nl ? "Readiness" : "Readiness",
        value: readinessSummary,
        confidence: input.graph.readiness.level === "ready" ? "high" : "medium",
        provenance,
      },
      {
        id: "plan-customer-needs",
        label: nl ? "Wat Emma nog nodig heeft" : "What Emma still needs",
        value: customerNeeds,
        confidence: "medium",
        provenance,
      },
      {
        id: "plan-next-step",
        label: nl ? "Verwachte volgende stap" : "Expected next step",
        value: nl
          ? "Na jouw goedkeuring start Emma met de eerste uitvoeringsfase volgens dit plan."
          : "After your approval, Emma begins the first execution phase according to this plan.",
        confidence: "high",
        provenance,
      },
    ],
    decisions: [],
    recommendations: input.graph.reviewMoments.slice(0, 3).map((r, i) => ({
      id: `plan-review-${i + 1}`,
      label: r.title,
      priority: "medium" as const,
      provenance,
    })),
    warnings: input.validation.valid
      ? []
      : input.validation.issues.slice(0, 2).map((issue, i) => ({
          id: `plan-warn-${i + 1}`,
          code: issue.code,
          message: issue.message,
          provenance,
        })),
    planningGraph: input.graph,
    planningMetadata: {
      ...input.metadata,
      validationStatus: input.validation.valid ? "valid" : "invalid",
    },
  };
}
