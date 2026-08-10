import type { CampaignContext } from "@/lib/office/campaign/campaign-context";
import type { CapabilityExecutionResult } from "../../capabilities/execution-context";
import { campaignProvenance, upstreamProvenance } from "../../capabilities/shared/provenance";
import { getBrainCapability } from "../../capabilities/registry";
import { emptyBrainStructuredOutput } from "../../evidence/structured-output";
import type { ValidationGraph } from "./types";

/** Maps ValidationGraph → BrainStructuredOutput for persistence and Brain Output Layer consumption. */
export function mapValidationGraphToBrainOutput(input: {
  graph: ValidationGraph;
  campaignContext?: CampaignContext | null;
  locale?: "nl" | "en";
}): CapabilityExecutionResult {
  const def = getBrainCapability("validation");
  const generatedAt = input.graph.createdAt;
  const base = emptyBrainStructuredOutput("validation", def.version, generatedAt);
  const nl = input.locale === "nl";
  const campaign = input.campaignContext;
  const report = input.graph.report;

  const findings = [
    {
      id: "validation-readiness",
      label: nl ? "Publicatiestatus" : "Publication readiness",
      value: report.publicationReadiness,
      confidence: report.confidence as "low" | "medium" | "high",
      provenance: campaign ? [campaignProvenance(campaign.projectId, "validation-readiness")] : [],
    },
    {
      id: "validation-overall-score",
      label: nl ? "Overall score" : "Overall score",
      value: String(report.overallScore.value),
      confidence: report.confidence as "low" | "medium" | "high",
      provenance: campaign ? [campaignProvenance(campaign.projectId, "validation-score")] : [],
    },
    {
      id: "validation-conversion-estimate",
      label: nl ? "Geschat conversiepotentieel" : "Estimated conversion potential",
      value: String(report.estimatedConversion.value),
      confidence: report.confidence as "low" | "medium" | "high",
      provenance: campaign ? [campaignProvenance(campaign.projectId, "validation-conversion")] : [],
    },
    ...report.categories.map((cat, i) => ({
      id: `validation-category-${i + 1}`,
      label: cat.label,
      value: JSON.stringify({ status: cat.status, score: cat.score.value, summary: cat.summary }),
      confidence: (cat.status === "pass" ? "high" : cat.status === "warning" ? "medium" : "low") as
        | "low"
        | "medium"
        | "high",
      provenance: [
        upstreamProvenance("validation", cat.id),
        ...(campaign ? [campaignProvenance(campaign.projectId, cat.id)] : []),
      ],
    })),
  ];

  const decisions = report.approvedDeliverables.map((d) => ({
    id: d.id,
    label: nl ? `Goedgekeurd: ${d.deliverableType}` : `Approved: ${d.deliverableType}`,
    rationale: d.reason,
    confidence: "high" as const,
    provenance: campaign ? [campaignProvenance(campaign.projectId, d.deliverableId)] : [],
  }));

  const warnings = report.warnings.map((w, i) => ({
    id: w.id || `val-warn-${i + 1}`,
    code: w.category,
    message: w.reason,
    provenance: campaign ? [campaignProvenance(campaign.projectId, w.category)] : [],
  }));

  const recommendations = report.optionalImprovements.map((imp, i) => ({
    id: imp.warningId || `val-rec-${i + 1}`,
    label: imp.summary,
    priority: "medium" as const,
    provenance: campaign ? [campaignProvenance(campaign.projectId, imp.category)] : [],
  }));

  const requiresApproval =
    report.publicationReadiness === "READY" ||
    report.publicationReadiness === "READY_WITH_SUGGESTIONS";

  return {
    ...base,
    findings,
    decisions,
    warnings,
    recommendations,
    validationGraph: input.graph,
    actionProposals: [
      {
        id: "act-campaign-approval",
        actionType: "campaign_approval",
        label: nl ? "Campagnepakket goedkeuren" : "Approve campaign package",
        requiresApproval,
        provenance: campaign ? [campaignProvenance(campaign.projectId, "campaign-approval")] : [],
      },
    ],
  };
}
