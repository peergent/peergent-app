import type { BrainStructuredOutput } from "@/lib/brain/evidence/structured-output";
import type { Decision } from "@/lib/brain/decision/decision-types";
import { presentTopDecisions } from "@/lib/brain/decision/decision-presentation";
import { customerTextOrFallback } from "../sanitize";
import { capabilityToBrainSource } from "../capability-source";
import { confidenceFromBrain } from "./confidence";
import type { BrainOutputRecommendation, SuggestedAction } from "../types";

export function publishRecommendations(input: {
  strategy?: BrainStructuredOutput;
  decisions: readonly Decision[];
  nl: boolean;
  href?: string | null;
}): readonly BrainOutputRecommendation[] {
  const nl = input.nl;
  const recs: BrainOutputRecommendation[] = [];

  const topDecisions = presentTopDecisions(
    {
      version: "1.0.0",
      organizationId: "",
      createdAt: input.strategy?.generatedAt ?? new Date().toISOString(),
      decisions: [...input.decisions],
    },
    nl,
    2
  );

  for (const decision of topDecisions) {
    recs.push({
      id: `rec-${decision.id}`,
      headline: decision.recommendation,
      reason: decision.summary,
      expectedOutcome: decision.businessImpact,
      confidence: confidenceFromBrain(decision.confidenceLevel, nl),
      businessImpact: decision.businessImpact,
      whyNow: nl
        ? "Timing sluit aan op het huidige campagnefenomeen."
        : "Timing aligns with the current campaign window.",
      href: input.href ?? null,
      source: "strategy",
    });
  }

  for (const rec of input.strategy?.recommendations ?? []) {
    if (recs.some((r) => r.headline === rec.label)) continue;
    recs.push({
      id: `rec-${rec.id}`,
      headline: rec.label,
      reason: nl ? "Gebaseerd op strategy-analyse." : "Based on strategy analysis.",
      expectedOutcome: nl ? "Sterkere campagneresultaten." : "Stronger campaign results.",
      confidence: { value: 0.65, label: nl ? "Gemiddeld" : "Medium" },
      businessImpact: nl ? "Verwacht positieve impact op conversie." : "Expected positive impact on conversion.",
      whyNow: nl ? "Kans nu benutten vóór budgetseizoen." : "Capture the opportunity before budget season.",
      href: input.href ?? null,
      source: capabilityToBrainSource(input.strategy?.capabilityId ?? "strategy"),
    });
  }

  return recs;
}

export function publishSuggestedActions(input: {
  strategy?: BrainStructuredOutput;
  nl: boolean;
}): readonly SuggestedAction[] {
  return (input.strategy?.actionProposals ?? []).map((proposal) => ({
    id: proposal.id,
    label: proposal.label,
    reason: customerTextOrFallback(
      proposal.label,
      input.nl ? "Voorgestelde actie uit strategy." : "Suggested action from strategy."
    ),
    urgency: proposal.requiresApproval ? ("high" as const) : ("medium" as const),
    source: capabilityToBrainSource(input.strategy?.capabilityId ?? "strategy"),
  }));
}
