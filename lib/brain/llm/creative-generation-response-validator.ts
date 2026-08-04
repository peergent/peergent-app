import type { BrainStructuredOutput } from "../evidence/structured-output";
import { BrainLlmBusinessValidationError, BrainLlmValidationError } from "./errors";
import {
  CREATIVE_REVIEW_STATUSES,
  normalizeCreativeChannelId,
  normalizeCreativeDeliverableType,
  normalizeCreativeGenerationLlmPayload,
  type CreativeChannelId,
} from "./creative-generation-contract";
import {
  formatBusinessValidationIssueForRepair,
  validateCreativeGenerationBusinessRules,
  type CreativeGenerationDeliverablePlan,
  type CreativeGenerationLlmPayload,
} from "./creative-generation-business-validation";

export type { CreativeGenerationDeliverablePlan, CreativeGenerationLlmPayload };

function validateStructure(payload: CreativeGenerationLlmPayload): string[] {
  const issues: string[] = [];

  if (!Array.isArray(payload.deliverables) || payload.deliverables.length === 0) {
    issues.push("deliverables array is required and must not be empty.");
  }
  if (!Array.isArray(payload.decisions)) issues.push("decisions array is required.");
  if (!Array.isArray(payload.recommendations)) issues.push("recommendations array is required.");
  if (!Array.isArray(payload.actionProposals)) issues.push("actionProposals array is required.");
  if (!Array.isArray(payload.warnings)) issues.push("warnings array is required.");

  for (const [index, deliverable] of (payload.deliverables ?? []).entries()) {
    const prefix = `deliverables[${index}]`;
    const deliverableType = normalizeCreativeDeliverableType(deliverable.deliverableType);
    const channel = normalizeCreativeChannelId(deliverable.channel);

    if (!deliverableType) {
      issues.push(`${prefix}.deliverableType requires a valid enum value.`);
    }
    if (!channel) {
      issues.push(`${prefix}.channel requires a valid enum value.`);
    }
    if (!deliverable.purpose?.trim()) issues.push(`${prefix}.purpose is required.`);
    if (!deliverable.targetAudience?.trim()) issues.push(`${prefix}.targetAudience is required.`);
    if (!deliverable.objective?.trim()) issues.push(`${prefix}.objective is required.`);
    if (!deliverable.messageAngle?.trim()) issues.push(`${prefix}.messageAngle is required.`);
    if (!deliverable.format?.trim()) issues.push(`${prefix}.format is required.`);
    if (
      !deliverable.reviewStatus?.trim() ||
      !(CREATIVE_REVIEW_STATUSES as readonly string[]).includes(deliverable.reviewStatus)
    ) {
      issues.push(`${prefix}.reviewStatus requires a valid enum value.`);
    }
    if (!Array.isArray(deliverable.dependencies)) {
      issues.push(`${prefix}.dependencies must be an array.`);
    }
    if (!Array.isArray(deliverable.assumptions)) {
      issues.push(`${prefix}.assumptions must be an array.`);
    }
  }

  return issues;
}

export function validateCreativeGenerationLlmPayload(
  parsed: unknown,
  input: { approvedChannels: readonly string[] }
): CreativeGenerationLlmPayload {
  const normalized = normalizeCreativeGenerationLlmPayload(parsed);
  if (!normalized || typeof normalized !== "object") {
    throw new BrainLlmValidationError("Creative generation LLM output must be a JSON object.");
  }

  const payload = normalized as CreativeGenerationLlmPayload;
  const structureIssues = validateStructure(payload);
  if (structureIssues.length > 0) {
    throw new BrainLlmValidationError("Creative generation LLM output failed schema validation.", structureIssues);
  }

  const businessIssues = validateCreativeGenerationBusinessRules(payload, input);
  if (businessIssues.length > 0) {
    throw new BrainLlmBusinessValidationError(
      "Creative generation LLM output failed business validation.",
      businessIssues,
      businessIssues.map(formatBusinessValidationIssueForRepair)
    );
  }

  return payload;
}

export function serializeDeliverablePlanForFinding(deliverable: CreativeGenerationDeliverablePlan): string {
  return JSON.stringify(deliverable);
}

