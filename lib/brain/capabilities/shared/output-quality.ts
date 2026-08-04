import type { BrainStructuredOutput } from "../../evidence/structured-output";
import type { BrainCapabilityId } from "../registry";

export type OutputQualityIssue = {
  code: string;
  message: string;
};

function normalize(text: string): string {
  return text.toLowerCase().replace(/\s+/g, " ").trim();
}

/** Deterministic quality checks before customer presentation. */
export function validateCapabilityOutputQuality(input: {
  capabilityId: BrainCapabilityId;
  output: BrainStructuredOutput;
  upstreamCapabilityIds?: readonly BrainCapabilityId[];
}): readonly OutputQualityIssue[] {
  const issues: OutputQualityIssue[] = [];
  const { output } = input;

  if (output.findings.length === 0 && output.recommendations.length === 0 && output.warnings.length === 0) {
    if (input.capabilityId !== "performance_interpretation") {
      issues.push({ code: "empty_output", message: "Capability returned no findings or recommendations." });
    }
  }

  const findingTexts = new Set<string>();
  for (const f of output.findings) {
    const key = normalize(`${f.label}:${f.value}`);
    if (findingTexts.has(key)) {
      issues.push({ code: "duplicate_finding", message: `Duplicate finding: ${f.label}` });
    }
    findingTexts.add(key);
    if (!f.provenance.length) {
      issues.push({ code: "missing_provenance", message: `Finding ${f.id} lacks provenance.` });
    }
    if (/\d{4}-\d{2}-\d{2}T/.test(f.value)) {
      issues.push({ code: "raw_iso_date", message: `Finding ${f.id} contains raw ISO date in customer value.` });
    }
  }

  for (const f of output.findings) {
    if (/installer|heat pump|warmtepomp|veldwerk/i.test(f.value) && input.capabilityId === "strategy") {
      issues.push({ code: "fixture_leakage", message: "Strategy output contains unrelated demo fixture terms." });
    }
  }

  if (input.capabilityId === "competitor_understanding") {
    for (const f of output.findings) {
      if (f.label.toLowerCase().includes("competitor") && !f.provenance.some((p) => p.kind !== "assumption")) {
        issues.push({ code: "unsupported_competitor", message: "Competitor claim lacks source provenance." });
      }
    }
  }

  if (input.capabilityId === "strategy") {
    const labels = output.findings.map((f) => normalize(f.label));
    const dupLabels = labels.filter((l, i) => labels.indexOf(l) !== i);
    if (dupLabels.length) {
      issues.push({ code: "duplicate_strategy_section", message: "Strategy sections are not semantically distinct." });
    }
  }

  if (input.capabilityId === "channel_planning" && !input.upstreamCapabilityIds?.includes("strategy")) {
    issues.push({ code: "channel_without_strategy", message: "Channel plan must reference strategy output." });
  }

  if (input.capabilityId === "optimization") {
    const hasPerformanceRef = output.actionProposals.some((p) =>
      p.provenance.some((pr) => pr.kind === "capability_output" || pr.refId.includes("performance"))
    );
    if (output.actionProposals.length > 0 && !hasPerformanceRef) {
      issues.push({
        code: "optimization_without_evidence",
        message: "Optimization proposal must reference performance evidence.",
      });
    }
  }

  for (const f of output.findings) {
    if (/\d+%|\d+x|\+\d+/i.test(f.value) && !f.provenance.some((p) => p.kind === "assumption")) {
      const hasMetricProv = f.provenance.some((p) => p.kind === "performance" || p.kind === "demo_fixture");
      if (!hasMetricProv) {
        issues.push({
          code: "ungrounded_numeric_promise",
          message: `Numeric claim in "${f.label}" lacks provenance or assumption label.`,
        });
      }
    }
  }

  return issues;
}

export function collapseDuplicateFindings(
  output: BrainStructuredOutput
): BrainStructuredOutput {
  const seen = new Set<string>();
  const findings = output.findings.filter((f) => {
    const key = normalize(`${f.label}:${f.value}`);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  return { ...output, findings };
}
