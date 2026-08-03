import type { BrainFinding } from "../evidence/structured-output";
import { emptyBrainStructuredOutput } from "../evidence/structured-output";
import type { CapabilityExecutionContext, CapabilityExecutionResult } from "./execution-context";
import { getBrainCapability } from "./registry";
import { campaignProvenance } from "./shared/provenance";

export function executePerformanceInterpretation(
  ctx: CapabilityExecutionContext
): CapabilityExecutionResult {
  const def = getBrainCapability("performance_interpretation");
  const generatedAt = new Date().toISOString();
  const nl = ctx.locale === "nl";
  const campaign = ctx.campaignContext;
  const base = emptyBrainStructuredOutput("performance_interpretation", def.version, generatedAt);

  const metrics = ctx.performanceMetrics ?? [];

  if (metrics.length === 0) {
    return {
      ...base,
      findings: [
        {
          id: "perf-sufficiency",
          label: nl ? "Datasufficiency" : "Data sufficiency",
          value: nl ? "Onvoldoende data — geen interpretatie." : "Insufficient data — no interpretation.",
          confidence: "high",
          provenance: campaign ? [campaignProvenance(campaign.projectId, "performance")] : [],
        },
      ],
      warnings: [
        {
          id: "warn-no-performance",
          code: "insufficient_performance_data",
          message: nl
            ? "Er zijn nog geen prestatiecijfers beschikbaar."
            : "No performance metrics are available yet.",
          provenance: campaign ? [campaignProvenance(campaign.projectId, "performance")] : [],
        },
      ],
    };
  }

  const sorted = [...metrics].sort((a, b) => b.value - a.value);
  const top = sorted[0];
  const bottom = sorted[sorted.length - 1];

  const findings: BrainFinding[] = [
    {
      id: "perf-status",
      label: nl ? "Campagnestatus" : "Campaign status",
      value: nl ? "Metingen beschikbaar (demo)" : "Metrics available (demo)",
      confidence: "high",
      provenance: [{ kind: "demo_fixture", refId: top.provenanceRef, label: "Demo metrics" }],
    },
    {
      id: "perf-window",
      label: nl ? "Meetperiode" : "Measurement window",
      value: top.window,
      confidence: "high",
      provenance: [{ kind: "demo_fixture", refId: top.provenanceRef }],
    },
    ...metrics.map(
      (m, i): BrainFinding => ({
        id: `perf-metric-${i}`,
        label: nl ? "Meting (feit)" : "Metric (fact)",
        value: `${m.label}: ${m.value} ${m.unit} (${m.channel})`,
        confidence: "high",
        provenance: [{ kind: "demo_fixture", refId: m.provenanceRef, label: "Measured fact" }],
      })
    ),
    {
      id: "perf-top",
      label: nl ? "Sterkste kanaal" : "Top performer",
      value: `${top.channel} — ${top.label}`,
      confidence: "medium",
      provenance: [{ kind: "demo_fixture", refId: top.provenanceRef }],
    },
    {
      id: "perf-under",
      label: nl ? "Zwakste kanaal" : "Underperformer",
      value: `${bottom.channel} — ${bottom.label}`,
      confidence: "medium",
      provenance: [{ kind: "demo_fixture", refId: bottom.provenanceRef }],
    },
    {
      id: "perf-inference",
      label: nl ? "Waarschijnlijke verklaring (hypothese)" : "Likely explanation (hypothesis)",
      value: nl
        ? "Verschil kan door bereik of doelgroep-fit komen — geen causaliteit bewezen."
        : "Difference may reflect reach or audience fit — causation not proven.",
      confidence: "low",
      provenance: [{ kind: "assumption", refId: "perf-hypothesis", label: "Hypothesis" }],
    },
  ];

  return {
    ...base,
    findings,
    recommendations: [
      {
        id: "rec-monitor",
        label: nl ? "Monitor nog 7 dagen" : "Monitor for 7 more days",
        priority: "medium",
        provenance: [{ kind: "demo_fixture", refId: top.provenanceRef }],
      },
    ],
  };
}