export function deliverableTypeLabel(type: string, nl: boolean): string {
  const labels: Record<string, { en: string; nl: string }> = {
    linkedin_post: { en: "LinkedIn post plan", nl: "LinkedIn-postplan" },
    linkedin_carousel: { en: "LinkedIn carousel plan", nl: "LinkedIn-carouselplan" },
    acquisition_email: { en: "Email campaign plan", nl: "E-mailcampagneplan" },
    newsletter: { en: "Newsletter plan", nl: "Nieuwsbriefplan" },
    google_ads_campaign: { en: "Google Search ad group plan", nl: "Google Search-adgroepplan" },
    landing_page: { en: "Landing page section plan", nl: "Landingspagina-sectieplan" },
    blog: { en: "Blog article plan", nl: "Blogartikelplan" },
    instagram_post: { en: "Instagram post plan", nl: "Instagram-postplan" },
    campaign_concept: { en: "Campaign concept plan", nl: "Campagneconceptplan" },
  };
  return labels[type]?.[nl ? "nl" : "en"] ?? type.replace(/_/g, " ");
}

export function channelLabelForPlan(channel: string, nl: boolean): string {
  const labels: Record<string, { en: string; nl: string }> = {
    linkedin: { en: "LinkedIn", nl: "LinkedIn" },
    google_ads: { en: "Google Ads", nl: "Google Ads" },
    email: { en: "Email", nl: "E-mail" },
    newsletter: { en: "Newsletter", nl: "Nieuwsbrief" },
    landing_page: { en: "Landing page", nl: "Landingspagina" },
    website_landing: { en: "Landing page", nl: "Landingspagina" },
    blog: { en: "Blog", nl: "Blog" },
    instagram: { en: "Instagram", nl: "Instagram" },
    meta_ads: { en: "Meta Ads", nl: "Meta Ads" },
    seo: { en: "SEO", nl: "SEO" },
  };
  const key = channel.toLowerCase();
  if (key === "tbd") return nl ? "Nog te bepalen" : "To be determined";
  return labels[key]?.[nl ? "nl" : "en"] ?? channel;
}

export function mapCreativeGenerationPayloadToBrainOutput(
  payload: CreativeGenerationLlmPayload,
  input: { capabilityVersion: string; generatedAt: string; provenanceRef: string }
): BrainStructuredOutput {
  const prov = [{ kind: "assumption" as const, refId: input.provenanceRef, capturedAt: input.generatedAt }];

  return {
    capabilityId: "creative_generation",
    capabilityVersion: input.capabilityVersion,
    generatedAt: input.generatedAt,
    findings: (payload.deliverables ?? []).map((d, i) => ({
      id: d.id ?? `deliverable-${i + 1}`,
      label: deliverableTypeLabel(d.deliverableType ?? "campaign_concept", false),
      value: serializeDeliverablePlanForFinding(d),
      confidence: "medium" as const,
      provenance: prov,
    })),
    decisions: (payload.decisions ?? []).map((d, i) => ({
      id: d.id ?? `dec-deliverable-${i + 1}`,
      label: d.label ?? "Decision",
      rationale: d.rationale ?? "",
      confidence: (d.confidence as "low" | "medium" | "high") ?? "medium",
      provenance: prov,
    })),
    recommendations: (payload.recommendations ?? []).map((r, i) => ({
      id: r.id ?? `rec-deliverable-${i + 1}`,
      label: r.label ?? "Recommendation",
      priority: (r.priority as "low" | "medium" | "high") ?? "medium",
      provenance: prov,
    })),
    actionProposals: (payload.actionProposals ?? []).map((a, i) => ({
      id: a.id ?? `act-deliverable-${i + 1}`,
      actionType: a.actionType ?? "generate_content",
      label: a.label ?? "Generate content (planning)",
      requiresApproval: a.requiresApproval ?? true,
      provenance: prov,
    })),
    executionResults: [],
    warnings: (payload.warnings ?? []).map((w, i) => ({
      id: w.id ?? `warn-deliverable-${i + 1}`,
      code: w.code ?? "deliverable_note",
      message: w.message ?? "",
      provenance: prov,
    })),
    errors: [],
  };
}
