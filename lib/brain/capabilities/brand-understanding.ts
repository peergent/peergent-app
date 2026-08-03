import type { BrainFinding, BrainRecommendation, BrainWarning } from "../evidence/structured-output";
import { emptyBrainStructuredOutput } from "../evidence/structured-output";
import type { CapabilityExecutionContext, CapabilityExecutionResult } from "./execution-context";
import { getBrainCapability } from "./registry";
import { profileProvenance } from "./shared/provenance";
import type { BrainMemoryCandidate } from "../memory/candidate";

export function executeBrandUnderstanding(
  ctx: CapabilityExecutionContext
): CapabilityExecutionResult {
  const def = getBrainCapability("brand_understanding");
  const generatedAt = new Date().toISOString();
  const nl = ctx.locale === "nl";
  const profile = ctx.companySnapshot.profile;
  const orgId = ctx.companySnapshot.organizationId;
  const base = emptyBrainStructuredOutput("brand_understanding", def.version, generatedAt);

  const findings: BrainFinding[] = [];
  const warnings: BrainWarning[] = [];
  const recommendations: BrainRecommendation[] = [];

  if (profile.positioning.value) {
    findings.push({
      id: "brand-positioning",
      label: nl ? "Positionering" : "Positioning",
      value: profile.positioning.value,
      confidence: profile.positioning.customerConfirmed ? "high" : "medium",
      provenance: [profileProvenance(orgId, "positioning", profile.positioning.source)],
    });
  } else {
    warnings.push({
      id: "warn-brand-positioning",
      code: "missing_brand_positioning",
      message: nl ? "Positionering is nog niet bevestigd." : "Positioning is not confirmed yet.",
      provenance: [profileProvenance(orgId, "positioning")],
    });
  }

  if (profile.tone.value) {
    findings.push({
      id: "brand-tone",
      label: nl ? "Tone of voice" : "Tone of voice",
      value: profile.tone.value,
      confidence: profile.tone.customerConfirmed ? "high" : "medium",
      provenance: [profileProvenance(orgId, "tone", profile.tone.source)],
    });
  } else {
    warnings.push({
      id: "warn-brand-tone",
      code: "missing_brand_tone",
      message: nl ? "Tone of voice is nog onbekend." : "Tone of voice is still unknown.",
      provenance: [profileProvenance(orgId, "tone")],
    });
  }

  const brandBrain = ctx.marketingUnderstanding?.brand;
  if (brandBrain?.valueProposition) {
    findings.push({
      id: "brand-value-prop",
      label: nl ? "Waardepropositie" : "Value proposition",
      value: brandBrain.valueProposition,
      confidence: "medium",
      provenance: [{ kind: "brand_brain", refId: `brand:${orgId}`, label: "Brand Brain" }],
    });
  }

  if (profile.brandPromises.value?.length) {
    findings.push({
      id: "brand-promises",
      label: nl ? "Brandbeloftes" : "Brand promises",
      value: profile.brandPromises.value.join(" · "),
      confidence: profile.brandPromises.customerConfirmed ? "high" : "medium",
      provenance: [profileProvenance(orgId, "brandPromises", profile.brandPromises.source)],
    });
  }

  if (!profile.tone.value && !profile.positioning.value && !brandBrain) {
    return {
      ...base,
      warnings: [
        {
          id: "warn-insufficient-brand",
          code: "insufficient_brand_context",
          message: nl
            ? "Ik heb nog onvoldoende merkinformatie — geen merkstem verzonnen."
            : "I still need brand information — no brand voice invented.",
          provenance: [profileProvenance(orgId, "brand")],
        },
      ],
    };
  }

  if (!profile.tone.value) {
    recommendations.push({
      id: "rec-brand-tone",
      label: nl ? "Bevestig tone of voice" : "Confirm tone of voice",
      priority: "high",
      provenance: [profileProvenance(orgId, "tone")],
    });
  }

  const memoryCandidates: BrainMemoryCandidate[] = [];
  if (profile.tone.customerConfirmed && profile.tone.value) {
    memoryCandidates.push({
      id: `mem-brand-tone-${orgId}`,
      organizationId: orgId,
      scope: "organization",
      label: "Confirmed tone of voice",
      value: profile.tone.value,
      confidence: "high",
      provenance: [profileProvenance(orgId, "tone", "customer_confirmed")],
      reviewState: "candidate",
      createdAt: generatedAt,
    });
  }

  return { ...base, findings, warnings, recommendations, memoryCandidates };
}
