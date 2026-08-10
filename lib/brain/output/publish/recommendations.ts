import type { BrainStructuredOutput } from "@/lib/brain/evidence/structured-output";
import type { Decision } from "@/lib/brain/decision/decision-types";
import type { CreativeGraph } from "@/lib/brain/layers/creative/types";
import { presentTopDecisions } from "@/lib/brain/decision/decision-presentation";
import { customerTextOrFallback } from "../sanitize";
import { capabilityToBrainSource } from "../capability-source";
import { confidenceFromBrain } from "./confidence";
import { channelLabel, selectedCreativeCampaign } from "./creative-source";
import type { BrainOutputRecommendation, SuggestedAction } from "../types";

export function publishRecommendations(input: {
  strategy?: BrainStructuredOutput;
  creative?: CreativeGraph | null;
  decisions: readonly Decision[];
  nl: boolean;
  href?: string | null;
}): readonly BrainOutputRecommendation[] {
  const nl = input.nl;
  const recs: BrainOutputRecommendation[] = [];
  const creative = input.creative;
  const selected = creative ? selectedCreativeCampaign(creative) : null;

  if (creative) {
    const googlePlan = creative.channelPlans.find((p) => p.channel === "google_ads");
    const linkedinPlan = creative.channelPlans.find((p) => p.channel === "linkedin");

    if (googlePlan) {
      recs.push({
        id: "rec-creative-google",
        headline: nl
          ? `Verhoog ${channelLabel("google_ads", nl)}-budget`
          : `Increase ${channelLabel("google_ads", nl)} budget`,
        reason: nl
          ? `${googlePlan.why} Koopintentie presteert sterker na positioneringsverfijning.`
          : `${googlePlan.why} Purchase intent outperforms after positioning refinement.`,
        expectedOutcome: selected?.estimatedImpact ?? googlePlan.goal,
        confidence: { value: 0.82, label: nl ? "Hoog" : "High" },
        businessImpact: selected?.estimatedImpact ?? googlePlan.goal,
        whyNow: nl
          ? "Timing sluit aan op het gekozen campagneconcept."
          : "Timing aligns with the selected campaign concept.",
        href: input.href ?? null,
        source: "creative",
      });
    }

    if (linkedinPlan && recs.length < 2) {
      recs.push({
        id: "rec-creative-linkedin",
        headline: nl
          ? `Investeer in ${channelLabel("linkedin", nl)} voor autoriteit`
          : `Invest in ${channelLabel("linkedin", nl)} for authority`,
        reason: linkedinPlan.why,
        expectedOutcome: linkedinPlan.goal,
        confidence: { value: 0.7, label: nl ? "Gemiddeld" : "Medium" },
        businessImpact: nl ? "Vertrouwen vóór sales outreach." : "Trust before sales outreach.",
        whyNow: nl ? "Ondersteunt het gekozen creatieve concept." : "Supports the selected creative concept.",
        href: input.href ?? null,
        source: "creative",
      });
    }

    for (const decision of creative.decisions.slice(0, 2)) {
      if (recs.some((r) => r.headline.includes(decision.title))) continue;
      recs.push({
        id: `rec-cre-${decision.id}`,
        headline: decision.title,
        reason: decision.reason,
        expectedOutcome: decision.businessImpact,
        confidence: confidenceFromBrain(
          decision.confidence === "high" ? "high" : decision.confidence === "medium" ? "medium" : "low",
          nl
        ),
        businessImpact: decision.businessImpact,
        whyNow: decision.whyNow,
        href: input.href ?? null,
        source: "creative",
      });
    }
  }

  if (recs.length >= 2) return recs.slice(0, 2);

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
      whyNow: nl ? "Kans nu benutten." : "Capture the opportunity now.",
      href: input.href ?? null,
      source: capabilityToBrainSource(input.strategy?.capabilityId ?? "strategy"),
    });
  }

  return recs;
}

export function publishSuggestedActions(input: {
  strategy?: BrainStructuredOutput;
  creative?: CreativeGraph | null;
  nl: boolean;
}): readonly SuggestedAction[] {
  const actions = (input.strategy?.actionProposals ?? []).map((proposal) => ({
    id: proposal.id,
    label: proposal.label,
    reason: customerTextOrFallback(
      proposal.label,
      input.nl ? "Voorgestelde actie uit strategy." : "Suggested action from strategy."
    ),
    urgency: proposal.requiresApproval ? ("high" as const) : ("medium" as const),
    source: capabilityToBrainSource(input.strategy?.capabilityId ?? "strategy"),
  }));

  if (input.creative && actions.length === 0) {
    return [
      {
        id: "act-review-creative",
        label: input.nl ? "Campagneconcept beoordelen" : "Review campaign concept",
        reason: input.nl
          ? "Emma wacht op goedkeuring vóór publicatie."
          : "Emma awaits approval before publishing.",
        urgency: "high" as const,
        source: "creative" as const,
      },
    ];
  }

  return actions;
}
