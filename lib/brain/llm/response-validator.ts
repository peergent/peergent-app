import type { BrainStructuredOutput } from "../evidence/structured-output";
import { BrainLlmValidationError } from "./errors";

const PERCENTAGE_PATTERN = /\b\d{1,3}(\.\d+)?%/g;
const PERFORMANCE_CLAIM_PATTERN = /\b(roas|cpa|ctr|cvr|conversion rate|revenue grew|increased by \d)/i;

type StrategyLlmPayload = {
  findings?: Array<{ id?: string; label?: string; value?: string; confidence?: string }>;
  decisions?: Array<{ id?: string; label?: string; rationale?: string; confidence?: string }>;
  recommendations?: Array<{ id?: string; label?: string; priority?: string }>;
  actionProposals?: Array<{ id?: string; actionType?: string; label?: string; requiresApproval?: boolean }>;
  warnings?: Array<{ id?: string; code?: string; message?: string }>;
};

function collectText(payload: StrategyLlmPayload): string {
  const parts: string[] = [];
  for (const f of payload.findings ?? []) parts.push(f.value ?? "", f.label ?? "");
  for (const d of payload.decisions ?? []) parts.push(d.rationale ?? "", d.label ?? "");
  for (const r of payload.recommendations ?? []) parts.push(r.label ?? "");
  for (const w of payload.warnings ?? []) parts.push(w.message ?? "");
  return parts.join(" ");
}

export function validateStrategyLlmPayload(
  parsed: unknown,
  input: {
    capabilityVersion: string;
    knownCompetitors: readonly string[];
    allowPercentages?: boolean;
  }
): StrategyLlmPayload {
  if (!parsed || typeof parsed !== "object") {
    throw new BrainLlmValidationError("Strategy LLM output must be a JSON object.");
  }

  const payload = parsed as StrategyLlmPayload;
  const issues: string[] = [];

  if (!Array.isArray(payload.findings) || payload.findings.length === 0) {
    issues.push("findings array is required and must not be empty.");
  }
  if (!Array.isArray(payload.decisions)) issues.push("decisions array is required.");
  if (!Array.isArray(payload.recommendations)) issues.push("recommendations array is required.");
  if (!Array.isArray(payload.actionProposals)) issues.push("actionProposals array is required.");

  const text = collectText(payload);

  if (!input.allowPercentages && PERCENTAGE_PATTERN.test(text)) {
    issues.push("Output must not include unsupported percentage claims.");
  }

  if (PERFORMANCE_CLAIM_PATTERN.test(text)) {
    issues.push("Output must not include unsupported performance claims.");
  }

  const competitorMentions = (payload.findings ?? [])
    .filter((f) => /competitor|concurrent/i.test(f.label ?? ""))
    .map((f) => f.value ?? "");

  if (input.knownCompetitors.length === 0 && competitorMentions.some((v) => v.trim() && !/unknown|onbekend|none|geen/i.test(v))) {
    issues.push("Output must not invent competitors when none are known.");
  }

  for (const finding of payload.findings ?? []) {
    if (!finding.label?.trim() || !finding.value?.trim()) {
      issues.push("Each finding requires label and value.");
      break;
    }
  }

  if (issues.length > 0) {
    throw new BrainLlmValidationError("Strategy LLM output failed validation.", issues);
  }

  return payload;
}

export function mapStrategyPayloadToBrainOutput(
  payload: StrategyLlmPayload,
  input: { capabilityVersion: string; generatedAt: string; provenanceRef: string }
): BrainStructuredOutput {
  const prov = [{ kind: "assumption" as const, refId: input.provenanceRef, capturedAt: input.generatedAt }];

  return {
    capabilityId: "strategy",
    capabilityVersion: input.capabilityVersion,
    generatedAt: input.generatedAt,
    findings: (payload.findings ?? []).map((f, i) => ({
      id: f.id ?? `strategy-${i + 1}`,
      label: f.label ?? `Finding ${i + 1}`,
      value: f.value ?? "",
      confidence: (f.confidence as "low" | "medium" | "high") ?? "medium",
      provenance: prov,
    })),
    decisions: (payload.decisions ?? []).map((d, i) => ({
      id: d.id ?? `dec-strategy-${i + 1}`,
      label: d.label ?? "Decision",
      rationale: d.rationale ?? "",
      confidence: (d.confidence as "low" | "medium" | "high") ?? "medium",
      provenance: prov,
    })),
    recommendations: (payload.recommendations ?? []).map((r, i) => ({
      id: r.id ?? `rec-strategy-${i + 1}`,
      label: r.label ?? "Recommendation",
      priority: (r.priority as "low" | "medium" | "high") ?? "high",
      provenance: prov,
    })),
    actionProposals: (payload.actionProposals ?? []).map((a, i) => ({
      id: a.id ?? `act-strategy-${i + 1}`,
      actionType: a.actionType ?? "approve_strategy",
      label: a.label ?? "Confirm strategy",
      requiresApproval: a.requiresApproval ?? true,
      provenance: prov,
    })),
    executionResults: [],
    warnings: (payload.warnings ?? []).map((w, i) => ({
      id: w.id ?? `warn-strategy-${i + 1}`,
      code: w.code ?? "strategy_note",
      message: w.message ?? "",
      provenance: prov,
    })),
    errors: [],
  };
}
