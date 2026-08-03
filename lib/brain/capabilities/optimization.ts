import type { BrainActionProposal } from "../evidence/structured-output";
import { emptyBrainStructuredOutput } from "../evidence/structured-output";
import type { CapabilityExecutionContext, CapabilityExecutionResult } from "./execution-context";
import { getBrainCapability } from "./registry";
import { campaignProvenance, upstreamProvenance } from "./shared/provenance";

export function executeOptimization(ctx: CapabilityExecutionContext): CapabilityExecutionResult {
  const def = getBrainCapability("optimization");
  const generatedAt = new Date().toISOString();
  const nl = ctx.locale === "nl";
  const campaign = ctx.campaignContext;
  const base = emptyBrainStructuredOutput("optimization", def.version, generatedAt);

  const perfOut = ctx.upstreamOutputs.performance_interpretation;
  const hasData = perfOut?.findings.some((f) => /metric|meting/i.test(f.label));

  if (!hasData) {
    return {
      ...base,
      warnings: [
        {
          id: "warn-opt-insufficient",
          code: "insufficient_performance_for_optimization",
          message: nl
            ? "Onvoldoende prestatiedata voor optimalisatie-aanbevelingen."
            : "Insufficient performance data for optimization recommendations.",
          provenance: campaign ? [campaignProvenance(campaign.projectId, "optimization")] : [],
        },
      ],
    };
  }

  const underperformer = perfOut!.findings.find((f) => /under|zwak/i.test(f.label))?.value ?? "";

  const actionProposals: BrainActionProposal[] = [
    {
      id: "opt-cta-test",
      actionType: "cta_test",
      label: nl ? "CTA-variant testen" : "Test CTA variant",
      requiresApproval: true,
      provenance: [upstreamProvenance("performance_interpretation", "perf-under")],
    },
    {
      id: "opt-headline",
      actionType: "headline_rewrite",
      label: nl ? "Headline aanscherpen" : "Refine headline",
      requiresApproval: true,
      provenance: [upstreamProvenance("performance_interpretation", "perf-inference")],
    },
  ];

  if (underperformer) {
    actionProposals.push({
      id: "opt-channel-pause",
      actionType: "channel_pause_proposal",
      label: nl ? "Kanaal pauzeren (voorstel)" : "Pause channel (proposal)",
      requiresApproval: true,
      provenance: [upstreamProvenance("performance_interpretation", "perf-under")],
    });
  }

  return {
    ...base,
    findings: [
      {
        id: "opt-opportunity",
        label: nl ? "Kans" : "Opportunity",
        value: nl
          ? "Verbetering mogelijk op zwakker kanaal — effectrichting onzeker."
          : "Improvement possible on weaker channel — direction of effect uncertain.",
        confidence: "low",
        provenance: [upstreamProvenance("performance_interpretation", "perf-under")],
      },
    ],
    recommendations: [
      {
        id: "rec-opt-review",
        label: nl ? "Review aanbevolen vóór uitvoering" : "Review recommended before execution",
        priority: "high",
        provenance: [campaignProvenance(campaign?.projectId ?? "unknown", "optimization")],
      },
    ],
    actionProposals,
  };
}
